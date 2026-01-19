import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { ExamResult, Exam, Student } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface ExamResultFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  result?: ExamResult | null;
  examId: number; // Required: exam ID
  studentId?: number; // Optional: pre-select student
}

export const ExamResultFormModal = ({ isOpen, onClose, result, examId, studentId }: ExamResultFormModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    studentId: studentId || 0,
    speakingScore: '',
    listeningScore: '',
    readingWritingScore: '',
    comment: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch exam to get class info
  const { data: exam } = useQuery<Exam>({
    queryKey: ['exam', examId.toString()],
    queryFn: async () => {
      const response = await api.get(`/exams/${examId}`);
      return response.data;
    },
    enabled: isOpen && !!examId,
  });

  // Fetch students from the exam's class
  const { data: students } = useQuery<Student[]>({
    queryKey: ['students', 'class', exam?.classId],
    queryFn: async () => {
      if (!exam?.classId) return [];
      const response = await api.get(`/students/class/${exam.classId}`);
      return response.data;
    },
    enabled: isOpen && !!exam?.classId,
  });

  // Reset form when modal opens/closes or result changes
  useEffect(() => {
    if (isOpen) {
      if (result) {
        setFormData({
          studentId: result.studentId,
          speakingScore: result.speakingScore?.toString() || '',
          listeningScore: result.listeningScore?.toString() || '',
          readingWritingScore: result.readingWritingScore?.toString() || '',
          comment: result.comment || '',
        });
      } else {
        setFormData({
          studentId: studentId || 0,
          speakingScore: '',
          listeningScore: '',
          readingWritingScore: '',
          comment: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, result, studentId]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/exams/results', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-results', examId.toString()] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/exams/results/${result?.id}`, data);
      return response.data;
    },
    onSuccess: async () => {
      if (result?.id) {
        await queryClient.invalidateQueries({ queryKey: ['exam-results', examId.toString()] });
      }
      onClose();
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId || formData.studentId === 0) {
      newErrors.studentId = 'Vui lòng chọn học sinh';
    }

    if (formData.speakingScore && (isNaN(Number(formData.speakingScore)) || Number(formData.speakingScore) < 0 || Number(formData.speakingScore) > 10)) {
      newErrors.speakingScore = 'Điểm Speaking phải từ 0 đến 10';
    }

    if (formData.listeningScore && (isNaN(Number(formData.listeningScore)) || Number(formData.listeningScore) < 0 || Number(formData.listeningScore) > 10)) {
      newErrors.listeningScore = 'Điểm Listening phải từ 0 đến 10';
    }

    if (formData.readingWritingScore && (isNaN(Number(formData.readingWritingScore)) || Number(formData.readingWritingScore) < 0 || Number(formData.readingWritingScore) > 10)) {
      newErrors.readingWritingScore = 'Điểm Reading & Writing phải từ 0 đến 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      examId: examId,
      studentId: formData.studentId,
      speakingScore: formData.speakingScore ? Number(formData.speakingScore) : undefined,
      listeningScore: formData.listeningScore ? Number(formData.listeningScore) : undefined,
      readingWritingScore: formData.readingWritingScore ? Number(formData.readingWritingScore) : undefined,
      comment: formData.comment.trim() || undefined,
    };

    if (result) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={result ? 'Sửa kết quả kiểm tra' : 'Nhập điểm cho học sinh'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="w-full">
          <label className="block text-sm font-medium mb-2 text-text">
            Học sinh *
          </label>
          <select
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: parseInt(e.target.value) || 0 })}
            className={`input w-full min-h-[44px] touch-manipulation ${errors.studentId ? 'border-red-500' : ''}`}
            required
            disabled={isLoading || !students}
          >
            <option value={0}>Chọn học sinh</option>
            {students?.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
          {errors.studentId && (
            <p className="mt-1 text-sm text-red-500">{errors.studentId}</p>
          )}
          {!students && exam && (
            <p className="mt-1 text-sm text-text/60">Đang tải danh sách học sinh...</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Speaking (0-10)"
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={formData.speakingScore}
            onChange={(e) => setFormData({ ...formData, speakingScore: e.target.value })}
            error={errors.speakingScore}
            disabled={isLoading}
            placeholder="0.0"
          />

          <Input
            label="Listening (0-10)"
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={formData.listeningScore}
            onChange={(e) => setFormData({ ...formData, listeningScore: e.target.value })}
            error={errors.listeningScore}
            disabled={isLoading}
            placeholder="0.0"
          />

          <Input
            label="Reading & Writing (0-10)"
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={formData.readingWritingScore}
            onChange={(e) => setFormData({ ...formData, readingWritingScore: e.target.value })}
            error={errors.readingWritingScore}
            disabled={isLoading}
            placeholder="0.0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-text">
            Nhận xét
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            className="input w-full min-h-[100px] resize-y"
            disabled={isLoading}
            placeholder="Nhập nhận xét về kết quả kiểm tra..."
          />
        </div>

        {(createMutation.error || updateMutation.error) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            Có lỗi xảy ra. Vui lòng thử lại sau.
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Đang lưu...' : result ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

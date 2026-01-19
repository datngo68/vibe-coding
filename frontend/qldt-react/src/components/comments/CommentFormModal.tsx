import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { DailyComment, Lesson, Student } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface CommentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment?: DailyComment | null;
  lessonId?: number; // Optional: pre-select lesson
  studentId?: number; // Optional: pre-select student
}

export const CommentFormModal = ({ isOpen, onClose, comment, lessonId, studentId }: CommentFormModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    lessonId: lessonId || 0,
    studentId: studentId || 0,
    vocabularyScore: '',
    schoolExamScore: '',
    homeworkStatus: '',
    comment: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch students from the selected lesson's class
  const { data: lesson } = useQuery<Lesson>({
    queryKey: ['lesson', formData.lessonId],
    queryFn: async () => {
      const response = await api.get(`/lessons/${formData.lessonId}`);
      return response.data;
    },
    enabled: !!formData.lessonId && formData.lessonId > 0,
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ['students', 'class', lesson?.classId],
    queryFn: async () => {
      if (!lesson?.classId) return [];
      const response = await api.get(`/students/class/${lesson.classId}`);
      return response.data;
    },
    enabled: !!lesson?.classId,
  });

  // Reset form when modal opens/closes or comment changes
  useEffect(() => {
    if (isOpen) {
      if (comment) {
        setFormData({
          lessonId: comment.lessonId,
          studentId: comment.studentId,
          vocabularyScore: comment.vocabularyScore?.toString() || '',
          schoolExamScore: comment.schoolExamScore?.toString() || '',
          homeworkStatus: comment.homeworkStatus || '',
          comment: comment.comment || '',
        });
      } else {
        setFormData({
          lessonId: lessonId || 0,
          studentId: studentId || 0,
          vocabularyScore: '',
          schoolExamScore: '',
          homeworkStatus: '',
          comment: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, comment, lessonId, studentId]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/comments', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      if (data?.lessonId) {
        queryClient.invalidateQueries({ queryKey: ['comments', 'lesson', data.lessonId.toString()] });
      }
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/comments/${comment?.id}`, data);
      return response.data;
    },
    onSuccess: async (data) => {
      if (comment?.id) {
        queryClient.setQueryData(['comment', comment.id.toString()], data);
      }
      await queryClient.invalidateQueries({ queryKey: ['comments'] });
      if (data?.lessonId) {
        await queryClient.invalidateQueries({ queryKey: ['comments', 'lesson', data.lessonId.toString()] });
      }
      if (comment?.id) {
        await queryClient.refetchQueries({ queryKey: ['comment', comment.id.toString()] });
      }
      onClose();
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.lessonId || formData.lessonId === 0) {
      newErrors.lessonId = 'Vui lòng chọn buổi học';
    }

    if (!formData.studentId || formData.studentId === 0) {
      newErrors.studentId = 'Vui lòng chọn học sinh';
    }

    if (formData.vocabularyScore && (isNaN(Number(formData.vocabularyScore)) || Number(formData.vocabularyScore) < 0 || Number(formData.vocabularyScore) > 10)) {
      newErrors.vocabularyScore = 'Điểm từ vựng phải từ 0 đến 10';
    }

    if (formData.schoolExamScore && (isNaN(Number(formData.schoolExamScore)) || Number(formData.schoolExamScore) < 0 || Number(formData.schoolExamScore) > 10)) {
      newErrors.schoolExamScore = 'Điểm thi cuối kỳ phải từ 0 đến 10';
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
      lessonId: formData.lessonId,
      studentId: formData.studentId,
      vocabularyScore: formData.vocabularyScore ? Number(formData.vocabularyScore) : undefined,
      schoolExamScore: formData.schoolExamScore ? Number(formData.schoolExamScore) : undefined,
      homeworkStatus: formData.homeworkStatus.trim() || undefined,
      comment: formData.comment.trim() || undefined,
    };

    if (comment) {
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
      title={comment ? 'Sửa nhận xét' : 'Tạo nhận xét mới'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="w-full">
          <label className="block text-sm font-medium mb-2 text-text">
            Buổi học *
          </label>
          <input
            type="number"
            value={formData.lessonId}
            onChange={(e) => {
              const newLessonId = parseInt(e.target.value) || 0;
              setFormData({ ...formData, lessonId: newLessonId, studentId: 0 });
            }}
            className={`input w-full min-h-[44px] touch-manipulation ${errors.lessonId ? 'border-red-500' : ''}`}
            required
            disabled={isLoading || !!lessonId}
            placeholder="Nhập ID buổi học"
          />
          {errors.lessonId && (
            <p className="mt-1 text-sm text-red-500">{errors.lessonId}</p>
          )}
          {lesson && (
            <p className="mt-1 text-sm text-text/60">
              {lesson.className} - Buổi {lesson.lessonNumber} ({new Date(lesson.date).toLocaleDateString('vi-VN')})
            </p>
          )}
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium mb-2 text-text">
            Học sinh *
          </label>
          <select
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: parseInt(e.target.value) || 0 })}
            className={`input w-full min-h-[44px] touch-manipulation ${errors.studentId ? 'border-red-500' : ''}`}
            required
            disabled={isLoading || !formData.lessonId || !students}
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
          {formData.lessonId && !lesson && (
            <p className="mt-1 text-sm text-text/60">Đang tải danh sách học sinh...</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Điểm từ vựng (0-10)"
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={formData.vocabularyScore}
            onChange={(e) => setFormData({ ...formData, vocabularyScore: e.target.value })}
            error={errors.vocabularyScore}
            disabled={isLoading}
            placeholder="0.0"
          />

          <Input
            label="Điểm thi cuối kỳ (0-10)"
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={formData.schoolExamScore}
            onChange={(e) => setFormData({ ...formData, schoolExamScore: e.target.value })}
            error={errors.schoolExamScore}
            disabled={isLoading}
            placeholder="0.0"
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium mb-2 text-text">
            Trạng thái bài tập về nhà
          </label>
          <select
            value={formData.homeworkStatus}
            onChange={(e) => setFormData({ ...formData, homeworkStatus: e.target.value })}
            className="input w-full min-h-[44px] touch-manipulation"
            disabled={isLoading}
          >
            <option value="">-- Chọn trạng thái --</option>
            <option value="Đủ BT">Đủ BT</option>
            <option value="Thiếu BT">Thiếu BT</option>
            <option value="Không làm BT">Không làm BT</option>
            <option value="Làm tốt">Làm tốt</option>
            <option value="Cần cải thiện">Cần cải thiện</option>
          </select>
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
            placeholder="Nhập nhận xét về học sinh..."
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
            {isLoading ? 'Đang lưu...' : comment ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

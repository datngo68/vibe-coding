import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { Exam, Class, Teacher } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface ExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam?: Exam | null;
  classId?: number; // Optional: pre-select class
}

export const ExamFormModal = ({ isOpen, onClose, exam, classId }: ExamFormModalProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    classId: classId || 0,
    teacherId: 0,
    date: new Date(),
    examType: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes');
      return response.data;
    },
    enabled: isOpen,
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers');
      return response.data;
    },
    enabled: isOpen,
  });

  // Filter teachers by selected class's branch
  const filteredTeachers = teachers?.filter(teacher => {
    const selectedClass = classes?.find(c => c.id === formData.classId);
    return selectedClass && teacher.branchId === selectedClass.branchId;
  });

  // Reset form when modal opens/closes or exam changes
  useEffect(() => {
    if (isOpen) {
      if (exam) {
        setFormData({
          classId: exam.classId,
          teacherId: exam.teacherId,
          date: new Date(exam.date),
          examType: exam.examType || '',
        });
      } else {
        // Auto-assign teacher if user is Teacher
        const autoTeacherId = user?.role === 'Teacher' && user?.teacherId ? user.teacherId : 0;
        setFormData({
          classId: classId || (classes && classes.length > 0 ? classes[0].id : 0),
          teacherId: autoTeacherId,
          date: new Date(),
          examType: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, exam, classId, classes, user]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/exams', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      if (data?.classId) {
        const classIdStr = data.classId.toString();
        queryClient.invalidateQueries({ queryKey: ['exams', 'class', classIdStr] });
        queryClient.invalidateQueries({ queryKey: ['exams', 'class', data.classId] });
        // Invalidate class detail page to refresh exams list
        queryClient.invalidateQueries({ queryKey: ['class'] });
      }
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/exams/${exam?.id}`, data);
      return response.data;
    },
    onSuccess: async (data) => {
      if (exam?.id) {
        queryClient.setQueryData(['exam', exam.id.toString()], data);
      }
      await queryClient.invalidateQueries({ queryKey: ['exams'] });
      if (data?.classId) {
        await queryClient.invalidateQueries({ queryKey: ['exams', 'class', data.classId.toString()] });
      }
      if (exam?.id) {
        await queryClient.refetchQueries({ queryKey: ['exam', exam.id.toString()] });
      }
      onClose();
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.classId || formData.classId === 0) {
      newErrors.classId = 'Vui lòng chọn lớp học';
    }

    // Skip teacher validation if user is Teacher (auto-assigned)
    if (!formData.teacherId || formData.teacherId === 0) {
      if (user?.role !== 'Teacher' || exam) {
        newErrors.teacherId = 'Vui lòng chọn giáo viên';
      }
    }

    if (!formData.examType.trim()) {
      newErrors.examType = 'Loại bài kiểm tra là bắt buộc';
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
      classId: formData.classId,
      teacherId: formData.teacherId,
      date: format(formData.date, 'yyyy-MM-dd'),
      examType: formData.examType.trim(),
    };

    if (exam) {
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
      title={exam ? 'Sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="w-full">
          <label className="block text-sm font-medium mb-2 text-text">
            Lớp học *
          </label>
          <select
            value={formData.classId}
            onChange={(e) => {
              const newClassId = parseInt(e.target.value);
              // Auto-assign teacher if user is Teacher when changing class
              const autoTeacherId = user?.role === 'Teacher' && user?.teacherId ? user.teacherId : 0;
              setFormData({ ...formData, classId: newClassId, teacherId: autoTeacherId });
            }}
            className={`input w-full min-h-[44px] touch-manipulation ${errors.classId ? 'border-red-500' : ''}`}
            required
            disabled={isLoading || !!classId}
          >
            <option value={0}>Chọn lớp học</option>
            {classes?.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          {errors.classId && (
            <p className="mt-1 text-sm text-red-500">{errors.classId}</p>
          )}
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium mb-2 text-text">
            Giáo viên *
          </label>
          <select
            value={formData.teacherId}
            onChange={(e) => setFormData({ ...formData, teacherId: parseInt(e.target.value) })}
            className={`input w-full min-h-[44px] touch-manipulation ${errors.teacherId ? 'border-red-500' : ''}`}
            required
            disabled={isLoading || !formData.classId || (user?.role === 'Teacher' && !exam)}
          >
            <option value={0}>Chọn giáo viên</option>
            {filteredTeachers?.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
          {user?.role === 'Teacher' && !exam && (
            <p className="mt-1 text-xs text-text/60">Giáo viên sẽ tự động được gán cho bạn</p>
          )}
          {errors.teacherId && (
            <p className="mt-1 text-sm text-red-500">{errors.teacherId}</p>
          )}
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium mb-2 text-text">
            Ngày kiểm tra *
          </label>
          <DatePicker
            selected={formData.date}
            onChange={(date: Date | null) => date && setFormData({ ...formData, date })}
            dateFormat="dd/MM/yyyy"
            className={`input w-full min-h-[44px] touch-manipulation`}
            disabled={isLoading}
            required
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium mb-2 text-text">
            Loại bài kiểm tra *
          </label>
          <select
            value={formData.examType}
            onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
            className={`input w-full min-h-[44px] touch-manipulation ${errors.examType ? 'border-red-500' : ''}`}
            required
            disabled={isLoading}
          >
            <option value="">-- Chọn loại bài kiểm tra --</option>
            <option value="Giữa kỳ">Giữa kỳ</option>
            <option value="Cuối kỳ">Cuối kỳ</option>
            <option value="Kiểm tra thường xuyên">Kiểm tra thường xuyên</option>
            <option value="Kiểm tra định kỳ">Kiểm tra định kỳ</option>
            <option value="Thi thử">Thi thử</option>
          </select>
          {errors.examType && (
            <p className="mt-1 text-sm text-red-500">{errors.examType}</p>
          )}
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
            {isLoading ? 'Đang lưu...' : exam ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

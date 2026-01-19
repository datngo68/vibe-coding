import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { Schedule, Class } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface ScheduleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedule?: Schedule | null;
  classId?: number; // Optional: pre-select class
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Chủ nhật' },
  { value: 1, label: 'Thứ hai' },
  { value: 2, label: 'Thứ ba' },
  { value: 3, label: 'Thứ tư' },
  { value: 4, label: 'Thứ năm' },
  { value: 5, label: 'Thứ sáu' },
  { value: 6, label: 'Thứ bảy' },
];

export const ScheduleFormModal = ({ isOpen, onClose, schedule, classId }: ScheduleFormModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    classId: classId || 0,
    dayOfWeek: 1, // Monday by default
    startTime: '08:00',
    endTime: '09:00',
    room: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch classes for dropdown
  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes');
      return response.data;
    },
    enabled: isOpen,
  });

  // Reset form when modal opens/closes or schedule changes
  useEffect(() => {
    if (isOpen) {
      if (schedule) {
        // Format time from "HH:mm:ss" or "HH:mm" to "HH:mm"
        const formatTime = (time: string) => {
          if (!time) return '08:00';
          const parts = time.split(':');
          return `${parts[0]}:${parts[1]}`;
        };

        setFormData({
          classId: schedule.classId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: formatTime(schedule.startTime),
          endTime: formatTime(schedule.endTime),
          room: schedule.room || '',
        });
      } else {
        setFormData({
          classId: classId || (classes && classes.length > 0 ? classes[0].id : 0),
          dayOfWeek: 1,
          startTime: '08:00',
          endTime: '09:00',
          room: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, schedule, classId, classes]);

  const createMutation = useMutation({
    mutationFn: async (data: {
      classId: number;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      room?: string;
    }) => {
      const response = await api.post('/schedules', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedules', 'class'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      classId: number;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      room?: string;
    }) => {
      const response = await api.put(`/schedules/${schedule?.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['schedules', 'class'] });
      if (schedule?.id) {
        queryClient.invalidateQueries({ queryKey: ['schedule', schedule.id] });
      }
      onClose();
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.classId || formData.classId === 0) {
      newErrors.classId = 'Vui lòng chọn lớp học';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Vui lòng nhập giờ bắt đầu';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Vui lòng nhập giờ kết thúc';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      if (end <= start) {
        newErrors.endTime = 'Giờ kết thúc phải sau giờ bắt đầu';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      classId: formData.classId,
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      room: formData.room || undefined,
    };

    if (schedule) {
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
      title={schedule ? 'Sửa lịch học' : 'Tạo lịch học mới'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Class Selection */}
        <div className="w-full">
          <label className="block text-sm font-medium mb-1.5 text-text">
            Lớp học *
          </label>
          <select
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: Number(e.target.value) })}
            className={`input w-full min-h-[44px] touch-manipulation ${errors.classId ? 'border-red-500' : ''}`}
            required
            disabled={isLoading || !!classId}
          >
            <option value={0}>-- Chọn lớp học --</option>
            {classes?.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - {cls.branchName}
              </option>
            ))}
          </select>
          {errors.classId && (
            <p className="mt-1 text-xs text-red-500">{errors.classId}</p>
          )}
        </div>

        {/* Day of Week */}
        <div className="w-full">
          <label className="block text-sm font-medium mb-1.5 text-text">
            Ngày trong tuần *
          </label>
          <select
            value={formData.dayOfWeek}
            onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
            className="input w-full min-h-[44px] touch-manipulation"
            required
            disabled={isLoading}
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time Range - 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="w-full">
            <label className="block text-sm font-medium mb-1.5 text-text">
              Giờ bắt đầu *
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className={`input w-full min-h-[44px] touch-manipulation ${errors.startTime ? 'border-red-500' : ''}`}
              required
              disabled={isLoading}
            />
            {errors.startTime && (
              <p className="mt-1 text-xs text-red-500">{errors.startTime}</p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-1.5 text-text">
              Giờ kết thúc *
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className={`input w-full min-h-[44px] touch-manipulation ${errors.endTime ? 'border-red-500' : ''}`}
              required
              disabled={isLoading}
            />
            {errors.endTime && (
              <p className="mt-1 text-xs text-red-500">{errors.endTime}</p>
            )}
          </div>
        </div>

        {/* Room (Optional) */}
        <div className="w-full">
          <label className="block text-sm font-medium mb-1.5 text-text">
            Phòng học (tùy chọn)
          </label>
          <input
            type="text"
            value={formData.room}
            onChange={(e) => setFormData({ ...formData, room: e.target.value })}
            className="input w-full min-h-[44px] touch-manipulation"
            placeholder="Ví dụ: Phòng 101"
            disabled={isLoading}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-text/10">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="min-h-[44px] touch-manipulation"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="min-h-[44px] touch-manipulation"
          >
            {isLoading ? 'Đang lưu...' : schedule ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

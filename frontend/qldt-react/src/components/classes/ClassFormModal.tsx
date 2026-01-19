import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { Class, Branch } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem?: Class | null;
  branchId?: number; // Optional: pre-select branch
  classId?: string | number; // ID từ URL params (có thể là string)
}

export const ClassFormModal = ({ isOpen, onClose, classItem, branchId, classId }: ClassFormModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    branchId: branchId || 0,
    name: '',
    level: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch branches for dropdown
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await api.get('/branches');
      return response.data;
    },
    enabled: isOpen,
  });

  // Reset form when modal opens/closes or class changes
  useEffect(() => {
    if (isOpen) {
      if (classItem) {
        setFormData({
          branchId: classItem.branchId,
          name: classItem.name || '',
          level: classItem.level || '',
        });
      } else {
        setFormData({
          branchId: branchId || (branches && branches.length > 0 ? branches[0].id : 0),
          name: '',
          level: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, classItem, branchId, branches]);

  const createMutation = useMutation({
    mutationFn: async (data: { branchId: number; name: string; level?: string }) => {
      const response = await api.post('/classes', data);
      return { ...response.data, branchId: data.branchId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      // Invalidate classes by branch để refresh danh sách trong BranchDetailPage
      if (data?.branchId) {
        queryClient.invalidateQueries({ queryKey: ['classes', 'branch', data.branchId.toString()] });
        queryClient.invalidateQueries({ queryKey: ['classes', 'branch', data.branchId] });
      }
      // Invalidate tất cả queries có prefix ['classes', 'branch'] để đảm bảo refresh
      queryClient.invalidateQueries({ queryKey: ['classes', 'branch'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { branchId: number; name: string; level?: string }) => {
      const response = await api.put(`/classes/${classItem?.id}`, data);
      return response.data;
    },
    onSuccess: async (data) => {
      // Lấy ID từ classItem hoặc classId prop
      const id = classId || classItem?.id;
      
      if (id) {
        const idString = id.toString();
        queryClient.setQueryData(['class', idString], data);
      }
      
      await queryClient.invalidateQueries({ queryKey: ['classes'] });
      await queryClient.invalidateQueries({ queryKey: ['class'] });
      if (id) {
        await queryClient.refetchQueries({ queryKey: ['classes'] });
        await queryClient.refetchQueries({ queryKey: ['class', id.toString()] });
      }
      
      onClose();
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên lớp học là bắt buộc';
    }

    if (!formData.branchId || formData.branchId === 0) {
      newErrors.branchId = 'Vui lòng chọn chi nhánh';
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
      branchId: formData.branchId,
      name: formData.name.trim(),
      level: formData.level.trim() || undefined,
    };

    if (classItem) {
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
      title={classItem ? 'Sửa lớp học' : 'Tạo lớp học mới'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="w-full">
          <label className="block text-sm font-medium mb-2 text-text">
            Chi nhánh *
          </label>
          <select
            value={formData.branchId}
            onChange={(e) => setFormData({ ...formData, branchId: parseInt(e.target.value) })}
            className={`input w-full min-h-[44px] touch-manipulation ${errors.branchId ? 'border-red-500' : ''}`}
            required
            disabled={isLoading || !!branchId} // Disable nếu đã có branchId từ props
          >
            <option value={0}>Chọn chi nhánh</option>
            {branches?.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          {errors.branchId && (
            <p className="mt-1 text-sm text-red-500">{errors.branchId}</p>
          )}
        </div>

        <Input
          label="Tên lớp học *"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
          autoFocus
          disabled={isLoading}
        />

        <Input
          label="Level"
          type="text"
          value={formData.level}
          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
          error={errors.level}
          placeholder="Ví dụ: Starter, Elementary, Intermediate..."
          disabled={isLoading}
        />

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
            {isLoading ? 'Đang lưu...' : classItem ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

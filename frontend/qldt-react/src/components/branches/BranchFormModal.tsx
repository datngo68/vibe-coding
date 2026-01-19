import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { Branch } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../hooks/useAuth';

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch?: Branch | null;
  branchId?: string | number; // ID từ URL params (có thể là string)
}

export const BranchFormModal = ({ isOpen, onClose, branch, branchId }: BranchFormModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or branch changes
  useEffect(() => {
    if (isOpen) {
      if (branch) {
        setFormData({
          name: branch.name || '',
          address: branch.address || '',
          phone: branch.phone || '',
        });
      } else {
        setFormData({
          name: '',
          address: '',
          phone: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, branch]);

  const createMutation = useMutation({
    mutationFn: async (data: { ownerId: number; name: string; address?: string; phone?: string }) => {
      const response = await api.post('/branches', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { ownerId: number; name: string; address?: string; phone?: string }) => {
      const response = await api.put(`/branches/${branch?.id}`, data);
      return response.data;
    },
    onSuccess: async (data) => {
      // Lấy ID từ branch hoặc branchId prop (ưu tiên branchId từ URL)
      const id = branchId || branch?.id;
      
      if (id) {
        // Set data trực tiếp vào cache với tất cả các format có thể của query key
        const idString = id.toString();
        const idNumber = typeof id === 'number' ? id : parseInt(idString);
        
        queryClient.setQueryData(['branch', idString], data);
        queryClient.setQueryData(['branch', idNumber], data);
        if (!isNaN(idNumber)) {
          queryClient.setQueryData(['branch', idNumber], data);
        }
      }
      
      // Invalidate tất cả các queries liên quan
      await queryClient.invalidateQueries({ queryKey: ['branches'] });
      if (id) {
        await queryClient.invalidateQueries({ queryKey: ['branch', id.toString()] });
        await queryClient.invalidateQueries({ queryKey: ['branch'] });
      }
      
      // Refetch để đảm bảo data được cập nhật
      await queryClient.refetchQueries({ queryKey: ['branches'] });
      if (id) {
        await queryClient.refetchQueries({ queryKey: ['branch', id.toString()] });
      }
      
      onClose();
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên chi nhánh là bắt buộc';
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
      name: formData.name.trim(),
      address: formData.address.trim() || undefined,
      phone: formData.phone.trim() || undefined,
    };

    if (branch) {
      // Update existing branch - include ownerId to prevent it from being reset
      updateMutation.mutate({
        ownerId: branch.ownerId,
        ...submitData,
      });
    } else {
      // Create new branch
      if (!user) {
        setErrors({ name: 'Vui lòng đăng nhập để tạo chi nhánh' });
        return;
      }
      // Note: OwnerId should come from user context or be set to 1 for now
      // In a real app, you'd get this from the authenticated user
      createMutation.mutate({
        ownerId: 1, // TODO: Get from user context
        ...submitData,
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={branch ? 'Sửa chi nhánh' : 'Tạo chi nhánh mới'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tên chi nhánh *"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
          autoFocus
          disabled={isLoading}
        />

        <Input
          label="Địa chỉ"
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          error={errors.address}
          disabled={isLoading}
        />

        <Input
          label="Điện thoại"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={errors.phone}
          disabled={isLoading}
        />

        {(createMutation.error || updateMutation.error) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {createMutation.error || updateMutation.error
              ? 'Có lỗi xảy ra. Vui lòng thử lại sau.'
              : ''}
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
            {isLoading ? 'Đang lưu...' : branch ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

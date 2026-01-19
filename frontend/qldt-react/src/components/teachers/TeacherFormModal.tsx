import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { Teacher, Branch } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface TeacherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
  branchId?: number; // Optional: pre-select branch
  teacherId?: string | number; // ID từ URL params (có thể là string)
}

export const TeacherFormModal = ({ isOpen, onClose, teacher, branchId, teacherId }: TeacherFormModalProps) => {
  const queryClient = useQueryClient();
  const [createAccount, setCreateAccount] = useState(false);
  const [formData, setFormData] = useState({
    branchId: branchId || 0,
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
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

  // Reset form when modal opens/closes or teacher changes
  useEffect(() => {
    if (isOpen) {
      if (teacher) {
        setFormData({
          branchId: teacher.branchId,
          name: teacher.name || '',
          email: teacher.email || '',
          phone: teacher.phone || '',
          username: '',
          password: '',
        });
        setCreateAccount(false); // Không cho phép tạo tài khoản khi edit
      } else {
        setFormData({
          branchId: branchId || (branches && branches.length > 0 ? branches[0].id : 0),
          name: '',
          email: '',
          phone: '',
          username: '',
          password: '',
        });
        setCreateAccount(false); // Reset checkbox
      }
      setErrors({});
    }
  }, [isOpen, teacher, branchId, branches]);

  const createMutation = useMutation({
    mutationFn: async (data: { branchId: number; name: string; email: string; phone?: string; username?: string; password?: string }) => {
      // Nếu có createAccount và có username/password, dùng endpoint with-account
      if (createAccount && data.username && data.password) {
        const response = await api.post('/teachers/with-account', {
          branchId: data.branchId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          username: data.username,
          password: data.password,
        });
        return response.data;
      } else {
        const response = await api.post('/teachers', {
          branchId: data.branchId,
          name: data.name,
          email: data.email,
          phone: data.phone,
        });
        return response.data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      // Invalidate teachers by branch để refresh danh sách trong BranchDetailPage
      if (data?.branchId) {
        queryClient.invalidateQueries({ queryKey: ['teachers', 'branch', data.branchId.toString()] });
        queryClient.invalidateQueries({ queryKey: ['teachers', 'branch', data.branchId] });
      }
      queryClient.invalidateQueries({ queryKey: ['teachers', 'branch'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { branchId: number; name: string; email: string; phone?: string }) => {
      const response = await api.put(`/teachers/${teacher?.id}`, data);
      return response.data;
    },
    onSuccess: async (data) => {
      // Lấy ID từ teacher hoặc teacherId prop
      const id = teacherId || teacher?.id;

      if (id) {
        const idString = id.toString();
        queryClient.setQueryData(['teacher', idString], data);
      }

      await queryClient.invalidateQueries({ queryKey: ['teachers'] });
      await queryClient.invalidateQueries({ queryKey: ['teacher'] });
      if (data?.branchId) {
        await queryClient.invalidateQueries({ queryKey: ['teachers', 'branch', data.branchId.toString()] });
        await queryClient.invalidateQueries({ queryKey: ['teachers', 'branch', data.branchId] });
      }
      if (id) {
        await queryClient.refetchQueries({ queryKey: ['teachers'] });
        await queryClient.refetchQueries({ queryKey: ['teacher', id.toString()] });
      }

      onClose();
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên giáo viên là bắt buộc';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.branchId || formData.branchId === 0) {
      newErrors.branchId = 'Vui lòng chọn chi nhánh';
    }

    // Validate account fields nếu checkbox được chọn
    if (createAccount && !teacher) {
      if (!formData.username.trim()) {
        newErrors.username = 'Tên đăng nhập là bắt buộc';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
      }

      if (!formData.password.trim()) {
        newErrors.password = 'Mật khẩu là bắt buộc';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
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
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      username: createAccount ? formData.username.trim() : undefined,
      password: createAccount ? formData.password : undefined,
    };

    if (teacher) {
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
      title={teacher ? 'Sửa giáo viên' : 'Thêm giáo viên mới'}
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
          label="Tên giáo viên *"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
          autoFocus
          disabled={isLoading}
        />

        <Input
          label="Email *"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          required
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

        {/* Tạo tài khoản đăng nhập - chỉ hiển thị khi tạo mới */}
        {!teacher && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="createAccount"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                disabled={isLoading}
              />
              <label htmlFor="createAccount" className="ml-2 text-sm font-medium text-text cursor-pointer">
                Tạo tài khoản đăng nhập cho giáo viên
              </label>
            </div>

            {createAccount && (
              <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                <Input
                  label="Tên đăng nhập *"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  error={errors.username}
                  required
                  disabled={isLoading}
                  placeholder="username"
                />

                <Input
                  label="Mật khẩu *"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  required
                  disabled={isLoading}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>
            )}
          </div>
        )}

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
            {isLoading ? 'Đang lưu...' : teacher ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

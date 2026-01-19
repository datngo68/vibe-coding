import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { User, Branch, Teacher, Class } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

export const UserFormModal = ({ isOpen, onClose, user }: UserFormModalProps) => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isTeacher = currentUser?.role === 'Teacher';

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: (isTeacher ? 'Parent' : 'Teacher') as 'Owner' | 'BranchManager' | 'Teacher' | 'Parent',
    branchId: 0,
    teacherId: 0,
    classIds: [] as number[],
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await api.get('/branches');
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
    enabled: isOpen && (formData.role === 'Teacher' || formData.role === 'Parent'),
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes', formData.branchId],
    queryFn: async () => {
      if (!formData.branchId) return [];
      const response = await api.get(`/classes?branchId=${formData.branchId}`);
      return response.data;
    },
    enabled: isOpen && formData.role === 'Teacher' && formData.branchId > 0,
  });

  useEffect(() => {
    if (!isOpen) return;

    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // Don't pre-fill password
        fullName: user.fullName || '',
        phone: user.phone || '',
        role: user.role,
        branchId: user.branchId || 0,
        teacherId: user.teacherId || 0,
        classIds: [], // TODO: Load assigned classes if needed
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: isTeacher ? 'Parent' : 'Teacher',
        branchId: branches && branches.length > 0 ? branches[0].id : 0,
        teacherId: 0,
        classIds: [],
        isActive: true,
      });
    }
    setErrors({});
  }, [isOpen, user, branches, isTeacher]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/users', {
        username: data.username,
        email: data.email.trim() || undefined,
        password: data.password,
        fullName: data.fullName.trim() || undefined,
        phone: data.phone.trim() || undefined,
        role: data.role,
        branchId: data.branchId || undefined,
        teacherId: data.teacherId || undefined,
        classIds: data.role === 'Teacher' && data.classIds.length > 0 ? data.classIds : undefined,
        isActive: data.isActive,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Có lỗi xảy ra';
      if (message.includes('Username')) {
        setErrors({ username: message });
      } else if (message.includes('Email')) {
        setErrors({ email: message });
      } else {
        alert(message);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.put(`/users/${user?.id}`, {
        username: data.username,
        email: data.email.trim() || undefined,
        password: data.password || undefined,
        fullName: data.fullName.trim() || undefined,
        phone: data.phone.trim() || undefined,
        role: data.role,
        branchId: data.branchId || undefined,
        teacherId: data.teacherId || undefined,
        classIds: data.role === 'Teacher' && data.classIds.length > 0 ? data.classIds : undefined,
        isActive: data.isActive,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Có lỗi xảy ra';
      if (message.includes('Username')) {
        setErrors({ username: message });
      } else if (message.includes('Email')) {
        setErrors({ email: message });
      } else {
        alert(message);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.username.trim()) {
      setErrors({ username: 'Tên đăng nhập không được để trống' });
      return;
    }

    // Email is optional, but if provided, must be valid
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors({ email: 'Email không hợp lệ' });
      return;
    }

    if (!user && !formData.password.trim()) {
      setErrors({ password: 'Mật khẩu không được để trống' });
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setErrors({ password: 'Mật khẩu phải có ít nhất 6 ký tự' });
      return;
    }

    if (user) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredTeachers = teachers?.filter((t) =>
    !formData.branchId || t.branchId === formData.branchId
  ) || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Sửa người dùng' : 'Tạo người dùng mới'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-text font-body mb-2">
            Tên đăng nhập *
          </label>
          <Input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => {
              setFormData({ ...formData, username: e.target.value });
              if (errors.username) {
                const newErrors = { ...errors };
                delete newErrors.username;
                setErrors(newErrors);
              }
            }}
            className={errors.username ? 'border-red-500' : ''}
            required
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text font-body mb-2">
            Email (tùy chọn)
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) {
                const newErrors = { ...errors };
                delete newErrors.email;
                setErrors(newErrors);
              }
            }}
            className={errors.email ? 'border-red-500' : ''}
            placeholder="Nhập email (không bắt buộc)"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
          <p className="mt-1 text-xs text-text/50 font-body">
            Email là tùy chọn, có thể để trống
          </p>
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-text font-body mb-2">
            Họ tên (tùy chọn)
          </label>
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Nhập họ tên (không bắt buộc)"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-text font-body mb-2">
            Số điện thoại (tùy chọn)
          </label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Nhập số điện thoại (không bắt buộc)"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text font-body mb-2">
            {user ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu *'}
          </label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) {
                const newErrors = { ...errors };
                delete newErrors.password;
                setErrors(newErrors);
              }
            }}
            className={errors.password ? 'border-red-500' : ''}
            required={!user}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
          {!user && (
            <p className="mt-1 text-xs text-text/50 font-body">
              Mật khẩu phải có ít nhất 6 ký tự
            </p>
          )}
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-text font-body mb-2">
            Vai trò *
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => {
              setFormData({
                ...formData,
                role: e.target.value as typeof formData.role,
                teacherId: 0, // Reset teacherId when role changes
              });
            }}
            className="input w-full min-h-[44px]"
            required
            disabled={isTeacher}
          >
            {!isTeacher && (
              <>
                <option value="Owner">Chủ trung tâm</option>
                <option value="BranchManager">Quản lý chi nhánh</option>
                <option value="Teacher">Giáo viên</option>
              </>
            )}
            <option value="Parent">Phụ huynh</option>
          </select>
          {isTeacher && (
            <p className="mt-1 text-xs text-text/50 font-body">
              Giáo viên chỉ có thể tạo tài khoản phụ huynh
            </p>
          )}
        </div>

        {(formData.role === 'BranchManager' || formData.role === 'Teacher') && (
          <div>
            <label htmlFor="branchId" className="block text-sm font-medium text-text font-body mb-2">
              Chi nhánh *
            </label>
            <select
              id="branchId"
              value={formData.branchId}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  branchId: parseInt(e.target.value),
                  teacherId: 0, // Reset teacherId when branch changes
                });
              }}
              className="input w-full min-h-[44px]"
              required
            >
              <option value="0">Chọn chi nhánh</option>
              {branches?.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {formData.role === 'Teacher' && formData.branchId > 0 && (
          <div>
            <label htmlFor="teacherId" className="block text-sm font-medium text-text font-body mb-2">
              Giáo viên (tùy chọn)
            </label>
            <select
              id="teacherId"
              value={formData.teacherId}
              onChange={(e) => {
                setFormData({ ...formData, teacherId: parseInt(e.target.value), classIds: [] });
              }}
              className="input w-full min-h-[44px]"
            >
              <option value="0">Tạo giáo viên mới</option>
              {filteredTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-text/50 font-body">
              Chọn giáo viên đã có hoặc để "Tạo giáo viên mới" để tự động tạo giáo viên mới
            </p>
          </div>
        )}

        {formData.role === 'Teacher' && formData.branchId > 0 && (
          <div>
            <label className="block text-sm font-medium text-text font-body mb-2">
              Gán vào lớp học (tùy chọn)
            </label>
            <div className="max-h-48 overflow-y-auto border border-text/20 rounded-lg p-3 space-y-2">
              {classes && classes.length > 0 ? (
                classes.map((cls) => (
                  <label
                    key={cls.id}
                    className="flex items-center gap-2 p-2 hover:bg-background rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.classIds.includes(cls.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            classIds: [...formData.classIds, cls.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            classIds: formData.classIds.filter((id) => id !== cls.id),
                          });
                        }
                      }}
                      className="w-4 h-4 rounded border-text/20 text-primary focus:ring-primary cursor-pointer"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    />
                    <span className="text-sm text-text font-body">{cls.name}</span>
                    {cls.level && (
                      <span className="text-xs text-text/60">({cls.level})</span>
                    )}
                  </label>
                ))
              ) : (
                <p className="text-xs text-text/60 text-center py-2">
                  Chưa có lớp học nào trong chi nhánh này
                </p>
              )}
            </div>
            <p className="mt-1 text-xs text-text/50 font-body">
              Chọn các lớp học để gán giáo viên vào (có thể chọn nhiều lớp)
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Đang lưu...'
              : user
                ? 'Cập nhật'
                : 'Tạo mới'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Hủy
          </Button>
        </div>
      </form>
    </Modal>
  );
};

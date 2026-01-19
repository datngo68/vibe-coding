import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { Student, Class } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
  classId?: number; // Optional: pre-select class
  studentId?: string | number; // ID từ URL params (có thể là string)
}

export const StudentFormModal = ({ isOpen, onClose, student, classId, studentId }: StudentFormModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    classId: classId || 0,
    name: '',
    dateOfBirth: '',
    parentUserId: 0, // ID của User phụ huynh (nếu có)
    parentName: '',
    parentPhone: '',
    parentEmail: '',
  });
  const [useParentAccount, setUseParentAccount] = useState(false);
  const [createNewParent, setCreateNewParent] = useState(false);
  const [newParentData, setNewParentData] = useState({
    username: '',
    email: '',
    password: '',
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

  // Fetch parents (users with Parent role)
  const { data: parents } = useQuery<User[]>({
    queryKey: ['users', 'parents'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.filter((u: User) => u.role === 'Parent');
    },
    enabled: isOpen && useParentAccount,
  });

  // Fetch assigned parent for existing student
  const { data: assignedParent } = useQuery<User | null>({
    queryKey: ['student', student?.id, 'parent'],
    queryFn: async () => {
      if (!student?.id) return null;
      try {
        // Try to get parent from student's parent relationships
        const response = await api.get(`/users`);
        const allUsers = response.data as User[];
        // Check if student has assigned parent (would need API endpoint for this)
        // For now, return null and let user select
        return null;
      } catch {
        return null;
      }
    },
    enabled: isOpen && !!student?.id,
  });

  // Reset form when modal opens/closes or student changes
  useEffect(() => {
    if (isOpen) {
      if (student) {
        // Check if student has parent account assigned
        const hasParentAccount = assignedParent !== null && assignedParent !== undefined;
        setUseParentAccount(hasParentAccount);
        setFormData({
          classId: student.classId,
          name: student.name || '',
          dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
          parentUserId: hasParentAccount ? (assignedParent?.id || 0) : 0,
          parentName: student.parentName || '',
          parentPhone: student.parentPhone || '',
          parentEmail: student.parentEmail || '',
        });
      } else {
        setUseParentAccount(false);
        setCreateNewParent(false);
        setFormData({
          classId: classId || (classes && classes.length > 0 ? classes[0].id : 0),
          name: '',
          dateOfBirth: '',
          parentUserId: 0,
          parentName: '',
          parentPhone: '',
          parentEmail: '',
        });
        setNewParentData({ username: '', email: '', password: '' });
      }
      setErrors({});
    }
  }, [isOpen, student, classId, classes, assignedParent]);

  // Create parent account mutation
  const createParentMutation = useMutation({
    mutationFn: async (data: typeof newParentData) => {
      const response = await api.post('/users', {
        username: data.username,
        email: data.email.trim() || undefined,
        password: data.password,
        role: 'Parent',
      });
      return response.data;
    },
    onSuccess: (newParent) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'parents'] });
      // Don't change formData here, let handleSubmit use the returned value
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      if (message.includes('Username')) {
        setErrors({ parentUsername: message });
      } else if (message.includes('Email')) {
        setErrors({ parentEmail: message });
      } else {
        alert(message);
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { classId: number; name: string; dateOfBirth?: string; parentName?: string; parentPhone?: string; parentEmail?: string; parentUserId?: number }) => {
      const response = await api.post('/students', {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
      });
      return response.data;
    },
    onSuccess: async (data, variables) => {
      // Assign parent if parentUserId is provided
      if (variables.parentUserId && variables.parentUserId > 0) {
        try {
          await api.post(`/users/${variables.parentUserId}/students`, [data.id]);
        } catch (error) {
          console.error('Failed to assign parent:', error);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      if (data?.classId) {
        queryClient.invalidateQueries({ queryKey: ['students', 'class', data.classId.toString()] });
        queryClient.invalidateQueries({ queryKey: ['students', 'class', data.classId] });
      }
      queryClient.invalidateQueries({ queryKey: ['students', 'class'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { classId: number; name: string; dateOfBirth?: string; parentName?: string; parentPhone?: string; parentEmail?: string; parentUserId?: number }) => {
      const response = await api.put(`/students/${student?.id}`, {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
      });
      return response.data;
    },
    onSuccess: async (data, variables) => {
      // Assign/unassign parent if parentUserId changed
      if (variables.parentUserId && variables.parentUserId > 0) {
        try {
          await api.post(`/users/${variables.parentUserId}/students`, [student?.id!]);
        } catch (error) {
          console.error('Failed to assign parent:', error);
        }
      }
      
      // Lấy ID từ student hoặc studentId prop
      const id = studentId || student?.id;
      
      if (id) {
        const idString = id.toString();
        queryClient.setQueryData(['student', idString], data);
      }
      
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      await queryClient.invalidateQueries({ queryKey: ['student'] });
      if (data?.classId) {
        await queryClient.invalidateQueries({ queryKey: ['students', 'class', data.classId.toString()] });
        await queryClient.invalidateQueries({ queryKey: ['students', 'class', data.classId] });
      }
      if (id) {
        await queryClient.refetchQueries({ queryKey: ['students'] });
        await queryClient.refetchQueries({ queryKey: ['student', id.toString()] });
      }
      
      onClose();
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tên học sinh là bắt buộc';
    }

    if (!formData.classId || formData.classId === 0) {
      newErrors.classId = 'Vui lòng chọn lớp học';
    }

    // Email validation - optional but must be valid if provided
    if (formData.parentEmail && formData.parentEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      newErrors.parentEmail = 'Email không hợp lệ';
    }

    // Validate new parent data if creating new parent
    if (createNewParent && useParentAccount) {
      if (!newParentData.username.trim()) {
        newErrors.parentUsername = 'Tên đăng nhập phụ huynh là bắt buộc';
      }
      if (!newParentData.password.trim() || newParentData.password.length < 6) {
        newErrors.parentPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
      if (newParentData.email && newParentData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newParentData.email)) {
        newErrors.parentEmail = 'Email không hợp lệ';
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

    let finalParentUserId = formData.parentUserId;

    // If creating new parent, create it first
    if (createNewParent && useParentAccount) {
      try {
        const newParent = await createParentMutation.mutateAsync(newParentData);
        finalParentUserId = newParent.id;
      } catch (error) {
        // Error already handled in mutation
        return;
      }
    }

    const submitData = {
      classId: formData.classId,
      name: formData.name.trim(),
      dateOfBirth: formData.dateOfBirth || undefined,
      parentName: useParentAccount ? undefined : (formData.parentName.trim() || undefined),
      parentPhone: useParentAccount ? undefined : (formData.parentPhone.trim() || undefined),
      parentEmail: useParentAccount ? undefined : (formData.parentEmail.trim() || undefined),
      parentUserId: useParentAccount && finalParentUserId > 0 ? finalParentUserId : undefined,
    };

    if (student) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || createParentMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={student ? 'Sửa học sinh' : 'Thêm học sinh mới'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="w-full">
          <label className="block text-sm font-medium mb-2 text-text">
            Lớp học *
          </label>
          <select
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: parseInt(e.target.value) })}
            className={`input w-full min-h-[44px] touch-manipulation ${errors.classId ? 'border-red-500' : ''}`}
            required
            disabled={isLoading || !!classId} // Disable nếu đã có classId từ props
          >
            <option value={0}>Chọn lớp học</option>
            {classes?.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - {cls.branchName}
              </option>
            ))}
          </select>
          {errors.classId && (
            <p className="mt-1 text-sm text-red-500">{errors.classId}</p>
          )}
        </div>

        <Input
          label="Tên học sinh *"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
          autoFocus
          disabled={isLoading}
        />

        <Input
          label="Ngày sinh"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          error={errors.dateOfBirth}
          disabled={isLoading}
        />

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-text mb-3">Thông tin phụ huynh</h3>
          
          {/* Toggle between parent account and manual input */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setUseParentAccount(false);
                setCreateNewParent(false);
                setFormData({ ...formData, parentUserId: 0 });
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                !useParentAccount
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Nhập thông tin
            </button>
            <button
              type="button"
              onClick={() => {
                setUseParentAccount(true);
                setCreateNewParent(false);
                setFormData({ ...formData, parentName: '', parentPhone: '', parentEmail: '' });
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                useParentAccount
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chọn tài khoản
            </button>
          </div>

          {useParentAccount ? (
            <div className="space-y-4">
              {/* Create new parent or select existing */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateNewParent(false);
                    setFormData({ ...formData, parentUserId: 0 });
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    !createNewParent
                      ? 'bg-primary/10 text-primary border border-primary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Chọn có sẵn
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateNewParent(true);
                    setFormData({ ...formData, parentUserId: 0 });
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    createNewParent
                      ? 'bg-primary/10 text-primary border border-primary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tạo mới
                </button>
              </div>

              {createNewParent ? (
                <>
                  <Input
                    label="Tên đăng nhập phụ huynh *"
                    type="text"
                    value={newParentData.username}
                    onChange={(e) => {
                      setNewParentData({ ...newParentData, username: e.target.value });
                      if (errors.parentUsername) {
                        const newErrors = { ...errors };
                        delete newErrors.parentUsername;
                        setErrors(newErrors);
                      }
                    }}
                    error={errors.parentUsername}
                    disabled={isLoading || createParentMutation.isPending}
                    required
                  />
                  <Input
                    label="Email phụ huynh (tùy chọn)"
                    type="email"
                    value={newParentData.email}
                    onChange={(e) => {
                      setNewParentData({ ...newParentData, email: e.target.value });
                      if (errors.parentEmail) {
                        const newErrors = { ...errors };
                        delete newErrors.parentEmail;
                        setErrors(newErrors);
                      }
                    }}
                    error={errors.parentEmail}
                    disabled={isLoading || createParentMutation.isPending}
                    placeholder="Nhập email (không bắt buộc)"
                  />
                  <Input
                    label="Mật khẩu *"
                    type="password"
                    value={newParentData.password}
                    onChange={(e) => {
                      setNewParentData({ ...newParentData, password: e.target.value });
                      if (errors.parentPassword) {
                        const newErrors = { ...errors };
                        delete newErrors.parentPassword;
                        setErrors(newErrors);
                      }
                    }}
                    error={errors.parentPassword}
                    disabled={isLoading || createParentMutation.isPending}
                    required
                  />
                  <p className="text-xs text-text/50">
                    Mật khẩu phải có ít nhất 6 ký tự
                  </p>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2 text-text">
                    Chọn phụ huynh
                  </label>
                  <select
                    value={formData.parentUserId}
                    onChange={(e) => setFormData({ ...formData, parentUserId: parseInt(e.target.value) })}
                    className="input w-full min-h-[44px] touch-manipulation"
                    disabled={isLoading}
                  >
                    <option value={0}>-- Chọn phụ huynh --</option>
                    {parents?.map((parent) => (
                      <option key={parent.id} value={parent.id}>
                        {parent.username} {parent.email ? `(${parent.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Tên phụ huynh"
                type="text"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                error={errors.parentName}
                disabled={isLoading}
              />

              <Input
                label="Điện thoại"
                type="tel"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                error={errors.parentPhone}
                disabled={isLoading}
              />

              <Input
                label="Email (tùy chọn)"
                type="email"
                value={formData.parentEmail}
                onChange={(e) => {
                  setFormData({ ...formData, parentEmail: e.target.value });
                  if (errors.parentEmail) {
                    const newErrors = { ...errors };
                    delete newErrors.parentEmail;
                    setErrors(newErrors);
                  }
                }}
                error={errors.parentEmail}
                disabled={isLoading}
                placeholder="Nhập email (không bắt buộc)"
              />
              <p className="text-xs text-text/50">
                Email là tùy chọn, có thể để trống
              </p>
            </div>
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
            {isLoading ? 'Đang lưu...' : student ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

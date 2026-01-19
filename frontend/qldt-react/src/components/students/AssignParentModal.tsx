import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { Student, User } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface AssignParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const AssignParentModal = ({ isOpen, onClose, student }: AssignParentModalProps) => {
  const queryClient = useQueryClient();
  const [selectedParentId, setSelectedParentId] = useState<number>(0);
  const [createNewParent, setCreateNewParent] = useState(false);
  const [newParentData, setNewParentData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: parents } = useQuery<User[]>({
    queryKey: ['users', 'parents'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.filter((u: User) => u.role === 'Parent');
    },
    enabled: isOpen,
  });

  // Note: This query is not needed for assignment, but can be used to check existing assignments
  // const { data: currentStudentParents } = useQuery<number[]>({
  //   queryKey: ['students', student?.id, 'parents'],
  //   queryFn: async () => {
  //     if (!student?.id) return [];
  //     // This endpoint doesn't exist yet, would need to be created if needed
  //     return [];
  //   },
  //   enabled: isOpen && !!student?.id,
  // });

  useEffect(() => {
    if (isOpen && student) {
      // If student already has a parent user, pre-select it
      if (student.parentUser?.id) {
        setSelectedParentId(student.parentUser.id);
        setCreateNewParent(false);
      } else {
        setSelectedParentId(0);
        setCreateNewParent(false);
      }
      setNewParentData({ 
        username: '', 
        email: '', 
        password: '',
        fullName: '',
        phone: '',
      });
      setErrors({});
    }
  }, [isOpen, student]);

  const createParentMutation = useMutation({
    mutationFn: async (data: typeof newParentData) => {
      const response = await api.post('/users', {
        username: data.username,
        email: data.email.trim() || undefined,
        password: data.password,
        fullName: data.fullName.trim() || undefined,
        phone: data.phone.trim() || undefined,
        role: 'Parent',
      });
      return response.data;
    },
    onSuccess: (newParent) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'parents'] });
      setSelectedParentId(newParent.id);
      setCreateNewParent(false);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      if (message.includes('Username')) {
        setErrors({ username: message });
      } else if (message.includes('Email')) {
        setErrors({ email: message });
      } else {
        alert(message);
      }
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ parentId, studentId }: { parentId: number; studentId: number }) => {
      await api.post(`/users/${parentId}/students`, [studentId]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', student?.id, 'parents'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      onClose();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      alert(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (createNewParent) {
      // Validate new parent data
      if (!newParentData.username.trim()) {
        setErrors({ username: 'Tên đăng nhập không được để trống' });
        return;
      }
      // Email is optional, but if provided, must be valid
      if (newParentData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newParentData.email)) {
        setErrors({ email: 'Email không hợp lệ' });
        return;
      }
      if (!newParentData.password.trim() || newParentData.password.length < 6) {
        setErrors({ password: 'Mật khẩu phải có ít nhất 6 ký tự' });
        return;
      }
      createParentMutation.mutate(newParentData);
    } else {
      // Assign existing parent
      if (!selectedParentId) {
        alert('Vui lòng chọn phụ huynh');
        return;
      }
      if (!student?.id) {
        alert('Không tìm thấy học sinh');
        return;
      }
      assignMutation.mutate({ parentId: selectedParentId, studentId: student.id });
    }
  };

  const handleAssignAfterCreate = () => {
    if (selectedParentId && student?.id) {
      assignMutation.mutate({ parentId: selectedParentId, studentId: student.id });
    }
  };

  if (!student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Gán phụ huynh cho ${student.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            type="button"
            onClick={() => {
              setCreateNewParent(false);
              setErrors({});
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${!createNewParent
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Chọn phụ huynh có sẵn
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateNewParent(true);
              setErrors({});
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${createNewParent
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Tạo phụ huynh mới
          </button>
        </div>

        {!createNewParent ? (
          <>
            <div>
              <label htmlFor="parentId" className="block text-sm font-medium text-text font-body mb-2">
                Chọn phụ huynh
              </label>
              <select
                id="parentId"
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(Number(e.target.value))}
                className="input w-full min-h-[44px]"
                required
              >
                <option value="0">Chọn phụ huynh</option>
                {parents?.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.fullName || parent.username}
                    {parent.email && ` (${parent.email})`}
                    {parent.phone && ` - ${parent.phone}`}
                  </option>
                ))}
              </select>
              {student.parentUser && selectedParentId === student.parentUser.id && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Học sinh này đã được gán cho phụ huynh này. Bấm "Gán phụ huynh" để xác nhận lại.
                  </p>
                </div>
              )}
            </div>

            {selectedParentId > 0 && createParentMutation.isSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Đã tạo tài khoản phụ huynh thành công. Bấm "Gán" để hoàn tất.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text font-body mb-2">
                Tên đăng nhập *
              </label>
              <Input
                id="username"
                type="text"
                value={newParentData.username}
                onChange={(e) => {
                  setNewParentData({ ...newParentData, username: e.target.value });
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
              <label htmlFor="fullName" className="block text-sm font-medium text-text font-body mb-2">
                Họ tên (tùy chọn)
              </label>
              <Input
                id="fullName"
                type="text"
                value={newParentData.fullName}
                onChange={(e) => {
                  setNewParentData({ ...newParentData, fullName: e.target.value });
                }}
                placeholder="Nhập họ tên phụ huynh (không bắt buộc)"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text font-body mb-2">
                Số điện thoại (tùy chọn)
              </label>
              <Input
                id="phone"
                type="tel"
                value={newParentData.phone}
                onChange={(e) => {
                  setNewParentData({ ...newParentData, phone: e.target.value });
                }}
                placeholder="Nhập số điện thoại (không bắt buộc)"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text font-body mb-2">
                Email (tùy chọn)
              </label>
              <Input
                id="email"
                type="email"
                value={newParentData.email}
                onChange={(e) => {
                  setNewParentData({ ...newParentData, email: e.target.value });
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
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text font-body mb-2">
                Mật khẩu *
              </label>
              <Input
                id="password"
                type="password"
                value={newParentData.password}
                onChange={(e) => {
                  setNewParentData({ ...newParentData, password: e.target.value });
                  if (errors.password) {
                    const newErrors = { ...errors };
                    delete newErrors.password;
                    setErrors(newErrors);
                  }
                }}
                className={errors.password ? 'border-red-500' : ''}
                required
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-text/50 font-body">
                Mật khẩu phải có ít nhất 6 ký tự
              </p>
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {createNewParent && createParentMutation.isSuccess ? (
            <>
              <Button
                type="button"
                variant="primary"
                onClick={handleAssignAfterCreate}
                disabled={assignMutation.isPending}
                className="flex-1"
              >
                {assignMutation.isPending ? 'Đang gán...' : 'Gán phụ huynh'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Hủy
              </Button>
            </>
          ) : (
            <>
              <Button
                type="submit"
                variant="primary"
                disabled={createParentMutation.isPending || assignMutation.isPending}
                className="flex-1"
              >
                {createParentMutation.isPending
                  ? 'Đang tạo...'
                  : assignMutation.isPending
                    ? 'Đang gán...'
                    : createNewParent
                      ? 'Tạo và gán'
                      : 'Gán phụ huynh'}
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
                Hủy
              </Button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
};

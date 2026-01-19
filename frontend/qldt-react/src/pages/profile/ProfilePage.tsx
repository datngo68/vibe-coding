import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [errors, setErrors] = useState<{ username?: string; email?: string }>({});

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data;
    },
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        email: currentUser.email || '',
      });
    }
  }, [currentUser]);

  const updateMutation = useMutation({
    mutationFn: async (data: { username: string; email: string }) => {
      const response = await api.put('/users/me', {
        username: data.username,
        email: data.email.trim() || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      // Update localStorage user info
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        userObj.username = formData.username;
        userObj.email = formData.email;
        localStorage.setItem('user', JSON.stringify(userObj));
      }
      alert('Cập nhật thông tin thành công!');
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

    updateMutation.mutate(formData);
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'Owner':
        return 'Chủ trung tâm';
      case 'BranchManager':
        return 'Quản lý chi nhánh';
      case 'Teacher':
        return 'Giáo viên';
      case 'Parent':
        return 'Phụ huynh';
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text/70 font-body">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-8">
      {/* Back Button */}
      <Button
        variant="secondary"
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 mb-6"
      >
        <ArrowLeftIcon />
        <span>Quay lại</span>
      </Button>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading mb-2">
          Thông tin cá nhân
        </h1>
        <p className="text-text/70 font-body">
          Cập nhật thông tin tài khoản của bạn
        </p>
      </div>

      {/* Profile Card */}
      <Card className="p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-4 sm:gap-6 mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <UserIcon />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text font-heading">
              {currentUser?.username || user?.username}
            </h2>
            <p className="text-sm sm:text-base text-text/60 font-body">
              {getRoleName(currentUser?.role || user?.role || '')}
            </p>
            {currentUser?.branchId && (
              <p className="text-xs sm:text-sm text-text/50 font-body mt-1">
                Chi nhánh ID: {currentUser.branchId}
              </p>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text font-body mb-2">
              Tên đăng nhập
            </label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value });
                setErrors({ ...errors, username: undefined });
              }}
              className={errors.username ? 'border-red-500' : ''}
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
                setErrors({ ...errors, email: undefined });
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

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={updateMutation.isPending}
              className="flex-1 sm:flex-none"
            >
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/profile/change-password')}
              className="flex-1 sm:flex-none"
            >
              Đổi mật khẩu
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

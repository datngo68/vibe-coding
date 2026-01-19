import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

const KeyIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      await api.post('/users/me/change-password', data);
    },
    onSuccess: () => {
      alert('Đổi mật khẩu thành công!');
      navigate('/profile');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      if (message.includes('Current password') || message.includes('mật khẩu hiện tại')) {
        setErrors({ currentPassword: message });
      } else {
        alert(message);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.currentPassword.trim()) {
      setErrors({ currentPassword: 'Vui lòng nhập mật khẩu hiện tại' });
      return;
    }

    if (!formData.newPassword.trim()) {
      setErrors({ newPassword: 'Vui lòng nhập mật khẩu mới' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setErrors({ newPassword: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setErrors({ newPassword: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-8">
      {/* Back Button */}
      <Button
        variant="secondary"
        onClick={() => navigate('/profile')}
        className="inline-flex items-center gap-2 mb-6"
      >
        <ArrowLeftIcon />
        <span>Quay lại</span>
      </Button>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <KeyIcon />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading">
            Đổi mật khẩu
          </h1>
        </div>
        <p className="text-text/70 font-body">
          Thay đổi mật khẩu để bảo vệ tài khoản của bạn
        </p>
      </div>

      {/* Form Card */}
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-text font-body mb-2">
              Mật khẩu hiện tại
            </label>
            <Input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => {
                setFormData({ ...formData, currentPassword: e.target.value });
                setErrors({ ...errors, currentPassword: undefined });
              }}
              className={errors.currentPassword ? 'border-red-500' : ''}
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-text font-body mb-2">
              Mật khẩu mới
            </label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => {
                setFormData({ ...formData, newPassword: e.target.value });
                setErrors({ ...errors, newPassword: undefined });
              }}
              className={errors.newPassword ? 'border-red-500' : ''}
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
            )}
            <p className="mt-1 text-xs text-text/50 font-body">
              Mật khẩu phải có ít nhất 6 ký tự
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text font-body mb-2">
              Xác nhận mật khẩu mới
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                setErrors({ ...errors, confirmPassword: undefined });
              }}
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={changePasswordMutation.isPending}
              className="flex-1 sm:flex-none"
            >
              {changePasswordMutation.isPending ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/profile')}
              className="flex-1 sm:flex-none"
            >
              Hủy
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

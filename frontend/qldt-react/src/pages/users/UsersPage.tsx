import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { UserFormModal } from '../../components/users/UserFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { format } from 'date-fns';

// SVG Icons từ Heroicons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const EmptyStateIcon = () => (
  <svg className="w-16 h-16 mx-auto text-text/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// Action Menu Component
interface UserActionMenuProps {
  user: User;
  onEdit: (user: User) => void;
  onActivate: (user: User) => void;
  onDeactivate: (user: User) => void;
  onResetPassword: (user: User) => void;
  onDelete: (user: User) => void;
  isActivating: boolean;
  isDeactivating: boolean;
  isResettingPassword: boolean;
}

const UserActionMenu = ({
  user,
  onEdit,
  onActivate,
  onDeactivate,
  onResetPassword,
  onDelete,
  isActivating,
  isDeactivating,
  isResettingPassword,
}: UserActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const EllipsisIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  );

  const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const KeyIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );

  const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const XIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(user)}
          className="cursor-pointer flex items-center"
        >
          <EditIcon />
          <span className="ml-1.5">Sửa</span>
        </Button>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn-secondary text-xs px-3 py-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer touch-manipulation"
          aria-label="Thêm thao tác"
        >
          <EllipsisIcon />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {user.isActive !== false ? (
            <button
              onClick={() => {
                onDeactivate(user);
                setIsOpen(false);
              }}
              disabled={isDeactivating}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XIcon />
              <span>Vô hiệu hóa</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onActivate(user);
                setIsOpen(false);
              }}
              disabled={isActivating}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon />
              <span>Kích hoạt</span>
            </button>
          )}
          
          <button
            onClick={() => {
              onResetPassword(user);
              setIsOpen(false);
            }}
            disabled={isResettingPassword}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <KeyIcon />
            <span>Reset mật khẩu</span>
          </button>

          <div className="border-t border-gray-200 my-1"></div>

          <button
            onClick={() => {
              onDelete(user);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <TrashIcon />
            <span>Xóa</span>
          </button>
        </div>
      )}
    </div>
  );
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

const getRoleColor = (role: string) => {
  switch (role) {
    case 'Owner':
      return 'bg-purple-100 text-purple-800';
    case 'BranchManager':
      return 'bg-blue-100 text-blue-800';
    case 'Teacher':
      return 'bg-green-100 text-green-800';
    case 'Parent':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const UsersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  // Filters / search / sort / pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [sortKey, setSortKey] = useState<'username' | 'email' | 'role' | 'createdAt'>('username');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Check if user has permission (Owner, BranchManager, or Teacher)
  const canManageUsers = currentUser?.role === 'Owner' || currentUser?.role === 'BranchManager' || currentUser?.role === 'Teacher';
  const isTeacher = currentUser?.role === 'Teacher';

  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data;
    },
    enabled: canManageUsers,
  });

  // Filtering / searching / sorting / pagination
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    let data = [...users];

    // Teacher chỉ thấy Parents
    if (isTeacher) {
      data = data.filter((u) => u.role === 'Parent');
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter(
        (u) =>
          u.username.toLowerCase().includes(term) ||
          (u.email && u.email.toLowerCase().includes(term)) ||
          (u.fullName && u.fullName.toLowerCase().includes(term)) ||
          (u.phone && u.phone.toLowerCase().includes(term)) ||
          getRoleName(u.role).toLowerCase().includes(term)
      );
    }

    if (filterRole !== 'all') {
      data = data.filter((u) => u.role === filterRole);
    }

    data.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'username':
          return a.username.localeCompare(b.username) * dir;
        case 'email':
          return a.email.localeCompare(b.email) * dir;
        case 'role':
          return a.role.localeCompare(b.role) * dir;
        case 'createdAt':
        default:
          return (new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()) * dir;
      }
    });

    return data;
  }, [users, searchTerm, filterRole, sortKey, sortDir]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    },
  });

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const activateMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await api.post(`/users/${userId}/activate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await api.post(`/users/${userId}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: number; newPassword: string }) => {
      await api.post(`/users/${userId}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      alert('Đặt lại mật khẩu thành công!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Có lỗi xảy ra';
      alert(message);
    },
  });

  const handleActivate = (user: User) => {
    if (window.confirm(`Bạn có chắc chắn muốn kích hoạt tài khoản "${user.username}"?`)) {
      activateMutation.mutate(user.id);
    }
  };

  const handleDeactivate = (user: User) => {
    if (window.confirm(`Bạn có chắc chắn muốn vô hiệu hóa tài khoản "${user.username}"?`)) {
      deactivateMutation.mutate(user.id);
    }
  };

  const handleResetPassword = (user: User) => {
    const newPassword = prompt(`Nhập mật khẩu mới cho ${user.username}:`);
    if (newPassword && newPassword.length >= 6) {
      resetPasswordMutation.mutate({ userId: user.id, newPassword });
    } else if (newPassword) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
    }
  };

  if (!canManageUsers) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <Card className="p-6 text-center">
          <p className="text-text/70 font-body">
            Bạn không có quyền truy cập trang này.
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text/70 font-body">Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <Card className="p-6 text-center">
          <p className="text-red-600 font-body">Có lỗi xảy ra khi tải danh sách người dùng.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading mb-2">
            Quản lý người dùng
          </h1>
          <p className="text-text/70 font-body">
            Quản lý tài khoản người dùng trong hệ thống
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          variant="primary"
          className="inline-flex items-center gap-2"
        >
          <PlusIcon />
          <span>Tạo người dùng mới</span>
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="p-4 sm:p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Basic Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên đăng nhập, email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="input w-full min-h-[44px]"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
              className="sm:w-auto"
            >
              {isAdvancedSearchOpen ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
            </Button>
          </div>

          {/* Advanced Search */}
          {(isAdvancedSearchOpen || window.innerWidth >= 640) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-text font-body mb-2">
                  Vai trò
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => {
                    setFilterRole(e.target.value);
                    setPage(1);
                  }}
                  className="input w-full min-h-[44px]"
                  disabled={isTeacher}
                >
                  <option value="all">Tất cả</option>
                  {!isTeacher && (
                    <>
                      <option value="Owner">Chủ trung tâm</option>
                      <option value="BranchManager">Quản lý chi nhánh</option>
                      <option value="Teacher">Giáo viên</option>
                    </>
                  )}
                  <option value="Parent">Phụ huynh</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text font-body mb-2">
                  Sắp xếp theo
                </label>
                <select
                  value={sortKey}
                  onChange={(e) => {
                    setSortKey(e.target.value as typeof sortKey);
                    setPage(1);
                  }}
                  className="input w-full min-h-[44px]"
                >
                  <option value="username">Tên đăng nhập</option>
                  <option value="email">Email</option>
                  <option value="role">Vai trò</option>
                  <option value="createdAt">Ngày tạo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text font-body mb-2">
                  Thứ tự
                </label>
                <select
                  value={sortDir}
                  onChange={(e) => {
                    setSortDir(e.target.value as typeof sortDir);
                    setPage(1);
                  }}
                  className="input w-full min-h-[44px]"
                >
                  <option value="asc">Tăng dần</option>
                  <option value="desc">Giảm dần</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text font-body mb-2">
                  Số lượng / trang
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="input w-full min-h-[44px]"
                >
                  <option value="12">12</option>
                  <option value="24">24</option>
                  <option value="48">48</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Users List */}
      {paginatedUsers.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyStateIcon />
          <h3 className="text-lg font-semibold text-text font-heading mt-4 mb-2">
            Không có người dùng nào
          </h3>
          <p className="text-text/70 font-body mb-6">
            {searchTerm || filterRole !== 'all'
              ? 'Không tìm thấy người dùng phù hợp với bộ lọc.'
              : 'Bắt đầu bằng cách tạo người dùng mới.'}
          </p>
          {!searchTerm && filterRole === 'all' && (
            <Button onClick={() => setIsCreateModalOpen(true)} variant="primary">
              <PlusIcon />
              <span>Tạo người dùng mới</span>
            </Button>
          )}
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto mb-6">
            <Card className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text/70 uppercase tracking-wider font-body">
                      Tên đăng nhập
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text/70 uppercase tracking-wider font-body">
                      Họ tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text/70 uppercase tracking-wider font-body">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text/70 uppercase tracking-wider font-body">
                      Số điện thoại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text/70 uppercase tracking-wider font-body">
                      Vai trò
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text/70 uppercase tracking-wider font-body">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text/70 uppercase tracking-wider font-body">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text/70 uppercase tracking-wider font-body">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <UserIcon className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-medium text-text font-body">
                            {user.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-text/70 font-body">
                          {user.fullName || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-text/70 font-body">{user.email || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-text/70 font-body">{user.phone || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleName(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive !== false 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive !== false ? 'Hoạt động' : 'Vô hiệu hóa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-text/70 font-body">
                          {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy') : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end">
                          <UserActionMenu
                            user={user}
                            onEdit={handleEdit}
                            onActivate={handleActivate}
                            onDeactivate={handleDeactivate}
                            onResetPassword={handleResetPassword}
                            onDelete={handleDelete}
                            isActivating={activateMutation.isPending}
                            isDeactivating={deactivateMutation.isPending}
                            isResettingPassword={resetPasswordMutation.isPending}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {paginatedUsers.map((user) => (
              <Card key={user.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-text font-heading truncate">
                      {user.fullName || user.username}
                    </h3>
                    <p className="text-xs text-text/60 font-body truncate">@{user.username}</p>
                    {user.email && (
                      <p className="text-sm text-text/70 font-body truncate">{user.email}</p>
                    )}
                    {user.phone && (
                      <p className="text-sm text-text/70 font-body truncate">{user.phone}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleName(user.role)}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive !== false 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive !== false ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-xs text-text/50 font-body">
                    {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy') : '-'}
                  </span>
                  <div className="flex items-center justify-end">
                    <UserActionMenu
                      user={user}
                      onEdit={handleEdit}
                      onActivate={handleActivate}
                      onDeactivate={handleDeactivate}
                      onResetPassword={handleResetPassword}
                      onDelete={handleDelete}
                      isActivating={activateMutation.isPending}
                      isDeactivating={deactivateMutation.isPending}
                      isResettingPassword={resetPasswordMutation.isPending}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {filteredUsers.length > pageSize && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-text/70 font-body">
                Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredUsers.length)} trong tổng số {filteredUsers.length} người dùng
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Trước
                </Button>
                <span className="flex items-center px-4 text-sm text-text font-body">
                  Trang {page} / {Math.ceil(filteredUsers.length / pageSize)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(Math.ceil(filteredUsers.length / pageSize), p + 1))}
                  disabled={page >= Math.ceil(filteredUsers.length / pageSize)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <UserFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <UserFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={() => {
          if (userToDelete) {
            deleteMutation.mutate(userToDelete.id);
          }
        }}
        title="Xóa người dùng"
        message={`Bạn có chắc chắn muốn xóa người dùng "${userToDelete?.username}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
      />
    </div>
  );
};

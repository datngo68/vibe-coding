import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { Class, Branch } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ClassFormModal } from '../../components/classes/ClassFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';

// Lấy branchId từ user nếu là Teacher
const getTeacherBranchId = (user: any): number | null => {
  if (user?.role === 'Teacher' && user?.branchId) {
    return user.branchId;
  }
  return null;
};

// SVG Icons từ Heroicons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const BookOpenIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const EmptyStateIcon = () => (
  <svg className="w-16 h-16 mx-auto text-text/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

export const ClassesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  // Filters / search / sort / pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranchId, setFilterBranchId] = useState<number | 'all'>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [sortKey, setSortKey] = useState<'name' | 'branchName' | 'level' | 'createdAt'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Check if user is Teacher
  const isTeacher = user?.role === 'Teacher';
  const teacherBranchId = getTeacherBranchId(user);

  // Auto-open create modal if action=new in query params
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new' || action === 'add') {
      setIsCreateModalOpen(true);
      // Remove query param after opening modal
      navigate('/classes', { replace: true });
    }
  }, [searchParams, navigate]);

  const { data: classes, isLoading, error } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes');
      return response.data;
    },
  });

  const { data: branches } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await api.get('/branches');
      return response.data;
    },
  });

  // Filtering / searching / sorting / pagination
  const filteredClasses = useMemo(() => {
    if (!classes) return [];
    let data = [...classes];

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.branchName.toLowerCase().includes(term) ||
          (c.level || '').toLowerCase().includes(term)
      );
    }

    if (filterBranchId !== 'all') {
      data = data.filter((c) => c.branchId === filterBranchId);
    }

    if (filterLevel !== 'all') {
      data = data.filter((c) => c.level === filterLevel);
    }

    data.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name) * dir;
        case 'branchName':
          return a.branchName.localeCompare(b.branchName) * dir;
        case 'level':
          return ((a.level || '') > (b.level || '') ? 1 : -1) * dir;
        case 'createdAt':
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
    });

    return data;
  }, [classes, searchTerm, filterBranchId, filterLevel, sortKey, sortDir]);

  // Get unique levels
  const levels = useMemo(() => {
    if (!classes) return [];
    return Array.from(new Set(classes.map((c) => c.level).filter(Boolean))).sort() as string[];
  }, [classes]);

  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedClasses = filteredClasses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsDeleteDialogOpen(false);
      setClassToDelete(null);
    },
  });

  const handleEdit = (classItem: Class, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedClass(classItem);
    setIsEditModalOpen(true);
  };

  const handleDelete = (classItem: Class, e: React.MouseEvent) => {
    e.stopPropagation();
    setClassToDelete(classItem);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (classToDelete) {
      deleteMutation.mutate(classToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text/70 font-body">Đang tải danh sách lớp học...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
          <p className="font-semibold mb-1">Lỗi khi tải dữ liệu</p>
          <p className="text-sm">Không thể tải danh sách lớp học. Vui lòng thử lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading mb-1">
            Lớp học
          </h1>
          <p className="text-sm text-text/60 font-body">
            Quản lý các lớp học của trung tâm
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <PlusIcon />
          <span>Tạo lớp học mới</span>
        </Button>
      </div>

      {/* Toolbar: search, filters, sort, pagination size */}
      {classes && classes.length > 0 && (
        <Card className="mb-6 p-4 sm:p-5">
          {/* Mobile: Toggle button */}
          <div className="md:hidden mb-4">
            <Button
              variant="secondary"
              onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
              className="w-full flex items-center justify-between"
            >
              <span>Tìm kiếm nâng cao</span>
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${isAdvancedSearchOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>

          {/* Desktop: Always visible, Mobile: Collapsible */}
          <div className={`${isAdvancedSearchOpen ? 'block' : 'hidden'} md:block`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1 text-text">Tìm kiếm</label>
                <input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="input w-full"
                  placeholder="Tên lớp, chi nhánh, level..."
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1 text-text">Chi nhánh</label>
                <select
                  className="input w-full"
                  value={filterBranchId === 'all' ? '' : filterBranchId}
                  onChange={(e) => {
                    setFilterBranchId(e.target.value ? Number(e.target.value) : 'all');
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả</option>
                  {branches?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1 text-text">Level</label>
                <select
                  className="input w-full"
                  value={filterLevel}
                  onChange={(e) => {
                    setFilterLevel(e.target.value || 'all');
                    setPage(1);
                  }}
                >
                  <option value="all">Tất cả</option>
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1 flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-text">Sắp xếp</label>
                  <select
                    className="input w-full"
                    value={`${sortKey}|${sortDir}`}
                    onChange={(e) => {
                      const [key, dir] = e.target.value.split('|') as [typeof sortKey, typeof sortDir];
                      setSortKey(key);
                      setSortDir(dir);
                    }}
                  >
                    <option value="name|asc">Tên lớp (A→Z)</option>
                    <option value="name|desc">Tên lớp (Z→A)</option>
                    <option value="branchName|asc">Chi nhánh (A→Z)</option>
                    <option value="branchName|desc">Chi nhánh (Z→A)</option>
                    <option value="level|asc">Level (A→Z)</option>
                    <option value="level|desc">Level (Z→A)</option>
                    <option value="createdAt|desc">Mới nhất</option>
                    <option value="createdAt|asc">Cũ nhất</option>
                  </select>
                </div>
                <div className="w-28">
                  <label className="block text-sm font-medium mb-1 text-text">Trang</label>
                  <select
                    className="input w-full"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                  >
                    {[6, 12, 24, 48].map((s) => (
                      <option key={s} value={s}>{s}/trang</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setFilterBranchId('all');
                  setFilterLevel('all');
                  setSortKey('name');
                  setSortDir('asc');
                  setPage(1);
                }}
                className="text-sm py-2 px-4"
              >
                Đặt lại lọc
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!classes || classes.length === 0 ? (
        <div className="bg-background rounded-xl border-2 border-dashed border-text/20 p-12 sm:p-16 text-center">
          <EmptyStateIcon />
          <h3 className="text-lg font-semibold text-text font-heading mb-2 mt-4">
            Chưa có lớp học nào
          </h3>
          <p className="text-text/60 font-body mb-6 max-w-md mx-auto">
            Bắt đầu bằng cách tạo lớp học đầu tiên để quản lý học sinh và giáo viên.
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <PlusIcon />
            <span>Tạo lớp học đầu tiên</span>
          </Button>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-background rounded-xl border-2 border-dashed border-text/20 p-12 sm:p-16 text-center">
          <EmptyStateIcon />
          <h3 className="text-lg font-semibold text-text font-heading mb-2 mt-4">
            Không tìm thấy lớp học
          </h3>
          <p className="text-text/60 font-body mb-6 max-w-md mx-auto">
            Không có lớp học nào phù hợp với bộ lọc hiện tại.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm('');
              setFilterBranchId('all');
              setFilterLevel('all');
              setSortKey('name');
              setSortDir('asc');
              setPage(1);
            }}
          >
            Đặt lại lọc
          </Button>
        </div>
      ) : (
        <>
          {/* Classes Grid */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-text/70">
              Hiển thị {pagedClasses.length} / {filteredClasses.length} lớp học
            </div>
            {filteredClasses.length > pageSize && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-sm"
                >
                  Trước
                </Button>
                <span className="text-sm text-text/70">
                  Trang {currentPage}/{totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="text-sm"
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pagedClasses.map((classItem: Class) => (
            <Card
              key={classItem.id}
              onClick={() => navigate(`/classes/${classItem.id}`)}
              className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            >
              <div className="p-6">
                {/* Header with Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                      <BookOpenIcon />
                    </div>
                    <h3 className="text-lg font-semibold text-text font-heading group-hover:text-primary transition-colors duration-200">
                      {classItem.name}
                    </h3>
                  </div>
                </div>

                {/* Class Details */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-text/70 font-body">
                    <span className="font-medium">Chi nhánh:</span> {classItem.branchName}
                  </p>
                  {classItem.level && (
                    <div>
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                        Level {classItem.level}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons - Ẩn nếu là Teacher */}
                {!isTeacher && (
                  <div className="flex gap-2 pt-4 border-t border-text/10" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="secondary"
                      onClick={(e) => handleEdit(classItem, e)}
                      className="flex-1 text-xs py-2"
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={(e) => handleDelete(classItem, e)}
                      className="flex-1 text-xs py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      Xóa
                    </Button>
                  </div>
                )}
              </div>

              {/* Hover Indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
            </Card>
            ))}
          </div>
          {filteredClasses.length > pageSize && (
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-text/70">
                Hiển thị {pagedClasses.length} / {filteredClasses.length} lớp học
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-sm"
                >
                  Trước
                </Button>
                <span className="text-sm text-text/70">
                  Trang {currentPage}/{totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="text-sm"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <ClassFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        branchId={teacherBranchId || undefined}
      />

      {/* Edit Modal */}
      <ClassFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedClass(null);
        }}
        classItem={selectedClass}
        classId={selectedClass?.id.toString()}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setClassToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Xóa lớp học"
        message={`Bạn có chắc chắn muốn xóa lớp học "${classToDelete?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};


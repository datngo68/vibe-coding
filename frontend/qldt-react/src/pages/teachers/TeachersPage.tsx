import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Teacher, Branch } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { TeacherFormModal } from '../../components/teachers/TeacherFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { format } from 'date-fns';

// SVG Icons từ Heroicons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const AcademicCapIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7M5.176 9.032a12.083 12.083 0 011.665-6.479L12 14l-5.159 2.553a11.965 11.965 0 01-1.665-6.48zM18.824 9.032a11.965 11.965 0 01-1.665 6.48L12 14l5.159-2.947a12.076 12.076 0 011.665 6.479z" />
  </svg>
);

const EmptyStateIcon = () => (
  <svg className="w-16 h-16 mx-auto text-text/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14v7M5.176 9.032a12.083 12.083 0 011.665-6.479L12 14l-5.159 2.553a11.965 11.965 0 01-1.665-6.48zM18.824 9.032a11.965 11.965 0 01-1.665 6.48L12 14l5.159-2.947a12.076 12.076 0 011.665 6.479z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const EnvelopeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

export const TeachersPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  // Filters / search / sort / pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranchId, setFilterBranchId] = useState<number | 'all'>('all');
  const [sortKey, setSortKey] = useState<'name' | 'branchName' | 'email' | 'createdAt'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const { data: teachers, isLoading, error } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers');
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
  const filteredTeachers = useMemo(() => {
    if (!teachers) return [];
    let data = [...teachers];

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.email.toLowerCase().includes(term) ||
          t.branchName.toLowerCase().includes(term) ||
          (t.phone || '').toLowerCase().includes(term)
      );
    }

    if (filterBranchId !== 'all') {
      data = data.filter((t) => t.branchId === filterBranchId);
    }

    data.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name) * dir;
        case 'branchName':
          return a.branchName.localeCompare(b.branchName) * dir;
        case 'email':
          return a.email.localeCompare(b.email) * dir;
        case 'createdAt':
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
    });

    return data;
  }, [teachers, searchTerm, filterBranchId, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedTeachers = filteredTeachers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/teachers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsDeleteDialogOpen(false);
      setTeacherToDelete(null);
    },
  });

  const handleEdit = (teacher: Teacher, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTeacher(teacher);
    setIsEditModalOpen(true);
  };

  const handleDelete = (teacher: Teacher, e: React.MouseEvent) => {
    e.stopPropagation();
    setTeacherToDelete(teacher);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (teacherToDelete) {
      deleteMutation.mutate(teacherToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text/70 font-body">Đang tải danh sách giáo viên...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
          <p className="font-semibold mb-1">Lỗi khi tải dữ liệu</p>
          <p className="text-sm">Không thể tải danh sách giáo viên. Vui lòng thử lại sau.</p>
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
            Giáo viên
          </h1>
          <p className="text-sm text-text/60 font-body">
            Quản lý giáo viên của trung tâm
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <PlusIcon />
          <span>Thêm giáo viên mới</span>
        </Button>
      </div>

      {/* Toolbar: search, filters, sort, pagination size */}
      {teachers && teachers.length > 0 && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1 text-text">Tìm kiếm</label>
                <input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="input w-full"
                  placeholder="Tên, email, chi nhánh..."
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
                    <option value="name|asc">Tên giáo viên (A→Z)</option>
                    <option value="name|desc">Tên giáo viên (Z→A)</option>
                    <option value="branchName|asc">Chi nhánh (A→Z)</option>
                    <option value="branchName|desc">Chi nhánh (Z→A)</option>
                    <option value="email|asc">Email (A→Z)</option>
                    <option value="email|desc">Email (Z→A)</option>
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
      {!teachers || teachers.length === 0 ? (
        <div className="bg-background rounded-xl border-2 border-dashed border-text/20 p-12 sm:p-16 text-center">
          <EmptyStateIcon />
          <h3 className="text-lg font-semibold text-text font-heading mb-2 mt-4">
            Chưa có giáo viên nào
          </h3>
          <p className="text-text/60 font-body mb-6 max-w-md mx-auto">
            Bắt đầu bằng cách thêm giáo viên đầu tiên để quản lý lớp học và học sinh.
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <PlusIcon />
            <span>Thêm giáo viên đầu tiên</span>
          </Button>
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="bg-background rounded-xl border-2 border-dashed border-text/20 p-12 sm:p-16 text-center">
          <EmptyStateIcon />
          <h3 className="text-lg font-semibold text-text font-heading mb-2 mt-4">
            Không tìm thấy giáo viên
          </h3>
          <p className="text-text/60 font-body mb-6 max-w-md mx-auto">
            Không có giáo viên nào phù hợp với bộ lọc hiện tại.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm('');
              setFilterBranchId('all');
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
          {/* Teachers Grid */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-text/70">
              Hiển thị {pagedTeachers.length} / {filteredTeachers.length} giáo viên
            </div>
            {filteredTeachers.length > pageSize && (
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
            {pagedTeachers.map((teacher: Teacher) => (
            <Card
              key={teacher.id}
              onClick={() => navigate(`/teachers/${teacher.id}`)}
              className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            >
              <div className="p-6">
                {/* Header with Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                      <AcademicCapIcon />
                    </div>
                    <h3 className="text-lg font-semibold text-text font-heading group-hover:text-primary transition-colors duration-200">
                      {teacher.name}
                    </h3>
                  </div>
                </div>

                {/* Teacher Details */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-text/70 font-body">
                    <span className="font-medium">Chi nhánh:</span> {teacher.branchName}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-text/70 font-body">
                    <EnvelopeIcon />
                    <span className="break-words">{teacher.email}</span>
                  </div>
                  {teacher.phone && (
                    <div className="flex items-center gap-2 text-sm text-text/70 font-body">
                      <PhoneIcon />
                      <span>{teacher.phone}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-text/10" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="secondary"
                    onClick={(e) => handleEdit(teacher, e)}
                    className="flex-1 text-xs py-2"
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={(e) => handleDelete(teacher, e)}
                    className="flex-1 text-xs py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    Xóa
                  </Button>
                </div>
              </div>

              {/* Hover Indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
            </Card>
            ))}
          </div>
          {filteredTeachers.length > pageSize && (
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-text/70">
                Hiển thị {pagedTeachers.length} / {filteredTeachers.length} giáo viên
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
      <TeacherFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Modal */}
      <TeacherFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTeacher(null);
        }}
        teacher={selectedTeacher}
        teacherId={selectedTeacher?.id.toString()}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setTeacherToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Xóa giáo viên"
        message={`Bạn có chắc chắn muốn xóa giáo viên "${teacherToDelete?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

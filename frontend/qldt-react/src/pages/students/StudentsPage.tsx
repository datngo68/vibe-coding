import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { Student, Class, Branch } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StudentFormModal } from '../../components/students/StudentFormModal';
import { AssignParentModal } from '../../components/students/AssignParentModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

// SVG Icons từ Heroicons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const UserGroupIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const EmptyStateIcon = () => (
  <svg className="w-16 h-16 mx-auto text-text/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const StudentsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isAssignParentModalOpen, setIsAssignParentModalOpen] = useState(false);
  const [studentToAssignParent, setStudentToAssignParent] = useState<Student | null>(null);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  // Filters / search / sort / pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranchId, setFilterBranchId] = useState<number | 'all'>('all');
  const [sortKey, setSortKey] = useState<'name' | 'className' | 'dateOfBirth' | 'createdAt'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Check if user is Teacher
  const isTeacher = user?.role === 'Teacher';
  const isParent = user?.role === 'Parent';

  // Get classId from URL params
  useEffect(() => {
    const classIdParam = searchParams.get('classId');
    const action = searchParams.get('action');
    
    if (classIdParam) {
      setSelectedClassId(Number(classIdParam));
      if (action === 'add') {
        setIsCreateModalOpen(true);
      }
    }
  }, [searchParams]);

  const { data: classes, isLoading: isLoadingClasses } = useQuery<Class[]>({
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

  const { data: students, isLoading, error } = useQuery<Student[]>({
    queryKey: ['students', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const response = await api.get(`/students/class/${selectedClassId}`);
      return response.data;
    },
    enabled: !!selectedClassId && !isParent,
  });

  // Get all students for filtering (when no class selected)
  const { data: allStudents } = useQuery<Student[]>({
    queryKey: ['students', 'all'],
    queryFn: async () => {
      if (isParent && user?.id) {
        // Parent chỉ xem được học sinh của con mình
        const response = await api.get(`/users/${user.id}/students`);
        return response.data;
      }
      const response = await api.get('/students');
      return response.data;
    },
    enabled: !selectedClassId,
  });

  // Filtering / searching / sorting / pagination
  const studentsToDisplay = selectedClassId ? students : allStudents;
  const filteredStudents = useMemo(() => {
    if (!studentsToDisplay) return [];
    let data = [...studentsToDisplay];

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.className.toLowerCase().includes(term) ||
          (s.parentName || '').toLowerCase().includes(term) ||
          (s.parentPhone || '').toLowerCase().includes(term)
      );
    }

    if (filterBranchId !== 'all') {
      const branchClasses = classes?.filter((c) => c.branchId === filterBranchId).map((c) => c.id) || [];
      data = data.filter((s) => branchClasses.includes(s.classId));
    }

    data.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name) * dir;
        case 'className':
          return a.className.localeCompare(b.className) * dir;
        case 'dateOfBirth':
          const aDate = a.dateOfBirth ? new Date(a.dateOfBirth).getTime() : 0;
          const bDate = b.dateOfBirth ? new Date(b.dateOfBirth).getTime() : 0;
          return (aDate - bDate) * dir;
        case 'createdAt':
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
    });

    return data;
  }, [studentsToDisplay, searchTerm, filterBranchId, sortKey, sortDir, classes]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      if (selectedClassId) {
        queryClient.invalidateQueries({ queryKey: ['students', 'class', selectedClassId] });
      }
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    },
  });

  const handleEdit = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const handleDelete = (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      deleteMutation.mutate(studentToDelete.id);
    }
  };

  if (isLoadingClasses) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text/70 font-body">Đang tải danh sách lớp học...</p>
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
            Học sinh
          </h1>
          <p className="text-sm text-text/60 font-body">
            Quản lý học sinh của trung tâm
          </p>
        </div>
        {selectedClassId && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <PlusIcon />
            <span>Thêm học sinh</span>
          </Button>
        )}
      </div>

      {/* Class Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-text">
          Chọn lớp học
        </label>
        <select
          className="input w-full sm:w-64 min-h-[44px] touch-manipulation"
          value={selectedClassId || ''}
          onChange={(e) => {
            setSelectedClassId(Number(e.target.value) || null);
            setPage(1);
          }}
        >
          <option value="">-- Tất cả lớp --</option>
          {classes?.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} - {cls.branchName}
            </option>
          ))}
        </select>
      </div>

      {/* Toolbar: search, filters, sort, pagination size */}
      {studentsToDisplay && studentsToDisplay.length > 0 && (
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
                  placeholder="Tên học sinh, lớp, phụ huynh..."
                />
              </div>

              {!selectedClassId && (
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
              )}

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
                    <option value="name|asc">Tên học sinh (A→Z)</option>
                    <option value="name|desc">Tên học sinh (Z→A)</option>
                    <option value="className|asc">Lớp học (A→Z)</option>
                    <option value="className|desc">Lớp học (Z→A)</option>
                    <option value="dateOfBirth|desc">Ngày sinh (mới nhất)</option>
                    <option value="dateOfBirth|asc">Ngày sinh (cũ nhất)</option>
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text/70 font-body">Đang tải danh sách học sinh...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
          <p className="font-semibold mb-1">Lỗi khi tải dữ liệu</p>
          <p className="text-sm">Không thể tải danh sách học sinh. Vui lòng thử lại sau.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!studentsToDisplay || studentsToDisplay.length === 0) && (
        <div className="bg-background rounded-xl border-2 border-dashed border-text/20 p-12 sm:p-16 text-center">
          <EmptyStateIcon />
          <h3 className="text-lg font-semibold text-text font-heading mb-2 mt-4">
            {!selectedClassId ? 'Chọn lớp học để xem danh sách học sinh' : 'Chưa có học sinh nào'}
          </h3>
          <p className="text-text/60 font-body mb-6 max-w-md mx-auto">
            {!selectedClassId
              ? 'Vui lòng chọn một lớp học từ danh sách ở trên để xem và quản lý học sinh.'
              : 'Bắt đầu bằng cách thêm học sinh đầu tiên vào lớp này.'}
          </p>
          {selectedClassId && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <PlusIcon />
              <span>Thêm học sinh đầu tiên</span>
            </Button>
          )}
        </div>
      )}

      {/* Students Grid */}
      {!isLoading && !error && filteredStudents.length === 0 && studentsToDisplay && studentsToDisplay.length > 0 ? (
        <div className="bg-background rounded-xl border-2 border-dashed border-text/20 p-12 sm:p-16 text-center">
          <EmptyStateIcon />
          <h3 className="text-lg font-semibold text-text font-heading mb-2 mt-4">
            Không tìm thấy học sinh
          </h3>
          <p className="text-text/60 font-body mb-6 max-w-md mx-auto">
            Không có học sinh nào phù hợp với bộ lọc hiện tại.
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
      ) : !isLoading && !error && filteredStudents.length > 0 ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-text/70">
              Hiển thị {pagedStudents.length} / {filteredStudents.length} học sinh
            </div>
            {filteredStudents.length > pageSize && (
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
            {pagedStudents.map((student: Student) => (
            <Card
              key={student.id}
              onClick={() => navigate(`/students/${student.id}`)}
              className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            >
              <div className="p-6">
                {/* Header with Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                      <UserGroupIcon />
                    </div>
                    <h3 className="text-lg font-semibold text-text font-heading group-hover:text-primary transition-colors duration-200">
                      {student.name}
                    </h3>
                  </div>
                </div>

                {/* Student Details */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-text/70 font-body">
                    <span className="font-medium">Lớp:</span> {student.className}
                  </p>
                  {student.dateOfBirth && (
                    <div className="flex items-center gap-2 text-sm text-text/70 font-body">
                      <CalendarIcon />
                      <span>{format(new Date(student.dateOfBirth), 'dd/MM/yyyy')}</span>
                    </div>
                  )}
                  {student.parentName && (
                    <p className="text-sm text-text/70 font-body">
                      <span className="font-medium">Phụ huynh:</span> {student.parentName}
                    </p>
                  )}
                  {student.parentPhone && (
                    <p className="text-sm text-text/70 font-body">
                      <span className="font-medium">Điện thoại:</span> {student.parentPhone}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-text/10" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="secondary"
                    onClick={(e) => handleEdit(student, e)}
                    className="flex-1 text-xs py-2"
                  >
                    Sửa
                  </Button>
                  {isTeacher && (
                    <Button
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStudentToAssignParent(student);
                        setIsAssignParentModalOpen(true);
                      }}
                      className="flex-1 text-xs py-2"
                    >
                      Gán phụ huynh
                    </Button>
                  )}
                  {!isTeacher && (
                    <Button
                      variant="secondary"
                      onClick={(e) => handleDelete(student, e)}
                      className="flex-1 text-xs py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      Xóa
                    </Button>
                  )}
                </div>
              </div>

              {/* Hover Indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
            </Card>
            ))}
          </div>
          {filteredStudents.length > pageSize && (
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-text/70">
                Hiển thị {pagedStudents.length} / {filteredStudents.length} học sinh
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
      ) : null}

      {/* Create Modal */}
      <StudentFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        classId={selectedClassId || undefined}
      />

      {/* Edit Modal */}
      <StudentFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        studentId={selectedStudent?.id.toString()}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setStudentToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Xóa học sinh"
        message={`Bạn có chắc chắn muốn xóa học sinh "${studentToDelete?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

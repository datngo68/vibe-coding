import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Attendance, Lesson, Class, Student } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { format } from 'date-fns';

const EmptyStateIcon = () => (
  <svg className="w-16 h-16 mx-auto text-text/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

type AttendanceWithLesson = Attendance & {
  lessonDate: string;
  lessonNumber: number;
  className: string;
};

export const AttendancePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState<Attendance | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  // Filters / search / sort / pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassId, setFilterClassId] = useState<number | 'all'>('all');
  const [filterLessonId, setFilterLessonId] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Present' | 'Absent' | 'Late'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortKey, setSortKey] = useState<'studentName' | 'lessonDate' | 'status' | 'createdAt'>('lessonDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes');
      return response.data;
    },
  });

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ['lessons'],
    queryFn: async () => {
      const response = await api.get('/lessons');
      return response.data;
    },
  });

  // Fetch attendances for all lessons
  const { data: allAttendances, isLoading } = useQuery<AttendanceWithLesson[]>({
    queryKey: ['attendances', 'all'],
    queryFn: async () => {
      if (!lessons || lessons.length === 0) return [];
      
      const attendancePromises = lessons.map(async (lesson) => {
        try {
          const response = await api.get(`/attendance/lesson/${lesson.id}`);
          const attendances: Attendance[] = response.data;
          return attendances.map((att) => ({
            ...att,
            lessonDate: lesson.date,
            lessonNumber: lesson.lessonNumber,
            className: lesson.className,
          }));
        } catch (error) {
          return [];
        }
      });

      const results = await Promise.all(attendancePromises);
      return results.flat();
    },
    enabled: !!lessons,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/attendance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      setIsDeleteDialogOpen(false);
      setAttendanceToDelete(null);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => api.delete(`/attendance/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      setSelectedIds(new Set());
    },
  });

  const handleDelete = (attendance: Attendance) => {
    setAttendanceToDelete(attendance);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.size} điểm danh đã chọn?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAttendances.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAttendances.map((a) => a.id)));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const filteredAttendances = useMemo(() => {
    let data = allAttendances || [];

    if (filterClassId !== 'all') {
      const classLessons = lessons?.filter((l) => l.classId === filterClassId).map((l) => l.id) || [];
      data = data.filter((a) => classLessons.includes(a.lessonId));
    }

    if (filterLessonId !== 'all') {
      data = data.filter((a) => a.lessonId === filterLessonId);
    }

    if (filterStatus !== 'all') {
      data = data.filter((a) => a.status === filterStatus);
    }

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      data = data.filter((a) => new Date(a.lessonDate).getTime() >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo).getTime();
      data = data.filter((a) => new Date(a.lessonDate).getTime() <= to);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter(
        (a) =>
          a.studentName.toLowerCase().includes(term) ||
          a.className.toLowerCase().includes(term) ||
          (a.note || '').toLowerCase().includes(term)
      );
    }

    data.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'studentName':
          return a.studentName.localeCompare(b.studentName) * dir;
        case 'status':
          return a.status.localeCompare(b.status) * dir;
        case 'createdAt':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
        case 'lessonDate':
        default:
          return (new Date(a.lessonDate).getTime() - new Date(b.lessonDate).getTime()) * dir;
      }
    });

    return data;
  }, [allAttendances, lessons, filterClassId, filterLessonId, filterStatus, dateFrom, dateTo, searchTerm, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredAttendances.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedAttendances = filteredAttendances.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Present':
        return <CheckCircleIcon />;
      case 'Absent':
        return <XCircleIcon />;
      case 'Late':
        return <ClockIcon />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Present':
        return 'Có mặt';
      case 'Absent':
        return 'Vắng mặt';
      case 'Late':
        return 'Đi muộn';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredLessons = useMemo(() => {
    if (!lessons) return [];
    if (filterClassId === 'all') return lessons;
    return lessons.filter((l) => l.classId === filterClassId);
  }, [lessons, filterClassId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading mb-1">
            Quản lý điểm danh
          </h1>
          <p className="text-sm text-text/60 font-body">
            Xem và quản lý điểm danh học sinh
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/attendance/quick')}
            className="flex items-center gap-2"
          >
            Điểm danh nhanh
          </Button>
        </div>
      </div>

      {/* Toolbar: search, filters, sort, pagination size, bulk delete */}
      <Card className="mb-6 p-4 sm:p-5">
        <div className="md:hidden flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-text">Tìm kiếm nâng cao</h3>
          <Button
            variant="secondary"
            onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
            className="text-sm py-1 px-3"
          >
            {isAdvancedSearchOpen ? 'Thu gọn' : 'Mở rộng'}
          </Button>
        </div>
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isAdvancedSearchOpen ? 'max-h-screen' : 'max-h-0 md:max-h-full'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Tìm kiếm</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="input w-full min-h-[44px] touch-manipulation"
                placeholder="Tên học sinh, lớp học..."
              />
            </div>

            {/* Filter by Class */}
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Lọc theo lớp</label>
              <select
                value={filterClassId}
                onChange={(e) => {
                  setFilterClassId(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setFilterLessonId('all');
                  setPage(1);
                }}
                className="input w-full min-h-[44px] touch-manipulation"
              >
                <option value="all">Tất cả lớp</option>
                {classes?.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Lesson */}
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Lọc theo buổi học</label>
              <select
                value={filterLessonId}
                onChange={(e) => {
                  setFilterLessonId(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setPage(1);
                }}
                className="input w-full min-h-[44px] touch-manipulation"
                disabled={filterClassId === 'all'}
              >
                <option value="all">Tất cả buổi học</option>
                {filteredLessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {format(new Date(lesson.date), 'dd/MM/yyyy')} - Buổi {lesson.lessonNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Lọc theo trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as typeof filterStatus);
                  setPage(1);
                }}
                className="input w-full min-h-[44px] touch-manipulation"
              >
                <option value="all">Tất cả</option>
                <option value="Present">Có mặt</option>
                <option value="Absent">Vắng mặt</option>
                <option value="Late">Đi muộn</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Từ ngày</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="input w-full min-h-[44px] touch-manipulation"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Đến ngày</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="input w-full min-h-[44px] touch-manipulation"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Sắp xếp theo</label>
              <select
                value={sortKey}
                onChange={(e) => {
                  setSortKey(e.target.value as typeof sortKey);
                  setPage(1);
                }}
                className="input w-full min-h-[44px] touch-manipulation"
              >
                <option value="lessonDate">Ngày học</option>
                <option value="studentName">Tên học sinh</option>
                <option value="status">Trạng thái</option>
                <option value="createdAt">Ngày tạo</option>
              </select>
            </div>

            {/* Sort Direction */}
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Thứ tự</label>
              <select
                value={sortDir}
                onChange={(e) => {
                  setSortDir(e.target.value as typeof sortDir);
                  setPage(1);
                }}
                className="input w-full min-h-[44px] touch-manipulation"
              >
                <option value="asc">Tăng dần</option>
                <option value="desc">Giảm dần</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Page Size */}
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Số lượng/trang</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="input w-full min-h-[44px] touch-manipulation"
              >
                <option value={6}>6</option>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setFilterClassId('all');
                  setFilterLessonId('all');
                  setFilterStatus('all');
                  setDateFrom('');
                  setDateTo('');
                  setSortKey('lessonDate');
                  setSortDir('desc');
                  setPage(1);
                }}
                className="text-sm py-2 px-4"
              >
                Đặt lại lọc
              </Button>
              <Button
                variant="secondary"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || bulkDeleteMutation.isPending}
                className="text-sm py-2 px-4 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 whitespace-nowrap"
              >
                Xóa đã chọn ({selectedIds.size})
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Attendance List */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <p className="text-text/60 font-body">Đang tải...</p>
        </Card>
      ) : pagedAttendances.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyStateIcon />
          <p className="text-text/60 font-body mb-2">
            {filteredAttendances.length === 0 && allAttendances && allAttendances.length > 0
              ? 'Không tìm thấy điểm danh nào phù hợp với bộ lọc.'
              : 'Chưa có điểm danh nào.'}
          </p>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Card className="p-0">
              <table className="w-full">
                <thead className="bg-background">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredAttendances.length && filteredAttendances.length > 0}
                        onChange={toggleSelectAll}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Học sinh</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Lớp học</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Buổi học</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Ngày</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Ghi chú</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-text/10">
                  {pagedAttendances.map((attendance) => (
                    <tr
                      key={attendance.id}
                      className="hover:bg-background transition-colors duration-150"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(attendance.id)}
                          onChange={() => toggleSelectRow(attendance.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-text font-medium">{attendance.studentName}</td>
                      <td className="px-4 py-3 text-sm text-text/70">{attendance.className}</td>
                      <td className="px-4 py-3 text-sm text-text/70">Buổi {attendance.lessonNumber}</td>
                      <td className="px-4 py-3 text-sm text-text/70">
                        {format(new Date(attendance.lessonDate), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                            attendance.status
                          )}`}
                        >
                          {getStatusIcon(attendance.status)}
                          {getStatusLabel(attendance.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text/70 max-w-xs truncate">
                        {attendance.note || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="secondary"
                          onClick={() => handleDelete(attendance)}
                          className="text-sm py-1 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          Xóa
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {pagedAttendances.map((attendance) => (
              <Card key={attendance.id} className="p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text font-heading text-base mb-1">
                      {attendance.studentName}
                    </h3>
                    <p className="text-sm text-text/70 font-body">{attendance.className}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(attendance.id)}
                    onChange={() => toggleSelectRow(attendance.id)}
                    className="cursor-pointer flex-shrink-0 mt-1"
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text/70">Buổi học:</span>
                    <span className="font-medium text-text">
                      Buổi {attendance.lessonNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text/70">Ngày:</span>
                    <span className="font-medium text-text">
                      {format(new Date(attendance.lessonDate), 'dd/MM/yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text/70">Trạng thái:</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(
                        attendance.status
                      )}`}
                    >
                      {getStatusIcon(attendance.status)}
                      {getStatusLabel(attendance.status)}
                    </span>
                  </div>
                  {attendance.note && (
                    <div>
                      <span className="text-text/70">Ghi chú: </span>
                      <span className="text-text">{attendance.note}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-text/10">
                  <Button
                    variant="secondary"
                    onClick={() => handleDelete(attendance)}
                    className="w-full text-sm py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    Xóa
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-text/70 font-body">
                Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredAttendances.length)} trong tổng số {filteredAttendances.length} điểm danh
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="min-h-[44px] touch-manipulation"
                >
                  Trước
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'primary' : 'secondary'}
                        onClick={() => setPage(pageNum)}
                        className="min-h-[44px] min-w-[44px] touch-manipulation"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="min-h-[44px] touch-manipulation"
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setAttendanceToDelete(null);
        }}
        onConfirm={() => {
          if (attendanceToDelete) {
            deleteMutation.mutate(attendanceToDelete.id);
          }
        }}
        title="Xóa điểm danh"
        message={`Bạn có chắc chắn muốn xóa điểm danh của học sinh "${attendanceToDelete?.studentName}"?`}
        variant="danger"
      />
    </div>
  );
};

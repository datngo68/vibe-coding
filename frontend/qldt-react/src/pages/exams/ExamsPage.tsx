import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { Exam, Class, Teacher } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ExamFormModal } from '../../components/exams/ExamFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { format } from 'date-fns';

// SVG Icons từ Heroicons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const DocumentTextIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const EmptyStateIcon = () => (
  <svg className="w-16 h-16 mx-auto text-text/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const AcademicCapIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7M5.176 9.032a12.083 12.083 0 011.665-6.479L12 14l-5.159 2.553a11.965 11.965 0 01-1.665-6.48zM18.824 9.032a11.965 11.965 0 01-1.665 6.48L12 14l5.159-2.947a12.076 12.076 0 011.665 6.479z" />
  </svg>
);

const DocumentArrowDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export const ExamsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Filters / search / sort / pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState<number | 'all'>('all');
  const [filterExamType, setFilterExamType] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortKey, setSortKey] = useState<'className' | 'examType' | 'date' | 'teacherName'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Read classId and action from URL query params
  useEffect(() => {
    const classIdParam = searchParams.get('classId');
    const action = searchParams.get('action');
    if (classIdParam) {
      setSelectedClassId(Number(classIdParam));
    }
    if (action === 'new' || action === 'add') {
      setIsCreateModalOpen(true);
      // Remove action param after opening modal
      if (classIdParam) {
        navigate(`/exams?classId=${classIdParam}`, { replace: true });
      } else {
        navigate('/exams', { replace: true });
      }
    }
  }, [searchParams, navigate]);

  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes');
      return response.data;
    },
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers');
      return response.data;
    },
  });

  const { data: exams, isLoading, error } = useQuery<Exam[]>({
    queryKey: ['exams', selectedClassId],
    queryFn: async () => {
      if (selectedClassId) {
        const response = await api.get(`/exams/class/${selectedClassId}`);
        return response.data;
      }
      const response = await api.get('/exams');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/exams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      if (selectedClassId) {
        queryClient.invalidateQueries({ queryKey: ['exams', 'class', selectedClassId.toString()] });
      }
      setIsDeleteDialogOpen(false);
      setExamToDelete(null);
    },
  });

  const handleEdit = (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedExam(exam);
    setIsEditModalOpen(true);
  };

  const handleDelete = (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation();
    setExamToDelete(exam);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (examToDelete) {
      deleteMutation.mutate(examToDelete.id);
    }
  };

  const handleExport = async (examId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.get(`/export/exam/${examId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Exam_${examId}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Filtering / searching / sorting / pagination
  const filteredExams = useMemo(() => {
    if (!exams) return [];
    let data = [...exams];

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter(
        (e) =>
          e.className.toLowerCase().includes(term) ||
          e.examType.toLowerCase().includes(term) ||
          e.teacherName.toLowerCase().includes(term)
      );
    }

    if (filterTeacherId !== 'all') {
      data = data.filter((e) => e.teacherId === filterTeacherId);
    }

    if (filterExamType !== 'all') {
      data = data.filter((e) => e.examType === filterExamType);
    }

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      data = data.filter((e) => new Date(e.date).getTime() >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo).getTime();
      data = data.filter((e) => new Date(e.date).getTime() <= to);
    }

    data.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'className':
          return a.className.localeCompare(b.className) * dir;
        case 'examType':
          return a.examType.localeCompare(b.examType) * dir;
        case 'teacherName':
          return a.teacherName.localeCompare(b.teacherName) * dir;
        case 'date':
        default:
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
      }
    });

    return data;
  }, [exams, searchTerm, filterTeacherId, filterExamType, dateFrom, dateTo, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedExams = filteredExams.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Get unique exam types
  const examTypes = useMemo(() => {
    if (!exams) return [];
    return Array.from(new Set(exams.map((e) => e.examType))).sort();
  }, [exams]);

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    const newSet = new Set<number>();
    pagedExams.forEach((e) => newSet.add(e.id));
    setSelectedIds(newSet);
  };

  const toggleSelectRow = (examId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(examId)) next.delete(examId);
      else next.add(examId);
      return next;
    });
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => api.delete(`/exams/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      if (selectedClassId) {
        queryClient.invalidateQueries({ queryKey: ['exams', 'class', selectedClassId.toString()] });
      }
      setSelectedIds(new Set());
    },
  });

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteMutation.mutate(Array.from(selectedIds));
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text/70 font-body">Đang tải danh sách bài kiểm tra...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
          <p className="font-semibold mb-1">Lỗi khi tải dữ liệu</p>
          <p className="text-sm">Không thể tải danh sách bài kiểm tra. Vui lòng thử lại sau.</p>
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
            Bài kiểm tra
          </h1>
          <p className="text-sm text-text/60 font-body">
            Quản lý các bài kiểm tra của lớp học
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
          disabled={!selectedClassId}
        >
          <PlusIcon />
          <span>Tạo bài kiểm tra mới</span>
        </Button>
      </div>

      {/* Filter by Class */}
      <div className="mb-6">
        <label htmlFor="classFilter" className="block text-sm font-medium mb-2 text-text">
          Lọc theo lớp học
        </label>
        <select
          id="classFilter"
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
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {/* Toolbar: search, filters, sort, pagination size, bulk delete */}
      {exams && exams.length > 0 && (
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
                  placeholder="Tên lớp, loại bài, giáo viên..."
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1 text-text">Giáo viên</label>
                <select
                  className="input w-full"
                  value={filterTeacherId === 'all' ? '' : filterTeacherId}
                  onChange={(e) => {
                    setFilterTeacherId(e.target.value ? Number(e.target.value) : 'all');
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả</option>
                  {teachers?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1 text-text">Loại bài</label>
                <select
                  className="input w-full"
                  value={filterExamType}
                  onChange={(e) => {
                    setFilterExamType(e.target.value || 'all');
                    setPage(1);
                  }}
                >
                  <option value="all">Tất cả</option>
                  {examTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1 text-text">Từ ngày</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-text">Đến ngày</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex gap-2">
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
                    <option value="date|desc">Ngày mới nhất</option>
                    <option value="date|asc">Ngày cũ nhất</option>
                    <option value="className|asc">Tên lớp (A→Z)</option>
                    <option value="className|desc">Tên lớp (Z→A)</option>
                    <option value="examType|asc">Loại bài (A→Z)</option>
                    <option value="examType|desc">Loại bài (Z→A)</option>
                    <option value="teacherName|asc">Giáo viên (A→Z)</option>
                    <option value="teacherName|desc">Giáo viên (Z→A)</option>
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

              <div className="flex items-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterTeacherId('all');
                    setFilterExamType('all');
                    setDateFrom('');
                    setDateTo('');
                    setSortKey('date');
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
      )}

      {/* Empty State */}
      {!exams || exams.length === 0 ? (
        <div className="bg-background rounded-xl border-2 border-dashed border-text/20 p-12 sm:p-16 text-center">
          <EmptyStateIcon />
          <h3 className="text-lg font-semibold text-text font-heading mb-2 mt-4">
            Chưa có bài kiểm tra nào
          </h3>
          <p className="text-text/60 font-body mb-6 max-w-md mx-auto">
            {selectedClassId
              ? 'Bắt đầu bằng cách tạo bài kiểm tra đầu tiên cho lớp học này.'
              : 'Chọn một lớp học để xem danh sách bài kiểm tra hoặc tạo bài kiểm tra mới.'}
          </p>
          {selectedClassId && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <PlusIcon />
              <span>Tạo bài kiểm tra đầu tiên</span>
            </Button>
          )}
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-background rounded-xl border-2 border-dashed border-text/20 p-12 sm:p-16 text-center">
          <EmptyStateIcon />
          <h3 className="text-lg font-semibold text-text font-heading mb-2 mt-4">
            Không tìm thấy bài kiểm tra
          </h3>
          <p className="text-text/60 font-body mb-6 max-w-md mx-auto">
            Không có bài kiểm tra nào phù hợp với bộ lọc hiện tại.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm('');
              setFilterTeacherId('all');
              setFilterExamType('all');
              setDateFrom('');
              setDateTo('');
              setPage(1);
            }}
          >
            Đặt lại lọc
          </Button>
        </div>
      ) : (
        <>
          {/* Exams Grid */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-text/70">
              Hiển thị {pagedExams.length} / {filteredExams.length} bài kiểm tra
            </div>
            {filteredExams.length > pageSize && (
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
            {pagedExams.map((exam: Exam) => (
            <Card
              key={exam.id}
              className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="p-6">
                {/* Header with Icon and Checkbox */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer flex-shrink-0"
                      checked={selectedIds.has(exam.id)}
                      onChange={() => toggleSelectRow(exam.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="p-2 bg-secondary/10 rounded-lg text-secondary flex-shrink-0">
                      <DocumentTextIcon />
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => navigate(`/exams/${exam.id}`)}>
                      <h3 className="text-lg font-semibold text-text font-heading group-hover:text-primary transition-colors duration-200 cursor-pointer">
                        {exam.className}
                      </h3>
                      <p className="text-xs text-text/60 font-body">
                        {exam.examType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Exam Details */}
                <div className="space-y-2 mb-4" onClick={() => navigate(`/exams/${exam.id}`)}>
                  <div className="flex items-center gap-2 text-sm text-text/70 font-body cursor-pointer">
                    <CalendarIcon />
                    <span>{format(new Date(exam.date), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text/70 font-body cursor-pointer">
                    <AcademicCapIcon />
                    <span>{exam.teacherName}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-text/10" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="secondary"
                    onClick={(e) => handleEdit(exam, e)}
                    className="flex-1 text-xs py-2"
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={(e) => handleExport(exam.id, e)}
                    className="flex-1 text-xs py-2 flex items-center justify-center gap-1"
                  >
                    <DocumentArrowDownIcon />
                    <span>Xuất</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={(e) => handleDelete(exam, e)}
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
          {filteredExams.length > pageSize && (
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-text/70">
                Hiển thị {pagedExams.length} / {filteredExams.length} bài kiểm tra
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
      <ExamFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        classId={selectedClassId || undefined}
      />

      {/* Edit Modal */}
      <ExamFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedExam(null);
        }}
        exam={selectedExam}
        classId={selectedExam?.classId}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setExamToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Xóa bài kiểm tra"
        message={`Bạn có chắc chắn muốn xóa bài kiểm tra "${examToDelete?.examType}" của lớp "${examToDelete?.className}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

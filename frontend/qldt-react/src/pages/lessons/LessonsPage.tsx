import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { Lesson, Class } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LessonFormModal } from '../../components/lessons/LessonFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { format } from 'date-fns';

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

export const LessonsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  // Filters / search / sort / pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<'className' | 'date' | 'lessonNumber' | 'teacherName'>('date');
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
        navigate(`/lessons?classId=${classIdParam}`, { replace: true });
      } else {
        navigate('/lessons', { replace: true });
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

  const { data: lessons, isLoading, error } = useQuery<Lesson[]>({
    queryKey: ['lessons', selectedClassId],
    queryFn: async () => {
      if (selectedClassId) {
        const response = await api.get(`/lessons/class/${selectedClassId}`);
        return response.data;
      }
      const response = await api.get('/lessons');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/lessons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      if (selectedClassId) {
        queryClient.invalidateQueries({ queryKey: ['lessons', 'class', selectedClassId.toString()] });
      }
      setIsDeleteDialogOpen(false);
      setLessonToDelete(null);
    },
  });

  const handleEdit = (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLesson(lesson);
    setIsEditModalOpen(true);
  };

  const handleDelete = (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation();
    setLessonToDelete(lesson);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (lessonToDelete) {
      deleteMutation.mutate(lessonToDelete.id);
    }
  };

  const handleExport = async (lessonId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await api.get(`/export/lesson/${lessonId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Lesson_${lessonId}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Filtering / searching / sorting / pagination
  const filteredLessons = useMemo(() => {
    if (!lessons) return [];
    let data = [...lessons];

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter(
        (l) =>
          l.className.toLowerCase().includes(term) ||
          l.teacherName.toLowerCase().includes(term) ||
          l.title?.toLowerCase().includes(term) ||
          l.lessonNumber.toString().includes(term)
      );
    }

    data.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'className':
          return a.className.localeCompare(b.className) * dir;
        case 'teacherName':
          return a.teacherName.localeCompare(b.teacherName) * dir;
        case 'lessonNumber':
          return (a.lessonNumber - b.lessonNumber) * dir;
        case 'date':
        default:
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir;
      }
    });

    return data;
  }, [lessons, searchTerm, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedLessons = filteredLessons.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text/70 font-body">Đang tải danh sách buổi học...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
          <p className="font-semibold mb-1">Lỗi khi tải dữ liệu</p>
          <p className="text-sm">Không thể tải danh sách buổi học. Vui lòng thử lại sau.</p>
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
            Buổi học
          </h1>
          <p className="text-sm text-text/60 font-body">
            Quản lý các buổi học của lớp học
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <PlusIcon />
          <span>Tạo buổi học mới</span>
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

      {/* Toolbar: search, sort, pagination size */}
      {lessons && lessons.length > 0 && (
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
                  placeholder="Tên lớp, giáo viên, số buổi..."
                />
              </div>

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
                    <option value="lessonNumber|asc">Số buổi (tăng dần)</option>
                    <option value="lessonNumber|desc">Số buổi (giảm dần)</option>
                    <option value="className|asc">Tên lớp (A→Z)</option>
                    <option value="className|desc">Tên lớp (Z→A)</option>
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

              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setSortKey('date');
                    setSortDir('desc');
                    setPage(1);
                  }}
                  className="text-sm py-2 px-4 w-full"
                >
                  Đặt lại lọc
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!lessons || lessons.length === 0 ? (
        <div className="bg-background rounded-xl border-2 border-dashed border-text/20 p-12 sm:p-16 text-center">
          <EmptyStateIcon />
          <h3 className="text-lg font-semibold text-text font-heading mb-2 mt-4">
            Chưa có buổi học nào
          </h3>
          <p className="text-text/60 font-body mb-6 max-w-md mx-auto">
            {selectedClassId
              ? 'Bắt đầu bằng cách tạo buổi học đầu tiên cho lớp học này.'
              : 'Chọn một lớp học để xem danh sách buổi học hoặc tạo buổi học mới.'}
          </p>
          {selectedClassId && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <PlusIcon />
              <span>Tạo buổi học đầu tiên</span>
            </Button>
          )}
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-background rounded-xl border-2 border-dashed border-text/20 p-12 sm:p-16 text-center">
          <EmptyStateIcon />
          <h3 className="text-lg font-semibold text-text font-heading mb-2 mt-4">
            Không tìm thấy buổi học
          </h3>
          <p className="text-text/60 font-body mb-6 max-w-md mx-auto">
            Không có buổi học nào phù hợp với bộ lọc hiện tại.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setSearchTerm('');
              setSortKey('date');
              setSortDir('desc');
              setPage(1);
            }}
          >
            Đặt lại lọc
          </Button>
        </div>
      ) : (
        <>
          {/* Lessons Grid */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-text/70">
              Hiển thị {pagedLessons.length} / {filteredLessons.length} buổi học
            </div>
            {filteredLessons.length > pageSize && (
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
            {pagedLessons.map((lesson: Lesson) => (
            <Card
              key={lesson.id}
              onClick={() => navigate(`/lessons/${lesson.id}`)}
              className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            >
              <div className="p-6">
                {/* Header with Icon */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                      <BookOpenIcon />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text font-heading group-hover:text-primary transition-colors duration-200">
                        {lesson.className}
                      </h3>
                      <p className="text-xs text-text/60 font-body">
                        Buổi số {lesson.lessonNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lesson Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-text/70 font-body">
                    <CalendarIcon />
                    <span>{format(new Date(lesson.date), 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text/70 font-body">
                    <AcademicCapIcon />
                    <span>{lesson.teacherName}</span>
                  </div>
                  {lesson.vocabulary && lesson.vocabulary.length > 0 && (
                    <p className="text-sm text-text/70 font-body">
                      <span className="font-medium">Từ vựng:</span> {lesson.vocabulary.length} từ
                    </p>
                  )}
                  {lesson.homework && lesson.homework.length > 0 && (
                    <p className="text-sm text-text/70 font-body">
                      <span className="font-medium">Bài tập:</span> {lesson.homework.length} bài
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-text/10" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="secondary"
                    onClick={(e) => handleEdit(lesson, e)}
                    className="flex-1 text-xs py-2"
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={(e) => handleExport(lesson.id, e)}
                    className="flex-1 text-xs py-2 flex items-center justify-center gap-1"
                  >
                    <DocumentArrowDownIcon />
                    <span>Xuất</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={(e) => handleDelete(lesson, e)}
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
          {filteredLessons.length > pageSize && (
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-text/70">
                Hiển thị {pagedLessons.length} / {filteredLessons.length} buổi học
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
      <LessonFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        classId={selectedClassId || undefined}
      />

      {/* Edit Modal */}
      <LessonFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedLesson(null);
        }}
        lesson={selectedLesson}
        classId={selectedLesson?.classId}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setLessonToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Xóa buổi học"
        message={`Bạn có chắc chắn muốn xóa buổi học số ${lessonToDelete?.lessonNumber} của lớp "${lessonToDelete?.className}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

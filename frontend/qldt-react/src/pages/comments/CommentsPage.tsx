import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { DailyComment, Lesson, Class, Student } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { CreateSharedLinkModal } from '../../components/shared-links/CreateSharedLinkModal';
import { format } from 'date-fns';

const EmptyStateIcon = () => (
    <svg className="w-16 h-16 mx-auto text-text/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

const DocumentArrowDownIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const BookOpenIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const CalendarIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const AcademicCapIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7M5.176 9.032a12.083 12.083 0 011.665-6.479L12 14l-5.159 2.553a11.965 11.965 0 01-1.665-6.48zM18.824 9.032a11.965 11.965 0 01-1.665 6.48L12 14l5.159-2.947a12.076 12.076 0 011.665 6.479z" />
    </svg>
);

const BuildingOfficeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const LinkIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

type CommentRow = {
    studentId: number;
    studentName: string;
    commentId?: number;
    vocabularyScore: string;
    schoolExamScore: string;
    homeworkStatus: string;
    comment: string;
    createdAt?: string;
};

export const CommentsPage = () => {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize state from URL params
    const classIdParam = searchParams.get('classId');
    const lessonIdParam = searchParams.get('lessonId');
    const initialClassId = classIdParam ? (Number(classIdParam) || null) : null;
    const initialLessonId = lessonIdParam ? (Number(lessonIdParam) || null) : null;

    const [selectedClassId, setSelectedClassId] = useState<number | null>(initialClassId);
    const [selectedLessonId, setSelectedLessonId] = useState<number | null>(initialLessonId);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState<DailyComment | null>(null);
    const [rowEdits, setRowEdits] = useState<Record<number, Partial<CommentRow>>>({});
    const [savingRowId, setSavingRowId] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false); // For mobile collapse
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // Filters / search / sort / pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStudentId, setFilterStudentId] = useState<number | 'all'>('all');
    const [filterTeacher, setFilterTeacher] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [sortKey, setSortKey] = useState<'studentName' | 'vocabularyScore' | 'schoolExamScore' | 'createdAt'>('studentName');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Sync state with URL params when they change externally
    useEffect(() => {
        const currentClassIdParam = searchParams.get('classId');
        const currentLessonIdParam = searchParams.get('lessonId');
        const newClassId = currentClassIdParam ? (Number(currentClassIdParam) || null) : null;
        const newLessonId = currentLessonIdParam ? (Number(currentLessonIdParam) || null) : null;

        if (newClassId !== selectedClassId) {
            setSelectedClassId(newClassId);
            if (!newClassId) {
                setSelectedLessonId(null);
            } else if (newLessonId && newLessonId !== selectedLessonId) {
                setSelectedLessonId(newLessonId);
            }
        } else if (newLessonId !== selectedLessonId) {
            setSelectedLessonId(newLessonId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const { data: classes } = useQuery<Class[]>({
        queryKey: ['classes'],
        queryFn: async () => {
            const response = await api.get('/classes');
            return response.data;
        },
    });

    const { data: lessons } = useQuery<Lesson[]>({
        queryKey: ['lessons', selectedClassId],
        queryFn: async () => {
            if (!selectedClassId) return [];
            const response = await api.get(`/lessons/class/${selectedClassId}`);
            return response.data;
        },
        enabled: !!selectedClassId,
    });

    const { data: comments, isLoading, error } = useQuery<DailyComment[]>({
        queryKey: ['comments', selectedLessonId],
        queryFn: async () => {
            if (!selectedLessonId) return [];
            const response = await api.get(`/comments/lesson/${selectedLessonId}`);
            return response.data;
        },
        enabled: !!selectedLessonId,
    });

    // Fetch students of selected lesson's class for inline entry
    const currentLesson = useMemo(
        () => lessons?.find((l) => l.id === selectedLessonId),
        [lessons, selectedLessonId]
    );

    // Get selected class info
    const selectedClass = useMemo(
        () => classes?.find((c) => c.id === selectedClassId),
        [classes, selectedClassId]
    );

    const { data: students } = useQuery<Student[]>({
        queryKey: ['students', 'class', currentLesson?.classId],
        queryFn: async () => {
            if (!currentLesson?.classId) return [];
            const response = await api.get(`/students/class/${currentLesson.classId}`);
            return response.data;
        },
        enabled: !!currentLesson?.classId,
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/comments/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments'] });
            if (selectedLessonId) {
                queryClient.invalidateQueries({ queryKey: ['comments', 'lesson', selectedLessonId.toString()] });
            }
            setIsDeleteDialogOpen(false);
            setCommentToDelete(null);
        },
    });

    const upsertMutation = useMutation({
        mutationFn: async (payload: {
            commentId?: number;
            lessonId: number;
            studentId: number;
            vocabularyScore?: number;
            schoolExamScore?: number;
            homeworkStatus?: string;
            comment?: string;
        }) => {
            const { commentId, ...data } = payload;
            if (commentId) {
                const response = await api.put(`/comments/${commentId}`, data);
                return response.data;
            } else {
                const response = await api.post(`/comments`, data);
                return response.data;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', selectedLessonId] });
            setSavingRowId(null);
        },
        onError: () => {
            setSavingRowId(null);
        },
    });

    const handleDelete = (comment: DailyComment, e: React.MouseEvent) => {
        e.stopPropagation();
        setCommentToDelete(comment);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (commentToDelete) {
            setSavingRowId(commentToDelete.studentId);
            deleteMutation.mutate(commentToDelete.id, {
                onSettled: () => setSavingRowId(null),
            });
        }
    };

    const handleExport = async () => {
        if (!selectedLessonId) return;
        try {
            const response = await api.get(`/export/comments/${selectedLessonId}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Comments_${selectedLessonId}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const baseRows = useMemo(() => {
        if (!students) return [];
        const commentMap = new Map<number, DailyComment>();
        comments?.forEach((c) => commentMap.set(c.studentId, c));
        return students.map((student) => {
            const c = commentMap.get(student.id);
            return {
                studentId: student.id,
                studentName: student.name,
                commentId: c?.id,
                vocabularyScore: c?.vocabularyScore?.toString() || '',
                schoolExamScore: c?.schoolExamScore?.toString() || '',
                homeworkStatus: c?.homeworkStatus || '',
                comment: c?.comment || '',
                createdAt: c?.createdAt,
            } as CommentRow;
        });
    }, [students, comments]);

    const rows = useMemo(() => {
        return baseRows.map((row) => ({
            ...row,
            ...(rowEdits[row.studentId] || {}),
        }));
    }, [baseRows, rowEdits]);

    const handleRowChange = (
        studentId: number,
        field: keyof Omit<CommentRow, 'studentId' | 'studentName' | 'commentId'>,
        value: string,
    ) => {
        setRowEdits((prev) => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [field]: value,
            },
        }));
    };

    const handleSaveRow = (row: CommentRow) => {
        if (!selectedLessonId) return;
        const parseScore = (v: string) => {
            if (v === '') return undefined;
            const n = Number(v);
            if (isNaN(n) || n < 0 || n > 10) return 'invalid';
            return n;
        };
        const vocab = parseScore(row.vocabularyScore);
        const school = parseScore(row.schoolExamScore);
        if (vocab === 'invalid' || school === 'invalid') {
            alert('Điểm phải trong khoảng 0 - 10 (có thể để trống).');
            return;
        }

        setSavingRowId(row.studentId);
        upsertMutation.mutate(
            {
                commentId: row.commentId,
                lessonId: selectedLessonId,
                studentId: row.studentId,
                vocabularyScore: vocab as number | undefined,
                schoolExamScore: school as number | undefined,
                homeworkStatus: row.homeworkStatus || undefined,
                comment: row.comment.trim() || undefined,
            },
            {
                onSuccess: () => {
                    setRowEdits((prev) => {
                        const next = { ...prev };
                        delete next[row.studentId];
                        return next;
                    });
                },
            }
        );
    };

    // Filtering / searching / sorting / pagination
    const filteredRows = useMemo(() => {
        let data = [...rows];

        if (searchTerm.trim()) {
            const term = searchTerm.trim().toLowerCase();
            data = data.filter(
                (r) =>
                    r.studentName.toLowerCase().includes(term) ||
                    (r.comment || '').toLowerCase().includes(term)
            );
        }

        if (filterStudentId !== 'all') {
            data = data.filter((r) => r.studentId === filterStudentId);
        }

        if (filterTeacher !== 'all' && currentLesson?.teacherName) {
            data = data.filter(
                () => currentLesson.teacherName?.toLowerCase() === filterTeacher.toLowerCase()
            );
        }

        if (dateFrom) {
            const from = new Date(dateFrom).getTime();
            data = data.filter((r) => {
                const d = r.createdAt ? new Date(r.createdAt).getTime() : null;
                return d ? d >= from : true;
            });
        }

        if (dateTo) {
            const to = new Date(dateTo).getTime();
            data = data.filter((r) => {
                const d = r.createdAt ? new Date(r.createdAt).getTime() : null;
                return d ? d <= to : true;
            });
        }

        data.sort((a, b) => {
            const dir = sortDir === 'asc' ? 1 : -1;
            const getNumber = (v: string) => (v === '' ? NaN : Number(v));
            switch (sortKey) {
                case 'vocabularyScore':
                    return (getNumber(a.vocabularyScore) || 0) > (getNumber(b.vocabularyScore) || 0)
                        ? dir
                        : -dir;
                case 'schoolExamScore':
                    return (getNumber(a.schoolExamScore) || 0) > (getNumber(b.schoolExamScore) || 0)
                        ? dir
                        : -dir;
                case 'createdAt':
                    return ((a.createdAt || '') > (b.createdAt || '') ? 1 : -1) * dir;
                default:
                    return a.studentName.localeCompare(b.studentName) * dir;
            }
        });

        return data;
    }, [rows, searchTerm, filterStudentId, filterTeacher, dateFrom, dateTo, sortKey, sortDir, currentLesson]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const toggleSelectAll = (checked: boolean) => {
        if (!checked) {
            setSelectedIds(new Set());
            return;
        }
        const newSet = new Set<number>();
        pagedRows.forEach((r) => {
            if (r.commentId) newSet.add(r.studentId);
        });
        setSelectedIds(newSet);
    };

    const toggleSelectRow = (studentId: number, hasComment: boolean) => {
        if (!hasComment) return;
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(studentId)) next.delete(studentId);
            else next.add(studentId);
            return next;
        });
    };

    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: number[]) => {
            await Promise.all(ids.map((cid) => api.delete(`/comments/${cid}`)));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', selectedLessonId] });
            setSelectedIds(new Set());
        },
    });

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;
        const commentIds = comments
            ?.filter((c) => selectedIds.has(c.studentId))
            .map((c) => c.id) || [];
        if (commentIds.length === 0) return;
        bulkDeleteMutation.mutate(commentIds);
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-text/70 font-body">Đang tải danh sách nhận xét...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
                    <p className="font-semibold mb-1">Lỗi khi tải dữ liệu</p>
                    <p className="text-sm">Không thể tải danh sách nhận xét. Vui lòng thử lại sau.</p>
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
                        Nhận xét hàng ngày
                    </h1>
                    <p className="text-sm text-text/60 font-body">
                        Quản lý nhận xét học sinh theo buổi học
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => setIsShareModalOpen(true)}
                        disabled={!selectedLessonId}
                        className="flex items-center gap-2 min-h-[44px] touch-manipulation"
                    >
                        <LinkIcon />
                        <span>Chia sẻ buổi học</span>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium mb-2 text-text">
                        Chọn lớp học
                    </label>
                    <select
                        className="input w-full min-h-[44px] touch-manipulation"
                        value={selectedClassId || ''}
                        onChange={(e) => {
                            const newClassId = Number(e.target.value) || null;
                            setSelectedClassId(newClassId);
                            setSelectedLessonId(null);
                            // Update URL params
                            if (newClassId) {
                                setSearchParams({ classId: newClassId.toString() });
                            } else {
                                setSearchParams({});
                            }
                        }}
                    >
                        <option value="">-- Chọn lớp --</option>
                        {classes?.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-text">
                        Chọn buổi học
                    </label>
                    <select
                        className="input w-full min-h-[44px] touch-manipulation"
                        value={selectedLessonId || ''}
                        onChange={(e) => {
                            const newLessonId = Number(e.target.value) || null;
                            setSelectedLessonId(newLessonId);
                            // Update URL params
                            if (selectedClassId) {
                                const params: Record<string, string> = { classId: selectedClassId.toString() };
                                if (newLessonId) {
                                    params.lessonId = newLessonId.toString();
                                }
                                setSearchParams(params);
                            }
                        }}
                        disabled={!selectedClassId}
                    >
                        <option value="">-- Chọn buổi học --</option>
                        {lessons?.map((lesson: Lesson) => (
                            <option key={lesson.id} value={lesson.id}>
                                {format(new Date(lesson.date), 'dd/MM/yyyy')} - Buổi {lesson.lessonNumber}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-end">
                    {selectedLessonId && (
                        <Button onClick={handleExport} className="w-full flex items-center justify-center gap-2">
                            <DocumentArrowDownIcon />
                            <span>Xuất Excel</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Toolbar: search, filters, sort, pagination size, bulk delete */}
            {selectedLessonId && (
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
                                    placeholder="Tên học sinh hoặc nhận xét..."
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium mb-1 text-text">Học sinh</label>
                                <select
                                    className="input w-full"
                                    value={filterStudentId === 'all' ? '' : filterStudentId}
                                    onChange={(e) => {
                                        setFilterStudentId(e.target.value ? Number(e.target.value) : 'all');
                                        setPage(1);
                                    }}
                                >
                                    <option value="">Tất cả</option>
                                    {students?.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium mb-1 text-text">Giáo viên</label>
                                <select
                                    className="input w-full"
                                    value={filterTeacher}
                                    onChange={(e) => {
                                        setFilterTeacher(e.target.value || 'all');
                                        setPage(1);
                                    }}
                                >
                                    <option value="all">Tất cả</option>
                                    {currentLesson?.teacherName && (
                                        <option value={currentLesson.teacherName}>{currentLesson.teacherName}</option>
                                    )}
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
                                        <option value="studentName|asc">Tên học sinh (A→Z)</option>
                                        <option value="studentName|desc">Tên học sinh (Z→A)</option>
                                        <option value="vocabularyScore|desc">Điểm Vocabulary ↓</option>
                                        <option value="vocabularyScore|asc">Điểm Vocabulary ↑</option>
                                        <option value="schoolExamScore|desc">Điểm trên lớp ↓</option>
                                        <option value="schoolExamScore|asc">Điểm trên lớp ↑</option>
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
                                        {[5, 10, 20, 50].map((s) => (
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
                                        setFilterStudentId('all');
                                        setFilterTeacher('all');
                                        setDateFrom('');
                                        setDateTo('');
                                        setSortKey('studentName');
                                        setSortDir('asc');
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
            {!selectedLessonId ? (
                <div className="bg-background rounded-xl border-2 border-dashed border-text/20 p-12 sm:p-16 text-center">
                    <EmptyStateIcon />
                    <h3 className="text-lg font-semibold text-text font-heading mb-2 mt-4">
                        Chưa chọn buổi học
                    </h3>
                    <p className="text-text/60 font-body mb-6 max-w-md mx-auto">
                        Vui lòng chọn lớp học và buổi học để xem danh sách nhận xét.
                    </p>
                </div>
            ) : (
                <>
                    {/* Class and Lesson Info Card */}
                    {currentLesson && selectedClass && (
                        <Card className="mb-6 p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                                {/* Icon */}
                                <div className="p-4 bg-secondary/10 rounded-xl text-secondary flex-shrink-0">
                                    <BookOpenIcon className="w-8 h-8" />
                                </div>

                                {/* Info Details */}
                                <div className="flex-1">
                                    <h2 className="text-xl sm:text-2xl font-bold text-text font-heading mb-4">
                                        {selectedClass.name}
                                    </h2>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Branch */}
                                        {selectedClass.branchName && (
                                            <div className="flex items-start gap-3">
                                                <BuildingOfficeIcon />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-text/50 font-body mb-1">Chi nhánh</p>
                                                    <p className="text-sm sm:text-base text-text/80 font-body">
                                                        {selectedClass.branchName}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Lesson Date */}
                                        {currentLesson.date && (
                                            <div className="flex items-start gap-3">
                                                <CalendarIcon />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-text/50 font-body mb-1">Ngày học</p>
                                                    <p className="text-sm sm:text-base text-text/80 font-body">
                                                        {format(new Date(currentLesson.date), 'dd/MM/yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Lesson Number */}
                                        {currentLesson.lessonNumber && (
                                            <div className="flex items-start gap-3">
                                                <BookOpenIcon className="w-5 h-5" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-text/50 font-body mb-1">Buổi học</p>
                                                    <p className="text-sm sm:text-base text-text/80 font-body">
                                                        Buổi {currentLesson.lessonNumber}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Teacher */}
                                        {currentLesson.teacherName && (
                                            <div className="flex items-start gap-3">
                                                <AcademicCapIcon />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-text/50 font-body mb-1">Giáo viên</p>
                                                    <p className="text-sm sm:text-base text-text/80 font-body">
                                                        {currentLesson.teacherName}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    <Card className="overflow-hidden">
                        {filteredRows.length === 0 ? (
                            <div className="p-6 text-center text-text/60">Chưa có học sinh trong lớp này.</div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full min-w-[720px]">
                                        <thead>
                                            <tr className="bg-secondary/20">
                                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/10 font-semibold text-xs sm:text-sm">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 cursor-pointer"
                                                        onChange={(e) => toggleSelectAll(e.target.checked)}
                                                        checked={
                                                            pagedRows.length > 0 &&
                                                            pagedRows.every((r) => r.commentId && selectedIds.has(r.studentId))
                                                        }
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </th>
                                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/10 font-semibold text-xs sm:text-sm">STT</th>
                                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/10 font-semibold text-xs sm:text-sm">Học sinh</th>
                                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/10 font-semibold text-xs sm:text-sm">Từ vựng (0-10)</th>
                                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/10 font-semibold text-xs sm:text-sm">Điểm trên lớp (0-10)</th>
                                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/10 font-semibold text-xs sm:text-sm">BTVN</th>
                                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/10 font-semibold text-xs sm:text-sm">Nhận xét</th>
                                                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/10 font-semibold text-xs sm:text-sm">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pagedRows.map((row, index) => (
                                                <tr key={row.studentId} className="border-b border-text/10 hover:bg-background transition-colors">
                                                    <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/10 text-xs sm:text-sm" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            className="h-4 w-4 cursor-pointer"
                                                            checked={!!row.commentId && selectedIds.has(row.studentId)}
                                                            onChange={() => toggleSelectRow(row.studentId, !!row.commentId)}
                                                            disabled={!row.commentId}
                                                        />
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/10 text-xs sm:text-sm">
                                                        {(currentPage - 1) * pageSize + index + 1}
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/10 font-medium text-xs sm:text-sm whitespace-nowrap">{row.studentName}</td>
                                                    <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/10">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            max="10"
                                                            value={row.vocabularyScore}
                                                            onChange={(e) => handleRowChange(row.studentId, 'vocabularyScore', e.target.value)}
                                                            className="input text-xs sm:text-sm py-1 px-2 min-w-[80px]"
                                                            disabled={savingRowId === row.studentId}
                                                            placeholder="0-10"
                                                        />
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/10">
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            max="10"
                                                            value={row.schoolExamScore}
                                                            onChange={(e) => handleRowChange(row.studentId, 'schoolExamScore', e.target.value)}
                                                            className="input text-xs sm:text-sm py-1 px-2 min-w-[80px]"
                                                            disabled={savingRowId === row.studentId}
                                                            placeholder="0-10"
                                                        />
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/10">
                                                        <select
                                                            value={row.homeworkStatus}
                                                            onChange={(e) => handleRowChange(row.studentId, 'homeworkStatus', e.target.value)}
                                                            className="input text-xs sm:text-sm py-1 px-2 min-w-[120px]"
                                                            disabled={savingRowId === row.studentId}
                                                        >
                                                            <option value="">- Chọn -</option>
                                                            <option value="Hoàn thành">Hoàn thành</option>
                                                            <option value="Chưa hoàn thành">Chưa hoàn thành</option>
                                                            <option value="Không nộp">Không nộp</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/10">
                                                        <input
                                                            type="text"
                                                            value={row.comment}
                                                            onChange={(e) => handleRowChange(row.studentId, 'comment', e.target.value)}
                                                            className="input text-xs sm:text-sm py-1 px-2 min-w-[140px]"
                                                            disabled={savingRowId === row.studentId}
                                                            placeholder="Nhận xét ngắn"
                                                        />
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/10 text-xs sm:text-sm">
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                variant="secondary"
                                                                onClick={() => handleSaveRow(row)}
                                                                className="text-xs py-1 px-2"
                                                                disabled={savingRowId === row.studentId}
                                                            >
                                                                {savingRowId === row.studentId ? 'Đang lưu...' : 'Lưu'}
                                                            </Button>
                                                            {row.commentId && (
                                                                <Button
                                                                    variant="secondary"
                                                                    onClick={(e) => handleDelete({ id: row.commentId, studentId: row.studentId } as DailyComment, e)}
                                                                    className="text-xs py-1 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                    disabled={savingRowId === row.studentId}
                                                                >
                                                                    Xóa
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div className="md:hidden space-y-3">
                                    {pagedRows.map((row, index) => (
                                        <Card key={row.studentId} className="p-3 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-text">{row.studentName}</p>
                                                    <p className="text-xs text-text/60 mt-0.5">STT #{(currentPage - 1) * pageSize + index + 1}</p>
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 cursor-pointer"
                                                        checked={!!row.commentId && selectedIds.has(row.studentId)}
                                                        onChange={() => toggleSelectRow(row.studentId, !!row.commentId)}
                                                        disabled={!row.commentId}
                                                    />
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => handleSaveRow(row)}
                                                        className="text-xs py-1 px-2 min-w-[64px]"
                                                        disabled={savingRowId === row.studentId}
                                                    >
                                                        {savingRowId === row.studentId ? 'Đang lưu...' : 'Lưu'}
                                                    </Button>
                                                    {row.commentId && (
                                                        <Button
                                                            variant="secondary"
                                                            onClick={(e) => handleDelete({ id: row.commentId, studentId: row.studentId } as DailyComment, e)}
                                                            className="text-xs py-1 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 min-w-[64px]"
                                                            disabled={savingRowId === row.studentId}
                                                        >
                                                            Xóa
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Scores and BTVN row - 3 columns */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="col-span-1">
                                                    <label className="text-xs text-text/70 block mb-1">Từ vựng</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="10"
                                                        value={row.vocabularyScore}
                                                        onChange={(e) => handleRowChange(row.studentId, 'vocabularyScore', e.target.value)}
                                                        className="input text-xs py-1.5 px-2 w-full"
                                                        disabled={savingRowId === row.studentId}
                                                        placeholder="0-10"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="text-xs text-text/70 block mb-1">Điểm trên lớp</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="10"
                                                        value={row.schoolExamScore}
                                                        onChange={(e) => handleRowChange(row.studentId, 'schoolExamScore', e.target.value)}
                                                        className="input text-xs py-1.5 px-2 w-full"
                                                        disabled={savingRowId === row.studentId}
                                                        placeholder="0-10"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <label className="text-xs text-text/70 block mb-1">BTVN</label>
                                                    <select
                                                        value={row.homeworkStatus}
                                                        onChange={(e) => handleRowChange(row.studentId, 'homeworkStatus', e.target.value)}
                                                        className="input text-xs py-1.5 px-2 w-full"
                                                        disabled={savingRowId === row.studentId}
                                                    >
                                                        <option value="">- Chọn -</option>
                                                        <option value="Hoàn thành">Hoàn thành</option>
                                                        <option value="Chưa hoàn thành">Chưa hoàn thành</option>
                                                        <option value="Không nộp">Không nộp</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Comment - full width below */}
                                            <div className="w-full">
                                                <label className="text-xs text-text/70 block mb-1">Nhận xét</label>
                                                <textarea
                                                    value={row.comment}
                                                    onChange={(e) => handleRowChange(row.studentId, 'comment', e.target.value)}
                                                    className="input text-xs py-2 px-3 min-h-[70px] w-full resize-y"
                                                    disabled={savingRowId === row.studentId}
                                                    placeholder="Nhận xét ngắn"
                                                />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                                {filteredRows.length > pageSize && (
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-text/10">
                                        <div className="text-sm text-text/70">
                                            Hiển thị {pagedRows.length} / {filteredRows.length} nhận xét
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
                    </Card>
                </>
            )}

            {/* Share Link Modal */}
            <CreateSharedLinkModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                entityType="Lesson"
                entityId={selectedLessonId ?? undefined}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setCommentToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Xóa nhận xét"
                message={`Bạn có chắc chắn muốn xóa nhận xét của học sinh "${commentToDelete?.studentName}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};

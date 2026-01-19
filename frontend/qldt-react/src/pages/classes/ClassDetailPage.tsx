import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { Class, Student, Lesson, Exam, ClassTeacher, Schedule } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ClassFormModal } from '../../components/classes/ClassFormModal';
import { AssignTeacherModal } from '../../components/classes/AssignTeacherModal';
import { LessonFormModal } from '../../components/lessons/LessonFormModal';
import { ExamFormModal } from '../../components/exams/ExamFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

// SVG Icons từ Heroicons
const ArrowLeftIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const BookOpenIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const UserGroupIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const AcademicCapIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7M5.176 9.032a12.083 12.083 0 011.665-6.479L12 14l-5.159 2.553a11.965 11.965 0 01-1.665-6.48zM18.824 9.032a11.965 11.965 0 01-1.665 6.48L12 14l5.159-2.947a12.076 12.076 0 011.665 6.479z" />
    </svg>
);

const PencilIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CalendarIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ChatBubbleLeftRightIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ChevronDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

export const ClassDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState(false);
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [isExamModalOpen, setIsExamModalOpen] = useState(false);
    const [isStudentsExpanded, setIsStudentsExpanded] = useState(false);
    const [isUnassignTeacherDialogOpen, setIsUnassignTeacherDialogOpen] = useState(false);
    const [teacherToUnassign, setTeacherToUnassign] = useState<ClassTeacher | null>(null);

    // Permissions
    const isTeacher = user?.role === 'Teacher';
    const canManageLessons = isTeacher || user?.role === 'Owner' || user?.role === 'BranchManager';
    const canManageExams = canManageLessons;

    const { data: classItem, isLoading: isLoadingClass, error: classError } = useQuery<Class>({
        queryKey: ['class', id],
        queryFn: async () => {
            const response = await api.get(`/classes/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
        queryKey: ['students', 'class', id],
        queryFn: async () => {
            const response = await api.get(`/students/class/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    const { data: lessons, isLoading: isLoadingLessons } = useQuery<Lesson[]>({
        queryKey: ['lessons', 'class', id],
        queryFn: async () => {
            const response = await api.get(`/lessons/class/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    const { data: exams, isLoading: isLoadingExams } = useQuery<Exam[]>({
        queryKey: ['exams', 'class', id],
        queryFn: async () => {
            const response = await api.get(`/exams/class/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    const { data: schedules, isLoading: isLoadingSchedules } = useQuery<Schedule[]>({
        queryKey: ['schedules', 'class', id],
        queryFn: async () => {
            const response = await api.get(`/schedules/class/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Sort lessons and exams by newest first (date desc, fallback lessonNumber)
    const sortedLessons = useMemo(() => {
        if (!lessons) return [];
        return [...lessons].sort((a, b) => {
            const aDate = new Date(a.date).getTime();
            const bDate = new Date(b.date).getTime();
            if (aDate !== bDate) return bDate - aDate;
            return (b.lessonNumber || 0) - (a.lessonNumber || 0);
        });
    }, [lessons]);

    const sortedExams = useMemo(() => {
        if (!exams) return [];
        return [...exams].sort((a, b) => {
            const aDate = new Date(a.date).getTime();
            const bDate = new Date(b.date).getTime();
            if (aDate !== bDate) return bDate - aDate;
            return b.id - a.id;
        });
    }, [exams]);

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!classItem?.id) throw new Error('Class ID is required');
            await api.delete(`/classes/${classItem.id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            navigate('/classes');
        },
    });

    const unassignTeacherMutation = useMutation({
        mutationFn: async (teacherId: number) => {
            if (!classItem?.id) throw new Error('Class ID is required');
            await api.delete(`/classes/${classItem.id}/teachers/${teacherId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['class', id] });
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            setIsUnassignTeacherDialogOpen(false);
            setTeacherToUnassign(null);
        },
    });

    const handleDelete = () => {
        deleteMutation.mutate();
    };

    const handleUnassignTeacher = () => {
        if (teacherToUnassign) {
            unassignTeacherMutation.mutate(teacherToUnassign.teacherId);
        }
    };

    if (isLoadingClass || isLoadingSchedules) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-text/70 font-body">Đang tải thông tin lớp học...</p>
                </div>
            </div>
        );
    }

    if (classError || !classItem) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
                    <p className="font-semibold mb-1">Lỗi khi tải dữ liệu</p>
                    <p className="text-sm">Không thể tải thông tin lớp học. Vui lòng thử lại sau.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 lg:pb-8">
            {/* Back Button */}
            <Button
                variant="secondary"
                onClick={() => navigate('/classes')}
                className="mb-4 sm:mb-6 flex items-center gap-2 text-sm sm:text-base py-2 sm:py-2.5"
            >
                <ArrowLeftIcon />
                <span className="hidden sm:inline">Quay lại danh sách</span>
                <span className="sm:hidden">Quay lại</span>
            </Button>

            {/* Header */}
            <div className="bg-background rounded-xl border border-text/10 shadow-sm p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8">
                <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-secondary/10 rounded-lg text-secondary flex-shrink-0">
                            <BookOpenIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text font-heading mb-1 break-words">
                                {classItem.name}
                            </h1>
                            <p className="text-xs sm:text-sm text-text/60 font-body">
                                Chi nhánh: {classItem.branchName}
                            </p>
                        </div>
                    </div>
                    {!isTeacher && (
                        <div className="flex gap-2 sm:gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => setIsEditModalOpen(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] touch-manipulation"
                            >
                                <PencilIcon />
                                <span>Sửa</span>
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] touch-manipulation text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                                <TrashIcon />
                                <span>Xóa</span>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Class Info */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    {classItem.level && (
                        <div className="flex items-center">
                            <span className="inline-block px-2.5 sm:px-3 py-1 bg-primary/10 text-primary text-xs sm:text-sm font-semibold rounded-full">
                                Level {classItem.level}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text/70 font-body">
                        <CalendarIcon />
                        <span>Tạo ngày {format(new Date(classItem.createdAt), 'dd/MM/yyyy')}</span>
                    </div>
                </div>
            </div>

            {/* Statistics Section */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-text font-heading flex items-center gap-2 mb-3 sm:mb-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Thống kê</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-text/60 font-body mb-1">Số buổi học</p>
                        <p className="text-xl sm:text-2xl font-bold text-text font-heading">{sortedLessons.length}</p>
                    </Card>
                    <Card className="p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-text/60 font-body mb-1">Số bài kiểm tra</p>
                        <p className="text-xl sm:text-2xl font-bold text-text font-heading">{sortedExams.length}</p>
                    </Card>
                    <Card className="p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-text/60 font-body mb-1">Số học sinh</p>
                        <p className="text-xl sm:text-2xl font-bold text-text font-heading">{students?.length || 0}</p>
                    </Card>
                    <Card className="p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-text/60 font-body mb-1">Số giáo viên</p>
                        <p className="text-xl sm:text-2xl font-bold text-text font-heading">{classItem.teachers?.length || 0}</p>
                    </Card>
                </div>
            </div>

            {/* Schedule Section */}
            {schedules && schedules.length > 0 && (
                <div className="mb-4 sm:mb-6 lg:mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-text font-heading flex items-center gap-2 mb-3 sm:mb-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Lịch học</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {schedules.map((schedule) => {
                            const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
                            const dayName = dayNames[schedule.dayOfWeek];
                            const startTime = schedule.startTime.split(':').slice(0, 2).join(':');
                            const endTime = schedule.endTime.split(':').slice(0, 2).join(':');
                            return (
                                <Card key={schedule.id} className="p-3 sm:p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm sm:text-base font-semibold text-text font-heading">{dayName}</h3>
                                    </div>
                                    <p className="text-xs sm:text-sm text-text/70 font-body">
                                        {startTime} - {endTime}
                                    </p>
                                    {schedule.room && (
                                        <p className="text-xs sm:text-sm text-text/60 font-body mt-1">
                                            Phòng: {schedule.room}
                                        </p>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Teachers Section */}
            {!isTeacher && (
                <div className="mb-4 sm:mb-6 lg:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-text font-heading flex items-center gap-2">
                            <AcademicCapIcon />
                            <span>Giáo viên ({classItem.teachers?.length || 0})</span>
                        </h2>
                        <Button
                            variant="secondary"
                            onClick={() => setIsAssignTeacherModalOpen(true)}
                            className="text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] touch-manipulation w-full sm:w-auto"
                        >
                            Gán giáo viên
                        </Button>
                    </div>
                    {!classItem.teachers || classItem.teachers.length === 0 ? (
                        <Card className="p-4 sm:p-6 lg:p-8 text-center">
                            <p className="text-sm sm:text-base text-text/60 font-body mb-3 sm:mb-4">Chưa có giáo viên nào được gán cho lớp học này.</p>
                            <Button
                                variant="secondary"
                                onClick={() => setIsAssignTeacherModalOpen(true)}
                                className="text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] touch-manipulation"
                            >
                                Gán giáo viên đầu tiên
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {classItem.teachers.map((teacher: ClassTeacher) => (
                                <Card key={teacher.teacherId} className="p-3 sm:p-4 relative group">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm sm:text-base font-semibold text-text font-heading mb-1 break-words">
                                                {teacher.teacherName}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-text/70 font-body break-words">
                                                {teacher.teacherEmail}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTeacherToUnassign(teacher);
                                                setIsUnassignTeacherDialogOpen(true);
                                            }}
                                            className="flex-shrink-0 p-1.5 text-text/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 touch-manipulation min-h-[32px] min-w-[32px] flex items-center justify-center"
                                            title="Xóa giáo viên khỏi lớp"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Students Section - Collapsible */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
                <Card className="overflow-hidden">
                    <button
                        onClick={() => setIsStudentsExpanded(!isStudentsExpanded)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-background transition-colors duration-200 cursor-pointer touch-manipulation min-h-[44px]"
                    >
                        <h2 className="text-lg sm:text-xl font-semibold text-text font-heading flex items-center gap-2">
                            <UserGroupIcon />
                            <span>Học sinh ({students?.length || 0})</span>
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/students?classId=${classItem.id}`);
                                    }}
                                    className="text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 min-h-[36px] sm:min-h-[44px] touch-manipulation hidden sm:flex items-center"
                                >
                                    Xem tất cả
                                </Button>
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/students?classId=${classItem.id}&action=add`);
                                    }}
                                    className="text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 min-h-[36px] sm:min-h-[44px] touch-manipulation hidden sm:flex items-center"
                                >
                                    Thêm học sinh
                                </Button>
                            </div>
                            <ChevronDownIcon
                                className={`w-5 h-5 text-text/60 transition-transform duration-200 ${isStudentsExpanded ? 'rotate-180' : ''
                                    }`}
                            />
                        </div>
                    </button>

                    {/* Mobile action buttons */}
                    <div className="sm:hidden px-4 pb-3 flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => navigate(`/students?classId=${classItem.id}`)}
                            className="flex-1 text-xs py-2 min-h-[44px] touch-manipulation"
                        >
                            Xem tất cả
                        </Button>
                        <Button
                            onClick={() => navigate(`/students?classId=${classItem.id}&action=add`)}
                            className="flex-1 text-xs py-2 min-h-[44px] touch-manipulation"
                        >
                            Thêm học sinh
                        </Button>
                    </div>

                    {/* Collapsible content */}
                    {isStudentsExpanded && (
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                            {isLoadingStudents ? (
                                <div className="text-center py-6 sm:py-8 text-text/60 font-body text-sm sm:text-base">Đang tải...</div>
                            ) : !students || students.length === 0 ? (
                                <div className="text-center py-6 sm:py-8">
                                    <p className="text-sm sm:text-base text-text/60 font-body">Chưa có học sinh nào trong lớp này.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Mobile compact list */}
                                    <div className="sm:hidden space-y-2">
                                        {students.map((student, index) => (
                                            <Card
                                                key={student.id}
                                                onClick={() => navigate(`/students/${student.id}`)}
                                                className="p-3 cursor-pointer hover:shadow-md transition-shadow duration-200 active:scale-[0.98] touch-manipulation"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-text font-heading break-words">{student.name}</p>
                                                        {student.parentUser ? (
                                                            <>
                                                                {(student.parentUser.fullName || student.parentUser.username) && (
                                                                    <p className="text-xs text-text/70 font-body mt-1 break-words">
                                                                        Phụ huynh: {student.parentUser.fullName || student.parentUser.username}
                                                                    </p>
                                                                )}
                                                                {student.parentUser.phone && (
                                                                    <p className="text-xs text-text/70 font-body mt-0.5">ĐT: {student.parentUser.phone}</p>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {student.parentName && (
                                                                    <p className="text-xs text-text/70 font-body mt-1 break-words">Phụ huynh: {student.parentName}</p>
                                                                )}
                                                                {student.parentPhone && (
                                                                    <p className="text-xs text-text/70 font-body mt-0.5">ĐT: {student.parentPhone}</p>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-text/60 flex-shrink-0">#{index + 1}</span>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Desktop / tablet views */}
                                    <div className="hidden sm:block">
                                        {students.length >= 10 ? (
                                            <Card className="overflow-hidden">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-background border-b border-text/10">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left text-sm font-semibold text-text">STT</th>
                                                                <th className="px-4 py-3 text-left text-sm font-semibold text-text">Tên học sinh</th>
                                                                <th className="px-4 py-3 text-left text-sm font-semibold text-text">Phụ huynh</th>
                                                                <th className="px-4 py-3 text-left text-sm font-semibold text-text">Điện thoại</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-text/10">
                                                            {students.map((student, index) => (
                                                                <tr
                                                                    key={student.id}
                                                                    onClick={() => navigate(`/students/${student.id}`)}
                                                                    className="hover:bg-background cursor-pointer transition-colors duration-150"
                                                                >
                                                                    <td className="px-4 py-3 text-sm text-text/70">{index + 1}</td>
                                                                    <td className="px-4 py-3 text-sm font-medium text-text">{student.name}</td>
                                                                    <td className="px-4 py-3 text-sm text-text/70">
                                                                        {student.parentUser
                                                                            ? (student.parentUser.fullName || student.parentUser.username || '-')
                                                                            : (student.parentName || '-')
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm text-text/70">
                                                                        {student.parentUser
                                                                            ? (student.parentUser.phone || '-')
                                                                            : (student.parentPhone || '-')
                                                                        }
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Card>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                                {students.map((student) => (
                                                    <Card
                                                        key={student.id}
                                                        onClick={() => navigate(`/students/${student.id}`)}
                                                        className="p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
                                                    >
                                                        <h3 className="font-semibold text-text font-heading mb-1 break-words">
                                                            {student.name}
                                                        </h3>
                                                        {student.parentUser ? (
                                                            <>
                                                                {(student.parentUser.fullName || student.parentUser.username) && (
                                                                    <p className="text-sm text-text/70 font-body break-words">
                                                                        Phụ huynh: {student.parentUser.fullName || student.parentUser.username}
                                                                    </p>
                                                                )}
                                                                {student.parentUser.phone && (
                                                                    <p className="text-xs text-text/60 font-body mt-0.5">
                                                                        ĐT: {student.parentUser.phone}
                                                                    </p>
                                                                )}
                                                            </>
                                                        ) : (
                                                            student.parentName && (
                                                                <p className="text-sm text-text/70 font-body break-words">
                                                                    Phụ huynh: {student.parentName}
                                                                </p>
                                                            )
                                                        )}
                                                    </Card>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </Card>
            </div>

            {/* Lessons Section */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-text font-heading flex items-center gap-2">
                        <BookOpenIcon />
                        <span>Buổi học ({sortedLessons?.length || 0})</span>
                    </h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {canManageLessons && (
                            <Button
                                onClick={() => setIsLessonModalOpen(true)}
                                className="flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] touch-manipulation"
                            >
                                Thêm buổi học
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            onClick={() => navigate(`/lessons?classId=${classItem.id}`)}
                            className="flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] touch-manipulation"
                        >
                            Xem tất cả
                        </Button>
                    </div>
                </div>
                {isLoadingLessons ? (
                    <div className="text-center py-6 sm:py-8 text-text/60 font-body text-sm sm:text-base">Đang tải...</div>
                ) : !sortedLessons || sortedLessons.length === 0 ? (
                    <Card className="p-6 sm:p-8 text-center">
                        <p className="text-sm sm:text-base text-text/60 font-body">Chưa có buổi học nào.</p>
                    </Card>
                ) : (
                    <>
                        {/* Mobile view - always card list */}
                        <div className="sm:hidden space-y-2">
                            {sortedLessons.slice(0, 2).map((lesson) => (
                                <Card
                                    key={lesson.id}
                                    className="p-3 hover:shadow-md transition-shadow duration-200"
                                >
                                    <div
                                        onClick={() => navigate(`/lessons/${lesson.id}`)}
                                        className="cursor-pointer mb-3 active:scale-[0.98] touch-manipulation"
                                    >
                                        <h3 className="text-sm font-semibold text-text font-heading mb-1 break-words">
                                            {`Buổi ${lesson.lessonNumber || lesson.id}`}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-text/70 font-body">
                                            <CalendarIcon />
                                            <span>{format(new Date(lesson.date), 'dd/MM/yyyy')}</span>
                                        </div>
                                        {lesson.teacherName && (
                                            <p className="text-xs text-text/60 font-body mt-1">GV: {lesson.teacherName}</p>
                                        )}
                                    </div>
                                    {canManageLessons && (
                                        <div className="pt-3 border-t border-text/10 space-y-2">
                                            <Button
                                                variant="secondary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/attendance/quick?classId=${classItem.id}&lessonId=${lesson.id}`);
                                                }}
                                                className="w-full text-xs py-2 px-3 flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation"
                                            >
                                                <CheckCircleIcon />
                                                <span>Điểm danh</span>
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/comments?classId=${classItem.id}&lessonId=${lesson.id}`);
                                                }}
                                                className="w-full text-xs py-2 px-3 flex items-center justify-center gap-1.5 min-h-[44px] touch-manipulation"
                                            >
                                                <ChatBubbleLeftRightIcon />
                                                <span>Nhận xét</span>
                                            </Button>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>

                        {/* Desktop/Tablet view */}
                        <div className="hidden sm:block">
                            {sortedLessons.length >= 10 ? (
                                <Card className="overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-background border-b border-text/10">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">STT</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Buổi học</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Ngày</th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Giáo viên</th>
                                                    {canManageLessons && (
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text">Thao tác</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-text/10">
                                                {sortedLessons.slice(0, 2).map((lesson, index) => (
                                                    <tr
                                                        key={lesson.id}
                                                        className="hover:bg-background transition-colors duration-150"
                                                    >
                                                        <td
                                                            onClick={() => navigate(`/lessons/${lesson.id}`)}
                                                            className="px-4 py-3 text-sm text-text/70 cursor-pointer"
                                                        >
                                                            {index + 1}
                                                        </td>
                                                        <td
                                                            onClick={() => navigate(`/lessons/${lesson.id}`)}
                                                            className="px-4 py-3 text-sm font-medium text-text cursor-pointer"
                                                        >
                                                            {`Buổi ${lesson.lessonNumber || index + 1}`}
                                                        </td>
                                                        <td
                                                            onClick={() => navigate(`/lessons/${lesson.id}`)}
                                                            className="px-4 py-3 text-sm text-text/70 cursor-pointer"
                                                        >
                                                            {format(new Date(lesson.date), 'dd/MM/yyyy')}
                                                        </td>
                                                        <td
                                                            onClick={() => navigate(`/lessons/${lesson.id}`)}
                                                            className="px-4 py-3 text-sm text-text/70 cursor-pointer"
                                                        >
                                                            {lesson.teacherName || '-'}
                                                        </td>
                                                        {canManageLessons && (
                                                            <td className="px-4 py-3 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        variant="secondary"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`/attendance/quick?classId=${classItem.id}&lessonId=${lesson.id}`);
                                                                        }}
                                                                        className="text-xs py-1 px-2 flex items-center gap-1"
                                                                    >
                                                                        <CheckCircleIcon />
                                                                        <span>Điểm danh</span>
                                                                    </Button>
                                                                    <Button
                                                                        variant="secondary"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`/comments?classId=${classItem.id}&lessonId=${lesson.id}`);
                                                                        }}
                                                                        className="text-xs py-1 px-2 flex items-center gap-1"
                                                                    >
                                                                        <ChatBubbleLeftRightIcon />
                                                                        <span>Nhận xét</span>
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                    {sortedLessons.slice(0, 2).map((lesson) => (
                                        <Card
                                            key={lesson.id}
                                            className="p-4 hover:shadow-md transition-shadow duration-200"
                                        >
                                            <div
                                                onClick={() => navigate(`/lessons/${lesson.id}`)}
                                                className="cursor-pointer mb-3"
                                            >
                                                <h3 className="text-sm sm:text-base font-semibold text-text font-heading mb-1 break-words">
                                                    {`Buổi học ${lesson.lessonNumber || lesson.id}`}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-text/70 font-body">
                                                    {format(new Date(lesson.date), 'dd/MM/yyyy')}
                                                </p>
                                            </div>
                                            {canManageLessons && (
                                                <div className="pt-3 border-t border-text/10 space-y-2">
                                                    <Button
                                                        variant="secondary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/attendance/quick?classId=${classItem.id}&lessonId=${lesson.id}`);
                                                        }}
                                                        className="w-full text-xs py-1.5 px-2 flex items-center justify-center gap-1.5"
                                                    >
                                                        <CheckCircleIcon />
                                                        <span>Điểm danh</span>
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/comments?classId=${classItem.id}&lessonId=${lesson.id}`);
                                                        }}
                                                        className="w-full text-xs py-1.5 px-2 flex items-center justify-center gap-1.5"
                                                    >
                                                        <ChatBubbleLeftRightIcon />
                                                        <span>Nhận xét</span>
                                                    </Button>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Show "Xem tất cả" if there are more than 2 lessons */}
                        {sortedLessons.length > 2 && (
                            <div className="mt-4 flex justify-center">
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate(`/lessons?classId=${classItem.id}`)}
                                    className="text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] touch-manipulation"
                                >
                                    Xem tất cả {sortedLessons.length} buổi học
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Exams Section */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-text font-heading flex items-center gap-2">
                        <AcademicCapIcon />
                        <span>Bài kiểm tra ({sortedExams?.length || 0})</span>
                    </h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        {canManageExams && (
                            <Button
                                onClick={() => setIsExamModalOpen(true)}
                                className="flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] touch-manipulation"
                            >
                                Thêm bài kiểm tra
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            onClick={() => navigate(`/exams?classId=${classItem.id}`)}
                            className="flex-1 sm:flex-none text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] touch-manipulation"
                        >
                            Xem tất cả
                        </Button>
                    </div>
                </div>
                {isLoadingExams ? (
                    <div className="text-center py-6 sm:py-8 text-text/60 font-body text-sm sm:text-base">Đang tải...</div>
                ) : !sortedExams || sortedExams.length === 0 ? (
                    <Card className="p-6 sm:p-8 text-center">
                        <p className="text-sm sm:text-base text-text/60 font-body">Chưa có bài kiểm tra nào.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {sortedExams.slice(0, 6).map((exam) => (
                            <Card
                                key={exam.id}
                                onClick={() => navigate(`/exams/${exam.id}`)}
                                className="p-3 sm:p-4 cursor-pointer hover:shadow-md transition-shadow duration-200 active:scale-[0.98] touch-manipulation"
                            >
                                <h3 className="text-sm sm:text-base font-semibold text-text font-heading mb-1 break-words">
                                    {exam.examType}
                                </h3>
                                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text/70 font-body">
                                    <CalendarIcon />
                                    <span>{format(new Date(exam.date), 'dd/MM/yyyy')}</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <ClassFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                classItem={classItem}
                classId={id}
            />

            {/* Assign Teacher Modal */}
            {classItem && (
                <AssignTeacherModal
                    isOpen={isAssignTeacherModalOpen}
                    onClose={() => setIsAssignTeacherModalOpen(false)}
                    classId={classItem.id}
                    branchId={classItem.branchId}
                    assignedTeacherIds={classItem.teachers?.map(t => t.teacherId) || []}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                title="Xóa lớp học"
                message={`Bạn có chắc chắn muốn xóa lớp học "${classItem.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />

            {/* Unassign Teacher Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isUnassignTeacherDialogOpen}
                onClose={() => {
                    setIsUnassignTeacherDialogOpen(false);
                    setTeacherToUnassign(null);
                }}
                onConfirm={handleUnassignTeacher}
                title="Xóa giáo viên khỏi lớp"
                message={`Bạn có chắc chắn muốn xóa giáo viên "${teacherToUnassign?.teacherName}" khỏi lớp học "${classItem.name}"?`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
                isLoading={unassignTeacherMutation.isPending}
            />

            {/* Lesson Form Modal */}
            <LessonFormModal
                isOpen={isLessonModalOpen}
                onClose={() => setIsLessonModalOpen(false)}
                classId={classItem?.id}
            />

            {/* Exam Form Modal */}
            <ExamFormModal
                isOpen={isExamModalOpen}
                onClose={() => setIsExamModalOpen(false)}
                classId={classItem?.id}
            />
        </div>
    );
};

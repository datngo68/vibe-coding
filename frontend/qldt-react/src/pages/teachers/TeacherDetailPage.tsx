import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { Teacher, Class, Lesson, Schedule } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { TeacherFormModal } from '../../components/teachers/TeacherFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { format } from 'date-fns';

// SVG Icons từ Heroicons
const ArrowLeftIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const AcademicCapIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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

const PhoneIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

const EnvelopeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const BookOpenIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

export const TeacherDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const { data: teacher, isLoading: isLoadingTeacher, error: teacherError } = useQuery<Teacher>({
        queryKey: ['teacher', id],
        queryFn: async () => {
            const response = await api.get(`/teachers/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Fetch classes taught by this teacher
    const { data: classes, isLoading: isLoadingClasses } = useQuery<Class[]>({
        queryKey: ['classes', 'teacher', id],
        queryFn: async () => {
            const response = await api.get(`/classes/teacher/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Fetch lessons taught by this teacher
    const { data: lessons, isLoading: isLoadingLessons } = useQuery<Lesson[]>({
        queryKey: ['lessons', 'teacher', id],
        queryFn: async () => {
            const response = await api.get('/lessons');
            return response.data.filter((lesson: Lesson) => lesson.teacherId === parseInt(id || '0'));
        },
        enabled: !!id,
    });

    // Fetch schedules for all classes taught by this teacher
    const { data: allSchedules, isLoading: isLoadingSchedules } = useQuery<Schedule[]>({
        queryKey: ['schedules', 'teacher', id],
        queryFn: async () => {
            if (!classes || classes.length === 0) return [];
            const schedulePromises = classes.map((cls) =>
                api.get(`/schedules/class/${cls.id}`).then((res) => res.data)
            );
            const scheduleArrays = await Promise.all(schedulePromises);
            return scheduleArrays.flat();
        },
        enabled: !!id && !!classes && classes.length > 0,
    });

    // Calculate statistics
    const statistics = useMemo(() => {
        const totalClasses = classes?.length || 0;
        const totalStudents = classes?.reduce((sum, cls) => {
            // We need to fetch students for each class, but for now we'll use a placeholder
            // In a real scenario, we'd need an API endpoint to get student count per class
            return sum;
        }, 0) || 0;
        const totalLessons = lessons?.length || 0;

        return {
            totalClasses,
            totalStudents: 0, // Placeholder - would need API endpoint
            totalLessons,
        };
    }, [classes, lessons]);

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!teacher?.id) throw new Error('Teacher ID is required');
            await api.delete(`/teachers/${teacher.id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teachers'] });
            navigate('/teachers');
        },
    });

    const handleDelete = () => {
        deleteMutation.mutate();
    };

    if (isLoadingTeacher || isLoadingClasses || isLoadingLessons) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-text/70 font-body">Đang tải thông tin giáo viên...</p>
                </div>
            </div>
        );
    }

    if (teacherError || !teacher) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
                    <p className="font-semibold mb-1">Lỗi khi tải dữ liệu</p>
                    <p className="text-sm">Không thể tải thông tin giáo viên. Vui lòng thử lại sau.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-8">
            {/* Back Button */}
            <Button
                variant="secondary"
                onClick={() => navigate('/teachers')}
                className="mb-6 flex items-center gap-2"
            >
                <ArrowLeftIcon />
                <span>Quay lại danh sách</span>
            </Button>

            {/* Header */}
            <div className="bg-background rounded-xl border border-text/10 shadow-sm p-6 sm:p-8 mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-secondary/10 rounded-lg text-secondary">
                            <AcademicCapIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading mb-1">
                                {teacher.name}
                            </h1>
                            <p className="text-sm text-text/60 font-body">
                                Chi nhánh: {teacher.branchName}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            variant="secondary"
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2"
                        >
                            <PencilIcon />
                            <span>Sửa</span>
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                            <TrashIcon />
                            <span>Xóa</span>
                        </Button>
                    </div>
                </div>

                {/* Teacher Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="flex items-center gap-2 text-sm text-text/70 font-body">
                        <CalendarIcon />
                        <span>Tạo ngày {format(new Date(teacher.createdAt), 'dd/MM/yyyy')}</span>
                    </div>
                </div>
            </div>

            {/* Statistics Section */}
            <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-text font-heading mb-3 sm:mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Thống kê</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    <Card className="p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-text/60 font-body mb-1">Số lớp đang dạy</p>
                        <p className="text-xl sm:text-2xl font-bold text-text font-heading">{statistics.totalClasses}</p>
                    </Card>
                    <Card className="p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-text/60 font-body mb-1">Số buổi học đã dạy</p>
                        <p className="text-xl sm:text-2xl font-bold text-text font-heading">{statistics.totalLessons}</p>
                    </Card>
                    <Card className="p-3 sm:p-4 text-center col-span-2 sm:col-span-1">
                        <p className="text-xs sm:text-sm text-text/60 font-body mb-1">Số học sinh</p>
                        <p className="text-xl sm:text-2xl font-bold text-text font-heading">{statistics.totalStudents}</p>
                    </Card>
                </div>
            </div>

            {/* Classes Section */}
            <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-text font-heading mb-3 sm:mb-4 flex items-center gap-2">
                    <BookOpenIcon />
                    <span>Lớp học đang dạy ({classes?.length || 0})</span>
                </h2>
                {isLoadingClasses ? (
                    <Card className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-text/60 font-body">Đang tải danh sách lớp học...</p>
                    </Card>
                ) : !classes || classes.length === 0 ? (
                    <Card className="p-6 sm:p-8 text-center">
                        <p className="text-text/60 font-body">Giáo viên này chưa được gán cho lớp học nào.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {classes.map((cls) => (
                            <Card
                                key={cls.id}
                                onClick={() => navigate(`/classes/${cls.id}`)}
                                className="p-4 sm:p-5 cursor-pointer hover:shadow-md transition-shadow duration-200 active:scale-[0.98] touch-manipulation"
                            >
                                <h3 className="text-base sm:text-lg font-semibold text-text font-heading mb-2 break-words">
                                    {cls.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-text/70 font-body mb-2 break-words">
                                    Chi nhánh: {cls.branchName}
                                </p>
                                {cls.level && (
                                    <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mb-2">
                                        Level {cls.level}
                                    </span>
                                )}
                                <div className="flex items-center gap-1.5 mt-3 text-xs text-text/60 font-body">
                                    <CalendarIcon />
                                    <span>Tạo ngày {format(new Date(cls.createdAt), 'dd/MM/yyyy')}</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Schedule Section */}
            {allSchedules && allSchedules.length > 0 && (
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-text font-heading mb-3 sm:mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Lịch dạy học</span>
                    </h2>
                    {isLoadingSchedules ? (
                        <Card className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-text/60 font-body">Đang tải lịch học...</p>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {allSchedules.map((schedule) => {
                                const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
                                const dayName = dayNames[schedule.dayOfWeek];
                                const startTime = schedule.startTime.split(':').slice(0, 2).join(':');
                                const endTime = schedule.endTime.split(':').slice(0, 2).join(':');
                                return (
                                    <Card key={schedule.id} className="p-3 sm:p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm sm:text-base font-semibold text-text font-heading">{dayName}</h3>
                                            <span className="text-xs text-text/60 font-body">{schedule.className}</span>
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
                    )}
                </div>
            )}

            {/* Edit Modal */}
            <TeacherFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                teacher={teacher}
                teacherId={id}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                title="Xóa giáo viên"
                message={`Bạn có chắc chắn muốn xóa giáo viên "${teacher.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};

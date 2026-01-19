import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { Student, DailyComment, ExamResult, Attendance, Class } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StudentFormModal } from '../../components/students/StudentFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

// SVG Icons từ Heroicons
const ArrowLeftIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const UserGroupIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

export const StudentDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isTransferClassModalOpen, setIsTransferClassModalOpen] = useState(false);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

    const { data: student, isLoading: isLoadingStudent, error: studentError } = useQuery<Student>({
        queryKey: ['student', id],
        queryFn: async () => {
            const response = await api.get(`/students/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Fetch attendance history
    const { data: attendances, isLoading: isLoadingAttendances } = useQuery<Attendance[]>({
        queryKey: ['attendances', 'student', id],
        queryFn: async () => {
            const response = await api.get(`/attendance/student/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Fetch comments history
    const { data: comments, isLoading: isLoadingComments } = useQuery<DailyComment[]>({
        queryKey: ['comments', 'student', id],
        queryFn: async () => {
            const response = await api.get(`/comments/student/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Fetch exam results history
    const { data: examResults, isLoading: isLoadingExamResults } = useQuery<ExamResult[]>({
        queryKey: ['examResults', 'student', id],
        queryFn: async () => {
            const response = await api.get(`/exams/results/student/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Calculate statistics
    const statistics = useMemo(() => {
        const totalAttendances = attendances?.length || 0;
        const presentCount = attendances?.filter(a => a.status === 'Present').length || 0;
        const absentCount = attendances?.filter(a => a.status === 'Absent').length || 0;
        const lateCount = attendances?.filter(a => a.status === 'Late').length || 0;
        const attendanceRate = totalAttendances > 0 ? (presentCount / totalAttendances) * 100 : 0;

        const totalComments = comments?.length || 0;
        const avgVocabularyScore = comments && comments.length > 0
            ? comments.filter(c => c.vocabularyScore != null).reduce((sum, c) => sum + (c.vocabularyScore || 0), 0) / comments.filter(c => c.vocabularyScore != null).length
            : 0;
        const avgSchoolExamScore = comments && comments.length > 0
            ? comments.filter(c => c.schoolExamScore != null).reduce((sum, c) => sum + (c.schoolExamScore || 0), 0) / comments.filter(c => c.schoolExamScore != null).length
            : 0;

        const totalExams = examResults?.length || 0;
        const avgSpeakingScore = examResults && examResults.length > 0
            ? examResults.filter(e => e.speakingScore != null).reduce((sum, e) => sum + (e.speakingScore || 0), 0) / examResults.filter(e => e.speakingScore != null).length
            : 0;
        const avgListeningScore = examResults && examResults.length > 0
            ? examResults.filter(e => e.listeningScore != null).reduce((sum, e) => sum + (e.listeningScore || 0), 0) / examResults.filter(e => e.listeningScore != null).length
            : 0;
        const avgReadingWritingScore = examResults && examResults.length > 0
            ? examResults.filter(e => e.readingWritingScore != null).reduce((sum, e) => sum + (e.readingWritingScore || 0), 0) / examResults.filter(e => e.readingWritingScore != null).length
            : 0;

        return {
            totalAttendances,
            presentCount,
            absentCount,
            lateCount,
            attendanceRate,
            totalComments,
            avgVocabularyScore,
            avgSchoolExamScore,
            totalExams,
            avgSpeakingScore,
            avgListeningScore,
            avgReadingWritingScore,
        };
    }, [attendances, comments, examResults]);

    // Fetch all classes for transfer
    const { data: classes } = useQuery<Class[]>({
        queryKey: ['classes'],
        queryFn: async () => {
            const response = await api.get('/classes');
            return response.data;
        },
    });

    // Prepare chart data for progress
    const progressChartData = useMemo(() => {
        if (!comments || comments.length === 0) return [];

        // Group comments by month
        const groupedByMonth = comments.reduce((acc, comment) => {
            if (!comment.lessonDate) return acc;
            const date = new Date(comment.lessonDate);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!acc[monthKey]) {
                acc[monthKey] = {
                    month: format(date, 'MM/yyyy'),
                    vocabularyScores: [] as number[],
                    schoolExamScores: [] as number[],
                };
            }

            if (comment.vocabularyScore != null) {
                acc[monthKey].vocabularyScores.push(comment.vocabularyScore);
            }
            if (comment.schoolExamScore != null) {
                acc[monthKey].schoolExamScores.push(comment.schoolExamScore);
            }

            return acc;
        }, {} as Record<string, { month: string; vocabularyScores: number[]; schoolExamScores: number[] }>);

        // Calculate averages
        return Object.values(groupedByMonth)
            .map(group => ({
                month: group.month,
                vocabularyAvg: group.vocabularyScores.length > 0
                    ? group.vocabularyScores.reduce((sum, score) => sum + score, 0) / group.vocabularyScores.length
                    : 0,
                schoolExamAvg: group.schoolExamScores.length > 0
                    ? group.schoolExamScores.reduce((sum, score) => sum + score, 0) / group.schoolExamScores.length
                    : 0,
            }))
            .sort((a, b) => {
                const [monthA, yearA] = a.month.split('/').map(Number);
                const [monthB, yearB] = b.month.split('/').map(Number);
                if (yearA !== yearB) return yearA - yearB;
                return monthA - monthB;
            });
    }, [comments]);

    // Prepare exam scores chart data
    const examScoresChartData = useMemo(() => {
        if (!examResults || examResults.length === 0) return [];

        return examResults
            .map(result => ({
                date: result.examDate ? format(new Date(result.examDate), 'dd/MM') : '-',
                speaking: result.speakingScore || 0,
                listening: result.listeningScore || 0,
                readingWriting: result.readingWritingScore || 0,
            }))
            .slice(0, 10); // Limit to last 10 exams
    }, [examResults]);

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!student?.id) throw new Error('Student ID is required');
            await api.delete(`/students/${student.id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            if (student?.classId) {
                queryClient.invalidateQueries({ queryKey: ['students', 'class', student.classId] });
            }
            navigate('/students');
        },
    });

    const handleDelete = () => {
        deleteMutation.mutate();
    };

    const transferClassMutation = useMutation({
        mutationFn: async (newClassId: number) => {
            if (!student?.id) throw new Error('Student ID is required');
            await api.put(`/students/${student.id}`, {
                name: student.name,
                dateOfBirth: student.dateOfBirth,
                parentName: student.parentName,
                parentPhone: student.parentPhone,
                parentEmail: student.parentEmail,
                classId: newClassId,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['student', id] });
            queryClient.invalidateQueries({ queryKey: ['students'] });
            if (student?.classId) {
                queryClient.invalidateQueries({ queryKey: ['students', 'class', student.classId] });
            }
            setIsTransferClassModalOpen(false);
            setSelectedClassId(null);
        },
    });

    const handleTransferClass = () => {
        if (selectedClassId) {
            transferClassMutation.mutate(selectedClassId);
        }
    };

    if (isLoadingStudent || isLoadingAttendances || isLoadingComments || isLoadingExamResults) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-text/70 font-body">Đang tải thông tin học sinh...</p>
                </div>
            </div>
        );
    }

    if (studentError || !student) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
                    <p className="font-semibold mb-1">Lỗi khi tải dữ liệu</p>
                    <p className="text-sm">Không thể tải thông tin học sinh. Vui lòng thử lại sau.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-8">
            {/* Back Button */}
            <Button
                variant="secondary"
                onClick={() => navigate('/students')}
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
                            <UserGroupIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading mb-1">
                                {student.name}
                            </h1>
                            <p className="text-sm text-text/60 font-body">
                                Lớp: {student.className}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <Button
                            variant="secondary"
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 min-h-[44px]"
                        >
                            <PencilIcon />
                            <span>Sửa</span>
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setIsTransferClassModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 min-h-[44px]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            <span>Chuyển lớp</span>
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 min-h-[44px]"
                        >
                            <TrashIcon />
                            <span>Xóa</span>
                        </Button>
                    </div>
                </div>

                {/* Student Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {student.dateOfBirth && (
                        <div className="flex items-center gap-2 text-sm text-text/70 font-body">
                            <CalendarIcon />
                            <span>Ngày sinh: {format(new Date(student.dateOfBirth), 'dd/MM/yyyy')}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-text/70 font-body">
                        <CalendarIcon />
                        <span>Tạo ngày {format(new Date(student.createdAt), 'dd/MM/yyyy')}</span>
                    </div>
                </div>
            </div>

            {/* Parent Info Section */}
            {(student.parentUser || student.parentName || student.parentPhone || student.parentEmail) && (
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-xl font-semibold text-text font-heading mb-4">
                        Thông tin phụ huynh
                    </h2>
                    <Card className="p-6">
                        {student.parentUser ? (
                            <div className="space-y-3">
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-xs font-semibold text-green-700 mb-2">Tài khoản phụ huynh</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <p className="text-sm font-medium text-text">Đã gán tài khoản</p>
                                    </div>
                                </div>
                                {student.parentUser.fullName && (
                                    <div className="flex items-start gap-3">
                                        <UserGroupIcon />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-text/50 font-body mb-1">Họ tên</p>
                                            <p className="text-sm sm:text-base text-text/80 font-body font-medium">
                                                {student.parentUser.fullName}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-start gap-3">
                                    <UserGroupIcon />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-text/50 font-body mb-1">Tên đăng nhập</p>
                                        <p className="text-sm sm:text-base text-text/80 font-body">
                                            {student.parentUser.username}
                                        </p>
                                    </div>
                                </div>
                                {student.parentUser.phone && (
                                    <div className="flex items-start gap-3">
                                        <PhoneIcon />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-text/50 font-body mb-1">Số điện thoại</p>
                                            <p className="text-sm sm:text-base text-text/80 font-body">
                                                {student.parentUser.phone}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {student.parentUser.email && (
                                    <div className="flex items-start gap-3">
                                        <EnvelopeIcon />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-text/50 font-body mb-1">Email</p>
                                            <p className="text-sm sm:text-base text-text/80 font-body break-words">
                                                {student.parentUser.email}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {/* Fallback to manual info if exists and not in parentUser */}
                                {student.parentPhone && !student.parentUser.phone && (
                                    <div className="flex items-start gap-3 mt-4 pt-4 border-t border-text/10">
                                        <PhoneIcon />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-text/50 font-body mb-1">Điện thoại (bổ sung)</p>
                                            <p className="text-sm sm:text-base text-text/80 font-body">
                                                {student.parentPhone}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {student.parentName && (
                                    <div className="flex items-start gap-3">
                                        <UserGroupIcon />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-text/50 font-body mb-1">Tên phụ huynh</p>
                                            <p className="text-sm sm:text-base text-text/80 font-body">
                                                {student.parentName}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {student.parentPhone && (
                                    <div className="flex items-start gap-3">
                                        <PhoneIcon />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-text/50 font-body mb-1">Điện thoại</p>
                                            <p className="text-sm sm:text-base text-text/80 font-body">
                                                {student.parentPhone}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {student.parentEmail && (
                                    <div className="flex items-start gap-3">
                                        <EnvelopeIcon />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-text/50 font-body mb-1">Email</p>
                                            <p className="text-sm sm:text-base text-text/80 font-body break-words">
                                                {student.parentEmail}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* Statistics Section */}
            <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-text font-heading mb-3 sm:mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Thống kê</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-text/60 font-body mb-1">Tỷ lệ điểm danh</p>
                        <p className="text-xl sm:text-2xl font-bold text-text font-heading">{statistics.attendanceRate.toFixed(0)}%</p>
                        <p className="text-xs text-text/50 font-body mt-1">{statistics.presentCount}/{statistics.totalAttendances}</p>
                    </Card>
                    <Card className="p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-text/60 font-body mb-1">Số nhận xét</p>
                        <p className="text-xl sm:text-2xl font-bold text-text font-heading">{statistics.totalComments}</p>
                    </Card>
                    <Card className="p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-text/60 font-body mb-1">Số bài kiểm tra</p>
                        <p className="text-xl sm:text-2xl font-bold text-text font-heading">{statistics.totalExams}</p>
                    </Card>
                    <Card className="p-3 sm:p-4 text-center">
                        <p className="text-xs sm:text-sm text-text/60 font-body mb-1">Điểm TB (Từ vựng)</p>
                        <p className="text-xl sm:text-2xl font-bold text-text font-heading">
                            {statistics.avgVocabularyScore > 0 ? statistics.avgVocabularyScore.toFixed(1) : '-'}
                        </p>
                    </Card>
                </div>
            </div>

            {/* Attendance History Section */}
            <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-text font-heading mb-3 sm:mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Lịch sử điểm danh ({attendances?.length || 0})</span>
                </h2>
                {!attendances || attendances.length === 0 ? (
                    <Card className="p-6 sm:p-8 text-center">
                        <p className="text-text/60 font-body">Chưa có lịch sử điểm danh nào.</p>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-background border-b border-text/10">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-text/70 font-heading">Ngày</th>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-text/70 font-heading">Lớp</th>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-text/70 font-heading">Trạng thái</th>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-text/70 font-heading">Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-text/10">
                                    {attendances.map((attendance) => {
                                        const statusColors = {
                                            Present: 'bg-green-100 text-green-700 border-green-200',
                                            Absent: 'bg-red-100 text-red-700 border-red-200',
                                            Late: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                                        };
                                        const statusLabels = {
                                            Present: 'Có mặt',
                                            Absent: 'Vắng mặt',
                                            Late: 'Đi muộn',
                                        };
                                        return (
                                            <tr key={attendance.id} className="hover:bg-background transition-colors duration-200">
                                                <td className="px-4 py-3 text-sm text-text font-body">
                                                    {attendance.lessonDate ? format(new Date(attendance.lessonDate), 'dd/MM/yyyy') : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-text/70 font-body">{attendance.className || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[attendance.status]}`}>
                                                        {statusLabels[attendance.status]}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-text/70 font-body break-words">{attendance.note || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* Comments History Section */}
            <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-text font-heading mb-3 sm:mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Lịch sử nhận xét ({comments?.length || 0})</span>
                </h2>
                {!comments || comments.length === 0 ? (
                    <Card className="p-6 sm:p-8 text-center">
                        <p className="text-text/60 font-body">Chưa có nhận xét nào.</p>
                    </Card>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        {comments.map((comment) => (
                            <Card key={comment.id} className="p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs sm:text-sm text-text/60 font-body">
                                                {comment.lessonDate ? format(new Date(comment.lessonDate), 'dd/MM/yyyy') : '-'}
                                            </span>
                                            {comment.className && (
                                                <>
                                                    <span className="text-text/40">•</span>
                                                    <span className="text-xs sm:text-sm text-text/60 font-body">{comment.className}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {comment.vocabularyScore != null && (
                                            <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                                                Từ vựng: {comment.vocabularyScore}
                                            </span>
                                        )}
                                        {comment.schoolExamScore != null && (
                                            <span className="inline-block px-2 py-1 bg-secondary/10 text-secondary text-xs font-semibold rounded">
                                                Trên lớp: {comment.schoolExamScore}
                                            </span>
                                        )}
                                        {comment.homeworkStatus && (
                                            <span className="inline-block px-2 py-1 bg-background border border-text/20 text-text/70 text-xs font-semibold rounded">
                                                BTVN: {comment.homeworkStatus}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {comment.comment && (
                                    <p className="text-sm sm:text-base text-text/80 font-body break-words">{comment.comment}</p>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Exam Results History Section */}
            <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-text font-heading mb-3 sm:mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Lịch sử điểm số ({examResults?.length || 0})</span>
                </h2>
                {!examResults || examResults.length === 0 ? (
                    <Card className="p-6 sm:p-8 text-center">
                        <p className="text-text/60 font-body">Chưa có điểm số nào.</p>
                    </Card>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-background border-b border-text/10">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-text/70 font-heading">Ngày</th>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-text/70 font-heading">Lớp</th>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-text/70 font-heading">Loại bài</th>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-text/70 font-heading">Speaking</th>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-text/70 font-heading">Listening</th>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-text/70 font-heading">R&W</th>
                                        <th className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-text/70 font-heading">Nhận xét</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-text/10">
                                    {examResults.map((result) => (
                                        <tr key={result.id} className="hover:bg-background transition-colors duration-200">
                                            <td className="px-4 py-3 text-sm text-text font-body">
                                                {result.examDate ? format(new Date(result.examDate), 'dd/MM/yyyy') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text/70 font-body">{result.className || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-text/70 font-body">{result.examType || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-text font-body font-medium">
                                                {result.speakingScore != null ? result.speakingScore.toFixed(1) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text font-body font-medium">
                                                {result.listeningScore != null ? result.listeningScore.toFixed(1) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text font-body font-medium">
                                                {result.readingWritingScore != null ? result.readingWritingScore.toFixed(1) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text/70 font-body break-words max-w-xs">{result.comment || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* Progress Charts Section */}
            {(progressChartData.length > 0 || examScoresChartData.length > 0) && (
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold text-text font-heading mb-3 sm:mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Biểu đồ tiến độ học tập</span>
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        {/* Vocabulary & School Exam Scores Chart */}
                        {progressChartData.length > 0 && (
                            <Card className="p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-text font-heading mb-4">
                                    Điểm từ vựng & Trên lớp theo tháng
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={progressChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="month"
                                            stroke="#64748b"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <YAxis
                                            stroke="#64748b"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{ fontSize: '12px' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="vocabularyAvg"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            name="Điểm từ vựng"
                                            dot={{ r: 4 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="schoolExamAvg"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            name="Điểm trên lớp"
                                            dot={{ r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Card>
                        )}

                        {/* Exam Scores Chart */}
                        {examScoresChartData.length > 0 && (
                            <Card className="p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-text font-heading mb-4">
                                    Điểm kiểm tra gần đây
                                </h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={examScoresChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#64748b"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <YAxis
                                            stroke="#64748b"
                                            style={{ fontSize: '12px' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '12px'
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{ fontSize: '12px' }}
                                        />
                                        <Bar dataKey="speaking" fill="#3b82f6" name="Speaking" />
                                        <Bar dataKey="listening" fill="#10b981" name="Listening" />
                                        <Bar dataKey="readingWriting" fill="#f59e0b" name="Reading & Writing" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <StudentFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                student={student}
                studentId={id}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                title="Xóa học sinh"
                message={`Bạn có chắc chắn muốn xóa học sinh "${student.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />

            {/* Transfer Class Modal */}
            <Modal
                isOpen={isTransferClassModalOpen}
                onClose={() => {
                    setIsTransferClassModalOpen(false);
                    setSelectedClassId(null);
                }}
                title="Chuyển lớp học sinh"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text/70 font-body mb-2">
                            Chọn lớp mới
                        </label>
                        <select
                            value={selectedClassId || ''}
                            onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : null)}
                            className="w-full px-4 py-2 border border-text/20 rounded-lg bg-background text-text font-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[44px]"
                        >
                            <option value="">-- Chọn lớp --</option>
                            {classes?.filter(c => c.id !== student.classId).map((classItem) => (
                                <option key={classItem.id} value={classItem.id}>
                                    {classItem.name} - {classItem.branchName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4 border-t border-text/10">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsTransferClassModalOpen(false);
                                setSelectedClassId(null);
                            }}
                            className="w-full sm:w-auto min-h-[44px]"
                        >
                            Hủy
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleTransferClass}
                            disabled={!selectedClassId || transferClassMutation.isPending}
                            className="w-full sm:w-auto min-h-[44px]"
                        >
                            {transferClassMutation.isPending ? 'Đang chuyển...' : 'Xác nhận chuyển lớp'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

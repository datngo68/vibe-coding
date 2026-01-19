import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Schedule, Class } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ScheduleFormModal } from '../../components/schedules/ScheduleFormModal';

const EmptyStateIcon = () => (
    <svg className="w-16 h-16 mx-auto text-text/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const CalendarIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const DAYS_OF_WEEK = [
    { value: 0, label: 'Chủ nhật' },
    { value: 1, label: 'Thứ hai' },
    { value: 2, label: 'Thứ ba' },
    { value: 3, label: 'Thứ tư' },
    { value: 4, label: 'Thứ năm' },
    { value: 5, label: 'Thứ sáu' },
    { value: 6, label: 'Thứ bảy' },
];

const formatTime = (time: string) => {
    if (!time) return '';
    const parts = time.split(':');
    return `${parts[0]}:${parts[1]}`;
};

export const SchedulesPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
    const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

    // Filters / search / sort / pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClassId, setFilterClassId] = useState<number | 'all'>('all');
    const [filterDayOfWeek, setFilterDayOfWeek] = useState<number | 'all'>('all');
    const [sortKey, setSortKey] = useState<'className' | 'dayOfWeek' | 'startTime'>('dayOfWeek');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    const { data: schedules, isLoading, error } = useQuery<Schedule[]>({
        queryKey: ['schedules'],
        queryFn: async () => {
            const response = await api.get('/schedules');
            return response.data;
        },
    });

    const { data: classes } = useQuery<Class[]>({
        queryKey: ['classes'],
        queryFn: async () => {
            const response = await api.get('/classes');
            return response.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/schedules/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            queryClient.invalidateQueries({ queryKey: ['schedules', 'class'] });
            setIsDeleteDialogOpen(false);
            setScheduleToDelete(null);
        },
    });

    const handleEdit = (schedule: Schedule) => {
        setSelectedSchedule(schedule);
        setIsEditModalOpen(true);
    };

    const handleDelete = (schedule: Schedule) => {
        setScheduleToDelete(schedule);
        setIsDeleteDialogOpen(true);
    };

    const filteredSchedules = useMemo(() => {
        let data = schedules || [];

        if (filterClassId !== 'all') {
            data = data.filter((s) => s.classId === filterClassId);
        }

        if (filterDayOfWeek !== 'all') {
            data = data.filter((s) => s.dayOfWeek === filterDayOfWeek);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.trim().toLowerCase();
            data = data.filter(
                (s) =>
                    s.className.toLowerCase().includes(term) ||
                    (s.room || '').toLowerCase().includes(term)
            );
        }

        data.sort((a, b) => {
            const dir = sortDir === 'asc' ? 1 : -1;
            switch (sortKey) {
                case 'className':
                    return a.className.localeCompare(b.className) * dir;
                case 'dayOfWeek':
                    return (a.dayOfWeek - b.dayOfWeek) * dir;
                case 'startTime':
                    return (a.startTime.localeCompare(b.startTime)) * dir;
                default:
                    return (a.dayOfWeek - b.dayOfWeek) * dir;
            }
        });

        return data;
    }, [schedules, filterClassId, filterDayOfWeek, searchTerm, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pagedSchedules = filteredSchedules.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const getDayLabel = (dayOfWeek: number) => {
        return DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label || `Thứ ${dayOfWeek}`;
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-8">
            {/* Header */}
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading mb-1">
                        Quản lý lịch học
                    </h1>
                    <p className="text-sm text-text/60 font-body">
                        Xem và quản lý lịch học của các lớp
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 min-h-[44px] touch-manipulation"
                >
                    <PlusIcon />
                    <span>Tạo lịch học mới</span>
                </Button>
            </div>

            {/* Toolbar: search, filters, sort, pagination size */}
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
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isAdvancedSearchOpen ? 'max-h-screen' : 'max-h-0 md:max-h-full'
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
                                placeholder="Tên lớp học, phòng học..."
                            />
                        </div>

                        {/* Filter by Class */}
                        <div>
                            <label className="block text-sm font-medium mb-1 text-text">Lọc theo lớp</label>
                            <select
                                value={filterClassId}
                                onChange={(e) => {
                                    setFilterClassId(e.target.value === 'all' ? 'all' : Number(e.target.value));
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

                        {/* Filter by Day of Week */}
                        <div>
                            <label className="block text-sm font-medium mb-1 text-text">Lọc theo ngày</label>
                            <select
                                value={filterDayOfWeek}
                                onChange={(e) => {
                                    setFilterDayOfWeek(e.target.value === 'all' ? 'all' : Number(e.target.value));
                                    setPage(1);
                                }}
                                className="input w-full min-h-[44px] touch-manipulation"
                            >
                                <option value="all">Tất cả ngày</option>
                                {DAYS_OF_WEEK.map((day) => (
                                    <option key={day.value} value={day.value}>
                                        {day.label}
                                    </option>
                                ))}
                            </select>
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
                                <option value="dayOfWeek">Ngày trong tuần</option>
                                <option value="className">Tên lớp học</option>
                                <option value="startTime">Giờ bắt đầu</option>
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
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setSearchTerm('');
                                setFilterClassId('all');
                                setFilterDayOfWeek('all');
                                setSortKey('dayOfWeek');
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

            {/* Schedules List */}
            {isLoading ? (
                <Card className="p-12 text-center">
                    <p className="text-text/60 font-body">Đang tải...</p>
                </Card>
            ) : error ? (
                <Card className="p-12 text-center">
                    <p className="text-text/60 font-body">Có lỗi xảy ra khi tải dữ liệu.</p>
                </Card>
            ) : pagedSchedules.length === 0 ? (
                <Card className="p-12 text-center">
                    <EmptyStateIcon />
                    <p className="text-text/60 font-body mb-2">
                        {filteredSchedules.length === 0 && schedules && schedules.length > 0
                            ? 'Không tìm thấy lịch học nào phù hợp với bộ lọc.'
                            : 'Chưa có lịch học nào.'}
                    </p>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-4 flex items-center gap-2 mx-auto"
                    >
                        <PlusIcon />
                        <span>Tạo lịch học đầu tiên</span>
                    </Button>
                </Card>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <Card className="p-0">
                            <table className="w-full">
                                <thead className="bg-background">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text">Lớp học</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text">Ngày trong tuần</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text">Giờ học</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text">Phòng học</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-text">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-text/10">
                                    {pagedSchedules.map((schedule) => (
                                        <tr
                                            key={schedule.id}
                                            className="hover:bg-background transition-colors duration-150 cursor-pointer"
                                            onClick={() => navigate(`/classes/${schedule.classId}`)}
                                        >
                                            <td className="px-4 py-3 text-sm font-medium text-text">{schedule.className}</td>
                                            <td className="px-4 py-3 text-sm text-text/70">{getDayLabel(schedule.dayOfWeek)}</td>
                                            <td className="px-4 py-3 text-sm text-text/70">
                                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-text/70">{schedule.room || '-'}</td>
                                            <td className="px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => handleEdit(schedule)}
                                                        className="text-xs py-1 px-2"
                                                    >
                                                        Sửa
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => handleDelete(schedule)}
                                                        className="text-xs py-1 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                    >
                                                        Xóa
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {pagedSchedules.map((schedule) => (
                            <Card
                                key={schedule.id}
                                className="p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
                                onClick={() => navigate(`/classes/${schedule.classId}`)}
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-text font-heading text-base sm:text-lg mb-1">
                                            {schedule.className}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-text/70">
                                            <CalendarIcon />
                                            <span>{getDayLabel(schedule.dayOfWeek)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm mb-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-text/70">Giờ học:</span>
                                        <span className="font-medium text-text">
                                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                        </span>
                                    </div>
                                    {schedule.room && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-text/70">Phòng học:</span>
                                            <span className="font-medium text-text">{schedule.room}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-text/10 flex gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleEdit(schedule)}
                                        className="flex-1 text-sm py-2"
                                    >
                                        Sửa
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleDelete(schedule)}
                                        className="flex-1 text-sm py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
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
                                Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredSchedules.length)} trong tổng số {filteredSchedules.length} lịch học
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

            {/* Create Modal */}
            <ScheduleFormModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {/* Edit Modal */}
            <ScheduleFormModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedSchedule(null);
                }}
                schedule={selectedSchedule}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setScheduleToDelete(null);
                }}
                onConfirm={() => {
                    if (scheduleToDelete) {
                        deleteMutation.mutate(scheduleToDelete.id);
                    }
                }}
                title="Xóa lịch học"
                message={`Bạn có chắc chắn muốn xóa lịch học của lớp "${scheduleToDelete?.className}"?`}
                variant="danger"
            />
        </div>
    );
};

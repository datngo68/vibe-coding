import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { Branch, Class } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { BranchFormModal } from '../../components/branches/BranchFormModal';
import { ClassFormModal } from '../../components/classes/ClassFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { format } from 'date-fns';

// SVG Icons từ Heroicons
const ArrowLeftIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const BuildingIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const MapPinIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const PhoneIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
);

const CalendarIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const BookOpenIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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

export const BranchDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);

    const { data: branch, isLoading: isLoadingBranch, error: branchError } = useQuery<Branch>({
        queryKey: ['branch', id],
        queryFn: async () => {
            const response = await api.get(`/branches/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    const { data: classes, isLoading: isLoadingClasses } = useQuery<Class[]>({
        queryKey: ['classes', 'branch', id],
        queryFn: async () => {
            if (!branch?.id) return [];
            const response = await api.get(`/classes/branch/${branch.id}`);
            return response.data;
        },
        enabled: !!branch?.id,
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!branch?.id) throw new Error('Branch ID is required');
            await api.delete(`/branches/${branch.id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branches'] });
            navigate('/branches');
        },
    });

    const handleDelete = () => {
        deleteMutation.mutate();
    };

    if (isLoadingBranch) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-text/70 font-body">Đang tải thông tin chi nhánh...</p>
                </div>
            </div>
        );
    }

    if (branchError || !branch) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm mb-6">
                    <p className="font-semibold mb-1">Không tìm thấy chi nhánh</p>
                    <p className="text-sm">Chi nhánh này không tồn tại hoặc đã bị xóa.</p>
                </div>
                <Button variant="secondary" onClick={() => navigate('/branches')} className="inline-flex items-center gap-2">
                    <ArrowLeftIcon />
                    <span>Quay lại danh sách</span>
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-8">
            {/* Back Button and Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <Button
                    variant="secondary"
                    onClick={() => navigate('/branches')}
                    className="inline-flex items-center gap-2"
                >
                    <ArrowLeftIcon />
                    <span>Quay lại</span>
                </Button>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={() => setIsEditModalOpen(true)}
                        variant="secondary"
                        className="inline-flex items-center gap-2"
                    >
                        <PencilIcon />
                        <span>Sửa chi nhánh</span>
                    </Button>
                    <Button
                        onClick={() => setIsDeleteDialogOpen(true)}
                        variant="secondary"
                        className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                        <TrashIcon />
                        <span>Xóa chi nhánh</span>
                    </Button>
                </div>
            </div>

            {/* Branch Info Card */}
            <Card className="mb-6 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                    {/* Icon */}
                    <div className="p-4 bg-primary/10 rounded-xl text-primary flex-shrink-0">
                        <BuildingIcon />
                    </div>

                    {/* Branch Details */}
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading mb-4">
                            {branch.name}
                        </h1>

                        <div className="space-y-3">
                            {branch.address && (
                                <div className="flex items-start gap-3">
                                    <MapPinIcon />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-text/50 font-body mb-1">Địa chỉ</p>
                                        <p className="text-sm sm:text-base text-text/80 font-body leading-relaxed break-words">
                                            {branch.address}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {branch.phone && (
                                <div className="flex items-start gap-3">
                                    <PhoneIcon />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-text/50 font-body mb-1">Điện thoại</p>
                                        <p className="text-sm sm:text-base text-text/80 font-body">
                                            {branch.phone}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <CalendarIcon />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-text/50 font-body mb-1">Ngày tạo</p>
                                    <p className="text-sm sm:text-base text-text/80 font-body">
                                        {format(new Date(branch.createdAt), 'dd/MM/yyyy')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Classes Section */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-text font-heading mb-1">
                            Lớp học
                        </h2>
                        <p className="text-sm text-text/60 font-body">
                            Danh sách các lớp học thuộc chi nhánh này
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsCreateClassModalOpen(true)}
                        className="w-full sm:w-auto"
                    >
                        Tạo lớp học mới
                    </Button>
                </div>

                {isLoadingClasses ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : !classes || classes.length === 0 ? (
                    <Card className="p-12 text-center border-2 border-dashed border-text/20">
                        <BookOpenIcon className="w-12 h-12 mx-auto text-text/30 mb-4" />
                        <h3 className="text-lg font-semibold text-text font-heading mb-2">
                            Chưa có lớp học nào
                        </h3>
                        <p className="text-text/60 font-body mb-6 max-w-md mx-auto">
                            Bắt đầu bằng cách tạo lớp học đầu tiên cho chi nhánh này.
                        </p>
                        <Button onClick={() => setIsCreateClassModalOpen(true)}>
                            Tạo lớp học đầu tiên
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {classes.map((classItem: Class) => (
                            <Card
                                key={classItem.id}
                                onClick={() => navigate(`/classes/${classItem.id}`)}
                                className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
                                            <BookOpenIcon />
                                        </div>
                                        <h3 className="text-lg font-semibold text-text font-heading group-hover:text-primary transition-colors duration-200">
                                            {classItem.name}
                                        </h3>
                                    </div>
                                </div>

                                {classItem.level && (
                                    <div className="mb-3">
                                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                                            Level {classItem.level}
                                        </span>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-text/10 flex items-center gap-2 text-xs text-text/50 font-body">
                                    <CalendarIcon />
                                    <span>Tạo ngày {format(new Date(classItem.createdAt), 'dd/MM/yyyy')}</span>
                                </div>

                                {/* Hover Indicator */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            <BranchFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                branch={branch}
                branchId={id}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                title="Xóa chi nhánh"
                message={`Bạn có chắc chắn muốn xóa chi nhánh "${branch.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="danger"
                isLoading={deleteMutation.isPending}
            />

            {/* Create Class Modal */}
            <ClassFormModal
                isOpen={isCreateClassModalOpen}
                onClose={() => setIsCreateClassModalOpen(false)}
                branchId={branch.id}
            />
        </div>
    );
};

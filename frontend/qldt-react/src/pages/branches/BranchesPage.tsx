import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Branch } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { BranchFormModal } from '../../components/branches/BranchFormModal';
import { format } from 'date-fns';

// SVG Icons từ Heroicons
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

const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const EmptyStateIcon = () => (
    <svg className="w-16 h-16 mx-auto text-text/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

export const BranchesPage = () => {
    const navigate = useNavigate();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

    // Filters / search / sort / pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<'name' | 'createdAt'>('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);

    const { data: branches, isLoading, error } = useQuery<Branch[]>({
        queryKey: ['branches'],
        queryFn: async () => {
            const response = await api.get('/branches');
            return response.data;
        },
    });

    // Filtering / searching / sorting / pagination
    const filteredBranches = useMemo(() => {
        if (!branches) return [];
        let data = [...branches];

        if (searchTerm.trim()) {
            const term = searchTerm.trim().toLowerCase();
            data = data.filter(
                (b) =>
                    b.name.toLowerCase().includes(term) ||
                    (b.address || '').toLowerCase().includes(term) ||
                    (b.phone || '').toLowerCase().includes(term)
            );
        }

        data.sort((a, b) => {
            const dir = sortDir === 'asc' ? 1 : -1;
            switch (sortKey) {
                case 'name':
                    return a.name.localeCompare(b.name) * dir;
                case 'createdAt':
                default:
                    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
            }
        });

        return data;
    }, [branches, searchTerm, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filteredBranches.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pagedBranches = filteredBranches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-text/70 font-body">Đang tải danh sách chi nhánh...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
                    <p className="font-semibold mb-1">Lỗi khi tải dữ liệu</p>
                    <p className="text-sm">Không thể tải danh sách chi nhánh. Vui lòng thử lại sau.</p>
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
                        Chi nhánh
                    </h1>
                    <p className="text-sm text-text/60 font-body">
                        Quản lý các chi nhánh của trung tâm
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                    <PlusIcon />
                    <span>Tạo chi nhánh mới</span>
                </Button>
            </div>

            {/* Toolbar: search, sort, pagination size */}
            {branches && branches.length > 0 && (
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
                                    placeholder="Tên, địa chỉ, điện thoại..."
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
                                        <option value="name|asc">Tên (A→Z)</option>
                                        <option value="name|desc">Tên (Z→A)</option>
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

                            <div className="flex items-end">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSortKey('name');
                                        setSortDir('asc');
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
            {!branches || branches.length === 0 ? (
                <div className="bg-background rounded-xl border-2 border-dashed border-text/20 p-12 sm:p-16 text-center">
                    <EmptyStateIcon />
                    <h3 className="text-lg font-semibold text-text font-heading mb-2 mt-4">
                        Chưa có chi nhánh nào
                    </h3>
                    <p className="text-text/60 font-body mb-6 max-w-md mx-auto">
                        Bắt đầu bằng cách tạo chi nhánh đầu tiên để quản lý các lớp học và học sinh.
                    </p>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2"
                    >
                        <PlusIcon />
                        <span>Tạo chi nhánh đầu tiên</span>
                    </Button>
                </div>
            ) : filteredBranches.length === 0 ? (
                <div className="bg-background rounded-xl border-2 border-dashed border-text/20 p-12 sm:p-16 text-center">
                    <EmptyStateIcon />
                    <h3 className="text-lg font-semibold text-text font-heading mb-2 mt-4">
                        Không tìm thấy chi nhánh
                    </h3>
                    <p className="text-text/60 font-body mb-6 max-w-md mx-auto">
                        Không có chi nhánh nào phù hợp với bộ lọc hiện tại.
                    </p>
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setSearchTerm('');
                            setSortKey('name');
                            setSortDir('asc');
                            setPage(1);
                        }}
                    >
                        Đặt lại lọc
                    </Button>
                </div>
            ) : (
                <>
                    {/* Branches Grid */}
                    <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm text-text/70">
                            Hiển thị {pagedBranches.length} / {filteredBranches.length} chi nhánh
                        </div>
                        {filteredBranches.length > pageSize && (
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
                        {pagedBranches.map((branch: Branch) => (
                            <Card
                                key={branch.id}
                                onClick={() => navigate(`/branches/${branch.id}`)}
                                className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                            >
                                {/* Card Content */}
                                <div className="p-6">
                                    {/* Header with Icon */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <BuildingIcon />
                                            </div>
                                            <h3 className="text-lg font-semibold text-text font-heading group-hover:text-primary transition-colors duration-200">
                                                {branch.name}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Branch Details */}
                                    <div className="space-y-3 mb-4">
                                        {branch.address && (
                                            <div className="flex items-start gap-3">
                                                <MapPinIcon />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-text/50 font-body mb-0.5">Địa chỉ</p>
                                                    <p className="text-sm text-text/80 font-body leading-relaxed break-words">
                                                        {branch.address}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {branch.phone && (
                                            <div className="flex items-start gap-3">
                                                <PhoneIcon />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-text/50 font-body mb-0.5">Điện thoại</p>
                                                    <p className="text-sm text-text/80 font-body">
                                                        {branch.phone}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-4 border-t border-text/10 flex items-center gap-2 text-xs text-text/50 font-body">
                                        <CalendarIcon />
                                        <span>Tạo ngày {format(new Date(branch.createdAt), 'dd/MM/yyyy')}</span>
                                    </div>
                                </div>

                                {/* Hover Indicator */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></div>
                            </Card>
                        ))}
                    </div>
                    {filteredBranches.length > pageSize && (
                        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="text-sm text-text/70">
                                Hiển thị {pagedBranches.length} / {filteredBranches.length} chi nhánh
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
            <BranchFormModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};

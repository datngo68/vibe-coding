import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { SharedLink } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { CreateSharedLinkModal } from '../../components/shared-links/CreateSharedLinkModal';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';

const EmptyStateIcon = () => (
  <svg className="w-16 h-16 mx-auto text-text/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const QRIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
  </svg>
);

export const SharedLinksPage = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<SharedLink | null>(null);
  const [selectedLinkForQR, setSelectedLinkForQR] = useState<SharedLink | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  // Filters / search / sort / pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntityType, setFilterEntityType] = useState<'all' | 'Lesson' | 'Exam'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Active' | 'Expired'>('all');
  const [sortKey, setSortKey] = useState<'createdAt' | 'expiresAt' | 'entityType'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const { data: sharedLinks, isLoading, error } = useQuery<SharedLink[]>({
    queryKey: ['sharedlinks'],
    queryFn: async () => {
      const response = await api.get('/sharedlinks');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/sharedlinks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedlinks'] });
      setIsDeleteDialogOpen(false);
      setLinkToDelete(null);
    },
  });

  const handleDelete = (link: SharedLink) => {
    setLinkToDelete(link);
    setIsDeleteDialogOpen(true);
  };

  const handleCopy = async (link: SharedLink) => {
    try {
      await navigator.clipboard.writeText(link.shareUrl);
      setCopiedLinkId(link.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const isExpired = (link: SharedLink) => {
    if (!link.expiresAt) return false;
    return new Date(link.expiresAt) < new Date();
  };

  const filteredLinks = useMemo(() => {
    let data = sharedLinks || [];

    if (filterEntityType !== 'all') {
      data = data.filter((l) => l.entityType === filterEntityType);
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'Expired') {
        data = data.filter((l) => isExpired(l));
      } else {
        data = data.filter((l) => !isExpired(l));
      }
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter(
        (l) =>
          l.shareUrl.toLowerCase().includes(term) ||
          l.token.toLowerCase().includes(term)
      );
    }

    data.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'entityType':
          return a.entityType.localeCompare(b.entityType) * dir;
        case 'expiresAt':
          const aExpires = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
          const bExpires = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
          return (aExpires - bExpires) * dir;
        case 'createdAt':
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
    });

    return data;
  }, [sharedLinks, filterEntityType, filterStatus, searchTerm, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedLinks = filteredLinks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'Lesson':
        return 'Buổi học';
      case 'Exam':
        return 'Bài kiểm tra';
      default:
        return type;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading mb-1">
            Quản lý link chia sẻ
          </h1>
          <p className="text-sm text-text/60 font-body">
            Tạo và quản lý các link chia sẻ công khai
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 min-h-[44px] touch-manipulation"
        >
          <PlusIcon />
          <span>Tạo link chia sẻ</span>
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
                placeholder="Link URL, token..."
              />
            </div>

            {/* Filter by Entity Type */}
            <div>
              <label className="block text-sm font-medium mb-1 text-text">Lọc theo loại</label>
              <select
                value={filterEntityType}
                onChange={(e) => {
                  setFilterEntityType(e.target.value as typeof filterEntityType);
                  setPage(1);
                }}
                className="input w-full min-h-[44px] touch-manipulation"
              >
                <option value="all">Tất cả</option>
                <option value="Lesson">Buổi học</option>
                <option value="Exam">Bài kiểm tra</option>
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
                <option value="Active">Đang hoạt động</option>
                <option value="Expired">Đã hết hạn</option>
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
                <option value="createdAt">Ngày tạo</option>
                <option value="expiresAt">Ngày hết hạn</option>
                <option value="entityType">Loại</option>
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
                setFilterEntityType('all');
                setFilterStatus('all');
                setSortKey('createdAt');
                setSortDir('desc');
                setPage(1);
              }}
              className="text-sm py-2 px-4"
            >
              Đặt lại lọc
            </Button>
          </div>
        </div>
      </Card>

      {/* Shared Links List */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <p className="text-text/60 font-body">Đang tải...</p>
        </Card>
      ) : error ? (
        <Card className="p-12 text-center">
          <p className="text-text/60 font-body">Có lỗi xảy ra khi tải dữ liệu.</p>
        </Card>
      ) : pagedLinks.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyStateIcon />
          <p className="text-text/60 font-body mb-2">
            {filteredLinks.length === 0 && sharedLinks && sharedLinks.length > 0
              ? 'Không tìm thấy link nào phù hợp với bộ lọc.'
              : 'Chưa có link chia sẻ nào.'}
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-4 flex items-center gap-2 mx-auto"
          >
            <PlusIcon />
            <span>Tạo link chia sẻ đầu tiên</span>
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
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Loại</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Link URL</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Ngày tạo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Ngày hết hạn</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-text">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-text/10">
                  {pagedLinks.map((link) => {
                    const expired = isExpired(link);
                    return (
                      <tr
                        key={link.id}
                        className="hover:bg-background transition-colors duration-150"
                      >
                        <td className="px-4 py-3 text-sm text-text/70">{getEntityTypeLabel(link.entityType)}</td>
                        <td className="px-4 py-3 text-sm text-text/70 font-mono max-w-xs truncate">
                          {link.shareUrl}
                        </td>
                        <td className="px-4 py-3 text-sm text-text/70">
                          {format(new Date(link.createdAt), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="px-4 py-3 text-sm text-text/70">
                          {link.expiresAt ? format(new Date(link.expiresAt), 'dd/MM/yyyy HH:mm') : 'Không hết hạn'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                              expired
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-green-100 text-green-800 border-green-200'
                            }`}
                          >
                            {expired ? 'Đã hết hạn' : 'Đang hoạt động'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => handleCopy(link)}
                              className="text-xs py-1 px-2 flex items-center gap-1"
                              title="Copy link"
                            >
                              <ClipboardIcon />
                              <span>{copiedLinkId === link.id ? 'Đã copy!' : 'Copy'}</span>
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => setSelectedLinkForQR(link)}
                              className="text-xs py-1 px-2 flex items-center gap-1"
                              title="Xem QR code"
                            >
                              <QRIcon />
                              <span>QR</span>
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => handleDelete(link)}
                              className="text-xs py-1 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              Xóa
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {pagedLinks.map((link) => {
              const expired = isExpired(link);
              return (
                <Card key={link.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text">{getEntityTypeLabel(link.entityType)}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                            expired
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-green-100 text-green-800 border-green-200'
                          }`}
                        >
                          {expired ? 'Đã hết hạn' : 'Đang hoạt động'}
                        </span>
                      </div>
                      <p className="text-xs text-text/70 font-mono break-all">{link.shareUrl}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text/70">Ngày tạo:</span>
                      <span className="font-medium text-text">
                        {format(new Date(link.createdAt), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text/70">Ngày hết hạn:</span>
                      <span className="font-medium text-text">
                        {link.expiresAt ? format(new Date(link.expiresAt), 'dd/MM/yyyy HH:mm') : 'Không hết hạn'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-text/10 flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleCopy(link)}
                      className="flex-1 text-sm py-2 flex items-center justify-center gap-1"
                    >
                      <ClipboardIcon />
                      <span>{copiedLinkId === link.id ? 'Đã copy!' : 'Copy'}</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedLinkForQR(link)}
                      className="flex-1 text-sm py-2 flex items-center justify-center gap-1"
                    >
                      <QRIcon />
                      <span>QR</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDelete(link)}
                      className="flex-1 text-sm py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      Xóa
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-text/70 font-body">
                Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredLinks.length)} trong tổng số {filteredLinks.length} link
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
      <CreateSharedLinkModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* QR Code Modal */}
      {selectedLinkForQR && (
        <Modal
          isOpen={!!selectedLinkForQR}
          onClose={() => setSelectedLinkForQR(null)}
          title="QR Code"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-4 p-4 bg-background rounded-lg border border-text/10">
              <QRCodeSVG value={selectedLinkForQR.shareUrl} size={200} level="H" />
              <p className="text-xs text-text/60 text-center">
                Quét mã QR để truy cập nội dung được chia sẻ
              </p>
            </div>
            <div className="p-3 bg-white rounded border border-text/10 break-all text-sm text-text/70 font-mono">
              {selectedLinkForQR.shareUrl}
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-text/10">
              <Button
                variant="secondary"
                onClick={() => {
                  handleCopy(selectedLinkForQR);
                }}
                className="flex items-center gap-2"
              >
                <ClipboardIcon />
                <span>{copiedLinkId === selectedLinkForQR.id ? 'Đã copy!' : 'Copy link'}</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectedLinkForQR(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setLinkToDelete(null);
        }}
        onConfirm={() => {
          if (linkToDelete) {
            deleteMutation.mutate(linkToDelete.id);
          }
        }}
        title="Xóa link chia sẻ"
        message={`Bạn có chắc chắn muốn xóa link chia sẻ này?`}
        variant="danger"
      />
    </div>
  );
};

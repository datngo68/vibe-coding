import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { Lesson, Exam } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { QRCodeSVG } from 'qrcode.react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

// Hook to detect mobile screen
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

interface CreateSharedLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: 'Lesson' | 'Exam';
  entityId?: number;
}

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

export const CreateSharedLinkModal = ({ isOpen, onClose, entityType, entityId }: CreateSharedLinkModalProps) => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({
    entityType: entityType || ('Lesson' as 'Lesson' | 'Exam'),
    entityId: entityId || 0,
    expiresAt: null as Date | null,
  });
  const [createdLink, setCreatedLink] = useState<{ shareUrl: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ['lessons'],
    queryFn: async () => {
      const response = await api.get('/lessons');
      return response.data;
    },
    enabled: isOpen && formData.entityType === 'Lesson',
  });

  const { data: exams } = useQuery<Exam[]>({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await api.get('/exams');
      return response.data;
    },
    enabled: isOpen && formData.entityType === 'Exam',
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      entityType: 'Lesson' | 'Exam';
      entityId: number;
      expiresAt?: string;
    }) => {
      const response = await api.post('/sharedlinks', {
        entityType: data.entityType,
        entityId: data.entityId,
        expiresAt: data.expiresAt || undefined,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sharedlinks'] });
      setCreatedLink({ shareUrl: data.shareUrl, token: data.token });
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        entityType: entityType || 'Lesson',
        entityId: entityId || 0,
        expiresAt: null,
      });
      setCreatedLink(null);
      setCopied(false);
    }
  }, [isOpen, entityType, entityId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.entityId || formData.entityId === 0) {
      return;
    }

    const submitData = {
      entityType: formData.entityType,
      entityId: formData.entityId,
      expiresAt: formData.expiresAt ? formData.expiresAt.toISOString() : undefined,
    };

    createMutation.mutate(submitData);
  };

  const handleCopy = async () => {
    if (createdLink?.shareUrl) {
      try {
        await navigator.clipboard.writeText(createdLink.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    }
  };

  const isLoading = createMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={createdLink ? 'Link chia sẻ đã tạo' : 'Tạo link chia sẻ mới'}
      size="md"
    >
      {createdLink ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Link Section */}
          <div className="p-3 sm:p-4 bg-background rounded-lg border border-text/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3">
              <label className="block text-sm font-medium text-text">Link chia sẻ</label>
              <Button
                type="button"
                variant="secondary"
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 px-3 min-h-[44px] touch-manipulation w-full sm:w-auto"
              >
                <ClipboardIcon />
                <span>{copied ? 'Đã copy!' : 'Copy link'}</span>
              </Button>
            </div>
            <div className="p-3 bg-white rounded border border-text/10 break-all text-xs sm:text-sm text-text/70 font-mono">
              {createdLink.shareUrl}
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-background rounded-lg border border-text/10">
            <label className="block text-sm font-medium text-text">QR Code</label>
            <div className="p-2 bg-white rounded-lg flex items-center justify-center">
              <QRCodeSVG 
                value={createdLink.shareUrl} 
                size={isMobile ? 160 : 200}
                level="H"
              />
            </div>
            <p className="text-xs text-text/60 text-center max-w-xs px-2">
              Quét mã QR để truy cập nội dung được chia sẻ
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-text/10">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCreatedLink(null);
                onClose();
              }}
              className="min-h-[44px] touch-manipulation w-full sm:w-auto"
            >
              Đóng
            </Button>
            <Button
              type="button"
              onClick={() => {
                setCreatedLink(null);
                setFormData({
                  entityType: entityType || 'Lesson',
                  entityId: entityId || 0,
                  expiresAt: null,
                });
              }}
              className="min-h-[44px] touch-manipulation w-full sm:w-auto"
            >
              Tạo link mới
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Entity Type */}
          <div className="w-full">
            <label className="block text-sm font-medium mb-2 text-text">
              Loại nội dung *
            </label>
            <select
              value={formData.entityType}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  entityType: e.target.value as 'Lesson' | 'Exam',
                  entityId: 0,
                });
              }}
              className="input w-full min-h-[44px] touch-manipulation text-base"
              required
              disabled={isLoading || !!entityType}
            >
              <option value="Lesson">Buổi học</option>
              <option value="Exam">Bài kiểm tra</option>
            </select>
          </div>

          {/* Entity Selection */}
          <div className="w-full">
            <label className="block text-sm font-medium mb-2 text-text">
              {formData.entityType === 'Lesson' ? 'Buổi học' : 'Bài kiểm tra'} *
            </label>
            <select
              value={formData.entityId}
              onChange={(e) => setFormData({ ...formData, entityId: Number(e.target.value) })}
              className="input w-full min-h-[44px] touch-manipulation text-base"
              required
              disabled={isLoading || !!entityId}
            >
              <option value={0}>-- Chọn {formData.entityType === 'Lesson' ? 'buổi học' : 'bài kiểm tra'} --</option>
              {formData.entityType === 'Lesson'
                ? lessons?.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.className} - Buổi {lesson.lessonNumber} ({format(new Date(lesson.date), 'dd/MM/yyyy')})
                    </option>
                  ))
                : exams?.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.className} - {exam.examType} ({format(new Date(exam.date), 'dd/MM/yyyy')})
                    </option>
                  ))}
            </select>
          </div>

          {/* Expiration Date (Optional) */}
          <div className="w-full">
            <label className="block text-sm font-medium mb-2 text-text">
              Ngày hết hạn (tùy chọn)
            </label>
            <DatePicker
              selected={formData.expiresAt}
              onChange={(date: Date | null) => setFormData({ ...formData, expiresAt: date })}
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              className="input w-full min-h-[44px] touch-manipulation text-base"
              disabled={isLoading}
              placeholderText="Chọn ngày hết hạn"
              isClearable
            />
            <p className="mt-1.5 text-xs text-text/60">
              Để trống nếu không muốn đặt thời hạn
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-text/10">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="min-h-[44px] touch-manipulation w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.entityId || formData.entityId === 0}
              className="min-h-[44px] touch-manipulation flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <LinkIcon />
              <span>{isLoading ? 'Đang tạo...' : 'Tạo link chia sẻ'}</span>
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

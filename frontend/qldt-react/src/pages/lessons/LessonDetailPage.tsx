import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { Lesson, VocabularyItem, HomeworkItem, GrammarItem, DailyComment, Student } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LessonFormModal } from '../../components/lessons/LessonFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { CreateSharedLinkModal } from '../../components/shared-links/CreateSharedLinkModal';
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

const DocumentArrowDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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

const ChatBubbleLeftRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
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
};

export const LessonDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [rowEdits, setRowEdits] = useState<Record<number, Partial<CommentRow>>>({});
  const [savingRowId, setSavingRowId] = useState<number | null>(null);

  const { data: lesson, isLoading: isLoadingLesson, error: lessonError } = useQuery<Lesson>({
    queryKey: ['lesson', id],
    queryFn: async () => {
      const response = await api.get(`/lessons/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: comments } = useQuery<DailyComment[]>({
    queryKey: ['comments', 'lesson', id],
    queryFn: async () => {
      const response = await api.get(`/comments/lesson/${id}`);
      return response.data;
    },
    enabled: !!id && !!lesson,
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ['students', 'class', lesson?.classId],
    queryFn: async () => {
      if (!lesson?.classId) return [];
      const response = await api.get(`/students/class/${lesson.classId}`);
      return response.data;
    },
    enabled: !!lesson?.classId,
  });

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
      queryClient.invalidateQueries({ queryKey: ['comments', 'lesson', id] });
      setSavingRowId(null);
    },
    onError: () => {
      setSavingRowId(null);
    },
  });

  const handleSaveRow = (row: CommentRow) => {
    if (!id || !lesson) return;
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
        lessonId: Number(id),
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!lesson?.id) throw new Error('Lesson ID is required');
      await api.delete(`/lessons/${lesson.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['lessons', 'class', lesson?.classId.toString()] });
      navigate('/lessons');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleExport = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/export/lesson/${id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Lesson_${id}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoadingLesson) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text/70 font-body">Đang tải thông tin buổi học...</p>
        </div>
      </div>
    );
  }

  if (lessonError || !lesson) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm mb-6">
          <p className="font-semibold mb-1">Không tìm thấy buổi học</p>
          <p className="text-sm">Buổi học này không tồn tại hoặc đã bị xóa.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/lessons')} className="inline-flex items-center gap-2">
          <ArrowLeftIcon />
          <span>Quay lại danh sách</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-8">
      {/* Back Button and Action Buttons */}
      <div className="mb-6">
        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/lessons')}
            className="inline-flex items-center gap-2 min-h-[44px] touch-manipulation"
          >
            <ArrowLeftIcon />
            <span>Quay lại</span>
          </Button>
        </div>

        {/* Action Buttons - Grid on mobile, Row on desktop */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={() => setIsShareModalOpen(true)}
            variant="secondary"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] touch-manipulation text-sm sm:text-base"
          >
            <LinkIcon />
            <span className="hidden sm:inline">Chia sẻ</span>
            <span className="sm:hidden">Chia sẻ</span>
          </Button>
          <Button
            onClick={() => navigate(`/comments?classId=${lesson.classId}&lessonId=${lesson.id}`)}
            variant="secondary"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] touch-manipulation text-sm sm:text-base"
          >
            <ChatBubbleLeftRightIcon />
            <span className="hidden sm:inline">Nhận xét buổi học</span>
            <span className="sm:hidden">Nhận xét</span>
          </Button>
          <Button
            onClick={handleExport}
            variant="secondary"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] touch-manipulation text-sm sm:text-base"
          >
            <DocumentArrowDownIcon />
            <span className="hidden sm:inline">Xuất Excel</span>
            <span className="sm:hidden">Xuất Excel</span>
          </Button>
          <Button
            onClick={() => setIsEditModalOpen(true)}
            variant="secondary"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] touch-manipulation text-sm sm:text-base"
          >
            <PencilIcon />
            <span className="hidden sm:inline">Sửa buổi học</span>
            <span className="sm:hidden">Sửa</span>
          </Button>
          <Button
            onClick={() => setIsDeleteDialogOpen(true)}
            variant="secondary"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] touch-manipulation text-sm sm:text-base text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 col-span-2 sm:col-span-1"
          >
            <TrashIcon />
            <span className="hidden sm:inline">Xóa buổi học</span>
            <span className="sm:hidden">Xóa buổi học</span>
          </Button>
        </div>
      </div>

      {/* Lesson Info Card */}
      <Card className="mb-6 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          {/* Icon */}
          <div className="p-4 bg-primary/10 rounded-xl text-primary flex-shrink-0">
            <BookOpenIcon className="w-8 h-8" />
          </div>

          {/* Lesson Details */}
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading mb-4">
              {lesson.className} - Buổi {lesson.lessonNumber}
            </h1>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CalendarIcon />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text/50 font-body mb-1">Ngày học</p>
                  <p className="text-sm sm:text-base text-text/80 font-body">
                    {format(new Date(lesson.date), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AcademicCapIcon />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text/50 font-body mb-1">Giáo viên</p>
                  <p className="text-sm sm:text-base text-text/80 font-body">
                    {lesson.teacherName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Vocabulary Section */}
      {lesson.vocabulary && lesson.vocabulary.length > 0 && (
        <Card className="mb-6 p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text font-heading mb-4">
            I. Vocabulary
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-yellow-100">
                  <th className="px-4 py-3 text-left border border-text/20 font-semibold text-text">Từ vựng</th>
                  <th className="px-4 py-3 text-left border border-text/20 font-semibold text-text">Loại từ</th>
                  <th className="px-4 py-3 text-left border border-text/20 font-semibold text-text">Nghĩa</th>
                </tr>
              </thead>
              <tbody>
                {lesson.vocabulary.map((item: VocabularyItem, index: number) => (
                  <tr key={index} className="border border-text/20 hover:bg-background transition-colors">
                    <td className="px-4 py-3 border border-text/20 font-medium text-text">{item.word}</td>
                    <td className="px-4 py-3 border border-text/20 text-text/70">{item.partOfSpeech || '-'}</td>
                    <td className="px-4 py-3 border border-text/20 text-text/70">{item.translation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Grammar Section */}
      {lesson.grammar && lesson.grammar.length > 0 && (
        <Card className="mb-6 p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text font-heading mb-4">
            II. Grammar
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-yellow-100">
                  <th className="px-4 py-3 text-left border border-text/20 font-semibold text-text">Chủ đề</th>
                  <th className="px-4 py-3 text-left border border-text/20 font-semibold text-text">Mô tả</th>
                </tr>
              </thead>
              <tbody>
                {lesson.grammar.map((item: GrammarItem, index: number) => (
                  <tr key={index} className="border border-text/20 hover:bg-background transition-colors">
                    <td className="px-4 py-3 border border-text/20 font-medium text-text">{item.topic}</td>
                    <td className="px-4 py-3 border border-text/20 text-text/70">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Homework Section */}
      {lesson.homework && lesson.homework.length > 0 && (
        <Card className="mb-6 p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text font-heading mb-4">
            {lesson.grammar && lesson.grammar.length > 0 ? 'III. Homework' : 'II. Homework'}
          </h2>
          <ul className="space-y-3">
            {lesson.homework.map((item: HomeworkItem, index: number) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <span className="text-primary font-bold text-lg">•</span>
                <div>
                  <p className="font-medium text-text">
                    Hoàn thành {item.page}
                  </p>
                  {item.description && (
                    <p className="text-sm text-text/70 mt-1">{item.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* General Comment Section */}
      {lesson.generalComment && (
        <Card className="mb-6 p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text font-heading mb-4">
            Nhận xét chung
          </h2>
          <p className="whitespace-pre-wrap text-text/80 font-body leading-relaxed">
            {lesson.generalComment}
          </p>
        </Card>
      )}

      {/* Comments Section - Inline Editing */}
      {students && students.length > 0 && (
        <Card className="mb-6 p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text font-heading mb-4">
            Nhận xét học sinh
          </h2>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-yellow-100">
                  <th className="px-4 py-3 text-left border border-text/20 font-semibold text-text">STT</th>
                  <th className="px-4 py-3 text-left border border-text/20 font-semibold text-text">Tên</th>
                  <th className="px-4 py-3 text-left border border-text/20 font-semibold text-text">Điểm Kiểm tra từ vựng</th>
                  <th className="px-4 py-3 text-left border border-text/20 font-semibold text-text">Điểm thi cuối kỳ 1 ở trường</th>
                  <th className="px-4 py-3 text-left border border-text/20 font-semibold text-text">Bài tập về nhà</th>
                  <th className="px-4 py-3 text-left border border-text/20 font-semibold text-text">Nhận xét</th>
                  <th className="px-4 py-3 text-left border border-text/20 font-semibold text-text">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.studentId} className="border border-text/20 hover:bg-background transition-colors">
                    <td className="px-4 py-3 border border-text/20 text-text/70">{index + 1}</td>
                    <td className="px-4 py-3 border border-text/20 font-medium text-text">{row.studentName}</td>
                    <td className="px-4 py-3 border border-text/20 bg-pink-100">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={row.vocabularyScore}
                        onChange={(e) => handleRowChange(row.studentId, 'vocabularyScore', e.target.value)}
                        className="input text-sm py-1 px-2 w-full"
                        disabled={savingRowId === row.studentId}
                        placeholder="0-10"
                      />
                    </td>
                    <td className="px-4 py-3 border border-text/20 bg-pink-100">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={row.schoolExamScore}
                        onChange={(e) => handleRowChange(row.studentId, 'schoolExamScore', e.target.value)}
                        className="input text-sm py-1 px-2 w-full"
                        disabled={savingRowId === row.studentId}
                        placeholder="0-10"
                      />
                    </td>
                    <td className="px-4 py-3 border border-text/20 bg-pink-100">
                      <select
                        value={row.homeworkStatus}
                        onChange={(e) => handleRowChange(row.studentId, 'homeworkStatus', e.target.value)}
                        className="input text-sm py-1 px-2 w-full"
                        disabled={savingRowId === row.studentId}
                      >
                        <option value="">- Chọn -</option>
                        <option value="Đủ BT">Đủ BT</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                        <option value="Chưa hoàn thành">Chưa hoàn thành</option>
                        <option value="Không nộp">Không nộp</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 border border-text/20">
                      <textarea
                        value={row.comment}
                        onChange={(e) => handleRowChange(row.studentId, 'comment', e.target.value)}
                        className="input text-sm py-1 px-2 w-full min-h-[60px]"
                        disabled={savingRowId === row.studentId}
                        placeholder="Nhận xét..."
                      />
                    </td>
                    <td className="px-4 py-3 border border-text/20">
                      <Button
                        onClick={() => handleSaveRow(row)}
                        disabled={savingRowId === row.studentId}
                        size="sm"
                        className="min-w-[80px]"
                      >
                        {savingRowId === row.studentId ? 'Đang lưu...' : 'Lưu'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {rows.map((row, index) => (
              <div key={row.studentId} className="bg-background rounded-lg border border-text/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-text">{index + 1}. {row.studentName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <label className="text-xs text-text/60 mb-1 block">Từ vựng</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={row.vocabularyScore}
                      onChange={(e) => handleRowChange(row.studentId, 'vocabularyScore', e.target.value)}
                      className="input text-sm py-1 px-2 w-full bg-pink-100"
                      disabled={savingRowId === row.studentId}
                      placeholder="0-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text/60 mb-1 block">Điểm trên lớp</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={row.schoolExamScore}
                      onChange={(e) => handleRowChange(row.studentId, 'schoolExamScore', e.target.value)}
                      className="input text-sm py-1 px-2 w-full bg-pink-100"
                      disabled={savingRowId === row.studentId}
                      placeholder="0-10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text/60 mb-1 block">BTVN</label>
                    <select
                      value={row.homeworkStatus}
                      onChange={(e) => handleRowChange(row.studentId, 'homeworkStatus', e.target.value)}
                      className="input text-sm py-1 px-2 w-full bg-pink-100"
                      disabled={savingRowId === row.studentId}
                    >
                      <option value="">- Chọn -</option>
                      <option value="Đủ BT">Đủ BT</option>
                      <option value="Hoàn thành">Hoàn thành</option>
                      <option value="Chưa hoàn thành">Chưa hoàn thành</option>
                      <option value="Không nộp">Không nộp</option>
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs text-text/60 mb-1 block">Nhận xét</label>
                  <textarea
                    value={row.comment}
                    onChange={(e) => handleRowChange(row.studentId, 'comment', e.target.value)}
                    className="input text-sm py-1 px-2 w-full min-h-[80px]"
                    disabled={savingRowId === row.studentId}
                    placeholder="Nhận xét..."
                  />
                </div>
                <Button
                  onClick={() => handleSaveRow(row)}
                  disabled={savingRowId === row.studentId}
                  className="w-full"
                  size="sm"
                >
                  {savingRowId === row.studentId ? 'Đang lưu...' : 'Lưu'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Share Link Modal */}
      <CreateSharedLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        entityType="Lesson"
        entityId={lesson?.id}
      />

      {/* Edit Modal */}
      <LessonFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lesson={lesson}
        classId={lesson.classId}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Xóa buổi học"
        message={`Bạn có chắc chắn muốn xóa buổi học số ${lesson.lessonNumber} của lớp "${lesson.className}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

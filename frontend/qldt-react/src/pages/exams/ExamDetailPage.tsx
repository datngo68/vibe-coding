import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { Exam, ExamResult, Student } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { CreateSharedLinkModal } from '../../components/shared-links/CreateSharedLinkModal';
import { ExamFormModal } from '../../components/exams/ExamFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { format } from 'date-fns';

// SVG Icons từ Heroicons
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const DocumentTextIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

const LinkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

type ResultRow = {
  studentId: number;
  studentName: string;
  resultId?: number;
  speakingScore: string;
  listeningScore: string;
  readingWritingScore: string;
  comment: string;
};

export const ExamDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteResultDialogOpen, setIsDeleteResultDialogOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<ExamResult | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { data: exam, isLoading: examLoading, error: examError } = useQuery<Exam>({
    queryKey: ['exam', id],
    queryFn: async () => {
      const response = await api.get(`/exams/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: results, isLoading: resultsLoading } = useQuery<ExamResult[]>({
    queryKey: ['exam-results', id],
    queryFn: async () => {
      const response = await api.get(`/exams/${id}/results`);
      return response.data;
    },
    enabled: !!id,
  });

  // Students of this exam's class for inline entry
  const { data: students } = useQuery<Student[]>({
    queryKey: ['students', 'class', exam?.classId],
    queryFn: async () => {
      if (!exam?.classId) return [];
      const response = await api.get(`/students/class/${exam.classId}`);
      return response.data;
    },
    enabled: !!exam?.classId,
  });

  const baseRows = useMemo(() => {
    if (!students) return [];
    const resultMap = new Map<number, ExamResult>();
    results?.forEach((r) => resultMap.set(r.studentId, r));
    return students.map((student) => {
      const r = resultMap.get(student.id);
      return {
        studentId: student.id,
        studentName: student.name,
        resultId: r?.id,
        speakingScore: r?.speakingScore?.toString() || '',
        listeningScore: r?.listeningScore?.toString() || '',
        readingWritingScore: r?.readingWritingScore?.toString() || '',
        comment: r?.comment || '',
      } as ResultRow;
    });
  }, [students, results]);

  const [rowEdits, setRowEdits] = useState<Record<number, Partial<ResultRow>>>({});
  const [savingRowId, setSavingRowId] = useState<number | null>(null);

  const rows = useMemo(() => {
    return baseRows.map((row) => ({
      ...row,
      ...(rowEdits[row.studentId] || {}),
    }));
  }, [baseRows, rowEdits]);

  const deleteExamMutation = useMutation({
    mutationFn: async () => {
      if (!exam?.id) throw new Error('Exam ID is required');
      await api.delete(`/exams/${exam.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exams', 'class', exam?.classId.toString()] });
      navigate('/exams');
    },
  });

  const deleteResultMutation = useMutation({
    mutationFn: async (resultId: number) => {
      await api.delete(`/exams/results/${resultId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-results', id] });
      setIsDeleteResultDialogOpen(false);
      setResultToDelete(null);
    },
  });

  const upsertResultMutation = useMutation({
    mutationFn: async (payload: {
      resultId?: number;
      studentId: number;
      examId: number;
      speakingScore?: number;
      listeningScore?: number;
      readingWritingScore?: number;
      comment?: string;
    }) => {
      const { resultId, ...data } = payload;
      if (resultId) {
        const response = await api.put(`/exams/results/${resultId}`, data);
        return response.data;
      } else {
        const response = await api.post(`/exams/results`, data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-results', id] });
      setSavingRowId(null);
    },
    onError: () => {
      setSavingRowId(null);
    },
  });

  const handleDeleteExam = () => {
    deleteExamMutation.mutate();
  };

  const handleDeleteResult = (result: ExamResult, e: React.MouseEvent) => {
    e.stopPropagation();
    setResultToDelete(result);
    setIsDeleteResultDialogOpen(true);
  };

  const confirmDeleteResult = () => {
    if (resultToDelete) {
      setSavingRowId(resultToDelete.studentId);
      deleteResultMutation.mutate(resultToDelete.id, {
        onSettled: () => setSavingRowId(null),
      });
    }
  };

  const handleExport = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/export/exam/${id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Exam_${id}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleRowChange = (
    studentId: number,
    field: keyof Omit<ResultRow, 'studentId' | 'studentName' | 'resultId'>,
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

  const handleSaveRow = (row: ResultRow) => {
    if (!exam) return;
    const parseScore = (v: string) => {
      if (v === '') return undefined;
      const n = Number(v);
      if (isNaN(n) || n < 0 || n > 10) return 'invalid';
      return n;
    };

    const speaking = parseScore(row.speakingScore);
    const listening = parseScore(row.listeningScore);
    const readingWriting = parseScore(row.readingWritingScore);

    if (speaking === 'invalid' || listening === 'invalid' || readingWriting === 'invalid') {
      alert('Điểm phải trong khoảng 0 - 10 (có thể để trống).');
      return;
    }

    setSavingRowId(row.studentId);
    upsertResultMutation.mutate(
      {
        resultId: row.resultId,
        studentId: row.studentId,
        examId: exam.id,
        speakingScore: speaking as number | undefined,
        listeningScore: listening as number | undefined,
        readingWritingScore: readingWriting as number | undefined,
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

  // Calculate statistics
  const stats = results && results.length > 0 ? {
    avgSpeaking: results.filter(r => r.speakingScore != null).length > 0
      ? results.filter(r => r.speakingScore != null).reduce((sum, r) => sum + (r.speakingScore || 0), 0) / results.filter(r => r.speakingScore != null).length
      : null,
    avgListening: results.filter(r => r.listeningScore != null).length > 0
      ? results.filter(r => r.listeningScore != null).reduce((sum, r) => sum + (r.listeningScore || 0), 0) / results.filter(r => r.listeningScore != null).length
      : null,
    avgReadingWriting: results.filter(r => r.readingWritingScore != null).length > 0
      ? results.filter(r => r.readingWritingScore != null).reduce((sum, r) => sum + (r.readingWritingScore || 0), 0) / results.filter(r => r.readingWritingScore != null).length
      : null,
  } : null;

  if (examLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text/70 font-body">Đang tải thông tin bài kiểm tra...</p>
        </div>
      </div>
    );
  }

  if (examError || !exam) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm mb-6">
          <p className="font-semibold mb-1">Không tìm thấy bài kiểm tra</p>
          <p className="text-sm">Bài kiểm tra này không tồn tại hoặc đã bị xóa.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/exams')} className="inline-flex items-center gap-2">
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
          onClick={() => navigate('/exams')}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeftIcon />
          <span>Quay lại</span>
        </Button>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleExport}
            variant="secondary"
            className="inline-flex items-center gap-2"
          >
            <DocumentArrowDownIcon />
            <span>Xuất Excel</span>
          </Button>
          <Button
            onClick={() => setIsShareModalOpen(true)}
            variant="secondary"
            className="inline-flex items-center gap-2"
            disabled={!exam}
          >
            <LinkIcon />
            <span>Chia sẻ</span>
          </Button>
          <Button
            onClick={() => setIsEditModalOpen(true)}
            variant="secondary"
            className="inline-flex items-center gap-2"
          >
            <PencilIcon />
            <span>Sửa bài kiểm tra</span>
          </Button>
          <Button
            onClick={() => setIsDeleteDialogOpen(true)}
            variant="secondary"
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <TrashIcon />
            <span>Xóa bài kiểm tra</span>
          </Button>
        </div>
      </div>

      {/* Exam Info Card */}
      <Card className="mb-6 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
          {/* Icon */}
          <div className="p-4 bg-primary/10 rounded-xl text-primary flex-shrink-0">
            <DocumentTextIcon className="w-8 h-8" />
          </div>

          {/* Exam Details */}
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading mb-4">
              {exam.className} - {exam.examType}
            </h1>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CalendarIcon />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text/50 font-body mb-1">Ngày kiểm tra</p>
                  <p className="text-sm sm:text-base text-text/80 font-body">
                    {format(new Date(exam.date), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <AcademicCapIcon />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text/50 font-body mb-1">Giáo viên</p>
                  <p className="text-sm sm:text-base text-text/80 font-body">
                    {exam.teacherName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics Card */}
      {stats && (stats.avgSpeaking != null || stats.avgListening != null || stats.avgReadingWriting != null) && (
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-semibold text-text font-heading mb-4">Thống kê</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.avgSpeaking != null && (
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-text/60 font-body mb-1">Điểm TB Speaking</p>
                <p className="text-2xl font-bold text-primary">{stats.avgSpeaking.toFixed(1)}</p>
              </div>
            )}
            {stats.avgListening != null && (
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-text/60 font-body mb-1">Điểm TB Listening</p>
                <p className="text-2xl font-bold text-primary">{stats.avgListening.toFixed(1)}</p>
              </div>
            )}
            {stats.avgReadingWriting != null && (
              <div className="text-center p-4 bg-background rounded-lg">
                <p className="text-sm text-text/60 font-body mb-1">Điểm TB Reading & Writing</p>
                <p className="text-2xl font-bold text-primary">{stats.avgReadingWriting.toFixed(1)}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Results Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-text font-heading mb-1">
              Kết quả kiểm tra
            </h2>
            <p className="text-sm text-text/60 font-body">
              Danh sách điểm số của học sinh
            </p>
          </div>
        </div>

        {resultsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Card className="overflow-hidden">
            {rows.length === 0 ? (
              <div className="p-6 text-center text-text/60">Chưa có học sinh trong lớp này.</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr className="bg-yellow-100">
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/20 font-semibold text-xs sm:text-sm">STT</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/20 font-semibold text-xs sm:text-sm">Học sinh</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/20 font-semibold text-xs sm:text-sm">Speaking</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/20 font-semibold text-xs sm:text-sm">Listening</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/20 font-semibold text-xs sm:text-sm">Reading & Writing</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/20 font-semibold text-xs sm:text-sm">Nhận xét</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left border border-text/20 font-semibold text-xs sm:text-sm">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={row.studentId} className="border-b border-text/10 hover:bg-background transition-colors">
                          <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/20 text-xs sm:text-sm">{index + 1}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/20 font-medium text-xs sm:text-sm whitespace-nowrap">{row.studentName}</td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/20">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={row.speakingScore}
                              onChange={(e) => handleRowChange(row.studentId, 'speakingScore', e.target.value)}
                              className="input text-xs sm:text-sm py-1 px-2 min-w-[80px]"
                              disabled={savingRowId === row.studentId}
                              placeholder="0-10"
                            />
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/20">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={row.listeningScore}
                              onChange={(e) => handleRowChange(row.studentId, 'listeningScore', e.target.value)}
                              className="input text-xs sm:text-sm py-1 px-2 min-w-[80px]"
                              disabled={savingRowId === row.studentId}
                              placeholder="0-10"
                            />
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/20">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={row.readingWritingScore}
                              onChange={(e) => handleRowChange(row.studentId, 'readingWritingScore', e.target.value)}
                              className="input text-xs sm:text-sm py-1 px-2 min-w-[100px]"
                              disabled={savingRowId === row.studentId}
                              placeholder="0-10"
                            />
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/20">
                            <input
                              type="text"
                              value={row.comment}
                              onChange={(e) => handleRowChange(row.studentId, 'comment', e.target.value)}
                              className="input text-xs sm:text-sm py-1 px-2 min-w-[140px]"
                              disabled={savingRowId === row.studentId}
                              placeholder="Nhận xét ngắn"
                            />
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 border border-text/20 text-xs sm:text-sm">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="secondary"
                                onClick={() => handleSaveRow(row)}
                                className="text-xs py-1 px-2"
                                disabled={savingRowId === row.studentId}
                              >
                                {savingRowId === row.studentId ? 'Đang lưu...' : 'Lưu'}
                              </Button>
                              {row.resultId && (
                                <Button
                                  variant="secondary"
                                  onClick={(e) => handleDeleteResult({ id: row.resultId, studentId: row.studentId } as ExamResult, e)}
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
                  {rows.map((row, index) => (
                    <Card key={row.studentId} className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-text">{row.studentName}</p>
                          <p className="text-xs text-text/60 mt-0.5">STT #{index + 1}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => handleSaveRow(row)}
                            className="text-xs py-1 px-2 min-w-[64px]"
                            disabled={savingRowId === row.studentId}
                          >
                            {savingRowId === row.studentId ? 'Đang lưu...' : 'Lưu'}
                          </Button>
                          {row.resultId && (
                            <Button
                              variant="secondary"
                              onClick={(e) => handleDeleteResult({ id: row.resultId, studentId: row.studentId } as ExamResult, e)}
                              className="text-xs py-1 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 min-w-[64px]"
                              disabled={savingRowId === row.studentId}
                            >
                              Xóa
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Scores row - 3 columns */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <label className="text-xs text-text/70 block mb-1">Speaking</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={row.speakingScore}
                            onChange={(e) => handleRowChange(row.studentId, 'speakingScore', e.target.value)}
                            className="input text-xs py-1.5 px-2 w-full"
                            disabled={savingRowId === row.studentId}
                            placeholder="0-10"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-xs text-text/70 block mb-1">Listening</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={row.listeningScore}
                            onChange={(e) => handleRowChange(row.studentId, 'listeningScore', e.target.value)}
                            className="input text-xs py-1.5 px-2 w-full"
                            disabled={savingRowId === row.studentId}
                            placeholder="0-10"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-xs text-text/70 block mb-1">Reading & Writing</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={row.readingWritingScore}
                            onChange={(e) => handleRowChange(row.studentId, 'readingWritingScore', e.target.value)}
                            className="input text-xs py-1.5 px-2 w-full"
                            disabled={savingRowId === row.studentId}
                            placeholder="0-10"
                          />
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
              </>
            )}
          </Card>
        )}
      </div>

      {/* Edit Exam Modal */}
      <ExamFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        exam={exam}
        classId={exam.classId}
      />

      {/* Share Link Modal */}
      <CreateSharedLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        entityType="Exam"
        entityId={exam?.id}
      />

      {/* Delete Exam Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteExam}
        title="Xóa bài kiểm tra"
        message={`Bạn có chắc chắn muốn xóa bài kiểm tra "${exam.examType}" của lớp "${exam.className}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteExamMutation.isPending}
      />

      {/* Delete Result Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteResultDialogOpen}
        onClose={() => {
          setIsDeleteResultDialogOpen(false);
          setResultToDelete(null);
        }}
        onConfirm={confirmDeleteResult}
        title="Xóa kết quả kiểm tra"
        message={`Bạn có chắc chắn muốn xóa kết quả kiểm tra của học sinh "${resultToDelete?.studentName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        isLoading={deleteResultMutation.isPending}
      />
    </div>
  );
};

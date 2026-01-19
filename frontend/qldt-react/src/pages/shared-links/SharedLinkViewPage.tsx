import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { SharedLink, Lesson, Exam, ExamResult, DailyComment } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { format } from 'date-fns';

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const BookOpenIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const AcademicCapIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7M5.176 9.032a12.083 12.083 0 011.665-6.479L12 14l-5.159 2.553a11.965 11.965 0 01-1.665-6.48zM18.824 9.032a11.965 11.965 0 01-1.665 6.48L12 14l5.159-2.947a12.076 12.076 0 011.665 6.479z" />
  </svg>
);

export const SharedLinkViewPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const { data: sharedLink, isLoading, error } = useQuery<SharedLink>({
    queryKey: ['sharedlink', token],
    queryFn: async () => {
      const response = await api.get(`/sharedlinks/${token}`);
      return response.data;
    },
    enabled: !!token,
  });

  const { data: lesson } = useQuery<Lesson>({
    queryKey: ['lesson', 'shared', sharedLink?.entityId],
    queryFn: async () => {
      const response = await api.get(`/lessons/shared/${sharedLink!.entityId}`);
      return response.data;
    },
    enabled: !!sharedLink && sharedLink.entityType === 'Lesson',
  });

  const { data: comments } = useQuery<DailyComment[]>({
    queryKey: ['comments', 'shared', 'lesson', sharedLink?.entityId],
    queryFn: async () => {
      const response = await api.get(`/comments/shared/lesson/${sharedLink!.entityId}`);
      return response.data;
    },
    enabled: !!sharedLink && sharedLink.entityType === 'Lesson' && !!lesson,
  });

  const { data: exam } = useQuery<Exam>({
    queryKey: ['exam', 'shared', sharedLink?.entityId],
    queryFn: async () => {
      const response = await api.get(`/exams/shared/${sharedLink!.entityId}`);
      return response.data;
    },
    enabled: !!sharedLink && sharedLink.entityType === 'Exam',
  });

  const { data: examResults } = useQuery<ExamResult[]>({
    queryKey: ['exam-results', 'shared', sharedLink?.entityId],
    queryFn: async () => {
      const response = await api.get(`/exams/shared/${sharedLink!.entityId}/results`);
      return response.data;
    },
    enabled: !!sharedLink && sharedLink.entityType === 'Exam',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text/60 font-body">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !sharedLink) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-3 sm:px-4 py-8">
        <Card className="p-6 sm:p-8 text-center max-w-md w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-text font-heading mb-2">Link không hợp lệ</h1>
          <p className="text-sm sm:text-base text-text/60 font-body mb-4 sm:mb-6">
            Link chia sẻ này không tồn tại hoặc đã hết hạn.
          </p>
          <Button onClick={() => navigate('/login')} className="mx-auto min-h-[44px] touch-manipulation w-full sm:w-auto">
            Đăng nhập
          </Button>
        </Card>
      </div>
    );
  }

  // Check expiration
  if (sharedLink.expiresAt && new Date(sharedLink.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-3 sm:px-4 py-8">
        <Card className="p-6 sm:p-8 text-center max-w-md w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-text font-heading mb-2">Link đã hết hạn</h1>
          <p className="text-sm sm:text-base text-text/60 font-body mb-4 sm:mb-6">
            Link chia sẻ này đã hết hạn vào ngày {format(new Date(sharedLink.expiresAt), 'dd/MM/yyyy HH:mm')}.
          </p>
          <Button onClick={() => navigate('/login')} className="mx-auto min-h-[44px] touch-manipulation w-full sm:w-auto">
            Đăng nhập
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-4 sm:pb-8">
      {/* Simple Header */}
      <div className="bg-white border-b border-text/10 px-3 sm:px-4 py-3 sm:py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-text font-heading">Nội dung được chia sẻ</h1>
          <Button
            variant="secondary"
            onClick={() => window.print()}
            className="text-xs sm:text-sm min-h-[44px] touch-manipulation px-3 sm:px-4"
          >
            In trang
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {sharedLink.entityType === 'Lesson' && lesson ? (
          <Card className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <BookOpenIcon />
                <h2 className="text-xl sm:text-2xl font-bold text-text font-heading">Buổi học</h2>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-sm sm:text-base text-text/60 font-body">
                  {lesson.className} - Buổi {lesson.lessonNumber}
                </p>
                <p className="text-sm sm:text-base text-text/60 font-body">
                  Ngày: {format(new Date(lesson.date), 'dd/MM/yyyy')}
                </p>
                <p className="text-sm sm:text-base text-text/60 font-body">Giáo viên: {lesson.teacherName}</p>
              </div>
            </div>

            {lesson.vocabulary && lesson.vocabulary.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-text font-heading mb-3">Từ vựng</h3>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text">Từ</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text">Loại từ</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text">Nghĩa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-text/10">
                      {lesson.vocabulary.map((vocab, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-text font-medium">{vocab.word}</td>
                          <td className="px-4 py-2 text-sm text-text/70">{vocab.partOfSpeech || '-'}</td>
                          <td className="px-4 py-2 text-sm text-text/70">{vocab.translation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {lesson.vocabulary.map((vocab, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-text">{vocab.word}</p>
                        <div className="flex items-center gap-2 text-xs text-text/60">
                          {vocab.partOfSpeech && (
                            <span className="px-2 py-0.5 bg-background rounded">{vocab.partOfSpeech}</span>
                          )}
                          <span>{vocab.translation}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {lesson.grammar && lesson.grammar.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-text font-heading mb-3">Ngữ pháp</h3>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text">Chủ đề</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text">Mô tả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-text/10">
                      {lesson.grammar.map((grammar, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-text font-medium">{grammar.topic}</td>
                          <td className="px-4 py-2 text-sm text-text/70">{grammar.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {lesson.grammar.map((grammar, index) => (
                    <Card key={index} className="p-3">
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-text">{grammar.topic}</p>
                        <p className="text-sm text-text/70">{grammar.description}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {lesson.homework && lesson.homework.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-text font-heading mb-3">Bài tập về nhà</h3>
                <div className="space-y-2 sm:space-y-3">
                  {lesson.homework.map((hw, index) => (
                    <Card key={index} className="p-3 sm:p-4">
                      <p className="text-sm sm:text-base font-medium text-text">
                        Trang {hw.page}: {hw.description}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {lesson.generalComment && (
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-text font-heading mb-3">Nhận xét chung</h3>
                <Card className="p-3 sm:p-4">
                  <p className="text-sm sm:text-base text-text/70 font-body whitespace-pre-wrap leading-relaxed">{lesson.generalComment}</p>
                </Card>
              </div>
            )}

            {comments && comments.length > 0 && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-text font-heading mb-3">Nhận xét học sinh</h3>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-yellow-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text">Học sinh</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text bg-pink-100">Từ vựng</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text bg-pink-100">Điểm trên lớp</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text bg-pink-100">BTVN</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text">Nhận xét</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-text/10">
                      {comments.map((comment) => (
                        <tr key={comment.id}>
                          <td className="px-4 py-2 text-sm font-medium text-text">{comment.studentName}</td>
                          <td className="px-4 py-2 text-sm text-text/70 bg-pink-100">{comment.vocabularyScore?.toFixed(1) || '-'}</td>
                          <td className="px-4 py-2 text-sm text-text/70 bg-pink-100">{comment.schoolExamScore?.toFixed(1) || '-'}</td>
                          <td className="px-4 py-2 text-sm text-text/70 bg-pink-100">{comment.homeworkStatus || '-'}</td>
                          <td className="px-4 py-2 text-sm text-text/70">{comment.comment || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {comments.map((comment) => (
                    <Card key={comment.id} className="p-3">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-text">{comment.studentName}</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-xs text-text/60 mb-0.5">Từ vựng</p>
                            <p className="text-sm font-medium text-text bg-pink-100 px-2 py-1 rounded">
                              {comment.vocabularyScore?.toFixed(1) || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-text/60 mb-0.5">Điểm trên lớp</p>
                            <p className="text-sm font-medium text-text bg-pink-100 px-2 py-1 rounded">
                              {comment.schoolExamScore?.toFixed(1) || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-text/60 mb-0.5">BTVN</p>
                            <p className="text-sm font-medium text-text bg-pink-100 px-2 py-1 rounded">
                              {comment.homeworkStatus || '-'}
                            </p>
                          </div>
                        </div>
                        {comment.comment && (
                          <div>
                            <p className="text-xs text-text/60 mb-1">Nhận xét</p>
                            <p className="text-sm text-text/70">{comment.comment}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ) : sharedLink.entityType === 'Exam' && exam ? (
          <Card className="p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <AcademicCapIcon />
                <h2 className="text-xl sm:text-2xl font-bold text-text font-heading">Bài kiểm tra</h2>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-sm sm:text-base text-text/60 font-body">
                  {exam.className} - {exam.examType}
                </p>
                <p className="text-sm sm:text-base text-text/60 font-body">
                  Ngày: {format(new Date(exam.date), 'dd/MM/yyyy')}
                </p>
                <p className="text-sm sm:text-base text-text/60 font-body">Giáo viên: {exam.teacherName}</p>
              </div>
            </div>

            {examResults && examResults.length > 0 && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-text font-heading mb-3">Kết quả</h3>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-yellow-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text">Học sinh</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text">Speaking</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text">Listening</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text">Reading & Writing</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-text">Nhận xét</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-text/10">
                      {examResults.map((result) => (
                        <tr key={result.id}>
                          <td className="px-4 py-2 text-sm font-medium text-text">{result.studentName}</td>
                          <td className="px-4 py-2 text-sm text-text/70">{result.speakingScore?.toFixed(1) || '-'}</td>
                          <td className="px-4 py-2 text-sm text-text/70">{result.listeningScore?.toFixed(1) || '-'}</td>
                          <td className="px-4 py-2 text-sm text-text/70">{result.readingWritingScore?.toFixed(1) || '-'}</td>
                          <td className="px-4 py-2 text-sm text-text/70">{result.comment || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {examResults.map((result) => (
                    <Card key={result.id} className="p-3">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-text">{result.studentName}</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-xs text-text/60 mb-0.5">Speaking</p>
                            <p className="text-sm font-medium text-text bg-pink-100 px-2 py-1 rounded">
                              {result.speakingScore?.toFixed(1) || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-text/60 mb-0.5">Listening</p>
                            <p className="text-sm font-medium text-text bg-pink-100 px-2 py-1 rounded">
                              {result.listeningScore?.toFixed(1) || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-text/60 mb-0.5">R & W</p>
                            <p className="text-sm font-medium text-text bg-pink-100 px-2 py-1 rounded">
                              {result.readingWritingScore?.toFixed(1) || '-'}
                            </p>
                          </div>
                        </div>
                        {result.comment && (
                          <div>
                            <p className="text-xs text-text/60 mb-1">Nhận xét</p>
                            <p className="text-sm text-text/70">{result.comment}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-text/60 font-body">Đang tải nội dung...</p>
          </Card>
        )}
      </div>
    </div>
  );
};

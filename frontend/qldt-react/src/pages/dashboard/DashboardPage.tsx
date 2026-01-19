import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import type { DashboardStatistics, RecentActivity, Class, Lesson } from '../../types';
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

// SVG Icons
const BuildingOfficeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const AcademicCapIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7M5.176 9.032a12.083 12.083 0 011.665-6.479L12 14l-5.159 2.553a11.965 11.965 0 01-1.665-6.48zM18.824 9.032a11.965 11.965 0 01-1.665 6.48L12 14l5.159-2.947a12.076 12.076 0 011.665 6.479z" />
  </svg>
);

const UserGroupIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const BookOpenIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const ChartBarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XMarkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChatBubbleLeftRightIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
  </svg>
);

const ClipboardDocumentCheckIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const UserCheckIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isTeacher = user?.role === 'Teacher';

  const { data: statistics, isLoading: statsLoading } = useQuery<DashboardStatistics>({
    queryKey: ['dashboard', 'statistics'],
    queryFn: async () => {
      const response = await api.get('/dashboard/statistics');
      return response.data;
    },
  });

  const { data: recentActivities, isLoading: activitiesLoading } = useQuery<RecentActivity[]>({
    queryKey: ['dashboard', 'recent-activities'],
    queryFn: async () => {
      const response = await api.get('/dashboard/recent-activities?limit=10');
      return response.data;
    },
  });

  // Fetch classes for teacher
  const { data: teacherClasses } = useQuery<Class[]>({
    queryKey: ['classes', 'teacher'],
    queryFn: async () => {
      const response = await api.get('/classes');
      return response.data;
    },
    enabled: isTeacher,
  });

  // Fetch recent lessons for teacher
  const { data: recentLessons } = useQuery<Lesson[]>({
    queryKey: ['lessons', 'recent', 'teacher'],
    queryFn: async () => {
      const response = await api.get('/lessons');
      return response.data?.slice(0, 5) || [];
    },
    enabled: isTeacher,
  });

  // Mutation to update class completion status
  const updateCompletionMutation = useMutation({
    mutationFn: async ({ classId, isCompleted }: { classId: number; isCompleted: boolean }) => {
      await api.patch(`/classes/${classId}/complete`, isCompleted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', 'teacher'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Lesson':
        return <BookOpenIcon />;
      case 'Exam':
        return <ClipboardDocumentCheckIcon />;
      case 'Class':
        return <AcademicCapIcon />;
      case 'Student':
        return <UserGroupIcon />;
      default:
        return <ChartBarIcon />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'Lesson':
        return 'text-blue-600 bg-blue-50';
      case 'Exam':
        return 'text-purple-600 bg-purple-50';
      case 'Class':
        return 'text-green-600 bg-green-50';
      case 'Student':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (statsLoading || activitiesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 lg:pb-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text/70 font-body">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading mb-2">
          Dashboard
        </h1>
        <p className="text-text/70 font-body">
          Chào mừng, {user?.username} ({user?.role})
        </p>
      </div>

      {/* Quick Actions - Teacher Focused */}
      {isTeacher ? (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-text font-heading mb-4">
            Chức năng nhanh
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Button
              onClick={() => navigate('/comments')}
              variant="primary"
              className="flex flex-col items-center justify-center gap-2 py-4 h-auto min-h-[100px] sm:min-h-[120px]"
            >
              <ChatBubbleLeftRightIcon />
              <span className="text-sm sm:text-base font-medium">Nhận xét buổi học</span>
            </Button>
            <Button
              onClick={() => navigate('/lessons?action=new')}
              variant="primary"
              className="flex flex-col items-center justify-center gap-2 py-4 h-auto min-h-[100px] sm:min-h-[120px]"
            >
              <BookOpenIcon />
              <span className="text-sm sm:text-base font-medium">Tạo buổi học</span>
            </Button>
            <Button
              onClick={() => navigate('/exams?action=new')}
              variant="primary"
              className="flex flex-col items-center justify-center gap-2 py-4 h-auto min-h-[100px] sm:min-h-[120px]"
            >
              <ClipboardDocumentCheckIcon />
              <span className="text-sm sm:text-base font-medium">Tạo bài kiểm tra</span>
            </Button>
            <Button
              onClick={() => navigate('/attendance/quick')}
              variant="primary"
              className="flex flex-col items-center justify-center gap-2 py-4 h-auto min-h-[100px] sm:min-h-[120px]"
            >
              <UserCheckIcon />
              <span className="text-sm sm:text-base font-medium">Điểm danh nhanh</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button
            onClick={() => navigate('/classes?action=new')}
            variant="secondary"
            className="flex items-center justify-center gap-2 py-3"
          >
            <PlusIcon />
            <span className="text-sm sm:text-base">Lớp học</span>
          </Button>
          <Button
            onClick={() => navigate('/students?action=add')}
            variant="secondary"
            className="flex items-center justify-center gap-2 py-3"
          >
            <PlusIcon />
            <span className="text-sm sm:text-base">Học sinh</span>
          </Button>
          <Button
            onClick={() => navigate('/lessons?action=new')}
            variant="secondary"
            className="flex items-center justify-center gap-2 py-3"
          >
            <PlusIcon />
            <span className="text-sm sm:text-base">Buổi học</span>
          </Button>
          <Button
            onClick={() => navigate('/exams?action=new')}
            variant="secondary"
            className="flex items-center justify-center gap-2 py-3"
          >
            <PlusIcon />
            <span className="text-sm sm:text-base">Bài kiểm tra</span>
          </Button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-text/50 font-body mb-1">Chi nhánh</p>
              <p className="text-2xl sm:text-3xl font-bold text-text font-heading">
                {statistics?.totalBranches ?? 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
              <BuildingOfficeIcon />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-text/50 font-body mb-1">Lớp học</p>
              <p className="text-2xl sm:text-3xl font-bold text-text font-heading">
                {statistics?.totalClasses ?? 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg text-green-600">
              <AcademicCapIcon />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-text/50 font-body mb-1">Học sinh</p>
              <p className="text-2xl sm:text-3xl font-bold text-text font-heading">
                {statistics?.totalStudents ?? 0}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
              <UserGroupIcon />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-text/50 font-body mb-1">Giáo viên</p>
              <p className="text-2xl sm:text-3xl font-bold text-text font-heading">
                {statistics?.totalTeachers ?? 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
              <AcademicCapIcon />
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-text/50 font-body mb-2">Tỷ lệ điểm danh</p>
          <p className="text-2xl sm:text-3xl font-bold text-text font-heading">
            {statistics?.averageAttendanceRate.toFixed(1) ?? '0.0'}%
          </p>
        </Card>

        <Card className="p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-text/50 font-body mb-2">Điểm trung bình</p>
          <p className="text-2xl sm:text-3xl font-bold text-text font-heading">
            {statistics?.averageExamScore.toFixed(1) ?? '0.0'}
          </p>
        </Card>

        <Card className="p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-text/50 font-body mb-2">Buổi học</p>
          <p className="text-2xl sm:text-3xl font-bold text-text font-heading">
            {statistics?.totalLessons ?? 0}
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
        {/* Student Count Chart */}
        {statistics?.studentCountByMonth && statistics.studentCountByMonth.length > 0 && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-text font-heading mb-4">
              Số lượng học sinh theo tháng
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statistics.studentCountByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Số học sinh" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Attendance Rate Chart */}
        {statistics?.attendanceRateByMonth && statistics.attendanceRateByMonth.length > 0 && (
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-text font-heading mb-4">
              Tỷ lệ điểm danh theo tháng
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={statistics.attendanceRateByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#10b981"
                  name="Tỷ lệ (%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Average Score Chart */}
      {statistics?.averageScoreByMonth && statistics.averageScoreByMonth.length > 0 && (
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-text font-heading mb-4">
            Điểm trung bình theo tháng
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={statistics.averageScoreByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="averageScore"
                stroke="#8b5cf6"
                name="Điểm trung bình"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Recent Lessons for Teacher */}
      {isTeacher && recentLessons && recentLessons.length > 0 && (
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-text font-heading">
              Buổi học gần đây
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/lessons')}
            >
              Xem tất cả
            </Button>
          </div>
          <div className="space-y-3">
            {recentLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-primary hover:shadow-sm transition-all cursor-pointer bg-white"
                onClick={() => navigate(`/lessons/${lesson.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-text font-heading text-base">
                        {lesson.className} - Buổi {lesson.lessonNumber}
                      </h4>
                    </div>
                    <p className="text-sm text-text/60 font-body mb-2">
                      {format(new Date(lesson.date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/comments?classId=${lesson.classId}&lessonId=${lesson.id}`);
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Nhận xét</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/attendance/quick?classId=${lesson.classId}&lessonId=${lesson.id}`);
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <UserCheckIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Điểm danh</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Teacher Classes Section */}
      {isTeacher && teacherClasses && teacherClasses.length > 0 && (
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-text font-heading mb-4">
            Danh sách lớp học của tôi
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherClasses
              .filter((c) => !c.isCompleted)
              .map((classItem) => (
                <div
                  key={classItem.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                    classItem.isCompleted
                      ? 'bg-gray-50 border-gray-200 opacity-60'
                      : 'bg-white border-gray-200 hover:border-primary hover:shadow-md'
                  }`}
                  onClick={() => navigate(`/classes/${classItem.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-text font-heading text-base mb-1 truncate">
                        {classItem.name}
                      </h4>
                      <p className="text-sm text-text/60 font-body">{classItem.branchName}</p>
                      {classItem.level && (
                        <p className="text-xs text-text/50 font-body mt-1">Level: {classItem.level}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <input
                        type="checkbox"
                        checked={classItem.isCompleted || false}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateCompletionMutation.mutate({
                            classId: classItem.id,
                            isCompleted: e.target.checked,
                          });
                        }}
                        className="w-5 h-5 text-primary rounded cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/lessons/new?classId=${classItem.id}`);
                      }}
                      className="flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                    >
                      <BookOpenIcon />
                      <span>Tạo buổi học</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/exams/new?classId=${classItem.id}`);
                      }}
                      className="flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                    >
                      <ClipboardDocumentCheckIcon className="w-4 h-4" />
                      <span>Tạo bài kiểm tra</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/comments?classId=${classItem.id}`);
                      }}
                      className="flex items-center justify-center gap-1.5 text-xs sm:text-sm col-span-2"
                    >
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      <span>Nhận xét buổi học</span>
                    </Button>
                  </div>
                </div>
              ))}
          </div>
          {teacherClasses.filter((c) => c.isCompleted).length > 0 && (
            <div className="mt-6">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-text/60 hover:text-text transition-colors">
                  Lớp đã hoàn thành ({teacherClasses.filter((c) => c.isCompleted).length})
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {teacherClasses
                    .filter((c) => c.isCompleted)
                    .map((classItem) => (
                      <div
                        key={classItem.id}
                        className="p-4 rounded-lg border-2 bg-gray-50 border-gray-200 opacity-60 transition-all duration-200 cursor-pointer hover:opacity-80"
                        onClick={() => navigate(`/classes/${classItem.id}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-text font-heading text-base mb-1 truncate">
                              {classItem.name}
                            </h4>
                            <p className="text-sm text-text/60 font-body">{classItem.branchName}</p>
                            {classItem.level && (
                              <p className="text-xs text-text/50 font-body mt-1">Level: {classItem.level}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateCompletionMutation.mutate({
                                  classId: classItem.id,
                                  isCompleted: e.target.checked,
                                });
                              }}
                              className="w-5 h-5 text-primary rounded cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </details>
            </div>
          )}
        </Card>
      )}

      {/* Recent Activities */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-text font-heading mb-4">
          Hoạt động gần đây
        </h3>
        {recentActivities && recentActivities.length > 0 ? (
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-background rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  if (activity.entityId) {
                    switch (activity.type) {
                      case 'Lesson':
                        navigate(`/lessons/${activity.entityId}`);
                        break;
                      case 'Exam':
                        navigate(`/exams/${activity.entityId}`);
                        break;
                      case 'Class':
                        navigate(`/classes/${activity.entityId}`);
                        break;
                      case 'Student':
                        navigate(`/students/${activity.entityId}`);
                        break;
                    }
                  }
                }}
              >
                <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium text-text font-body">
                    {activity.description}
                  </p>
                  <p className="text-xs sm:text-sm text-text/50 font-body mt-1">
                    {format(new Date(activity.createdAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-text/50 font-body">Chưa có hoạt động nào</p>
          </div>
        )}
      </Card>
    </div>
  );
};

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { LessonsPage } from './pages/lessons/LessonsPage';
import { LessonDetailPage } from './pages/lessons/LessonDetailPage';
import { CommentsPage } from './pages/comments/CommentsPage';
import { ExamsPage } from './pages/exams/ExamsPage';
import { ExamDetailPage } from './pages/exams/ExamDetailPage';
import { ClassesPage } from './pages/classes/ClassesPage';
import { ClassDetailPage } from './pages/classes/ClassDetailPage';
import { StudentsPage } from './pages/students/StudentsPage';
import { StudentDetailPage } from './pages/students/StudentDetailPage';
import { TeachersPage } from './pages/teachers/TeachersPage';
import { TeacherDetailPage } from './pages/teachers/TeacherDetailPage';
import { BranchesPage } from './pages/branches/BranchesPage';
import { BranchDetailPage } from './pages/branches/BranchDetailPage';
import { QuickAttendancePage } from './pages/attendance/QuickAttendancePage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { SchedulesPage } from './pages/schedules/SchedulesPage';
import { SharedLinksPage } from './pages/shared-links/SharedLinksPage';
import { SharedLinkViewPage } from './pages/shared-links/SharedLinkViewPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { ChangePasswordPage } from './pages/profile/ChangePasswordPage';
import { UsersPage } from './pages/users/UsersPage';
import { AssignParentPage } from './pages/parents/AssignParentPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 0, // Data được coi là stale ngay lập tức để refetch khi invalidate
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/shared/:token" element={<SharedLinkViewPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-background pb-16 lg:pb-0 safe-area-bottom">
                  <Header />
                  <div className="flex">
                    <Sidebar />
                    <main className="flex-1 lg:ml-64 pt-4 sm:pt-8">
                      <Routes>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/lessons" element={<LessonsPage />} />
                        <Route path="/lessons/:id" element={<LessonDetailPage />} />
                        <Route path="/comments" element={<CommentsPage />} />
                        <Route path="/exams" element={<ExamsPage />} />
                        <Route path="/exams/:id" element={<ExamDetailPage />} />
                        <Route path="/classes" element={<ClassesPage />} />
                        <Route path="/classes/:id" element={<ClassDetailPage />} />
                        <Route path="/students" element={<StudentsPage />} />
                        <Route path="/students/:id" element={<StudentDetailPage />} />
                        <Route path="/teachers" element={<TeachersPage />} />
                        <Route path="/teachers/:id" element={<TeacherDetailPage />} />
                        <Route path="/branches" element={<BranchesPage />} />
                        <Route path="/branches/:id" element={<BranchDetailPage />} />
                        <Route path="/attendance" element={<AttendancePage />} />
                        <Route path="/attendance/quick" element={<QuickAttendancePage />} />
                        <Route path="/schedules" element={<SchedulesPage />} />
                        <Route path="/shared-links" element={<SharedLinksPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/profile/change-password" element={<ChangePasswordPage />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/parents/assign" element={<AssignParentPage />} />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </main>
                  </div>
                  <BottomNav />
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

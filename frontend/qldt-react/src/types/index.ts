export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  role: 'Owner' | 'BranchManager' | 'Teacher' | 'Parent';
  branchId?: number;
  teacherId?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface Branch {
  id: number;
  ownerId: number;
  name: string;
  address?: string;
  phone?: string;
  createdAt: string;
}

export interface ClassTeacher {
  teacherId: number;
  teacherName: string;
  teacherEmail: string;
}

export interface Class {
  id: number;
  branchId: number;
  branchName: string;
  name: string;
  level?: string;
  isCompleted?: boolean;
  createdAt: string;
  teachers?: ClassTeacher[];
}

export interface Student {
  id: number;
  classId: number;
  className: string;
  name: string;
  dateOfBirth?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  createdAt: string;
  parentUser?: {
    id: number;
    username: string;
    email: string;
    fullName?: string;
    phone?: string;
  };
}

export interface Teacher {
  id: number;
  branchId: number;
  branchName: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface VocabularyItem {
  word: string;
  partOfSpeech?: string;
  translation: string;
}

export interface HomeworkItem {
  page: string;
  description: string;
}

export interface GrammarItem {
  topic: string;
  description: string;
}

export interface Lesson {
  id: number;
  classId: number;
  className: string;
  teacherId: number;
  teacherName: string;
  date: string;
  lessonNumber: number;
  vocabulary?: VocabularyItem[];
  homework?: HomeworkItem[];
  grammar?: GrammarItem[];
  generalComment?: string;
  createdAt: string;
}

export interface DailyComment {
  id: number;
  lessonId: number;
  lessonDate?: string;
  className?: string;
  studentId: number;
  studentName: string;
  vocabularyScore?: number;
  schoolExamScore?: number;
  homeworkStatus?: string;
  comment?: string;
  createdAt: string;
}

export interface Exam {
  id: number;
  classId: number;
  className: string;
  teacherId: number;
  teacherName: string;
  date: string;
  examType: string;
  createdAt: string;
}

export interface ExamResult {
  id: number;
  examId: number;
  examType?: string;
  examDate?: string;
  className?: string;
  studentId: number;
  studentName: string;
  speakingScore?: number;
  listeningScore?: number;
  readingWritingScore?: number;
  comment?: string;
  createdAt: string;
}

export interface Attendance {
  id: number;
  lessonId: number;
  lessonDate?: string;
  className?: string;
  studentId: number;
  studentName: string;
  status: 'Present' | 'Absent' | 'Late';
  note?: string;
  createdAt: string;
}

export interface Schedule {
  id: number;
  classId: number;
  className: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface SharedLink {
  id: number;
  entityType: 'Lesson' | 'Exam';
  entityId: number;
  token: string;
  shareUrl: string;
  expiresAt?: string;
  createdAt: string;
}

export interface DashboardStatistics {
  totalBranches: number;
  totalClasses: number;
  totalStudents: number;
  totalTeachers: number;
  totalLessons: number;
  totalExams: number;
  averageAttendanceRate: number;
  averageExamScore: number;
  studentCountByMonth: Array<{ month: string; count: number }>;
  attendanceRateByMonth: Array<{ month: string; rate: number }>;
  averageScoreByMonth: Array<{ month: string; averageScore: number }>;
}

export interface RecentActivity {
  type: 'Lesson' | 'Exam' | 'Comment' | 'Attendance' | 'Class' | 'Student' | 'Teacher';
  description: string;
  createdAt: string;
  entityId?: number;
  entityName?: string;
}

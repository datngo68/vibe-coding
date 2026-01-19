import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { Class, Lesson, Student, Attendance } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { format } from 'date-fns';

// SVG Icons từ Heroicons
const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BookOpenIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

type AttendanceStatus = 'Present' | 'Absent' | 'Late';

type StudentAttendance = {
  studentId: number;
  studentName: string;
  status: AttendanceStatus | null;
  note: string;
  existingAttendanceId?: number;
};

export const QuickAttendancePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const classIdParam = searchParams.get('classId');
  const lessonIdParam = searchParams.get('lessonId');
  const initialClassId = classIdParam ? (Number(classIdParam) || null) : null;
  const initialLessonId = lessonIdParam ? (Number(lessonIdParam) || null) : null;

  const [selectedClassId, setSelectedClassId] = useState<number | null>(initialClassId);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(initialLessonId);
  const [studentAttendances, setStudentAttendances] = useState<Map<number, StudentAttendance>>(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with URL params when they change externally
  useEffect(() => {
    const currentClassIdParam = searchParams.get('classId');
    const currentLessonIdParam = searchParams.get('lessonId');
    const newClassId = currentClassIdParam ? (Number(currentClassIdParam) || null) : null;
    const newLessonId = currentLessonIdParam ? (Number(currentLessonIdParam) || null) : null;

    if (newClassId !== selectedClassId) {
      setSelectedClassId(newClassId);
      if (!newClassId) {
        setSelectedLessonId(null);
      } else if (newLessonId !== null) {
        setSelectedLessonId(newLessonId);
      }
    } else if (newLessonId !== selectedLessonId) {
      setSelectedLessonId(newLessonId);
    }
  }, [searchParams]);

  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes');
      return response.data;
    },
  });

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: ['lessons', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const response = await api.get(`/lessons/class/${selectedClassId}`);
      return response.data;
    },
    enabled: !!selectedClassId,
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ['students', 'class', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const response = await api.get(`/students/class/${selectedClassId}`);
      return response.data;
    },
    enabled: !!selectedClassId,
  });

  const { data: existingAttendances } = useQuery<Attendance[]>({
    queryKey: ['attendances', selectedLessonId],
    queryFn: async () => {
      if (!selectedLessonId) return [];
      const response = await api.get(`/attendance/lesson/${selectedLessonId}`);
      return response.data;
    },
    enabled: !!selectedLessonId,
  });

  // Initialize student attendances when students or existing attendances change
  useMemo(() => {
    if (!students) return;
    
    const newMap = new Map<number, StudentAttendance>();
    students.forEach((student) => {
      const existing = existingAttendances?.find((a) => a.studentId === student.id);
      newMap.set(student.id, {
        studentId: student.id,
        studentName: student.name,
        status: existing ? existing.status : null,
        note: existing?.note || '',
        existingAttendanceId: existing?.id,
      });
    });
    setStudentAttendances(newMap);
  }, [students, existingAttendances]);

  const updateStudentStatus = (studentId: number, status: AttendanceStatus | null) => {
    setStudentAttendances((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(studentId);
      if (current) {
        newMap.set(studentId, {
          ...current,
          status: status,
        });
      }
      return newMap;
    });
  };

  const updateStudentNote = (studentId: number, note: string) => {
    setStudentAttendances((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(studentId);
      if (current) {
        newMap.set(studentId, {
          ...current,
          note: note,
        });
      }
      return newMap;
    });
  };

  const bulkSaveMutation = useMutation({
    mutationFn: async (attendances: StudentAttendance[]) => {
      if (!selectedLessonId) throw new Error('Chưa chọn buổi học');
      
      const promises = attendances
        .filter((a) => a.status !== null)
        .map(async (attendance) => {
          const payload = {
            lessonId: selectedLessonId,
            studentId: attendance.studentId,
            status: attendance.status,
            note: attendance.note || undefined,
          };

          if (attendance.existingAttendanceId) {
            // Update existing
            return api.put(`/attendance/${attendance.existingAttendanceId}`, payload);
          } else {
            // Create new
            return api.post('/attendance', payload);
          }
        });

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances', selectedLessonId] });
      queryClient.invalidateQueries({ queryKey: ['lessons', selectedClassId] });
    },
  });

  const handleSave = async () => {
    if (!selectedLessonId) {
      alert('Vui lòng chọn buổi học');
      return;
    }

    const attendancesToSave = Array.from(studentAttendances.values()).filter((a) => a.status !== null);
    
    if (attendancesToSave.length === 0) {
      alert('Vui lòng chọn trạng thái điểm danh cho ít nhất một học sinh');
      return;
    }

    setIsSaving(true);
    try {
      await bulkSaveMutation.mutateAsync(attendancesToSave);
      alert('Lưu điểm danh thành công!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Lưu điểm danh thất bại. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedClass = useMemo(() => classes?.find((c) => c.id === selectedClassId), [classes, selectedClassId]);
  const selectedLesson = useMemo(() => lessons?.find((l) => l.id === selectedLessonId), [lessons, selectedLessonId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading mb-1">
          Điểm danh nhanh
        </h1>
        <p className="text-sm text-text/60 font-body">
          Điểm danh học sinh cho buổi học
        </p>
      </div>

      {/* Class and Lesson Selection */}
      <Card className="mb-6 p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-text">
              Chọn lớp học
            </label>
            <select
              className="input w-full min-h-[44px] touch-manipulation"
              value={selectedClassId || ''}
              onChange={(e) => {
                const newClassId = Number(e.target.value) || null;
                setSelectedClassId(newClassId);
                setSelectedLessonId(null);
                // Update URL params
                if (newClassId) {
                  setSearchParams({ classId: newClassId.toString() });
                } else {
                  setSearchParams({});
                }
              }}
            >
              <option value="">-- Chọn lớp --</option>
              {classes?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.branchName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-text">
              Chọn buổi học
            </label>
            <select
              className="input w-full min-h-[44px] touch-manipulation"
              value={selectedLessonId || ''}
              onChange={(e) => {
                const newLessonId = Number(e.target.value) || null;
                setSelectedLessonId(newLessonId);
                // Update URL params
                if (selectedClassId && newLessonId) {
                  setSearchParams({ classId: selectedClassId.toString(), lessonId: newLessonId.toString() });
                } else if (selectedClassId) {
                  setSearchParams({ classId: selectedClassId.toString() });
                }
              }}
              disabled={!selectedClassId}
            >
              <option value="">-- Chọn buổi học --</option>
              {lessons?.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {format(new Date(lesson.date), 'dd/MM/yyyy')} - Buổi {lesson.lessonNumber}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Class and Lesson Info */}
        {selectedClass && selectedLesson && (
          <div className="mt-4 pt-4 border-t border-text/10">
            <div className="flex flex-wrap items-center gap-4 text-sm text-text/70">
              <div className="flex items-center gap-2">
                <BookOpenIcon />
                <span className="font-medium">{selectedClass.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon />
                <span>{format(new Date(selectedLesson.date), 'dd/MM/yyyy')}</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Students Attendance List */}
      {selectedLessonId && students && students.length > 0 ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text font-heading">
              Danh sách học sinh ({students.length})
            </h2>
            <Button
              onClick={handleSave}
              disabled={isSaving || bulkSaveMutation.isPending}
              className="flex items-center gap-2"
            >
              {isSaving || bulkSaveMutation.isPending ? 'Đang lưu...' : 'Lưu điểm danh'}
            </Button>
          </div>

          <div className="space-y-3">
            {students.map((student) => {
              const attendance = studentAttendances.get(student.id);
              if (!attendance) return null;

              return (
                <Card key={student.id} className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Student Name */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text font-heading text-base sm:text-lg">
                        {student.name}
                      </h3>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant={attendance.status === 'Present' ? 'primary' : 'secondary'}
                        onClick={() => updateStudentStatus(student.id, 'Present')}
                        className={`flex items-center gap-2 min-h-[44px] touch-manipulation ${
                          attendance.status === 'Present' ? '' : 'hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                        }`}
                        disabled={isSaving}
                      >
                        <CheckCircleIcon />
                        <span className="hidden sm:inline">Có mặt</span>
                        <span className="sm:hidden">Có</span>
                      </Button>
                      <Button
                        variant={attendance.status === 'Absent' ? 'primary' : 'secondary'}
                        onClick={() => updateStudentStatus(student.id, 'Absent')}
                        className={`flex items-center gap-2 min-h-[44px] touch-manipulation ${
                          attendance.status === 'Absent' ? '' : 'hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                        }`}
                        disabled={isSaving}
                      >
                        <XCircleIcon />
                        <span className="hidden sm:inline">Vắng</span>
                        <span className="sm:hidden">Vắng</span>
                      </Button>
                      <Button
                        variant={attendance.status === 'Late' ? 'primary' : 'secondary'}
                        onClick={() => updateStudentStatus(student.id, 'Late')}
                        className={`flex items-center gap-2 min-h-[44px] touch-manipulation ${
                          attendance.status === 'Late' ? '' : 'hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200'
                        }`}
                        disabled={isSaving}
                      >
                        <ClockIcon />
                        <span className="hidden sm:inline">Muộn</span>
                        <span className="sm:hidden">Muộn</span>
                      </Button>
                    </div>
                  </div>

                  {/* Note Input */}
                  {attendance.status && (
                    <div className="mt-3 pt-3 border-t border-text/10">
                    <label className="block text-sm font-medium mb-1 text-text">
                      Ghi chú (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={attendance.note}
                      onChange={(e) => updateStudentNote(student.id, e.target.value)}
                      className="input w-full min-h-[44px] touch-manipulation"
                      placeholder="Nhập ghi chú..."
                      disabled={isSaving}
                    />
                  </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Save Button (Mobile) */}
          <div className="mt-6 md:hidden">
            <Button
              onClick={handleSave}
              disabled={isSaving || bulkSaveMutation.isPending}
              className="w-full flex items-center justify-center gap-2 min-h-[44px]"
            >
              {isSaving || bulkSaveMutation.isPending ? 'Đang lưu...' : 'Lưu điểm danh'}
            </Button>
          </div>
        </>
      ) : selectedLessonId && (!students || students.length === 0) ? (
        <Card className="p-12 text-center">
          <p className="text-text/60 font-body">Lớp học này chưa có học sinh nào.</p>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-text/60 font-body">Vui lòng chọn lớp học và buổi học để bắt đầu điểm danh.</p>
        </Card>
      )}
    </div>
  );
};

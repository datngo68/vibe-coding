import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import type { Student, User, Class } from '../../types';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { UserFormModal } from '../../components/users/UserFormModal';
import { Toast } from '../../components/common/Toast';
import { format } from 'date-fns';

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

const UnlinkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

export const AssignParentPage = () => {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [isCreateParentModalOpen, setIsCreateParentModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false,
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes');
      return response.data;
    },
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

  const { data: parents } = useQuery<User[]>({
    queryKey: ['users', 'parents'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.filter((u: User) => u.role === 'Parent');
    },
  });

  // Get students assigned to selected parent
  const { data: assignedStudents } = useQuery<Student[]>({
    queryKey: ['students', 'parent', selectedParentId],
    queryFn: async () => {
      if (!selectedParentId) return [];
      const response = await api.get(`/users/${selectedParentId}/students`);
      return response.data;
    },
    enabled: !!selectedParentId,
  });

  const assignMutation = useMutation({
    mutationFn: async ({ parentId, studentIds }: { parentId: number; studentIds: number[] }) => {
      await api.post(`/users/${parentId}/students`, studentIds);
      return { parentId, studentIds, studentNames: students?.filter(s => studentIds.includes(s.id)).map(s => s.name) || [] };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', 'parent', selectedParentId] });
      queryClient.invalidateQueries({ queryKey: ['students', 'class', selectedClassId] });
      const parentName = filteredParents?.find(p => p.id === selectedParentId)?.username || 'phụ huynh';
      const studentNames = data.studentNames.join(', ');
      setToast({
        message: `Đã gán ${data.studentIds.length} học sinh (${studentNames}) cho ${parentName} thành công!`,
        type: 'success',
        isVisible: true,
      });
      setSelectedStudentIds(new Set());
    },
    onError: (error: any) => {
      setToast({
        message: error.response?.data?.message || 'Có lỗi xảy ra khi gán học sinh',
        type: 'error',
        isVisible: true,
      });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async ({ parentId, studentId }: { parentId: number; studentId: number }) => {
      // Get current students assigned to this parent
      const response = await api.get(`/users/${parentId}/students`);
      const currentStudents = response.data || [];
      const studentToRemove = currentStudents.find((s: Student) => s.id === studentId);
      const updatedStudentIds = currentStudents
        .filter((s: Student) => s.id !== studentId)
        .map((s: Student) => s.id);
      await api.post(`/users/${parentId}/students`, updatedStudentIds);
      return { studentName: studentToRemove?.name || 'Học sinh', parentId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students', 'parent'] });
      queryClient.invalidateQueries({ queryKey: ['students', 'class', selectedClassId] });
      setToast({
        message: `Đã hủy gán ${data.studentName} thành công!`,
        type: 'success',
        isVisible: true,
      });
    },
    onError: (error: any) => {
      setToast({
        message: error.response?.data?.message || 'Có lỗi xảy ra khi hủy gán',
        type: 'error',
        isVisible: true,
      });
    },
  });

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    let data = [...students];
    
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter(s => s.name.toLowerCase().includes(term));
    }
    
    return data;
  }, [students, searchTerm]);

  const filteredParents = useMemo(() => {
    if (!parents) return [];
    return parents;
  }, [parents]);

  const handleAssign = () => {
    if (!selectedParentId || selectedStudentIds.size === 0) {
      alert('Vui lòng chọn phụ huynh và ít nhất một học sinh');
      return;
    }
    assignMutation.mutate({
      parentId: selectedParentId,
      studentIds: Array.from(selectedStudentIds),
    });
  };

  const handleUnassign = (studentId: number, parentId?: number) => {
    const parentIdToUse = parentId || selectedParentId;
    if (!parentIdToUse) return;
    unassignMutation.mutate({ parentId: parentIdToUse, studentId });
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text font-heading mb-2">
          Gán phụ huynh cho học sinh
        </h1>
        <p className="text-sm sm:text-base text-text/60 font-body">
          Quản lý và gán phụ huynh cho học sinh một cách tiện lợi
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Class & Students Selection */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Class Selection */}
          <Card className="p-4 sm:p-6">
            <label className="block text-sm font-medium text-text mb-3">
              Chọn lớp học
            </label>
            <select
              value={selectedClassId || ''}
              onChange={(e) => {
                setSelectedClassId(e.target.value ? Number(e.target.value) : null);
                setSelectedStudentIds(new Set());
              }}
              className="input w-full min-h-[44px] touch-manipulation text-base"
            >
              <option value="">-- Chọn lớp --</option>
              {classes?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </Card>

          {/* Students List */}
          {selectedClassId && (
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-text font-heading">
                  Danh sách học sinh
                </h2>
                <div className="w-full sm:w-auto">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm học sinh..."
                    className="input w-full sm:w-64 min-h-[44px] touch-manipulation text-base"
                  />
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 text-text/60">
                  {selectedClassId ? 'Không có học sinh trong lớp này' : 'Vui lòng chọn lớp học'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student) => {
                    const isAssigned = student.parentUser != null;
                    const isSelected = selectedStudentIds.has(student.id);
                    const assignedParent = student.parentUser 
                      ? parents?.find(p => p.id === student.parentUser!.id)
                      : null;
                    const isAssignedToSelectedParent = selectedParentId && assignedParent?.id === selectedParentId;
                    
                    return (
                      <div
                        key={student.id}
                        className={`p-3 sm:p-4 rounded-lg border transition-colors touch-manipulation ${
                          isSelected
                            ? 'bg-primary/10 border-primary border-2'
                            : isAssigned
                            ? isAssignedToSelectedParent
                              ? 'bg-green-50 border-green-300'
                              : 'bg-blue-50 border-blue-300'
                            : 'bg-background border-text/10 hover:border-text/20 cursor-pointer'
                        }`}
                        onClick={() => !isAssigned && toggleStudentSelection(student.id)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {!isAssigned ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleStudentSelection(student.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-5 h-5 cursor-pointer flex-shrink-0"
                              />
                            ) : (
                              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                <div className={`w-3 h-3 rounded-full ${
                                  isAssignedToSelectedParent ? 'bg-green-500' : 'bg-blue-500'
                                }`}></div>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-text truncate">{student.name}</p>
                                {isAssigned && (
                                  <>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${
                                      isAssignedToSelectedParent
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {isAssignedToSelectedParent ? 'Đã gán' : 'Đã gán cho khác'}
                                    </span>
                                    {assignedParent && (
                                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full flex-shrink-0">
                                        {assignedParent.fullName || assignedParent.username}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              {student.dateOfBirth && (
                                <p className="text-xs sm:text-sm text-text/60 mt-0.5">
                                  Sinh ngày: {format(new Date(student.dateOfBirth), 'dd/MM/yyyy')}
                                </p>
                              )}
                              {isAssigned && assignedParent && !isAssignedToSelectedParent && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Đã gán cho: {assignedParent.fullName || assignedParent.username}
                                  {assignedParent.email && ` (${assignedParent.email})`}
                                </p>
                              )}
                            </div>
                          </div>
                          {isAssigned && assignedParent && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                // If assigned to selected parent, use that parentId, otherwise use the assigned parent's id
                                const parentIdToUse = isAssignedToSelectedParent 
                                  ? selectedParentId! 
                                  : assignedParent.id;
                                handleUnassign(student.id, parentIdToUse);
                              }}
                              className={`flex items-center gap-1.5 flex-shrink-0 ${
                                isAssignedToSelectedParent
                                  ? 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
                                  : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200'
                              }`}
                            >
                              <UnlinkIcon />
                              <span className="hidden sm:inline">
                                {isAssignedToSelectedParent ? 'Hủy gán' : 'Gỡ khỏi phụ huynh'}
                              </span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Column: Parent Selection & Actions */}
        <div className="space-y-4 sm:space-y-6">
          {/* Parent Selection */}
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-text font-heading">
                Chọn phụ huynh
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCreateParentModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <PlusIcon />
                <span className="hidden sm:inline">Tạo mới</span>
              </Button>
            </div>

            <select
              value={selectedParentId || ''}
              onChange={(e) => {
                setSelectedParentId(e.target.value ? Number(e.target.value) : null);
                setSelectedStudentIds(new Set());
              }}
              className="input w-full min-h-[44px] touch-manipulation text-base mb-4"
            >
              <option value="">-- Chọn phụ huynh --</option>
              {filteredParents?.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.username} {parent.email ? `(${parent.email})` : ''}
                </option>
              ))}
            </select>

            {selectedParentId && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-text">
                    Phụ huynh: {filteredParents?.find(p => p.id === selectedParentId)?.username}
                  </p>
                  {assignedStudents && assignedStudents.length > 0 && (
                    <span className="px-2 py-1 bg-primary text-white text-xs font-medium rounded-full">
                      {assignedStudents.length} học sinh
                    </span>
                  )}
                </div>
                {selectedStudentIds.size > 0 && (
                  <div className="mt-2 pt-2 border-t border-primary/20">
                    <p className="text-xs font-medium text-text mb-1">
                      Đang chọn để gán: {selectedStudentIds.size} học sinh
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.from(selectedStudentIds).map((studentId) => {
                        const student = students?.find(s => s.id === studentId);
                        return student ? (
                          <span
                            key={studentId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded"
                          >
                            {student.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Assigned Students */}
          {selectedParentId && (
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base sm:text-lg font-semibold text-text font-heading">
                  Học sinh đã gán
                </h3>
                {assignedStudents && assignedStudents.length > 0 && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                    {assignedStudents.length}
                  </span>
                )}
              </div>
              {assignedStudents && assignedStudents.length > 0 ? (
                <div className="space-y-2">
                  {assignedStudents.map((student) => (
                    <div
                      key={student.id}
                      className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between hover:bg-green-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                          <p className="text-sm font-medium text-text truncate">{student.name}</p>
                        </div>
                        <p className="text-xs text-text/60 mt-0.5 ml-4">{student.className}</p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUnassign(student.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex-shrink-0"
                      >
                        <UnlinkIcon />
                        <span className="hidden sm:inline">Hủy</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-text/50 text-sm">
                  <p>Chưa có học sinh nào được gán</p>
                  <p className="text-xs mt-1">Chọn học sinh và bấm "Gán" để bắt đầu</p>
                </div>
              )}
            </Card>
          )}

          {/* Assign Button */}
          {selectedParentId && selectedStudentIds.size > 0 && (
            <Card className="p-4 sm:p-6">
              <Button
                onClick={handleAssign}
                disabled={assignMutation.isPending}
                className="w-full min-h-[44px] touch-manipulation flex items-center justify-center gap-2"
              >
                <LinkIcon />
                <span>
                  {assignMutation.isPending
                    ? 'Đang gán...'
                    : `Gán ${selectedStudentIds.size} học sinh`}
                </span>
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Create Parent Modal */}
      <UserFormModal
        isOpen={isCreateParentModalOpen}
        onClose={() => {
          setIsCreateParentModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['users', 'parents'] });
        }}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
        duration={4000}
      />
    </div>
  );
};

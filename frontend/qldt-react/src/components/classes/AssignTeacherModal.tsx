import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { Teacher } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface AssignTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  branchId: number;
  assignedTeacherIds: number[]; // Danh sách ID giáo viên đã được gán
}

export const AssignTeacherModal = ({ isOpen, onClose, classId, branchId, assignedTeacherIds }: AssignTeacherModalProps) => {
  const queryClient = useQueryClient();
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);

  // Fetch teachers from the same branch
  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['teachers', 'branch', branchId],
    queryFn: async () => {
      const response = await api.get(`/teachers/branch/${branchId}`);
      return response.data;
    },
    enabled: isOpen && !!branchId,
  });

  // Initialize selected teachers
  useEffect(() => {
    if (isOpen) {
      setSelectedTeacherIds(assignedTeacherIds);
    }
  }, [isOpen, assignedTeacherIds]);

  const assignMutation = useMutation({
    mutationFn: async (teacherId: number) => {
      await api.post(`/classes/${classId}/teachers/${teacherId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class', classId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (teacherId: number) => {
      await api.delete(`/classes/${classId}/teachers/${teacherId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class', classId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });

  const handleToggleTeacher = (teacherId: number) => {
    const isAssigned = selectedTeacherIds.includes(teacherId);
    
    if (isAssigned) {
      // Unassign
      setSelectedTeacherIds(prev => prev.filter(id => id !== teacherId));
      unassignMutation.mutate(teacherId);
    } else {
      // Assign
      setSelectedTeacherIds(prev => [...prev, teacherId]);
      assignMutation.mutate(teacherId);
    }
  };

  const isLoading = assignMutation.isPending || unassignMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gán giáo viên cho lớp học"
      size="md"
    >
      <div className="space-y-4">
        {!teachers || teachers.length === 0 ? (
          <div className="text-center py-8 text-text/60">
            <p>Chưa có giáo viên nào trong chi nhánh này.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {teachers.map((teacher) => {
              const isAssigned = selectedTeacherIds.includes(teacher.id);
              return (
                <div
                  key={teacher.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                    isAssigned
                      ? 'bg-primary/10 border-primary'
                      : 'bg-background border-text/10 hover:border-primary/50'
                  }`}
                  onClick={() => !isLoading && handleToggleTeacher(teacher.id)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-text">{teacher.name}</p>
                    <p className="text-sm text-text/60">{teacher.email}</p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      onChange={() => !isLoading && handleToggleTeacher(teacher.id)}
                      className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

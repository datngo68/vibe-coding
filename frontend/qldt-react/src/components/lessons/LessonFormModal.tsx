import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import type { Lesson, Class, Teacher, VocabularyItem, HomeworkItem, GrammarItem } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface LessonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson?: Lesson | null;
  classId?: number; // Optional: pre-select class
}

export const LessonFormModal = ({ isOpen, onClose, lesson, classId }: LessonFormModalProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    classId: classId || 0,
    teacherId: 0,
    date: new Date(),
    lessonNumber: 1,
    generalComment: '',
  });
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [grammar, setGrammar] = useState<GrammarItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/classes');
      return response.data;
    },
    enabled: isOpen,
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await api.get('/teachers');
      return response.data;
    },
    enabled: isOpen,
  });

  // Filter teachers by selected class's branch
  const filteredTeachers = teachers?.filter(teacher => {
    const selectedClass = classes?.find(c => c.id === formData.classId);
    return selectedClass && teacher.branchId === selectedClass.branchId;
  });

  // Reset form when modal opens/closes or lesson changes
  useEffect(() => {
    if (isOpen) {
      if (lesson) {
        setFormData({
          classId: lesson.classId,
          teacherId: lesson.teacherId,
          date: new Date(lesson.date),
          lessonNumber: lesson.lessonNumber,
          generalComment: lesson.generalComment || '',
        });
        setVocabulary(lesson.vocabulary || []);
        setHomework(lesson.homework || []);
        setGrammar(lesson.grammar || []);
      } else {
        // Auto-assign teacher if user is Teacher
        const autoTeacherId = user?.role === 'Teacher' && user?.teacherId ? user.teacherId : 0;
        setFormData({
          classId: classId || (classes && classes.length > 0 ? classes[0].id : 0),
          teacherId: autoTeacherId,
          date: new Date(),
          lessonNumber: 1,
          generalComment: '',
        });
        setVocabulary([]);
        setHomework([]);
        setGrammar([]);
      }
      setErrors({});
    }
  }, [isOpen, lesson, classId, classes, user]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/lessons', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      if (data?.classId) {
        const classIdStr = data.classId.toString();
        queryClient.invalidateQueries({ queryKey: ['lessons', 'class', classIdStr] });
        queryClient.invalidateQueries({ queryKey: ['lessons', 'class', data.classId] });
        // Invalidate class detail page to refresh lessons list
        queryClient.invalidateQueries({ queryKey: ['class'] });
      }
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/lessons/${lesson?.id}`, data);
      return response.data;
    },
    onSuccess: async (data) => {
      if (lesson?.id) {
        queryClient.setQueryData(['lesson', lesson.id.toString()], data);
      }
      await queryClient.invalidateQueries({ queryKey: ['lessons'] });
      if (data?.classId) {
        await queryClient.invalidateQueries({ queryKey: ['lessons', 'class', data.classId.toString()] });
      }
      if (lesson?.id) {
        await queryClient.refetchQueries({ queryKey: ['lesson', lesson.id.toString()] });
      }
      onClose();
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.classId || formData.classId === 0) {
      newErrors.classId = 'Vui lòng chọn lớp học';
    }

    // Skip teacher validation if user is Teacher (auto-assigned)
    if (!formData.teacherId || formData.teacherId === 0) {
      if (user?.role !== 'Teacher' || lesson) {
        newErrors.teacherId = 'Vui lòng chọn giáo viên';
      }
    }

    if (formData.lessonNumber < 1) {
      newErrors.lessonNumber = 'Số buổi học phải lớn hơn 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      classId: formData.classId,
      teacherId: formData.teacherId,
      date: format(formData.date, 'yyyy-MM-dd'),
      lessonNumber: formData.lessonNumber,
      vocabulary: vocabulary.length > 0 ? vocabulary : undefined,
      homework: homework.length > 0 ? homework : undefined,
      grammar: grammar.length > 0 ? grammar : undefined,
      generalComment: formData.generalComment.trim() || undefined,
    };

    if (lesson) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const addVocabulary = () => {
    setVocabulary([...vocabulary, { word: '', translation: '' }]);
  };

  const removeVocabulary = (index: number) => {
    setVocabulary(vocabulary.filter((_, i) => i !== index));
  };

  const updateVocabulary = (index: number, field: keyof VocabularyItem, value: string) => {
    const updated = [...vocabulary];
    updated[index] = { ...updated[index], [field]: value };
    setVocabulary(updated);
  };

  const addHomework = () => {
    setHomework([...homework, { page: '', description: '' }]);
  };

  const removeHomework = (index: number) => {
    setHomework(homework.filter((_, i) => i !== index));
  };

  const updateHomework = (index: number, field: keyof HomeworkItem, value: string) => {
    const updated = [...homework];
    updated[index] = { ...updated[index], [field]: value };
    setHomework(updated);
  };

  const addGrammar = () => {
    setGrammar([...grammar, { topic: '', description: '' }]);
  };

  const removeGrammar = (index: number) => {
    setGrammar(grammar.filter((_, i) => i !== index));
  };

  const updateGrammar = (index: number, field: keyof GrammarItem, value: string) => {
    const updated = [...grammar];
    updated[index] = { ...updated[index], [field]: value };
    setGrammar(updated);
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lesson ? 'Sửa buổi học' : 'Tạo buổi học mới'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Row 1: Class and Teacher - 2 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="w-full">
            <label className="block text-sm font-medium mb-1.5 text-text">
              Lớp học *
            </label>
            <select
              value={formData.classId}
              onChange={(e) => {
                const newClassId = parseInt(e.target.value);
                // Auto-assign teacher if user is Teacher when changing class
                const autoTeacherId = user?.role === 'Teacher' && user?.teacherId ? user.teacherId : 0;
                setFormData({ ...formData, classId: newClassId, teacherId: autoTeacherId });
              }}
              className={`input w-full min-h-[44px] touch-manipulation ${errors.classId ? 'border-red-500' : ''}`}
              required
              disabled={isLoading || !!classId}
            >
              <option value={0}>Chọn lớp học</option>
              {classes?.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {errors.classId && (
              <p className="mt-1 text-xs text-red-500">{errors.classId}</p>
            )}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-1.5 text-text">
              Giáo viên *
            </label>
            <select
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: parseInt(e.target.value) })}
              className={`input w-full min-h-[44px] touch-manipulation ${errors.teacherId ? 'border-red-500' : ''}`}
              required
              disabled={isLoading || !formData.classId || (user?.role === 'Teacher' && !lesson)}
            >
              <option value={0}>Chọn giáo viên</option>
              {filteredTeachers?.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
            {user?.role === 'Teacher' && !lesson && (
              <p className="mt-0.5 text-xs text-text/60">Tự động gán cho bạn</p>
            )}
            {errors.teacherId && (
              <p className="mt-1 text-xs text-red-500">{errors.teacherId}</p>
            )}
          </div>
        </div>

        {/* Row 2: Date and Lesson Number - 2 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="w-full">
            <label className="block text-sm font-medium mb-1.5 text-text">
              Ngày học *
            </label>
            <DatePicker
              selected={formData.date}
              onChange={(date: Date | null) => date && setFormData({ ...formData, date })}
              dateFormat="dd/MM/yyyy"
              className={`input w-full min-h-[44px] touch-manipulation`}
              disabled={isLoading}
              required
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium mb-1.5 text-text">
              Số buổi học *
            </label>
            <input
              type="number"
              value={formData.lessonNumber}
              onChange={(e) => setFormData({ ...formData, lessonNumber: parseInt(e.target.value) || 1 })}
              className={`input w-full min-h-[44px] touch-manipulation ${errors.lessonNumber ? 'border-red-500' : ''}`}
              required
              min={1}
              disabled={isLoading}
            />
            {errors.lessonNumber && (
              <p className="mt-1 text-xs text-red-500">{errors.lessonNumber}</p>
            )}
          </div>
        </div>

        {/* Vocabulary Section */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium text-text">
              Từ vựng
            </label>
            <Button
              type="button"
              variant="secondary"
              onClick={addVocabulary}
              className="text-xs py-1 px-2 h-7"
              disabled={isLoading}
            >
              + Thêm
            </Button>
          </div>
          <div className="space-y-1.5">
            {vocabulary.map((item, index) => (
              <div key={index} className="flex gap-1.5 items-start p-1.5 bg-background rounded border border-text/10">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    placeholder="Từ"
                    value={item.word}
                    onChange={(e) => updateVocabulary(index, 'word', e.target.value)}
                    className="input text-sm py-1.5 px-2 min-h-[36px]"
                    disabled={isLoading}
                  />
                  <input
                    type="text"
                    placeholder="Loại từ"
                    value={item.partOfSpeech || ''}
                    onChange={(e) => updateVocabulary(index, 'partOfSpeech', e.target.value)}
                    className="input text-sm py-1.5 px-2 min-h-[36px]"
                    disabled={isLoading}
                  />
                  <input
                    type="text"
                    placeholder="Nghĩa"
                    value={item.translation}
                    onChange={(e) => updateVocabulary(index, 'translation', e.target.value)}
                    className="input text-sm py-1.5 px-2 min-h-[36px]"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVocabulary(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1 text-xs transition-colors duration-150 min-h-[36px] flex items-center"
                  disabled={isLoading}
                >
                  Xóa
                </button>
              </div>
            ))}
            {vocabulary.length === 0 && (
              <p className="text-xs text-text/60 text-center py-1.5">Chưa có từ vựng nào</p>
            )}
          </div>
        </div>

        {/* Homework Section */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium text-text">
              Bài tập về nhà
            </label>
            <Button
              type="button"
              variant="secondary"
              onClick={addHomework}
              className="text-xs py-1 px-2 h-7"
              disabled={isLoading}
            >
              + Thêm
            </Button>
          </div>
          <div className="space-y-1.5">
            {homework.map((item, index) => (
              <div key={index} className="flex gap-1.5 items-start p-1.5 bg-background rounded border border-text/10">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="Trang"
                    value={item.page}
                    onChange={(e) => updateHomework(index, 'page', e.target.value)}
                    className="input text-sm py-1.5 px-2 min-h-[36px]"
                    disabled={isLoading}
                  />
                  <input
                    type="text"
                    placeholder="Mô tả"
                    value={item.description}
                    onChange={(e) => updateHomework(index, 'description', e.target.value)}
                    className="input text-sm py-1.5 px-2 min-h-[36px]"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeHomework(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1 text-xs transition-colors duration-150 min-h-[36px] flex items-center"
                  disabled={isLoading}
                >
                  Xóa
                </button>
              </div>
            ))}
            {homework.length === 0 && (
              <p className="text-xs text-text/60 text-center py-1.5">Chưa có bài tập nào</p>
            )}
          </div>
        </div>

        {/* Grammar Section */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium text-text">
              Ngữ pháp
            </label>
            <Button
              type="button"
              variant="secondary"
              onClick={addGrammar}
              className="text-xs py-1 px-2 h-7"
              disabled={isLoading}
            >
              + Thêm
            </Button>
          </div>
          <div className="space-y-1.5">
            {grammar.map((item, index) => (
              <div key={index} className="flex gap-1.5 items-start p-1.5 bg-background rounded border border-text/10">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="Chủ đề"
                    value={item.topic}
                    onChange={(e) => updateGrammar(index, 'topic', e.target.value)}
                    className="input text-sm py-1.5 px-2 min-h-[36px]"
                    disabled={isLoading}
                  />
                  <input
                    type="text"
                    placeholder="Mô tả"
                    value={item.description}
                    onChange={(e) => updateGrammar(index, 'description', e.target.value)}
                    className="input text-sm py-1.5 px-2 min-h-[36px]"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeGrammar(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1 text-xs transition-colors duration-150 min-h-[36px] flex items-center"
                  disabled={isLoading}
                >
                  Xóa
                </button>
              </div>
            ))}
            {grammar.length === 0 && (
              <p className="text-xs text-text/60 text-center py-1.5">Chưa có ngữ pháp nào</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5 text-text">
            Nhận xét chung
          </label>
          <textarea
            value={formData.generalComment}
            onChange={(e) => setFormData({ ...formData, generalComment: e.target.value })}
            className="input w-full min-h-[80px] resize-y text-sm py-2 px-3"
            disabled={isLoading}
            placeholder="Nhập nhận xét chung về buổi học..."
          />
        </div>

        {(createMutation.error || updateMutation.error) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            Có lỗi xảy ra. Vui lòng thử lại sau.
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-3 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Đang lưu...' : lesson ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

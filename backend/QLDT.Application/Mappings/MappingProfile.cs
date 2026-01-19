using AutoMapper;
using QLDT.Application.DTOs.Attendance;
using QLDT.Application.DTOs.Branch;
using QLDT.Application.DTOs.Class;
using QLDT.Application.DTOs.Comment;
using QLDT.Application.DTOs.Exam;
using QLDT.Application.DTOs.Lesson;
using QLDT.Application.DTOs.Schedule;
using QLDT.Application.DTOs.Student;
using QLDT.Application.DTOs.Teacher;
using QLDT.Application.DTOs.User;
using QLDT.Domain.Entities;
using QLDT.Domain.ValueObjects;
using System.Text.Json;

namespace QLDT.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Lesson mappings
        CreateMap<Lesson, LessonDto>()
            .ForMember(dest => dest.ClassName, opt => opt.MapFrom(src => src.Class.Name))
            .ForMember(dest => dest.TeacherName, opt => opt.MapFrom(src => src.Teacher.Name))
            .ForMember(dest => dest.Vocabulary, opt => opt.MapFrom(src => 
                string.IsNullOrEmpty(src.Vocabulary) ? null : 
                JsonSerializer.Deserialize<List<VocabularyItem>>(src.Vocabulary, (JsonSerializerOptions?)null)))
            .ForMember(dest => dest.Homework, opt => opt.MapFrom(src => 
                string.IsNullOrEmpty(src.Homework) ? null : 
                JsonSerializer.Deserialize<List<HomeworkItem>>(src.Homework, (JsonSerializerOptions?)null)))
            .ForMember(dest => dest.Grammar, opt => opt.MapFrom(src => 
                string.IsNullOrEmpty(src.Grammar) ? null : 
                JsonSerializer.Deserialize<List<GrammarItem>>(src.Grammar, (JsonSerializerOptions?)null)))
            .AfterMap((src, dest) =>
            {
                if (string.IsNullOrEmpty(src.Vocabulary))
                    dest.Vocabulary = null;
                else
                    dest.Vocabulary = JsonSerializer.Deserialize<List<VocabularyItem>>(src.Vocabulary);
                
                if (string.IsNullOrEmpty(src.Homework))
                    dest.Homework = null;
                else
                    dest.Homework = JsonSerializer.Deserialize<List<HomeworkItem>>(src.Homework);
                
                if (string.IsNullOrEmpty(src.Grammar))
                    dest.Grammar = null;
                else
                    dest.Grammar = JsonSerializer.Deserialize<List<GrammarItem>>(src.Grammar);
            });

        CreateMap<CreateLessonRequest, Lesson>()
            .AfterMap((src, dest) =>
            {
                dest.Vocabulary = src.Vocabulary == null ? null : JsonSerializer.Serialize(src.Vocabulary);
                dest.Homework = src.Homework == null ? null : JsonSerializer.Serialize(src.Homework);
                dest.Grammar = src.Grammar == null ? null : JsonSerializer.Serialize(src.Grammar);
            });

        // DailyComment mappings
        CreateMap<DailyComment, DailyCommentDto>()
            .ForMember(dest => dest.StudentName, opt => opt.MapFrom(src => src.Student.Name))
            .ForMember(dest => dest.LessonDate, opt => opt.MapFrom(src => src.Lesson != null ? src.Lesson.Date.ToString("yyyy-MM-dd") : null))
            .ForMember(dest => dest.ClassName, opt => opt.MapFrom(src => src.Lesson != null && src.Lesson.Class != null ? src.Lesson.Class.Name : null));

        CreateMap<CreateDailyCommentRequest, DailyComment>();

        // Exam mappings
        CreateMap<Exam, ExamDto>()
            .ForMember(dest => dest.ClassName, opt => opt.MapFrom(src => src.Class.Name))
            .ForMember(dest => dest.TeacherName, opt => opt.MapFrom(src => src.Teacher.Name));

        CreateMap<CreateExamRequest, Exam>();

        // ExamResult mappings
        CreateMap<ExamResult, ExamResultDto>()
            .ForMember(dest => dest.StudentName, opt => opt.MapFrom(src => src.Student.Name))
            .ForMember(dest => dest.ExamType, opt => opt.MapFrom(src => src.Exam != null ? src.Exam.ExamType : null))
            .ForMember(dest => dest.ExamDate, opt => opt.MapFrom(src => src.Exam != null ? src.Exam.Date.ToString("yyyy-MM-dd") : null))
            .ForMember(dest => dest.ClassName, opt => opt.MapFrom(src => src.Exam != null && src.Exam.Class != null ? src.Exam.Class.Name : null));

        CreateMap<CreateExamResultRequest, ExamResult>();

        // Attendance mappings
        CreateMap<Attendance, AttendanceDto>()
            .ForMember(dest => dest.StudentName, opt => opt.MapFrom(src => src.Student.Name))
            .ForMember(dest => dest.LessonDate, opt => opt.MapFrom(src => src.Lesson != null ? src.Lesson.Date.ToString("yyyy-MM-dd") : null))
            .ForMember(dest => dest.ClassName, opt => opt.MapFrom(src => src.Lesson != null && src.Lesson.Class != null ? src.Lesson.Class.Name : null));

        CreateMap<CreateAttendanceRequest, Attendance>();

        // Schedule mappings
        CreateMap<Schedule, ScheduleDto>()
            .ForMember(dest => dest.ClassName, opt => opt.MapFrom(src => src.Class.Name));

        CreateMap<CreateScheduleRequest, Schedule>();

        // Branch mappings
        CreateMap<Branch, BranchDto>();
        CreateMap<CreateBranchRequest, Branch>();

        // Class mappings
        CreateMap<Class, ClassDto>()
            .ForMember(dest => dest.BranchName, opt => opt.MapFrom(src => src.Branch.Name))
            .ForMember(dest => dest.Teachers, opt => opt.MapFrom(src => 
                src.ClassTeachers.Select(ct => new ClassTeacherDto
                {
                    TeacherId = ct.TeacherId,
                    TeacherName = ct.Teacher.Name,
                    TeacherEmail = ct.Teacher.Email
                }).ToList()));

        CreateMap<CreateClassRequest, Class>()
            .ForMember(dest => dest.ClassTeachers, opt => opt.Ignore());

        // Student mappings
        CreateMap<Student, StudentDto>()
            .ForMember(dest => dest.ClassName, opt => opt.MapFrom(src => src.Class.Name));

        CreateMap<CreateStudentRequest, Student>();

        // Teacher mappings
        CreateMap<Teacher, TeacherDto>()
            .ForMember(dest => dest.BranchName, opt => opt.MapFrom(src => src.Branch.Name));

        CreateMap<CreateTeacherRequest, Teacher>();

        // User mappings
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.Role.ToString()));

        CreateMap<CreateUserRequest, User>()
            .ForMember(dest => dest.Role, opt => opt.MapFrom(src => Enum.Parse<UserRole>(src.Role)))
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.Branch, opt => opt.Ignore())
            .ForMember(dest => dest.Teacher, opt => opt.Ignore())
            .ForMember(dest => dest.SharedLinks, opt => opt.Ignore());
    }
}

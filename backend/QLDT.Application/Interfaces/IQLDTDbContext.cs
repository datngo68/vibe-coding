using Microsoft.EntityFrameworkCore;
using QLDT.Domain.Entities;

namespace QLDT.Application.Interfaces;

public interface IQLDTDbContext
{
    DbSet<Lesson> Lessons { get; }
    DbSet<DailyComment> DailyComments { get; }
    DbSet<Exam> Exams { get; }
    DbSet<ExamResult> ExamResults { get; }
    DbSet<Student> Students { get; }
    DbSet<Class> Classes { get; }
    DbSet<ClassTeacher> ClassTeachers { get; }
    DbSet<Teacher> Teachers { get; }
    DbSet<User> Users { get; }
    DbSet<SharedLink> SharedLinks { get; }
    DbSet<Attendance> Attendances { get; }
    DbSet<Schedule> Schedules { get; }
    DbSet<Branch> Branches { get; }
    DbSet<StudentParent> StudentParents { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry<TEntity> Entry<TEntity>(TEntity entity) where TEntity : class;
}

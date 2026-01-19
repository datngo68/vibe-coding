using Microsoft.EntityFrameworkCore;
using QLDT.Application.Interfaces;
using QLDT.Domain.Entities;

namespace QLDT.Infrastructure.Data;

public class QLDTDbContextAdapter : IQLDTDbContext
{
    private readonly QLDTDbContext _context;

    public QLDTDbContextAdapter(QLDTDbContext context)
    {
        _context = context;
    }

    public DbSet<Lesson> Lessons => _context.Lessons;
    public DbSet<DailyComment> DailyComments => _context.DailyComments;
    public DbSet<Exam> Exams => _context.Exams;
    public DbSet<ExamResult> ExamResults => _context.ExamResults;
    public DbSet<Student> Students => _context.Students;
    public DbSet<Class> Classes => _context.Classes;
    public DbSet<ClassTeacher> ClassTeachers => _context.ClassTeachers;
    public DbSet<Teacher> Teachers => _context.Teachers;
    public DbSet<User> Users => _context.Users;
    public DbSet<SharedLink> SharedLinks => _context.SharedLinks;
    public DbSet<Attendance> Attendances => _context.Attendances;
    public DbSet<Schedule> Schedules => _context.Schedules;
    public DbSet<Branch> Branches => _context.Branches;
    public DbSet<StudentParent> StudentParents => _context.StudentParents;

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return _context.SaveChangesAsync(cancellationToken);
    }

    public Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry<TEntity> Entry<TEntity>(TEntity entity) where TEntity : class
    {
        return _context.Entry(entity);
    }
}

using Microsoft.EntityFrameworkCore;
using QLDT.Domain.Entities;

namespace QLDT.Infrastructure.Data;

public class QLDTDbContext : DbContext
{
    public QLDTDbContext(DbContextOptions<QLDTDbContext> options) : base(options)
    {
    }

    public DbSet<Owner> Owners { get; set; }
    public DbSet<Branch> Branches { get; set; }
    public DbSet<Class> Classes { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<Teacher> Teachers { get; set; }
    public DbSet<ClassTeacher> ClassTeachers { get; set; }
    public DbSet<Lesson> Lessons { get; set; }
    public DbSet<DailyComment> DailyComments { get; set; }
    public DbSet<Exam> Exams { get; set; }
    public DbSet<ExamResult> ExamResults { get; set; }
    public DbSet<Attendance> Attendances { get; set; }
    public DbSet<Schedule> Schedules { get; set; }
    public DbSet<SharedLink> SharedLinks { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<StudentParent> StudentParents { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure Owner
        modelBuilder.Entity<Owner>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Phone).HasMaxLength(20);
        });

        // Configure Branch
        modelBuilder.Entity<Branch>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.HasOne(e => e.Owner)
                .WithMany(o => o.Branches)
                .HasForeignKey(e => e.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Class
        modelBuilder.Entity<Class>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Level).HasMaxLength(50);
            entity.HasOne(e => e.Branch)
                .WithMany(b => b.Classes)
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Student
        modelBuilder.Entity<Student>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ParentName).HasMaxLength(200);
            entity.Property(e => e.ParentPhone).HasMaxLength(20);
            entity.Property(e => e.ParentEmail).HasMaxLength(200);
            entity.HasOne(e => e.Class)
                .WithMany(c => c.Students)
                .HasForeignKey(e => e.ClassId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Teacher
        modelBuilder.Entity<Teacher>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.HasOne(e => e.Branch)
                .WithMany(b => b.Teachers)
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure ClassTeacher (Many-to-Many)
        modelBuilder.Entity<ClassTeacher>(entity =>
        {
            entity.HasKey(e => new { e.ClassId, e.TeacherId });
            entity.HasOne(e => e.Class)
                .WithMany(c => c.ClassTeachers)
                .HasForeignKey(e => e.ClassId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Teacher)
                .WithMany(t => t.ClassTeachers)
                .HasForeignKey(e => e.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Lesson
        modelBuilder.Entity<Lesson>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Vocabulary).HasColumnType("TEXT");
            entity.Property(e => e.Homework).HasColumnType("TEXT");
            entity.Property(e => e.GeneralComment).HasMaxLength(2000);
            entity.HasOne(e => e.Class)
                .WithMany(c => c.Lessons)
                .HasForeignKey(e => e.ClassId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Teacher)
                .WithMany(t => t.Lessons)
                .HasForeignKey(e => e.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure DailyComment
        modelBuilder.Entity<DailyComment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.HomeworkStatus).HasMaxLength(50);
            entity.Property(e => e.Comment).HasMaxLength(2000);
            entity.HasOne(e => e.Lesson)
                .WithMany(l => l.DailyComments)
                .HasForeignKey(e => e.LessonId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Student)
                .WithMany(s => s.DailyComments)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Exam
        modelBuilder.Entity<Exam>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ExamType).IsRequired().HasMaxLength(100);
            entity.HasOne(e => e.Class)
                .WithMany(c => c.Exams)
                .HasForeignKey(e => e.ClassId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Teacher)
                .WithMany(t => t.Exams)
                .HasForeignKey(e => e.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure ExamResult
        modelBuilder.Entity<ExamResult>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Comment).HasMaxLength(2000);
            entity.HasOne(e => e.Exam)
                .WithMany(ex => ex.ExamResults)
                .HasForeignKey(e => e.ExamId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Student)
                .WithMany(s => s.ExamResults)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Attendance
        modelBuilder.Entity<Attendance>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.HasOne(e => e.Lesson)
                .WithMany(l => l.Attendances)
                .HasForeignKey(e => e.LessonId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Student)
                .WithMany(s => s.Attendances)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure Schedule
        modelBuilder.Entity<Schedule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DayOfWeek).HasConversion<int>();
            entity.Property(e => e.Room).HasMaxLength(50);
            entity.HasOne(e => e.Class)
                .WithMany(c => c.Schedules)
                .HasForeignKey(e => e.ClassId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure SharedLink
        modelBuilder.Entity<SharedLink>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EntityType).HasConversion<int>();
            entity.Property(e => e.Token).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.HasOne(e => e.User)
                .WithMany(u => u.SharedLinks)
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(200); // Email is now optional
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(500);
            entity.Property(e => e.FullName).HasMaxLength(200);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.IsActive).IsRequired().HasDefaultValue(true);
            entity.Property(e => e.Role).HasConversion<int>();
            entity.HasIndex(e => e.Username).IsUnique();
            // Note: Email unique constraint removed - uniqueness will be enforced in application code
            // This allows multiple users without email (NULL values)
            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Teacher)
                .WithMany()
                .HasForeignKey(e => e.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure StudentParent
        modelBuilder.Entity<StudentParent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Student)
                .WithMany()
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ParentUser)
                .WithMany()
                .HasForeignKey(e => e.ParentUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => new { e.StudentId, e.ParentUserId }).IsUnique();
        });
    }
}

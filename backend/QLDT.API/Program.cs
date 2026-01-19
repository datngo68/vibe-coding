using Microsoft.EntityFrameworkCore;
using QLDT.Infrastructure.Data;
using System.Text.Json.Serialization;
using Microsoft.OpenApi.Models;
using OfficeOpenXml;

var builder = WebApplication.CreateBuilder(args);

// Set EPPlus license for non-commercial use (must be set before any ExcelPackage usage)
ExcelPackage.License.SetNonCommercialPersonal("QLDT Education Center");

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "QLDT API",
        Version = "v1",
        Description = "API cho hệ thống quản lý trung tâm tiếng Anh"
    });

    // Add JWT Bearer authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Include XML comments
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }
});

// Configure Entity Framework Core với SQLite
builder.Services.AddDbContext<QLDTDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register AutoMapper
builder.Services.AddAutoMapper(typeof(QLDT.Application.Mappings.MappingProfile));

// Register Repositories (Infrastructure)
builder.Services.AddScoped(typeof(QLDT.Infrastructure.Repositories.IRepository<>), typeof(QLDT.Infrastructure.Repositories.Repository<>));
builder.Services.AddScoped<QLDT.Application.Services.IUserRepository, QLDT.Infrastructure.Repositories.UserRepository>();
builder.Services.AddScoped<QLDT.Application.Interfaces.IRepository<QLDT.Domain.Entities.User>, QLDT.Infrastructure.Repositories.RepositoryAdapter<QLDT.Domain.Entities.User>>();

// Register Repository Adapters (Application interfaces)
// RepositoryAdapter implements QLDT.Application.Interfaces.IRepository<T> and uses QLDTDbContext
builder.Services.AddScoped(typeof(QLDT.Application.Interfaces.IRepository<>), typeof(QLDT.Infrastructure.Repositories.RepositoryAdapter<>));

// Register DbContext Adapter
builder.Services.AddScoped<QLDT.Application.Interfaces.IQLDTDbContext, QLDT.Infrastructure.Data.QLDTDbContextAdapter>();

// Register Services
builder.Services.AddScoped<QLDT.Application.Services.IAuthService, QLDT.Application.Services.AuthService>();
builder.Services.AddScoped<QLDT.Application.Services.ILessonService, QLDT.Application.Services.LessonService>();
builder.Services.AddScoped<QLDT.Application.Services.ICommentService, QLDT.Application.Services.CommentService>();
builder.Services.AddScoped<QLDT.Application.Services.IExamService, QLDT.Application.Services.ExamService>();
builder.Services.AddScoped<QLDT.Application.Services.IExportService, QLDT.Application.Services.ExportService>();
builder.Services.AddScoped<QLDT.Application.Services.ISharedLinkService, QLDT.Application.Services.SharedLinkService>();
builder.Services.AddScoped<QLDT.Application.Services.IAttendanceService, QLDT.Application.Services.AttendanceService>();
builder.Services.AddScoped<QLDT.Application.Services.IScheduleService, QLDT.Application.Services.ScheduleService>();
builder.Services.AddScoped<QLDT.Application.Services.IBranchService, QLDT.Application.Services.BranchService>();
builder.Services.AddScoped<QLDT.Application.Services.IClassService, QLDT.Application.Services.ClassService>();
builder.Services.AddScoped<QLDT.Application.Services.IStudentService, QLDT.Application.Services.StudentService>();
builder.Services.AddScoped<QLDT.Application.Services.ITeacherService, QLDT.Application.Services.TeacherService>();
builder.Services.AddScoped<QLDT.Application.Services.IDashboardService, QLDT.Application.Services.DashboardService>();
builder.Services.AddScoped<QLDT.Application.Services.IUserService, QLDT.Application.Services.UserService>();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(secretKey))
    };
});

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:5174",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "https://english.tudonghoa.me"
              )
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "QLDT API V1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowReactApp");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Ensure database is created and seed initial data
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<QLDTDbContext>();
    // Apply migrations instead of EnsureCreated to support schema updates
    dbContext.Database.Migrate();

    // Seed initial data if database is empty
    if (!dbContext.Users.Any())
    {
        // Tạo Owner đầu tiên
        var owner = new QLDT.Domain.Entities.Owner
        {
            Id = 1,
            Name = "Admin Owner",
            Email = "admin@qldt.com"
        };
        dbContext.Owners.Add(owner);

        // Tạo Branch đầu tiên
        var branch = new QLDT.Domain.Entities.Branch
        {
            Id = 1,
            OwnerId = 1,
            Name = "Chi nhánh chính",
            CreatedAt = DateTime.UtcNow
        };
        dbContext.Branches.Add(branch);

        // Tạo User Owner (chủ trung tâm)
        var adminUser = new QLDT.Domain.Entities.User
        {
            Username = "admin",
            Email = "admin@qldt.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            FullName = "Admin Owner",
            Role = QLDT.Domain.Entities.UserRole.Owner,
            BranchId = null, // Owner không thuộc branch cụ thể
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        dbContext.Users.Add(adminUser);

        // Tạo User Branch Manager
        var managerUser = new QLDT.Domain.Entities.User
        {
            Username = "manager",
            Email = "manager@qldt.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("manager123"),
            FullName = "Branch Manager",
            Role = QLDT.Domain.Entities.UserRole.BranchManager,
            BranchId = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        dbContext.Users.Add(managerUser);

        // Tạo User Teacher (giáo viên)
        var teacherUser = new QLDT.Domain.Entities.User
        {
            Username = "teacher",
            Email = "teacher@qldt.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("teacher123"),
            FullName = "Teacher",
            Role = QLDT.Domain.Entities.UserRole.Teacher,
            BranchId = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        dbContext.Users.Add(teacherUser);

        dbContext.SaveChanges();

        Console.WriteLine("✓ Initial data seeded successfully!");
        Console.WriteLine("Default users created:");
        Console.WriteLine("  - Owner: admin / admin123");
        Console.WriteLine("  - Branch Manager: manager / manager123");
        Console.WriteLine("  - Teacher: teacher / teacher123");
    }
}

app.Run();

// Make Program class accessible for testing
public partial class Program { }

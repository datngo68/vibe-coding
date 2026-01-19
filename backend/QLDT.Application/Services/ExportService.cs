using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using QLDT.Application.Interfaces;
using QLDT.Domain.Entities;
using QLDT.Domain.ValueObjects;
using System.Drawing;
using System.Text.Json;

namespace QLDT.Application.Services;

public class ExportService : IExportService
{
    private readonly IQLDTDbContext _context;

    public ExportService(IQLDTDbContext context)
    {
        _context = context;
        // EPPlus license for non-commercial use (EPPlus 5+)
        try
        {
            ExcelPackage.License.SetNonCommercialPersonal("QLDT Education Center");
        }
        catch
        {
            // License already set or using older version
        }
    }

    public async Task<byte[]> ExportLessonToExcelAsync(int lessonId)
    {
        var lesson = await _context.Lessons
            .Include(l => l.Class)
                .ThenInclude(c => c.Schedules)
            .Include(l => l.Teacher)
            .Include(l => l.DailyComments)
                .ThenInclude(c => c.Student)
            .FirstOrDefaultAsync(l => l.Id == lessonId);

        if (lesson == null)
            throw new KeyNotFoundException($"Lesson with id {lessonId} not found");

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Nội dung bài học");

        // Get schedule info
        var schedules = lesson.Class.Schedules.OrderBy(s => s.DayOfWeek).ToList();
        var scheduleText = "";
        if (schedules.Any())
        {
            var dayNames = schedules.Select(s =>
                s.DayOfWeek switch
                {
                    DayOfWeek.Monday => "Mon",
                    DayOfWeek.Tuesday => "Tue",
                    DayOfWeek.Wednesday => "Wed",
                    DayOfWeek.Thursday => "Thu",
                    DayOfWeek.Friday => "Fri",
                    DayOfWeek.Saturday => "Sat",
                    DayOfWeek.Sunday => "Sun",
                    _ => s.DayOfWeek.ToString()
                });
            var firstSchedule = schedules.First();
            // Format: "Ca 2 Mon & Wed" - using hour from StartTime
            scheduleText = $"Ca {firstSchedule.StartTime.Hour} {string.Join(" & ", dayNames)}";
        }

        // Header section - fill correct information
        worksheet.Cells[1, 1].Value = $"Ms. {lesson.Teacher.Name}";
        if (!string.IsNullOrEmpty(scheduleText))
        {
            worksheet.Cells[1, 2].Value = scheduleText;
        }
        else
        {
            worksheet.Cells[1, 2].Value = ""; // Empty if no schedule
        }
        // Course Level or Class Name
        worksheet.Cells[1, 3].Value = lesson.Class.Level ?? lesson.Class.Name;
        // Date format: "DATE: 12/01/2026"
        worksheet.Cells[1, 4].Value = $"DATE: {lesson.Date:dd/MM/yyyy}";

        // Header styling
        var headerRow = worksheet.Cells[1, 1, 1, 4];
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Font.Size = 11;

        int row = 3;

        // General comment section (if exists) - before lesson content
        if (!string.IsNullOrEmpty(lesson.GeneralComment))
        {
            worksheet.Cells[row, 1].Value = "Nhận xét chung:";
            worksheet.Cells[row, 1].Style.Font.Bold = true;
            worksheet.Cells[row, 1].Style.Font.Size = 11;

            // Merge cells for general comment
            var generalCommentHeader = worksheet.Cells[row, 1, row, 6];
            generalCommentHeader.Merge = true;
            generalCommentHeader.Style.Border.BorderAround(ExcelBorderStyle.Thin);
            row++;

            worksheet.Cells[row, 1].Value = lesson.GeneralComment;
            var generalCommentCell = worksheet.Cells[row, 1, row, 6];
            generalCommentCell.Merge = true;
            generalCommentCell.Style.WrapText = true;
            generalCommentCell.Style.VerticalAlignment = ExcelVerticalAlignment.Top;
            generalCommentCell.Style.Border.BorderAround(ExcelBorderStyle.Thin);
            row++;
            row++; // Add spacing
        }

        // Lesson Content Section (yellow/pink background)
        worksheet.Cells[row, 1].Value = "NỘI DUNG BÀI HỌC";
        var lessonContentHeader = worksheet.Cells[row, 1, row, 6];
        lessonContentHeader.Merge = true;
        lessonContentHeader.Style.Font.Bold = true;
        lessonContentHeader.Style.Fill.PatternType = ExcelFillStyle.Solid;
        lessonContentHeader.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(255, 192, 203)); // Pink
        lessonContentHeader.Style.Border.BorderAround(ExcelBorderStyle.Thin);
        row++;

        // Lesson content details - fill from actual lesson data
        var lessonContent = new List<string>();

        // 1. Vocabulary check (if vocabulary exists)
        if (!string.IsNullOrEmpty(lesson.Vocabulary))
        {
            try
            {
                var vocabulary = JsonSerializer.Deserialize<List<VocabularyItem>>(lesson.Vocabulary);
                if (vocabulary != null && vocabulary.Any())
                {
                    lessonContent.Add("Kiểm tra từ vựng đầu giờ");
                }
            }
            catch
            {
                // If parsing fails, still add if vocabulary string is not empty
                lessonContent.Add("Kiểm tra từ vựng đầu giờ");
            }
        }

        // 2. Unit and lesson number
        var classLevel = lesson.Class.Level ?? lesson.Class.Name;
        lessonContent.Add($"{classLevel} unit {lesson.LessonNumber}");

        // 3. Listening practice (always included as it's standard)
        lessonContent.Add("Thực hành kỹ năng nghe thông tin");

        // 4. Grammar (actual grammar from lesson)
        if (!string.IsNullOrEmpty(lesson.Grammar))
        {
            try
            {
                var grammar = JsonSerializer.Deserialize<List<GrammarItem>>(lesson.Grammar);
                if (grammar != null && grammar.Any())
                {
                    var grammarItems = grammar.Select(g => $"{g.Topic}: {g.Description}").ToList();
                    lessonContent.Add($"Ngữ pháp: {string.Join("; ", grammarItems)}");
                }
            }
            catch
            {
                // If parsing fails, still add grammar correction as standard
                lessonContent.Add("Chữa ngữ pháp");
            }
        }
        else
        {
            // If no grammar specified, add standard grammar correction
            lessonContent.Add("Chữa ngữ pháp");
        }

        // 5. Vocabulary words (actual vocabulary from lesson)
        if (!string.IsNullOrEmpty(lesson.Vocabulary))
        {
            try
            {
                var vocabulary = JsonSerializer.Deserialize<List<VocabularyItem>>(lesson.Vocabulary);
                if (vocabulary != null && vocabulary.Any())
                {
                    var vocabWords = vocabulary.Select(v => $"{v.Word} ({v.Translation})").ToList();
                    lessonContent.Add($"Học từ mới: {string.Join(", ", vocabWords)}");
                }
            }
            catch
            {
                // If parsing fails, skip vocabulary words
            }
        }

        // 6. Homework (actual homework from lesson)
        if (!string.IsNullOrEmpty(lesson.Homework))
        {
            try
            {
                var homework = JsonSerializer.Deserialize<List<HomeworkItem>>(lesson.Homework);
                if (homework != null && homework.Any())
                {
                    var homeworkItems = homework.Select(h => $"Trang {h.Page}: {h.Description}").ToList();
                    lessonContent.Add($"Bài tập về nhà: {string.Join("; ", homeworkItems)}");
                }
            }
            catch
            {
                // If parsing fails, skip homework
            }
        }

        foreach (var content in lessonContent)
        {
            worksheet.Cells[row, 1].Value = content;
            var contentCell = worksheet.Cells[row, 1, row, 6];
            contentCell.Merge = true;
            contentCell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            contentCell.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(255, 192, 203)); // Pink
            contentCell.Style.Border.BorderAround(ExcelBorderStyle.Thin);
            contentCell.Style.WrapText = true; // Enable wrap text for long content
            row++;
        }
        row++;

        // Table headers
        worksheet.Cells[row, 1].Value = "STT";
        worksheet.Cells[row, 2].Value = "Tên";
        worksheet.Cells[row, 3].Value = "Điểm Kiểm tra từ vựng";
        worksheet.Cells[row, 4].Value = "Điểm thi cuối kỳ 1 ở trường";
        worksheet.Cells[row, 5].Value = "Bài tập về nhà";
        worksheet.Cells[row, 6].Value = "Nhận xét";

        var tableHeader = worksheet.Cells[row, 1, row, 6];
        tableHeader.Style.Font.Bold = true;
        tableHeader.Style.Fill.PatternType = ExcelFillStyle.Solid;
        tableHeader.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(255, 242, 204)); // Yellow
        tableHeader.Style.Border.BorderAround(ExcelBorderStyle.Thin);
        tableHeader.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        row++;

        // Get students from class
        var students = await _context.Students
            .Where(s => s.ClassId == lesson.ClassId)
            .OrderBy(s => s.Name)
            .ToListAsync();

        // Get comments map
        var commentMap = lesson.DailyComments.ToDictionary(c => c.StudentId);

        // Student rows with comments
        for (int i = 0; i < students.Count; i++)
        {
            var student = students[i];
            var comment = commentMap.ContainsKey(student.Id) ? commentMap[student.Id] : null;

            worksheet.Cells[row, 1].Value = i + 1;
            worksheet.Cells[row, 2].Value = student.Name;
            worksheet.Cells[row, 3].Value = comment?.VocabularyScore?.ToString("F1") ?? "";
            worksheet.Cells[row, 4].Value = comment?.SchoolExamScore?.ToString("F1") ?? "";
            worksheet.Cells[row, 5].Value = comment?.HomeworkStatus ?? "Đủ BT";
            worksheet.Cells[row, 6].Value = comment?.Comment ?? "";

            // Pink background for score columns (3, 4, 5)
            worksheet.Cells[row, 3].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[row, 3].Style.Fill.BackgroundColor.SetColor(Color.FromArgb(255, 192, 203)); // Pink
            worksheet.Cells[row, 4].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[row, 4].Style.Fill.BackgroundColor.SetColor(Color.FromArgb(255, 192, 203)); // Pink
            worksheet.Cells[row, 5].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[row, 5].Style.Fill.BackgroundColor.SetColor(Color.FromArgb(255, 192, 203)); // Pink

            // Wrap text for comment column
            worksheet.Cells[row, 6].Style.WrapText = true;
            worksheet.Cells[row, 6].Style.VerticalAlignment = ExcelVerticalAlignment.Top;

            worksheet.Cells[row, 1, row, 6].Style.Border.BorderAround(ExcelBorderStyle.Thin);
            row++;
        }

        // Set column widths
        worksheet.Column(1).Width = 8; // STT
        worksheet.Column(2).Width = 20; // Tên
        worksheet.Column(3).Width = 25; // Điểm Kiểm tra từ vựng
        worksheet.Column(4).Width = 30; // Điểm thi cuối kỳ 1 ở trường
        worksheet.Column(5).Width = 18; // Bài tập về nhà
        worksheet.Column(6).Width = 60; // Nhận xét (wide)

        // Set row heights for comment rows
        for (int r = 3; r < row; r++)
        {
            if (worksheet.Cells[r, 6].Value?.ToString()?.Length > 50)
            {
                worksheet.Row(r).Height = 30;
            }
        }

        return package.GetAsByteArray();
    }

    public async Task<byte[]> ExportDailyCommentsToExcelAsync(int lessonId)
    {
        var lesson = await _context.Lessons
            .Include(l => l.Class)
                .ThenInclude(c => c.Schedules)
            .Include(l => l.Teacher)
            .Include(l => l.DailyComments)
                .ThenInclude(c => c.Student)
            .FirstOrDefaultAsync(l => l.Id == lessonId);

        if (lesson == null)
            throw new KeyNotFoundException($"Lesson with id {lessonId} not found");

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Nhận xét hàng ngày");

        // Get schedule info
        var schedules = lesson.Class.Schedules.OrderBy(s => s.DayOfWeek).ToList();
        var scheduleText = "";
        if (schedules.Any())
        {
            var dayNames = schedules.Select(s =>
                s.DayOfWeek switch
                {
                    DayOfWeek.Monday => "Mon",
                    DayOfWeek.Tuesday => "Tue",
                    DayOfWeek.Wednesday => "Wed",
                    DayOfWeek.Thursday => "Thu",
                    DayOfWeek.Friday => "Fri",
                    DayOfWeek.Saturday => "Sat",
                    DayOfWeek.Sunday => "Sun",
                    _ => s.DayOfWeek.ToString()
                });
            var firstSchedule = schedules.First();
            scheduleText = $"Ca {firstSchedule.StartTime.Hour} {string.Join(" & ", dayNames)}";
        }

        // Header section (white background)
        worksheet.Cells[1, 1].Value = $"Ms. {lesson.Teacher.Name}";
        if (!string.IsNullOrEmpty(scheduleText))
        {
            worksheet.Cells[1, 2].Value = scheduleText;
        }
        worksheet.Cells[1, 3].Value = lesson.Class.Level ?? lesson.Class.Name;
        worksheet.Cells[1, 4].Value = $"DATE: {lesson.Date:dd/MM/yyyy}";

        // Header styling
        var headerRow = worksheet.Cells[1, 1, 1, 4];
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Font.Size = 11;

        int row = 3;

        // Lesson Content Section (yellow background)
        worksheet.Cells[row, 1].Value = "NỘI DUNG BÀI HỌC";
        var lessonContentHeader = worksheet.Cells[row, 1, row, 6];
        lessonContentHeader.Merge = true;
        lessonContentHeader.Style.Font.Bold = true;
        lessonContentHeader.Style.Fill.PatternType = ExcelFillStyle.Solid;
        lessonContentHeader.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(255, 242, 204)); // Yellow
        lessonContentHeader.Style.Border.BorderAround(ExcelBorderStyle.Thin);
        row++;

        // Lesson content details
        var lessonContent = new List<string>();
        if (!string.IsNullOrEmpty(lesson.Vocabulary))
        {
            lessonContent.Add("Kiểm tra từ vựng đầu giờ");
        }
        lessonContent.Add($"{lesson.Class.Level ?? lesson.Class.Name} unit {lesson.LessonNumber}");
        lessonContent.Add("Thực hành kỹ năng nghe thông tin");
        lessonContent.Add("Chữa ngữ pháp");

        foreach (var content in lessonContent)
        {
            worksheet.Cells[row, 1].Value = content;
            var contentCell = worksheet.Cells[row, 1, row, 6];
            contentCell.Merge = true;
            contentCell.Style.Fill.PatternType = ExcelFillStyle.Solid;
            contentCell.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(255, 242, 204)); // Yellow
            contentCell.Style.Border.BorderAround(ExcelBorderStyle.Thin);
            row++;
        }
        row++;

        // Table headers
        worksheet.Cells[row, 1].Value = "STT";
        worksheet.Cells[row, 2].Value = "Tên";
        worksheet.Cells[row, 3].Value = "Điểm Kiểm tra từ vựng";
        worksheet.Cells[row, 4].Value = "Điểm thi cuối kỳ 1 ở trường";
        worksheet.Cells[row, 5].Value = "Bài tập về nhà";
        worksheet.Cells[row, 6].Value = "Nhận xét";

        var tableHeader = worksheet.Cells[row, 1, row, 6];
        tableHeader.Style.Font.Bold = true;
        tableHeader.Style.Fill.PatternType = ExcelFillStyle.Solid;
        tableHeader.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(255, 242, 204)); // Yellow
        tableHeader.Style.Border.BorderAround(ExcelBorderStyle.Thin);
        tableHeader.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        row++;

        // Score columns background (pink)
        var comments = lesson.DailyComments.OrderBy(c => c.Student.Name).ToList();
        for (int i = 0; i < comments.Count; i++)
        {
            var comment = comments[i];
            worksheet.Cells[row, 1].Value = i + 1;
            worksheet.Cells[row, 2].Value = comment.Student.Name;
            worksheet.Cells[row, 3].Value = comment.VocabularyScore?.ToString("F1") ?? "";
            worksheet.Cells[row, 4].Value = comment.SchoolExamScore?.ToString("F1") ?? "";
            worksheet.Cells[row, 5].Value = comment.HomeworkStatus ?? "Đủ BT";
            worksheet.Cells[row, 6].Value = comment.Comment ?? "";

            // Pink background for score columns (3, 4, 5)
            worksheet.Cells[row, 3].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[row, 3].Style.Fill.BackgroundColor.SetColor(Color.FromArgb(255, 192, 203)); // Pink
            worksheet.Cells[row, 4].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[row, 4].Style.Fill.BackgroundColor.SetColor(Color.FromArgb(255, 192, 203)); // Pink
            worksheet.Cells[row, 5].Style.Fill.PatternType = ExcelFillStyle.Solid;
            worksheet.Cells[row, 5].Style.Fill.BackgroundColor.SetColor(Color.FromArgb(255, 192, 203)); // Pink

            worksheet.Cells[row, 1, row, 6].Style.Border.BorderAround(ExcelBorderStyle.Thin);
            row++;
        }

        // Set column widths
        worksheet.Column(1).Width = 8; // STT
        worksheet.Column(2).Width = 20; // Tên
        worksheet.Column(3).Width = 25; // Điểm Kiểm tra từ vựng
        worksheet.Column(4).Width = 30; // Điểm thi cuối kỳ 1 ở trường
        worksheet.Column(5).Width = 18; // Bài tập về nhà
        worksheet.Column(6).Width = 60; // Nhận xét (wide)

        return package.GetAsByteArray();
    }

    public async Task<byte[]> ExportExamToExcelAsync(int examId)
    {
        var exam = await _context.Exams
            .Include(e => e.Class)
                .ThenInclude(c => c.Schedules)
            .Include(e => e.Teacher)
            .Include(e => e.ExamResults)
                .ThenInclude(r => r.Student)
            .FirstOrDefaultAsync(e => e.Id == examId);

        if (exam == null)
            throw new KeyNotFoundException($"Exam with id {examId} not found");

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Bài kiểm tra");

        // Get schedule info
        var schedules = exam.Class.Schedules.OrderBy(s => s.DayOfWeek).ToList();
        var scheduleText = "";
        if (schedules.Any())
        {
            var dayNames = schedules.Select(s =>
                s.DayOfWeek switch
                {
                    DayOfWeek.Monday => "Mon",
                    DayOfWeek.Tuesday => "Tue",
                    DayOfWeek.Wednesday => "Wed",
                    DayOfWeek.Thursday => "Thu",
                    DayOfWeek.Friday => "Fri",
                    DayOfWeek.Saturday => "Sat",
                    DayOfWeek.Sunday => "Sun",
                    _ => s.DayOfWeek.ToString()
                });
            var firstSchedule = schedules.First();
            scheduleText = $"Ca {firstSchedule.StartTime.Hour} {string.Join(" & ", dayNames)}";
        }

        // Header section (white background)
        worksheet.Cells[1, 1].Value = $"Ms. {exam.Teacher.Name}";
        if (!string.IsNullOrEmpty(scheduleText))
        {
            worksheet.Cells[1, 2].Value = scheduleText;
        }
        worksheet.Cells[1, 3].Value = exam.Class.Level ?? exam.Class.Name;
        worksheet.Cells[1, 4].Value = $"DATE: {exam.Date:dd/MM/yyyy}";

        // Header styling
        var headerRow = worksheet.Cells[1, 1, 1, 4];
        headerRow.Style.Font.Bold = true;
        headerRow.Style.Font.Size = 11;

        int row = 3;

        // Table headers (yellow background)
        worksheet.Cells[row, 1].Value = "STT";
        worksheet.Cells[row, 2].Value = "Tên";
        worksheet.Cells[row, 3].Value = "Speaking";
        worksheet.Cells[row, 4].Value = "Listening";
        worksheet.Cells[row, 5].Value = "Reading & Writing";
        worksheet.Cells[row, 6].Value = "Nhận xét";

        var tableHeader = worksheet.Cells[row, 1, row, 6];
        tableHeader.Style.Font.Bold = true;
        tableHeader.Style.Fill.PatternType = ExcelFillStyle.Solid;
        tableHeader.Style.Fill.BackgroundColor.SetColor(Color.FromArgb(255, 242, 204)); // Yellow
        tableHeader.Style.Border.BorderAround(ExcelBorderStyle.Thin);
        tableHeader.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
        row++;

        var results = exam.ExamResults.OrderBy(r => r.Student.Name).ToList();
        for (int i = 0; i < results.Count; i++)
        {
            var result = results[i];
            worksheet.Cells[row, 1].Value = i + 1;
            worksheet.Cells[row, 2].Value = result.Student.Name;
            worksheet.Cells[row, 3].Value = result.SpeakingScore?.ToString("F1") ?? "";
            worksheet.Cells[row, 4].Value = result.ListeningScore?.ToString("F1") ?? "";
            worksheet.Cells[row, 5].Value = result.ReadingWritingScore?.ToString("F1") ?? "";
            worksheet.Cells[row, 6].Value = result.Comment ?? "";

            worksheet.Cells[row, 1, row, 6].Style.Border.BorderAround(ExcelBorderStyle.Thin);
            row++;
        }

        // Set column widths
        worksheet.Column(1).Width = 8; // STT
        worksheet.Column(2).Width = 20; // Tên
        worksheet.Column(3).Width = 15; // Speaking
        worksheet.Column(4).Width = 15; // Listening
        worksheet.Column(5).Width = 20; // Reading & Writing
        worksheet.Column(6).Width = 60; // Nhận xét (wide)

        return package.GetAsByteArray();
    }
}

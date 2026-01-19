using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLDT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGrammarToLesson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Grammar",
                table: "Lessons",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Grammar",
                table: "Lessons");
        }
    }
}

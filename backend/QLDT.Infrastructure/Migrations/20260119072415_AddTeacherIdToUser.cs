using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLDT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherIdToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TeacherId",
                table: "Users",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_TeacherId",
                table: "Users",
                column: "TeacherId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Teachers_TeacherId",
                table: "Users",
                column: "TeacherId",
                principalTable: "Teachers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Teachers_TeacherId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_TeacherId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TeacherId",
                table: "Users");
        }
    }
}

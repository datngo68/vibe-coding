using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLDT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsCompletedToClass : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsCompleted",
                table: "Classes",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsCompleted",
                table: "Classes");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLDT.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeEmailNullableAndFixUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop the unique index on Email first
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            // Alter column to nullable
            // Note: SQLite will rebuild the table, which may take time
            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "TEXT",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 200);

            // Note: We don't recreate the unique index here because SQLite doesn't support
            // filtered indexes well. Email uniqueness will be enforced in application code.
            // Multiple NULL values are allowed, which is what we want for users without email.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Update NULL values to empty string before making column NOT NULL
            migrationBuilder.Sql("UPDATE Users SET Email = '' WHERE Email IS NULL");

            // Alter column back to NOT NULL
            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "TEXT",
                maxLength: 200,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 200,
                oldNullable: true);

            // Recreate unique index
            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }
    }
}

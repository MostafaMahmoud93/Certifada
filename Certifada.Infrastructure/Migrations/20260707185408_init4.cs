using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Certifada.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class init4 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("86e3cf96-4cb9-4b7e-a2cd-1cb136e113dd"), new Guid("36f3cec7-caf0-4551-9330-7f0e2c231518") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("aaae6e31-7407-48fa-ade7-84efc402ba52"), new Guid("36f3cec7-caf0-4551-9330-7f0e2c231518") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("0f82d59e-181a-4d4d-b41e-5e2b5b48b30d"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("21b8d3dc-f9ff-438c-b83f-c4dceff8f505"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2f3c63f9-82e7-4d82-9aa3-c1a8ea231cfd"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("3f2a2168-7db7-40ec-92c5-7f2b5ae84335"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("45314e9d-ec9e-4c3e-9836-7850215b2f98"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("6ae47f88-367d-414b-9fa7-6cfd8b58c413"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("7094382f-6c85-4fe1-a5a3-e1efde39db71"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("7c6c76a7-b5f5-4b02-9f37-d76a3ac347f3"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("86e3cf96-4cb9-4b7e-a2cd-1cb136e113dd"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("91c2ed65-54b6-4bd1-a660-e3c64dbfb9d3"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a4e4c234-6fa9-498b-bec0-d420eae1fdcb"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("aaae6e31-7407-48fa-ade7-84efc402ba52"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("b5b7009f-1589-4b47-a353-52b261fdfd03"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("b96861b8-d76f-42b5-a622-2ce6852d50b4"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("cf43b30e-05c1-4a44-8ac6-d05d1a25c0f6"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d10c7b98-6a4e-4a66-b109-1eacd5c0b101"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d19f650b-7ed9-4264-ae33-7fa0eb61dbe3"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("eb27d68d-fae6-4fa3-87b7-5a8b928ff69e"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("f7d03dd3-c0e3-47e5-9448-602a24bfa60c"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("fea6837a-c94e-4c18-bd27-7763a1a983de"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("6ae47f88-367d-414b-9fa7-6cfd8b58c413"), new Guid("40db8cd0-2340-4f56-98f6-edbdc435d137") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d10c7b98-6a4e-4a66-b109-1eacd5c0b101"), new Guid("40db8cd0-2340-4f56-98f6-edbdc435d137") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("eb27d68d-fae6-4fa3-87b7-5a8b928ff69e"), new Guid("40db8cd0-2340-4f56-98f6-edbdc435d137") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("f7d03dd3-c0e3-47e5-9448-602a24bfa60c"), new Guid("40db8cd0-2340-4f56-98f6-edbdc435d137") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("86e3cf96-4cb9-4b7e-a2cd-1cb136e113dd"), new Guid("74d986ef-92be-4d4b-9993-12976347b1be") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("b96861b8-d76f-42b5-a622-2ce6852d50b4"), new Guid("74d986ef-92be-4d4b-9993-12976347b1be") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("3f2a2168-7db7-40ec-92c5-7f2b5ae84335"), new Guid("78752151-7cd4-46ee-bd6c-6b6bef16f286") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("aaae6e31-7407-48fa-ade7-84efc402ba52"), new Guid("78752151-7cd4-46ee-bd6c-6b6bef16f286") });

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("0f82d59e-181a-4d4d-b41e-5e2b5b48b30d"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("21b8d3dc-f9ff-438c-b83f-c4dceff8f505"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("2f3c63f9-82e7-4d82-9aa3-c1a8ea231cfd"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("3f2a2168-7db7-40ec-92c5-7f2b5ae84335"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("45314e9d-ec9e-4c3e-9836-7850215b2f98"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("6ae47f88-367d-414b-9fa7-6cfd8b58c413"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("7094382f-6c85-4fe1-a5a3-e1efde39db71"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("7c6c76a7-b5f5-4b02-9f37-d76a3ac347f3"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("86e3cf96-4cb9-4b7e-a2cd-1cb136e113dd"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("91c2ed65-54b6-4bd1-a660-e3c64dbfb9d3"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a4e4c234-6fa9-498b-bec0-d420eae1fdcb"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("aaae6e31-7407-48fa-ade7-84efc402ba52"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("b5b7009f-1589-4b47-a353-52b261fdfd03"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("b96861b8-d76f-42b5-a622-2ce6852d50b4"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("cf43b30e-05c1-4a44-8ac6-d05d1a25c0f6"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d10c7b98-6a4e-4a66-b109-1eacd5c0b101"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d19f650b-7ed9-4264-ae33-7fa0eb61dbe3"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("eb27d68d-fae6-4fa3-87b7-5a8b928ff69e"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("f7d03dd3-c0e3-47e5-9448-602a24bfa60c"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("fea6837a-c94e-4c18-bd27-7763a1a983de"));

            migrationBuilder.DeleteData(
                table: "SystemRoles",
                keyColumn: "Id",
                keyValue: new Guid("36f3cec7-caf0-4551-9330-7f0e2c231518"));

            migrationBuilder.DeleteData(
                table: "SystemRoles",
                keyColumn: "Id",
                keyValue: new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61"));

            migrationBuilder.DeleteData(
                table: "SystemRoles",
                keyColumn: "Id",
                keyValue: new Guid("40db8cd0-2340-4f56-98f6-edbdc435d137"));

            migrationBuilder.DeleteData(
                table: "SystemRoles",
                keyColumn: "Id",
                keyValue: new Guid("74d986ef-92be-4d4b-9993-12976347b1be"));

            migrationBuilder.DeleteData(
                table: "SystemRoles",
                keyColumn: "Id",
                keyValue: new Guid("78752151-7cd4-46ee-bd6c-6b6bef16f286"));

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Code", "Description", "Is_Deleted", "Screen_Key" },
                values: new object[,]
                {
                    { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), "TPL_VIEW", "View templates", false, "templates" },
                    { new Guid("12680936-711c-fcd4-d1f5-e821a772a55f"), "PRICING_VIEW", "View pricing", false, "billing" },
                    { new Guid("23f82ce1-d8e3-e3c1-fac6-b6758625fcff"), "BILLING_MANAGE", "Manage billing", false, "billing" },
                    { new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"), "CRED_REJECT", "Reject credentials", false, "credentials" },
                    { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), "SUPPORT_VIEW", "Access support", false, "account" },
                    { new Guid("3549050b-5de8-dcbf-7553-f3b338a2727a"), "PROFILE_MANAGE", "Manage profile", false, "account" },
                    { new Guid("3f66a530-deb1-2661-f9fb-ff5826709776"), "CNV_AI", "AI design assistant", false, "designer" },
                    { new Guid("42c23a93-5722-484e-0e60-0952de6f784e"), "CRED_BULK", "Bulk issue", false, "credentials" },
                    { new Guid("4590b589-6aa0-6337-87aa-65311f390941"), "USER_VIEW", "View members", false, "people" },
                    { new Guid("4b0d924d-ca90-fdf7-e34b-f52922a9d834"), "ROLE_MANAGE", "Manage roles", false, "people" },
                    { new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"), "TPL_EDIT", "Edit in designer", false, "templates" },
                    { new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"), "TPL_CREATE", "Create templates", false, "templates" },
                    { new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"), "EDITC", "Edit canvas", false, "designer" },
                    { new Guid("8517b2c5-0e8b-7228-4533-c2fa832bb33c"), "USER_INVITE", "Invite members", false, "people" },
                    { new Guid("895874b2-6f07-d309-2af6-edce869260da"), "USER_MANAGE", "Manage members", false, "people" },
                    { new Guid("896f8d01-99b3-4821-9f41-5f47b8aef731"), "CRED_EXPORT", "Export credential list", false, "credentials" },
                    { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), "CRED_VIEW", "View credentials", false, "credentials" },
                    { new Guid("9107d1fd-d046-43aa-e226-14b02df9442a"), "SET_MANAGE", "Manage settings", false, "account" },
                    { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), "APPROVAL_VIEW", "View approvals queue", false, "approvals" },
                    { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), "ANALYTICS_VIEW", "View analytics", false, "dashboard" },
                    { new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"), "TPL_EXPORT", "Export templates", false, "templates" },
                    { new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"), "CDDCR", "Save designs", false, "designer" },
                    { new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"), "ROLE_VIEW", "View roles", false, "people" },
                    { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), "DASH_VIEW", "View dashboard", false, "dashboard" },
                    { new Guid("a686c68d-98c2-9671-ae81-5567bbf4561b"), "CRED_EDIT", "Edit credential data", false, "credentials" },
                    { new Guid("a7f01518-53ff-d614-babd-11d718ce527a"), "CRED_GEN", "Issue single", false, "credentials" },
                    { new Guid("a992e2f0-021e-e244-65dc-cd3275dfa1ce"), "USER_REMOVE", "Remove members", false, "people" },
                    { new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"), "CNV_PRINT", "Print / export design", false, "designer" },
                    { new Guid("b4836977-48ca-ab64-0204-b36b4e2f8df2"), "SIGNATURE_MANAGE", "Manage signature", false, "account" },
                    { new Guid("b9ba8465-6e59-9907-b691-7492523f8cbc"), "TPL_ARCHIVE", "Archive templates", false, "templates" },
                    { new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"), "TPL_INFO", "View template info", false, "templates" },
                    { new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"), "CRED_APPROVE", "Approve credentials", false, "credentials" },
                    { new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"), "CRED_REVOKE", "Revoke credentials", false, "credentials" },
                    { new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"), "BRAND_MANAGE", "Manage brand kit", false, "branding" },
                    { new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"), "BILLING_VIEW", "View billing", false, "billing" },
                    { new Guid("d48303fd-ac83-d66f-53a6-693bd3e58f7a"), "DELDR", "Delete on canvas", false, "designer" },
                    { new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"), "CRED_DOWNLOAD", "Download credential", false, "credentials" },
                    { new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"), "CRED_RESEND", "Resend credentials", false, "credentials" },
                    { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), "AUTO_VIEW", "View automations", false, "automation" },
                    { new Guid("ee52993b-70eb-7346-9782-a84d291112e7"), "TPL_DELETE", "Delete templates", false, "templates" },
                    { new Guid("f1dd6cb6-322e-4d98-74d0-08a6fda1ad17"), "PLAN_CHANGE", "Change plan", false, "billing" },
                    { new Guid("fad56e44-c0cd-8e14-7a45-c0cb57d51a13"), "AUTO_MANAGE", "Manage automations", false, "automation" },
                    { new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"), "EXNDM", "Open designer", false, "designer" }
                });

            migrationBuilder.InsertData(
                table: "SystemRoles",
                columns: new[] { "Id", "Description", "Is_Active", "Is_Deleted", "Role_Code", "Role_Name" },
                values: new object[,]
                {
                    { new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f"), "Design templates and issue credentials.", true, false, "EDITOR", "Editor" },
                    { new Guid("86750a8f-05cf-ac30-4191-68220352e910"), "Review, approve, reject and revoke credentials.", true, false, "APPROVER", "Approver" },
                    { new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab"), "Manage content, people and settings — except billing ownership.", true, false, "ADMIN", "Administrator" },
                    { new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32"), "Read-only access across the workspace.", true, false, "VIEWER", "Viewer" },
                    { new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea"), "Full, unrestricted access to the entire workspace.", true, false, "OWNER", "Owner" }
                });

            migrationBuilder.InsertData(
                table: "Tenants",
                columns: new[] { "Id", "ApplicantRole", "Created_Date", "Is_Active", "Is_Deleted", "Name", "OrganizationType" },
                values: new object[] { new Guid("a0000000-0000-4000-8000-000000000001"), null, new DateTime(2025, 8, 10, 15, 0, 45, 964, DateTimeKind.Utc).AddTicks(5459), true, false, "Certifada", null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("db8f1215-f67e-4e75-b940-3943bd698ea1"),
                column: "Tenant_Id",
                value: new Guid("a0000000-0000-4000-8000-000000000001"));

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Created_By", "Created_Date", "Description", "Is_Active", "Is_Deleted", "Is_System", "Name", "Role_Code", "Tenant_Id" },
                values: new object[,]
                {
                    { new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3"), new Guid("db8f1215-f67e-4e75-b940-3943bd698ea1"), new DateTime(2025, 8, 10, 15, 0, 45, 964, DateTimeKind.Utc).AddTicks(5459), "Manage content, people and settings — except billing ownership.", true, false, true, "Administrator", "ADMIN", new Guid("a0000000-0000-4000-8000-000000000001") },
                    { new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69"), new Guid("db8f1215-f67e-4e75-b940-3943bd698ea1"), new DateTime(2025, 8, 10, 15, 0, 45, 964, DateTimeKind.Utc).AddTicks(5459), "Review, approve, reject and revoke credentials.", true, false, true, "Approver", "APPROVER", new Guid("a0000000-0000-4000-8000-000000000001") },
                    { new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf"), new Guid("db8f1215-f67e-4e75-b940-3943bd698ea1"), new DateTime(2025, 8, 10, 15, 0, 45, 964, DateTimeKind.Utc).AddTicks(5459), "Read-only access across the workspace.", true, false, true, "Viewer", "VIEWER", new Guid("a0000000-0000-4000-8000-000000000001") },
                    { new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8"), new Guid("db8f1215-f67e-4e75-b940-3943bd698ea1"), new DateTime(2025, 8, 10, 15, 0, 45, 964, DateTimeKind.Utc).AddTicks(5459), "Design templates and issue credentials.", true, false, true, "Editor", "EDITOR", new Guid("a0000000-0000-4000-8000-000000000001") },
                    { new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7"), new Guid("db8f1215-f67e-4e75-b940-3943bd698ea1"), new DateTime(2025, 8, 10, 15, 0, 45, 964, DateTimeKind.Utc).AddTicks(5459), "Full, unrestricted access to the entire workspace.", true, false, true, "Owner", "OWNER", new Guid("a0000000-0000-4000-8000-000000000001") }
                });

            migrationBuilder.InsertData(
                table: "SystemRolePermissions",
                columns: new[] { "Permission_Id", "Role_Id" },
                values: new object[,]
                {
                    { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("42c23a93-5722-484e-0e60-0952de6f784e"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("a7f01518-53ff-d614-babd-11d718ce527a"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") },
                    { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") },
                    { new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") },
                    { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") },
                    { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") },
                    { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") },
                    { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") },
                    { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") },
                    { new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") },
                    { new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") },
                    { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("12680936-711c-fcd4-d1f5-e821a772a55f"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("3549050b-5de8-dcbf-7553-f3b338a2727a"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("3f66a530-deb1-2661-f9fb-ff5826709776"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("42c23a93-5722-484e-0e60-0952de6f784e"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("4590b589-6aa0-6337-87aa-65311f390941"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("4b0d924d-ca90-fdf7-e34b-f52922a9d834"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("8517b2c5-0e8b-7228-4533-c2fa832bb33c"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("895874b2-6f07-d309-2af6-edce869260da"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("896f8d01-99b3-4821-9f41-5f47b8aef731"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("9107d1fd-d046-43aa-e226-14b02df9442a"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("a686c68d-98c2-9671-ae81-5567bbf4561b"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("a7f01518-53ff-d614-babd-11d718ce527a"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("a992e2f0-021e-e244-65dc-cd3275dfa1ce"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("b4836977-48ca-ab64-0204-b36b4e2f8df2"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("b9ba8465-6e59-9907-b691-7492523f8cbc"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("d48303fd-ac83-d66f-53a6-693bd3e58f7a"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("ee52993b-70eb-7346-9782-a84d291112e7"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("fad56e44-c0cd-8e14-7a45-c0cb57d51a13"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") },
                    { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") },
                    { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") },
                    { new Guid("4590b589-6aa0-6337-87aa-65311f390941"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") },
                    { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") },
                    { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") },
                    { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") },
                    { new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") },
                    { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") },
                    { new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") },
                    { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") },
                    { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("12680936-711c-fcd4-d1f5-e821a772a55f"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("23f82ce1-d8e3-e3c1-fac6-b6758625fcff"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("3549050b-5de8-dcbf-7553-f3b338a2727a"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("3f66a530-deb1-2661-f9fb-ff5826709776"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("42c23a93-5722-484e-0e60-0952de6f784e"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("4590b589-6aa0-6337-87aa-65311f390941"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("4b0d924d-ca90-fdf7-e34b-f52922a9d834"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("8517b2c5-0e8b-7228-4533-c2fa832bb33c"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("895874b2-6f07-d309-2af6-edce869260da"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("896f8d01-99b3-4821-9f41-5f47b8aef731"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("9107d1fd-d046-43aa-e226-14b02df9442a"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("a686c68d-98c2-9671-ae81-5567bbf4561b"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("a7f01518-53ff-d614-babd-11d718ce527a"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("a992e2f0-021e-e244-65dc-cd3275dfa1ce"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("b4836977-48ca-ab64-0204-b36b4e2f8df2"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("b9ba8465-6e59-9907-b691-7492523f8cbc"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("d48303fd-ac83-d66f-53a6-693bd3e58f7a"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("ee52993b-70eb-7346-9782-a84d291112e7"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("f1dd6cb6-322e-4d98-74d0-08a6fda1ad17"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("fad56e44-c0cd-8e14-7a45-c0cb57d51a13"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") },
                    { new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") }
                });

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "Permission_Id", "Role_Id" },
                values: new object[,]
                {
                    { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("12680936-711c-fcd4-d1f5-e821a772a55f"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("3549050b-5de8-dcbf-7553-f3b338a2727a"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("3f66a530-deb1-2661-f9fb-ff5826709776"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("42c23a93-5722-484e-0e60-0952de6f784e"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("4590b589-6aa0-6337-87aa-65311f390941"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("4b0d924d-ca90-fdf7-e34b-f52922a9d834"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("8517b2c5-0e8b-7228-4533-c2fa832bb33c"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("895874b2-6f07-d309-2af6-edce869260da"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("896f8d01-99b3-4821-9f41-5f47b8aef731"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("9107d1fd-d046-43aa-e226-14b02df9442a"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("a686c68d-98c2-9671-ae81-5567bbf4561b"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("a7f01518-53ff-d614-babd-11d718ce527a"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("a992e2f0-021e-e244-65dc-cd3275dfa1ce"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("b4836977-48ca-ab64-0204-b36b4e2f8df2"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("b9ba8465-6e59-9907-b691-7492523f8cbc"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("d48303fd-ac83-d66f-53a6-693bd3e58f7a"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("ee52993b-70eb-7346-9782-a84d291112e7"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("fad56e44-c0cd-8e14-7a45-c0cb57d51a13"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") },
                    { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") },
                    { new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") },
                    { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") },
                    { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") },
                    { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") },
                    { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") },
                    { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") },
                    { new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") },
                    { new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") },
                    { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") },
                    { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") },
                    { new Guid("4590b589-6aa0-6337-87aa-65311f390941"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") },
                    { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") },
                    { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") },
                    { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") },
                    { new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") },
                    { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") },
                    { new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") },
                    { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") },
                    { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("42c23a93-5722-484e-0e60-0952de6f784e"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("a7f01518-53ff-d614-babd-11d718ce527a"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") },
                    { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("12680936-711c-fcd4-d1f5-e821a772a55f"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("23f82ce1-d8e3-e3c1-fac6-b6758625fcff"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("3549050b-5de8-dcbf-7553-f3b338a2727a"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("3f66a530-deb1-2661-f9fb-ff5826709776"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("42c23a93-5722-484e-0e60-0952de6f784e"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("4590b589-6aa0-6337-87aa-65311f390941"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("4b0d924d-ca90-fdf7-e34b-f52922a9d834"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("8517b2c5-0e8b-7228-4533-c2fa832bb33c"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("895874b2-6f07-d309-2af6-edce869260da"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("896f8d01-99b3-4821-9f41-5f47b8aef731"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("9107d1fd-d046-43aa-e226-14b02df9442a"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("a686c68d-98c2-9671-ae81-5567bbf4561b"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("a7f01518-53ff-d614-babd-11d718ce527a"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("a992e2f0-021e-e244-65dc-cd3275dfa1ce"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("b4836977-48ca-ab64-0204-b36b4e2f8df2"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("b9ba8465-6e59-9907-b691-7492523f8cbc"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("d48303fd-ac83-d66f-53a6-693bd3e58f7a"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("ee52993b-70eb-7346-9782-a84d291112e7"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("f1dd6cb6-322e-4d98-74d0-08a6fda1ad17"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("fad56e44-c0cd-8e14-7a45-c0cb57d51a13"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") },
                    { new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") }
                });

            migrationBuilder.InsertData(
                table: "UserRoles",
                columns: new[] { "User_Id", "Role_Id" },
                values: new object[] { new Guid("db8f1215-f67e-4e75-b940-3943bd698ea1"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("12680936-711c-fcd4-d1f5-e821a772a55f"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("3549050b-5de8-dcbf-7553-f3b338a2727a"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("3f66a530-deb1-2661-f9fb-ff5826709776"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("42c23a93-5722-484e-0e60-0952de6f784e"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("4590b589-6aa0-6337-87aa-65311f390941"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("4b0d924d-ca90-fdf7-e34b-f52922a9d834"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("8517b2c5-0e8b-7228-4533-c2fa832bb33c"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("895874b2-6f07-d309-2af6-edce869260da"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("896f8d01-99b3-4821-9f41-5f47b8aef731"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9107d1fd-d046-43aa-e226-14b02df9442a"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a686c68d-98c2-9671-ae81-5567bbf4561b"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a7f01518-53ff-d614-babd-11d718ce527a"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a992e2f0-021e-e244-65dc-cd3275dfa1ce"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("b4836977-48ca-ab64-0204-b36b4e2f8df2"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("b9ba8465-6e59-9907-b691-7492523f8cbc"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d48303fd-ac83-d66f-53a6-693bd3e58f7a"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("ee52993b-70eb-7346-9782-a84d291112e7"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("fad56e44-c0cd-8e14-7a45-c0cb57d51a13"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"), new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"), new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("4590b589-6aa0-6337-87aa-65311f390941"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("42c23a93-5722-484e-0e60-0952de6f784e"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a7f01518-53ff-d614-babd-11d718ce527a"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"), new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("12680936-711c-fcd4-d1f5-e821a772a55f"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("23f82ce1-d8e3-e3c1-fac6-b6758625fcff"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("3549050b-5de8-dcbf-7553-f3b338a2727a"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("3f66a530-deb1-2661-f9fb-ff5826709776"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("42c23a93-5722-484e-0e60-0952de6f784e"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("4590b589-6aa0-6337-87aa-65311f390941"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("4b0d924d-ca90-fdf7-e34b-f52922a9d834"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("8517b2c5-0e8b-7228-4533-c2fa832bb33c"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("895874b2-6f07-d309-2af6-edce869260da"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("896f8d01-99b3-4821-9f41-5f47b8aef731"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9107d1fd-d046-43aa-e226-14b02df9442a"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a686c68d-98c2-9671-ae81-5567bbf4561b"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a7f01518-53ff-d614-babd-11d718ce527a"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a992e2f0-021e-e244-65dc-cd3275dfa1ce"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("b4836977-48ca-ab64-0204-b36b4e2f8df2"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("b9ba8465-6e59-9907-b691-7492523f8cbc"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d48303fd-ac83-d66f-53a6-693bd3e58f7a"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("ee52993b-70eb-7346-9782-a84d291112e7"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("f1dd6cb6-322e-4d98-74d0-08a6fda1ad17"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("fad56e44-c0cd-8e14-7a45-c0cb57d51a13"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"), new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("42c23a93-5722-484e-0e60-0952de6f784e"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a7f01518-53ff-d614-babd-11d718ce527a"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"), new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"), new Guid("86750a8f-05cf-ac30-4191-68220352e910") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("12680936-711c-fcd4-d1f5-e821a772a55f"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("3549050b-5de8-dcbf-7553-f3b338a2727a"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("3f66a530-deb1-2661-f9fb-ff5826709776"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("42c23a93-5722-484e-0e60-0952de6f784e"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("4590b589-6aa0-6337-87aa-65311f390941"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("4b0d924d-ca90-fdf7-e34b-f52922a9d834"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("8517b2c5-0e8b-7228-4533-c2fa832bb33c"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("895874b2-6f07-d309-2af6-edce869260da"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("896f8d01-99b3-4821-9f41-5f47b8aef731"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9107d1fd-d046-43aa-e226-14b02df9442a"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a686c68d-98c2-9671-ae81-5567bbf4561b"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a7f01518-53ff-d614-babd-11d718ce527a"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a992e2f0-021e-e244-65dc-cd3275dfa1ce"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("b4836977-48ca-ab64-0204-b36b4e2f8df2"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("b9ba8465-6e59-9907-b691-7492523f8cbc"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d48303fd-ac83-d66f-53a6-693bd3e58f7a"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("ee52993b-70eb-7346-9782-a84d291112e7"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("fad56e44-c0cd-8e14-7a45-c0cb57d51a13"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"), new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("4590b589-6aa0-6337-87aa-65311f390941"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("12680936-711c-fcd4-d1f5-e821a772a55f"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("23f82ce1-d8e3-e3c1-fac6-b6758625fcff"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("3549050b-5de8-dcbf-7553-f3b338a2727a"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("3f66a530-deb1-2661-f9fb-ff5826709776"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("42c23a93-5722-484e-0e60-0952de6f784e"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("4590b589-6aa0-6337-87aa-65311f390941"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("4b0d924d-ca90-fdf7-e34b-f52922a9d834"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("8517b2c5-0e8b-7228-4533-c2fa832bb33c"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("895874b2-6f07-d309-2af6-edce869260da"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("896f8d01-99b3-4821-9f41-5f47b8aef731"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9107d1fd-d046-43aa-e226-14b02df9442a"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a2f4566d-549d-0707-cef9-923a235921ce"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a686c68d-98c2-9671-ae81-5567bbf4561b"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a7f01518-53ff-d614-babd-11d718ce527a"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("a992e2f0-021e-e244-65dc-cd3275dfa1ce"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("b4836977-48ca-ab64-0204-b36b4e2f8df2"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("b9ba8465-6e59-9907-b691-7492523f8cbc"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d48303fd-ac83-d66f-53a6-693bd3e58f7a"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("ee52993b-70eb-7346-9782-a84d291112e7"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("f1dd6cb6-322e-4d98-74d0-08a6fda1ad17"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("fad56e44-c0cd-8e14-7a45-c0cb57d51a13"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "SystemRolePermissions",
                keyColumns: new[] { "Permission_Id", "Role_Id" },
                keyValues: new object[] { new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"), new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea") });

            migrationBuilder.DeleteData(
                table: "UserRoles",
                keyColumn: "User_Id",
                keyValue: new Guid("db8f1215-f67e-4e75-b940-3943bd698ea1"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("12680936-711c-fcd4-d1f5-e821a772a55f"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("23f82ce1-d8e3-e3c1-fac6-b6758625fcff"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("3549050b-5de8-dcbf-7553-f3b338a2727a"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("3f66a530-deb1-2661-f9fb-ff5826709776"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("42c23a93-5722-484e-0e60-0952de6f784e"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("4590b589-6aa0-6337-87aa-65311f390941"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("4b0d924d-ca90-fdf7-e34b-f52922a9d834"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("8517b2c5-0e8b-7228-4533-c2fa832bb33c"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("895874b2-6f07-d309-2af6-edce869260da"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("896f8d01-99b3-4821-9f41-5f47b8aef731"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9107d1fd-d046-43aa-e226-14b02df9442a"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a2f4566d-549d-0707-cef9-923a235921ce"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a686c68d-98c2-9671-ae81-5567bbf4561b"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a7f01518-53ff-d614-babd-11d718ce527a"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a992e2f0-021e-e244-65dc-cd3275dfa1ce"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("b4836977-48ca-ab64-0204-b36b4e2f8df2"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("b9ba8465-6e59-9907-b691-7492523f8cbc"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d48303fd-ac83-d66f-53a6-693bd3e58f7a"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("ee52993b-70eb-7346-9782-a84d291112e7"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("f1dd6cb6-322e-4d98-74d0-08a6fda1ad17"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("fad56e44-c0cd-8e14-7a45-c0cb57d51a13"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("0e4a582f-39a2-17c1-ffe2-2b6e11e4abf3"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("16c1e29a-0dcc-0da2-4f4e-5b04d0aeff69"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("2ae9025b-1551-4b13-384a-ce4c7da43fdf"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("c4cd4082-5145-dcd6-3fd0-674d524cf7e8"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("dbe6abb7-431a-fe25-253d-25271ec9a9b7"));

            migrationBuilder.DeleteData(
                table: "SystemRoles",
                keyColumn: "Id",
                keyValue: new Guid("183aa0d7-1ea7-a7bd-e86d-60e88f7e178f"));

            migrationBuilder.DeleteData(
                table: "SystemRoles",
                keyColumn: "Id",
                keyValue: new Guid("86750a8f-05cf-ac30-4191-68220352e910"));

            migrationBuilder.DeleteData(
                table: "SystemRoles",
                keyColumn: "Id",
                keyValue: new Guid("98e745d1-b5a1-64cb-5815-b4a1d14ad9ab"));

            migrationBuilder.DeleteData(
                table: "SystemRoles",
                keyColumn: "Id",
                keyValue: new Guid("ab69d5ee-1376-487b-432e-4b5c962b0f32"));

            migrationBuilder.DeleteData(
                table: "SystemRoles",
                keyColumn: "Id",
                keyValue: new Guid("d218a58a-300f-1cc0-7498-62cbbd1b6aea"));

            migrationBuilder.DeleteData(
                table: "Tenants",
                keyColumn: "Id",
                keyValue: new Guid("a0000000-0000-4000-8000-000000000001"));

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Code", "Description", "Is_Deleted", "Screen_Key" },
                values: new object[,]
                {
                    { new Guid("0f82d59e-181a-4d4d-b41e-5e2b5b48b30d"), "Z0A5N", "View Users", false, "Users.View" },
                    { new Guid("21b8d3dc-f9ff-438c-b83f-c4dceff8f505"), "L9S4V", "Edit Users", false, "Users.Edit" },
                    { new Guid("2f3c63f9-82e7-4d82-9aa3-c1a8ea231cfd"), "D2M3Y", "View Roles", false, "Roles.View" },
                    { new Guid("3f2a2168-7db7-40ec-92c5-7f2b5ae84335"), "Q5R7P", "Add Credentials", false, "Credentials.Add" },
                    { new Guid("45314e9d-ec9e-4c3e-9836-7850215b2f98"), "K6E3T", "Add Users", false, "Users.Add" },
                    { new Guid("6ae47f88-367d-414b-9fa7-6cfd8b58c413"), "B2V4W", "Edit Templates", false, "Templates.Edit" },
                    { new Guid("7094382f-6c85-4fe1-a5a3-e1efde39db71"), "T5L7X", "View Automation", false, "Automation.View" },
                    { new Guid("7c6c76a7-b5f5-4b02-9f37-d76a3ac347f3"), "J1H6R", "Add Roles", false, "Roles.Add" },
                    { new Guid("86e3cf96-4cb9-4b7e-a2cd-1cb136e113dd"), "F2J6W", "View Certificate", false, "Certificate.View" },
                    { new Guid("91c2ed65-54b6-4bd1-a660-e3c64dbfb9d3"), "G7N2K", "View Reports", false, "Reports.View" },
                    { new Guid("a4e4c234-6fa9-498b-bec0-d420eae1fdcb"), "U3C9A", "Edit Roles", false, "Roles.Edit" },
                    { new Guid("aaae6e31-7407-48fa-ade7-84efc402ba52"), "N9T6D", "View Credentials", false, "Credentials.View" },
                    { new Guid("b5b7009f-1589-4b47-a353-52b261fdfd03"), "P8B7F", "Delete Users", false, "Users.Delete" },
                    { new Guid("b96861b8-d76f-42b5-a622-2ce6852d50b4"), "V3D8L", "Sign Certificate", false, "Certificate.Sign" },
                    { new Guid("cf43b30e-05c1-4a44-8ac6-d05d1a25c0f6"), "S4Z8E", "View Email Settings", false, "EmailSettings.View" },
                    { new Guid("d10c7b98-6a4e-4a66-b109-1eacd5c0b101"), "A7G9Q", "View Templates", false, "Templates.View" },
                    { new Guid("d19f650b-7ed9-4264-ae33-7fa0eb61dbe3"), "Y3X8C", "View Branding", false, "Branding.View" },
                    { new Guid("eb27d68d-fae6-4fa3-87b7-5a8b928ff69e"), "X8F2L", "Create Templates", false, "Templates.Create" },
                    { new Guid("f7d03dd3-c0e3-47e5-9448-602a24bfa60c"), "M4K1Z", "Delete Templates", false, "Templates.Delete" },
                    { new Guid("fea6837a-c94e-4c18-bd27-7763a1a983de"), "W1U2J", "Add Branding", false, "Branding.Add" }
                });

            migrationBuilder.InsertData(
                table: "SystemRoles",
                columns: new[] { "Id", "Description", "Is_Active", "Is_Deleted", "Role_Code", "Role_Name" },
                values: new object[,]
                {
                    { new Guid("36f3cec7-caf0-4551-9330-7f0e2c231518"), "Read-only access", true, false, "VIEWER", "Viewer" },
                    { new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), "Full access to all tenant features", true, false, "ADMIN", "Administrator" },
                    { new Guid("40db8cd0-2340-4f56-98f6-edbdc435d137"), "Can create and edit certificate templates", true, false, "DESIGNER", "Designer" },
                    { new Guid("74d986ef-92be-4d4b-9993-12976347b1be"), "Can approve/reject requests and workflows", true, false, "APPROVER", "Approver" },
                    { new Guid("78752151-7cd4-46ee-bd6c-6b6bef16f286"), "Can issue/generate credentials", true, false, "ISSUER", "Issuer" }
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("db8f1215-f67e-4e75-b940-3943bd698ea1"),
                column: "Tenant_Id",
                value: null);

            migrationBuilder.InsertData(
                table: "SystemRolePermissions",
                columns: new[] { "Permission_Id", "Role_Id" },
                values: new object[,]
                {
                    { new Guid("86e3cf96-4cb9-4b7e-a2cd-1cb136e113dd"), new Guid("36f3cec7-caf0-4551-9330-7f0e2c231518") },
                    { new Guid("aaae6e31-7407-48fa-ade7-84efc402ba52"), new Guid("36f3cec7-caf0-4551-9330-7f0e2c231518") },
                    { new Guid("0f82d59e-181a-4d4d-b41e-5e2b5b48b30d"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("21b8d3dc-f9ff-438c-b83f-c4dceff8f505"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("2f3c63f9-82e7-4d82-9aa3-c1a8ea231cfd"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("3f2a2168-7db7-40ec-92c5-7f2b5ae84335"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("45314e9d-ec9e-4c3e-9836-7850215b2f98"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("6ae47f88-367d-414b-9fa7-6cfd8b58c413"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("7094382f-6c85-4fe1-a5a3-e1efde39db71"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("7c6c76a7-b5f5-4b02-9f37-d76a3ac347f3"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("86e3cf96-4cb9-4b7e-a2cd-1cb136e113dd"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("91c2ed65-54b6-4bd1-a660-e3c64dbfb9d3"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("a4e4c234-6fa9-498b-bec0-d420eae1fdcb"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("aaae6e31-7407-48fa-ade7-84efc402ba52"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("b5b7009f-1589-4b47-a353-52b261fdfd03"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("b96861b8-d76f-42b5-a622-2ce6852d50b4"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("cf43b30e-05c1-4a44-8ac6-d05d1a25c0f6"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("d10c7b98-6a4e-4a66-b109-1eacd5c0b101"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("d19f650b-7ed9-4264-ae33-7fa0eb61dbe3"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("eb27d68d-fae6-4fa3-87b7-5a8b928ff69e"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("f7d03dd3-c0e3-47e5-9448-602a24bfa60c"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("fea6837a-c94e-4c18-bd27-7763a1a983de"), new Guid("3ae08c10-fdd6-46bf-b513-535e09c5aa61") },
                    { new Guid("6ae47f88-367d-414b-9fa7-6cfd8b58c413"), new Guid("40db8cd0-2340-4f56-98f6-edbdc435d137") },
                    { new Guid("d10c7b98-6a4e-4a66-b109-1eacd5c0b101"), new Guid("40db8cd0-2340-4f56-98f6-edbdc435d137") },
                    { new Guid("eb27d68d-fae6-4fa3-87b7-5a8b928ff69e"), new Guid("40db8cd0-2340-4f56-98f6-edbdc435d137") },
                    { new Guid("f7d03dd3-c0e3-47e5-9448-602a24bfa60c"), new Guid("40db8cd0-2340-4f56-98f6-edbdc435d137") },
                    { new Guid("86e3cf96-4cb9-4b7e-a2cd-1cb136e113dd"), new Guid("74d986ef-92be-4d4b-9993-12976347b1be") },
                    { new Guid("b96861b8-d76f-42b5-a622-2ce6852d50b4"), new Guid("74d986ef-92be-4d4b-9993-12976347b1be") },
                    { new Guid("3f2a2168-7db7-40ec-92c5-7f2b5ae84335"), new Guid("78752151-7cd4-46ee-bd6c-6b6bef16f286") },
                    { new Guid("aaae6e31-7407-48fa-ade7-84efc402ba52"), new Guid("78752151-7cd4-46ee-bd6c-6b6bef16f286") }
                });
        }
    }
}

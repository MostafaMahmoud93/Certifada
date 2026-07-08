using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Certifada.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class init5 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Short_Description",
                table: "Permissions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Browse the template library and open any template for preview. This is the baseline access every other template action builds on.", "Browse & preview the library" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("12680936-711c-fcd4-d1f5-e821a772a55f"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Open the pricing page and compare the available plans.", "Compare available plans" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("23f82ce1-d8e3-e3c1-fac6-b6758625fcff"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Update the payment method and manage the subscription in the billing portal. Sensitive — financial control.", "Payment method & subscription" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Reject credentials awaiting approval and send them back with a reason. Sensitive.", "Send back with a reason" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Open the support and help resources.", "Open help & support" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("3549050b-5de8-dcbf-7553-f3b338a2727a"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Edit personal profile details, avatar and preferences.", "Profile, avatar & preferences" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("3f66a530-deb1-2661-f9fb-ff5826709776"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Use the AI tools to generate layouts, suggest content and refine designs automatically. A premium capability.", "Generate & refine with AI" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("42c23a93-5722-484e-0e60-0952de6f784e"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Generate many certificates in one run from a data file such as CSV or Excel. Includes single issuing and viewing.", "Generate many from a data file" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("4590b589-6aa0-6337-87aa-65311f390941"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "See the list of workspace members with the role assigned to each. Baseline for managing people.", "See members & their roles" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("4b0d924d-ca90-fdf7-e34b-f52922a9d834"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Create, edit, clone and delete roles and change which permissions they grant. Highly sensitive — it defines everyone's access.", "Create, edit & delete roles" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Open a template in the design studio and change its layout, text, images, colours and data fields. Also unlocks opening the designer canvas.", "Change layout, text & fields" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Start brand-new templates from scratch or from a preset and add them to the workspace library. Automatically includes viewing templates.", "Add brand-new templates" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Add, move, resize and restyle elements on the canvas — text, shapes, images, seals and data fields.", "Add, move & restyle elements" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("8517b2c5-0e8b-7228-4533-c2fa832bb33c"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Send seat invitations to bring new members into the workspace.", "Send seat invitations" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("895874b2-6f07-d309-2af6-edce869260da"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Change a member's role, suspend or reactivate accounts. Sensitive — it changes what others can access.", "Change roles, suspend accounts" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("896f8d01-99b3-4821-9f41-5f47b8aef731"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Export the credentials list and its details to CSV or Excel for auditing or reporting.", "Export the list to CSV/Excel" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Browse issued certificates and open each recipient's details, delivery status and history. Baseline for all credential actions.", "Browse issued certificates" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9107d1fd-d046-43aa-e226-14b02df9442a"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Change workspace-wide settings, integrations and security options. Sensitive — affects the whole organisation.", "Workspace settings & security" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Open the approvals queue to review credentials and batches waiting for a decision. Needed before anyone can approve or reject.", "Review the pending queue" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Access analytics and reporting: issuance trends, verification/traffic charts and per-credential view counts. Read-only insight into how credentials are performing.", "Issuance & verification reports" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Download templates as PDF, PNG or JSON, or share the template definition outside Certifada.", "Download as PDF, PNG or JSON" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Persist changes made on the canvas back to the template. Includes opening and editing the canvas.", "Persist canvas changes" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "See all roles and exactly which permissions each one grants.", "See roles & their permissions" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a2f4566d-549d-0707-cef9-923a235921ce"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Open the home dashboard and see workspace KPIs, recent activity and the pending-approvals queue. This is the landing screen after signing in — without it the user starts on another allowed page.", "See KPIs, activity & pending approvals" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a686c68d-98c2-9671-ae81-5567bbf4561b"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Correct the recipient data (name, fields) on an already-issued credential and re-render it.", "Correct & re-render recipient data" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a7f01518-53ff-d614-babd-11d718ce527a"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Issue one certificate at a time by choosing a template and entering a recipient. Includes viewing credentials.", "Issue one certificate at a time" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a992e2f0-021e-e244-65dc-cd3275dfa1ce"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Remove members from the workspace and free their seat. Sensitive.", "Remove members & free seats" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Print the current design or export it as a file directly from the studio.", "Print or export from the studio" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("b4836977-48ca-ab64-0204-b36b4e2f8df2"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Create and manage the approver signature used when signing off credentials.", "Manage the approver signature" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("b9ba8465-6e59-9907-b691-7492523f8cbc"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Archive templates to hide them from the active list, or restore archived ones — without deleting any data.", "Hide or restore templates" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "See a template's metadata, usage statistics and change history.", "Metadata, usage & history" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Approve credentials that are waiting in the queue so they can be sent to recipients. Sensitive — controls what actually goes out.", "Release queued credentials" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Invalidate a certificate that was already issued so it no longer verifies. Sensitive and not reversible for the recipient.", "Invalidate an issued certificate" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Set the organisation's logo, colour palette, fonts and default signature that are applied across all templates and emails.", "Logo, colours, fonts & signature" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "See the current plan, usage against limits and payment history. Read-only.", "Plan, usage & payment history" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d48303fd-ac83-d66f-53a6-693bd3e58f7a"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Remove individual elements or clear parts of a design on the canvas.", "Remove elements from a design" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Download an individual certificate as a file (PDF/PNG).", "Download a certificate file" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Re-send a credential email to its recipient, for example if the original was missed.", "Re-send the credential email" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "See automated workflows and their recent run history.", "See workflows & run history" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("ee52993b-70eb-7346-9782-a84d291112e7"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Permanently remove templates from the workspace. Deleted templates cannot be recovered, so this is treated as a sensitive action.", "Permanently remove templates" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("f1dd6cb6-322e-4d98-74d0-08a6fda1ad17"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Upgrade or downgrade the subscription plan, which changes limits and what the whole workspace is billed. Sensitive.", "Upgrade or downgrade the plan" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("fad56e44-c0cd-8e14-7a45-c0cb57d51a13"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Create, edit, enable or disable workflows that automatically issue or route credentials.", "Create, edit & toggle workflows" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"),
                columns: new[] { "Description", "Short_Description" },
                values: new object[] { "Open the certificate design canvas to view a design. Prerequisite for every other design-studio action.", "View a design on the canvas" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Short_Description",
                table: "Permissions");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("12361f06-415a-5b72-e472-a4f4e4e9738f"),
                column: "Description",
                value: "View templates");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("12680936-711c-fcd4-d1f5-e821a772a55f"),
                column: "Description",
                value: "View pricing");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("23f82ce1-d8e3-e3c1-fac6-b6758625fcff"),
                column: "Description",
                value: "Manage billing");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("2f13e7e8-b284-a8b8-db48-3eb8438c1e46"),
                column: "Description",
                value: "Reject credentials");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("2fdeb824-4ac9-bd37-3175-d724040f7535"),
                column: "Description",
                value: "Access support");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("3549050b-5de8-dcbf-7553-f3b338a2727a"),
                column: "Description",
                value: "Manage profile");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("3f66a530-deb1-2661-f9fb-ff5826709776"),
                column: "Description",
                value: "AI design assistant");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("42c23a93-5722-484e-0e60-0952de6f784e"),
                column: "Description",
                value: "Bulk issue");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("4590b589-6aa0-6337-87aa-65311f390941"),
                column: "Description",
                value: "View members");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("4b0d924d-ca90-fdf7-e34b-f52922a9d834"),
                column: "Description",
                value: "Manage roles");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("5258862e-a0dc-180a-36f6-5a3b6d007e32"),
                column: "Description",
                value: "Edit in designer");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("641d0e75-ba37-f507-ff71-1f1d07ece128"),
                column: "Description",
                value: "Create templates");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("807c6e79-dc30-d1ca-38e1-1871cdbea05e"),
                column: "Description",
                value: "Edit canvas");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("8517b2c5-0e8b-7228-4533-c2fa832bb33c"),
                column: "Description",
                value: "Invite members");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("895874b2-6f07-d309-2af6-edce869260da"),
                column: "Description",
                value: "Manage members");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("896f8d01-99b3-4821-9f41-5f47b8aef731"),
                column: "Description",
                value: "Export credential list");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("89c286d1-4b01-438d-a997-c49691b54e1d"),
                column: "Description",
                value: "View credentials");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9107d1fd-d046-43aa-e226-14b02df9442a"),
                column: "Description",
                value: "Manage settings");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("96c6fa47-6b98-85a3-19de-5c3e60d6e581"),
                column: "Description",
                value: "View approvals queue");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9a50d1b1-c97b-4c02-25a0-058bd6c7d1ff"),
                column: "Description",
                value: "View analytics");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9e63967c-f6be-47ac-0816-9dba73309d49"),
                column: "Description",
                value: "Export templates");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9f2b9998-18c9-2bf3-088e-ba2ae9c105a8"),
                column: "Description",
                value: "Save designs");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9f752df6-1f0c-5d66-fa22-13be688611e4"),
                column: "Description",
                value: "View roles");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a2f4566d-549d-0707-cef9-923a235921ce"),
                column: "Description",
                value: "View dashboard");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a686c68d-98c2-9671-ae81-5567bbf4561b"),
                column: "Description",
                value: "Edit credential data");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a7f01518-53ff-d614-babd-11d718ce527a"),
                column: "Description",
                value: "Issue single");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a992e2f0-021e-e244-65dc-cd3275dfa1ce"),
                column: "Description",
                value: "Remove members");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("adbf9a0b-a981-1a58-d533-ad32c43f7803"),
                column: "Description",
                value: "Print / export design");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("b4836977-48ca-ab64-0204-b36b4e2f8df2"),
                column: "Description",
                value: "Manage signature");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("b9ba8465-6e59-9907-b691-7492523f8cbc"),
                column: "Description",
                value: "Archive templates");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("c258618f-88f9-3ae0-acb2-2ebdbd6c0aa4"),
                column: "Description",
                value: "View template info");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("c6494e86-0b24-d70f-5e1c-edfe4fa94e4b"),
                column: "Description",
                value: "Approve credentials");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("c87c76b5-e02f-78f3-d68b-bedf20e6605a"),
                column: "Description",
                value: "Revoke credentials");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d113a83e-acd7-546a-948f-30fa1aff88e6"),
                column: "Description",
                value: "Manage brand kit");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d2d41c59-620b-3ed6-5ebd-de94f6b73bcb"),
                column: "Description",
                value: "View billing");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d48303fd-ac83-d66f-53a6-693bd3e58f7a"),
                column: "Description",
                value: "Delete on canvas");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d6569e2b-bc12-7452-e69d-fa0f1034beb2"),
                column: "Description",
                value: "Download credential");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("d9473255-5a3e-dc54-acd5-d130d5f1d4e3"),
                column: "Description",
                value: "Resend credentials");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("e395db76-f9c6-ea3f-9054-f65d4776a4bc"),
                column: "Description",
                value: "View automations");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("ee52993b-70eb-7346-9782-a84d291112e7"),
                column: "Description",
                value: "Delete templates");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("f1dd6cb6-322e-4d98-74d0-08a6fda1ad17"),
                column: "Description",
                value: "Change plan");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("fad56e44-c0cd-8e14-7a45-c0cb57d51a13"),
                column: "Description",
                value: "Manage automations");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("fb01640e-51b6-57c4-39e0-469e8327c1e8"),
                column: "Description",
                value: "Open designer");
        }
    }
}

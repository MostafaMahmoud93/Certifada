using Certifada.Domain.Entities.Payment;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace Certifada.Infrastructure.Configuration.SeedInitialData
{
    public class SeedInitialData
    {
        public static void InitialData(ModelBuilder builder)
        {
            // Define the first user data
            var userId = Guid.Parse("DB8F1215-F67E-4E75-B940-3943BD698EA1");
            var createdAt = new DateTime(2025, 8, 10, 15, 0, 45, 964, DateTimeKind.Utc).AddTicks(5459);
            const string seedHash = "AQAAAAIAAYagAAAAEGXpFYVKRy1CS1wTa4v2zHvK2DAwSRj6zGJuY6YEu2UMbe0CMZOHs5I/XjU8zDUmVA=="; // new PasswordHasher<User>().HashPassword(null, "P@55w0rd")
            var firstUser = new User
            {
                Id = userId,
                Email = "must345@yahoo.com",
                Password_Hash = seedHash,
                Full_Name = "Mostafa Mahmoud",
                Is_Active = true,
                Create_Date = createdAt,
                Is_Deleted = false
            };
            // Add the first user to Users
            builder.Entity<User>().HasData(firstUser);
            builder.Entity<SystemRole>().HasData(
                new SystemRole
                {
                    Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"),
                    Role_Name = "Administrator",
                    Description = "Full access to all tenant features",
                    Role_Code = "ADMIN",
                    Is_Active = true,
                    Is_Deleted = false
                },
                new SystemRole
                {
                    Id = Guid.Parse("40db8cd0-2340-4f56-98f6-edbdc435d137"),
                    Role_Name = "Designer",
                    Description = "Can create and edit certificate templates",
                    Role_Code = "DESIGNER",
                    Is_Active = true,
                    Is_Deleted = false
                },
                new SystemRole
                {
                    Id = Guid.Parse("78752151-7cd4-46ee-bd6c-6b6bef16f286"),
                    Role_Name = "Issuer",
                    Description = "Can issue/generate credentials",
                    Role_Code = "ISSUER",
                    Is_Active = true,
                    Is_Deleted = false
                },
                new SystemRole
                {
                    Id = Guid.Parse("36f3cec7-caf0-4551-9330-7f0e2c231518"),
                    Role_Name = "Viewer",
                    Description = "Read-only access",
                    Role_Code = "VIEWER",
                    Is_Active = true,
                    Is_Deleted = false
                },
                new SystemRole
                {
                    Id = Guid.Parse("74d986ef-92be-4d4b-9993-12976347b1be"),
                    Role_Name = "Approver",
                    Description = "Can approve/reject requests and workflows",
                    Role_Code = "APPROVER",
                    Is_Active = true,
                    Is_Deleted = false
                }
            );
            var permissions = new List<Permission>
            {
                // Templates
                new Permission { Id = Guid.Parse("d10c7b98-6a4e-4a66-b109-1eacd5c0b101"), Screen_Key = "Templates.View", Code = "A7G9Q", Description = "View Templates", Is_Deleted = false },
                new Permission { Id = Guid.Parse("eb27d68d-fae6-4fa3-87b7-5a8b928ff69e"), Screen_Key = "Templates.Create", Code = "X8F2L", Description = "Create Templates", Is_Deleted = false },
                new Permission { Id = Guid.Parse("6ae47f88-367d-414b-9fa7-6cfd8b58c413"), Screen_Key = "Templates.Edit", Code = "B2V4W", Description = "Edit Templates", Is_Deleted = false },
                new Permission { Id = Guid.Parse("f7d03dd3-c0e3-47e5-9448-602a24bfa60c"), Screen_Key = "Templates.Delete", Code = "M4K1Z", Description = "Delete Templates", Is_Deleted = false },

                // Credentials
                new Permission { Id = Guid.Parse("aaae6e31-7407-48fa-ade7-84efc402ba52"), Screen_Key = "Credentials.View", Code = "N9T6D", Description = "View Credentials", Is_Deleted = false },
                new Permission { Id = Guid.Parse("3f2a2168-7db7-40ec-92c5-7f2b5ae84335"), Screen_Key = "Credentials.Add", Code = "Q5R7P", Description = "Add Credentials", Is_Deleted = false },
                
                // Certificate
                new Permission { Id = Guid.Parse("86e3cf96-4cb9-4b7e-a2cd-1cb136e113dd"), Screen_Key = "Certificate.View", Code = "F2J6W", Description = "View Certificate", Is_Deleted = false },
                new Permission { Id = Guid.Parse("b96861b8-d76f-42b5-a622-2ce6852d50b4"), Screen_Key = "Certificate.Sign", Code = "V3D8L", Description = "Sign Certificate", Is_Deleted = false },

                // Branding
                new Permission { Id = Guid.Parse("d19f650b-7ed9-4264-ae33-7fa0eb61dbe3"), Screen_Key = "Branding.View", Code = "Y3X8C", Description = "View Branding", Is_Deleted = false },
                new Permission { Id = Guid.Parse("fea6837a-c94e-4c18-bd27-7763a1a983de"), Screen_Key = "Branding.Add", Code = "W1U2J", Description = "Add Branding", Is_Deleted = false },

                // Users
                new Permission { Id = Guid.Parse("0f82d59e-181a-4d4d-b41e-5e2b5b48b30d"), Screen_Key = "Users.View", Code = "Z0A5N", Description = "View Users", Is_Deleted = false },
                new Permission { Id = Guid.Parse("45314e9d-ec9e-4c3e-9836-7850215b2f98"), Screen_Key = "Users.Add", Code = "K6E3T", Description = "Add Users", Is_Deleted = false },
                new Permission { Id = Guid.Parse("21b8d3dc-f9ff-438c-b83f-c4dceff8f505"), Screen_Key = "Users.Edit", Code = "L9S4V", Description = "Edit Users", Is_Deleted = false },
                new Permission { Id = Guid.Parse("b5b7009f-1589-4b47-a353-52b261fdfd03"), Screen_Key = "Users.Delete", Code = "P8B7F", Description = "Delete Users", Is_Deleted = false },

                // Roles
                new Permission { Id = Guid.Parse("2f3c63f9-82e7-4d82-9aa3-c1a8ea231cfd"), Screen_Key = "Roles.View", Code = "D2M3Y", Description = "View Roles", Is_Deleted = false },
                new Permission { Id = Guid.Parse("7c6c76a7-b5f5-4b02-9f37-d76a3ac347f3"), Screen_Key = "Roles.Add", Code = "J1H6R", Description = "Add Roles", Is_Deleted = false },
                new Permission { Id = Guid.Parse("a4e4c234-6fa9-498b-bec0-d420eae1fdcb"), Screen_Key = "Roles.Edit", Code = "U3C9A", Description = "Edit Roles", Is_Deleted = false },

                // Automation
                new Permission { Id = Guid.Parse("7094382f-6c85-4fe1-a5a3-e1efde39db71"), Screen_Key = "Automation.View", Code = "T5L7X", Description = "View Automation", Is_Deleted = false },

                // Email Settings
                new Permission { Id = Guid.Parse("cf43b30e-05c1-4a44-8ac6-d05d1a25c0f6"), Screen_Key = "EmailSettings.View", Code = "S4Z8E", Description = "View Email Settings", Is_Deleted = false },

                // Reports
                new Permission { Id = Guid.Parse("91c2ed65-54b6-4bd1-a660-e3c64dbfb9d3"), Screen_Key = "Reports.View", Code = "G7N2K", Description = "View Reports", Is_Deleted = false }
            };
            builder.Entity<Permission>().HasData(permissions);
            var systemRolePermissions = new List<SystemRolePermission>
            {
                // ADMINISTRATOR (All Permissions)
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("d10c7b98-6a4e-4a66-b109-1eacd5c0b101") }, // Templates.View
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("eb27d68d-fae6-4fa3-87b7-5a8b928ff69e") }, // Templates.Create
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("6ae47f88-367d-414b-9fa7-6cfd8b58c413") }, // Templates.Edit
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("f7d03dd3-c0e3-47e5-9448-602a24bfa60c") }, // Templates.Delete

                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("aaae6e31-7407-48fa-ade7-84efc402ba52") }, // Credentials.View
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("3f2a2168-7db7-40ec-92c5-7f2b5ae84335") }, // Credentials.Add

                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("d19f650b-7ed9-4264-ae33-7fa0eb61dbe3") }, // Branding.View
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("fea6837a-c94e-4c18-bd27-7763a1a983de") }, // Branding.Add

                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("0f82d59e-181a-4d4d-b41e-5e2b5b48b30d") }, // Users.View
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("45314e9d-ec9e-4c3e-9836-7850215b2f98") }, // Users.Add
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("21b8d3dc-f9ff-438c-b83f-c4dceff8f505") }, // Users.Edit
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("b5b7009f-1589-4b47-a353-52b261fdfd03") }, // Users.Delete

                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("2f3c63f9-82e7-4d82-9aa3-c1a8ea231cfd") }, // Roles.View
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("7c6c76a7-b5f5-4b02-9f37-d76a3ac347f3") }, // Roles.Add
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("a4e4c234-6fa9-498b-bec0-d420eae1fdcb") }, // Roles.Edit

                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("7094382f-6c85-4fe1-a5a3-e1efde39db71") }, // Automation.View
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("cf43b30e-05c1-4a44-8ac6-d05d1a25c0f6") }, // EmailSettings.View
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("91c2ed65-54b6-4bd1-a660-e3c64dbfb9d3") }, // Reports.View
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("86e3cf96-4cb9-4b7e-a2cd-1cb136e113dd") }, // Certificate.View
                new SystemRolePermission { Role_Id = Guid.Parse("3ae08c10-fdd6-46bf-b513-535e09c5aa61"), Permission_Id = Guid.Parse("b96861b8-d76f-42b5-a622-2ce6852d50b4") }, // Certificate.Sign

                // DESIGNER
                new SystemRolePermission { Role_Id = Guid.Parse("40db8cd0-2340-4f56-98f6-edbdc435d137"), Permission_Id = Guid.Parse("d10c7b98-6a4e-4a66-b109-1eacd5c0b101") }, // Templates.View
                new SystemRolePermission { Role_Id = Guid.Parse("40db8cd0-2340-4f56-98f6-edbdc435d137"), Permission_Id = Guid.Parse("eb27d68d-fae6-4fa3-87b7-5a8b928ff69e") }, // Templates.Create
                new SystemRolePermission { Role_Id = Guid.Parse("40db8cd0-2340-4f56-98f6-edbdc435d137"), Permission_Id = Guid.Parse("6ae47f88-367d-414b-9fa7-6cfd8b58c413") }, // Templates.Edit
                new SystemRolePermission { Role_Id = Guid.Parse("40db8cd0-2340-4f56-98f6-edbdc435d137"), Permission_Id = Guid.Parse("f7d03dd3-c0e3-47e5-9448-602a24bfa60c") }, // Templates.Delete

                // ISSUER
                new SystemRolePermission { Role_Id = Guid.Parse("78752151-7cd4-46ee-bd6c-6b6bef16f286"), Permission_Id = Guid.Parse("aaae6e31-7407-48fa-ade7-84efc402ba52") }, // Credentials.View
                new SystemRolePermission { Role_Id = Guid.Parse("78752151-7cd4-46ee-bd6c-6b6bef16f286"), Permission_Id = Guid.Parse("3f2a2168-7db7-40ec-92c5-7f2b5ae84335") }, // Credentials.Add

                // VIEWER
                new SystemRolePermission { Role_Id = Guid.Parse("36f3cec7-caf0-4551-9330-7f0e2c231518"), Permission_Id = Guid.Parse("aaae6e31-7407-48fa-ade7-84efc402ba52") }, // Credentials.View
                new SystemRolePermission { Role_Id = Guid.Parse("36f3cec7-caf0-4551-9330-7f0e2c231518"), Permission_Id = Guid.Parse("86e3cf96-4cb9-4b7e-a2cd-1cb136e113dd") }, // Certificate.View

                // APPROVER
                new SystemRolePermission { Role_Id = Guid.Parse("74d986ef-92be-4d4b-9993-12976347b1be"), Permission_Id = Guid.Parse("86e3cf96-4cb9-4b7e-a2cd-1cb136e113dd") }, // Certificate.View
                new SystemRolePermission { Role_Id = Guid.Parse("74d986ef-92be-4d4b-9993-12976347b1be"), Permission_Id = Guid.Parse("b96861b8-d76f-42b5-a622-2ce6852d50b4") }  // Certificate.Sign
            };
            builder.Entity<SystemRolePermission>().HasData(systemRolePermissions);
            var features = new List<Feature>
            {
                new Feature { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Feature_Key = "Template_Designer", Name = "Template Designer", SortOrder = 1, Is_Active = true },
                new Feature { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Feature_Key = "Ready_Model", Name = "Ready model", SortOrder = 2, Is_Active = true },
                new Feature { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Feature_Key = "AI", Name = "AI", SortOrder = 3, Is_Active = true },
                new Feature { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Feature_Key = "Fonts", Name = "Fonts", SortOrder = 4, Is_Active = true },
                new Feature { Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), Feature_Key = "Tables", Name = "Tables", SortOrder = 5, Is_Active = true },
                new Feature { Id = Guid.Parse("66666666-6666-6666-6666-666666666666"), Feature_Key = "Images", Name = "Images", SortOrder = 6, Is_Active = true },
                new Feature { Id = Guid.Parse("77777777-7777-7777-7777-777777777777"), Feature_Key = "Fingerprint", Name = "Fingerprint", SortOrder = 7, Is_Active = true },
                new Feature { Id = Guid.Parse("88888888-8888-8888-8888-888888888888"), Feature_Key = "Magic_Link_Approval", Name = "Magic link Approval", SortOrder = 8, Is_Active = true },
                new Feature { Id = Guid.Parse("99999999-9999-9999-9999-999999999999"), Feature_Key = "Approval_Workflows", Name = "Approval Workflows", SortOrder = 9, Is_Active = true },
                new Feature { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), Feature_Key = "Bulk_Issuance", Name = "Bulk Issuance", SortOrder = 10, Is_Active = true },
                new Feature { Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), Feature_Key = "Verification", Name = "Verification", SortOrder = 11, Is_Active = true },
                new Feature { Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"), Feature_Key = "Users", Name = "Users", SortOrder = 12, Is_Active = true },
                new Feature { Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"), Feature_Key = "Roles_Permissions", Name = "Roles & Permissions", SortOrder = 13, Is_Active = true },
                new Feature { Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"), Feature_Key = "Integrations", Name = "Integrations", SortOrder = 14, Is_Active = true }
            };
            builder.Entity<Feature>().HasData(features);
        }
    }
}

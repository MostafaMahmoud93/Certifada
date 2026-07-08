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
            var tenantId = Guid.Parse("a0000000-0000-4000-8000-000000000001");
            var createdAt = new DateTime(2025, 8, 10, 15, 0, 45, 964, DateTimeKind.Utc).AddTicks(5459);
            const string seedHash = "AQAAAAIAAYagAAAAEGXpFYVKRy1CS1wTa4v2zHvK2DAwSRj6zGJuY6YEu2UMbe0CMZOHs5I/XjU8zDUmVA=="; // new PasswordHasher<User>().HashPassword(null, "P@55w0rd")
            var firstUser = new User
            {
                Id = userId,
                Tenant_Id = tenantId,
                Email = "must345@yahoo.com",
                Password_Hash = seedHash,
                Full_Name = "Mostafa Mahmoud",
                Is_Active = true,
                Email_Confirmed = true,
                Create_Date = createdAt,
                Is_Deleted = false
            };
            // Add the first user to Users
            builder.Entity<User>().HasData(firstUser);
            // ---- deterministic GUID from a stable key (keeps HasData migrations stable) ----
            static Guid Det(string key) => new Guid(System.Security.Cryptography.MD5.HashData(System.Text.Encoding.UTF8.GetBytes(key)));

            // ===== PERMISSIONS — full catalogue; codes are identical to the Angular `Actions` enum =====
            // Short = one-line hint shown under each action; Full = detailed text for the info popup.
            var catalog = new (string Screen, string Code, string Short, string Full)[]
            {
                ("dashboard","DASH_VIEW","See KPIs, activity & pending approvals","Open the home dashboard and see workspace KPIs, recent activity and the pending-approvals queue. This is the landing screen after signing in — without it the user starts on another allowed page."),
                ("dashboard","ANALYTICS_VIEW","Issuance & verification reports","Access analytics and reporting: issuance trends, verification/traffic charts and per-credential view counts. Read-only insight into how credentials are performing."),
                ("templates","TPL_VIEW","Browse & preview the library","Browse the template library and open any template for preview. This is the baseline access every other template action builds on."),
                ("templates","TPL_CREATE","Add brand-new templates","Start brand-new templates from scratch or from a preset and add them to the workspace library. Automatically includes viewing templates."),
                ("templates","TPL_EDIT","Change layout, text & fields","Open a template in the design studio and change its layout, text, images, colours and data fields. Also unlocks opening the designer canvas."),
                ("templates","TPL_DELETE","Permanently remove templates","Permanently remove templates from the workspace. Deleted templates cannot be recovered, so this is treated as a sensitive action."),
                ("templates","TPL_ARCHIVE","Hide or restore templates","Archive templates to hide them from the active list, or restore archived ones — without deleting any data."),
                ("templates","TPL_EXPORT","Download as PDF, PNG or JSON","Download templates as PDF, PNG or JSON, or share the template definition outside Certifada."),
                ("templates","TPL_INFO","Metadata, usage & history","See a template's metadata, usage statistics and change history."),
                ("designer","EXNDM","View a design on the canvas","Open the certificate design canvas to view a design. Prerequisite for every other design-studio action."),
                ("designer","EDITC","Add, move & restyle elements","Add, move, resize and restyle elements on the canvas — text, shapes, images, seals and data fields."),
                ("designer","CDDCR","Persist canvas changes","Persist changes made on the canvas back to the template. Includes opening and editing the canvas."),
                ("designer","DELDR","Remove elements from a design","Remove individual elements or clear parts of a design on the canvas."),
                ("designer","CNV_PRINT","Print or export from the studio","Print the current design or export it as a file directly from the studio."),
                ("designer","CNV_AI","Generate & refine with AI","Use the AI tools to generate layouts, suggest content and refine designs automatically. A premium capability."),
                ("credentials","CRED_VIEW","Browse issued certificates","Browse issued certificates and open each recipient's details, delivery status and history. Baseline for all credential actions."),
                ("credentials","CRED_GEN","Issue one certificate at a time","Issue one certificate at a time by choosing a template and entering a recipient. Includes viewing credentials."),
                ("credentials","CRED_BULK","Generate many from a data file","Generate many certificates in one run from a data file such as CSV or Excel. Includes single issuing and viewing."),
                ("credentials","CRED_APPROVE","Release queued credentials","Approve credentials that are waiting in the queue so they can be sent to recipients. Sensitive — controls what actually goes out."),
                ("credentials","CRED_REJECT","Send back with a reason","Reject credentials awaiting approval and send them back with a reason. Sensitive."),
                ("credentials","CRED_REVOKE","Invalidate an issued certificate","Invalidate a certificate that was already issued so it no longer verifies. Sensitive and not reversible for the recipient."),
                ("credentials","CRED_RESEND","Re-send the credential email","Re-send a credential email to its recipient, for example if the original was missed."),
                ("credentials","CRED_EDIT","Correct & re-render recipient data","Correct the recipient data (name, fields) on an already-issued credential and re-render it."),
                ("credentials","CRED_EXPORT","Export the list to CSV/Excel","Export the credentials list and its details to CSV or Excel for auditing or reporting."),
                ("credentials","CRED_DOWNLOAD","Download a certificate file","Download an individual certificate as a file (PDF/PNG)."),
                ("approvals","APPROVAL_VIEW","Review the pending queue","Open the approvals queue to review credentials and batches waiting for a decision. Needed before anyone can approve or reject."),
                ("branding","BRAND_MANAGE","Logo, colours, fonts & signature","Set the organisation's logo, colour palette, fonts and default signature that are applied across all templates and emails."),
                ("people","USER_VIEW","See members & their roles","See the list of workspace members with the role assigned to each. Baseline for managing people."),
                ("people","USER_INVITE","Send seat invitations","Send seat invitations to bring new members into the workspace."),
                ("people","USER_MANAGE","Change roles, suspend accounts","Change a member's role, suspend or reactivate accounts. Sensitive — it changes what others can access."),
                ("people","USER_REMOVE","Remove members & free seats","Remove members from the workspace and free their seat. Sensitive."),
                ("people","ROLE_VIEW","See roles & their permissions","See all roles and exactly which permissions each one grants."),
                ("people","ROLE_MANAGE","Create, edit & delete roles","Create, edit, clone and delete roles and change which permissions they grant. Highly sensitive — it defines everyone's access."),
                ("automation","AUTO_VIEW","See workflows & run history","See automated workflows and their recent run history."),
                ("automation","AUTO_MANAGE","Create, edit & toggle workflows","Create, edit, enable or disable workflows that automatically issue or route credentials."),
                ("billing","BILLING_VIEW","Plan, usage & payment history","See the current plan, usage against limits and payment history. Read-only."),
                ("billing","BILLING_MANAGE","Payment method & subscription","Update the payment method and manage the subscription in the billing portal. Sensitive — financial control."),
                ("billing","PLAN_CHANGE","Upgrade or downgrade the plan","Upgrade or downgrade the subscription plan, which changes limits and what the whole workspace is billed. Sensitive."),
                ("billing","PRICING_VIEW","Compare available plans","Open the pricing page and compare the available plans."),
                ("account","PROFILE_MANAGE","Profile, avatar & preferences","Edit personal profile details, avatar and preferences."),
                ("account","SIGNATURE_MANAGE","Manage the approver signature","Create and manage the approver signature used when signing off credentials."),
                ("account","SET_MANAGE","Workspace settings & security","Change workspace-wide settings, integrations and security options. Sensitive — affects the whole organisation."),
                ("account","SUPPORT_VIEW","Open help & support","Open the support and help resources."),
            };
            builder.Entity<Permission>().HasData(catalog.Select(c => new Permission { Id = Det("perm:" + c.Code), Screen_Key = c.Screen, Code = c.Code, Short_Description = c.Short, Description = c.Full, Is_Deleted = false }).ToList());

            var allCodes = catalog.Select(c => c.Code).ToArray();
            var adminCodes = allCodes.Where(c => c != "BILLING_MANAGE" && c != "PLAN_CHANGE").ToArray();
            string[] approverCodes = { "DASH_VIEW","ANALYTICS_VIEW","TPL_VIEW","CRED_VIEW","APPROVAL_VIEW","CRED_APPROVE","CRED_REJECT","CRED_REVOKE","SUPPORT_VIEW" };
            string[] editorCodes = { "DASH_VIEW","TPL_VIEW","TPL_CREATE","TPL_EDIT","TPL_EXPORT","TPL_INFO","EXNDM","EDITC","CDDCR","CNV_PRINT","CRED_VIEW","CRED_GEN","CRED_BULK","CRED_RESEND","CRED_DOWNLOAD","BRAND_MANAGE","AUTO_VIEW","SUPPORT_VIEW" };
            string[] viewerCodes = { "DASH_VIEW","ANALYTICS_VIEW","TPL_VIEW","CRED_VIEW","APPROVAL_VIEW","USER_VIEW","ROLE_VIEW","AUTO_VIEW","BILLING_VIEW","SUPPORT_VIEW" };
            var roleDefs = new (string Code, string Name, string Desc, string[] Codes)[]
            {
                ("OWNER","Owner","Full, unrestricted access to the entire workspace.", allCodes),
                ("ADMIN","Administrator","Manage content, people and settings \u2014 except billing ownership.", adminCodes),
                ("APPROVER","Approver","Review, approve, reject and revoke credentials.", approverCodes),
                ("EDITOR","Editor","Design templates and issue credentials.", editorCodes),
                ("VIEWER","Viewer","Read-only access across the workspace.", viewerCodes),
            };

            // ===== SYSTEM ROLES (immutable per-tenant defaults) + their permissions =====
            builder.Entity<SystemRole>().HasData(roleDefs.Select(r => new SystemRole { Id = Det("sysrole:" + r.Code), Role_Name = r.Name, Description = r.Desc, Role_Code = r.Code, Is_Active = true, Is_Deleted = false }).ToList());
            builder.Entity<SystemRolePermission>().HasData(roleDefs.SelectMany(r => r.Codes.Select(code => new SystemRolePermission { Role_Id = Det("sysrole:" + r.Code), Permission_Id = Det("perm:" + code) })).ToList());

            // ===== DEFAULT TENANT + role copies (Is_System) so the app works out of the box =====
            builder.Entity<Tenant>().HasData(new Tenant { Id = tenantId, Name = "Certifada", Is_Active = true, Created_Date = createdAt, Is_Deleted = false });
            builder.Entity<Role>().HasData(roleDefs.Select(r => new Role { Id = Det("role:" + r.Code), Tenant_Id = tenantId, Name = r.Name, Description = r.Desc, Role_Code = r.Code, Is_System = true, Is_Active = true, Created_Date = createdAt, Created_By = userId, Is_Deleted = false }).ToList());
            builder.Entity<RolePermission>().HasData(roleDefs.SelectMany(r => r.Codes.Select(code => new RolePermission { Role_Id = Det("role:" + r.Code), Permission_Id = Det("perm:" + code) })).ToList());

            // ===== assign the seeded user to the Owner role =====
            builder.Entity<UserRole>().HasData(new UserRole { User_Id = userId, Role_Id = Det("role:OWNER") });
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

            SeedPlansAndPricing(builder);
        }

        /// <summary>
        /// Plans + prices + feature rows exactly as shown on the public Pricing page
        /// (Free Trial / Basic / Professional / Enterprise). The Angular pricing page
        /// reads this via GET api/Plan/GetPricingPlans.
        /// </summary>
        private static void SeedPlansAndPricing(ModelBuilder builder)
        {
            // ---- Region (prices are global USD for now) ----
            builder.Entity<Region>().HasData(new Region { Id = 1, Region_Code = "GLOBAL", Label = "Global", Currency = "USD", Is_Deleted = false });

            // ---- Plans ----
            var freeId = Guid.Parse("b1000000-0000-4000-8000-000000000001");
            var basicId = Guid.Parse("b1000000-0000-4000-8000-000000000002");
            var proId = Guid.Parse("b1000000-0000-4000-8000-000000000003");
            var entId = Guid.Parse("b1000000-0000-4000-8000-000000000004");
            builder.Entity<Plan>().HasData(
                new Plan { Id = freeId, Plan_Code = "Free", Title = "Free Trial", Blurb = "Try our platform free for 14 days", Highlight = false, Is_Trial = true, SortOrder = 1, Is_Active = true, Is_Deleted = false },
                new Plan { Id = basicId, Plan_Code = "Basic", Title = "Basic", Blurb = "Perfect for small organizations", Highlight = false, Is_Trial = false, SortOrder = 2, Is_Active = true, Is_Deleted = false },
                new Plan { Id = proId, Plan_Code = "Professional", Title = "Professional", Blurb = "For growing teams and businesses", Highlight = true, Is_Trial = false, SortOrder = 3, Is_Active = true, Is_Deleted = false },
                new Plan { Id = entId, Plan_Code = "Enterprise", Title = "Enterprise", Blurb = "Unlimited power for large organizations", Highlight = false, Is_Trial = false, SortOrder = 4, Is_Active = true, Is_Deleted = false }
            );

            // ---- Prices (USD, monthly + yearly; yearly = 2 months free) ----
            PlanPrice Price(string id, Guid planId, string interval, decimal amount, string stripeSuffix) => new PlanPrice
            {
                Id = Guid.Parse(id),
                Plan_Id = planId,
                Region_Code = "GLOBAL",
                Interval = interval,
                Amount = amount,
                Currency = "USD",
                StripeProductId = $"prod_{stripeSuffix}",
                StripePriceId = $"price_{stripeSuffix}_{interval}",
                IsActive = true,
                Is_Deleted = false
            };
            builder.Entity<PlanPrice>().HasData(
                Price("c1000000-0000-4000-8000-000000000001", freeId, "monthly", 0m, "free"),
                Price("c1000000-0000-4000-8000-000000000002", freeId, "yearly", 0m, "free"),
                Price("c1000000-0000-4000-8000-000000000003", basicId, "monthly", 19m, "basic"),
                Price("c1000000-0000-4000-8000-000000000004", basicId, "yearly", 190m, "basic"),
                Price("c1000000-0000-4000-8000-000000000005", proId, "monthly", 49m, "professional"),
                Price("c1000000-0000-4000-8000-000000000006", proId, "yearly", 490m, "professional"),
                Price("c1000000-0000-4000-8000-000000000007", entId, "monthly", 99m, "enterprise"),
                Price("c1000000-0000-4000-8000-000000000008", entId, "yearly", 990m, "enterprise")
            );

            // ---- Pricing-page display features (SortOrder 101+ keeps them apart from the product feature flags above) ----
            Guid F(int n) => Guid.Parse($"f1000000-0000-4000-8000-{n:D12}");
            builder.Entity<Feature>().HasData(
                new Feature { Id = F(1), Feature_Key = "Certificate_Templates", Name = "Certificate Templates", SortOrder = 101, Is_Active = true },
                new Feature { Id = F(2), Feature_Key = "Certificates_Per_Month", Name = "Certificates per Month", SortOrder = 102, Is_Active = true },
                new Feature { Id = F(3), Feature_Key = "Team_Members", Name = "Team Members", SortOrder = 103, Is_Active = true },
                new Feature { Id = F(4), Feature_Key = "Storage", Name = "Storage", SortOrder = 104, Is_Active = true },
                new Feature { Id = F(5), Feature_Key = "Custom_Branding", Name = "Custom Branding", SortOrder = 105, Is_Active = true },
                new Feature { Id = F(6), Feature_Key = "API_Access", Name = "API Access", SortOrder = 106, Is_Active = true },
                new Feature { Id = F(7), Feature_Key = "Priority_Support", Name = "Priority Support", SortOrder = 107, Is_Active = true },
                new Feature { Id = F(8), Feature_Key = "QR_Code_Verification", Name = "QR Code Verification", SortOrder = 108, Is_Active = true },
                new Feature { Id = F(9), Feature_Key = "Email_Support", Name = "Email Support", SortOrder = 109, Is_Active = true },
                new Feature { Id = F(10), Feature_Key = "Bulk_Certificate_Generation", Name = "Bulk Certificate Generation", SortOrder = 110, Is_Active = true },
                new Feature { Id = F(11), Feature_Key = "Advanced_Analytics", Name = "Advanced Analytics", SortOrder = 111, Is_Active = true },
                new Feature { Id = F(12), Feature_Key = "White_Label", Name = "White-label Solution", SortOrder = 112, Is_Active = true },
                new Feature { Id = F(13), Feature_Key = "SSO_SAML", Name = "SSO / SAML", SortOrder = 113, Is_Active = true },
                new Feature { Id = F(14), Feature_Key = "Dedicated_Account_Manager", Name = "Dedicated Account Manager", SortOrder = 114, Is_Active = true }
            );

            // ---- Plan ↔ feature rows (mirrors the pricing cards 1:1, including the greyed-out rows) ----
            PlanFeature PF(int plan, int feat, Guid planId, bool enabled, string? value = null, int? times = null) => new PlanFeature
            {
                Id = Guid.Parse($"d1000000-0000-4000-800{plan}-{feat:D12}"),
                Plan_Id = planId,
                Feature_Id = F(feat),
                Enabled = enabled,
                Display_Value = value,
                FeatureTimes = times,
                Is_Deleted = false
            };
            builder.Entity<PlanFeature>().HasData(
                // Free Trial
                PF(1, 1, freeId, true, "3", 3),
                PF(1, 2, freeId, true, "50", 50),
                PF(1, 3, freeId, true, "1", 1),
                PF(1, 4, freeId, true, "10 MB", 10),
                PF(1, 5, freeId, false),
                PF(1, 6, freeId, false),
                PF(1, 7, freeId, false),
                PF(1, 8, freeId, false),
                // Basic
                PF(2, 1, basicId, true, "10", 10),
                PF(2, 2, basicId, true, "500", 500),
                PF(2, 3, basicId, true, "3", 3),
                PF(2, 4, basicId, true, "1 GB", 1024),
                PF(2, 5, basicId, true),
                PF(2, 6, basicId, false),
                PF(2, 7, basicId, false),
                PF(2, 8, basicId, true),
                PF(2, 9, basicId, true),
                // Professional
                PF(3, 1, proId, true, "50", 50),
                PF(3, 2, proId, true, "5,000", 5000),
                PF(3, 3, proId, true, "10", 10),
                PF(3, 4, proId, true, "10 GB", 10240),
                PF(3, 5, proId, true),
                PF(3, 6, proId, true),
                PF(3, 7, proId, true),
                PF(3, 8, proId, true),
                PF(3, 10, proId, true),
                PF(3, 11, proId, true),
                // Enterprise (null FeatureTimes = unlimited)
                PF(4, 1, entId, true, "Unlimited"),
                PF(4, 2, entId, true, "Unlimited"),
                PF(4, 3, entId, true, "Unlimited"),
                PF(4, 4, entId, true, "Unlimited"),
                PF(4, 5, entId, true),
                PF(4, 6, entId, true),
                PF(4, 7, entId, true, "24/7"),
                PF(4, 8, entId, true),
                PF(4, 10, entId, true),
                PF(4, 11, entId, true),
                PF(4, 12, entId, true),
                PF(4, 13, entId, true),
                PF(4, 14, entId, true)
            );
        }
    }
}

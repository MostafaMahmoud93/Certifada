using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Certifada.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Features",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Feature_Key = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    Is_Active = table.Column<bool>(type: "bit", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Features", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Screen_Key = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Plans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Plan_Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Blurb = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Highlight = table.Column<bool>(type: "bit", nullable: false),
                    Is_Trial = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    Is_Active = table.Column<bool>(type: "bit", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Plans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Regions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Region_Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Regions", x => x.Id);
                    table.UniqueConstraint("AK_Regions_Region_Code", x => x.Region_Code);
                });

            migrationBuilder.CreateTable(
                name: "SystemRoles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role_Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role_Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Is_Active = table.Column<bool>(type: "bit", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TenantFeatureOverrides",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Tenant_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Feature_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Enabled = table.Column<bool>(type: "bit", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantFeatureOverrides", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tenants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OrganizationType = table.Column<int>(type: "int", nullable: true),
                    ApplicantRole = table.Column<int>(type: "int", nullable: true),
                    Is_Active = table.Column<bool>(type: "bit", nullable: false),
                    Created_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlanFeatures",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Plan_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Feature_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Enabled = table.Column<bool>(type: "bit", nullable: false),
                    FeatureTimes = table.Column<int>(type: "int", nullable: true),
                    Display_Value = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanFeatures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanFeatures_Features_Feature_Id",
                        column: x => x.Feature_Id,
                        principalTable: "Features",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PlanFeatures_Plans_Plan_Id",
                        column: x => x.Plan_Id,
                        principalTable: "Plans",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PlanPrices",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Plan_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Region_Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Interval = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StripeProductId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StripePriceId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanPrices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanPrices_Plans_Plan_Id",
                        column: x => x.Plan_Id,
                        principalTable: "Plans",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PlanPrices_Regions_Region_Code",
                        column: x => x.Region_Code,
                        principalTable: "Regions",
                        principalColumn: "Region_Code",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SystemRolePermissions",
                columns: table => new
                {
                    Permission_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemRolePermissions", x => new { x.Role_Id, x.Permission_Id });
                    table.ForeignKey(
                        name: "FK_SystemRolePermissions_Permissions_Permission_Id",
                        column: x => x.Permission_Id,
                        principalTable: "Permissions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SystemRolePermissions_SystemRoles_Role_Id",
                        column: x => x.Role_Id,
                        principalTable: "SystemRoles",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "BillingHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Tenant_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Plan_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Plan_Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Interval = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StripeCustomerId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StripeSubscriptionId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StripeInvoiceId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Created_On = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BillingHistories_Plans_Plan_Id",
                        column: x => x.Plan_Id,
                        principalTable: "Plans",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_BillingHistories_Tenants_Tenant_Id",
                        column: x => x.Tenant_Id,
                        principalTable: "Tenants",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Tenant_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role_Code = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Is_System = table.Column<bool>(type: "bit", nullable: false),
                    Is_Active = table.Column<bool>(type: "bit", nullable: false),
                    Created_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Created_By = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Roles_Tenants_Tenant_Id",
                        column: x => x.Tenant_Id,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Subscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Tenant_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Plan_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Interval = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StripeCustomerId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StripeSubscriptionId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Started_On = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Current_Period_End = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    Cancel_At = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    Canceled_On = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Pending_Plan_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Pending_Interval = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Scheduled_Change_On = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Subscriptions_Plans_Plan_Id",
                        column: x => x.Plan_Id,
                        principalTable: "Plans",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Subscriptions_Tenants_Tenant_Id",
                        column: x => x.Tenant_Id,
                        principalTable: "Tenants",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Units",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Tenant_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Create_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Units", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Units_Tenants_Tenant_Id",
                        column: x => x.Tenant_Id,
                        principalTable: "Tenants",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "RolePermissions",
                columns: table => new
                {
                    Permission_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Role_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolePermissions", x => new { x.Role_Id, x.Permission_Id });
                    table.ForeignKey(
                        name: "FK_RolePermissions_Permissions_Permission_Id",
                        column: x => x.Permission_Id,
                        principalTable: "Permissions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_RolePermissions_Roles_Role_Id",
                        column: x => x.Role_Id,
                        principalTable: "Roles",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Tenant_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Unit_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Role_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Full_Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Password_Hash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Profile_Picture_URL = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Signature_URL = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Is_Active = table.Column<bool>(type: "bit", nullable: false),
                    Email_Confirmed = table.Column<bool>(type: "bit", nullable: false),
                    Provider_Id = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Provider_Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Create_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Roles_Role_Id",
                        column: x => x.Role_Id,
                        principalTable: "Roles",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Users_Tenants_Tenant_Id",
                        column: x => x.Tenant_Id,
                        principalTable: "Tenants",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Users_Units_Unit_Id",
                        column: x => x.Unit_Id,
                        principalTable: "Units",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "AccessLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Action_Code = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    User_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Access_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RecordNo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccessLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AccessLogs_Users_User_Id",
                        column: x => x.User_Id,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CertificateTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Tenant_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Design = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Preview_Image_Url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Width = table.Column<int>(type: "int", nullable: false),
                    Height = table.Column<int>(type: "int", nullable: false),
                    Placeholders_Json = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false),
                    Created_By = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Create_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Last_Modified_By = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Last_Modify_Date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CertificateTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CertificateTemplates_Tenants_Tenant_Id",
                        column: x => x.Tenant_Id,
                        principalTable: "Tenants",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CertificateTemplates_Users_Created_By",
                        column: x => x.Created_By,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CertificateTemplates_Users_Last_Modified_By",
                        column: x => x.Last_Modified_By,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "EmailTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Tenant_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Unit_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Subject = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Body_Html = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Body_Text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Is_Default = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UnitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false),
                    Created_By = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Create_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Last_Modified_By = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Last_Modify_Date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailTemplates_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EmailTemplates_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EmailTemplates_Users_Created_By",
                        column: x => x.Created_By,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EmailTemplates_Users_Last_Modified_By",
                        column: x => x.Last_Modified_By,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "GlobalAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Document_Id = table.Column<int>(type: "int", nullable: false),
                    Created_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Created_By = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    File_Extension = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    File_MIME = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    File_Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    File_Path = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    File_Size = table.Column<long>(type: "bigint", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GlobalAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GlobalAttachments_Users_Created_By",
                        column: x => x.Created_By,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TenantBrands",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Tenant_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LogoUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FaviconUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PrimaryColor = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecondaryColor = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BackgroundColor = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FontFamily = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ThemeJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Locale = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Domain = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DarkModeEnabled = table.Column<bool>(type: "bit", nullable: true),
                    ShowBranding = table.Column<bool>(type: "bit", nullable: true),
                    OverrideTenantBranding = table.Column<bool>(type: "bit", nullable: true),
                    TwitterUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LinkedInUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FacebookUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupportEmail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WebsiteUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false),
                    Created_By = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Create_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Last_Modified_By = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Last_Modify_Date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantBrands", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenantBrands_Tenants_Tenant_Id",
                        column: x => x.Tenant_Id,
                        principalTable: "Tenants",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TenantBrands_Users_Created_By",
                        column: x => x.Created_By,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TenantBrands_Users_Last_Modified_By",
                        column: x => x.Last_Modified_By,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TenantPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Tenant_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Plan_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Region_Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Interval = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StripeCustomerId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StripeSubscriptionId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Current_Period_End = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    Trial_End = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    Cancel_At = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false),
                    Created_By = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Create_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Last_Modified_By = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Last_Modify_Date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TenantPlans_Plans_Plan_Id",
                        column: x => x.Plan_Id,
                        principalTable: "Plans",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TenantPlans_Regions_Region_Code",
                        column: x => x.Region_Code,
                        principalTable: "Regions",
                        principalColumn: "Region_Code",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TenantPlans_Tenants_Tenant_Id",
                        column: x => x.Tenant_Id,
                        principalTable: "Tenants",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TenantPlans_Users_Created_By",
                        column: x => x.Created_By,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TenantPlans_Users_Last_Modified_By",
                        column: x => x.Last_Modified_By,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UnitBrands",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Unit_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LogoUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FaviconUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PrimaryColor = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecondaryColor = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BackgroundColor = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FontFamily = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ThemeJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Locale = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Domain = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DarkModeEnabled = table.Column<bool>(type: "bit", nullable: true),
                    ShowBranding = table.Column<bool>(type: "bit", nullable: true),
                    OverrideTenantBranding = table.Column<bool>(type: "bit", nullable: true),
                    TwitterUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LinkedInUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FacebookUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupportEmail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WebsiteUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false),
                    Created_By = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Create_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Last_Modified_By = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Last_Modify_Date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnitBrands", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UnitBrands_Units_Unit_Id",
                        column: x => x.Unit_Id,
                        principalTable: "Units",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UnitBrands_Users_Created_By",
                        column: x => x.Created_By,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UnitBrands_Users_Last_Modified_By",
                        column: x => x.Last_Modified_By,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserLoginLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    User_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Login_Time = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IP_Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Is_Successful = table.Column<bool>(type: "bit", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserLoginLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserLoginLogs_Users_User_Id",
                        column: x => x.User_Id,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserPermissions",
                columns: table => new
                {
                    Permission_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    User_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserPermissions", x => new { x.User_Id, x.Permission_Id });
                    table.ForeignKey(
                        name: "FK_UserPermissions_Permissions_Permission_Id",
                        column: x => x.Permission_Id,
                        principalTable: "Permissions",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserPermissions_Users_User_Id",
                        column: x => x.User_Id,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CertificateInstances",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Template_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Tenant_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Unit_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IssuedTo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IssuedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Created_By = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Download_Url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PdfGeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Data_Json = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Format = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Batch_Id = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Created_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PublicLinkToken = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Public_Url = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SharedViaEmail = table.Column<bool>(type: "bit", nullable: true),
                    EmailSentAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PdfDownloadCount = table.Column<int>(type: "int", nullable: true),
                    ViewCount = table.Column<int>(type: "int", nullable: true),
                    LastViewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CertificateInstances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CertificateInstances_CertificateTemplates_Template_Id",
                        column: x => x.Template_Id,
                        principalTable: "CertificateTemplates",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CertificateInstances_Tenants_Tenant_Id",
                        column: x => x.Tenant_Id,
                        principalTable: "Tenants",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CertificateInstances_Units_Unit_Id",
                        column: x => x.Unit_Id,
                        principalTable: "Units",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CertificateInstances_Users_Created_By",
                        column: x => x.Created_By,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CertificateTemplateVariables",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Template_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Display_Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Data_Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Is_Required = table.Column<bool>(type: "bit", nullable: true),
                    Default_Value = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: true),
                    Placeholder = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Validation_Regex = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Created_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CertificateTemplateVariables", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CertificateTemplateVariables_CertificateTemplates_Template_Id",
                        column: x => x.Template_Id,
                        principalTable: "CertificateTemplates",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "EmailSendingLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Tenant_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Unit_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Certificate_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Template_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Recipient_Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Priority = table.Column<bool>(type: "bit", nullable: false),
                    Attachment_Files = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CCEmail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BCCEmail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Error_Message = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Record_Insertion_Datetime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UnitId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false),
                    Created_By = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Create_Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Last_Modified_By = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Last_Modify_Date = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailSendingLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailSendingLogs_EmailTemplates_Template_Id",
                        column: x => x.Template_Id,
                        principalTable: "EmailTemplates",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EmailSendingLogs_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EmailSendingLogs_Units_UnitId",
                        column: x => x.UnitId,
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EmailSendingLogs_Users_Created_By",
                        column: x => x.Created_By,
                        principalTable: "Users",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_EmailSendingLogs_Users_Last_Modified_By",
                        column: x => x.Last_Modified_By,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CertificateAccessLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Instance_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PerformedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PerformedByEmail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IPAddress = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserAgent = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Referrer = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeviceInfo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CertificateAccessLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CertificateAccessLogs_CertificateInstances_Instance_Id",
                        column: x => x.Instance_Id,
                        principalTable: "CertificateInstances",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "CertificateVariableValues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Instance_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Variable_Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Is_Deleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CertificateVariableValues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CertificateVariableValues_CertificateInstances_Instance_Id",
                        column: x => x.Instance_Id,
                        principalTable: "CertificateInstances",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CertificateVariableValues_CertificateTemplateVariables_Variable_Id",
                        column: x => x.Variable_Id,
                        principalTable: "CertificateTemplateVariables",
                        principalColumn: "Id");
                });

            migrationBuilder.InsertData(
                table: "Features",
                columns: new[] { "Id", "Description", "Feature_Key", "Is_Active", "Is_Deleted", "Name", "SortOrder" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), null, "Template_Designer", true, false, "Template Designer", 1 },
                    { new Guid("22222222-2222-2222-2222-222222222222"), null, "Ready_Model", true, false, "Ready model", 2 },
                    { new Guid("33333333-3333-3333-3333-333333333333"), null, "AI", true, false, "AI", 3 },
                    { new Guid("44444444-4444-4444-4444-444444444444"), null, "Fonts", true, false, "Fonts", 4 },
                    { new Guid("55555555-5555-5555-5555-555555555555"), null, "Tables", true, false, "Tables", 5 },
                    { new Guid("66666666-6666-6666-6666-666666666666"), null, "Images", true, false, "Images", 6 },
                    { new Guid("77777777-7777-7777-7777-777777777777"), null, "Fingerprint", true, false, "Fingerprint", 7 },
                    { new Guid("88888888-8888-8888-8888-888888888888"), null, "Magic_Link_Approval", true, false, "Magic link Approval", 8 },
                    { new Guid("99999999-9999-9999-9999-999999999999"), null, "Approval_Workflows", true, false, "Approval Workflows", 9 },
                    { new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), null, "Bulk_Issuance", true, false, "Bulk Issuance", 10 },
                    { new Guid("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), null, "Verification", true, false, "Verification", 11 },
                    { new Guid("cccccccc-cccc-cccc-cccc-cccccccccccc"), null, "Users", true, false, "Users", 12 },
                    { new Guid("dddddddd-dddd-dddd-dddd-dddddddddddd"), null, "Roles_Permissions", true, false, "Roles & Permissions", 13 },
                    { new Guid("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"), null, "Integrations", true, false, "Integrations", 14 },
                    { new Guid("f1000000-0000-4000-8000-000000000001"), null, "Certificate_Templates", true, false, "Certificate Templates", 101 },
                    { new Guid("f1000000-0000-4000-8000-000000000002"), null, "Certificates_Per_Month", true, false, "Certificates per Month", 102 },
                    { new Guid("f1000000-0000-4000-8000-000000000003"), null, "Team_Members", true, false, "Team Members", 103 },
                    { new Guid("f1000000-0000-4000-8000-000000000004"), null, "Storage", true, false, "Storage", 104 },
                    { new Guid("f1000000-0000-4000-8000-000000000005"), null, "Custom_Branding", true, false, "Custom Branding", 105 },
                    { new Guid("f1000000-0000-4000-8000-000000000006"), null, "API_Access", true, false, "API Access", 106 },
                    { new Guid("f1000000-0000-4000-8000-000000000007"), null, "Priority_Support", true, false, "Priority Support", 107 },
                    { new Guid("f1000000-0000-4000-8000-000000000008"), null, "QR_Code_Verification", true, false, "QR Code Verification", 108 },
                    { new Guid("f1000000-0000-4000-8000-000000000009"), null, "Email_Support", true, false, "Email Support", 109 },
                    { new Guid("f1000000-0000-4000-8000-000000000010"), null, "Bulk_Certificate_Generation", true, false, "Bulk Certificate Generation", 110 },
                    { new Guid("f1000000-0000-4000-8000-000000000011"), null, "Advanced_Analytics", true, false, "Advanced Analytics", 111 },
                    { new Guid("f1000000-0000-4000-8000-000000000012"), null, "White_Label", true, false, "White-label Solution", 112 },
                    { new Guid("f1000000-0000-4000-8000-000000000013"), null, "SSO_SAML", true, false, "SSO / SAML", 113 },
                    { new Guid("f1000000-0000-4000-8000-000000000014"), null, "Dedicated_Account_Manager", true, false, "Dedicated Account Manager", 114 }
                });

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
                table: "Plans",
                columns: new[] { "Id", "Blurb", "Highlight", "Is_Active", "Is_Deleted", "Is_Trial", "Plan_Code", "SortOrder", "Title" },
                values: new object[,]
                {
                    { new Guid("b1000000-0000-4000-8000-000000000001"), "Try our platform free for 14 days", false, true, false, true, "Free", 1, "Free Trial" },
                    { new Guid("b1000000-0000-4000-8000-000000000002"), "Perfect for small organizations", false, true, false, false, "Basic", 2, "Basic" },
                    { new Guid("b1000000-0000-4000-8000-000000000003"), "For growing teams and businesses", true, true, false, false, "Professional", 3, "Professional" },
                    { new Guid("b1000000-0000-4000-8000-000000000004"), "Unlimited power for large organizations", false, true, false, false, "Enterprise", 4, "Enterprise" }
                });

            migrationBuilder.InsertData(
                table: "Regions",
                columns: new[] { "Id", "Currency", "Is_Deleted", "Label", "Region_Code" },
                values: new object[] { 1, "USD", false, "Global", "GLOBAL" });

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

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Create_Date", "Email", "Email_Confirmed", "Full_Name", "Is_Active", "Is_Deleted", "Password_Hash", "Profile_Picture_URL", "Provider_Id", "Provider_Name", "Role_Id", "Signature_URL", "Tenant_Id", "Unit_Id" },
                values: new object[] { new Guid("db8f1215-f67e-4e75-b940-3943bd698ea1"), new DateTime(2025, 8, 10, 15, 0, 45, 964, DateTimeKind.Utc).AddTicks(5459), "must345@yahoo.com", true, "Mostafa Mahmoud", true, false, "AQAAAAIAAYagAAAAEGXpFYVKRy1CS1wTa4v2zHvK2DAwSRj6zGJuY6YEu2UMbe0CMZOHs5I/XjU8zDUmVA==", null, null, null, null, null, null, null });

            migrationBuilder.InsertData(
                table: "PlanFeatures",
                columns: new[] { "Id", "Display_Value", "Enabled", "FeatureTimes", "Feature_Id", "Is_Deleted", "Plan_Id" },
                values: new object[,]
                {
                    { new Guid("d1000000-0000-4000-8001-000000000001"), "3", true, 3, new Guid("f1000000-0000-4000-8000-000000000001"), false, new Guid("b1000000-0000-4000-8000-000000000001") },
                    { new Guid("d1000000-0000-4000-8001-000000000002"), "50", true, 50, new Guid("f1000000-0000-4000-8000-000000000002"), false, new Guid("b1000000-0000-4000-8000-000000000001") },
                    { new Guid("d1000000-0000-4000-8001-000000000003"), "1", true, 1, new Guid("f1000000-0000-4000-8000-000000000003"), false, new Guid("b1000000-0000-4000-8000-000000000001") },
                    { new Guid("d1000000-0000-4000-8001-000000000004"), "10 MB", true, 10, new Guid("f1000000-0000-4000-8000-000000000004"), false, new Guid("b1000000-0000-4000-8000-000000000001") },
                    { new Guid("d1000000-0000-4000-8001-000000000005"), null, false, null, new Guid("f1000000-0000-4000-8000-000000000005"), false, new Guid("b1000000-0000-4000-8000-000000000001") },
                    { new Guid("d1000000-0000-4000-8001-000000000006"), null, false, null, new Guid("f1000000-0000-4000-8000-000000000006"), false, new Guid("b1000000-0000-4000-8000-000000000001") },
                    { new Guid("d1000000-0000-4000-8001-000000000007"), null, false, null, new Guid("f1000000-0000-4000-8000-000000000007"), false, new Guid("b1000000-0000-4000-8000-000000000001") },
                    { new Guid("d1000000-0000-4000-8001-000000000008"), null, false, null, new Guid("f1000000-0000-4000-8000-000000000008"), false, new Guid("b1000000-0000-4000-8000-000000000001") },
                    { new Guid("d1000000-0000-4000-8002-000000000001"), "10", true, 10, new Guid("f1000000-0000-4000-8000-000000000001"), false, new Guid("b1000000-0000-4000-8000-000000000002") },
                    { new Guid("d1000000-0000-4000-8002-000000000002"), "500", true, 500, new Guid("f1000000-0000-4000-8000-000000000002"), false, new Guid("b1000000-0000-4000-8000-000000000002") },
                    { new Guid("d1000000-0000-4000-8002-000000000003"), "3", true, 3, new Guid("f1000000-0000-4000-8000-000000000003"), false, new Guid("b1000000-0000-4000-8000-000000000002") },
                    { new Guid("d1000000-0000-4000-8002-000000000004"), "1 GB", true, 1024, new Guid("f1000000-0000-4000-8000-000000000004"), false, new Guid("b1000000-0000-4000-8000-000000000002") },
                    { new Guid("d1000000-0000-4000-8002-000000000005"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000005"), false, new Guid("b1000000-0000-4000-8000-000000000002") },
                    { new Guid("d1000000-0000-4000-8002-000000000006"), null, false, null, new Guid("f1000000-0000-4000-8000-000000000006"), false, new Guid("b1000000-0000-4000-8000-000000000002") },
                    { new Guid("d1000000-0000-4000-8002-000000000007"), null, false, null, new Guid("f1000000-0000-4000-8000-000000000007"), false, new Guid("b1000000-0000-4000-8000-000000000002") },
                    { new Guid("d1000000-0000-4000-8002-000000000008"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000008"), false, new Guid("b1000000-0000-4000-8000-000000000002") },
                    { new Guid("d1000000-0000-4000-8002-000000000009"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000009"), false, new Guid("b1000000-0000-4000-8000-000000000002") },
                    { new Guid("d1000000-0000-4000-8003-000000000001"), "50", true, 50, new Guid("f1000000-0000-4000-8000-000000000001"), false, new Guid("b1000000-0000-4000-8000-000000000003") },
                    { new Guid("d1000000-0000-4000-8003-000000000002"), "5,000", true, 5000, new Guid("f1000000-0000-4000-8000-000000000002"), false, new Guid("b1000000-0000-4000-8000-000000000003") },
                    { new Guid("d1000000-0000-4000-8003-000000000003"), "10", true, 10, new Guid("f1000000-0000-4000-8000-000000000003"), false, new Guid("b1000000-0000-4000-8000-000000000003") },
                    { new Guid("d1000000-0000-4000-8003-000000000004"), "10 GB", true, 10240, new Guid("f1000000-0000-4000-8000-000000000004"), false, new Guid("b1000000-0000-4000-8000-000000000003") },
                    { new Guid("d1000000-0000-4000-8003-000000000005"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000005"), false, new Guid("b1000000-0000-4000-8000-000000000003") },
                    { new Guid("d1000000-0000-4000-8003-000000000006"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000006"), false, new Guid("b1000000-0000-4000-8000-000000000003") },
                    { new Guid("d1000000-0000-4000-8003-000000000007"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000007"), false, new Guid("b1000000-0000-4000-8000-000000000003") },
                    { new Guid("d1000000-0000-4000-8003-000000000008"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000008"), false, new Guid("b1000000-0000-4000-8000-000000000003") },
                    { new Guid("d1000000-0000-4000-8003-000000000010"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000010"), false, new Guid("b1000000-0000-4000-8000-000000000003") },
                    { new Guid("d1000000-0000-4000-8003-000000000011"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000011"), false, new Guid("b1000000-0000-4000-8000-000000000003") },
                    { new Guid("d1000000-0000-4000-8004-000000000001"), "Unlimited", true, null, new Guid("f1000000-0000-4000-8000-000000000001"), false, new Guid("b1000000-0000-4000-8000-000000000004") },
                    { new Guid("d1000000-0000-4000-8004-000000000002"), "Unlimited", true, null, new Guid("f1000000-0000-4000-8000-000000000002"), false, new Guid("b1000000-0000-4000-8000-000000000004") },
                    { new Guid("d1000000-0000-4000-8004-000000000003"), "Unlimited", true, null, new Guid("f1000000-0000-4000-8000-000000000003"), false, new Guid("b1000000-0000-4000-8000-000000000004") },
                    { new Guid("d1000000-0000-4000-8004-000000000004"), "Unlimited", true, null, new Guid("f1000000-0000-4000-8000-000000000004"), false, new Guid("b1000000-0000-4000-8000-000000000004") },
                    { new Guid("d1000000-0000-4000-8004-000000000005"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000005"), false, new Guid("b1000000-0000-4000-8000-000000000004") },
                    { new Guid("d1000000-0000-4000-8004-000000000006"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000006"), false, new Guid("b1000000-0000-4000-8000-000000000004") },
                    { new Guid("d1000000-0000-4000-8004-000000000007"), "24/7", true, null, new Guid("f1000000-0000-4000-8000-000000000007"), false, new Guid("b1000000-0000-4000-8000-000000000004") },
                    { new Guid("d1000000-0000-4000-8004-000000000008"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000008"), false, new Guid("b1000000-0000-4000-8000-000000000004") },
                    { new Guid("d1000000-0000-4000-8004-000000000010"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000010"), false, new Guid("b1000000-0000-4000-8000-000000000004") },
                    { new Guid("d1000000-0000-4000-8004-000000000011"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000011"), false, new Guid("b1000000-0000-4000-8000-000000000004") },
                    { new Guid("d1000000-0000-4000-8004-000000000012"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000012"), false, new Guid("b1000000-0000-4000-8000-000000000004") },
                    { new Guid("d1000000-0000-4000-8004-000000000013"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000013"), false, new Guid("b1000000-0000-4000-8000-000000000004") },
                    { new Guid("d1000000-0000-4000-8004-000000000014"), null, true, null, new Guid("f1000000-0000-4000-8000-000000000014"), false, new Guid("b1000000-0000-4000-8000-000000000004") }
                });

            migrationBuilder.InsertData(
                table: "PlanPrices",
                columns: new[] { "Id", "Amount", "Currency", "Interval", "IsActive", "Is_Deleted", "Plan_Id", "Region_Code", "StripePriceId", "StripeProductId" },
                values: new object[,]
                {
                    { new Guid("c1000000-0000-4000-8000-000000000001"), 0m, "USD", "monthly", true, false, new Guid("b1000000-0000-4000-8000-000000000001"), "GLOBAL", "price_free_monthly", "prod_free" },
                    { new Guid("c1000000-0000-4000-8000-000000000002"), 0m, "USD", "yearly", true, false, new Guid("b1000000-0000-4000-8000-000000000001"), "GLOBAL", "price_free_yearly", "prod_free" },
                    { new Guid("c1000000-0000-4000-8000-000000000003"), 19m, "USD", "monthly", true, false, new Guid("b1000000-0000-4000-8000-000000000002"), "GLOBAL", "price_basic_monthly", "prod_basic" },
                    { new Guid("c1000000-0000-4000-8000-000000000004"), 190m, "USD", "yearly", true, false, new Guid("b1000000-0000-4000-8000-000000000002"), "GLOBAL", "price_basic_yearly", "prod_basic" },
                    { new Guid("c1000000-0000-4000-8000-000000000005"), 49m, "USD", "monthly", true, false, new Guid("b1000000-0000-4000-8000-000000000003"), "GLOBAL", "price_professional_monthly", "prod_professional" },
                    { new Guid("c1000000-0000-4000-8000-000000000006"), 490m, "USD", "yearly", true, false, new Guid("b1000000-0000-4000-8000-000000000003"), "GLOBAL", "price_professional_yearly", "prod_professional" },
                    { new Guid("c1000000-0000-4000-8000-000000000007"), 99m, "USD", "monthly", true, false, new Guid("b1000000-0000-4000-8000-000000000004"), "GLOBAL", "price_enterprise_monthly", "prod_enterprise" },
                    { new Guid("c1000000-0000-4000-8000-000000000008"), 990m, "USD", "yearly", true, false, new Guid("b1000000-0000-4000-8000-000000000004"), "GLOBAL", "price_enterprise_yearly", "prod_enterprise" }
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_AccessLogs_User_Id",
                table: "AccessLogs",
                column: "User_Id");

            migrationBuilder.CreateIndex(
                name: "IX_BillingHistories_Plan_Id",
                table: "BillingHistories",
                column: "Plan_Id");

            migrationBuilder.CreateIndex(
                name: "IX_BillingHistories_Tenant_Id",
                table: "BillingHistories",
                column: "Tenant_Id");

            migrationBuilder.CreateIndex(
                name: "IX_CertificateAccessLogs_Instance_Id",
                table: "CertificateAccessLogs",
                column: "Instance_Id");

            migrationBuilder.CreateIndex(
                name: "IX_CertificateInstances_Created_By",
                table: "CertificateInstances",
                column: "Created_By");

            migrationBuilder.CreateIndex(
                name: "IX_CertificateInstances_Template_Id",
                table: "CertificateInstances",
                column: "Template_Id");

            migrationBuilder.CreateIndex(
                name: "IX_CertificateInstances_Tenant_Id",
                table: "CertificateInstances",
                column: "Tenant_Id");

            migrationBuilder.CreateIndex(
                name: "IX_CertificateInstances_Unit_Id",
                table: "CertificateInstances",
                column: "Unit_Id");

            migrationBuilder.CreateIndex(
                name: "IX_CertificateTemplates_Created_By",
                table: "CertificateTemplates",
                column: "Created_By");

            migrationBuilder.CreateIndex(
                name: "IX_CertificateTemplates_Last_Modified_By",
                table: "CertificateTemplates",
                column: "Last_Modified_By");

            migrationBuilder.CreateIndex(
                name: "IX_CertificateTemplates_Tenant_Id",
                table: "CertificateTemplates",
                column: "Tenant_Id");

            migrationBuilder.CreateIndex(
                name: "IX_CertificateTemplateVariables_Template_Id",
                table: "CertificateTemplateVariables",
                column: "Template_Id");

            migrationBuilder.CreateIndex(
                name: "IX_CertificateVariableValues_Instance_Id",
                table: "CertificateVariableValues",
                column: "Instance_Id");

            migrationBuilder.CreateIndex(
                name: "IX_CertificateVariableValues_Variable_Id",
                table: "CertificateVariableValues",
                column: "Variable_Id");

            migrationBuilder.CreateIndex(
                name: "IX_EmailSendingLogs_Created_By",
                table: "EmailSendingLogs",
                column: "Created_By");

            migrationBuilder.CreateIndex(
                name: "IX_EmailSendingLogs_Last_Modified_By",
                table: "EmailSendingLogs",
                column: "Last_Modified_By");

            migrationBuilder.CreateIndex(
                name: "IX_EmailSendingLogs_Template_Id",
                table: "EmailSendingLogs",
                column: "Template_Id");

            migrationBuilder.CreateIndex(
                name: "IX_EmailSendingLogs_TenantId",
                table: "EmailSendingLogs",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailSendingLogs_UnitId",
                table: "EmailSendingLogs",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_Created_By",
                table: "EmailTemplates",
                column: "Created_By");

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_Last_Modified_By",
                table: "EmailTemplates",
                column: "Last_Modified_By");

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_TenantId",
                table: "EmailTemplates",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailTemplates_UnitId",
                table: "EmailTemplates",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_GlobalAttachments_Created_By",
                table: "GlobalAttachments",
                column: "Created_By");

            migrationBuilder.CreateIndex(
                name: "IX_PlanFeatures_Feature_Id",
                table: "PlanFeatures",
                column: "Feature_Id");

            migrationBuilder.CreateIndex(
                name: "IX_PlanFeatures_Plan_Id",
                table: "PlanFeatures",
                column: "Plan_Id");

            migrationBuilder.CreateIndex(
                name: "IX_PlanPrices_Plan_Id",
                table: "PlanPrices",
                column: "Plan_Id");

            migrationBuilder.CreateIndex(
                name: "IX_PlanPrices_Region_Code",
                table: "PlanPrices",
                column: "Region_Code");

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_Permission_Id",
                table: "RolePermissions",
                column: "Permission_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Tenant_Id",
                table: "Roles",
                column: "Tenant_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_Plan_Id",
                table: "Subscriptions",
                column: "Plan_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_StripeSubscriptionId",
                table: "Subscriptions",
                column: "StripeSubscriptionId");

            migrationBuilder.CreateIndex(
                name: "IX_Subscriptions_Tenant_Id",
                table: "Subscriptions",
                column: "Tenant_Id");

            migrationBuilder.CreateIndex(
                name: "IX_SystemRolePermissions_Permission_Id",
                table: "SystemRolePermissions",
                column: "Permission_Id");

            migrationBuilder.CreateIndex(
                name: "IX_TenantBrands_Created_By",
                table: "TenantBrands",
                column: "Created_By");

            migrationBuilder.CreateIndex(
                name: "IX_TenantBrands_Last_Modified_By",
                table: "TenantBrands",
                column: "Last_Modified_By");

            migrationBuilder.CreateIndex(
                name: "IX_TenantBrands_Tenant_Id",
                table: "TenantBrands",
                column: "Tenant_Id");

            migrationBuilder.CreateIndex(
                name: "IX_TenantPlans_Created_By",
                table: "TenantPlans",
                column: "Created_By");

            migrationBuilder.CreateIndex(
                name: "IX_TenantPlans_Last_Modified_By",
                table: "TenantPlans",
                column: "Last_Modified_By");

            migrationBuilder.CreateIndex(
                name: "IX_TenantPlans_Plan_Id",
                table: "TenantPlans",
                column: "Plan_Id");

            migrationBuilder.CreateIndex(
                name: "IX_TenantPlans_Region_Code",
                table: "TenantPlans",
                column: "Region_Code");

            migrationBuilder.CreateIndex(
                name: "IX_TenantPlans_Tenant_Id",
                table: "TenantPlans",
                column: "Tenant_Id");

            migrationBuilder.CreateIndex(
                name: "IX_UnitBrands_Created_By",
                table: "UnitBrands",
                column: "Created_By");

            migrationBuilder.CreateIndex(
                name: "IX_UnitBrands_Last_Modified_By",
                table: "UnitBrands",
                column: "Last_Modified_By");

            migrationBuilder.CreateIndex(
                name: "IX_UnitBrands_Unit_Id",
                table: "UnitBrands",
                column: "Unit_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Units_Tenant_Id",
                table: "Units",
                column: "Tenant_Id");

            migrationBuilder.CreateIndex(
                name: "IX_UserLoginLogs_User_Id",
                table: "UserLoginLogs",
                column: "User_Id");

            migrationBuilder.CreateIndex(
                name: "IX_UserPermissions_Permission_Id",
                table: "UserPermissions",
                column: "Permission_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Role_Id",
                table: "Users",
                column: "Role_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Tenant_Id",
                table: "Users",
                column: "Tenant_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Unit_Id",
                table: "Users",
                column: "Unit_Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccessLogs");

            migrationBuilder.DropTable(
                name: "BillingHistories");

            migrationBuilder.DropTable(
                name: "CertificateAccessLogs");

            migrationBuilder.DropTable(
                name: "CertificateVariableValues");

            migrationBuilder.DropTable(
                name: "EmailSendingLogs");

            migrationBuilder.DropTable(
                name: "GlobalAttachments");

            migrationBuilder.DropTable(
                name: "PlanFeatures");

            migrationBuilder.DropTable(
                name: "PlanPrices");

            migrationBuilder.DropTable(
                name: "RolePermissions");

            migrationBuilder.DropTable(
                name: "Subscriptions");

            migrationBuilder.DropTable(
                name: "SystemRolePermissions");

            migrationBuilder.DropTable(
                name: "TenantBrands");

            migrationBuilder.DropTable(
                name: "TenantFeatureOverrides");

            migrationBuilder.DropTable(
                name: "TenantPlans");

            migrationBuilder.DropTable(
                name: "UnitBrands");

            migrationBuilder.DropTable(
                name: "UserLoginLogs");

            migrationBuilder.DropTable(
                name: "UserPermissions");

            migrationBuilder.DropTable(
                name: "CertificateInstances");

            migrationBuilder.DropTable(
                name: "CertificateTemplateVariables");

            migrationBuilder.DropTable(
                name: "EmailTemplates");

            migrationBuilder.DropTable(
                name: "Features");

            migrationBuilder.DropTable(
                name: "SystemRoles");

            migrationBuilder.DropTable(
                name: "Plans");

            migrationBuilder.DropTable(
                name: "Regions");

            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.DropTable(
                name: "CertificateTemplates");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Units");

            migrationBuilder.DropTable(
                name: "Tenants");
        }
    }
}

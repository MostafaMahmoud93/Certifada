using Certifada.Domain.Entities.Certificate;
using Certifada.Domain.Entities.Payment;
using System.ComponentModel.DataAnnotations.Schema;

namespace Certifada.Infrastructure.DBContext;
public class Certifada_DbContext : DbContext
{
    private readonly IUserAccessor _userAccessor;
    public Certifada_DbContext(DbContextOptions<Certifada_DbContext> options, IUserAccessor userAccessor) : base(options)
    {
        _userAccessor = userAccessor;
    }
    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(builder);
        ViewsConfiguration.Configuration(builder);
        FunctionsConfiguration.Configuration(builder);
        ProceduresConfiguration.Configuration(builder);
        // Seed the init data
        SeedInitialData.InitialData(builder);
    }
    #region Tables
    //public virtual DbSet<###> ###s { get; set; } // New Table
    #region Identity
    public virtual DbSet<TenantFeatureOverride> TenantFeatureOverrides { get; set; }
    public virtual DbSet<SystemRolePermission> SystemRolePermissions { get; set; }
    public virtual DbSet<RolePermission> RolePermissions { get; set; }
    public virtual DbSet<UserRole> UserRoles { get; set; }
    public virtual DbSet<TenantBranding> TenantBrands { get; set; }
    public virtual DbSet<UserLoginLog> UserLoginLogs { get; set; }
    public virtual DbSet<UnitBranding> UnitBrands { get; set; }
    public virtual DbSet<Permission> Permissions { get; set; }
    public virtual DbSet<SystemRole> SystemRoles { get; set; }
    public virtual DbSet<Tenant> Tenants { get; set; }
    public virtual DbSet<Unit> Units { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<Role> Roles { get; set; }
    #endregion
    #region Common
    public virtual DbSet<GlobalAttachment> GlobalAttachments { get; set; }
    public virtual DbSet<EmailSendingLog> EmailSendingLogs { get; set; }
    public virtual DbSet<EmailTemplate> EmailTemplates { get; set; }
    public virtual DbSet<AccessLog> AccessLogs { get; set; }
    #endregion
    #region Payment
    public virtual DbSet<PlanFeature> PlanFeatures { get; set; }
    public virtual DbSet<PlanPrice> PlanPrices { get; set; }
    public virtual DbSet<TenantPlan> TenantPlans { get; set; }
    public virtual DbSet<Feature> Features { get; set; }
    public virtual DbSet<Region> Regions { get; set; }
    public virtual DbSet<Plan> Plans { get; set; }
    public virtual DbSet<BillingHistory> BillingHistories { get; set; }
    public virtual DbSet<Subscription> Subscriptions { get; set; }
    #endregion
    #region Certificate
    public virtual DbSet<CertificateTemplateVariable> CertificateTemplateVariables { get; set; }
    public virtual DbSet<CertificateVariableValue> CertificateVariableValues { get; set; }
    public virtual DbSet<CertificateAccessLog> CertificateAccessLogs { get; set; }
    public virtual DbSet<CertificateTemplate> CertificateTemplates { get; set; }
    public virtual DbSet<CertificateInstance> CertificateInstances { get; set; }
    #endregion
    #endregion
    #region Views
    //public virtual DbSet<VW_UserActions> VW_UserActions { get; set; }
    #endregion
    #region Procedures
    #endregion
    #region AuditSaveChanges
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = new CancellationToken())
    {
        var currentUserId = _userAccessor.GetCurrentUserId();
        Guid resolvedUserId;
        if (!string.IsNullOrEmpty(currentUserId))
        {
            resolvedUserId = Guid.Parse(currentUserId);
        }
        else
        {
            // Fall back to an active admin only when there is no authenticated user.
            var taskUser = await Users.FirstOrDefaultAsync(x => x.Is_Active);
            resolvedUserId = taskUser?.Id ?? Guid.Empty;
        }
        foreach (var entry in ChangeTracker.Entries<FullBaseEntity<Guid>>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.Created_By = resolvedUserId;
                    entry.Entity.Create_Date = DateTime.Now;
                    break;

                case EntityState.Modified:
                    entry.Entity.Last_Modified_By = entry.Entity.Last_Modified_By != null ? entry.Entity.Last_Modified_By : resolvedUserId;
                    entry.Entity.Last_Modify_Date = DateTime.Now;
                    break;

            }
        }
        foreach (var entry in ChangeTracker.Entries<FullBaseEntity<int>>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.Created_By = resolvedUserId;
                    entry.Entity.Create_Date = DateTime.Now;
                    break;

                case EntityState.Modified:
                    entry.Entity.Last_Modified_By = entry.Entity.Last_Modified_By != null ? entry.Entity.Last_Modified_By : resolvedUserId;
                    entry.Entity.Last_Modify_Date = DateTime.Now;
                    break;

            }
        }
        //if (ChangeTracker.Entries<User>().Any())
        //{
        //    foreach (var entry in ChangeTracker.Entries<User>())
        //    {
        //        switch (entry.State)
        //        {
        //            case EntityState.Added:
        //                entry.Entity.Created_By = Guid.Parse(_userAccessor.GetCurrentUserId() ?? taskUser.Id.ToString());
        //                entry.Entity.Create_Date = DateTime.Now;
        //                break;
        //            case EntityState.Modified:
        //                entry.Entity.Last_Modified_By = entry.Entity.Last_Modified_By != null ? entry.Entity.Last_Modified_By : Guid.Parse(_userAccessor.GetCurrentUserId() ?? taskUser.Id.ToString());
        //                entry.Entity.Last_Modify_Date = DateTime.Now;
        //                break;
        //        }
        //    }
        //}

        return await base.SaveChangesAsync(cancellationToken);
    }
    #endregion
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseLazyLoadingProxies();
    }
}

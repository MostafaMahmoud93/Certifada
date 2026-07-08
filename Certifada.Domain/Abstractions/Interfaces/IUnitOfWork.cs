using Certifada.Domain.Entities.Certificate;
using Certifada.Domain.Entities.Payment;
using Microsoft.EntityFrameworkCore;

namespace Certifada.Domain.Abstractions.Interfaces;
public interface IUnitOfWork
{
    #region Repositories
    IBaseRepository<CertificateTemplateVariable, Guid> CertificateTemplateVariableRepository { get; }
    IBaseRepository<CertificateVariableValue, Guid> CertificateVariableValueRepository { get; }
    IBaseRepository<TenantFeatureOverride, Guid> TenantFeatureOverrideRepository { get; }
    IBaseRepository<CertificateAccessLog, Guid> CertificateAccessLogRepository { get; }
    ICustomBaseRepository<SystemRolePermission> SystemRolePermissionRepository { get; }
    IBaseRepository<CertificateTemplate, Guid> CertificateTemplateRepository { get; }
    IBaseRepository<CertificateInstance, Guid> CertificateInstanceRepository { get; }
    IBaseRepository<GlobalAttachment, Guid> GlobalAttachmentRepository { get; }
    IBaseRepository<EmailSendingLog, Guid> EmailSendingLogRepository { get; }
    IBaseRepository<TenantBranding, Guid> TenantBrandingRepository { get; }
    ICustomBaseRepository<RolePermission> RolePermissionRepository { get; }
    ICustomBaseRepository<UserRole> UserRoleRepository { get; }
    IBaseRepository<EmailTemplate, Guid> EmailTemplateRepository { get; }
    IBaseRepository<UnitBranding, Guid> UnitBrandingRepository { get; }
    IBaseRepository<UserLoginLog, Guid> UserLoginLogRepository { get; }
    IBaseRepository<PlanFeature, Guid> PlanFeatureRepository { get; }
    IBaseRepository<Permission, Guid> PermissionRepository { get; }
    IBaseRepository<SystemRole, Guid> SystemRoleRepository { get; }
    IBaseRepository<PlanPrice, Guid> PlanPriceRepository { get; }
    IBaseRepository<AccessLog, int> AccessLogRepository { get; }
    IBaseRepository<TenantPlan, Guid> TenantPlanRepository { get; }
    ICustomBaseRepository<VW_UserActions> VWUserActions { get; }
    IBaseRepository<Feature, Guid> FeatureRepository { get; }
    IBaseRepository<Tenant, Guid> TenantRepository { get; }
    IBaseRepository<Region, int> RegionRepository { get; }
    IBaseRepository<Unit, Guid> UnitRepository { get; }
    IBaseRepository<User, Guid> UserRepository { get; }
    IBaseRepository<Role, Guid> RoleRepository { get; }
    IBaseRepository<Plan, Guid> PlanRepository { get; }
    #endregion
    Task<string> ExecuteSqlQueryAsync(string sqlQuery, params object?[] parameters);
    Task<Dictionary<string, string>> TestDBTablesAsync();
    Task<int> SaveChangesAsync();
    Task<bool> TestDBAsync();
    void RejectChanges();
    void ClearTracker();
    void Dispose();
}

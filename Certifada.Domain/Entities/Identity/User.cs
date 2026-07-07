using Certifada.Domain.Entities.Certificate;
using Certifada.Domain.Entities.Payment;

namespace Certifada.Domain.Entities.Identity
{
    public class User : BaseCommonEntity<Guid>
    {
        public Guid? Tenant_Id { get; set; }
        public Guid? Unit_Id { get; set; }
        public Guid? Role_Id { get; set; }
        public string Full_Name { get; set; }
        public string Email { get; set; }
        public string? Password_Hash { get; set; }
        public string? Profile_Picture_URL { get; set; }
        public string? Signature_URL { get; set; }
        public bool Is_Active { get; set; }
        /// <summary>Email sign-ups must verify their address before signing in. Social sign-ups are auto-confirmed.</summary>
        public bool Email_Confirmed { get; set; }
        public string? Provider_Id { get; set; }
        public string? Provider_Name { get; set; }
        public DateTime Create_Date { get; set; } = DateTime.Now;
        public virtual Tenant Tenant { get; set; }
        public virtual Unit Unit { get; set; }
        public virtual Role Role { get; set; }
        public virtual ICollection<GlobalAttachment>? Attachments { get; set; }
        public virtual ICollection<UserPermission> UserPermissions { get; set; }
        public virtual ICollection<AccessLog> AccessLogs { get; set; }
        public virtual ICollection<UserLoginLog> UserLoginLogs { get; set; }
        public virtual ICollection<UnitBranding> UserCreatedUnitBrands { get; set; }
        public virtual ICollection<UnitBranding> UserUpdatedUnitBrands { get; set; }
        public virtual ICollection<TenantBranding> UserCreatedTenantBrands { get; set; }
        public virtual ICollection<TenantBranding> UserUpdatedTenantBrands { get; set; }
        public virtual ICollection<TenantPlan> UserCreatedTenantPlans { get; set; }
        public virtual ICollection<TenantPlan> UserUpdatedTenantPlans { get; set; }
        public virtual ICollection<EmailTemplate> UserCreatedEmailTemplates { get; set; }
        public virtual ICollection<EmailTemplate> UserUpdatedEmailTemplates { get; set; }
        public virtual ICollection<EmailSendingLog> UserCreatedEmailSendingLogs { get; set; }
        public virtual ICollection<EmailSendingLog> UserUpdatedEmailSendingLogs { get; set; }
        public virtual ICollection<CertificateTemplate> UserCreatedCertificateTemplates { get; set; }
        public virtual ICollection<CertificateTemplate> UserUpdatedCertificateTemplates { get; set; }
        public virtual ICollection<CertificateInstance>? CertificateInstances { get; set; }
    }
}

using Certifada.Domain.Entities.Certificate;
using Certifada.Domain.Entities.Payment;

namespace Certifada.Domain.Entities.Identity
{
    public class Tenant : BaseCommonEntity<Guid>
    {
        public string Name { get; set; }
        public int? OrganizationType { get; set; }
        public int? ApplicantRole { get; set; }
        public bool Is_Active { get; set; }
        public DateTime Created_Date { get; set; } = DateTime.Now;
        public virtual ICollection<Role>? Roles { get; set; }
        public virtual ICollection<User>? Users { get; set; }
        public virtual ICollection<Unit>? Units { get; set; }
        public virtual ICollection<TenantPlan>? TenantPlans { get; set; }
        public virtual ICollection<TenantBranding>? TenantBrands { get; set; }
        public virtual ICollection<EmailSendingLog>? EmailSendingLogs { get; set; }
        public virtual ICollection<EmailTemplate>? EmailTemplates { get; set; }
        public virtual ICollection<CertificateTemplate>? CertificateTemplates { get; set; }
        public virtual ICollection<CertificateInstance>? CertificateInstances { get; set; }
    }
}
using Certifada.Domain.Entities.Certificate;

namespace Certifada.Domain.Entities.Identity
{
    public class Unit : BaseCommonEntity<Guid>
    {
        public Guid Tenant_Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public DateTime Create_Date { get; set; } = DateTime.Now;
        public virtual Tenant Tenant { get; set; }
        public virtual ICollection<User> Users { get; set; }
        public virtual ICollection<UnitBranding> UnitBrands { get; set; }
        public virtual ICollection<EmailSendingLog>? EmailSendingLogs { get; set; }
        public virtual ICollection<EmailTemplate>? EmailTemplates { get; set; }
        public virtual ICollection<CertificateInstance>? CertificateInstances { get; set; }
    }
}

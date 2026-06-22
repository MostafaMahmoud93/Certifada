using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Certificate
{
    public class CertificateInstance:BaseCommonEntity<Guid>
    {
        public Guid Template_Id { get; set; }
        public Guid Tenant_Id { get; set; }
        public Guid Unit_Id { get; set; }
        public string IssuedTo { get; set; }
        public DateTime? IssuedAt { get; set; }
        public Guid Created_By { get; set; }
        public string? Status { get; set; }
        public string? Download_Url { get; set; }
        public DateTime? PdfGeneratedAt { get; set; }
        public string? Notes { get; set; }
        public string? Data_Json { get; set; }
        public string? Format { get; set; }
        public string? Batch_Id { get; set; }
        public DateTime Created_Date { get; set; } = DateTime.Now;
        public Guid PublicLinkToken { get; set; }
        public string? Public_Url { get; set; }
        public string? Email { get; set; }
        public bool? SharedViaEmail { get; set; }
        public DateTime? EmailSentAt { get; set; }
        public int? PdfDownloadCount { get; set; }
        public int? ViewCount { get; set; }
        public DateTime? LastViewedAt { get; set; }
        public virtual Tenant Tenant { get; set; }
        public virtual Unit Unit { get; set; }
        public virtual User UserCreated { get; set; }
        public virtual CertificateTemplate CertificateTemplate { get; set; }
        public virtual ICollection<CertificateAccessLog> CertificateAccessLogs { get; set; }
        public virtual ICollection<CertificateVariableValue>? CertificateVariableValues { get; set; }
    }
}

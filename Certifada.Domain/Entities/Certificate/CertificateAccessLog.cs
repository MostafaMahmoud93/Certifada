using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Certificate
{
    public class CertificateAccessLog:BaseCommonEntity<Guid>
    {
        public Guid Instance_Id { get; set; }
        public string Action { get; set; }
        public DateTime? PerformedAt { get; set; }
        public string? PerformedByEmail { get; set; }
        public string? IPAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? Referrer { get; set; }
        public string? DeviceInfo { get; set; }
        public virtual CertificateInstance CertificateInstance { get; set; }
    }
}

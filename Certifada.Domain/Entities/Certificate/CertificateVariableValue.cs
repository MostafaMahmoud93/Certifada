using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Certificate
{
    public class CertificateVariableValue : BaseCommonEntity<Guid>
    {
        public Guid Instance_Id { get; set; }
        public Guid Variable_Id { get; set; }
        public string? Value { get; set; }
        public virtual CertificateTemplateVariable CertificateTemplateVariable { get; set; }
        public virtual CertificateInstance CertificateInstance { get; set; }
    }
}

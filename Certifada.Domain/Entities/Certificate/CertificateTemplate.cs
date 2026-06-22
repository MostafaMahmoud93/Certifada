using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Certificate
{
    public class CertificateTemplate:FullBaseEntity<Guid>
    {
        public Guid Tenant_Id { get; set; }
        public required string Name { get; set; }
        public string? Description { get; set; }
        public string? Design { get; set; }
        public string? Preview_Image_Url { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public string? Placeholders_Json { get; set; }
        public string? Status { get; set; }
        public virtual Tenant Tenant { get; set; }
        public virtual User UserCreated { get; set; }
        public virtual User? UserUpdated { get; set; }
        public virtual ICollection<CertificateTemplateVariable>? CertificateTemplateVariables { get; set; }
        public virtual ICollection<CertificateInstance>? CertificateInstances { get; set; }
    }
}

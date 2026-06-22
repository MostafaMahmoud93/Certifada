using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Certificate
{
    public class CertificateTemplateVariable:BaseCommonEntity<Guid>
    {
        public Guid Template_Id { get; set; }
        public string Name { get; set; }
        public string? Display_Name { get; set; }
        public required string Data_Type { get; set; }
        public bool? Is_Required { get; set; }
        public string? Default_Value { get; set; }
        public int? SortOrder { get; set; }
        public string? Placeholder { get; set; }
        public string? Validation_Regex { get; set; }
        public DateTime Created_Date { get; set; } = DateTime.Now;
        public virtual CertificateTemplate CertificateTemplate { get; set; }
        public virtual ICollection<CertificateVariableValue>? CertificateVariableValues { get; set; }
    }
}

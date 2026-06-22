using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Identity
{
    public class TenantFeatureOverride:BaseCommonEntity<Guid>
    {
        public Guid Tenant_Id { get; set; }
        public Guid Feature_Id { get; set; }
        public bool Enabled { get; set; }
    }
}

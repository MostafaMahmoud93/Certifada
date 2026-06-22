using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Payment
{
    public class Feature : BaseCommonEntity<Guid>
    {
        public required string Feature_Key { get; set; }
        public required string Name { get; set; }
        public string? Description { get; set; }
        public int SortOrder { get; set; }
        public bool Is_Active { get; set; }
        public virtual ICollection<PlanFeature>? PlanFeatures { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Payment
{
    public class Region:BaseCommonEntity<int>
    {
        public required string Region_Code { get; set; }
        public required string Label { get; set; }
        public required string Currency { get; set; }
        public virtual ICollection<TenantPlan> TenantPlans { get; set; }
        //????
        public virtual ICollection<PlanPrice>? PlanPrices { get; set; }
    }
}

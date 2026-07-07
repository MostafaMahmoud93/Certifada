using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Payment
{
    public class PlanFeature : BaseCommonEntity<Guid>
    {
        public Guid Plan_Id { get; set; }
        public Guid Feature_Id { get; set; }
        public bool Enabled { get; set; }
        public int? FeatureTimes { get; set; }
        /// <summary>Human-readable value shown on the pricing page (e.g. "10 GB", "5,000", "24/7", "Unlimited").</summary>
        public string? Display_Value { get; set; }
        public virtual Plan Plan { get; set; }
        public virtual Feature Feature { get; set; }
    }
}

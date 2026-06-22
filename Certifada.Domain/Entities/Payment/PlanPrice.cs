using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Payment
{
    public class PlanPrice:BaseCommonEntity<Guid>
    {
        public Guid Plan_Id { get; set; }
        public required string Region_Code { get; set; }
        public required string Interval { get; set; }
        public required decimal Amount { get; set; }
        public required string Currency { get; set; }
        public required string StripeProductId { get; set; }
        public required string StripePriceId { get; set; }
        public bool IsActive { get; set; }
        public virtual Region Region { get; set; }
        public virtual Plan Plan { get; set; }
    }
}

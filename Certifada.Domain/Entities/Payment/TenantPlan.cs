using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Payment
{
    public class TenantPlan : FullBaseEntity<Guid>
    {
        public Guid Tenant_Id { get; set; }
        public Guid Plan_Id { get; set; }
        public string Region_Code { get; set; }
        public string Interval { get; set; }
        public string? StripeCustomerId { get; set; }
        public string? StripeSubscriptionId { get; set; }
        /// <summary>active | trialing | canceling | canceled | past_due</summary>
        public string Status { get; set; }
        public DateTimeOffset? Current_Period_End { get; set; }
        public DateTimeOffset? Trial_End { get; set; }
        public DateTimeOffset? Cancel_At { get; set; }
        public virtual Tenant Tenant { get; set; }
        public virtual Region Region { get; set; }
        public virtual Plan Plan { get; set; }
        public virtual User UserCreated { get; set; }
        public virtual User? UserUpdated { get; set; }
    }
}

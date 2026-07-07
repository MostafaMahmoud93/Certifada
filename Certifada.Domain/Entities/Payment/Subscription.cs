namespace Certifada.Domain.Entities.Payment
{
    /// <summary>
    /// One row per Stripe subscription — the source of truth for the billing
    /// lifecycle (created by checkout, updated by webhooks and plan changes).
    /// TenantPlan stays in sync as the tenant's *current plan* pointer.
    /// </summary>
    public class Subscription : BaseCommonEntity<Guid>
    {
        public Guid Tenant_Id { get; set; }
        public Guid Plan_Id { get; set; }
        /// <summary>monthly | yearly</summary>
        public string Interval { get; set; } = "monthly";
        /// <summary>
        /// active | trialing | canceling | canceled | past_due | scheduled | ended.
        /// "scheduled" = a future phase created by a downgrade (starts at Started_On);
        /// "ended" = a past phase that was superseded by a scheduled one.
        /// </summary>
        public string Status { get; set; } = "active";
        public string? StripeCustomerId { get; set; }
        public string StripeSubscriptionId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public DateTime Started_On { get; set; } = DateTime.UtcNow;
        public DateTimeOffset? Current_Period_End { get; set; }
        public DateTimeOffset? Cancel_At { get; set; }
        public DateTime? Canceled_On { get; set; }
        /// <summary>Scheduled downgrade: the plan that takes effect at Scheduled_Change_On (user keeps the current plan until then).</summary>
        public Guid? Pending_Plan_Id { get; set; }
        public string? Pending_Interval { get; set; }
        public DateTimeOffset? Scheduled_Change_On { get; set; }
        public virtual Tenant Tenant { get; set; }
        public virtual Plan Plan { get; set; }
    }
}

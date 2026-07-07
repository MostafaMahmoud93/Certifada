namespace Certifada.Domain.Entities.Payment
{
    /// <summary>
    /// One billing event per row — payments, plan changes, cancellations —
    /// written by the Stripe webhook and the change-plan endpoint.
    /// </summary>
    public class BillingHistory : BaseCommonEntity<Guid>
    {
        public Guid Tenant_Id { get; set; }
        public Guid? Plan_Id { get; set; }
        public string Plan_Code { get; set; } = string.Empty;
        /// <summary>paid | payment_failed | plan_changed | cancel_scheduled | canceled | refunded</summary>
        public string Status { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        /// <summary>monthly | yearly</summary>
        public string? Interval { get; set; }
        public string? StripeCustomerId { get; set; }
        public string? StripeSubscriptionId { get; set; }
        public string? StripeInvoiceId { get; set; }
        public string? Description { get; set; }
        public DateTime Created_On { get; set; } = DateTime.UtcNow;
        public virtual Tenant Tenant { get; set; }
        public virtual Plan? Plan { get; set; }
    }
}

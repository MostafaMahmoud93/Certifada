using Stripe;

namespace Certifada.API.Services;

public interface IBillingService
{
    /// <summary>Hosted Stripe Checkout for a plan (creates the Stripe product/price on first use).</summary>
    Task<CheckoutResponse> CreateCheckoutForPlanAsync(Guid userId, string planCode, string interval);
    /// <summary>Upgrade/downgrade the tenant's live subscription (prorated); "Free" cancels at period end.</summary>
    Task<ChangePlanResponse> ChangePlanAsync(Guid userId, string planCode, string interval);
    /// <summary>The tenant's current subscription, if any.</summary>
    Task<SubscriptionView?> GetSubscriptionAsync(Guid userId);
    /// <summary>Billing events for the tenant, newest first.</summary>
    Task<List<BillingHistoryView>> GetHistoryAsync(Guid userId);
    /// <summary>Stripe billing portal (manage cards, invoices, cancellation).</summary>
    Task<string?> CreatePortalUrlAsync(Guid userId, string returnUrl);
    /// <summary>
    /// Confirms a paid Checkout session directly (from the success page) and
    /// persists the subscription — works without webhooks (localhost/dev) and
    /// is idempotent when the webhook also fires.
    /// </summary>
    Task<ConfirmCheckoutResponse> ConfirmCheckoutAsync(Guid userId, string sessionId);

    /// <summary>Processes a verified Stripe webhook event → TenantPlans + BillingHistories.</summary>
    Task HandleWebhookAsync(Event stripeEvent);
}

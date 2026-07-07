namespace Certifada.API.Services.Stripe;

public record StripeCheckoutSession(string Id, string Url);
public record StripeProductPrice(string ProductId, string PriceId);
/// <summary>Snapshot of a Checkout session used to confirm a payment server-side.</summary>
public record StripeSessionInfo(
    string Id, string? PaymentStatus, string? CustomerId, string? SubscriptionId,
    long? AmountTotal, string? Currency, string? ClientReferenceId, string? InvoiceId,
    Dictionary<string, string> Metadata);

/// <summary>
/// The ONLY place that talks to the Stripe SDK. Everything else (BillingService,
/// controllers) works against this interface, so the Stripe integration can be
/// tested, mocked, or swapped without touching business logic.
/// </summary>
public interface IStripeGateway
{
    /// <summary>
    /// Hosted Checkout session for a recurring price; returns its id + redirect URL.
    /// Pass <paramref name="existingCustomerId"/> when the tenant already has a
    /// Stripe customer so payments/credits stay on one customer record.
    /// </summary>
    Task<StripeCheckoutSession> CreateSubscriptionCheckoutAsync(
        string priceId, string customerEmail, string clientReferenceId,
        Dictionary<string, string> metadata, string successUrl, string cancelUrl,
        string? existingCustomerId = null);

    /// <summary>Cancels a subscription immediately, crediting unused time to the customer balance.</summary>
    Task CancelSubscriptionNowAsync(string subscriptionId);

    /// <summary>True when the price id exists in Stripe (placeholder ids return false).</summary>
    Task<bool> PriceExistsAsync(string priceId);

    /// <summary>Creates a product with one recurring price ("monthly"/"yearly").</summary>
    Task<StripeProductPrice> CreateProductWithRecurringPriceAsync(
        string name, string? description, decimal amount, string currency,
        string interval, Dictionary<string, string> metadata);

    /// <summary>
    /// Swaps the subscription's price. prorate=true → immediate with prorations
    /// (upgrades); prorate=false → no credits/charges now, the new price simply
    /// bills from the next cycle (scheduled downgrades).
    /// </summary>
    Task ChangeSubscriptionPriceAsync(string subscriptionId, string newPriceId, bool prorate = true);

    /// <summary>Schedules cancellation at the end of the current period.</summary>
    Task CancelAtPeriodEndAsync(string subscriptionId);

    /// <summary>Undoes a scheduled cancellation (CancelAtPeriodEnd = false).</summary>
    Task ResumeSubscriptionAsync(string subscriptionId);

    /// <summary>Billing-portal URL for managing cards, invoices and cancellation.</summary>
    Task<string> CreateBillingPortalUrlAsync(string customerId, string returnUrl);

    /// <summary>Retrieves a Checkout session to confirm the payment without relying on webhooks.</summary>
    Task<StripeSessionInfo> GetCheckoutSessionAsync(string sessionId);
}

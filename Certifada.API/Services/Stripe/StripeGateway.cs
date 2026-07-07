using Stripe;
using Stripe.Checkout;
using StripeSdk = Stripe;

namespace Certifada.API.Services.Stripe;

/// <summary>Concrete Stripe SDK implementation — see <see cref="IStripeGateway"/>.</summary>
public class StripeGateway : IStripeGateway
{
    private readonly StripeClient _stripe;
    public StripeGateway(StripeClient stripeClient) => _stripe = stripeClient;

    public async Task<StripeCheckoutSession> CreateSubscriptionCheckoutAsync(
        string priceId, string customerEmail, string clientReferenceId,
        Dictionary<string, string> metadata, string successUrl, string cancelUrl,
        string? existingCustomerId = null)
    {
        var options = new SessionCreateOptions
        {
            Mode = "subscription",
            ClientReferenceId = clientReferenceId,
            SuccessUrl = successUrl,
            CancelUrl = cancelUrl,
            LineItems = new List<SessionLineItemOptions> { new() { Price = priceId, Quantity = 1 } },
            Metadata = metadata,
            SubscriptionData = new SessionSubscriptionDataOptions { Metadata = metadata },
            AllowPromotionCodes = true,
        };
        // One Stripe customer per tenant: reuse it so upgrade credits apply to future invoices.
        if (!string.IsNullOrEmpty(existingCustomerId)) options.Customer = existingCustomerId;
        else options.CustomerEmail = customerEmail;

        var session = await new SessionService(_stripe).CreateAsync(options);
        return new StripeCheckoutSession(session.Id, session.Url);
    }

    public Task ResumeSubscriptionAsync(string subscriptionId) =>
        new SubscriptionService(_stripe).UpdateAsync(subscriptionId,
            new SubscriptionUpdateOptions { CancelAtPeriodEnd = false });

    public Task CancelSubscriptionNowAsync(string subscriptionId) =>
        new SubscriptionService(_stripe).CancelAsync(subscriptionId,
            new SubscriptionCancelOptions { Prorate = true }); // unused time → customer balance credit

    public async Task<bool> PriceExistsAsync(string priceId)
    {
        if (string.IsNullOrWhiteSpace(priceId)) return false;
        try { return await new PriceService(_stripe).GetAsync(priceId) != null; }
        catch (StripeException) { return false; } // placeholder / unknown id
    }

    public async Task<StripeProductPrice> CreateProductWithRecurringPriceAsync(
        string name, string? description, decimal amount, string currency,
        string interval, Dictionary<string, string> metadata)
    {
        var product = await new ProductService(_stripe).CreateAsync(new ProductCreateOptions
        {
            Name = name,
            Description = string.IsNullOrWhiteSpace(description) ? null : description,
            Metadata = metadata
        });
        var price = await new PriceService(_stripe).CreateAsync(new PriceCreateOptions
        {
            Product = product.Id,
            UnitAmount = (long)(amount * 100),
            Currency = currency.ToLowerInvariant(),
            Recurring = new PriceRecurringOptions { Interval = interval.ToLower() == "yearly" ? "year" : "month" },
            Metadata = metadata
        });
        return new StripeProductPrice(product.Id, price.Id);
    }

    public async Task ChangeSubscriptionPriceAsync(string subscriptionId, string newPriceId, bool prorate = true)
    {
        var svc = new SubscriptionService(_stripe);
        var sub = await svc.GetAsync(subscriptionId);
        var itemId = sub.Items.Data.First().Id;
        await svc.UpdateAsync(subscriptionId, new SubscriptionUpdateOptions
        {
            Items = new List<SubscriptionItemOptions> { new() { Id = itemId, Price = newPriceId } },
            // "always_invoice": the prorated difference is invoiced AND charged
            // immediately on upgrade (card on file) — the user sees the charge
            // right away instead of it hiding on next month's invoice.
            ProrationBehavior = prorate ? "always_invoice" : "none",
            CancelAtPeriodEnd = false,
        });
    }

    public Task CancelAtPeriodEndAsync(string subscriptionId) =>
        new SubscriptionService(_stripe).UpdateAsync(subscriptionId,
            new SubscriptionUpdateOptions { CancelAtPeriodEnd = true });

    public async Task<StripeSessionInfo> GetCheckoutSessionAsync(string sessionId)
    {
        var s = await new SessionService(_stripe).GetAsync(sessionId);
        return new StripeSessionInfo(
            s.Id, s.PaymentStatus, s.CustomerId, s.SubscriptionId,
            s.AmountTotal, s.Currency, s.ClientReferenceId, s.InvoiceId,
            s.Metadata ?? new Dictionary<string, string>());
    }

    public async Task<string> CreateBillingPortalUrlAsync(string customerId, string returnUrl)
    {
        var portal = await new StripeSdk.BillingPortal.SessionService(_stripe).CreateAsync(
            new StripeSdk.BillingPortal.SessionCreateOptions { Customer = customerId, ReturnUrl = returnUrl });
        return portal.Url;
    }
}

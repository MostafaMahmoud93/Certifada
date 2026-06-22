using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;
using Certifada.API.Options;

namespace Certifada.API.Services;

public class BillingService : IBillingService
{
    private readonly SessionService _checkoutSessionService;
    private readonly Stripe.BillingPortal.SessionService _portalSessionService;
    private readonly StripeOptions _opts;

    public BillingService(StripeClient stripeClient, IOptions<StripeOptions> opts)
    {
        _opts = opts.Value;
        _checkoutSessionService = new SessionService(stripeClient);
        _portalSessionService = new Stripe.BillingPortal.SessionService(stripeClient);
    }

    public async Task<Session> CreateCheckoutSessionAsync(
        string priceId,
        string? userId,
        Dictionary<string, string>? metadata)
    {
        var create = new SessionCreateOptions
        {
            Mode = "subscription",
            ClientReferenceId = userId, // later helpful in webhooks to map user↔customer
            SuccessUrl = _opts.SuccessUrl,
            CancelUrl = _opts.CancelUrl,
            LineItems = new List<SessionLineItemOptions>
            {
                new() { Price = priceId, Quantity = 1 }
            },
            Metadata = metadata,
            SubscriptionData = new SessionSubscriptionDataOptions
            {
                Metadata = metadata
            },
        };

        var session = await _checkoutSessionService.CreateAsync(create);
        return session;
    }

    public async Task<Stripe.BillingPortal.Session> CreateBillingPortalSessionAsync(
        string customerId,
        string returnUrl)
    {
        var create = new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = customerId,
            ReturnUrl = returnUrl
        };
        return await _portalSessionService.CreateAsync(create);
    }

    public async Task<Session> GetCheckoutSessionAsync(string sessionId)
    {
        var get = new SessionGetOptions
        {
            Expand = new List<string>
            {
                "line_items",
                "subscription",
                "customer"
            }
        };
        return await _checkoutSessionService.GetAsync(sessionId, get);
    }
    
}

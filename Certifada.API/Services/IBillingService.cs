using Stripe.Checkout;

namespace Certifada.API.Services;

public interface IBillingService
{
    Task<Session> CreateCheckoutSessionAsync(string priceId, string? userId, Dictionary<string, string>? metadata);
    Task<Stripe.BillingPortal.Session> CreateBillingPortalSessionAsync(string customerId, string returnUrl);
    Task<Session> GetCheckoutSessionAsync(string sessionId);

}

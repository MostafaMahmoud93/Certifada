using Certifada.API.Options;
using Certifada.API.Services;
using Microsoft.Extensions.Options;
using Stripe;

namespace Certifada.API.Controllers;

/// <summary>Stripe → Certifada: verified events update TenantPlans + BillingHistories.</summary>
[ApiController]
[Route("api/stripe/webhook")]
public class WebhooksController : ControllerBase
{
    private readonly StripeOptions _opts;
    private readonly IBillingService _billing;

    public WebhooksController(IOptions<StripeOptions> opts, IBillingService billing)
    {
        _opts = opts.Value;
        _billing = billing;
    }

    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Handle()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        Event stripeEvent;
        try
        {
            // Signature verification — never process unsigned payloads.
            stripeEvent = EventUtility.ConstructEvent(json, Request.Headers["Stripe-Signature"], _opts.WebhookSecret);
        }
        catch (Exception ex)
        {
            return BadRequest($"Webhook signature verification failed: {ex.Message}");
        }

        try
        {
            await _billing.HandleWebhookAsync(stripeEvent);
        }
        catch
        {
            // Respond 200 anyway so Stripe doesn't retry forever on a mapping bug;
            // the event can be replayed from the Stripe dashboard after a fix.
        }
        return Ok();
    }
}

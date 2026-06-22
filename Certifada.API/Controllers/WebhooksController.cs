using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;
using Certifada.API.Options;

namespace Certifada.API.Controllers;

[ApiController]
[Route("api/stripe/webhook")]
public class WebhooksController : ControllerBase
{
    private readonly StripeOptions _opts;

    public WebhooksController(IOptions<StripeOptions> opts) => _opts = opts.Value;

    [HttpPost]
    public async Task<IActionResult> Handle()
    {
        // 1) Read the raw body as string
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();

        // 2) Verify signature (very important)
        var signatureHeader = Request.Headers["Stripe-Signature"];
        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(json, signatureHeader, _opts.WebhookSecret);
        }
        catch (Exception ex)
        {
            return BadRequest($"Webhook signature verification failed: {ex.Message}");
        }

        // 3) Handle the event types you care about
        switch (stripeEvent.Type)
        {
            case "checkout.session.completed":
            {
                var session = stripeEvent.Data.Object as Session;
                if (session is not null)
                {
                    // Example: read identifiers
                    var stripeCustomerId = session.CustomerId;  // cus_...
                    var sessionId        = session.Id;          // cs_...
                    var clientRef        = session.ClientReferenceId; // your app user id if you set it
                    var subId            = session.SubscriptionId;    // sub_... (created)

                    // TODO: upsert your DB:
                    // - map clientRef (your user) -> stripeCustomerId
                    // - store subId, status, current period end, plan id (from metadata), etc.
                }
                break;
            }
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
            {
                var sub = stripeEvent.Data.Object as Stripe.Subscription;
                if (sub is not null)
                {
                    // TODO: update your DB with sub.Status, cancel_at, current_period_end, etc.
                }
                break;
            }
            default:
                // Ignore other events
                break;
        }

        return Ok();
    }
}

using Certifada.API.Services;

namespace Certifada.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billing;

    public BillingController(IBillingService billing) => _billing = billing;

    [HttpPost("create-checkout-session")]
    public async Task<ActionResult<CreateCheckoutResponse>> CreateCheckoutSession([FromBody] CreateCheckoutRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.priceId))
            return BadRequest("priceId is required.");

        // TODO: replace with your authenticated user id (from JWT/cookie)
        var userId = User?.Identity?.IsAuthenticated == true
            ? User.Identity!.Name
            : "anon";

        var metadata = new Dictionary<string, string>
        {
            ["planId"] = req.planId ?? string.Empty,
            ["interval"] = req.interval ?? string.Empty,
            ["region"] = req.region ?? string.Empty
        };

        var session = await _billing.CreateCheckoutSessionAsync(req.priceId, userId, metadata);
        return Ok(new CreateCheckoutResponse(session.Id));
    }

    // (Optional) Billing portal if you need "Manage billing" later
    // POST /api/billing/portal-session?customerId=cus_123&returnUrl=https://yourapp/account
    [HttpPost("portal-session")]
    public async Task<ActionResult<object>> CreatePortalSession([FromQuery] string customerId, [FromQuery] string returnUrl)
    {
        if (string.IsNullOrWhiteSpace(customerId)) return BadRequest("customerId required.");
        if (string.IsNullOrWhiteSpace(returnUrl)) return BadRequest("returnUrl required.");

        var portal = await _billing.CreateBillingPortalSessionAsync(customerId, returnUrl);
        return Ok(new { url = portal.Url });
    }


    // GET /api/billing/session/{id}
    [HttpGet("session/{id}")]
    public async Task<ActionResult<CheckoutSessionView>> GetSession([FromRoute] string id)
    {
        if (string.IsNullOrWhiteSpace(id)) return BadRequest("session id required");

        var s = await _billing.GetCheckoutSessionAsync(id);

        // Extract price ids (if line_items is expanded)
        var priceIds = new List<string>();
        if (s.LineItems?.Data is not null)
        {
            foreach (var li in s.LineItems.Data)
            {
                if (!string.IsNullOrEmpty(li.Price?.Id))
                    priceIds.Add(li.Price.Id);
            }
        }

        var view = new CheckoutSessionView(
            Id: s.Id,
            Status: s.Status,
            PaymentStatus: s.PaymentStatus,
            CustomerEmail: s.CustomerDetails?.Email ?? s.CustomerEmail,
            CustomerId: s.CustomerId,
            SubscriptionId: s.SubscriptionId,
            AmountTotal: s.AmountTotal,
            Currency: s.Currency,
            PriceIds: priceIds
        );

        return Ok(view);
    }
    
}

using Certifada.API.Services;
using System.Security.Claims;

namespace Certifada.API.Controllers;

/// <summary>Subscription billing: checkout, upgrade/downgrade, current subscription and history.</summary>
[Authorize]
[ApiController]
[Route("api/Billing")]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billing;
    public BillingController(IBillingService billing) => _billing = billing;

    private Guid UserId =>
        Guid.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id) ? id : Guid.Empty;

    /// <summary>Start a hosted Stripe Checkout for a plan; returns the redirect URL.</summary>
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest req)
    {
        if (UserId == Guid.Empty) return Unauthorized();
        if (string.IsNullOrWhiteSpace(req.PlanCode)) return BadRequest("PlanCode is required.");
        try
        {
            var res = await _billing.CreateCheckoutForPlanAsync(UserId, req.PlanCode, req.Interval);
            return Ok(new { success = true, data = res });
        }
        catch (Exception ex)
        {
            return Ok(new { success = false, message = ex.Message });
        }
    }

    /// <summary>Upgrade/downgrade (prorated). "Free" schedules a cancel at period end.</summary>
    [HttpPost("change-plan")]
    public async Task<IActionResult> ChangePlan([FromBody] ChangePlanRequest req)
    {
        if (UserId == Guid.Empty) return Unauthorized();
        try
        {
            var res = await _billing.ChangePlanAsync(UserId, req.PlanCode, req.Interval);
            return Ok(new { success = res.Success, data = res, message = res.Message });
        }
        catch (Exception ex)
        {
            return Ok(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Confirms a paid Checkout session from the success page — persists the
    /// subscription without needing the webhook (essential on localhost).
    /// </summary>
    [HttpPost("confirm-checkout")]
    public async Task<IActionResult> ConfirmCheckout([FromQuery] string sessionId)
    {
        if (UserId == Guid.Empty) return Unauthorized();
        if (string.IsNullOrWhiteSpace(sessionId)) return BadRequest("sessionId is required.");
        try
        {
            var res = await _billing.ConfirmCheckoutAsync(UserId, sessionId);
            return Ok(new { success = res.Success, data = res, message = res.Message });
        }
        catch (Exception ex)
        {
            return Ok(new { success = false, message = ex.Message });
        }
    }

    /// <summary>The tenant's current subscription (null when on Free).</summary>
    [HttpGet("subscription")]
    public async Task<IActionResult> Subscription()
    {
        if (UserId == Guid.Empty) return Unauthorized();
        return Ok(new { success = true, data = await _billing.GetSubscriptionAsync(UserId) });
    }

    /// <summary>Billing events for the tenant, newest first.</summary>
    [HttpGet("history")]
    public async Task<IActionResult> History()
    {
        if (UserId == Guid.Empty) return Unauthorized();
        return Ok(new { success = true, data = await _billing.GetHistoryAsync(UserId) });
    }

    /// <summary>Stripe billing portal URL (manage cards, invoices, cancellation).</summary>
    [HttpPost("portal")]
    public async Task<IActionResult> Portal([FromQuery] string? returnUrl)
    {
        if (UserId == Guid.Empty) return Unauthorized();
        var url = await _billing.CreatePortalUrlAsync(UserId, string.IsNullOrWhiteSpace(returnUrl) ? Request.Headers.Referer.ToString() : returnUrl);
        return Ok(new { success = url != null, data = new { url } });
    }
}

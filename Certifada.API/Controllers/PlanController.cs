namespace Certifada.API.Controllers;

/// <summary>Public plan catalogue — drives the Pricing page.</summary>
public class PlanController : ApiControllersBase
{
    private readonly IPlanService _planService;
    public PlanController(IPlanService planService)
    {
        _planService = planService;
    }

    [AllowAnonymous]
    [HttpGet]
    [Route(RouteClass.PlanRoute.GetPricingPlans)]
    public async Task<IActionResult> GetPricingPlans() => Ok(await _planService.GetPricingPlans());
}

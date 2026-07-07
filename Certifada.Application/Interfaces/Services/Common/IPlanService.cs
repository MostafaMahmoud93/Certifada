namespace Certifada.Application.Interfaces.Services.Common
{
    public interface IPlanService : IBaseService
    {
        /// <summary>All active plans with prices + feature rows for the Pricing page.</summary>
        Task<ServiceResponse<List<PlanPricingModel>>> GetPricingPlans();
    }
}

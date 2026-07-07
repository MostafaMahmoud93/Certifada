using Certifada.Domain.Entities.Payment;

namespace Certifada.Application.Implementation.Common;

/// <summary>Reads the plan catalogue (Plans + PlanPrices + PlanFeatures) for the Pricing page.</summary>
public class PlanService : ServiceBase, IPlanService
{
    private readonly IUnitOfWork _unitOfWork;

    public PlanService(IUnitOfWork unitOfWork, IConfiguration configuration, IUserAccessor userAccessor) : base(configuration, userAccessor)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ServiceResponse<List<PlanPricingModel>>> GetPricingPlans()
    {
        try
        {
            var plans = await _unitOfWork.PlanRepository.GetAllAsync(p => p.Is_Active && !p.Is_Deleted);
            var planIds = plans.Select(p => p.Id).ToList();

            var prices = await _unitOfWork.PlanPriceRepository.GetAllAsync(p => p.IsActive && planIds.Contains(p.Plan_Id));
            var planFeatures = await _unitOfWork.PlanFeatureRepository.GetAllAsync(f => planIds.Contains(f.Plan_Id) && !f.Is_Deleted);
            var featureIds = planFeatures.Select(f => f.Feature_Id).Distinct().ToList();
            var features = (await _unitOfWork.FeatureRepository.GetAllAsync(f => featureIds.Contains(f.Id)))
                .ToDictionary(f => f.Id);

            var result = plans
                .OrderBy(p => p.SortOrder)
                .Select(p =>
                {
                    var planPrices = prices.Where(x => x.Plan_Id == p.Id).ToList();
                    return new PlanPricingModel
                    {
                        Id = p.Id,
                        Code = p.Plan_Code,
                        Name = p.Title,
                        Blurb = p.Blurb,
                        Popular = p.Highlight,
                        Trial = p.Is_Trial,
                        SortOrder = p.SortOrder,
                        Monthly = planPrices.FirstOrDefault(x => x.Interval.ToLower() == "monthly")?.Amount ?? 0,
                        Yearly = planPrices.FirstOrDefault(x => x.Interval.ToLower() == "yearly")?.Amount ?? 0,
                        Currency = planPrices.FirstOrDefault()?.Currency ?? "USD",
                        Features = planFeatures
                            .Where(f => f.Plan_Id == p.Id && features.ContainsKey(f.Feature_Id))
                            .Select(f => new { Link = f, Feature = features[f.Feature_Id] })
                            .OrderBy(x => x.Feature.SortOrder)
                            .Select(x => new PlanPricingFeatureModel
                            {
                                Key = x.Feature.Feature_Key,
                                Label = x.Feature.Name,
                                Value = x.Link.Display_Value,
                                Included = x.Link.Enabled,
                                Times = x.Link.FeatureTimes,
                                SortOrder = x.Feature.SortOrder
                            })
                            .ToList()
                    };
                })
                .ToList();

            return new ServiceResponse<List<PlanPricingModel>> { Success = true, Data = result, Message = string.Empty };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<List<PlanPricingModel>>(ex, null, null);
        }
    }
}

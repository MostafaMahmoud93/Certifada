namespace Certifada.Domain.Entities.Payment
{
    public class Plan : BaseCommonEntity<Guid>
    {
        public string Plan_Code { get; set; }
        public string Title { get; set; }
        public string Blurb { get; set; }
        public bool Highlight { get; set; }
        /// <summary>Free-trial plan (renders "Start free trial" instead of "Subscribe").</summary>
        public bool Is_Trial { get; set; }
        public int SortOrder { get; set; }
        public bool Is_Active { get; set; }
        public virtual ICollection<TenantPlan>? TenantPlans { get; set; }
        public virtual ICollection<PlanPrice>? PlanPrices { get; set; }
        public virtual ICollection<PlanFeature>? PlanFeatures { get; set; }
    }
}
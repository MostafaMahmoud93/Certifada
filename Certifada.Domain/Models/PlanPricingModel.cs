namespace Certifada.Domain.Models
{
    /// <summary>A plan as rendered on the public Pricing page (with prices + feature rows).</summary>
    public class PlanPricingModel
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Blurb { get; set; } = string.Empty;
        public bool Popular { get; set; }
        public bool Trial { get; set; }
        public int SortOrder { get; set; }
        public decimal Monthly { get; set; }
        public decimal Yearly { get; set; }
        public string Currency { get; set; } = "USD";
        public List<PlanPricingFeatureModel> Features { get; set; } = new();
    }

    /// <summary>One feature row inside a pricing card.</summary>
    public class PlanPricingFeatureModel
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        /// <summary>Display value, e.g. "10 GB", "5,000", "24/7", "Unlimited".</summary>
        public string? Value { get; set; }
        public bool Included { get; set; }
        /// <summary>Numeric quota behind the value (null = unlimited / not numeric).</summary>
        public int? Times { get; set; }
        public int SortOrder { get; set; }
    }
}

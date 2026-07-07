using Certifada.Domain.Entities.Payment;
using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Infrastructure.Configuration
{
    public class TenantPlanConfig : IEntityTypeConfiguration<TenantPlan>
    {
        public void Configure(EntityTypeBuilder<TenantPlan> builder)
        {
            builder.HasKey(a => a.Id);
            builder.HasOne(q => q.Tenant).WithMany(x => x.TenantPlans).HasForeignKey(q => q.Tenant_Id).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.Region).WithMany(x => x.TenantPlans).HasForeignKey(a=>a.Region_Code).HasPrincipalKey(q => q.Region_Code);
            builder.HasOne(q => q.Plan).WithMany(x => x.TenantPlans).HasForeignKey(q => q.Plan_Id).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.UserCreated).WithMany(x => x.UserCreatedTenantPlans).HasForeignKey(q => q.Created_By).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.UserUpdated).WithMany(x => x.UserUpdatedTenantPlans).HasForeignKey(q => q.Last_Modified_By).OnDelete(DeleteBehavior.NoAction);
        }
    }
    public class RegionConfig : IEntityTypeConfiguration<Region>
    {
        public void Configure(EntityTypeBuilder<Region> builder)
        {
            builder.HasKey(a => a.Id);
        }
    }
    public class PlanPriceConfig : IEntityTypeConfiguration<PlanPrice>
    {
        public void Configure(EntityTypeBuilder<PlanPrice> builder)
        {
            builder.HasKey(a => a.Id);
            builder.HasOne(q => q.Region).WithMany(x => x.PlanPrices).HasForeignKey(a => a.Region_Code).HasPrincipalKey(q => q.Region_Code);
            builder.HasOne(q => q.Plan).WithMany(x => x.PlanPrices).HasForeignKey(q => q.Plan_Id).OnDelete(DeleteBehavior.NoAction);
        }
    }
    public class PlanFeatureConfig : IEntityTypeConfiguration<PlanFeature>
    {
        public void Configure(EntityTypeBuilder<PlanFeature> builder)
        {
            builder.HasKey(a => a.Id);
            builder.HasOne(q => q.Plan).WithMany(x => x.PlanFeatures).HasForeignKey(q => q.Plan_Id).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.Feature).WithMany(x => x.PlanFeatures).HasForeignKey(q => q.Feature_Id).OnDelete(DeleteBehavior.NoAction);
        }
    }
    public class PlanConfig : IEntityTypeConfiguration<Plan>
    {
        public void Configure(EntityTypeBuilder<Plan> builder)
        {
            builder.HasKey(a => a.Id);
        }
    }
    public class FeatureConfig : IEntityTypeConfiguration<Feature>
    {
        public void Configure(EntityTypeBuilder<Feature> builder)
        {
            builder.HasKey(a => a.Id);
        }
    }
    public class SubscriptionConfig : IEntityTypeConfiguration<Subscription>
    {
        public void Configure(EntityTypeBuilder<Subscription> builder)
        {
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Amount).HasPrecision(18, 2);
            builder.HasIndex(a => a.StripeSubscriptionId);
            builder.HasIndex(a => a.Tenant_Id);
            builder.HasOne(q => q.Tenant).WithMany().HasForeignKey(q => q.Tenant_Id).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.Plan).WithMany().HasForeignKey(q => q.Plan_Id).OnDelete(DeleteBehavior.NoAction);
        }
    }
    public class BillingHistoryConfig : IEntityTypeConfiguration<BillingHistory>
    {
        public void Configure(EntityTypeBuilder<BillingHistory> builder)
        {
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Amount).HasPrecision(18, 2);
            builder.HasOne(q => q.Tenant).WithMany().HasForeignKey(q => q.Tenant_Id).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.Plan).WithMany().HasForeignKey(q => q.Plan_Id).OnDelete(DeleteBehavior.NoAction);
        }
    }
}

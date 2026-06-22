using Certifada.Domain.Entities.Certificate;

namespace Certifada.Infrastructure.Configuration
{
    public class CertificateTemplateConfig : IEntityTypeConfiguration<CertificateTemplate>
    {
        public void Configure(EntityTypeBuilder<CertificateTemplate> builder)
        {
            builder.HasKey(x => x.Id);
            builder.HasOne(q => q.Tenant).WithMany(x => x.CertificateTemplates).HasForeignKey(q => q.Tenant_Id).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.UserCreated).WithMany(x => x.UserCreatedCertificateTemplates).HasForeignKey(q => q.Created_By).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.UserUpdated).WithMany(x => x.UserUpdatedCertificateTemplates).HasForeignKey(q => q.Last_Modified_By).OnDelete(DeleteBehavior.NoAction);
        }
    }
    public class CertificateTemplateVariableConfig : IEntityTypeConfiguration<CertificateTemplateVariable>
    {
        public void Configure(EntityTypeBuilder<CertificateTemplateVariable> builder)
        {
            builder.HasKey(x => x.Id);
            builder.HasOne(q => q.CertificateTemplate).WithMany(x => x.CertificateTemplateVariables).HasForeignKey(q => q.Template_Id).OnDelete(DeleteBehavior.NoAction);
        }
    }
    public class CertificateInstanceConfig : IEntityTypeConfiguration<CertificateInstance>
    {
        public void Configure(EntityTypeBuilder<CertificateInstance> builder)
        {
            builder.HasKey(x => x.Id);
            builder.HasOne(q => q.Unit).WithMany(x => x.CertificateInstances).HasForeignKey(q => q.Unit_Id).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.Tenant).WithMany(x => x.CertificateInstances).HasForeignKey(q => q.Tenant_Id).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.UserCreated).WithMany(x => x.CertificateInstances).HasForeignKey(q => q.Created_By).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.CertificateTemplate).WithMany(x => x.CertificateInstances).HasForeignKey(q => q.Template_Id).OnDelete(DeleteBehavior.NoAction);
        }
    }
    public class CertificateVariableValueConfig : IEntityTypeConfiguration<CertificateVariableValue>
    {
        public void Configure(EntityTypeBuilder<CertificateVariableValue> builder)
        {
            builder.HasKey(x => x.Id);
            builder.HasOne(q => q.CertificateTemplateVariable).WithMany(x => x.CertificateVariableValues).HasForeignKey(q => q.Variable_Id).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.CertificateInstance).WithMany(x => x.CertificateVariableValues).HasForeignKey(q => q.Instance_Id).OnDelete(DeleteBehavior.NoAction);
        }
    }
    public class CertificateAccessLogConfig : IEntityTypeConfiguration<CertificateAccessLog>
    {
        public void Configure(EntityTypeBuilder<CertificateAccessLog> builder)
        {
            builder.HasKey(x => x.Id);
            builder.HasOne(q => q.CertificateInstance).WithMany(x => x.CertificateAccessLogs).HasForeignKey(q => q.Instance_Id).OnDelete(DeleteBehavior.NoAction);
        }
    }
}

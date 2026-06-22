namespace Certifada.Infrastructure.Configuration
{
    public class AccessLogConfig : IEntityTypeConfiguration<AccessLog>
    {
        public void Configure(EntityTypeBuilder<AccessLog> builder)
        {
            builder.HasOne(q => q.User).WithMany(x => x.AccessLogs).HasForeignKey(q => q.User_Id);
        }
    }
}

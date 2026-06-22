namespace Certifada.Infrastructure.Configuration
{
    public class EmailTemplateConfig : IEntityTypeConfiguration<EmailTemplate>
    {
        public void Configure(EntityTypeBuilder<EmailTemplate> builder)
        {
            builder.HasKey(x => x.Id);
            builder.HasOne(q => q.UserCreated).WithMany(x => x.UserCreatedEmailTemplates).HasForeignKey(q => q.Created_By).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.UserUpdated).WithMany(x => x.UserUpdatedEmailTemplates).HasForeignKey(q => q.Last_Modified_By).OnDelete(DeleteBehavior.NoAction);
        }
    }
    public class EmailSendingLogConfig : IEntityTypeConfiguration<EmailSendingLog>
    {
        public void Configure(EntityTypeBuilder<EmailSendingLog> builder)
        {
            builder.HasKey(x => x.Id);
            builder.HasOne(q => q.EmailTemplate).WithMany(x => x.EmailSendingLogs).HasForeignKey(q => q.Template_Id).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.UserCreated).WithMany(x => x.UserCreatedEmailSendingLogs).HasForeignKey(q => q.Created_By).OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(q => q.UserUpdated).WithMany(x => x.UserUpdatedEmailSendingLogs).HasForeignKey(q => q.Last_Modified_By).OnDelete(DeleteBehavior.NoAction);
        }
    }
}

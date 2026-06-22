namespace Certifada.Domain.Entities.Common
{
    public class EmailTemplate : FullBaseEntity<Guid>
    {
        public Guid? Tenant_Id { get; set; }
        public Guid? Unit_Id { get; set; }
        public required string Subject { get; set; }
        public required string Body_Html { get; set; }
        public string? Body_Text { get; set; }
        public string? Description { get; set; }
        public string? Is_Default { get; set; }
        public virtual ICollection<EmailSendingLog>? EmailSendingLogs { get; set; }
        public virtual User UserCreated { get; set; }
        public virtual User? UserUpdated { get; set; }
        public virtual Tenant Tenant { get; set; }
        public virtual Unit Unit { get; set; }
    }
}

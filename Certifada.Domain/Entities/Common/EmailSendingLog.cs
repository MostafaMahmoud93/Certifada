namespace Certifada.Domain.Entities.Common
{
    public class EmailSendingLog : FullBaseEntity<Guid>
    {
        public Guid? Tenant_Id { get; set; }
        public Guid? Unit_Id { get; set; }
        public Guid? Certificate_Id { get; set; }
        public Guid Template_Id { get; set; }
        public required string Recipient_Email { get; set; }
        public required string Subject { get; set; }
        public required string Body { get; set; }
        public bool Priority { get; set; }
        public string? Attachment_Files { get; set; }
        public string? CCEmail { get; set; }
        public string? BCCEmail { get; set; }
        public string? Error_Message { get; set; }
        public required string Status { get; set; }
        public DateTime Record_Insertion_Datetime { get; set; }
        public virtual User UserCreated { get; set; }
        public virtual User? UserUpdated { get; set; }
        public virtual EmailTemplate EmailTemplate { get; set; }
        public virtual Tenant Tenant { get; set; }
        public virtual Unit Unit { get; set; }
    }
}

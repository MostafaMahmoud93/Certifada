namespace Certifada.Domain.Models.Email;
public class MailRequestModel
{
    public Guid? EmailHistoryId { get; set; }
    public string[] ToEmails { get; set; }
    public string[] ToCCEmails { get; set; }
    public string[] ToBCCEmails { get; set; }
    public string Subject { get; set; }
    public string Body { get; set; }
    public bool IsImportant { get; set; }
    public List<IFormFile>? Attachments { get; set; }
}
/// <summary>
/// SMTP settings, bound once from the "MailSettings" section in appsettings.json.
/// The Resolved* helpers apply sensible fallbacks so older configs (Mail/DisplayName only) keep working.
/// </summary>
public class MailSettings
{
    public string Mail { get; set; }
    public string DisplayName { get; set; }
    public string Password { get; set; }
    public string Host { get; set; }
    public int Port { get; set; } = 587;
    public bool IsAuth { get; set; } = true;
    /// <summary>SMTP login. Falls back to Mail when omitted.</summary>
    public string? Username { get; set; }
    /// <summary>STARTTLS / SSL (Zoho on 587 requires it).</summary>
    public bool EnableSsl { get; set; } = true;
    /// <summary>Sender address. Falls back to Mail when omitted.</summary>
    public string? FromEmail { get; set; }
    /// <summary>Sender display name. Falls back to DisplayName when omitted.</summary>
    public string? FromName { get; set; }

    public string ResolvedUsername => string.IsNullOrWhiteSpace(Username) ? Mail : Username;
    public string ResolvedFromEmail => string.IsNullOrWhiteSpace(FromEmail) ? (Mail ?? "noreply@Certifada.com") : FromEmail;
    public string ResolvedFromName => string.IsNullOrWhiteSpace(FromName) ? (DisplayName ?? "Certifada") : FromName;
    public int ResolvedPort => Port > 0 ? Port : 587;
    public bool IsComplete => !string.IsNullOrEmpty(Host) && !string.IsNullOrEmpty(ResolvedUsername) && !string.IsNullOrEmpty(Password);
}

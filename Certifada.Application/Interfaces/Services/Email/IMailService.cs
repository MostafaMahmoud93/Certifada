using Certifada.Domain.Abstractions.Enums;

namespace Certifada.Application.Interfaces.Services.Email
{
    public interface IMailService
    {
        Task<ServiceResponse<bool>> SendEmailAsync(Guid templateId, Guid certificateId, Guid unitId, Guid tenantId, string[] content, string[] toEmails, string[]? toCCEmails = null, string[]? toBCCEmails = null, bool isImportant = false, List<IFormFile> Attachments = null);

        /// <summary>Send a branded transactional email from a built-in template (no DB template / certificate context required).</summary>
        Task<ServiceResponse<bool>> SendTemplatedAsync(EmailTemplateEnum template, string toEmail, IDictionary<string, string> tokens);
    }
}

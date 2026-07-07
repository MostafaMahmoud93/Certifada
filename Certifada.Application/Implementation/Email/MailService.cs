using System.Net.NetworkInformation;

namespace Certifada.Application.Implementation.Email;
public class MailService : ServiceBase, IMailService
{
    private readonly IConfiguration _configuration;
    private readonly MailSettings _mailSettings;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    public MailService(IUnitOfWork unitOfWork, MailSettings mailSettings, IMapper mapper, IConfiguration configuration, IUserAccessor userAccessor) : base(configuration, userAccessor)
    {
        _configuration = configuration;
        _mailSettings = mailSettings;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    public async Task<ServiceResponse<bool>> SendEmailAsync(Guid templateId, Guid certificateId, Guid unitId, Guid tenantId, string[] content, string[] toEmails, string[]? toCCEmails = null, string[]? toBCCEmails = null, bool isImportant = false, List<IFormFile> Attachments = null)
    {
        try
        {
            (string temp, string subject) = await GetEmailTemplate(templateId);
            //To Add Subject in email
            content = AddStringsToBeginning(content, subject);
            //To make sure the prams Placeholder are same
            int placeholderCount = CountPlaceholders(temp);
            if (placeholderCount >= content.Length)
                content = AddEmptyStringsToArray(content, placeholderCount - content.Length);
            Guid? emailHistoryId = await EmailHistory(templateId, certificateId,unitId, tenantId, string.Format(temp, content), subject, string.Join(",", toEmails), EmailStatusEnum.PENDING, isImportant, null, string.Join(",", toCCEmails ?? new string[] { }), string.Join(",", toBCCEmails ?? new string[] { }));

            if (emailHistoryId != null)
            {
                // Prepare the mail request model
                var mailRequest = new MailRequestModel()
                {
                    EmailHistoryId = emailHistoryId,
                    Body = string.Format(temp, content),
                    Subject = subject,
                    ToEmails = toEmails,
                    ToCCEmails = toCCEmails,
                    ToBCCEmails = toBCCEmails,
                    IsImportant = isImportant,
                    Attachments = Attachments
                };

                // Send the email via EWS or SMTP based on IsEWS setting
                bool isSend = false;
                    isSend = (await CreateEmailSMTPAsync(mailRequest)).Data;

                // Update the email history after sending the email
                await _unitOfWork.EmailSendingLogRepository.ExecuteUpdateAsync(a => a.Id == emailHistoryId.Value, s => s.SetProperty(b => b.Status, (isSend? EmailStatusEnum.SENDED : EmailStatusEnum.ERROR).ToString()));
                return new ServiceResponse<bool>() { Success = isSend, Data = isSend, Message = isSend ? ClutureResource.SenedSuccessfully : ClutureResource.ErrorOccurredWhileSending };
            }
            return new ServiceResponse<bool>() { Success = false, Data = false, Message = ClutureResource.ErrorOccurredWhileSending };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, new { templateId, certificateId, unitId, tenantId, content, toEmails, toCCEmails, toBCCEmails, isImportant, Attachments });
        }
    }
    public async Task<ServiceResponse<bool>> SendTemplatedAsync(EmailTemplateEnum template, string toEmail, IDictionary<string, string> tokens)
    {
        try
        {
            var (subject, html) = EmailTemplates.Render(template, tokens);
            var mailRequest = new MailRequestModel
            {
                ToEmails = new[] { toEmail },
                Subject = subject,
                Body = html,
                IsImportant = false
            };
            return await CreateEmailSMTPAsync(mailRequest);
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, new { template, toEmail });
        }
    }

    #region private help function
    private static int CountPlaceholders(string input)
    {
        // Use regular expression to match {N} placeholders
        MatchCollection matches = Regex.Matches(input, @"\{\d+\}");

        return matches.Count;
    }
    private static string[] AddEmptyStringsToArray(string[] originalArray, int count)
    {
        int originalLength = originalArray.Length;

        Array.Resize(ref originalArray, originalLength + count);

        for (int i = 0; i < count; i++)
        {
            originalArray[originalLength + i] = string.Empty;
        }

        return originalArray;
    }
    private static string[] AddStringsToBeginning(string[] originalArray, params string[] newStrings)
    {
        int originalLength = originalArray.Length;
        int newStringsCount = newStrings.Length;

        string[] newArray = new string[originalLength + newStringsCount];

        for (int i = 0; i < newStringsCount; i++)
        {
            newArray[i] = newStrings[i];
        }

        for (int i = 0; i < originalLength; i++)
        {
            newArray[newStringsCount + i] = originalArray[i];
        }

        return newArray;
    }
    private async Task<Guid?> EmailHistory(Guid templateId,Guid certificateId,Guid unitId, Guid tenantId, string temp, string subject, string toEmail, EmailStatusEnum status, bool priority, string? attachmentFiles = null, string? ccEmail = null, string? bccEmail = null, string? message = null)
    {
        try
        {
            EmailSendingLog emailHistoryModel = new EmailSendingLog()
            {
                Tenant_Id = tenantId,
                Unit_Id = unitId,
                Certificate_Id = certificateId,
                Template_Id = templateId,
                Recipient_Email = toEmail,
                Subject = subject,
                Body = temp,
                Priority = priority,
                Attachment_Files = attachmentFiles,
                CCEmail = ccEmail,
                BCCEmail = bccEmail,
                Error_Message = message,
                Status = status.ToString(),
                Record_Insertion_Datetime = DateTime.Now
            };
            await _unitOfWork.EmailSendingLogRepository.AddAsync(emailHistoryModel);
            int effectedRows = await _unitOfWork.SaveChangesAsync();
            if (effectedRows > 0)
                return emailHistoryModel.Id;
            else
                return null;
        }
        catch (Exception ex)
        {

            return await CustomLogErrorAsync<Guid?>(ex, null, null);
        }
    }
    /// <summary>
    /// Sends via SMTP — every setting comes from <see cref="MailSettings"/>
    /// (bound once from the "MailSettings" section in appsettings.json).
    /// </summary>
    private async Task<ServiceResponse<bool>> CreateEmailSMTPAsync(MailRequestModel mailRequest)
    {
        try
        {
            if (_mailSettings == null || !_mailSettings.IsComplete)
            {
                return await LogErrorAsync<bool>(
                    new InvalidOperationException("SMTP settings are incomplete. Please specify MailSettings:Host, MailSettings:Port, MailSettings:Username (or Mail) and MailSettings:Password in appsettings.json."),
                    false, new { mailRequest.Subject, mailRequest.ToEmails });
            }

            using (var mailMessage = new MailMessage())
            {
                mailMessage.From = new MailAddress(_mailSettings.ResolvedFromEmail, _mailSettings.ResolvedFromName);

                foreach (var recipient in mailRequest.ToEmails)
                {
                    mailMessage.To.Add(new MailAddress(recipient));
                }

                if (mailRequest.ToCCEmails != null)
                {
                    foreach (var recipient in mailRequest.ToCCEmails)
                    {
                        mailMessage.CC.Add(new MailAddress(recipient));
                    }
                }

                if (mailRequest.ToBCCEmails != null)
                {
                    foreach (var recipient in mailRequest.ToBCCEmails)
                    {
                        mailMessage.Bcc.Add(new MailAddress(recipient));
                    }
                }

                mailMessage.Subject = mailRequest.Subject;
                // Deliverability: send multipart/alternative (plain text + HTML).
                // HTML-only email is a strong spam signal for Outlook/Yahoo/Gmail.
                var plainText = HtmlToPlainText(mailRequest.Body);
                mailMessage.Body = plainText;
                mailMessage.IsBodyHtml = false;
                mailMessage.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(plainText, System.Text.Encoding.UTF8, "text/plain"));
                mailMessage.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(mailRequest.Body, System.Text.Encoding.UTF8, "text/html"));
                mailMessage.ReplyToList.Add(new MailAddress(_mailSettings.ResolvedFromEmail, _mailSettings.ResolvedFromName));
                if (mailRequest.Attachments != null)
                {
                    foreach (var file in mailRequest.Attachments)
                    {
                        if (file.Length > 0)
                        {
                            // Open the file stream and copy to the MemoryStream
                            using (var fileStream = file.OpenReadStream())
                            {
                                var ms = new MemoryStream();
                                await fileStream.CopyToAsync(ms);
                                ms.Position = 0; // Reset the stream position

                                // Create an attachment from the MemoryStream
                                var attachment = new Attachment(ms, file.FileName, file.ContentType);
                                mailMessage.Attachments.Add(attachment);
                            }
                        }
                    }
                }

                using (var smtpClient = new SmtpClient(_mailSettings.Host, _mailSettings.ResolvedPort))
                {
                    if (_mailSettings.IsAuth)
                        smtpClient.Credentials = new NetworkCredential(_mailSettings.ResolvedUsername, _mailSettings.Password);
                    smtpClient.EnableSsl = _mailSettings.EnableSsl; // STARTTLS on 587

                    await smtpClient.SendMailAsync(mailMessage);
                }
            }

            return new ServiceResponse<bool>() { Success = true, Data = true, Message = ClutureResource.SenedSuccessfully };
        }
        catch (Exception ex)
        {
            // Log WITH the effective SMTP target so the file log shows exactly which
            // server/credentials the running process used (config can be overridden
            // by environment variables or a stale singleton after appsettings edits).
            var resp = await LogErrorAsync<bool>(ex, false, new
            {
                SmtpHost = _mailSettings?.Host,
                SmtpPort = _mailSettings?.ResolvedPort,
                SmtpUser = _mailSettings?.ResolvedUsername,
                SmtpSsl = _mailSettings?.EnableSsl,
                From = _mailSettings?.ResolvedFromEmail,
                mailRequest.Subject,
                mailRequest.ToEmails
            });
            // Surface the real SMTP reason to the caller instead of a generic message.
            resp.Message = $"{ex.Message}{(ex.InnerException != null ? " | " + ex.InnerException.Message : string.Empty)}";
            return resp;
        }
    }
    private async Task<(string Temp, string Subject)> GetEmailTemplate(Guid templateId)
    {
        try
        {
            EmailTemplate temp = await _unitOfWork.EmailTemplateRepository.FirstOrDefaultAsync(a => a.Id == templateId);
            return (temp.Body_Html, temp.Subject);
        }
        catch (Exception ex)
        {
            return await CustomLogErrorAsync(ex, ("", ""), templateId);
        }
    }
    /// <summary>Very small HTML→text conversion for the plain-text alternate view.</summary>
    private static string HtmlToPlainText(string html)
    {
        if (string.IsNullOrWhiteSpace(html)) return string.Empty;
        var text = Regex.Replace(html, @"<(style|script)[^>]*>.*?</\1>", " ", RegexOptions.Singleline | RegexOptions.IgnoreCase);
        // keep link targets readable: <a href="url">label</a> → label (url)
        text = Regex.Replace(text, "<a[^>]*href=\"([^\"]+)\"[^>]*>(.*?)</a>", "$2 ($1)", RegexOptions.Singleline | RegexOptions.IgnoreCase);
        text = Regex.Replace(text, @"<br\s*/?>|</p>|</tr>|</h\d>", "\n", RegexOptions.IgnoreCase);
        text = Regex.Replace(text, "<[^>]+>", " ");
        text = System.Net.WebUtility.HtmlDecode(text);
        text = Regex.Replace(text, @"[ \t]+", " ");
        text = Regex.Replace(text, @"\n\s+", "\n");
        return text.Trim();
    }

    private static string CleanInputString(string input)
    {
        if (string.IsNullOrEmpty(input))
        {
            return input; // Return the same string if it's null or empty
        }

        // Step 1: Trim leading and trailing whitespace
        input = input.Trim();

        // Step 2: Remove control characters (\r, \n) and any other special non-printable characters
        input = Regex.Replace(input, @"[\r\n]+", "");

        // Return the cleaned string
        return input;
    }
    #endregion
}

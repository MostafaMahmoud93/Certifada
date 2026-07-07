namespace Certifada.Domain.Abstractions.Enums
{
    /// <summary>Built-in transactional email templates (rendered by EmailTemplates.Render).</summary>
    public enum EmailTemplateEnum
    {
        Welcome = 1,
        ConfirmEmail = 2,
        ResetPassword = 3,
        CredentialIssued = 4,
        MessageReceived = 5,
        MagicLink = 6,
        WalletLink = 7,
    }
}

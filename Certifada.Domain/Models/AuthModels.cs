namespace Certifada.Domain.Models
{
    public record RegisterModel(string FullName, string Email, string Password);
    public record ForgotPasswordModel(string Email);
    public record ResetPasswordModel(string Token, string Password);
    /// <summary>Request a passwordless sign-in link by email.</summary>
    public record MagicLinkModel(string Email);
    /// <summary>Exchange a magic-link token for a session.</summary>
    public record MagicLoginModel(string Token);
    /// <summary>Activate an account from the emailed 24-hour verification link.</summary>
    public record ConfirmEmailModel(string Token);
}

namespace Certifada.Domain.Models
{
    public record RegisterModel(string FullName, string Email, string Password);
    public record ForgotPasswordModel(string Email);
    public record ResetPasswordModel(string Token, string Password);
}

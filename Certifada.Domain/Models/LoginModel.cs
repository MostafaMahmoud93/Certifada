namespace Certifada.Domain.Models;
/// <param name="RememberMe">When true, the issued JWT lives 30 days instead of the default 24 hours.</param>
public record LoginModel(string Email, string Password, bool RememberMe = false);
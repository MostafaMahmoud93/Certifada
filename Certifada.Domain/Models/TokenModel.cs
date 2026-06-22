using Microsoft.AspNetCore.Http.Authentication;

namespace Certifada.Domain.Models
{
    public class TokenModel
    {
        public string Token { get; set; }
        public DateTime Expiration { get; set; }
        public Guid? UserId { get; set; }
        public bool? IsAdmin { get; set; }
        public string[] UserActions { get; set; }
    }
    public class ExternalLoginStartModel
    {
        public string StartUrl { get; set; } = default!;
    }

    public class ExternalChallengeModel
    {
        public string Provider { get; set; } = default!;          // "Google" | "Facebook"
        public string RedirectUri { get; set; } = "/auth/external-callback";
        public Dictionary<string, string> Items { get; set; } = new(); // e.g., { "returnUrl": "..." }
    }

    public class ExternalLoginCompleteModel
    {
        public string RedirectUrl { get; set; } = default!;
        public TokenModel? Token { get; set; }
    }
}

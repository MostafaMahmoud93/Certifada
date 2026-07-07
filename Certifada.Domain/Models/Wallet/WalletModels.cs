using System;

namespace Certifada.Domain.Models.Wallet
{
    /// <summary>Ask Certifada to email a wallet sign-in link + code. One of Email / CredentialId is required.</summary>
    public class WalletRequestModel
    {
        /// <summary>Recipient email (used by the /wallet enter-email flow).</summary>
        public string? Email { get; set; }
        /// <summary>Public credential id (used by the verify-page "see all my credentials" button — the email is resolved server-side and never trusted from the client).</summary>
        public string? CredentialId { get; set; }
    }

    /// <summary>Exchange a magic link token OR an email+code for a short-lived wallet session token.</summary>
    public class WalletExchangeModel
    {
        public string? Token { get; set; }
        public string? Email { get; set; }
        public string? Code { get; set; }
    }

    /// <summary>Returned by /wallet/exchange — the recipient session used to fetch the wallet.</summary>
    public class WalletSessionModel
    {
        public string Token { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    /// <summary>One credential row shown in the recipient wallet.</summary>
    public class WalletCredentialModel
    {
        public string Id { get; set; } = string.Empty;      // public/verify id
        public string Title { get; set; } = string.Empty;   // template / certificate title
        public string Issuer { get; set; } = string.Empty;  // issuing organization name
        public DateTime? IssuedAt { get; set; }
        public string Status { get; set; } = "Valid";
        public string? DownloadUrl { get; set; }
    }
}

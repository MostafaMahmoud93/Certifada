using Certifada.Domain.Models.Wallet;

namespace Certifada.Application.Interfaces.Services.Common;

/// <summary>
/// Recipient credential wallet — passwordless, email-owned. Recipients are not org
/// accounts; access is proven by owning the email (magic link or 6-digit code).
/// </summary>
public interface IWalletService
{
    /// <summary>Email a wallet sign-in link + code. Always succeeds (no account enumeration).</summary>
    Task<ServiceResponse<bool>> RequestAsync(WalletRequestModel model);

    /// <summary>Exchange a link token OR email+code for a short-lived recipient session token.</summary>
    Task<ServiceResponse<WalletSessionModel>> ExchangeAsync(WalletExchangeModel model);

    /// <summary>All credentials issued to the email carried in the session token (cross-issuer).</summary>
    Task<ServiceResponse<List<WalletCredentialModel>>> CredentialsAsync(string? bearerToken);

    /// <summary>Signed, email-bound wallet link for embedding in delivery emails (possession = proof).</summary>
    string BuildWalletLink(string email, int minutes = 43200);
}

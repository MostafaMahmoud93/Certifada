using Certifada.Domain.Entities.Certificate;
using Certifada.Domain.Models.Wallet;
using Microsoft.Extensions.Caching.Memory;

namespace Certifada.Application.Implementation.Common;

/// <summary>
/// Recipient wallet: passwordless, email-owned, cross-issuer. Reuses the JWT signing
/// config used for staff auth, but issues EMAIL-bound tokens with their own purpose so
/// a wallet token can never act as a staff token (and vice versa).
/// </summary>
public class WalletService : IWalletService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly IMailService _mailService;
    private readonly IMemoryCache _cache;

    private const int LinkMinutes = 15;          // magic link / code lifetime
    private const int SessionMinutes = 60;        // wallet session lifetime
    private const string PurposeLink = "wallet-link";
    private const string PurposeSession = "wallet";

    public WalletService(IUnitOfWork unitOfWork, IConfiguration configuration, IMailService mailService, IMemoryCache cache)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _mailService = mailService;
        _cache = cache;
    }

    // ── request ──────────────────────────────────────────────────────────────
    public async Task<ServiceResponse<bool>> RequestAsync(WalletRequestModel model)
    {
        var ok = new ServiceResponse<bool> { Success = true, Data = true, Message = "If we have credentials for that email, a wallet link is on its way." };
        try
        {
            var email = (model.Email ?? string.Empty).Trim();

            // Verify-page path: resolve the email from the credential SERVER-SIDE (never trust it from the client).
            if (string.IsNullOrWhiteSpace(email) && !string.IsNullOrWhiteSpace(model.CredentialId))
            {
                var cred = await ResolveCredentialAsync(model.CredentialId!);
                // Prefer the Email column; fall back to the _email embedded in the merge data
                // (older rows issued before the Email column was populated).
                email = (cred?.Email ?? ExtractEmail(cred?.Data_Json) ?? string.Empty).Trim();
            }

            if (string.IsNullOrWhiteSpace(email) || !email.Contains('@')) return ok;

            // Only send if the recipient actually has at least one credential.
            var has = await _unitOfWork.CertificateInstanceRepository.GetAllQ()
                .AnyAsync(c => c.Email != null && c.Email.ToLower() == email.ToLower());
            if (!has) return ok;

            var link = $"{_configuration["Frontend:Url"]}/wallet?token={Uri.EscapeDataString(GenerateToken(email, PurposeLink, LinkMinutes))}";
            var code = new Random().Next(100000, 999999).ToString();
            _cache.Set(CodeKey(email, code), email, TimeSpan.FromMinutes(LinkMinutes));

            try
            {
                await _mailService.SendTemplatedAsync(EmailTemplateEnum.WalletLink, email, new Dictionary<string, string>
                {
                    ["name"] = email.Split('@')[0],
                    ["link"] = link,
                    ["code"] = code,
                    ["expires"] = LinkMinutes.ToString()
                });
            }
            catch { /* never reveal on mail failure */ }

            return ok;
        }
        catch
        {
            return ok; // never leak
        }
    }

    // ── exchange ─────────────────────────────────────────────────────────────
    public Task<ServiceResponse<WalletSessionModel>> ExchangeAsync(WalletExchangeModel model)
    {
        var fail = new ServiceResponse<WalletSessionModel> { Success = false, Data = null, Message = "This link or code is invalid or has expired." };

        string? email = null;
        if (!string.IsNullOrWhiteSpace(model.Token))
        {
            email = ValidateToken(model.Token!, PurposeLink);
        }
        else if (!string.IsNullOrWhiteSpace(model.Email) && !string.IsNullOrWhiteSpace(model.Code))
        {
            var key = CodeKey(model.Email!.Trim(), model.Code!.Trim());
            if (_cache.TryGetValue(key, out string? cached) && !string.IsNullOrEmpty(cached))
            {
                email = cached;
                _cache.Remove(key); // single use
            }
        }

        if (string.IsNullOrWhiteSpace(email)) return Task.FromResult(fail);

        var session = new WalletSessionModel { Email = email!, Token = GenerateToken(email!, PurposeSession, SessionMinutes) };
        return Task.FromResult(new ServiceResponse<WalletSessionModel> { Success = true, Data = session, Message = "OK" });
    }

    // ── credentials ──────────────────────────────────────────────────────────
    public async Task<ServiceResponse<List<WalletCredentialModel>>> CredentialsAsync(string? bearerToken)
    {
        var unauth = new ServiceResponse<List<WalletCredentialModel>> { Success = false, Data = null, Message = "Session expired. Open your wallet again." };

        var token = ExtractBearer(bearerToken);
        var email = ValidateToken(token, PurposeSession);
        if (string.IsNullOrWhiteSpace(email)) return unauth;

        var lower = email!.ToLower();
        var list = await _unitOfWork.CertificateInstanceRepository.GetAllQ()
            .Where(c => c.Email != null && c.Email.ToLower() == lower && !c.Is_Deleted)
            .OrderByDescending(c => c.IssuedAt ?? c.Created_Date)
            .Select(c => new WalletCredentialModel
            {
                Id = string.IsNullOrEmpty(c.Public_Url) ? c.Id.ToString() : c.Public_Url!,
                Title = c.CertificateTemplate != null ? c.CertificateTemplate.Name : "Certificate",
                Issuer = c.Tenant != null ? c.Tenant.Name : "",
                IssuedAt = c.IssuedAt ?? c.Created_Date,
                Status = c.Status ?? "Valid",
                DownloadUrl = c.Download_Url
            })
            .ToListAsync();

        return new ServiceResponse<List<WalletCredentialModel>> { Success = true, Data = list, Message = "OK" };
    }

    public string BuildWalletLink(string email, int minutes = 43200)
        => $"{_configuration["Frontend:Url"]}/wallet?token={Uri.EscapeDataString(GenerateToken(email, PurposeLink, minutes))}";

    // ── helpers ──────────────────────────────────────────────────────────────
    private async Task<CertificateInstance?> ResolveCredentialAsync(string publicId)
    {
        var q = _unitOfWork.CertificateInstanceRepository.GetAllQ();
        if (Guid.TryParse(publicId, out var gid))
            return await q.FirstOrDefaultAsync(c => c.Id == gid);
        return await q.FirstOrDefaultAsync(c => c.Public_Url == publicId);
    }

    /// <summary>Fallback: pull the recipient email out of the merge-data JSON (_email / email keys).</summary>
    private static string? ExtractEmail(string? dataJson)
    {
        if (string.IsNullOrWhiteSpace(dataJson)) return null;
        try
        {
            var d = Newtonsoft.Json.Linq.JObject.Parse(dataJson);
            var email = (d["_email"] ?? d["email"])?.ToString();
            return string.IsNullOrWhiteSpace(email) ? null : email.Trim();
        }
        catch { return null; }
    }

    private static string CodeKey(string email, string code) => $"wallet-code:{email.Trim().ToLower()}:{code.Trim()}";

    private static string ExtractBearer(string? header)
    {
        if (string.IsNullOrWhiteSpace(header)) return string.Empty;
        return header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) ? header.Substring(7).Trim() : header.Trim();
    }

    /// <summary>Email-bound signed token — the subject IS the email; purpose keeps it distinct from staff tokens.</summary>
    private string GenerateToken(string email, string purpose, int minutes)
    {
        var claims = new[]
        {
            new Claim("wallet_email", email),
            new Claim("purpose", purpose)
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            expires: DateTime.UtcNow.AddMinutes(minutes),
            claims: claims,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>Returns the email iff the token is valid AND carries the expected wallet purpose.</summary>
    private string? ValidateToken(string token, string purpose)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var parms = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"],
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            };
            var principal = handler.ValidateToken(token, parms, out _);
            if (principal.FindFirst("purpose")?.Value != purpose) return null;
            var email = principal.FindFirst("wallet_email")?.Value;
            return string.IsNullOrWhiteSpace(email) ? null : email;
        }
        catch { return null; }
    }
}

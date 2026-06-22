using Certifada.Domain.Abstractions.Enums;
using Microsoft.AspNetCore.Authentication;
using Newtonsoft.Json.Linq;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Certifada.API.Controllers.Auth;
public class AuthController : ApiControllersBase
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;
    private readonly IAuthService _authService;
    private readonly IMailService _mailService;
    public AuthController(IAuthService authService, IMailService mailService, IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
        _authService = authService;
        _mailService = mailService;
    }
    [AllowAnonymous]
    [HttpPost]
    [Route(RouteClass.Auth.Login)]
    public async Task<IActionResult> Login(LoginModel model) => Ok(await _authService.Token(model));

    [AllowAnonymous]
    [HttpGet]
    [Route(RouteClass.Auth.Test)]
    public async Task<IActionResult> Test() => Ok("Test Helloooooo");

    [AllowAnonymous]
    [HttpGet]
    [Route(RouteClass.Auth.TestDB)]
    public async Task<IActionResult> TestDB() => Ok(await _authService.TestDBAsync());

    [AllowAnonymous]
    [HttpGet]
    [Route(RouteClass.Auth.TestDBTables)]
    public async Task<IActionResult> TestDBTablesAsync() => Ok(await _authService.TestDBTablesAsync());

    [AllowAnonymous]
    [HttpGet, Route(RouteClass.Auth.GoogleUrl)]
    public IActionResult Google([FromQuery] string? returnUrl = null) =>
        Challenge(BuildProps("Google", returnUrl), new[] { "Google" });

    [AllowAnonymous]
    [HttpGet, Route(RouteClass.Auth.FacebookUrl)]
    public IActionResult Facebook([FromQuery] string? returnUrl = null) =>
        Challenge(BuildProps("Facebook", returnUrl), new[] { "Facebook" });

    [AllowAnonymous]
    [HttpGet, Route(RouteClass.Auth.MicrosoftUrl)]
    public IActionResult Microsoft([FromQuery] string? returnUrl = null) =>
        Challenge(BuildProps("Microsoft", returnUrl), new[] { "Microsoft" });

    [AllowAnonymous]
    [HttpGet]
    [Route(RouteClass.Auth.ExternalCallback)]
    public async Task<IActionResult> ExternalCallback()
    {
        #region login throw social media
        // read the temp identity stored in the External cookie
        var result = await HttpContext.AuthenticateAsync("External");
        if (!(result?.Succeeded ?? false))
            return Redirect($"{_configuration["Frontend:Url"]}/auth/error");

        // 1) get provider
        string? providerName = null;
        if (result.Properties?.Items?.TryGetValue("provider", out var p) == true)
            providerName = p;
        else if (result.Properties?.Items?.TryGetValue(".AuthScheme", out var p2) == true) // sometimes set by handler
            providerName = p2;

        if (!Enum.TryParse<ProviderEnum>(providerName, ignoreCase: true, out var providerEnum))
            return Redirect($"{_configuration["Frontend:Url"]}/auth/error?code=unknown_provider");

        // 2) email & name (with Microsoft fallbacks)
        var principal = result.Principal!;
        var email = principal.FindFirst(ClaimTypes.Email)?.Value
                ?? principal.FindFirst("preferred_username")?.Value
                ?? principal.FindFirst("upn")?.Value
                ?? string.Empty;

        var name = principal.FindFirst(ClaimTypes.Name)?.Value
                ?? principal.Identity?.Name
                ?? email;

        // 3) providerId per provider
        string providerId = providerEnum switch
        {
            ProviderEnum.Google => principal.FindFirst("sub")?.Value
                                   ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                   ?? string.Empty,

            ProviderEnum.Facebook => principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                   ?? principal.FindFirst("id")?.Value
                                   ?? string.Empty,

            ProviderEnum.Microsoft => principal.FindFirst("oid")?.Value
                                   ?? principal.FindFirst("sub")?.Value
                                   ?? string.Empty,
        };

        if (string.IsNullOrWhiteSpace(providerId))
            return Redirect($"{_configuration["Frontend:Url"]}/auth/error?code=missing_provider_id");

        // Facebook often has no email → make a stable fallback
        if (string.IsNullOrWhiteSpace(email))
            email = $"{providerName!.ToLower()}_{providerId}@noemail.local";
        #endregion

        // 4) call service to login user or rejester user if first time trow social media
        var tokenResponse = await _authService.TokenSocialMedia(email, name, providerEnum, providerId);

        // optional: clear temp cookie
        await HttpContext.SignOutAsync("External");

        var returnUrl = result.Properties?.Items.TryGetValue("returnUrl", out var r) == true && !string.IsNullOrEmpty(r) ? r : $"{_configuration["Frontend:Url"]}/auth/login";

        string json = System.Text.Json.JsonSerializer.Serialize(tokenResponse);
        string encoded = Uri.EscapeDataString(json);

        return Redirect($"{returnUrl}?redirectResponse={encoded}");
    }
    private AuthenticationProperties BuildProps(string provider, string? returnUrl)
    {
        var props = new AuthenticationProperties
        {
            RedirectUri = Url.Action(nameof(ExternalCallback))!
        };
        props.Items["provider"] = provider;
        if (!string.IsNullOrWhiteSpace(returnUrl))
            props.Items["returnUrl"] = returnUrl;
        return props;
    }
}

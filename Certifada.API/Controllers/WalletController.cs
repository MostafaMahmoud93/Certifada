using Certifada.Domain.Models.Wallet;

namespace Certifada.API.Controllers;

/// <summary>
/// Public recipient-wallet endpoints. Recipients aren't org accounts, so these are
/// anonymous — access to credentials is proven by an email-bound wallet token, never
/// by the staff JWT. The credentials endpoint reads the email from the token only.
/// </summary>
[ApiController]
[AllowAnonymous]
public class WalletController : ControllerBase
{
    private readonly IWalletService _wallet;
    public WalletController(IWalletService wallet) => _wallet = wallet;

    [HttpPost]
    [Route(RouteClass.Wallet.Request)]
    public async Task<IActionResult> Request(WalletRequestModel model) => Ok(await _wallet.RequestAsync(model));

    [HttpPost]
    [Route(RouteClass.Wallet.Exchange)]
    public async Task<IActionResult> Exchange(WalletExchangeModel model) => Ok(await _wallet.ExchangeAsync(model));

    [HttpGet]
    [Route(RouteClass.Wallet.Credentials)]
    public async Task<IActionResult> Credentials()
        => Ok(await _wallet.CredentialsAsync(HttpContext.Request.Headers["Authorization"].ToString()));
}

namespace Certifada.API.Controllers.Auth;
public class UserController : ApiControllersBase
{
    private readonly IUserService _applicationUserService;
    public UserController(IUserService applicationUserService)
    {
        _applicationUserService = applicationUserService;
    }
    [HttpPost]
    [Route(RouteClass.User.CreateUser)]
    public async Task<IActionResult> CreateUser([FromForm] AddUserModel newUser) =>
        Ok(await _applicationUserService.CreateUser(newUser));

    [HttpPost]
    [Route(RouteClass.User.EditUser)]
    public async Task<IActionResult> EditUser([FromForm] EditUserModel newUser) =>
        Ok(await _applicationUserService.EditUser(newUser));

    [HttpPost]
    [Route(RouteClass.User.UpdateImgeProfileUser)]
    public async Task<IActionResult> UpdateImgeProfileUser(IFormFile? ProfilePicture) =>
        Ok(await _applicationUserService.UpdateImgeProfileUser(ProfilePicture));

    /// <summary>Self-service: the signed-in user updates their own display name.</summary>
    [HttpPost]
    [Route(RouteClass.User.UpdateProfile)]
    public async Task<IActionResult> UpdateProfile(UpdateProfileModel model) =>
        Ok(await _applicationUserService.UpdateProfile(model));

    /// <summary>Saves the signed-in user's signature image (Users.Signature_URL).</summary>
    [HttpPost]
    [Route(RouteClass.User.UpdateSignature)]
    public async Task<IActionResult> UpdateSignature(IFormFile signaturePicture) =>
        Ok(await _applicationUserService.UpdateImgeSignatureUser(signaturePicture));

    [HttpGet]
    [Route(RouteClass.User.GetUsers)]
    public async Task<IActionResult> GetUsers() =>
        Ok(await _applicationUserService.GetUsers());

    [HttpGet]
    [Route(RouteClass.User.GetUser)]
    public async Task<IActionResult> GetUser(Guid userId) =>
        Ok((await _applicationUserService.GetUser(userId)).Data);

    [HttpGet]
    [Route(RouteClass.User.SearchUser)]
    public async Task<IActionResult> SearchUser(string? query) =>
        Ok(await _applicationUserService.SearchUser(query));

    [HttpGet]
    [Route(RouteClass.User.GetCurrentUser)]
    public async Task<IActionResult> GetCurrentUser() =>
        Ok((await _applicationUserService.GetCurrentUser()).Data);

    [HttpPost]
    [Route(RouteClass.User.DeleteUser)]
    public async Task<IActionResult> DeleteUser(Guid userId) =>
        Ok((await _applicationUserService.DeleteUser(userId)).Data);

}

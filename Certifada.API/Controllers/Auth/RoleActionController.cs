namespace Certifada.API.Controllers.Auth;
public class RoleActionController : ApiControllersBase
{
    private readonly IRoleActionService _RoleActionService;
    public RoleActionController(IRoleActionService RoleActionService)
    {
        _RoleActionService = RoleActionService;
    }

    [HttpPost]
    [Route(RouteClass.RoleAction.AddEditRoleAction)]
    public async Task<IActionResult> AddEditRoleAction(RoleActionModel RoleActionModel)
    => Ok(await _RoleActionService.AddEditRoleAction(RoleActionModel));

    //[HttpGet]
    //[Route(RouteClass.RoleAction.GetRoleActions)]
    //public async Task<IActionResult> GetRoleActions(Guid RoleId)
    //=> Ok(await _RoleActionService.GetRoleActions(RoleId));

    [HttpPost]
    [Route(RouteClass.RoleAction.AddEditUserAction)]
    public async Task<IActionResult> AddEditUserAction(UserActionModel userActionModel)
    => Ok(await _RoleActionService.AddEditUserAction(userActionModel));

    //[HttpGet]
    //[Route(RouteClass.RoleAction.GetUserActions)]
    //public async Task<IActionResult> GetUserActions(Guid userId)
    //=> Ok(await _RoleActionService.GetUserActions(userId));
}

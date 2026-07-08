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

    [HttpGet]
    [Route(RouteClass.RoleAction.GetRoleActions)]
    public async Task<IActionResult> GetRoleActions(Guid RoleId)
    => Ok(await _RoleActionService.GetRoleActions(RoleId));

    [HttpGet]
    [Route(RouteClass.RoleAction.GetPermissions)]
    public async Task<IActionResult> GetPermissions()
    => Ok(await _RoleActionService.GetPermissionsCatalog());

    [HttpPost]
    [Route(RouteClass.RoleAction.AssignUserRole)]
    public async Task<IActionResult> AssignUserRole(AssignUserRoleModel model)
    => Ok(await _RoleActionService.AssignUserRole(model.UserId, model.RoleId));
}

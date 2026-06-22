namespace Certifada.API.Controllers.Auth;
public class RoleController : ApiControllersBase
{
    private readonly IRoleService _RoleService;
    public RoleController(IRoleService RoleService)
    {
        _RoleService = RoleService;
    }


    [HttpGet]
    [Route(RouteClass.Role.GetRoles)]
    public async Task<IActionResult> GetRoles() =>
        Ok(await _RoleService.GetRoles());

    [HttpGet]
    [Route(RouteClass.Role.GetRolesDDL)]
    public async Task<IActionResult> GetRolesDDL() =>
     Ok(await _RoleService.GetRolesDDL());

    [HttpPost]
    [Route(RouteClass.Role.CreateRole)]
    public async Task<IActionResult> CreateRole(AddRoleModel RoleModel) =>
        Ok(await _RoleService.AddRole(RoleModel));

    [HttpPost]
    [Route(RouteClass.Role.EditRole)]
    public async Task<IActionResult> EditRole(EditRoleModel RoleModel) =>
        Ok(await _RoleService.EditRole(RoleModel));

    [HttpPost]
    [Route(RouteClass.Role.DeleteRole)]
    public async Task<IActionResult> DeleteRole(Guid id) =>
        Ok(await _RoleService.DeleteRole(id));


}

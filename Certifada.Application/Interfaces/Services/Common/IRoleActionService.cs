namespace Certifada.Application.Interfaces.Services.Common
{
    public interface IRoleActionService : IBaseService
    {
        /// <summary>Grant or revoke a single permission on a role.</summary>
        Task<ServiceResponse<bool>> AddEditRoleAction(RoleActionModel model);

        /// <summary>Permission catalogue grouped by screen, each flagged as granted for the given role.</summary>
        Task<ServiceResponse<List<ScreenPermissionsModel>>> GetRoleActions(Guid roleId);

        /// <summary>Full permission catalogue grouped by screen (nothing granted).</summary>
        Task<ServiceResponse<List<ScreenPermissionsModel>>> GetPermissionsCatalog();

        /// <summary>Assign a role to a user (upserts the single UserRoles row).</summary>
        Task<ServiceResponse<bool>> AssignUserRole(Guid userId, Guid roleId);
    }
}

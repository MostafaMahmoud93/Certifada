namespace Certifada.Application.Interfaces.Services.Common
{
    public interface IRoleActionService : IBaseService
    {
        Task<ServiceResponse<bool>> AddEditRoleAction(RoleActionModel model);
        Task<ServiceResponse<bool>> AddEditUserAction(UserActionModel model);
        //Task<ServiceResponse<CollectionResponse<RoleScreensPermissionModel>>> GetRoleActions(Guid roleId);
        //Task<ServiceResponse<CollectionResponse<UserScreensPermissionModel>>> GetUserActions(Guid userId);
    }
}

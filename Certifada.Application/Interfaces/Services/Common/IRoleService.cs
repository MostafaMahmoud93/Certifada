namespace Certifada.Application.Interfaces.Services.Common
{
    public interface IRoleService : IBaseService
    {
        Task<ServiceResponse<CollectionResponse<RoleModel>>> GetRoles();
        Task<ServiceResponse<List<RoleDDLModel>>> GetRolesDDL();
        Task<ServiceResponse<bool>> AddRole(AddRoleModel newRole);
        Task<ServiceResponse<bool>> EditRole(EditRoleModel model);
        Task<ServiceResponse<bool>> DeleteRole(Guid id);
    }
}

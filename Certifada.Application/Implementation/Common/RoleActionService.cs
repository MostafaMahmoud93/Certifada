namespace Certifada.Application.Implementation.Common;
public class RoleActionService : ServiceBase, IRoleActionService
{
    private readonly IConfiguration _configuration;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    public RoleActionService(IUnitOfWork unitOfWork, IMapper mapper, IConfiguration configuration, IUserAccessor userAccessor) : base(configuration, userAccessor)
    {
        _configuration = configuration;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ServiceResponse<bool>> AddEditRoleAction(RoleActionModel model)
    {
        try
        {
            RolePermission rolePermission = await _unitOfWork.RolePermissionRepository.FirstOrDefaultAsync(q => q.Role_Id == model.RoleId && q.Permission_Id == model.ActionId);

            if (model.IsAdd && rolePermission != null || !model.IsAdd && rolePermission == null) return new ServiceResponse<bool> { Success = false, Message = (model.IsAdd && rolePermission != null) == true ? "Already Added !" : "Already Deleted !" };

            if (model.IsAdd)
            {
                await _unitOfWork.RolePermissionRepository.AddAsync(new RolePermission { Permission_Id = model.ActionId, Role_Id = model.RoleId });
            }
            else
            {
                _unitOfWork.RolePermissionRepository.DeleteByEntity(rolePermission);
            }

            int result = await _unitOfWork.SaveChangesAsync();

            return new ServiceResponse<bool> { Success = result > 0, Message = ClutureResource.SavedSuccessfully };
        }
        catch (Exception ex)
        {

            return await LogErrorAsync(ex, false, model);
        }
    }

    /// <summary>Permission catalogue grouped by screen, each flagged as granted for the given role.</summary>
    public async Task<ServiceResponse<List<ScreenPermissionsModel>>> GetRoleActions(Guid roleId)
    {
        try
        {
            var grantedIds = (await _unitOfWork.RolePermissionRepository.GetAllAsync(rp => rp.Role_Id == roleId))
                .Select(rp => rp.Permission_Id).ToHashSet();

            var screens = BuildScreens(await _unitOfWork.PermissionRepository.GetAllAsync(), grantedIds);

            return new ServiceResponse<List<ScreenPermissionsModel>> { Success = true, Data = screens };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<List<ScreenPermissionsModel>>(ex, null, new { roleId });
        }
    }

    /// <summary>Full permission catalogue grouped by screen (nothing granted).</summary>
    public async Task<ServiceResponse<List<ScreenPermissionsModel>>> GetPermissionsCatalog()
    {
        try
        {
            var screens = BuildScreens(await _unitOfWork.PermissionRepository.GetAllAsync(), new HashSet<Guid>());
            return new ServiceResponse<List<ScreenPermissionsModel>> { Success = true, Data = screens };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<List<ScreenPermissionsModel>>(ex, null, new { });
        }
    }

    private static List<ScreenPermissionsModel> BuildScreens(List<Permission> perms, HashSet<Guid> grantedIds) =>
        perms
            .GroupBy(p => p.Screen_Key)
            .OrderBy(g => g.Key)
            .Select(g => new ScreenPermissionsModel
            {
                ScreenKey = g.Key,
                Actions = g.Select(p => new RolePermissionActionModel
                {
                    Id = p.Id,
                    Code = p.Code,
                    ShortDescription = p.Short_Description,
                    Description = p.Description,
                    IsGranted = grantedIds.Contains(p.Id)
                }).ToList()
            })
            .ToList();

    public async Task<ServiceResponse<bool>> AssignUserRole(Guid userId, Guid roleId)
    {
        try
        {
            var existing = await _unitOfWork.UserRoleRepository.FirstOrDefaultAsync(x => x.User_Id == userId);
            if (existing == null) await _unitOfWork.UserRoleRepository.AddAsync(new UserRole { User_Id = userId, Role_Id = roleId });
            else existing.Role_Id = roleId;
            int result = await _unitOfWork.SaveChangesAsync();
            return new ServiceResponse<bool> { Success = result > 0, Message = ClutureResource.SavedSuccessfully };
        }
        catch (Exception ex) { return await LogErrorAsync(ex, false, new { userId, roleId }); }
    }
}

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

    //public async Task<ServiceResponse<CollectionResponse<RoleScreensPermissionModel>>> GetRoleActions(Guid roleId)
    //{
    //    try
    //    {
    //        var dbRole = await _unitOfWork.RoleRepository.FindByIDAsync(roleId);
    //        MainModule dbModuleModel = await _unitOfWork.MainModuleRepository.GetAllQ()
    //           .Include(a => a.Screens.Where(s => s.Link != "#").OrderBy(a => a.Order))
    //           .ThenInclude(d => d.SubScreens.OrderBy(a => a.Order))
    //           .ThenInclude(a => a.LinkScreenActions.OrderBy(a => a.ScreenAction.Order)).ThenInclude(a => a.ScreenAction)
    //           .Include(a => a.Screens).ThenInclude(a => a.LinkScreenActions.OrderBy(a => a.ScreenAction.Order))
    //           .ThenInclude(a => a.RoleActions.Where(a => a.Role_Id == roleId))
    //           .FirstOrDefaultAsync(a => a.Id == CountMainModuleSystemID(dbRole.User_Type));
    //        List<RoleScreensPermissionModel> roleScreens = _mapper.Map<List<RoleScreensPermissionModel>>(dbModuleModel.Screens);

    //        return new ServiceResponse<CollectionResponse<RoleScreensPermissionModel>> { Success = true, Data = new CollectionResponse<RoleScreensPermissionModel>(roleScreens.Count(), roleScreens) };

    //    }
    //    catch (Exception ex)
    //    {

    //        return await LogErrorAsync<CollectionResponse<RoleScreensPermissionModel>>(ex, null, new { roleId });
    //    }
    //}
    public async Task<ServiceResponse<bool>> AddEditUserAction(UserActionModel model)
    {
        try
        {
            UserPermission userPermissions = await _unitOfWork.UserPermissionRepository.FirstOrDefaultAsync(q => q.Permission_Id == model.ActionId && q.User_Id == model.UserId);

            if (model.IsAdd && userPermissions != null || !model.IsAdd && userPermissions == null) return new ServiceResponse<bool> { Success = false, Message = (model.IsAdd && userPermissions != null) == true ? "Already Added !" : "Already Deleted !" };

            if (model.IsAdd)
            {
                await _unitOfWork.UserPermissionRepository.AddAsync(new UserPermission { Permission_Id = model.ActionId, User_Id = model.UserId });
            }
            else
            {
                _unitOfWork.UserPermissionRepository.DeleteByEntity(userPermissions);
            }

            int result = await _unitOfWork.SaveChangesAsync();

            return new ServiceResponse<bool> { Success = result > 0, Message = ClutureResource.SavedSuccessfully };
        }
        catch (Exception ex)
        {

            return await LogErrorAsync(ex, false, model);
        }
    }
    //public async Task<ServiceResponse<CollectionResponse<UserScreensPermissionModel>>> GetUserActions(Guid userId)
    //{
    //    try
    //    {
    //        var dbUser = await _unitOfWork.UserManager.FindByIdAsync(userId.ToString());  // i'm sorry for doing that
    //        MainModule dbModuleModel = await _unitOfWork.MainModuleRepository.GetAllQ()
    //            .Include(a => a.Screens.Where(s => s.Link != "#").OrderBy(a => a.Order))
    //            .ThenInclude(d => d.SubScreens.OrderBy(a => a.Order))
    //            .ThenInclude(a => a.LinkScreenActions.OrderBy(a => a.ScreenAction.Order)).ThenInclude(a => a.ScreenAction)
    //            .Include(a => a.Screens).ThenInclude(a => a.LinkScreenActions.OrderBy(a => a.ScreenAction.Order))
    //            .ThenInclude(a => a.UserActions.Where(a => a.User_Id == userId))
    //            .FirstOrDefaultAsync(a => a.Id == CountMainModuleSystemID(dbUser.User_Type));
    //        List<UserScreensPermissionModel> screens = _mapper.Map<List<UserScreensPermissionModel>>(dbModuleModel.Screens);

    //        return new ServiceResponse<CollectionResponse<UserScreensPermissionModel>> { Success = true, Data = new CollectionResponse<UserScreensPermissionModel>(screens.Count(), screens) };

    //    }
    //    catch (Exception ex)
    //    {

    //        return await LogErrorAsync<CollectionResponse<UserScreensPermissionModel>>(ex, null, new { userId });
    //    }
    //}
}

namespace Certifada.Application.Implementation.Common;
public class RoleService : ServiceBase, IRoleService
{

    private readonly IConfiguration _configuration;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    public RoleService(IUnitOfWork unitOfWork, IMapper mapper, IConfiguration configuration, IUserAccessor userAccessor) : base(configuration, userAccessor)
    {
        _configuration = configuration;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ServiceResponse<bool>> AddRole(AddRoleModel newGroup)
    {
        try
        {
            Role role = _mapper.Map<Role>(newGroup);
            await _unitOfWork.RoleRepository.AddAsync(role);
            var res = await _unitOfWork.SaveChangesAsync();
            if (res > 0)
                return new ServiceResponse<bool>() { Success = true, Data = true, Message = ClutureResource.SavedSuccessfully };
            else
                return new ServiceResponse<bool>() { Success = false, Data = false, Message = ClutureResource.FaildSave };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, null);
        }
    }
    public async Task<ServiceResponse<bool>> EditRole(EditRoleModel model)
    {
        try
        {
            #region Guard
            if (model == null)
                return new ServiceResponse<bool>() { Success = false, Data = false, Message = ClutureResource.FaildSave };
            Role dbUserRoles = await _unitOfWork.RoleRepository.FindByIDAsync(model.RoleId);
            if (dbUserRoles == null) return new ServiceResponse<bool> { Success = false, Data = false, Message = ClutureResource.FailedRetrieveData };
            #endregion
            _mapper.Map(model, dbUserRoles);
            var res = await _unitOfWork.SaveChangesAsync();

            return new ServiceResponse<bool> { Success = true, Data = true, Message = ClutureResource.SavedSuccessfully };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, null);
        }
    }
    public async Task<ServiceResponse<CollectionResponse<RoleModel>>> GetRoles()
    {
        try
        {
            List<RoleModel> rolesModel = await _unitOfWork.RoleRepository.GetAllWithSelectAsync(a => !a.Is_Deleted, s => new RoleModel() { RoleId = s.Id, Name = s.Name });
            return new ServiceResponse<CollectionResponse<RoleModel>> { Success = true, Data = new CollectionResponse<RoleModel>(rolesModel.Count(), rolesModel), Message = ClutureResource.SavedSuccessfully };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<CollectionResponse<RoleModel>>(ex, null, null);
        }
    }
    public async Task<ServiceResponse<List<RoleDDLModel>>> GetRolesDDL()
    {
        try
        {
            List<RoleDDLModel> rolesModel = await _unitOfWork.RoleRepository.GetAllWithSelectAsync(a => !a.Is_Deleted, s => new RoleDDLModel() { Id = s.Id, Name = s.Name });
            return new ServiceResponse<List<RoleDDLModel>> { Success = true, Data = rolesModel, Message = ClutureResource.RetrieveData };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<List<RoleDDLModel>>(ex, null, null);
        }
    }
    public async Task<ServiceResponse<bool>> DeleteRole(Guid id)
    {
        try
        {
            #region Guard
            Role dbRole = await _unitOfWork.RoleRepository.FindByIDAsync(id);
            if (dbRole.Users.Any() || dbRole.RolePermissions.Any()) return new ServiceResponse<bool> { Success = false, Data = false, Message = ClutureResource.TheGroupCannotBeDeletedForUseInTheSystem };
            #endregion
            dbRole.Is_Deleted = true;
            var res = await _unitOfWork.SaveChangesAsync();
            if (res > 0)
                return new ServiceResponse<bool>() { Success = true, Data = true, Message = ClutureResource.DeletedSuccessfully };
            else
                return new ServiceResponse<bool>() { Success = false, Data = false, Message = ClutureResource.FaildSave };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, id);
        }
    }
}

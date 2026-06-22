namespace Certifada.Application.Implementation.Common;
public class UserService : ServiceBase, IUserService
{
    private readonly IConfiguration _configuration;
    private readonly IFileManager _fileManager;
    private readonly IUnitOfWork _unitOfWork;
    private readonly UploadPath _uploadPath;
    private readonly IMapper _mapper;
    public UserService(UploadPath uploadPath, IUnitOfWork unitOfWork, IFileManager fileManager, IMapper mapper, IConfiguration configuration, IUserAccessor userAccessor) : base(configuration, userAccessor)
    {
        _configuration = configuration;
        _fileManager = fileManager;
        _unitOfWork = unitOfWork;
        _uploadPath = uploadPath;
        _mapper = mapper;
    }
    public async Task<ServiceResponse<bool>> CreateUser(AddUserModel newUser)
    {
        try
        {
            using (TransactionScope scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
            {
                bool isUserExest = _unitOfWork.UserRepository.Any(a => a.Email == newUser.Email.Trim());
                if (isUserExest) return new ServiceResponse<bool> { Success = false, Data = false, Message = ClutureResource.UserNameUsedBefore };
                User user = _mapper.Map<User>(newUser);
                user.Provider_Name = ProviderEnum.Local.ToString();
                user.Tenant_Id = await CreateTanent(newUser.FullName);
                if (newUser.ProfilePicture != null && newUser.ProfilePicture?.Length != 0)
                {
                    user.Profile_Picture_URL = await _fileManager.SaveFile(_uploadPath.LocalPath, $"imagesUserProfile/{user.Email}", Guid.NewGuid().ToString(), newUser.ProfilePicture);
                }
                user.Password_Hash = new PasswordHasher<User>().HashPassword(null, newUser.Password);
                await _unitOfWork.UserRepository.AddAsync(user);
                var rest = await _unitOfWork.SaveChangesAsync();
                scope.Complete();
                return new ServiceResponse<bool> { Success = true, Data = true, Message = ClutureResource.SavedSuccessfully };
            }
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, newUser);
        }
    }
    public async Task<ServiceResponse<bool>> EditUser(EditUserModel model)
    {
        try
        {
            using (TransactionScope scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
            {
                #region Guard
                if (model == null)
                    return new ServiceResponse<bool>() { Success = false, Data = false, Message = ClutureResource.FaildSave };

                User dbUser = await _unitOfWork.UserRepository.FindByIDAsync(model.Id);
                if (dbUser == null) return new ServiceResponse<bool> { Success = false, Data = false, Message = ClutureResource.FailedRetrieveData };
                #endregion
                _mapper.Map(model, dbUser);
                if (model.ProfilePicture != null && model.ProfilePicture?.Length != 0)
                {
                    dbUser.Profile_Picture_URL = await _fileManager.SaveFile(_uploadPath.LocalPath, $"imagesUserProfile/{model.Email}", Guid.NewGuid().ToString(), model.ProfilePicture);
                }
                var rest = await _unitOfWork.SaveChangesAsync();
                scope.Complete();
                return new ServiceResponse<bool> { Success = true, Data = true, Message = ClutureResource.SavedSuccessfully };
            }
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, model);
        }
    }
    public async Task<ServiceResponse<bool>> UpdateImgeProfileUser(IFormFile? profilePicture)
    {
        try
        {
            if (profilePicture == null) return new ServiceResponse<bool> { Success = false, Data = false, Message = ClutureResource.FaildSave };
            using (TransactionScope scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
            {
                User user = await _unitOfWork.UserRepository.FindByIDAsync(UserId.Value);
                if (user == null) return new ServiceResponse<bool> { Success = false, Data = false, Message = ClutureResource.FaildSave };
                if (profilePicture != null && profilePicture?.Length != 0)
                {
                    user.Profile_Picture_URL = await _fileManager.SaveFile(_uploadPath.LocalPath, $"imagesUserProfile/{user.Email}", Guid.NewGuid().ToString(), profilePicture);
                }
                var rest = await _unitOfWork.SaveChangesAsync();
                scope.Complete();
                return new ServiceResponse<bool> { Success = true, Data = true, Message = ClutureResource.SavedSuccessfully };
            }
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, profilePicture);
        }
    }
    public async Task<ServiceResponse<CollectionResponse<UserModel>>> GetUsers()
    {
        try
        {
            List<User> users = await _unitOfWork.UserRepository.GetAllAsync(a => !a.Is_Deleted);
            if (users == null) return new ServiceResponse<CollectionResponse<UserModel>> { Success = false, Data = null, Message = ClutureResource.FailedRetrieveData };
            List<UserModel> usersModel = _mapper.Map<List<UserModel>>(users);
            return new ServiceResponse<CollectionResponse<UserModel>> { Success = true, Data = new CollectionResponse<UserModel>(usersModel.Count(), usersModel), Message = ClutureResource.RetrieveData };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<CollectionResponse<UserModel>>(ex, null, null);
        }
    }
    public async Task<ServiceResponse<CollectionResponse<UserModel>>> SearchUser(string query)
    {
        try
        {
            List<User> users = await _unitOfWork.UserRepository.GetAllAsync(a => !a.Is_Deleted && (a.Full_Name.Contains(query) || a.Email.Contains(query)) || query == null);
            if (users == null) return new ServiceResponse<CollectionResponse<UserModel>> { Success = false, Data = null, Message = ClutureResource.FailedRetrieveData };
            List<UserModel> usersModel = _mapper.Map<List<UserModel>>(users);
            return new ServiceResponse<CollectionResponse<UserModel>> { Success = true, Data = new CollectionResponse<UserModel>(usersModel.Count(), usersModel), Message = ClutureResource.RetrieveData };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<CollectionResponse<UserModel>>(ex, null, null);
        }
    }
    public async Task<ServiceResponse<DetailUserModel>> GetUser(Guid userId)
    {
        try
        {
            User user = await _unitOfWork.UserRepository.FindByIDAsync(userId);
            if (user == null) return new ServiceResponse<DetailUserModel> { Success = false, Data = null, Message = ClutureResource.FailedRetrieveData };
            DetailUserModel userModel = _mapper.Map<DetailUserModel>(user);
            return new ServiceResponse<DetailUserModel> { Success = true, Data = userModel, Message = ClutureResource.RetrieveData };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<DetailUserModel>(ex, null, userId);
        }
    }
    public async Task<ServiceResponse<bool>> DeleteUser(Guid userId)
    {
        try
        {
            User user = await _unitOfWork.UserRepository.FindByIDAsync(userId);
            if (user == null) return new ServiceResponse<bool> { Success = false, Data = false, Message = ClutureResource.FailedRetrieveData };
            _unitOfWork.UserRepository.SoftDeleteById(userId);
            var rest = await _unitOfWork.SaveChangesAsync();
            return new ServiceResponse<bool> { Success = true, Data = true, Message = ClutureResource.RetrieveData };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, userId);
        }
    }
    public async Task<ServiceResponse<DetailUserModel>> GetCurrentUser()
    {
        try
        {
            User user = await _unitOfWork.UserRepository.FindByIDAsync(UserId.Value);
            if (user == null) return new ServiceResponse<DetailUserModel> { Success = false, Data = null, Message = ClutureResource.FailedRetrieveData };
            DetailUserModel userModel = _mapper.Map<DetailUserModel>(user);
            return new ServiceResponse<DetailUserModel> { Success = true, Data = userModel, Message = ClutureResource.RetrieveData };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<DetailUserModel>(ex, null, GetUserId());
        }
    }
    public async Task<ServiceResponse<bool>> UpdateImgeSignatureUser(IFormFile signaturePicture)
    {
        try
        {
            bool uploadResult = false;
            User dbUser = await _unitOfWork.UserRepository.FindByIDAsync(UserId.Value);
            if (signaturePicture != null && signaturePicture.Length != 0)
            {
                dbUser.Signature_URL = await _fileManager.SaveFile(_uploadPath.LocalPath, $"signaturePicture/{GetUserId()}", $"{Guid.NewGuid()}.png", signaturePicture);
                uploadResult = await _unitOfWork.SaveChangesAsync() > 0;
            }
            return new ServiceResponse<bool> { Success = uploadResult, Data = uploadResult, Message = uploadResult ? ClutureResource.SavedSuccessfully : ClutureResource.ErrorOccurredWhileSending };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, GetUserId());
        }
    }
    #region private help function
    private async Task<Guid> CreateTanent(string fullName)
    {
        Tenant tenant = new Tenant()
        {
            Name = GenerateTenantName(fullName),
            Is_Active = true
        };
        await _unitOfWork.TenantRepository.AddAsync(tenant);
        await _unitOfWork.SaveChangesAsync();
        return tenant.Id;
    }
    private static string GenerateTenantName(string fullName)
    {
        string baseName = Regex.Replace(fullName.ToLower().Trim(), @"\s+", "-");
        string uniquePart = Guid.NewGuid().ToString("N").Substring(0, 8);
        return $"{baseName}-{uniquePart}";
    }
    #endregion
}

namespace Certifada.Application.Implementation.Common;
public class AuthService : ServiceBase, IAuthService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    public AuthService(IUnitOfWork unitOfWork, IMapper mapper, IHttpContextAccessor httpContextAccessor, IConfiguration configuration, IUserAccessor userAccessor) : base(configuration, userAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    public async Task<string> TestDBAsync()
    {
        return (await _unitOfWork.TestDBAsync()) ? "✅ Database connection successful (Certifada_DbContext)." : "❌ Database connection failed.";
    }
    public async Task<string> TestDBTablesAsync()
    {
        var tableResults = await _unitOfWork.TestDBTablesAsync();

        var report = string.Join("\n", tableResults.Select(r => $"{r.Key}: {r.Value}"));
        return report;
    }
    public async Task<ServiceResponse<TokenModel>> Token(LoginModel model)
    {
        try
        {
            User user = await _unitOfWork.UserRepository.FirstOrDefaultAsync(a=>a.Email == model.Email.Trim());
            if (user != null)
            {
                var thirtyMinutesAgo = DateTime.UtcNow.AddMinutes(-30);
                int failedLoginAttempts = await _unitOfWork.UserLoginLogRepository.GetAllQ().CountAsync(log => log.User_Id == user.Id && log.Login_Time >= thirtyMinutesAgo && !log.Is_Successful);

                if (failedLoginAttempts >= 5)
                {
                    return new ServiceResponse<TokenModel> { Success = false, Data = null, Message = string.Format(ClutureResource.FailedLoginPleaseTryAgainAfterMinutes, 30) };
                }
            }
            PasswordVerificationResult result = PasswordVerificationResult.Failed;
            if (user != null && !string.IsNullOrEmpty(user.Password_Hash))
            {
                result = new PasswordHasher<object>().VerifyHashedPassword(null, user.Password_Hash, model.Password.Trim());
                // Create a new login log entry
                UserLoginLog loginLog = new UserLoginLog
                {
                    Id = Guid.NewGuid(),
                    User_Id = user.Id,
                    Login_Time = DateTime.UtcNow,
                    IP_Address = GetIpAddress(), // Implement this method to capture the IP address
                    Is_Successful = result == PasswordVerificationResult.Success,
                    Is_Deleted = false
                };
                // Log the login attempt
                await _unitOfWork.UserLoginLogRepository.AddAsync(loginLog);
                await _unitOfWork.SaveChangesAsync();
            }

            if (user == null || result != PasswordVerificationResult.Success) return new ServiceResponse<TokenModel> { Success = false, Data = null, Message = ClutureResource.NotAuthorized };
            if (!user.Is_Active) return new ServiceResponse<TokenModel> { Success = false, Data = null, Message = ClutureResource.InActiveAccount };
            TokenModel token = await GenerateToken(user, model.Password.Trim(), _configuration["Jwt:Key"]!, _configuration["Jwt:Issuer"]!, _configuration["Jwt:Audience"]!, 1440);

            if (token != null)
            {
                return new ServiceResponse<TokenModel> { Success = true, Data = token, Message = ClutureResource.SenedSuccessfully };
            }
            return new ServiceResponse<TokenModel> { Success = false, Data = null, Message = ClutureResource.NotAuthorized };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<TokenModel>(ex, null, model);
        }
    }
    #region SocialMediaAuth
    public async Task<ServiceResponse<TokenModel>> TokenSocialMedia(string email , string name , ProviderEnum providerName, string providerId)
    {
        try
        {
            User user = await _unitOfWork.UserRepository.FirstOrDefaultAsync(a => a.Email == email);
            if (user == null)
                user = await CreateSocialMediaUser(email, name, providerName, providerId);
            if (user != null)
            {
                var thirtyMinutesAgo = DateTime.UtcNow.AddMinutes(-30);
                int failedLoginAttempts = await _unitOfWork.UserLoginLogRepository.GetAllQ().CountAsync(log => log.User_Id == user.Id && log.Login_Time >= thirtyMinutesAgo && !log.Is_Successful);

                if (failedLoginAttempts >= 5)
                {
                    return new ServiceResponse<TokenModel> { Success = false, Data = null, Message = string.Format(ClutureResource.FailedLoginPleaseTryAgainAfterMinutes, 30) };
                }
                UserLoginLog loginLog = new UserLoginLog
                {
                    Id = Guid.NewGuid(),
                    User_Id = user.Id,
                    Login_Time = DateTime.UtcNow,
                    IP_Address = GetIpAddress(), // Implement this method to capture the IP address
                    Is_Successful = true,
                    Is_Deleted = false
                };
                await _unitOfWork.UserLoginLogRepository.AddAsync(loginLog);
                await _unitOfWork.SaveChangesAsync();
            }

            if (user == null) return new ServiceResponse<TokenModel> { Success = false, Data = null, Message = ClutureResource.NotAuthorized };
            if (!user.Is_Active) return new ServiceResponse<TokenModel> { Success = false, Data = null, Message = ClutureResource.InActiveAccount };
            TokenModel token = await GenerateToken(user, null, _configuration["Jwt:Key"]!, _configuration["Jwt:Issuer"]!, _configuration["Jwt:Audience"]!, 1440);

            if (token != null)
            {
                return new ServiceResponse<TokenModel> { Success = true, Data = token, Message = ClutureResource.SenedSuccessfully };
            }
            return new ServiceResponse<TokenModel> { Success = false, Data = null, Message = ClutureResource.NotAuthorized };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<TokenModel>(ex, null, new { email, name, providerName, providerId });
        }
    }
    private async Task<User> CreateSocialMediaUser(string email, string name, ProviderEnum providerName, string providerId)
    {
        using (TransactionScope scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
        {
            User user = new User()
            {
                Email = email,
                Full_Name = name,
                Provider_Name = providerName.ToString(),
                Provider_Id = providerId,
                Tenant_Id = await CreateTanent(name),
                Is_Active = true
            };
            await _unitOfWork.UserRepository.AddAsync(user);
            var rest = await _unitOfWork.SaveChangesAsync();
            scope.Complete();
            return user;
        }
    }
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
    public async Task<ServiceResponse<bool>> IfUserHasActions(string baseRoute)
    {
        try
        {
            List<VW_UserActions> userActions = await _unitOfWork.VWUserActions.GetAllAsync(q => q.User_Id == UserId);
            return new ServiceResponse<bool>() { Success = true, Data = !userActions.Any(q => baseRoute.ToLower().Contains(q.Base_Route.ToLower())), Message = ClutureResource.YouDoNotHavePermissionForScreen };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, null);
        }
    }
    #region private help function
    private async Task<TokenModel> GenerateToken(User user, string? password, string topSecretKey, string issuer, string audience, int ExpireTime = 0)
    {
        if (user != null)
        {
            var claims = new[]{
                new Claim(JwtRegisteredClaimNames.NameId, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Email),
                new Claim("Exp", ExpireTime.ToString()),
            };
            var superSecretPassword = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(topSecretKey));
            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                expires: DateTime.UtcNow.AddMinutes(ExpireTime),
                claims: claims,
                signingCredentials: new SigningCredentials(superSecretPassword, SecurityAlgorithms.HmacSha256)
            );
            //string[] userActions = await _unitOfWork.VWUserActions.GetAllQ().Where(q => q.User_Id == user.Id).Select(a => a.Action_Code).ToArrayAsync();
            return new TokenModel
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Expiration = token.ValidTo,
                UserId = user.Id,
                //UserActions = userActions
            };
        }
        return null;
    }
    private string GetIpAddress()
    {
        // Implement logic to get IP address
        return "0.0.0.0"; // Example
    }
    #endregion
}

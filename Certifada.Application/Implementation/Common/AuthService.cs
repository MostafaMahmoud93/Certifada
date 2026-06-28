using Certifada.Application.Interfaces.Services.Email;
namespace Certifada.Application.Implementation.Common;
public class AuthService : ServiceBase, IAuthService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IConfiguration _configuration;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IMailService _mailService;
    public AuthService(IUnitOfWork unitOfWork, IMapper mapper, IHttpContextAccessor httpContextAccessor, IConfiguration configuration, IUserAccessor userAccessor, IMailService mailService) : base(configuration, userAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
        _configuration = configuration;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _mailService = mailService;
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
    public async Task<ServiceResponse<TokenModel>> Register(RegisterModel model)
    {
        try
        {
            var email = (model.Email ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(model.Password))
                return new ServiceResponse<TokenModel> { Success = false, Data = null, Message = "Email and password are required." };

            var existing = await _unitOfWork.UserRepository.FirstOrDefaultAsync(a => a.Email == email);
            if (existing != null)
                return new ServiceResponse<TokenModel> { Success = false, Data = null, Message = "An account with this email already exists." };

            var hash = new PasswordHasher<object>().HashPassword(null, model.Password.Trim());
            User user;
            using (TransactionScope scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled))
            {
                user = new User
                {
                    Email = email,
                    Full_Name = string.IsNullOrWhiteSpace(model.FullName) ? email.Split('@')[0] : model.FullName.Trim(),
                    Password_Hash = hash,
                    Is_Active = true,
                    Tenant_Id = await CreateTanent(string.IsNullOrWhiteSpace(model.FullName) ? email : model.FullName)
                };
                await _unitOfWork.UserRepository.AddAsync(user);
                await _unitOfWork.SaveChangesAsync();
                scope.Complete();
            }

            // Welcome email — best-effort; never block signup on a mail failure.
            try
            {
                await _mailService.SendTemplatedAsync(EmailTemplateEnum.Welcome, email, new Dictionary<string, string>
                {
                    ["name"] = user.Full_Name,
                    ["link"] = $"{_configuration["Frontend:Url"]}/auth/login"
                });
            }
            catch { /* ignore mail failure */ }

            var token = await GenerateToken(user, null, _configuration["Jwt:Key"]!, _configuration["Jwt:Issuer"]!, _configuration["Jwt:Audience"]!, 1440);
            return new ServiceResponse<TokenModel> { Success = true, Data = token, Message = ClutureResource.SenedSuccessfully };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<TokenModel>(ex, null, model);
        }
    }

    public async Task<ServiceResponse<bool>> ForgotPassword(ForgotPasswordModel model)
    {
        try
        {
            var email = (model.Email ?? string.Empty).Trim();
            var user = await _unitOfWork.UserRepository.FirstOrDefaultAsync(a => a.Email == email);
            if (user != null)
            {
                var token = GenerateActionToken(user.Id, "reset", 30);
                var link = $"{_configuration["Frontend:Url"]}/auth/reset?token={Uri.EscapeDataString(token)}";
                try
                {
                    await _mailService.SendTemplatedAsync(EmailTemplateEnum.ResetPassword, email, new Dictionary<string, string>
                    {
                        ["name"] = user.Full_Name ?? string.Empty,
                        ["link"] = link
                    });
                }
                catch { /* ignore mail failure */ }
            }
            // Always succeed so we never reveal whether an account exists.
            return new ServiceResponse<bool> { Success = true, Data = true, Message = "If an account exists for that email, a reset link has been sent." };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, model);
        }
    }

    public async Task<ServiceResponse<bool>> ResetPassword(ResetPasswordModel model)
    {
        try
        {
            var userId = ValidateActionToken(model.Token, "reset");
            if (userId == null)
                return new ServiceResponse<bool> { Success = false, Data = false, Message = "This reset link is invalid or has expired." };

            var user = await _unitOfWork.UserRepository.FirstOrDefaultAsync(a => a.Id == userId.Value);
            if (user == null)
                return new ServiceResponse<bool> { Success = false, Data = false, Message = ClutureResource.NotAuthorized };

            var hash = new PasswordHasher<object>().HashPassword(null, model.Password.Trim());
            await _unitOfWork.UserRepository.ExecuteUpdateAsync(a => a.Id == userId.Value, s => s.SetProperty(b => b.Password_Hash, hash));
            return new ServiceResponse<bool> { Success = true, Data = true, Message = ClutureResource.SenedSuccessfully };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, model);
        }
    }

    private string GenerateActionToken(Guid userId, string purpose, int minutes)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.NameId, userId.ToString()),
            new Claim("purpose", purpose)
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            expires: DateTime.UtcNow.AddMinutes(minutes),
            claims: claims,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private Guid? ValidateActionToken(string token, string purpose)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var parms = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"],
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)),
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            };
            var principal = handler.ValidateToken(token, parms, out _);
            if (principal.FindFirst("purpose")?.Value != purpose) return null;
            var id = principal.FindFirst(JwtRegisteredClaimNames.NameId)?.Value
                  ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(id, out var g) ? g : (Guid?)null;
        }
        catch { return null; }
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
            // Real permission codes for this user — derived directly from RolePermission + UserPermission
            // (no DB view dependency). Drives the Angular RBAC: appHasAction / *appCanAction / guards.
            string[] userActions = Array.Empty<string>();
            try
            {
                var permissionIds = new List<Guid>();
                if (user.Role_Id.HasValue)
                    permissionIds.AddRange((await _unitOfWork.RolePermissionRepository.GetAllAsync(rp => rp.Role_Id == user.Role_Id.Value)).Select(rp => rp.Permission_Id));
                permissionIds.AddRange((await _unitOfWork.UserPermissionRepository.GetAllAsync(up => up.User_Id == user.Id)).Select(up => up.Permission_Id));
                var distinctIds = permissionIds.Distinct().ToList();
                if (distinctIds.Count > 0)
                {
                    var codes = await _unitOfWork.PermissionRepository.GetAllWithSelectAsync(pm => distinctIds.Contains(pm.Id), pm => pm.Code);
                    userActions = codes.Where(c => !string.IsNullOrWhiteSpace(c)).Distinct().ToArray();
                }
            }
            catch { userActions = Array.Empty<string>(); }
            return new TokenModel
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Expiration = token.ValidTo,
                UserId = user.Id,
                UserActions = userActions
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

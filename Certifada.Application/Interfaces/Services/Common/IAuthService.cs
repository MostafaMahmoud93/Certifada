namespace Certifada.Application.Interfaces.Services.Common
{
    public interface IAuthService : IBaseService
    {
        Task<string> TestDBAsync();
        Task<string> TestDBTablesAsync();
        Task<ServiceResponse<TokenModel>> Token(LoginModel model);
        Task<ServiceResponse<bool>> IfUserHasActions(string baseRoute);
        Task<ServiceResponse<TokenModel>> TokenSocialMedia(string email, string name, ProviderEnum providerName, string providerId);

        Task<ServiceResponse<TokenModel>> Register(RegisterModel model);
        Task<ServiceResponse<bool>> ForgotPassword(ForgotPasswordModel model);
        Task<ServiceResponse<bool>> ResetPassword(ResetPasswordModel model);
    }
}

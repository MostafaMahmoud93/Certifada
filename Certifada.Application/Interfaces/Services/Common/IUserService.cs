namespace Certifada.Application.Interfaces.Services.Common
{
    public interface IUserService : IBaseService
    {
        Task<ServiceResponse<bool>> UpdateImgeSignatureUser(IFormFile signaturePicture);
        Task<ServiceResponse<CollectionResponse<UserModel>>> SearchUser(string query);
        Task<ServiceResponse<bool>> UpdateImgeProfileUser(IFormFile? profilePicture);
        Task<ServiceResponse<CollectionResponse<UserModel>>> GetUsers();
        Task<ServiceResponse<DetailUserModel>> GetUser(Guid userId);
        Task<ServiceResponse<bool>> CreateUser(AddUserModel newUser);
        Task<ServiceResponse<bool>> EditUser(EditUserModel model);
        Task<ServiceResponse<DetailUserModel>> GetCurrentUser();
        Task<ServiceResponse<bool>> UpdateProfile(UpdateProfileModel model);
        Task<ServiceResponse<bool>> DeleteUser(Guid userId);
    }
}

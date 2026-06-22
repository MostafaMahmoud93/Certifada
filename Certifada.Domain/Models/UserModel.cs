namespace Certifada.Domain.Models
{
    public class UserModel
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string? ProfilePictureURL { get; set; }
    }
    public class AddUserModel
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string? Password { get; set; }
        public Guid RoleId { get; set; }
        public IFormFile? ProfilePicture { get; set; }
        public bool IsActive { get; set; }
    }
    public class EditUserModel : AddUserModel
    {
        public Guid Id { get; set; }
    }
    public class DetailUserModel
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string UserRole { get; set; }
        public IFormFile? ProfilePicture { get; set; }
        public string? ProfilePictureURL { get; set; }
        public string? SigneePictureURL { get; set; }
        public bool IsActive { get; set; }
    }
    public class UsersDDLModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
    }
}

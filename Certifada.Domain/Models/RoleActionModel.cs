namespace Certifada.Domain.Models
{
    public class RoleActionModel
    {
        public Guid ActionId { get; set; }
        public Guid RoleId { get; set; }
        public bool IsAdd { get; set; }
    }

    public class UserActionModel
    {
        public Guid ActionId { get; set; }
        public Guid UserId { get; set; }
        public bool IsAdd { get; set; }
    }


    public class ViewRoleActionModel
    {
        public Guid ActionId { get; set; }
        public string ActionName { get; set; }
        public bool Status { get; set; }
    }
    public class RoleScreenActionsModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public bool IsActive { get; set; }
    }
    public class RoleScreensPermissionModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int Order { get; set; }
        public List<RoleScreenActionsModel> ScreenActions { get; set; }
    }

    public class UserScreenActionsModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public bool IsActive { get; set; }
    }
    public class UserScreensPermissionModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public int Order { get; set; }
        public List<UserScreenActionsModel> ScreenActions { get; set; }
    }
}

namespace Certifada.Domain.Models
{
    /// <summary>Grant/revoke a single permission on a role.</summary>
    public class RoleActionModel
    {
        public Guid ActionId { get; set; }
        public Guid RoleId { get; set; }
        public bool IsAdd { get; set; }
    }

    /// <summary>Assign a role to a user (one role per user).</summary>
    public class AssignUserRoleModel
    {
        public Guid UserId { get; set; }
        public Guid RoleId { get; set; }
    }

    public class ViewRoleActionModel
    {
        public Guid ActionId { get; set; }
        public string ActionName { get; set; }
        public bool Status { get; set; }
    }

    /// <summary>A single permission (action) with whether the role currently grants it.</summary>
    public class RolePermissionActionModel
    {
        public Guid Id { get; set; }
        public string Code { get; set; }
        public string? ShortDescription { get; set; }
        public string? Description { get; set; }
        public bool IsGranted { get; set; }
    }

    /// <summary>All permissions of one screen, with per-permission granted flags for a role.</summary>
    public class ScreenPermissionsModel
    {
        public string ScreenKey { get; set; }
        public List<RolePermissionActionModel> Actions { get; set; } = new();
    }
}

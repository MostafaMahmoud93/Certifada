namespace Certifada.Domain.Entities.Identity
{
    public class RolePermission
    {
        public Guid Permission_Id { get; set; }
        public Guid Role_Id { get; set; }
        public virtual Permission Permission { get; set; }
        public virtual Role Role { get; set; }
    }
}

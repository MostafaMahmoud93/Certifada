namespace Certifada.Domain.Entities.Identity
{
    public class UserPermission
    {
        public Guid Permission_Id { get; set; }
        public Guid User_Id { get; set; }
        public virtual Permission Permission { get; set; }
        public virtual User User { get; set; }
    }
}

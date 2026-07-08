namespace Certifada.Domain.Entities.Identity
{
    /// <summary>Assigns a role to a user. User_Id is the primary key -> one role per user.</summary>
    public class UserRole
    {
        public Guid User_Id { get; set; }
        public Guid Role_Id { get; set; }
        public virtual User User { get; set; }
        public virtual Role Role { get; set; }
    }
}

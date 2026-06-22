namespace Certifada.Domain.Entities.Identity;
public class Role : BaseCommonEntity<Guid>
{
    public Guid Tenant_Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required string Role_Code { get; set; }
    public bool Is_System { get; set; }
    public bool Is_Active { get; set; }
    public DateTime Created_Date { get; set; } = DateTime.Now;
    public Guid Created_By { get; set; }
    public virtual Tenant Tenant { get; set; }
    public virtual ICollection<RolePermission> RolePermissions { get; set; }
    public virtual ICollection<User> Users { get; set; }
}

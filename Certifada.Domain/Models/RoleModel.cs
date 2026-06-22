namespace Certifada.Domain.Models;
public class RoleModel
{
    public Guid RoleId { get; set; }
    public string Name { get; set; }
    public bool IsDeleted { get; set; }
}
public class RoleDDLModel
{
    public Guid Id { get; set; }
    public string Name { get; set; }
}
public class AddRoleModel
{
    public string Name { get; set; }
}
public class EditRoleModel
{
    public Guid RoleId { get; set; }
    public string Name { get; set; }
}

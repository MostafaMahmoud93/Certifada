namespace Certifada.Domain.Models;
public class RoleModel
{
    public Guid RoleId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public bool IsSystem { get; set; }
    public bool IsDeleted { get; set; }
    public int Members { get; set; }
    public List<string> Codes { get; set; } = new();
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
    public string Description { get; set; }
}

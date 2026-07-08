namespace Certifada.Infrastructure.Configuration;
public class RoleConfig : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.HasKey(a => a.Id);
        builder.HasOne(q => q.Tenant).WithMany(x => x.Roles).HasForeignKey(q => q.Tenant_Id);
    }
}
public class SystemRoleConfig : IEntityTypeConfiguration<SystemRole>
{
    public void Configure(EntityTypeBuilder<SystemRole> builder)
    {
        builder.HasKey(a => a.Id);
    }
}
public class SystemRolePermissionConfig : IEntityTypeConfiguration<SystemRolePermission>
{
    public void Configure(EntityTypeBuilder<SystemRolePermission> builder)
    {
        builder.HasKey(a => new { a.Role_Id, a.Permission_Id });
        builder.HasOne(q => q.Permission).WithMany(x => x.SystemRolePermissions).HasForeignKey(q => q.Permission_Id).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(q => q.SystemRole).WithMany(x => x.SystemRolePermissions).HasForeignKey(q => q.Role_Id).OnDelete(DeleteBehavior.NoAction);
    }
}
public class PermissionConfig : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.HasKey(a => a.Id);
    }
}
public class TenantConfig : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.HasKey(a => a.Id);
    }
}
public class TenantFeatureOverrideConfig : IEntityTypeConfiguration<TenantFeatureOverride>
{
    public void Configure(EntityTypeBuilder<TenantFeatureOverride> builder)
    {
        builder.HasKey(a => a.Id);
    }
}
public class UnitConfig : IEntityTypeConfiguration<Unit>
{
    public void Configure(EntityTypeBuilder<Unit> builder)
    {
        builder.HasKey(a => a.Id);
        builder.HasOne(q => q.Tenant).WithMany(x => x.Units).HasForeignKey(q => q.Tenant_Id).OnDelete(DeleteBehavior.NoAction);
    }
}
public class UnitBrandingConfig : IEntityTypeConfiguration<UnitBranding>
{
    public void Configure(EntityTypeBuilder<UnitBranding> builder)
    {
        builder.HasKey(a => a.Id);
        builder.HasOne(q => q.Unit).WithMany(x => x.UnitBrands).HasForeignKey(q => q.Unit_Id).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(q => q.UserCreated).WithMany(x => x.UserCreatedUnitBrands).HasForeignKey(q => q.Created_By).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(q => q.UserUpdated).WithMany(x => x.UserUpdatedUnitBrands).HasForeignKey(q => q.Last_Modified_By).OnDelete(DeleteBehavior.NoAction);
    }
}
public class TenantBrandingConfig : IEntityTypeConfiguration<TenantBranding>
{
    public void Configure(EntityTypeBuilder<TenantBranding> builder)
    {
        builder.HasKey(a => a.Id);
        builder.HasOne(q => q.Tenant).WithMany(x => x.TenantBrands).HasForeignKey(q => q.Tenant_Id).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(q => q.UserCreated).WithMany(x => x.UserCreatedTenantBrands).HasForeignKey(q => q.Created_By).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(q => q.UserUpdated).WithMany(x => x.UserUpdatedTenantBrands).HasForeignKey(q => q.Last_Modified_By).OnDelete(DeleteBehavior.NoAction);
    }
}
public class UserConfig : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(a => a.Id);
        builder.HasOne(q => q.Tenant).WithMany(x => x.Users).HasForeignKey(q => q.Tenant_Id).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(q => q.Role).WithMany(x => x.Users).HasForeignKey(q => q.Role_Id).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(q => q.Unit).WithMany(x => x.Users).HasForeignKey(q => q.Unit_Id).OnDelete(DeleteBehavior.NoAction);
    }
}
public class UserRoleConfig : IEntityTypeConfiguration<UserRole>
{
    public void Configure(EntityTypeBuilder<UserRole> builder)
    {
        builder.HasKey(a => a.User_Id); // one role per user
        builder.HasOne(q => q.User).WithOne().HasForeignKey<UserRole>(q => q.User_Id).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(q => q.Role).WithMany().HasForeignKey(q => q.Role_Id).OnDelete(DeleteBehavior.NoAction);
    }
}
public class RolePermissionConfig : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> builder)
    {
        builder.HasKey(a=> new {a.Role_Id, a.Permission_Id });
        builder.HasOne(q => q.Permission).WithMany(x => x.RolePermissions).HasForeignKey(q => q.Permission_Id).OnDelete(DeleteBehavior.NoAction);
        builder.HasOne(q => q.Role).WithMany(x => x.RolePermissions).HasForeignKey(q => q.Role_Id).OnDelete(DeleteBehavior.NoAction);
    }
}
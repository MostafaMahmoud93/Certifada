using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Identity
{
    public class Permission : BaseCommonEntity<Guid>
    {
        public required string Screen_Key { get; set; }
        public required string Code { get; set; }
        public string? Description { get; set; }
        public virtual ICollection<SystemRolePermission> SystemRolePermissions { get; set; }
        public virtual ICollection<RolePermission> RolePermissions { get; set; }
        public virtual ICollection<UserPermission> UserPermissions { get; set; }
    }
}

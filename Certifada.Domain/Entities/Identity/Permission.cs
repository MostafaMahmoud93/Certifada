using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Identity
{
    public class Permission : BaseCommonEntity<Guid>
    {
        public required string Screen_Key { get; set; }
        public required string Code { get; set; }
        /// <summary>Short one-line hint shown under each action in the UI.</summary>
        public string? Short_Description { get; set; }
        /// <summary>Full, detailed explanation shown in the "what does this do?" popup.</summary>
        public string? Description { get; set; }
        public virtual ICollection<SystemRolePermission> SystemRolePermissions { get; set; }
        public virtual ICollection<RolePermission> RolePermissions { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Identity
{
    public class SystemRole : BaseCommonEntity<Guid>
    {
        public required string Role_Name { get; set; }
        public required string Description { get; set; }
        public required string Role_Code { get; set; }
        public bool Is_Active { get; set; }
        public virtual ICollection<SystemRolePermission> SystemRolePermissions { get; set; }
    }
}

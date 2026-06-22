using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Identity
{
    public class SystemRolePermission
    {
        public Guid Permission_Id { get; set; }
        public Guid Role_Id { get; set; }
        public virtual Permission Permission { get; set; }
        public virtual SystemRole SystemRole { get; set; }
    }
}

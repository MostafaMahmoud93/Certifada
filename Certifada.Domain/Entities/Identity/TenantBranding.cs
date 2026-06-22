using System;
using System.Collections.Generic;
using System.Text;

namespace Certifada.Domain.Entities.Identity
{
    public class TenantBranding : FullBaseEntity<Guid>
    {
        public Guid Tenant_Id { get; set; }
        public string? DisplayName { get; set; }
        public string? Description { get; set; }
        public string? LogoUrl { get; set; }
        public string? FaviconUrl { get; set; }
        public string? PrimaryColor { get; set; }
        public string? SecondaryColor { get; set; }
        public string? BackgroundColor { get; set; }
        public string? FontFamily { get; set; }
        public string? ThemeJson { get; set; }
        public string? Locale { get; set; }
        public string? Domain { get; set; }
        public bool? DarkModeEnabled { get; set; }
        public bool? ShowBranding { get; set; }
        public bool? OverrideTenantBranding { get; set; }
        public string? TwitterUrl { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? FacebookUrl { get; set; }
        public string? SupportEmail { get; set; }
        public string? WebsiteUrl { get; set; }
        public virtual Tenant Tenant { get; set; }
        public virtual User UserCreated { get; set; }
        public virtual User? UserUpdated { get; set; }
    }
}

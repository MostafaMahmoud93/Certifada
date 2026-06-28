using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Certifada.API.Middleware
{
    /// <summary>
    /// Gates access to uploaded files served from the upload root (wwwroot).
    ///
    ///  • Public assets — certificate preview images, issuer/tenant logos — pass
    ///    straight through so the public verification page keeps working with no auth.
    ///  • Private folders (signatures, profile pictures, attachments) require an
    ///    authenticated user who OWNS the file. The owner is encoded as the 2nd path
    ///    segment (e.g. /signaturePicture/{userId}/.., /imagesUserProfile/{email}/..).
    ///  • Auth is read from the Authorization: Bearer header OR an ?access_token=
    ///    query parameter, so plain &lt;img src&gt; tags can still load private images.
    ///  • Path traversal ("..", null bytes) and dotfiles are rejected outright.
    ///
    /// Register AFTER UseAuthentication/UseAuthorization and BEFORE UseStaticFiles.
    /// </summary>
    public class SecureFilesMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _config;

        // Private prefixes -> how to identify the owner from path segment [1].
        private static readonly (string Prefix, string OwnerKind)[] PrivateAreas =
        {
            ("/signaturePicture", "id"),
            ("/imagesUserProfile", "email"),
            ("/attachments", "id"),
            ("/private", "id"),
        };

        public SecureFilesMiddleware(RequestDelegate next, IConfiguration config)
        {
            _next = next;
            _config = config;
        }

        public async Task Invoke(HttpContext context)
        {
            var path = context.Request.Path.Value ?? string.Empty;

            // Not a file request (API / SignalR) -> ignore.
            if (path.StartsWith("/api", StringComparison.OrdinalIgnoreCase) ||
                path.StartsWith("/hubs", StringComparison.OrdinalIgnoreCase))
            {
                await _next(context);
                return;
            }

            // Hard-block traversal, null bytes and dotfiles.
            if (path.Contains("..") || path.Contains('\0') ||
                path.Split('/').Any(s => s.Length > 1 && s.StartsWith(".")))
            {
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                return;
            }

            var area = PrivateAreas.FirstOrDefault(p => path.StartsWith(p.Prefix, StringComparison.OrdinalIgnoreCase));
            if (area.Prefix == null)
            {
                await _next(context);   // public asset
                return;
            }

            var principal = ResolvePrincipal(context);
            if (principal == null)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }

            var segments = path.Trim('/').Split('/');
            var ownerSeg = segments.Length > 1 ? Uri.UnescapeDataString(segments[1]) : string.Empty;
            var userId = principal.FindFirst(JwtRegisteredClaimNames.NameId)?.Value
                      ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var email = principal.FindFirst(JwtRegisteredClaimNames.UniqueName)?.Value
                     ?? principal.FindFirst(ClaimTypes.Name)?.Value
                     ?? principal.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;

            var owns = area.OwnerKind == "email"
                ? string.Equals(ownerSeg, email, StringComparison.OrdinalIgnoreCase)
                : string.Equals(ownerSeg, userId, StringComparison.OrdinalIgnoreCase);

            if (!owns && !principal.IsInRole("ADMIN") && !principal.IsInRole("Administrator"))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return;
            }

            await _next(context);   // owner (or admin) verified -> static files serves it
        }

        private ClaimsPrincipal ResolvePrincipal(HttpContext context)
        {
            if (context.User?.Identity?.IsAuthenticated == true) return context.User;

            var token = ExtractToken(context);
            if (string.IsNullOrEmpty(token)) return null;
            try
            {
                var key = _config["Jwt:Key"];
                if (string.IsNullOrEmpty(key)) return null;
                var handler = new JwtSecurityTokenHandler();
                var parms = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = _config["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _config["Jwt:Audience"],
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1),
                };
                return handler.ValidateToken(token, parms, out _);
            }
            catch
            {
                return null;
            }
        }

        private static string ExtractToken(HttpContext context)
        {
            var auth = context.Request.Headers["Authorization"].ToString();
            if (!string.IsNullOrEmpty(auth) && auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                return auth.Substring("Bearer ".Length).Trim();
            var q = context.Request.Query["access_token"].ToString();
            return string.IsNullOrEmpty(q) ? null : q;
        }
    }
}

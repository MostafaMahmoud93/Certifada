using System.Text;

namespace Certifada.API.Extensions;
public static class ConfigureAuthuntication
{
    public static void AddAuthuntication(IServiceCollection services, IConfiguration Configuration)
    {
        var superSecretPassword = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Configuration["Jwt:Key"]!));

        //services.AddScoped<ActionFilter>();
        var chatHubEvents = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];

                // If the request is for our hub...
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chatHub"))
                {
                    // Read the token out of the query string
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            },

            OnAuthenticationFailed = context =>
            {
                if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                {
                    context.Response.Headers["IS-TOKEN-EXPIRED"] = "true";
                }
                return Task.CompletedTask;
            }
        };
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        }).AddJwtBearer("Bearer", options =>
        {
            options.SaveToken = true;
            // Require HTTPS for token/metadata except in the Development environment.
            var aspNetEnv = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            options.RequireHttpsMetadata = !string.Equals(aspNetEnv, "Development", StringComparison.OrdinalIgnoreCase);
            options.TokenValidationParameters = new TokenValidationParameters()
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = Configuration["Jwt:Issuer"]!,
                ValidAudience = Configuration["Jwt:Audience"]!,
                IssuerSigningKey = superSecretPassword,
                ClockSkew = TimeSpan.Zero
            };
            options.Events = chatHubEvents;
        });
    }
}

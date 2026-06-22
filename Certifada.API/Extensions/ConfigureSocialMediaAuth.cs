namespace Certifada.API.Extensions
{
    public static class ConfigureSocialMediaAuth
    {
        public static void AddSocialMediaAuth(this IServiceCollection services, IConfiguration Configuration)
        {
            services.AddAuthentication() // don't set defaults here; keep your JWT defaults from your method
            .AddCookie("External", options =>
            {
                options.LoginPath = "/auth/unauthorized";
                options.Cookie.HttpOnly = true;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                options.Cookie.SameSite = SameSiteMode.Lax; // needed for SPA redirects
                options.SlidingExpiration = true;
                options.ExpireTimeSpan = TimeSpan.FromMinutes(10); // short-lived
            })
            .AddGoogle("Google", options =>
            {
                options.SignInScheme = "External"; // store temp identity here
                options.ClientId = Configuration["Auth:Google:ClientId"]!;
                options.ClientSecret = Configuration["Auth:Google:ClientSecret"]!;
                options.SaveTokens = true;
                options.CallbackPath = "/auth/signin-google"; // add to Google console
                options.Scope.Add("email");
                options.Scope.Add("profile");
            })
            .AddFacebook("Facebook", options =>
            {
                options.SignInScheme = "External";
                options.AppId = Configuration["Auth:Facebook:AppId"]!;
                options.AppSecret = Configuration["Auth:Facebook:AppSecret"]!;
                options.SaveTokens = true;
                options.CallbackPath = "/auth/signin-facebook"; // add to Meta console
                options.Scope.Add("email");
                options.Fields.Add("email");
                options.Fields.Add("name");
                options.Fields.Add("picture");
            })
            .AddOpenIdConnect("Microsoft", options =>
            {
                options.SignInScheme = "External";
                options.Authority = "https://login.microsoftonline.com/common/v2.0"; // work/school + personal
                options.ClientId = Configuration["Auth:Microsoft:ClientId"]!;
                options.ClientSecret = Configuration["Auth:Microsoft:ClientSecret"]!;
                options.CallbackPath = "/auth/signin-microsoft";
                options.ResponseType = "code";
                options.SaveTokens = true;
                options.GetClaimsFromUserInfoEndpoint = true;
                options.Scope.Clear();
                options.Scope.Add("openid");
                options.Scope.Add("profile");
                options.Scope.Add("email");
                options.TokenValidationParameters.ValidateIssuer = false;
            });
        }
    }
}

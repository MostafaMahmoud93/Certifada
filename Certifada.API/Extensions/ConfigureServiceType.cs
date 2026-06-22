namespace Certifada.API.Extensions;
public static class ConfigureServiceType
{
    public static void AddServiceLayer(this IServiceCollection services)
    {
        services.AddScoped(typeof(IRoleActionService), typeof(RoleActionService));
        services.AddScoped(typeof(IUserAccessor), typeof(UserAccessor));
        services.AddScoped(typeof(IUserService), typeof(UserService));
        services.AddScoped(typeof(IRoleService), typeof(RoleService));
        services.AddScoped(typeof(ITemplateService), typeof(TemplateService));
        services.AddScoped(typeof(ICertificateService), typeof(CertificateService));
        services.AddScoped(typeof(IAuthService), typeof(AuthService));
        services.AddScoped(typeof(IBaseService), typeof(ServiceBase));
        services.AddScoped(typeof(IMailService), typeof(MailService));
        services.AddScoped(typeof(IFileManager), typeof(FileManager));

        services.AddHttpContextAccessor();
        //services.AddScoped<HistoryFileFilter>();
        //services.AddScoped<ActionFilter>();
    }
}

namespace Certifada.API.Extensions;
public static class ConfigureDatabase
{
    public static void ConfigureDatabases(IServiceCollection services, IConfiguration Configuration)
    {
        services.AddDbContext<Certifada_DbContext>(options => options.UseSqlServer(Configuration.GetConnectionString("CertifadaConnStr")));
    }
}

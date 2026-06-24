using Microsoft.Extensions.Options;
using Stripe;
using Certifada.API.Options;
using Certifada.API.Services;


var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<StripeOptions>(builder.Configuration.GetSection("Stripe"));
builder.Services.AddSingleton(sp =>
{
    var opts = sp.GetRequiredService<IOptions<StripeOptions>>().Value;
    return new StripeClient(opts.SecretKey);
});

builder.Services.AddScoped<IBillingService, Certifada.API.Services.BillingService>();


MailSettings emailConfig = builder.Configuration.GetSection("MailSettings").Get<MailSettings>();
UploadPath uploadfilesConfig = builder.Configuration.GetSection("UploadPath").Get<UploadPath>();
builder.Services.AddSingleton(emailConfig);
builder.Services.AddSingleton(uploadfilesConfig);

builder.Services.AddMemoryCache();
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Certifada API", Version = "v1" });
    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter JWT with Bearer into field",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {
           {
             new OpenApiSecurityScheme {
               Reference = new OpenApiReference {
                 Type = ReferenceType.SecurityScheme,
                 Id = "Bearer"
               }
              },
              new string[] { }
            }
          });
    // Register the schema filter
    c.SchemaFilter<ExampleSchemaFilter>();
});
builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<MappingProfileBase>();
}, typeof(MappingProfileBase).Assembly);
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = long.MaxValue; // 5 GB
});
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevPolicy", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin))
                    return false;

                var uri = new Uri(origin);

                // Explicitly allow your Angular dev server
                if (origin.Equals("http://192.168.100.192:4200", StringComparison.OrdinalIgnoreCase))
                    return true;

                // Allow localhost and any subdomain of localhost on port 4800
                return uri.Port == 4800 &&
                       (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                        uri.Host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase));
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });

    options.AddPolicy("ProdPolicy", policy =>
    {
        policy.WithOrigins(
            "http://localhost:4200",
            "https://localhost:4200",
            "http://192.168.100.192:4200"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});
builder.Services.AddSignalR();
// Register HttpClient for direct injection
builder.Services.AddHttpClient();
ConfigureSocialMediaAuth.AddSocialMediaAuth(builder.Services, builder.Configuration);
ConfigureAuthuntication.AddAuthuntication(builder.Services, builder.Configuration);
ConfigureDatabase.ConfigureDatabases(builder.Services, builder.Configuration);
ConfigureRepositoriesType.AddRepositoriesLayer(builder.Services);
ConfigureServiceType.AddServiceLayer(builder.Services);
var app = builder.Build();

var supportedCultures = new[]
{
    new CultureInfo("ar-AE") { NumberFormat = new NumberFormatInfo { NegativeSign = "-" }, DateTimeFormat = new CultureInfo("en-US", false).DateTimeFormat },
    new CultureInfo("en-US")
};
app.Use(async (context, next) =>
{
    var headerLang = context.Request.Headers["Accept-Language"].ToString();
    var languages = headerLang.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
    var culture = CultureInfo.CurrentCulture; // Default to current culture

    foreach (var lang in languages)
    {
        try
        {
            // Try to get the culture from the Accept-Language header
            var langCulture = CultureInfo.GetCultureInfo(lang.Trim());
            if (supportedCultures.Any(sc => sc.Name == langCulture.Name)) // Ensure it's supported
            {
                culture = langCulture;
                break; // Use the first valid supported culture
            }
        }
        catch (CultureNotFoundException)
        {
            // Ignore and continue to the next culture in the list
            // Could optionally log the exception here for invalid culture
        }
    }

    // Set the culture for the current request
    CultureInfo.CurrentCulture = culture;
    CultureInfo.CurrentUICulture = culture;

    await next();
});

app.UseRequestLocalization(new RequestLocalizationOptions
{
    DefaultRequestCulture = new RequestCulture("ar-AE"), // Fallback culture
    SupportedCultures = supportedCultures,
    SupportedUICultures = supportedCultures
});
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseCors("DevPolicy");
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
}
else
{
    app.UseCors("ProdPolicy");
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
try
{
    app.UseDefaultFiles(new DefaultFilesOptions
    {
        FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), uploadfilesConfig.LocalPath))
    });

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), uploadfilesConfig.LocalPath))
    });
}
catch (Exception ex)
{
    if (!Directory.Exists(Path.Combine(Directory.GetCurrentDirectory(), DateTime.Now.ToString(@"yyyy\\MM"))))
        Directory.CreateDirectory(Path.Combine(Directory.GetCurrentDirectory(), DateTime.Now.ToString(@"yyyy\\MM")));

    string path = Path.Combine(Directory.GetCurrentDirectory(), DateTime.Now.ToString(@"yyyy\\MM\\dd")) + ".log";
    string contents = $@"==={DateTime.Now.ToString("HH:mm:ss")}=======================================================================================
                            {ex.Message}
                            ----------------------------------------
                            {ex.InnerException?.Message}
                            ----------------------------------------
                            {ex.StackTrace}
                            ----------------------------------------
                            Error Attachment (UseDefaultFiles, UseStaticFiles)
                            ======================================================================================================" + Environment.NewLine;
    await System.IO.File.AppendAllTextAsync(path, contents);
}
app.MapControllers();

app.Run();

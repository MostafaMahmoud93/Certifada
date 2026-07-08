using Certifada.Domain.Entities.Certificate;
using Certifada.Domain.Entities.Payment;
using System.Threading.Tasks;

namespace Certifada.Infrastructure.Repositories;
public class UnitOfWork : IUnitOfWork
{
    private readonly Certifada_DbContext _dbContext;
    public UnitOfWork(Certifada_DbContext dbContext)
    {
        _dbContext = dbContext;
    }
    #region Repositories
    public IBaseRepository<CertificateTemplateVariable, Guid> CertificateTemplateVariableRepository => new BaseRepository<CertificateTemplateVariable, Guid>(_dbContext);
    public IBaseRepository<CertificateVariableValue, Guid> CertificateVariableValueRepository => new BaseRepository<CertificateVariableValue, Guid>(_dbContext);
    public IBaseRepository<TenantFeatureOverride, Guid> TenantFeatureOverrideRepository => new BaseRepository<TenantFeatureOverride, Guid>(_dbContext);
    public IBaseRepository<CertificateAccessLog, Guid> CertificateAccessLogRepository => new BaseRepository<CertificateAccessLog, Guid>(_dbContext);
    public ICustomBaseRepository<SystemRolePermission> SystemRolePermissionRepository => new CustomBaseRepository<SystemRolePermission>(_dbContext);
    public IBaseRepository<CertificateTemplate, Guid> CertificateTemplateRepository => new BaseRepository<CertificateTemplate, Guid>(_dbContext);
    public IBaseRepository<CertificateInstance, Guid> CertificateInstanceRepository => new BaseRepository<CertificateInstance, Guid>(_dbContext);
    public IBaseRepository<GlobalAttachment, Guid> GlobalAttachmentRepository => new BaseRepository<GlobalAttachment, Guid>(_dbContext);
    public IBaseRepository<EmailSendingLog, Guid> EmailSendingLogRepository => new BaseRepository<EmailSendingLog, Guid>(_dbContext);
    public IBaseRepository<TenantBranding, Guid> TenantBrandingRepository => new BaseRepository<TenantBranding, Guid>(_dbContext);
    public ICustomBaseRepository<RolePermission> RolePermissionRepository => new CustomBaseRepository<RolePermission>(_dbContext);
    public ICustomBaseRepository<UserRole> UserRoleRepository => new CustomBaseRepository<UserRole>(_dbContext);
    public IBaseRepository<EmailTemplate, Guid> EmailTemplateRepository => new BaseRepository<EmailTemplate, Guid>(_dbContext);
    public IBaseRepository<UnitBranding, Guid> UnitBrandingRepository => new BaseRepository<UnitBranding, Guid>(_dbContext);
    public IBaseRepository<UserLoginLog, Guid> UserLoginLogRepository => new BaseRepository<UserLoginLog, Guid>(_dbContext);
    public IBaseRepository<PlanFeature, Guid> PlanFeatureRepository => new BaseRepository<PlanFeature, Guid>(_dbContext);
    public ICustomBaseRepository<VW_UserActions> VWUserActions => new CustomBaseRepository<VW_UserActions>(_dbContext);
    public IBaseRepository<Permission, Guid> PermissionRepository => new BaseRepository<Permission, Guid>(_dbContext);
    public IBaseRepository<SystemRole, Guid> SystemRoleRepository => new BaseRepository<SystemRole, Guid>(_dbContext);
    public IBaseRepository<PlanPrice, Guid> PlanPriceRepository => new BaseRepository<PlanPrice, Guid>(_dbContext);
    public IBaseRepository<AccessLog, int> AccessLogRepository => new BaseRepository<AccessLog, int>(_dbContext);
    public IBaseRepository<TenantPlan, Guid> TenantPlanRepository => new BaseRepository<TenantPlan, Guid>(_dbContext);
    public IBaseRepository<Feature, Guid> FeatureRepository => new BaseRepository<Feature, Guid>(_dbContext);
    public IBaseRepository<Tenant, Guid> TenantRepository => new BaseRepository<Tenant, Guid>(_dbContext);
    public IBaseRepository<Region, int> RegionRepository => new BaseRepository<Region, int>(_dbContext);
    public IBaseRepository<Unit, Guid> UnitRepository => new BaseRepository<Unit, Guid>(_dbContext);
    public IBaseRepository<User, Guid> UserRepository => new BaseRepository<User, Guid>(_dbContext);
    public IBaseRepository<Role, Guid> RoleRepository => new BaseRepository<Role, Guid>(_dbContext);
    public IBaseRepository<Plan, Guid> PlanRepository => new BaseRepository<Plan, Guid>(_dbContext);
    #endregion
    public async Task<string> ExecuteSqlQueryAsync(string sqlQuery, params object?[] parameters)
    {
        try
        {
            var results = new List<Dictionary<string, object>>();
            // Create and configure the command
            await using (var command = _dbContext.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = sqlQuery;
                command.CommandType = System.Data.CommandType.Text;
                // Add parameters if any
                for (int i = 0; i < parameters.Length; i++)
                {
                    var parameter = command.CreateParameter();
                    parameter.ParameterName = $"@p{i}";
                    parameter.Value = parameters[i] ?? DBNull.Value;
                    command.Parameters.Add(parameter);
                }
                _dbContext.Database.OpenConnection();
                // Execute the query
                await using (var reader = await command.ExecuteReaderAsync())
                {
                    // Get column names
                    var columnNames = Enumerable.Range(0, reader.FieldCount)
                                                .Select(reader.GetName)
                                                .ToList();
                    // Read each row and create a dictionary for it
                    while (await reader.ReadAsync())
                    {
                        var row = new Dictionary<string, object>();
                        for (int i = 0; i < columnNames.Count; i++)
                        {
                            var value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                            row[columnNames[i]] = value;
                        }
                        results.Add(row);
                    }
                }
            }
            // Serialize results to JSON
            var jsonResult = JsonSerializer.Serialize(results, new JsonSerializerOptions
            {
                WriteIndented = false, // Set to true if you want pretty-printing (indented)
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase, // Optional: use camel case
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping // Allows non-escaped Unicode characters
            });

            return jsonResult;
        }
        catch (Exception ex)
        {
            // Handle exceptions (logging or rethrowing)
            _ = await CustomLogErrorAsync<string>(ex, null, new { sqlQuery, parameters });
            throw new Exception("An error occurred while executing the SQL query.", ex);
        }
    }
    public async Task<int> SaveChangesAsync() => await _dbContext.SaveChangesAsync();
    public void Dispose() => _dbContext.Dispose();
    public void ClearTracker() => _dbContext.ChangeTracker.Clear();
    public async Task<bool> TestDBAsync() => await _dbContext.Database.CanConnectAsync();
    public async Task<Dictionary<string, string>> TestDBTablesAsync()
    {
        var result = new Dictionary<string, string>();

        try
        {
            // Get all DbSet<> properties
            var dbSets = _dbContext.GetType()
                .GetProperties()
                .Where(p => p.PropertyType.IsGenericType &&
                            p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>));

            foreach (var dbSetProp in dbSets)
            {
                var entityType = dbSetProp.PropertyType.GetGenericArguments()[0];
                var dbSet = dbSetProp.GetValue(_dbContext);

                if (dbSet is IQueryable queryable)
                {
                    try
                    {
                        // Materialize one row to catch mapping errors
                        var firstOrDefaultMethod = typeof(EntityFrameworkQueryableExtensions)
                            .GetMethods(BindingFlags.Public | BindingFlags.Static)
                            .First(m => m.Name == nameof(EntityFrameworkQueryableExtensions.FirstOrDefaultAsync) &&
                                        m.GetParameters().Length == 2)
                            .MakeGenericMethod(entityType);

                        dynamic task = firstOrDefaultMethod.Invoke(null, new object[] { queryable, CancellationToken.None });
                        var entity = await task; // will throw if mapping fails

                        // Get count of rows
                        var countMethod = typeof(EntityFrameworkQueryableExtensions)
                            .GetMethods(BindingFlags.Public | BindingFlags.Static)
                            .First(m => m.Name == nameof(EntityFrameworkQueryableExtensions.CountAsync) &&
                                        m.GetParameters().Length == 2)
                            .MakeGenericMethod(entityType);

                        dynamic countTask = countMethod.Invoke(null, new object[] { queryable, CancellationToken.None });
                        int count = await countTask;

                        result[dbSetProp.Name] = count > 0
                            ? $"✅ Has Data ({count} records)"
                            : "⚠️ Empty";
                    }
                    catch (Exception ex)
                    {
                        result[dbSetProp.Name] = $"❌ Failed to query ({ex.Message})";
                    }
                }
                else
                {
                    result[dbSetProp.Name] = "❌ Not a valid DbSet";
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            throw new Exception($"Error testing tables: {ex.Message}", ex);
        }
    }
    public void RejectChanges()
    {
        foreach (var entry in _dbContext.ChangeTracker.Entries()
              .Where(e => e.State != EntityState.Unchanged))
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.State = EntityState.Detached;
                    break;
                case EntityState.Modified:
                case EntityState.Deleted:
                    entry.Reload();
                    break;
            }
        }
    }
    private async Task<T> CustomLogErrorAsync<T>(Exception ex, T data, object inputs)
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
                            {JsonSerializer.Serialize(inputs)}
                            ==================================================================================================" + Environment.NewLine;
        await File.AppendAllTextAsync(path, contents);
        return data;
    }
}

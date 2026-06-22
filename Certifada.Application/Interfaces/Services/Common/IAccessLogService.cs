namespace Certifada.Application.Interfaces.Services.Common;
public interface IAccessLogService
{
    Task<ServiceResponse<bool>> AddHistoryFile(string permission, string? RequestNo, string? notes, string? domain, string? iPAddress);
    Task<ServiceResponse<CollectionResponse<AccessLogModel>>> GetAccessLogs(AccessLogFilterModel filter);
}

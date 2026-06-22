namespace Certifada.API.Controllers.Auth;
public class HistoryReportController : ApiControllersBase
{
    private readonly IAccessLogService _accessLogService;
    public HistoryReportController(IAccessLogService accessLogService)
    {
        _accessLogService = accessLogService;
    }
    [HttpPost]
    [Route(RouteClass.HistoryReport.GetHistoryReport)]
    public async Task<IActionResult> GetHistoryReport(AccessLogFilterModel filter) => Ok(await _accessLogService.GetAccessLogs(filter));
    //[HttpGet]
    //[Route(RouteClass.HistoryReport.GetUsersDDL)]
    //public async Task<IActionResult> GetUsersDDL(string? userType) => Ok(await _accessLogService.GetUsersDDL(userType));
}

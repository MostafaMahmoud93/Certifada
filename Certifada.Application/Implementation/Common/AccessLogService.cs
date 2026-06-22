namespace Certifada.Application.Implementation.Common;
public class AccessLogService : ServiceBase, IAccessLogService
{
    private readonly IConfiguration _configuration;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    public AccessLogService(IUnitOfWork unitOfWork, IMapper mapper, IConfiguration configuration, IUserAccessor userAccessor) : base(configuration, userAccessor)
    {
        _configuration = configuration;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }
    public async Task<ServiceResponse<bool>> AddHistoryFile(string rout, string? RequestNo, string? notes, string? domain, string? iPAddress)
    {
        try
        {
            Guid? userId = GetUserId();
            if (userId == null)
                return new ServiceResponse<bool>() { Success = true, Data = false, Message = ClutureResource.FailedRetrieveData };

            string Action_Code = null;
            //Action_Code = (await _unitOfWork.LinkScreenActionRepository.FirstOrDefaultAsync(a => rout.Contains(a.Base_Route)))?.Action_Code;
            AccessLog accessLog = new AccessLog
            {
                Action_Code = Action_Code,
                User_Id = userId,
                RecordNo = RequestNo,
                Access_Date = DateTime.Now,
                Notes = notes
            };

            await _unitOfWork.AccessLogRepository.AddAsync(accessLog);
            var res = await _unitOfWork.SaveChangesAsync() >= 1;
            return new ServiceResponse<bool>() { Success = true, Data = res, Message = ClutureResource.RetrieveData };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<bool>(ex, true, new { rout, RequestNo });
        }
    }
    public async Task<ServiceResponse<CollectionResponse<AccessLogModel>>> GetAccessLogs(AccessLogFilterModel filter)
    {
        try
        {
            (List<AccessLog> collection, int length) accessLogs = await _unitOfWork.AccessLogRepository.GetPagedAndSortedWithFilterAsync(filter.Page, filter.PageSize,
                a => (filter.AccessDateTo == null || a.Access_Date.Date <= filter.AccessDateTo)
                && (filter.AccessDateFrom == null || a.Access_Date.Date >= filter.AccessDateFrom)
                && (filter.UserId == null || a.User_Id == filter.UserId)
                && (filter.RequestNo == null || a.RecordNo == filter.RequestNo)
                , filter.SortBy, filter.IsSortAsc);

            if (accessLogs.collection == null) return new ServiceResponse<CollectionResponse<AccessLogModel>> { Success = false, Data = null, Message = ClutureResource.FailedRetrieveData };

            List<AccessLogModel> accessLogsModel = _mapper.Map<List<AccessLogModel>>(accessLogs.collection);

            return new ServiceResponse<CollectionResponse<AccessLogModel>> { Success = true, Data = new CollectionResponse<AccessLogModel>(accessLogs.length, accessLogsModel), Message = ClutureResource.RetrieveData };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<CollectionResponse<AccessLogModel>>(ex, null, null);
        }
    }
}

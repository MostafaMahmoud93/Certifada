using Certifada.Domain.Entities.Certificate;
namespace Certifada.Application.Implementation.Common;
public class CertificateService : ServiceBase, ICertificateService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    public CertificateService(IUnitOfWork unitOfWork, IMapper mapper, IConfiguration configuration, IUserAccessor userAccessor) : base(configuration, userAccessor)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ServiceResponse<List<GeneratedCertificateModel>>> GetCertificates(Guid? templateId)
    {
        try
        {
            Guid tenantId = await GetTenantId();
            List<CertificateInstance> list = await _unitOfWork.CertificateInstanceRepository.GetAllAsync(a => !a.Is_Deleted && a.Tenant_Id == tenantId && (templateId == null || a.Template_Id == templateId));
            List<GeneratedCertificateModel> models = _mapper.Map<List<GeneratedCertificateModel>>(list);
            return new ServiceResponse<List<GeneratedCertificateModel>> { Success = true, Data = models, Message = ClutureResource.RetrieveData };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<List<GeneratedCertificateModel>>(ex, null, templateId);
        }
    }

    public async Task<ServiceResponse<GeneratedCertificateModel>> SaveCertificate(SaveCertificateModel model)
    {
        try
        {
            (Guid tenantId, Guid unitId) = await GetScope();
            CertificateInstance instance = NewInstance(model.TemplateId, model.RecipientName, model.DataJson, model.Format, model.FileDataUrl, null, tenantId, unitId);
            await _unitOfWork.CertificateInstanceRepository.AddAsync(instance);
            await _unitOfWork.SaveChangesAsync();
            return new ServiceResponse<GeneratedCertificateModel> { Success = true, Data = _mapper.Map<GeneratedCertificateModel>(instance), Message = ClutureResource.SavedSuccessfully };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<GeneratedCertificateModel>(ex, null, model);
        }
    }

    public async Task<ServiceResponse<BatchResultModel>> SaveBatch(SaveBatchModel model)
    {
        try
        {
            (Guid tenantId, Guid unitId) = await GetScope();
            string batchId = Guid.NewGuid().ToString("N");
            List<CertificateInstance> items = (model.Items ?? new List<BatchItemModel>())
                .Select(i => NewInstance(model.TemplateId, i.RecipientName, i.DataJson, model.Format, i.FileDataUrl, batchId, tenantId, unitId))
                .ToList();
            await _unitOfWork.CertificateInstanceRepository.AddRangeAsync(items);
            await _unitOfWork.SaveChangesAsync();
            return new ServiceResponse<BatchResultModel> { Success = true, Data = new BatchResultModel { BatchId = batchId, Count = items.Count }, Message = ClutureResource.SavedSuccessfully };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<BatchResultModel>(ex, null, model);
        }
    }

    public async Task<ServiceResponse<bool>> DeleteCertificate(Guid id)
    {
        try
        {
            _unitOfWork.CertificateInstanceRepository.SoftDeleteById(id);
            await _unitOfWork.SaveChangesAsync();
            return new ServiceResponse<bool> { Success = true, Data = true, Message = ClutureResource.SavedSuccessfully };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, id);
        }
    }

    private CertificateInstance NewInstance(Guid templateId, string recipient, string? dataJson, string? format, string? fileUrl, string? batchId, Guid tenantId, Guid unitId) =>
        new CertificateInstance
        {
            Template_Id = templateId,
            Tenant_Id = tenantId,
            Unit_Id = unitId,
            IssuedTo = recipient,
            IssuedAt = DateTime.Now,
            Created_By = UserId ?? Guid.Empty,
            Created_Date = DateTime.Now,
            Status = "Issued",
            Data_Json = dataJson,
            // The recipient email arrives embedded in the merge data as _email; lift it into the
            // Email column so it's queryable (the recipient wallet, delivery and resend key off it).
            Email = ExtractEmail(dataJson),
            Format = format,
            Download_Url = fileUrl,
            Batch_Id = batchId
        };

    /// <summary>Pull the recipient email out of the merge-data JSON (_email / email keys).</summary>
    private static string? ExtractEmail(string? dataJson)
    {
        if (string.IsNullOrWhiteSpace(dataJson)) return null;
        try
        {
            var d = Newtonsoft.Json.Linq.JObject.Parse(dataJson);
            var email = (d["_email"] ?? d["email"])?.ToString();
            return string.IsNullOrWhiteSpace(email) ? null : email.Trim();
        }
        catch { return null; }
    }

    private async Task<Guid> GetTenantId()
    {
        (Guid tenantId, Guid _) = await GetScope();
        return tenantId;
    }

    private async Task<(Guid tenantId, Guid unitId)> GetScope()
    {
        if (UserId == null) return (Guid.Empty, Guid.Empty);
        User user = await _unitOfWork.UserRepository.FindByIDAsync(UserId.Value);
        return (user?.Tenant_Id ?? Guid.Empty, user?.Unit_Id ?? Guid.Empty);
    }
}

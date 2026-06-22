using Certifada.Domain.Entities.Certificate;
namespace Certifada.Application.Implementation.Common;
public class TemplateService : ServiceBase, ITemplateService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    public TemplateService(IUnitOfWork unitOfWork, IMapper mapper, IConfiguration configuration, IUserAccessor userAccessor) : base(configuration, userAccessor)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ServiceResponse<List<TemplateListModel>>> GetTemplates()
    {
        try
        {
            Guid tenantId = await GetTenantId();
            List<CertificateTemplate> list = await _unitOfWork.CertificateTemplateRepository.GetAllAsync(a => !a.Is_Deleted && a.Tenant_Id == tenantId);
            List<TemplateListModel> models = _mapper.Map<List<TemplateListModel>>(list);
            return new ServiceResponse<List<TemplateListModel>> { Success = true, Data = models, Message = ClutureResource.RetrieveData };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<List<TemplateListModel>>(ex, null, null);
        }
    }

    public async Task<ServiceResponse<TemplateDetailModel>> GetTemplate(Guid id)
    {
        try
        {
            CertificateTemplate template = await _unitOfWork.CertificateTemplateRepository.FindByIDAsync(id);
            if (template == null || template.Is_Deleted)
                return new ServiceResponse<TemplateDetailModel> { Success = false, Data = null, Message = ClutureResource.FailedRetrieveData };
            return new ServiceResponse<TemplateDetailModel> { Success = true, Data = _mapper.Map<TemplateDetailModel>(template), Message = ClutureResource.RetrieveData };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<TemplateDetailModel>(ex, null, id);
        }
    }

    public async Task<ServiceResponse<TemplateDetailModel>> CreateTemplate(SaveTemplateModel model)
    {
        try
        {
            (Guid tenantId, Guid unitId) = await GetScope();
            CertificateTemplate template = new CertificateTemplate
            {
                Name = model.Name,
                Description = model.Description,
                Design = model.CanvasJson,
                Preview_Image_Url = model.ThumbnailDataUrl,
                Width = model.Width,
                Height = model.Height,
                Placeholders_Json = model.PlaceholdersJson,
                Status = "Draft",
                Tenant_Id = tenantId
            };
            await _unitOfWork.CertificateTemplateRepository.AddAsync(template);
            await _unitOfWork.SaveChangesAsync();
            return new ServiceResponse<TemplateDetailModel> { Success = true, Data = _mapper.Map<TemplateDetailModel>(template), Message = ClutureResource.SavedSuccessfully };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<TemplateDetailModel>(ex, null, model);
        }
    }

    public async Task<ServiceResponse<TemplateDetailModel>> EditTemplate(Guid id, SaveTemplateModel model)
    {
        try
        {
            CertificateTemplate template = await _unitOfWork.CertificateTemplateRepository.FindByIDAsync(id);
            if (template == null)
                return new ServiceResponse<TemplateDetailModel> { Success = false, Data = null, Message = ClutureResource.FailedRetrieveData };
            template.Name = model.Name;
            template.Description = model.Description;
            template.Design = model.CanvasJson;
            template.Preview_Image_Url = model.ThumbnailDataUrl;
            template.Width = model.Width;
            template.Height = model.Height;
            template.Placeholders_Json = model.PlaceholdersJson;
            _unitOfWork.CertificateTemplateRepository.Edit(template);
            await _unitOfWork.SaveChangesAsync();
            return new ServiceResponse<TemplateDetailModel> { Success = true, Data = _mapper.Map<TemplateDetailModel>(template), Message = ClutureResource.SavedSuccessfully };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync<TemplateDetailModel>(ex, null, model);
        }
    }

    public async Task<ServiceResponse<bool>> DeleteTemplate(Guid id)
    {
        try
        {
            _unitOfWork.CertificateTemplateRepository.SoftDeleteById(id);
            await _unitOfWork.SaveChangesAsync();
            return new ServiceResponse<bool> { Success = true, Data = true, Message = ClutureResource.SavedSuccessfully };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, id);
        }
    }

    public async Task<ServiceResponse<bool>> ArchiveTemplate(Guid id)
    {
        try
        {
            CertificateTemplate template = await _unitOfWork.CertificateTemplateRepository.FindByIDAsync(id);
            if (template == null)
                return new ServiceResponse<bool> { Success = false, Data = false, Message = ClutureResource.FailedRetrieveData };
            template.Status = "Archived";
            _unitOfWork.CertificateTemplateRepository.Edit(template);
            await _unitOfWork.SaveChangesAsync();
            return new ServiceResponse<bool> { Success = true, Data = true, Message = ClutureResource.SavedSuccessfully };
        }
        catch (Exception ex)
        {
            return await LogErrorAsync(ex, false, id);
        }
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

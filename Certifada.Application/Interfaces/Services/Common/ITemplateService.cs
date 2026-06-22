namespace Certifada.Application.Interfaces.Services.Common;
public interface ITemplateService : IBaseService
{
    Task<ServiceResponse<List<TemplateListModel>>> GetTemplates();
    Task<ServiceResponse<TemplateDetailModel>> GetTemplate(Guid id);
    Task<ServiceResponse<TemplateDetailModel>> CreateTemplate(SaveTemplateModel model);
    Task<ServiceResponse<TemplateDetailModel>> EditTemplate(Guid id, SaveTemplateModel model);
    Task<ServiceResponse<bool>> DeleteTemplate(Guid id);
    Task<ServiceResponse<bool>> ArchiveTemplate(Guid id);
}

namespace Certifada.Application.Interfaces.Services.Common;
public interface ICertificateService : IBaseService
{
    Task<ServiceResponse<List<GeneratedCertificateModel>>> GetCertificates(Guid? templateId);
    Task<ServiceResponse<GeneratedCertificateModel>> SaveCertificate(SaveCertificateModel model);
    Task<ServiceResponse<BatchResultModel>> SaveBatch(SaveBatchModel model);
    Task<ServiceResponse<bool>> DeleteCertificate(Guid id);
}

namespace Certifada.API.Controllers.Certificate;
public class CertificateController : ApiControllersBase
{
    private readonly ICertificateService _CertificateService;
    public CertificateController(ICertificateService CertificateService)
    {
        _CertificateService = CertificateService;
    }

    [HttpGet]
    [Route(RouteClass.Certificate.GetCertificates)]
    public async Task<IActionResult> GetCertificates([FromQuery] Guid? templateId) =>
        Ok(await _CertificateService.GetCertificates(templateId));

    [HttpPost]
    [Route(RouteClass.Certificate.SaveCertificate)]
    public async Task<IActionResult> SaveCertificate(SaveCertificateModel model) =>
        Ok(await _CertificateService.SaveCertificate(model));

    [HttpPost]
    [Route(RouteClass.Certificate.SaveBatch)]
    public async Task<IActionResult> SaveBatch(SaveBatchModel model) =>
        Ok(await _CertificateService.SaveBatch(model));

    [HttpDelete]
    [Route(RouteClass.Certificate.DeleteCertificate)]
    public async Task<IActionResult> DeleteCertificate(Guid id) =>
        Ok(await _CertificateService.DeleteCertificate(id));
}

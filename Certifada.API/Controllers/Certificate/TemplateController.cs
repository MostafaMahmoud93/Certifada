namespace Certifada.API.Controllers.Certificate;
public class TemplateController : ApiControllersBase
{
    private readonly ITemplateService _TemplateService;
    public TemplateController(ITemplateService TemplateService)
    {
        _TemplateService = TemplateService;
    }

    [HttpGet]
    [Route(RouteClass.Template.GetTemplates)]
    public async Task<IActionResult> GetTemplates() =>
        Ok(await _TemplateService.GetTemplates());

    [HttpGet]
    [Route(RouteClass.Template.GetTemplate)]
    public async Task<IActionResult> GetTemplate(Guid id) =>
        Ok(await _TemplateService.GetTemplate(id));

    [HttpPost]
    [Route(RouteClass.Template.CreateTemplate)]
    public async Task<IActionResult> CreateTemplate(SaveTemplateModel model) =>
        Ok(await _TemplateService.CreateTemplate(model));

    [HttpPut]
    [Route(RouteClass.Template.EditTemplate)]
    public async Task<IActionResult> EditTemplate(Guid id, SaveTemplateModel model) =>
        Ok(await _TemplateService.EditTemplate(id, model));

    [HttpDelete]
    [Route(RouteClass.Template.DeleteTemplate)]
    public async Task<IActionResult> DeleteTemplate(Guid id) =>
        Ok(await _TemplateService.DeleteTemplate(id));

    [HttpPost]
    [Route(RouteClass.Template.ArchiveTemplate)]
    public async Task<IActionResult> ArchiveTemplate(Guid id) =>
        Ok(await _TemplateService.ArchiveTemplate(id));
}

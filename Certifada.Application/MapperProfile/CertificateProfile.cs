using Certifada.Domain.Entities.Certificate;
namespace Certifada.Application.MapperProfile;
public class CertificateProfile : MappingProfileBase
{
    public CertificateProfile()
    {
        CreateMap<CertificateTemplate, TemplateListModel>()
            .ForMember(d => d.PlaceholdersJson, o => o.MapFrom(s => s.Placeholders_Json))
            .ForMember(d => d.ThumbnailDataUrl, o => o.MapFrom(s => s.Preview_Image_Url))
            .ForMember(d => d.CreatedAt, o => o.MapFrom(s => s.Create_Date))
            .ForMember(d => d.UpdatedAt, o => o.MapFrom(s => s.Last_Modify_Date ?? s.Create_Date));

        CreateMap<CertificateTemplate, TemplateDetailModel>()
            .ForMember(d => d.CanvasJson, o => o.MapFrom(s => s.Design))
            .ForMember(d => d.PlaceholdersJson, o => o.MapFrom(s => s.Placeholders_Json))
            .ForMember(d => d.ThumbnailDataUrl, o => o.MapFrom(s => s.Preview_Image_Url))
            .ForMember(d => d.CreatedAt, o => o.MapFrom(s => s.Create_Date))
            .ForMember(d => d.UpdatedAt, o => o.MapFrom(s => s.Last_Modify_Date ?? s.Create_Date));

        CreateMap<CertificateInstance, GeneratedCertificateModel>()
            .ForMember(d => d.TemplateId, o => o.MapFrom(s => s.Template_Id))
            .ForMember(d => d.RecipientName, o => o.MapFrom(s => s.IssuedTo))
            .ForMember(d => d.DataJson, o => o.MapFrom(s => s.Data_Json))
            .ForMember(d => d.FileDataUrl, o => o.MapFrom(s => s.Download_Url))
            .ForMember(d => d.BatchId, o => o.MapFrom(s => s.Batch_Id))
            .ForMember(d => d.CreatedAt, o => o.MapFrom(s => s.Created_Date));
    }
}

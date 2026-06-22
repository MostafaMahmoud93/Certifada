namespace Certifada.Application.MapperProfile
{
    public class AccessLogProfile : MappingProfileBase
    {
        public AccessLogProfile()
        {
            CreateMap<AccessLog, AccessLogModel>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.Full_Name))
                .ReverseMap();
        }
    }
}
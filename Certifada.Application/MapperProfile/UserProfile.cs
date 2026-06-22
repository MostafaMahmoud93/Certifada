namespace Certifada.Application.MapperProfile
{
    public class UserProfile : MappingProfileBase
    {
        public UserProfile()
        {
            CreateMap<User, UserModel>();

            CreateMap<User, DetailUserModel>()
                .ForMember(dest => dest.UserRole, opt => opt.MapFrom(src => src.Role.Name));

            CreateMap<User, AddUserModel>().ReverseMap();
            CreateMap<User, EditUserModel>().ReverseMap();
        }
    }
}

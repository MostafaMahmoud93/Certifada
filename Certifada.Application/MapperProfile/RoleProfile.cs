namespace Certifada.Application.MapperProfile;
public class RoleProfile : MappingProfileBase
{
    public RoleProfile()
    {
        CreateMap<Role, RoleModel>();
        CreateMap<Role, AddRoleModel>().ReverseMap();
        CreateMap<Role, EditRoleModel>().ReverseMap();
    }
}

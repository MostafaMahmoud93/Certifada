namespace Certifada.API.Extensions;
public static class AllowFiltered
{
    public static List<string> Controllers { get; set; } = new List<string> {
       "Screen"
    };
    public static List<string> Actions { get; set; } = new List<string> {
       "EditUserProfilePicture",
       "GetScreenActionsDDL",
       "GetMainModulesDDL",
       "GetCurrentUser",
       "GetScreensDDL",
       "GetRolesDDL",
       "GetUsersDDL",
       "SearchUser"
    };
}
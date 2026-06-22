namespace Certifada.Application.Bases;
public static class RouteClass
{
    /// <summary>
    /// Ex. api[key word]/Auth[Controller Name]/Login[Action Name]
    /// </summary>
    public static class Auth
    {
        public const string ExternalCallback = "api/Auth/ExternalCallback";
        public const string MicrosoftUrl = "api/Auth/MicrosoftUrl";
        public const string TestDBTables = "api/Auth/TestDBTables";
        public const string FacebookUrl = "api/Auth/FacebookUrl";
        public const string GoogleUrl = "api/Auth/GoogleUrl";
        public const string TestDB = "api/Auth/TestDB";
        public const string Login = "api/Auth/Login";
        public const string Test = "api/Auth/Test";
    }
    public static class User
    {
        public const string EditUserProfilePicture = "api/User/EditUserProfilePicture";
        public const string UpdateImgeProfileUser = "api/User/UpdateImgeProfileUser";
        public const string GetCurrentUser = "api/User/GetCurrentUser";
        public const string DeleteUser = "api/User/DeleteUser";
        public const string CreateUser = "api/User/CreateUser";
        public const string SearchUser = "api/User/SearchUser";
        public const string EditUser = "api/User/EditUser";
        public const string GetUsers = "api/User/GetUsers";
        public const string GetUser = "api/User/GetUser";
    }
    public static class Role
    {
        public const string GetRolesDDL = "api/Role/GetRolesDDL";
        public const string DeleteRole = "api/Role/DeleteRole";
        public const string CreateRole = "api/Role/CreateRole";
        public const string EditRole = "api/Role/EditRole";
        public const string GetRoles = "api/Role/GetRoles";
    }
    public static class EmailSMSTemplates
    {
        public const string GetDefultEmailSMSTemplateById = "api/EmailSMSTemplates/GetDefultEmailSMSTemplateById";
        public const string GetEmailSMSTemplateById = "api/EmailSMSTemplates/GetEmailSMSTemplateById";
        public const string GetEmailSMSTemplates = "api/EmailSMSTemplates/GetEmailSMSTemplates";
        public const string EditEmailSMSTemplate = "api/EmailSMSTemplates/EditEmailSMSTemplate";
    }
    public static class MasterData
    {
        public const string GetMasterDataByCode = "api/MasterData/GetMasterDataByCode";
    }
    public static class RoleAction
    {
        public const string GetRoleActions = "api/RoleAction/GetRoleActions/{RoleId}";
        public const string GetUserActions = "api/RoleAction/GetUserActions/{userId}";
        public const string AddEditRoleAction = "api/RoleAction/AddEditRoleAction";
        public const string AddEditUserAction = "api/RoleAction/AddEditUserAction";
    }
    public static class HistoryReport
    {
        public const string GetScreenActionsDDL = "api/HistoryReport/GetScreenActionsDDL";
        public const string GetMainModulesDDL = "api/HistoryReport/GetMainModulesDDL";
        public const string GetHistoryReport = "api/HistoryReport/GetHistoryReport";
        public const string GetScreensDDL = "api/HistoryReport/GetScreensDDL";
        public const string GetUsersDDL = "api/HistoryReport/GetUsersDDL";
    }
    public static class Template
    {
        public const string GetTemplates = "api/Template/GetTemplates";
        public const string GetTemplate = "api/Template/GetTemplate/{id}";
        public const string CreateTemplate = "api/Template/CreateTemplate";
        public const string EditTemplate = "api/Template/EditTemplate/{id}";
        public const string DeleteTemplate = "api/Template/DeleteTemplate/{id}";
        public const string ArchiveTemplate = "api/Template/ArchiveTemplate/{id}";
    }
    public static class Certificate
    {
        public const string GetCertificates = "api/Certificate/GetCertificates";
        public const string SaveCertificate = "api/Certificate/SaveCertificate";
        public const string SaveBatch = "api/Certificate/SaveBatch";
        public const string DeleteCertificate = "api/Certificate/DeleteCertificate/{id}";
    }
}
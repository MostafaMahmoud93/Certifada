namespace Certifada.Domain.Entities.Identity;
public class UserLoginLog : BaseCommonEntity<Guid>
{
    public Guid User_Id { get; set; }
    public DateTime Login_Time { get; set; } = DateTime.Now;
    public string IP_Address { get; set; }
    public bool Is_Successful { get; set; }
    public virtual User? User { get; set; }
}

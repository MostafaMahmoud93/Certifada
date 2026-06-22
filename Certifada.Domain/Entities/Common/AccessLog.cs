namespace Certifada.Domain.Entities.Common;
public class AccessLog : BaseCommonEntity<int>
{
    public string? Action_Code { get; set; }
    public Guid? User_Id { get; set; }
    public DateTime Access_Date { get; set; }
    public string? RecordNo { get; set; }
    public string? Notes { get; set; }
    public virtual User? User { get; set; }
}

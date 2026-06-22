namespace Certifada.Domain.Entities.Common
{
    public class GlobalAttachment : BaseCommonEntity<Guid>
    {
        public int Document_Id { get; set; }
        public DateTime Created_Date { get; set; }
        public Guid Created_By { get; set; }
        public string File_Extension { get; set; }
        public string File_MIME { get; set; }
        public string File_Name { get; set; }
        public string File_Path { get; set; }
        public long File_Size { get; set; }
        public virtual User User { get; set; }
    }
}

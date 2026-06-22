namespace Certifada.Domain.Models;

// ---- Templates (designer / templates list) ----
public class TemplateListModel
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string? Description { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public string? PlaceholdersJson { get; set; }
    public string? ThumbnailDataUrl { get; set; }
    public string? Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class TemplateDetailModel : TemplateListModel
{
    public string? CanvasJson { get; set; }
}

public class SaveTemplateModel
{
    public string Name { get; set; }
    public string? Description { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public string? CanvasJson { get; set; }
    public string? PlaceholdersJson { get; set; }
    public string? ThumbnailDataUrl { get; set; }
}

// ---- Certificates (issued credentials) ----
public class GeneratedCertificateModel
{
    public Guid Id { get; set; }
    public Guid TemplateId { get; set; }
    public string RecipientName { get; set; }
    public string? DataJson { get; set; }
    public string? Format { get; set; }
    public string? FileDataUrl { get; set; }
    public string? BatchId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SaveCertificateModel
{
    public Guid TemplateId { get; set; }
    public string RecipientName { get; set; }
    public string? DataJson { get; set; }
    public string? Format { get; set; }
    public string? FileDataUrl { get; set; }
}

public class BatchItemModel
{
    public string RecipientName { get; set; }
    public string? DataJson { get; set; }
    public string? FileDataUrl { get; set; }
}

public class SaveBatchModel
{
    public Guid TemplateId { get; set; }
    public string? Format { get; set; }
    public List<BatchItemModel> Items { get; set; } = new();
}

public class BatchResultModel
{
    public string BatchId { get; set; }
    public int Count { get; set; }
}

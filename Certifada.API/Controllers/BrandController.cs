using AngleSharp;
using AngleSharp.Dom;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;

[ApiController]
[Route("api/brand")]
public class BrandController : ControllerBase
{
    private readonly HttpClient _http;
    public BrandController(IHttpClientFactory factory) => _http = factory.CreateClient();

    public class ExtractRequest { public string? Url { get; set; } }
    public class BrandKit {
        public string? Name { get; set; }
        public List<string> Colors { get; set; } = new();
        public List<string> Fonts { get; set; } = new();
        public List<string> Logos { get; set; } = new();
    }

    [HttpPost("extract")]
    public async Task<IActionResult> Extract([FromBody] ExtractRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Url)) return BadRequest("Missing url");
        var url = NormalizeUrl(req.Url);

        // 1) Fetch HTML
        string html;
        try {
            html = await _http.GetStringAsync(url);
        } catch {
            return BadRequest("Unable to fetch the website.");
        }

        // 2) Parse DOM
        var context = BrowsingContext.New(Configuration.Default);
        var doc = await context.OpenAsync(req => req.Content(html).Address(url));

        var kit = new BrandKit();
        kit.Name = doc.QuerySelector("meta[property='og:site_name']")?.GetAttribute("content")
                    ?? doc.Title?.Trim();

        // 3) Logos: og:image, icons, apple-touch, favicon
        var logos = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        void AddAbs(string? u) { if (!string.IsNullOrWhiteSpace(u)) logos.Add(ToAbsolute(url, u)); }

        AddAbs(doc.QuerySelector("meta[property='og:image']")?.GetAttribute("content"));
        foreach (var l in doc.QuerySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon'], link[rel='mask-icon']"))
            AddAbs(l.GetAttribute("href"));

        // Try manifest icons
        var manifestHref = doc.QuerySelector("link[rel='manifest']")?.GetAttribute("href");
        if (!string.IsNullOrWhiteSpace(manifestHref))
        {
            try {
                var manifestJson = await _http.GetStringAsync(ToAbsolute(url, manifestHref));
                using var jdoc = JsonDocument.Parse(manifestJson);
                if (jdoc.RootElement.TryGetProperty("icons", out var icons) && icons.ValueKind == JsonValueKind.Array)
                {
                    foreach (var icon in icons.EnumerateArray())
                    {
                        if (icon.TryGetProperty("src", out var src))
                            AddAbs(src.GetString());
                    }
                }
            } catch { /* ignore */ }
        }

        kit.Logos = logos.ToList();

        // 4) CSS links
        var cssHrefs = doc.QuerySelectorAll("link[rel='stylesheet']")
                          .Select(l => l.GetAttribute("href"))
                          .Where(h => !string.IsNullOrWhiteSpace(h))
                          .Select(h => ToAbsolute(url, h!))
                          .Distinct()
                          .Take(8) // limit
                          .ToList();

        var cssText = new List<string>();
        foreach (var href in cssHrefs)
        {
            try { cssText.Add(await _http.GetStringAsync(href)); } catch { /* ignore */ }
        }

        // 5) Extract colors + fonts with quick heuristics
        var hexColor = new Regex(@"#[0-9a-fA-F]{3,8}\b");
        var rgbColor = new Regex(@"\brgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0?\.\d+|1|0))?\s*\)");
        var fontFamily = new Regex(@"font-family\s*:\s*([^;]+);", RegexOptions.IgnoreCase);

        var colors = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var fonts = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var css in cssText)
        {
            foreach (Match m in hexColor.Matches(css)) colors.Add(NormalizeColor(m.Value));
            foreach (Match m in rgbColor.Matches(css)) colors.Add(m.Value.Trim());

            foreach (Match m in fontFamily.Matches(css))
            {
                var raw = m.Groups[1].Value;
                // take first family in stack
                var first = raw.Split(',').FirstOrDefault()?.Trim().Trim('\'','"');
                if (!string.IsNullOrWhiteSpace(first))
                    fonts.Add(first);
            }
        }

        kit.Colors = colors.Take(12).ToList();
        kit.Fonts = fonts.Take(8).ToList();

        return Ok(kit);
    }

    private static string NormalizeUrl(string input)
        => input.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? input : $"https://{input}";

    private static string ToAbsolute(string baseUrl, string maybeRelative)
    {
        if (Uri.TryCreate(maybeRelative, UriKind.Absolute, out var abs)) return abs.ToString();
        var b = new Uri(baseUrl, UriKind.Absolute);
        return new Uri(b, maybeRelative).ToString();
    }

    private static string NormalizeColor(string c)
        => c.Length is 4 or 5   // #abc or #abca
           ? $"#{string.Concat(c.Skip(1).Select(ch => $"{ch}{ch}"))}"
           : c.ToLowerInvariant();
}

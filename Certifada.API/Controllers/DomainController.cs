
[ApiController]
[Route("api/domain")]
public class DomainController : ControllerBase
{
    // Replace with your real check in DB
    [HttpGet("check/{subdomain}")]
    public IActionResult Check(string subdomain)
    {
        // Hard fail some reserved words:
        var reserved = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "www", "admin", "api" };
        if (reserved.Contains(subdomain)) return Ok(new { available = false, reason = "reserved" });

        // Example: pretend "demo" and "test" are taken
        if (string.Equals(subdomain, "demo", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(subdomain, "test", StringComparison.OrdinalIgnoreCase))
        {
            return Ok(new { available = false, reason = "taken" });
        }

        return Ok(new { available = true });
    }
}

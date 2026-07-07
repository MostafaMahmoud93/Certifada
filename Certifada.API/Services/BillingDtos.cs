namespace Certifada.API.Services;

/// <summary>Start a checkout for a plan by its code (e.g. "Professional") + interval ("monthly"|"yearly").</summary>
public record CheckoutRequest(string PlanCode, string Interval);
public record CheckoutResponse(string Url, string SessionId);

/// <summary>Upgrade / downgrade an existing subscription.</summary>
public record ChangePlanRequest(string PlanCode, string Interval);
public record ChangePlanResponse(bool Success, bool CheckoutRequired, string? CheckoutUrl, string Message);

public record SubscriptionView(
    string PlanCode, string PlanName, string Interval, string Status,
    decimal Amount, string Currency,
    DateTimeOffset? CurrentPeriodEnd, DateTimeOffset? CancelAt,
    string? PendingPlanCode = null, DateTimeOffset? ScheduledChangeOn = null);

/// <summary>Result of confirming a Checkout session server-side (the no-webhook path).</summary>
public record ConfirmCheckoutResponse(bool Success, string PlanCode, string Message);

public record BillingHistoryView(
    Guid Id, string PlanCode, string Status, decimal Amount, string Currency,
    string? Interval, string? Description, DateTime CreatedOn);

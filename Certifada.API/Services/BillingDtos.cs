namespace Certifada.API.Services;

public record CreateCheckoutRequest(
    string priceId,
    string? planId,
    string? interval,
    string? region
);

public record CheckoutSessionView(
    string Id,
    string? Status,
    string? PaymentStatus,
    string? CustomerEmail,
    string? CustomerId,
    string? SubscriptionId,
    long? AmountTotal,
    string? Currency,
    List<string> PriceIds
);

public record CreateCheckoutResponse(string sessionId);

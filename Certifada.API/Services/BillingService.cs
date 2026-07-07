using Certifada.API.Services.Stripe;
using Certifada.Domain.Entities.Payment;
using Stripe;
using Stripe.Checkout;
// The Stripe SDK ships "Plan" and "Subscription" types too — disambiguate.
using Plan = Certifada.Domain.Entities.Payment.Plan;
using SubscriptionEntity = Certifada.Domain.Entities.Payment.Subscription;
using StripeSubscription = Stripe.Subscription;

namespace Certifada.API.Services;

/// <summary>
/// Billing orchestration + database logic. All outbound Stripe calls go through
/// <see cref="IStripeGateway"/> — this class never touches the Stripe SDK
/// directly (webhook handling only READS the already-parsed event payload).
///  - Checkout sessions are built from PlanPrice rows (real Stripe products/
///    prices are provisioned on first use and their ids saved back).
///  - Webhooks upsert TenantPlans (the subscription) and append BillingHistories.
///  - ChangePlan upgrades/downgrades with proration; "Free" cancels at period end.
/// </summary>
public class BillingService : IBillingService
{
    private readonly IStripeGateway _stripe;
    private readonly Certifada_DbContext _db;
    private readonly IConfiguration _config;

    public BillingService(IStripeGateway stripe, Certifada_DbContext db, IConfiguration config)
    {
        _stripe = stripe;
        _db = db;
        _config = config;
    }

    private string FrontendUrl => (_config["Frontend:Url"] ?? "http://localhost:4200").TrimEnd('/');

    // ------------------------------------------------------------------ checkout
    public async Task<CheckoutResponse> CreateCheckoutForPlanAsync(Guid userId, string planCode, string interval)
    {
        var (user, tenantId) = await RequireUserTenantAsync(userId);
        var (plan, price) = await RequirePlanPriceAsync(planCode, interval);
        var stripePriceId = await EnsureStripePriceAsync(plan, price);

        var metadata = new Dictionary<string, string>
        {
            ["tenantId"] = tenantId.ToString(),
            ["planId"] = plan.Id.ToString(),
            ["planCode"] = plan.Plan_Code,
            ["interval"] = price.Interval,
            ["userId"] = userId.ToString()
        };
        // Reuse the tenant's Stripe customer (if any) so credits stay on one record.
        var existingCustomerId = await _db.TenantPlans
            .Where(t => t.Tenant_Id == tenantId && t.StripeCustomerId != null && !t.Is_Deleted)
            .OrderByDescending(t => t.Create_Date)
            .Select(t => t.StripeCustomerId)
            .FirstOrDefaultAsync();

        var session = await _stripe.CreateSubscriptionCheckoutAsync(
            stripePriceId, user.Email, tenantId.ToString(), metadata,
            successUrl: $"{FrontendUrl}/billing/success?session_id={{CHECKOUT_SESSION_ID}}&plan={Uri.EscapeDataString(plan.Plan_Code)}",
            cancelUrl: $"{FrontendUrl}/billing/cancelled?plan={Uri.EscapeDataString(plan.Plan_Code)}",
            existingCustomerId: existingCustomerId);
        return new CheckoutResponse(session.Url, session.Id);
    }

    // ------------------------------------------------------------ upgrade / downgrade
    public async Task<ChangePlanResponse> ChangePlanAsync(Guid userId, string planCode, string interval)
    {
        var (_, tenantId) = await RequireUserTenantAsync(userId);
        var current = await _db.TenantPlans
            .Where(t => t.Tenant_Id == tenantId && !t.Is_Deleted)
            .OrderByDescending(t => t.Create_Date)
            .FirstOrDefaultAsync();

        // A scheduled downgrade whose date has passed is applied before anything else.
        await ApplyDuePendingChangeAsync(tenantId);

        // Downgrade to Free = cancel the paid subscription at period end.
        if (string.Equals(planCode, "Free", StringComparison.OrdinalIgnoreCase))
        {
            if (current?.StripeSubscriptionId == null)
                return new ChangePlanResponse(true, false, null, "You're on the Free plan.");
            await _stripe.CancelAtPeriodEndAsync(current.StripeSubscriptionId);
            current.Status = "canceling";
            current.Cancel_At = current.Current_Period_End;
            var cancelRow = await _db.Subscriptions.FirstOrDefaultAsync(s => s.StripeSubscriptionId == current.StripeSubscriptionId && !s.Is_Deleted);
            if (cancelRow != null)
            {
                cancelRow.Status = "canceling";
                cancelRow.Cancel_At = current.Current_Period_End;
                cancelRow.Pending_Plan_Id = null; cancelRow.Pending_Interval = null; cancelRow.Scheduled_Change_On = null;
            }
            await AddHistoryAsync(tenantId, current.Plan_Id, "cancel_scheduled", 0, "USD", current.Interval,
                current.StripeCustomerId, current.StripeSubscriptionId, null,
                "Subscription will end at the current period; the account then moves to Free.");
            await _db.SaveChangesAsync();
            return new ChangePlanResponse(true, false, null, "Your subscription will end at the current period — you'll move to the Free plan automatically.");
        }

        var (plan, price) = await RequirePlanPriceAsync(planCode, interval);

        // Re-choosing the CURRENT plan = "keep my plan": undo a scheduled
        // downgrade or a scheduled cancellation instead of doing nothing.
        if (current != null && current.Plan_Id == plan.Id && current.StripeSubscriptionId != null)
        {
            var row = await _db.Subscriptions.FirstOrDefaultAsync(x => x.StripeSubscriptionId == current.StripeSubscriptionId && !x.Is_Deleted);
            if (row?.Pending_Plan_Id != null)
            {
                // Revert Stripe's next-cycle price back to the current plan.
                var (curPlan, curPrice) = await RequirePlanPriceAsync(plan.Plan_Code, current.Interval);
                var backPriceId = await EnsureStripePriceAsync(curPlan, curPrice);
                await _stripe.ChangeSubscriptionPriceAsync(current.StripeSubscriptionId, backPriceId, prorate: false);
                row.Pending_Plan_Id = null; row.Pending_Interval = null; row.Scheduled_Change_On = null;
                // Void the scheduled future phase — the timeline stays on the current plan.
                var schedRows = await _db.Subscriptions.Where(x => x.Tenant_Id == tenantId && x.Status == "scheduled" && !x.Is_Deleted).ToListAsync();
                foreach (var sr in schedRows) sr.Is_Deleted = true;
                await AddHistoryAsync(tenantId, plan.Id, "downgrade_canceled", 0, curPrice.Currency, current.Interval,
                    current.StripeCustomerId, current.StripeSubscriptionId, null, $"Scheduled downgrade canceled — staying on {plan.Title}.");
                await _db.SaveChangesAsync();
                return new ChangePlanResponse(true, false, null, $"Scheduled change canceled — you're staying on {plan.Title}.");
            }
            if (current.Status == "canceling")
            {
                await _stripe.ResumeSubscriptionAsync(current.StripeSubscriptionId);
                current.Status = "active";
                current.Cancel_At = null;
                if (row != null) { row.Status = "active"; row.Cancel_At = null; }
                await AddHistoryAsync(tenantId, plan.Id, "cancel_undone", 0, price.Currency, current.Interval,
                    current.StripeCustomerId, current.StripeSubscriptionId, null, $"Cancellation undone — {plan.Title} continues.");
                await _db.SaveChangesAsync();
                return new ChangePlanResponse(true, false, null, $"Welcome back — {plan.Title} continues uninterrupted.");
            }
            return new ChangePlanResponse(true, false, null, $"You're already on {plan.Title}.");
        }

        // No live subscription → they must pay through Checkout first.
        if (current?.StripeSubscriptionId == null || current.Status is not ("active" or "trialing" or "canceling"))
        {
            var checkout = await CreateCheckoutForPlanAsync(userId, planCode, interval);
            return new ChangePlanResponse(true, true, checkout.Url, "Complete the payment to activate your new plan.");
        }

        // Live subscription. Policy:
        //  - UPGRADE (higher tier, or same tier / interval change) → immediate, prorated.
        //  - DOWNGRADE (lower paid tier) → the customer keeps what they paid for:
        //    Stripe bills the new price from the next cycle (no prorations) and our
        //    plan pointer switches at period end via the pending-change fields.
        var currentPlan = await _db.Plans.FirstOrDefaultAsync(p => p.Id == current.Plan_Id);
        var isDowngrade = currentPlan != null && plan.SortOrder < currentPlan.SortOrder;
        var stripePriceId = await EnsureStripePriceAsync(plan, price);
        var subRow = await _db.Subscriptions.FirstOrDefaultAsync(s => s.StripeSubscriptionId == current.StripeSubscriptionId && !s.Is_Deleted);

        if (isDowngrade)
        {
            await _stripe.ChangeSubscriptionPriceAsync(current.StripeSubscriptionId, stripePriceId, prorate: false);
            var effective = current.Current_Period_End ?? PeriodEnd(current.Interval);
            if (subRow != null)
            {
                subRow.Pending_Plan_Id = plan.Id;
                subRow.Pending_Interval = price.Interval;
                subRow.Scheduled_Change_On = effective;
            }

            // Subscription TIMELINE: the current plan keeps its row until it expires,
            // and the downgrade target exists as its own "scheduled" row starting on
            // that date — a clean, auditable history instead of mutating one record.
            var alreadyScheduled = await _db.Subscriptions.AnyAsync(x =>
                x.Tenant_Id == tenantId && x.Status == "scheduled" && !x.Is_Deleted);
            if (!alreadyScheduled)
            {
                _db.Subscriptions.Add(new SubscriptionEntity
                {
                    Id = Guid.NewGuid(),
                    Tenant_Id = tenantId,
                    Plan_Id = plan.Id,
                    Interval = price.Interval,
                    Status = "scheduled",
                    StripeCustomerId = current.StripeCustomerId,
                    StripeSubscriptionId = current.StripeSubscriptionId,
                    Amount = price.Amount,
                    Currency = price.Currency,
                    Started_On = effective.UtcDateTime,
                    Current_Period_End = effective.AddMonths(price.Interval.ToLower() == "yearly" ? 12 : 1)
                });
            }
            else
            {
                // Re-scheduling to a different target: update the existing scheduled row.
                var sched = await _db.Subscriptions.FirstAsync(x => x.Tenant_Id == tenantId && x.Status == "scheduled" && !x.Is_Deleted);
                sched.Plan_Id = plan.Id;
                sched.Interval = price.Interval;
                sched.Amount = price.Amount;
                sched.Currency = price.Currency;
                sched.Started_On = effective.UtcDateTime;
            }

            await AddHistoryAsync(tenantId, plan.Id, "downgrade_scheduled", 0, price.Currency, price.Interval,
                current.StripeCustomerId, current.StripeSubscriptionId, null,
                $"Downgrade to {plan.Title} scheduled — {currentPlan!.Title} stays active until {effective:yyyy-MM-dd}.");
            await _db.SaveChangesAsync();
            return new ChangePlanResponse(true, false, null,
                $"You'll keep {currentPlan.Title} until {effective:MMM d, yyyy}, then move to {plan.Title} automatically.");
        }

        // Upgrade / interval change → the user PAYS on the hosted Stripe Checkout page.
        // Once paid, ApplyPaidCheckoutAsync activates the new plan and cancels the
        // old subscription (unused time becomes a credit on the Stripe customer).
        var upgrade = await CreateCheckoutForPlanAsync(userId, planCode, interval);
        return new ChangePlanResponse(true, true, upgrade.Url, $"Complete the payment to upgrade to {plan.Title}.");
    }

    /// <summary>
    /// Applies a scheduled downgrade whose date has passed (lazy execution — no
    /// background job needed; also triggered by the renewal webhook).
    /// </summary>
    private async Task ApplyDuePendingChangeAsync(Guid tenantId)
    {
        var due = await _db.Subscriptions.FirstOrDefaultAsync(s =>
            s.Tenant_Id == tenantId && !s.Is_Deleted && s.Status != "scheduled" &&
            s.Pending_Plan_Id != null && s.Scheduled_Change_On != null && s.Scheduled_Change_On <= DateTimeOffset.UtcNow);
        if (due == null) return;

        var newPlanId = due.Pending_Plan_Id!.Value;
        var newInterval = due.Pending_Interval ?? due.Interval;
        var price = await _db.PlanPrices.FirstOrDefaultAsync(p => p.Plan_Id == newPlanId && p.Interval == newInterval && p.IsActive);

        // Timeline handover: the old phase ENDS, the scheduled phase becomes ACTIVE.
        var scheduled = await _db.Subscriptions.FirstOrDefaultAsync(x =>
            x.Tenant_Id == tenantId && x.Status == "scheduled" && !x.Is_Deleted);
        due.Pending_Plan_Id = null; due.Pending_Interval = null; due.Scheduled_Change_On = null;
        DateTimeOffset? periodEnd;
        if (scheduled != null)
        {
            due.Status = "ended";
            due.Canceled_On = DateTime.UtcNow;
            scheduled.Status = "active";
            scheduled.Current_Period_End = PeriodEnd(newInterval);
            periodEnd = scheduled.Current_Period_End;
        }
        else
        {
            // Legacy fallback (rows created before the timeline model): mutate in place.
            due.Plan_Id = newPlanId;
            due.Interval = newInterval;
            due.Amount = price?.Amount ?? due.Amount;
            due.Currency = price?.Currency ?? due.Currency;
            due.Current_Period_End = PeriodEnd(newInterval);
            periodEnd = due.Current_Period_End;
        }

        var tp = await _db.TenantPlans.Where(t => t.Tenant_Id == tenantId && !t.Is_Deleted)
            .OrderByDescending(t => t.Create_Date).FirstOrDefaultAsync();
        if (tp != null)
        {
            tp.Plan_Id = newPlanId;
            tp.Interval = newInterval;
            tp.Current_Period_End = periodEnd;
        }

        var planTitle = await _db.Plans.Where(p => p.Id == newPlanId).Select(p => p.Title).FirstOrDefaultAsync() ?? "";
        await AddHistoryAsync(tenantId, newPlanId, "plan_changed", price?.Amount ?? 0, price?.Currency ?? "USD", newInterval,
            due.StripeCustomerId, due.StripeSubscriptionId, null, $"Scheduled downgrade took effect — now on {planTitle}.");
        await _db.SaveChangesAsync();
    }

    // ------------------------------------------------------------------ queries
    public async Task<SubscriptionView?> GetSubscriptionAsync(Guid userId)
    {
        var (user, tenantId) = await RequireUserTenantAsync(userId);
        // A scheduled downgrade whose date passed is applied lazily on read.
        await ApplyDuePendingChangeAsync(tenantId);

        // Source of truth: the Subscriptions table. "scheduled" rows are future
        // phases — the CURRENT subscription is the newest non-scheduled row.
        var s = await _db.Subscriptions.Include(x => x.Plan)
            .Where(x => x.Tenant_Id == tenantId && !x.Is_Deleted && x.Status != "scheduled")
            .OrderByDescending(x => x.Started_On)
            .FirstOrDefaultAsync();
        if (s?.Plan != null)
        {
            string? pendingCode = null;
            if (s.Pending_Plan_Id != null)
                pendingCode = await _db.Plans.Where(p => p.Id == s.Pending_Plan_Id.Value).Select(p => p.Plan_Code).FirstOrDefaultAsync();
            return new SubscriptionView(s.Plan.Plan_Code, s.Plan.Title, s.Interval, s.Status, s.Amount, s.Currency,
                s.Current_Period_End, s.Cancel_At, pendingCode, s.Scheduled_Change_On);
        }
        // Legacy fallback: the TenantPlan pointer (rows created before the Subscriptions table existed).
        var tp = await _db.TenantPlans.Include(t => t.Plan)
            .Where(t => t.Tenant_Id == tenantId && !t.Is_Deleted)
            .OrderByDescending(t => t.Create_Date)
            .FirstOrDefaultAsync();
        if (tp?.Plan != null)
        {
            var price = await _db.PlanPrices.FirstOrDefaultAsync(p => p.Plan_Id == tp.Plan_Id && p.Interval == tp.Interval && p.IsActive);
            return new SubscriptionView(tp.Plan.Plan_Code, tp.Plan.Title, tp.Interval, tp.Status,
                price?.Amount ?? 0, price?.Currency ?? "USD", tp.Current_Period_End, tp.Cancel_At);
        }

        // No subscription at all → the tenant is on the 14-day Free Trial.
        var tenantCreated = await _db.Tenants.Where(t => t.Id == tenantId).Select(t => (DateTime?)t.Created_Date).FirstOrDefaultAsync()
                            ?? user.Create_Date;
        var trialEnd = new DateTimeOffset(tenantCreated.ToUniversalTime()).AddDays(14);
        var expired = trialEnd <= DateTimeOffset.UtcNow;
        return new SubscriptionView("Free", "Free Trial", "monthly", expired ? "trial_expired" : "trialing",
            0, "USD", trialEnd, null);
    }

    public async Task<List<BillingHistoryView>> GetHistoryAsync(Guid userId)
    {
        var (_, tenantId) = await RequireUserTenantAsync(userId);
        return await _db.BillingHistories
            .Where(b => b.Tenant_Id == tenantId && !b.Is_Deleted)
            .OrderByDescending(b => b.Created_On)
            .Take(100)
            .Select(b => new BillingHistoryView(b.Id, b.Plan_Code, b.Status, b.Amount, b.Currency, b.Interval, b.Description, b.Created_On))
            .ToListAsync();
    }

    public async Task<string?> CreatePortalUrlAsync(Guid userId, string returnUrl)
    {
        var (_, tenantId) = await RequireUserTenantAsync(userId);
        var tp = await _db.TenantPlans.Where(t => t.Tenant_Id == tenantId && t.StripeCustomerId != null && !t.Is_Deleted)
            .OrderByDescending(t => t.Create_Date).FirstOrDefaultAsync();
        if (tp?.StripeCustomerId == null) return null;
        return await _stripe.CreateBillingPortalUrlAsync(tp.StripeCustomerId, returnUrl);
    }

    // ------------------------------------------------------------------ webhook
    public async Task HandleWebhookAsync(Event stripeEvent)
    {
        switch (stripeEvent.Type)
        {
            case "checkout.session.completed":
            {
                if (stripeEvent.Data.Object is not Session session) return;
                if (!Guid.TryParse(session.ClientReferenceId, out var tenantId)) return;
                session.Metadata.TryGetValue("planId", out var planIdRaw);
                session.Metadata.TryGetValue("planCode", out var planCode);
                session.Metadata.TryGetValue("interval", out var interval);
                session.Metadata.TryGetValue("userId", out var userIdRaw);
                Guid.TryParse(planIdRaw, out var planId);
                Guid? buyer = Guid.TryParse(userIdRaw, out var b) ? b : null;

                await ApplyPaidCheckoutAsync(tenantId, planId, planCode ?? "", interval,
                    session.CustomerId, session.SubscriptionId,
                    (session.AmountTotal ?? 0) / 100m, (session.Currency ?? "usd").ToUpperInvariant(),
                    session.InvoiceId, buyer);
                break;
            }
            case "invoice.paid":
            case "invoice.payment_succeeded":
            {
                // Monthly/yearly RENEWALS — the first payment is recorded by checkout.
                if (stripeEvent.Data.Object is not Invoice invoice) return;
                if (invoice.BillingReason != "subscription_cycle") return;
                var tp = await _db.TenantPlans.FirstOrDefaultAsync(t => t.StripeCustomerId == invoice.CustomerId && !t.Is_Deleted);
                if (tp == null) return;

                // Renewal moment = when scheduled downgrades take effect.
                await ApplyDuePendingChangeAsync(tp.Tenant_Id);

                tp.Status = "active";
                tp.Current_Period_End = PeriodEnd(tp.Interval);
                var renewRow = await _db.Subscriptions.FirstOrDefaultAsync(s => s.StripeSubscriptionId == tp.StripeSubscriptionId && !s.Is_Deleted);
                if (renewRow != null) { renewRow.Status = "active"; renewRow.Current_Period_End = tp.Current_Period_End; }

                await AddHistoryAsync(tp.Tenant_Id, tp.Plan_Id, "paid",
                    invoice.AmountPaid / 100m, (invoice.Currency ?? "usd").ToUpperInvariant(), tp.Interval,
                    invoice.CustomerId, tp.StripeSubscriptionId, invoice.Id, "Subscription renewal payment.");
                await _db.SaveChangesAsync();
                break;
            }
            case "invoice.payment_failed":
            {
                if (stripeEvent.Data.Object is not Invoice invoice) return;
                var tp = await _db.TenantPlans.FirstOrDefaultAsync(t => t.StripeCustomerId == invoice.CustomerId && !t.Is_Deleted);
                if (tp == null) return;
                tp.Status = "past_due";
                var pdRow = await _db.Subscriptions.FirstOrDefaultAsync(s => s.StripeSubscriptionId == tp.StripeSubscriptionId && !s.Is_Deleted);
                if (pdRow != null) pdRow.Status = "past_due";
                await AddHistoryAsync(tp.Tenant_Id, tp.Plan_Id, "payment_failed",
                    (invoice.AmountDue) / 100m, (invoice.Currency ?? "usd").ToUpperInvariant(), tp.Interval,
                    invoice.CustomerId, tp.StripeSubscriptionId, invoice.Id, "A payment attempt failed — Stripe will retry.");
                await _db.SaveChangesAsync();
                break;
            }
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
            {
                if (stripeEvent.Data.Object is not StripeSubscription sub) return;
                var tp = await _db.TenantPlans.FirstOrDefaultAsync(t => t.StripeSubscriptionId == sub.Id && !t.Is_Deleted);
                var subRow = await _db.Subscriptions.FirstOrDefaultAsync(s => s.StripeSubscriptionId == sub.Id && s.Status != "scheduled" && !s.Is_Deleted);
                if (tp == null && subRow == null) return;
                if (stripeEvent.Type == "customer.subscription.deleted" || sub.Status == "canceled")
                {
                    var histTenant = tp?.Tenant_Id ?? subRow!.Tenant_Id;
                    // Superseded by an upgrade? A newer subscription is live for this
                    // tenant → just close this row quietly, the account did NOT move to Free.
                    var hasNewerActive = await _db.Subscriptions.AnyAsync(x =>
                        x.Tenant_Id == histTenant && x.StripeSubscriptionId != sub.Id && !x.Is_Deleted &&
                        (x.Status == "active" || x.Status == "trialing" || x.Status == "canceling"));
                    if (subRow != null) { subRow.Status = "canceled"; subRow.Canceled_On = DateTime.UtcNow; }
                    // A dead subscription can't carry a future phase — void any scheduled row on it.
                    var deadSched = await _db.Subscriptions.Where(x => x.StripeSubscriptionId == sub.Id && x.Status == "scheduled" && !x.Is_Deleted).ToListAsync();
                    foreach (var ds in deadSched) ds.Is_Deleted = true;
                    if (!hasNewerActive)
                    {
                        if (tp != null) tp.Status = "canceled";
                        await AddHistoryAsync(histTenant, tp?.Plan_Id ?? subRow?.Plan_Id, "canceled", 0, "USD", tp?.Interval ?? subRow?.Interval,
                            tp?.StripeCustomerId ?? subRow?.StripeCustomerId, sub.Id, null, "Subscription ended — the account moved to the Free plan.");
                    }
                }
                else
                {
                    var status = sub.CancelAtPeriodEnd ? "canceling" : sub.Status;
                    if (tp != null) tp.Status = status;
                    if (subRow != null) subRow.Status = status;
                }
                await _db.SaveChangesAsync();
                break;
            }
        }
    }

    // ---------------------------------------------------------- confirm checkout
    /// <summary>
    /// The no-webhook path: called by the success page with the session id.
    /// Verifies with Stripe that the session is PAID and belongs to this tenant,
    /// then persists exactly like the webhook would (idempotent — safe if both run).
    /// </summary>
    public async Task<ConfirmCheckoutResponse> ConfirmCheckoutAsync(Guid userId, string sessionId)
    {
        var (_, tenantId) = await RequireUserTenantAsync(userId);
        var s = await _stripe.GetCheckoutSessionAsync(sessionId);

        if (!string.Equals(s.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
            return new ConfirmCheckoutResponse(false, "", "The payment hasn't completed yet.");
        if (!Guid.TryParse(s.ClientReferenceId, out var sessionTenant) || sessionTenant != tenantId)
            return new ConfirmCheckoutResponse(false, "", "This checkout doesn't belong to your account.");

        s.Metadata.TryGetValue("planId", out var planIdRaw);
        s.Metadata.TryGetValue("planCode", out var planCode);
        s.Metadata.TryGetValue("interval", out var interval);
        Guid.TryParse(planIdRaw, out var planId);

        await ApplyPaidCheckoutAsync(tenantId, planId, planCode ?? "", interval,
            s.CustomerId, s.SubscriptionId, (s.AmountTotal ?? 0) / 100m,
            (s.Currency ?? "usd").ToUpperInvariant(), s.InvoiceId, userId);

        return new ConfirmCheckoutResponse(true, planCode ?? "", "Subscription activated — welcome aboard!");
    }

    /// <summary>
    /// Persists a PAID checkout: TenantPlan pointer + Subscription row + one
    /// "paid" BillingHistory entry. Idempotent — the history row is written only
    /// once per invoice/subscription even when webhook AND confirm both run.
    /// </summary>
    private async Task ApplyPaidCheckoutAsync(Guid tenantId, Guid planId, string planCode, string? interval,
        string? customerId, string? subscriptionId, decimal amount, string currency, string? invoiceId, Guid? buyerUserId)
    {
        interval = string.IsNullOrEmpty(interval) ? "monthly" : interval;

        // TenantPlan = current-plan pointer.
        var tp = await _db.TenantPlans.Where(t => t.Tenant_Id == tenantId && !t.Is_Deleted)
            .OrderByDescending(t => t.Create_Date).FirstOrDefaultAsync();
        if (tp == null)
        {
            // Created_By must reference a real user (FK) — prefer the buyer.
            var createdBy = buyerUserId ?? await _db.Users.Where(u => u.Tenant_Id == tenantId).Select(u => u.Id).FirstOrDefaultAsync();
            tp = new TenantPlan { Id = Guid.NewGuid(), Tenant_Id = tenantId, Region_Code = "GLOBAL", Create_Date = DateTime.UtcNow, Created_By = createdBy };
            _db.TenantPlans.Add(tp);
        }

        // Upgrade paid via a NEW checkout → the previous subscription is superseded:
        // cancel it at Stripe now (unused time becomes a customer-balance credit).
        var oldSubId = tp.StripeSubscriptionId;
        if (!string.IsNullOrEmpty(oldSubId) && !string.Equals(oldSubId, subscriptionId, StringComparison.Ordinal))
        {
            try { await _stripe.CancelSubscriptionNowAsync(oldSubId); } catch { /* already canceled / gone */ }
            // Close every phase tied to the old subscription — including a scheduled downgrade it superseded.
            var oldRows = await _db.Subscriptions.Where(x => x.StripeSubscriptionId == oldSubId && !x.Is_Deleted).ToListAsync();
            foreach (var oldRow in oldRows)
            {
                if (oldRow.Status == "scheduled") { oldRow.Is_Deleted = true; continue; }
                oldRow.Status = "canceled";
                oldRow.Canceled_On = DateTime.UtcNow;
                oldRow.Pending_Plan_Id = null; oldRow.Pending_Interval = null; oldRow.Scheduled_Change_On = null;
            }
        }

        tp.Plan_Id = planId;
        tp.Interval = interval;
        tp.StripeCustomerId = customerId;
        tp.StripeSubscriptionId = subscriptionId;
        tp.Status = "active";
        tp.Cancel_At = null;
        tp.Current_Period_End = PeriodEnd(interval);

        await UpsertSubscriptionAsync(tenantId, planId, interval, "active",
            customerId, subscriptionId ?? string.Empty, amount, currency);

        bool alreadyRecorded = await _db.BillingHistories.AnyAsync(h =>
            h.Tenant_Id == tenantId && h.Status == "paid" &&
            ((invoiceId != null && h.StripeInvoiceId == invoiceId) ||
             (invoiceId == null && subscriptionId != null && h.StripeSubscriptionId == subscriptionId)));
        if (!alreadyRecorded)
        {
            await AddHistoryAsync(tenantId, planId == Guid.Empty ? null : planId, "paid",
                amount, currency, interval, customerId, subscriptionId, invoiceId,
                $"Subscription payment for the {planCode} plan ({interval}).");
        }
        await _db.SaveChangesAsync();
    }

    // ------------------------------------------------------------------ helpers
    /// <summary>
    /// PlanPrice rows are seeded with placeholder Stripe ids; on first use we
    /// create the real Stripe product + recurring price and persist their ids.
    /// </summary>
    private async Task<string> EnsureStripePriceAsync(Plan plan, PlanPrice price)
    {
        if (await _stripe.PriceExistsAsync(price.StripePriceId))
            return price.StripePriceId;

        var created = await _stripe.CreateProductWithRecurringPriceAsync(
            name: $"Certifada {plan.Title}",
            description: plan.Blurb,
            amount: price.Amount,
            currency: price.Currency,
            interval: price.Interval,
            metadata: new Dictionary<string, string> { ["planId"] = plan.Id.ToString(), ["planCode"] = plan.Plan_Code, ["interval"] = price.Interval });

        price.StripeProductId = created.ProductId;
        price.StripePriceId = created.PriceId;
        await _db.SaveChangesAsync();
        return created.PriceId;
    }

    private async Task<(User user, Guid tenantId)> RequireUserTenantAsync(Guid userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
                   ?? throw new InvalidOperationException("User not found.");
        var tenantId = user.Tenant_Id ?? throw new InvalidOperationException("User has no tenant.");
        return (user, tenantId);
    }

    private async Task<(Plan plan, PlanPrice price)> RequirePlanPriceAsync(string planCode, string interval)
    {
        interval = string.IsNullOrWhiteSpace(interval) ? "monthly" : interval.ToLowerInvariant();
        var plan = await _db.Plans.FirstOrDefaultAsync(p => p.Plan_Code == planCode && p.Is_Active && !p.Is_Deleted)
                   ?? throw new InvalidOperationException($"Unknown plan '{planCode}'.");
        var price = await _db.PlanPrices.FirstOrDefaultAsync(p => p.Plan_Id == plan.Id && p.Interval == interval && p.IsActive)
                    ?? throw new InvalidOperationException($"No {interval} price for plan '{planCode}'.");
        if (price.Amount <= 0) throw new InvalidOperationException("The Free plan doesn't require payment.");
        return (plan, price);
    }

    /// <summary>One row per Stripe subscription — created on first payment, updated on every lifecycle change.</summary>
    private async Task UpsertSubscriptionAsync(Guid tenantId, Guid planId, string interval, string status,
        string? customerId, string stripeSubId, decimal amount, string currency)
    {
        if (string.IsNullOrEmpty(stripeSubId)) return;
        var row = await _db.Subscriptions.FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSubId && s.Status != "scheduled" && !s.Is_Deleted);
        if (row == null)
        {
            row = new SubscriptionEntity { Id = Guid.NewGuid(), Tenant_Id = tenantId, StripeSubscriptionId = stripeSubId, Started_On = DateTime.UtcNow };
            _db.Subscriptions.Add(row);
        }
        row.Plan_Id = planId;
        row.Interval = interval;
        row.Status = status;
        row.StripeCustomerId = customerId;
        row.Amount = amount;
        row.Currency = currency;
        row.Current_Period_End = PeriodEnd(interval);
        row.Cancel_At = null;
        row.Canceled_On = null;
    }

    /// <summary>Period end computed from the interval (kept simple; the webhook keeps status in sync).</summary>
    private static DateTimeOffset PeriodEnd(string interval) =>
        interval.ToLower() == "yearly" ? DateTimeOffset.UtcNow.AddYears(1) : DateTimeOffset.UtcNow.AddMonths(1);

    private Task AddHistoryAsync(Guid tenantId, Guid? planId, string status, decimal amount, string currency,
        string? interval, string? customerId, string? subscriptionId, string? invoiceId, string? description)
    {
        var planCode = planId.HasValue ? _db.Plans.Where(p => p.Id == planId.Value).Select(p => p.Plan_Code).FirstOrDefault() ?? "" : "";
        _db.BillingHistories.Add(new BillingHistory
        {
            Id = Guid.NewGuid(),
            Tenant_Id = tenantId,
            Plan_Id = planId,
            Plan_Code = planCode,
            Status = status,
            Amount = amount,
            Currency = currency,
            Interval = interval,
            StripeCustomerId = customerId,
            StripeSubscriptionId = subscriptionId,
            StripeInvoiceId = invoiceId,
            Description = description,
            Created_On = DateTime.UtcNow
        });
        return Task.CompletedTask;
    }
}

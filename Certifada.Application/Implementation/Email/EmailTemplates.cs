using System.Net;
using Certifada.Domain.Abstractions.Enums;

namespace Certifada.Application.Implementation.Email
{
    /// <summary>
    /// Renders branded, email-client-safe HTML for the built-in transactional templates.
    /// Token keys: name, link, issuer, credential, body. Missing keys render empty.
    /// </summary>
    public static class EmailTemplates
    {
        public static (string Subject, string Html) Render(EmailTemplateEnum template, IDictionary<string, string> tokens)
        {
            string T(string k) => tokens != null && tokens.TryGetValue(k, out var s) ? (s ?? string.Empty) : string.Empty;

            switch (template)
            {
                case EmailTemplateEnum.Welcome:
                    return ("Welcome to Certifada ✨", Wrap("Welcome to Certifada",
                        $"<p>Hi {Esc(T("name"))},</p>" +
                        "<p>Your Certifada workspace is ready. Design beautiful certificates, issue them at scale, and let recipients verify them instantly.</p>" +
                        Button("Go to your dashboard", T("link"))));

                case EmailTemplateEnum.ConfirmEmail:
                    return ("Confirm your email · Certifada", Wrap("Confirm your email",
                        $"<p>Hi {Esc(T("name"))},</p>" +
                        "<p>Please confirm your email address to activate your Certifada account.</p>" +
                        Button("Confirm email", T("link")) + Fallback(T("link"))));

                case EmailTemplateEnum.ResetPassword:
                    return ("Reset your password · Certifada", Wrap("Reset your password",
                        $"<p>Hi {Esc(T("name"))},</p>" +
                        "<p>We received a request to reset your Certifada password. This link expires in 30 minutes. If you didn't request it, you can safely ignore this email.</p>" +
                        Button("Reset password", T("link")) + Fallback(T("link"))));

                case EmailTemplateEnum.CredentialIssued:
                    return ($"Your credential from {T("issuer")}", Wrap("You’ve earned a credential",
                        $"<p>Hi {Esc(T("name"))},</p>" +
                        $"<p><b>{Esc(T("issuer"))}</b> has issued you <b>{Esc(T("credential"))}</b>. View, download and share your verified credential below.</p>" +
                        Button("View your credential", T("link"))));

                case EmailTemplateEnum.MessageReceived:
                    return ("New message about a credential · Certifada", Wrap("New message",
                        $"<p>You received a new message from <b>{Esc(T("name"))}</b> regarding <b>{Esc(T("credential"))}</b>:</p>" +
                        $"<blockquote style=\"margin:14px 0;padding:12px 16px;background:#f1f5f9;border-left:3px solid #4f46e5;border-radius:8px;color:#334155\">{Esc(T("body"))}</blockquote>" +
                        Button("Open Message Center", T("link"))));

                default:
                    return ("Certifada", Wrap("Certifada", "<p>You have a new notification from Certifada.</p>"));
            }
        }

        private static string Esc(string s) => WebUtility.HtmlEncode(s ?? string.Empty);

        private static string Button(string label, string url)
        {
            if (string.IsNullOrWhiteSpace(url)) return string.Empty;
            return $"<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:26px 0\"><tr><td style=\"border-radius:10px;background:linear-gradient(135deg,#6366f1,#4338ca)\">" +
                   $"<a href=\"{Esc(url)}\" style=\"display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px\">{Esc(label)}</a>" +
                   "</td></tr></table>";
        }

        private static string Fallback(string url) =>
            string.IsNullOrWhiteSpace(url) ? string.Empty :
            $"<p style=\"font-size:12px;color:#94a3b8;word-break:break-all\">Or copy this link: {Esc(url)}</p>";

        private static string Wrap(string title, string inner) =>
            "<!doctype html><html><body style=\"margin:0;background:#f6f7fb;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a\">" +
            "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f6f7fb;padding:28px 12px\"><tr><td align=\"center\">" +
            "<table role=\"presentation\" width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden\">" +
            "<tr><td style=\"background:linear-gradient(135deg,#6366f1,#4338ca);padding:20px 28px\">" +
            "<span style=\"font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-.02em\">Certi<span style=\"color:#e9cb73\">fada</span></span></td></tr>" +
            $"<tr><td style=\"padding:30px 30px 12px\"><h1 style=\"margin:0 0 6px;font-size:21px;font-weight:800;color:#0f172a\">{Esc(title)}</h1></td></tr>" +
            $"<tr><td style=\"padding:0 30px 26px;font-size:14.5px;line-height:1.65;color:#475569\">{inner}</td></tr>" +
            "<tr><td style=\"padding:18px 30px;border-top:1px solid #eef1f6;font-size:12px;color:#94a3b8\">" +
            "You’re receiving this because you have a Certifada account. · Certifada &mdash; verifiable credentials.</td></tr>" +
            "</table></td></tr></table></body></html>";
    }
}

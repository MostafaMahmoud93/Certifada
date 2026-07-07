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
                    return ("Welcome to Certifada", Wrap("Welcome to Certifada",
                        $"<p>Hi {Esc(T("name"))},</p>" +
                        "<p>Your Certifada workspace is ready. Design beautiful certificates, issue them at scale, and let recipients verify them instantly.</p>" +
                        Button("Go to your dashboard", T("link"))));

                case EmailTemplateEnum.ConfirmEmail:
                    return ("Verify your email address · Certifada", Wrap("Verify your email address",
                        $"<p>Hi {Esc(T("name"))},</p>" +
                        "<p>Thank you for signing up. Please click the button below to verify your email address and activate your account:</p>" +
                        Button("Verify Email Address", T("link")) +
                        "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td align=\"center\" style=\"padding:2px 0 8px\">" +
                        "<span style=\"display:inline-block;padding:6px 14px;border-radius:999px;background:#eef2ff;color:#4338ca;font-size:12.5px;font-weight:700\">⏳ This verification link will expire in 24 hours</span>" +
                        "</td></tr></table>" +
                        "<p style=\"font-size:12.5px;color:#94a3b8\">If you did not sign up for this account, please ignore this email.</p>" +
                        Fallback(T("link"))));

                case EmailTemplateEnum.ResetPassword:
                    return ("Reset your password · Certifada", Wrap("Reset your password",
                        $"<p>Hi {Esc(T("name"))},</p>" +
                        "<p>We received a request to reset your Certifada password. This link expires in 30 minutes. If you didn't request it, you can safely ignore this email.</p>" +
                        Button("Reset password", T("link")) + Fallback(T("link"))));

                case EmailTemplateEnum.CredentialIssued:
                    return ($"Your credential from {T("issuer")}", Wrap("You’ve earned a credential",
                        $"<p>Hi {Esc(T("name"))},</p>" +
                        $"<p><b>{Esc(T("issuer"))}</b> has issued you <b>{Esc(T("credential"))}</b>. View, download and share your verified credential below.</p>" +
                        Button("View your credential", T("link")) +
                        // Frictionless wallet: this link lives in the recipient's own inbox, so possession = proof.
                        (string.IsNullOrWhiteSpace(T("walletLink")) ? string.Empty :
                            $"<p style=\"font-size:13px;color:#64748b;margin-top:4px\">All your credentials in one place — <a href=\"{Esc(T("walletLink"))}\" style=\"color:#4f46e5;font-weight:700;text-decoration:none\">open your wallet →</a></p>")));

                case EmailTemplateEnum.WalletLink:
                    return ("Open your Certifada wallet", Wrap("Your credentials wallet",
                        "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td align=\"center\" style=\"padding:4px 0 14px\">" +
                        "<div style=\"display:inline-block;width:64px;height:64px;line-height:64px;border-radius:16px;background:linear-gradient(135deg,#6366f1,#7c3aed);text-align:center;font-size:30px\">🎓</div>" +
                        "</td></tr></table>" +
                        $"<p style=\"text-align:center;font-size:15.5px\">Hi {Esc(T("name"))}, open your wallet to see every credential issued to you across Certifada.</p>" +
                        Button("Open my wallet", T("link")) +
                        // 6-digit code alternative
                        "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td align=\"center\" style=\"padding:6px 0 4px\">" +
                        $"<div style=\"font-size:12.5px;color:#64748b;margin-bottom:6px\">Or enter this code</div><div style=\"display:inline-block;padding:10px 18px;border-radius:12px;background:#eef2ff;color:#4338ca;font-size:26px;font-weight:800;letter-spacing:6px\">{Esc(T("code"))}</div>" +
                        "</td></tr></table>" +
                        $"<p style=\"font-size:12.5px;color:#94a3b8;text-align:center;margin-top:14px\">This link and code expire in {Esc(T("expires"))} minutes.</p>" +
                        Fallback(T("link"))));

                case EmailTemplateEnum.MagicLink:
                    return ("Your sign-in link for Certifada", Wrap("Your magic link is here",
                        // Hero: sparkle badge + one-tap promise
                        "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td align=\"center\" style=\"padding:4px 0 14px\">" +
                        "<div style=\"display:inline-block;width:64px;height:64px;line-height:64px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#0ea5e9);text-align:center;font-size:30px\">✨</div>" +
                        "</td></tr></table>" +
                        $"<p style=\"text-align:center;font-size:15.5px\">Hi {Esc(T("name"))}, tap the button below and you're in.<br/>No password. No typing. Just magic.</p>" +
                        // Big centered CTA
                        "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td align=\"center\" style=\"padding:6px 0 4px\">" +
                        "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\"><tr><td style=\"border-radius:12px;background:linear-gradient(135deg,#6366f1,#4338ca);box-shadow:0 10px 24px -10px rgba(79,70,229,.6)\">" +
                        $"<a href=\"{Esc(T("link"))}\" style=\"display:inline-block;padding:15px 38px;font-size:16px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:12px\">Sign me in&nbsp;&nbsp;→</a>" +
                        "</td></tr></table></td></tr></table>" +
                        // Expiry pill
                        "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td align=\"center\" style=\"padding:14px 0 6px\">" +
                        $"<span style=\"display:inline-block;padding:6px 14px;border-radius:999px;background:#eef2ff;color:#4338ca;font-size:12.5px;font-weight:700\">⏳ This link expires in {Esc(T("expires"))} minutes and works once</span>" +
                        "</td></tr></table>" +
                        "<p style=\"font-size:12.5px;color:#94a3b8;text-align:center;margin-top:14px\">Didn't request this? You can safely ignore this email — your account stays locked tight. 🔒</p>" +
                        Fallback(T("link"))));

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

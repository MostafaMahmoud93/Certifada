import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { jsPDF } from 'jspdf';
import { TemplateService } from '../../core/services/template.service';
import { IssuedService, IssuedRecord } from '../../core/services/issued.service';
import { AlertService } from '../../core/services/alert.service';
import { BrandService } from '../../core/services/brand.service';
import { mergeDataIntoJson, renderJsonToPng } from '../../core/utils/render.util';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
  <div class="vp">
    <header class="vbar">
      <div class="vbar-in">
        <div class="issuer">
          <span class="iss-logo">@if (issuerLogo()) { <img [src]="issuerLogo()" alt="" /> } @else { <span class="material-icons">apartment</span> }</span>
          <div class="iss-id"><strong>{{ issuerOrg() }}</strong><small>Credential verification</small></div>
        </div>
        <a class="powered" href="https://certifada.com" target="_blank" rel="noopener"><span class="material-icons">workspace_premium</span><span class="pw-txt">Verified by <b>Certifada</b></span></a>
      </div>
    </header>

    @if (loading()) {
      <div class="vstate"><span class="material-icons spin">progress_activity</span><p>Verifying credential…</p></div>
    } @else if (!record()) {
      <div class="vstate err"><span class="material-icons">gpp_bad</span><h2>Credential not found</h2><p>This verification link is invalid, expired, or the credential has been removed.</p></div>
    } @else {
      <!-- ===================== HERO BANNER ===================== -->
      <section class="hero" [class.revoked]="record()!.status === 'Revoked'">
        <span class="hero-bg"></span>
        @if (record()!.status !== 'Revoked') {
          <span class="confetti">@for (c of confetti; track $index) { <i [style.left.%]="c.left" [style.animation-delay.s]="c.delay" [style.animation-duration.s]="c.dur" [style.background]="c.color"></i> }</span>
        }
        <div class="hero-in">
          <div class="medal">
            @if (record()!.status !== 'Revoked') { <span class="rib rib-l"></span><span class="rib rib-r"></span> }
            <div class="seal" [class.revoked]="record()!.status === 'Revoked'">
              @if (record()!.status === 'Revoked') { <span class="material-icons">gpp_bad</span> }
              @else { <span class="ring"></span><span class="material-icons">verified</span> }
            </div>
          </div>
          <div class="hero-tx">
            <span class="eyebrow">{{ record()!.status === 'Revoked' ? 'Credential Status' : 'Verified Credential' }}</span>
            @if (record()!.status === 'Revoked') {
              <h1 class="big-verified bad">Revoked</h1>
              <p>Issued but since <strong>revoked</strong> by {{ issuerOrg() }} — no longer valid.</p>
            } @else {
              <h1 class="big-verified">Authentic &amp; Verified</h1>
              <p>Awarded to <strong>{{ record()!.recipientName || record()!.recipientEmail }}</strong> by {{ issuerOrg() }}</p>
            }
            <span class="verified-rule" [class.bad]="record()!.status === 'Revoked'"></span>
          </div>
        </div>
      </section>

      <!-- ===================== SHOWCASE ===================== -->
      <div class="showcase">
        <div class="show-main">
          <div class="cert-card">
            <div class="cert-frame">
              @if (art()) { <img [src]="art()" alt="certificate" /> }
              @else { <div class="cert-ph"><span class="material-icons">workspace_premium</span><span>Certificate preview</span></div> }
              <span class="cert-sheen"></span>
              <span class="cert-emboss"><span class="material-icons">verified</span></span>
            </div>
          </div>
          <div class="cert-toolbar">
            <button class="vbtn primary" (click)="downloadPdf()"><span class="material-icons">picture_as_pdf</span> Download PDF</button>
            <button class="vbtn" (click)="downloadPng()"><span class="material-icons">image</span> PNG</button>
            <button class="vbtn ghost" (click)="copy(verifyUrl, 'Verification link')"><span class="material-icons">link</span> Copy link</button>
          </div>
          @if (record()!.status !== 'Revoked') {
            <div class="trust">
              <span class="tb"><span class="material-icons">verified_user</span> Issuer-verified</span>
              <span class="tb"><span class="material-icons">gpp_good</span> Tamper-evident</span>
              <span class="tb"><span class="material-icons">history_edu</span> Permanent record</span>
            </div>
          }
        </div>

        <aside class="show-side">
          <div class="card passport">
            <h3 class="card-t"><span class="material-icons">badge</span> Credential</h3>
            <div class="pp-recip">
              <span class="pp-av">{{ recipInitials() }}</span>
              <div class="pp-rtx"><span class="pp-name">{{ record()!.recipientName || record()!.recipientEmail }}</span><span class="pp-mail">{{ record()!.recipientEmail }}</span></div>
            </div>
            <div class="pp-item"><span class="pp-ic">@if (issuerLogo()) { <img [src]="issuerLogo()" alt="" /> } @else { <span class="material-icons">apartment</span> }</span><div><span class="pp-l">Issued by</span><span class="pp-v">{{ issuerOrg() }}</span></div></div>
            <div class="pp-item"><span class="pp-ic"><span class="material-icons">event_available</span></span><div><span class="pp-l">Issued date</span><span class="pp-v">{{ record()!.createdAt | date: 'longDate' }}</span></div></div>
            <div class="pp-item"><span class="pp-ic"><span class="material-icons">tag</span></span><div><span class="pp-l">Credential ID</span><span class="pp-v id"><code>{{ record()!.id }}</code><button class="mini-copy" (click)="copy(record()!.id, 'Credential ID')" title="Copy"><span class="material-icons">content_copy</span></button></span></div></div>
            @if (record()!.signedBy) { <div class="pp-item"><span class="pp-ic"><span class="material-icons">draw</span></span><div><span class="pp-l">Signed by</span><span class="pp-v sig-script">{{ record()!.signedBy }}</span></div></div> }
            <div class="pp-status" [class.bad]="record()!.status === 'Revoked'"><span class="material-icons">{{ record()!.status === 'Revoked' ? 'block' : 'verified' }}</span>{{ record()!.status === 'Revoked' ? 'Revoked' : 'Verified & authentic' }}</div>
          </div>

          <div class="card share-card">
            <h3 class="card-t"><span class="material-icons">share</span> Share this credential</h3>
            <a class="li-feature" [href]="addToLinkedIn()" target="_blank" rel="noopener">
              <span class="li-logo"><span class="li-in">in</span></span>
              <span class="li-tx"><b>Add to LinkedIn profile</b><small>Showcase it in your Licenses &amp; Certifications</small></span>
              <span class="material-icons li-go">arrow_forward</span>
            </a>
            <span class="share-or">or share a link</span>
            <div class="share-grid">
              <a class="sbtn li" [href]="shareLinkedIn()" target="_blank" rel="noopener"><span class="si">in</span> LinkedIn</a>
              <a class="sbtn x" [href]="shareX()" target="_blank" rel="noopener"><span class="si">𝕏</span> Twitter / X</a>
              <a class="sbtn fb" [href]="shareFacebook()" target="_blank" rel="noopener"><span class="si">f</span> Facebook</a>
              <button class="sbtn copy" (click)="copyLink()"><span class="material-icons">link</span> Copy link</button>
            </div>
          </div>
        </aside>
      </div>

      <!-- ===================== CONTACT ===================== -->
      <section class="card contact">
        <div class="contact-head"><span class="ch-ic"><span class="material-icons">forum</span></span><div><h3>Questions or feedback?</h3><p>Send a message to {{ issuerOrg() }}, the issuing organization.</p></div></div>
        <div class="contact-grid">
          <label class="cf"><span>Name</span><input [value]="cName()" (input)="cName.set($any($event.target).value)" placeholder="Your name" /></label>
          <label class="cf"><span>Email</span><input type="email" [value]="cEmail()" (input)="cEmail.set($any($event.target).value)" placeholder="you@email.com" /></label>
          <label class="cf full"><span>Message</span><textarea rows="3" [value]="cMsg()" (input)="cMsg.set($any($event.target).value)" placeholder="Write a message…"></textarea></label>
        </div>
        <div class="contact-foot">
          <button class="link-btn" (click)="pastConvos()"><span class="material-icons">history</span> View past conversations</button>
          <button class="vbtn primary" (click)="sendMessage()" [disabled]="!contactValid()"><span class="material-icons">send</span> Send message</button>
        </div>
      </section>

      <footer class="vfoot">
        <span><span class="material-icons">lock</span> Secured &amp; verified · {{ record()!.createdAt | date: 'y' }} {{ issuerOrg() }}</span>
        <a href="https://certifada.com" target="_blank" rel="noopener">Powered by Certifada</a>
      </footer>
    }
  </div>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:
      radial-gradient(620px 320px at 100% -2%, color-mix(in srgb,var(--cf-brand-500) 9%,transparent), transparent 60%),
      radial-gradient(560px 300px at 0 26%, color-mix(in srgb,#8b5cf6 7%,transparent), transparent 60%),
      var(--cf-bg, #f6f8fc)}
    .vp{max-width:1080px;margin:0 auto;padding:0 22px 60px}
    .spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}

    .vbar{position:sticky;top:0;z-index:30;-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);background:color-mix(in srgb,var(--cf-surface) 82%,transparent);border-bottom:1px solid var(--cf-line);margin:0 -22px}
    .vbar-in{max-width:1080px;margin:0 auto;padding:11px 22px;display:flex;align-items:center;justify-content:space-between;gap:14px}
    .issuer{display:flex;align-items:center;gap:11px}
    .iss-logo{width:40px;height:40px;border-radius:11px;background:#fff;border:1px solid var(--cf-line);display:grid;place-items:center;overflow:hidden;box-shadow:0 2px 8px -3px rgba(15,23,42,.2)}
    .iss-logo img{width:100%;height:100%;object-fit:contain;padding:3px}.iss-logo .material-icons{color:var(--cf-brand-600)}
    .iss-id strong{display:block;font-size:14.5px;font-weight:800;color:var(--cf-ink-900);letter-spacing:-.01em}
    .iss-id small{font-size:11px;color:var(--cf-ink-500)}
    .powered{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--cf-ink-500);text-decoration:none;border:1px solid var(--cf-line);background:var(--cf-surface);padding:7px 12px;border-radius:999px}
    .powered b{color:var(--cf-brand-700)}.powered .material-icons{font-size:16px;color:var(--cf-brand-600)}

    .vstate{max-width:460px;margin:14vh auto;text-align:center;color:var(--cf-ink-600)}
    .vstate .material-icons{font-size:46px;color:var(--cf-brand-500)}
    .vstate.err .material-icons{color:var(--cf-danger)}
    .vstate h2{font-size:20px;color:var(--cf-ink-900);margin:10px 0 6px}

    /* hero banner (contained, rounded) */
    .hero{position:relative;margin-top:18px;border-radius:20px;overflow:hidden;padding:22px 28px;text-align:start;color:#fff;box-shadow:0 20px 44px -26px color-mix(in srgb,var(--cf-brand-700) 80%,transparent)}
    .hero-bg{position:absolute;inset:0;background:linear-gradient(135deg,var(--cf-brand-600),var(--cf-brand-700) 56%,var(--cf-accent-700) 128%);z-index:0}
    .hero-bg::after{content:'';position:absolute;inset:0;background:radial-gradient(640px 260px at 50% -12%,rgba(255,255,255,.24),transparent 70%),repeating-linear-gradient(45deg,rgba(255,255,255,.05) 0 2px,transparent 2px 24px)}
    .confetti{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:1}
    .confetti i{position:absolute;top:-16px;width:8px;height:13px;border-radius:2px;opacity:0;animation-name:vfall;animation-timing-function:linear;animation-fill-mode:forwards}
    @keyframes vfall{0%{transform:translateY(-14px) rotate(0);opacity:1}100%{transform:translateY(260px) rotate(560deg);opacity:0}}
    .hero-in{position:relative;z-index:2;display:flex;flex-direction:row;align-items:center;gap:22px}
    .hero-tx{display:flex;flex-direction:column;align-items:flex-start;min-width:0}
    .medal{position:relative;flex:none}
    .seal{position:relative;width:66px;height:66px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;box-shadow:0 16px 36px -14px rgba(2,6,23,.5),0 0 0 6px rgba(255,255,255,.18);animation:seal-pop .5s cubic-bezier(.2,1.3,.4,1) both}
    .seal .material-icons{font-size:37px}
    .seal .ring{position:absolute;inset:-9px;border-radius:50%;border:2px solid rgba(255,255,255,.6);animation:ring 2.4s ease-out infinite}
    @keyframes ring{0%{transform:scale(.92);opacity:.7}100%{transform:scale(1.28);opacity:0}}
    @keyframes seal-pop{0%{transform:scale(0)}60%{transform:scale(1.12)}100%{transform:scale(1)}}
    .seal.revoked{background:linear-gradient(135deg,#ef4444,#b91c1c)}
    .rib{position:absolute;top:38px;width:13px;height:36px;background:linear-gradient(180deg,#e7b528,#b8860b);box-shadow:0 4px 8px -4px rgba(0,0,0,.4)}
    .rib::after{content:'';position:absolute;left:0;right:0;bottom:-7px;height:9px;background:inherit;clip-path:polygon(0 0,100% 0,50% 100%)}
    .rib-l{left:17px;transform:rotate(10deg)}.rib-r{right:17px;transform:rotate(-10deg)}
    .vpill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;letter-spacing:.02em;text-transform:uppercase;color:#fff;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);padding:6px 13px;border-radius:999px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
    .vpill .material-icons{font-size:15px}
    .vpill.revoked{background:rgba(255,255,255,.92);color:var(--cf-danger);border-color:transparent}
    .hero h1{font-size:clamp(22px,5.6vw,32px);font-weight:800;letter-spacing:-.03em;margin-top:13px}
    .hero p{font-size:clamp(12.5px,2.6vw,14px);color:rgba(255,255,255,.9);margin-top:5px;max-width:600px;line-height:1.5}
    .hero p strong{font-weight:800}
    .eyebrow{font-size:11px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.72);margin-bottom:3px}
    .hero .big-verified{font-size:clamp(21px,3.1vw,30px);font-weight:800;letter-spacing:-.015em;line-height:1.08;margin-top:1px;background:linear-gradient(100deg,rgba(255,255,255,.8) 26%,#ffffff 43%,#fff7cc 50%,#ffffff 57%,rgba(255,255,255,.8) 74%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;filter:drop-shadow(0 6px 20px rgba(2,6,23,.3));animation:shine 4.2s ease-in-out infinite}
    @keyframes shine{0%{background-position:130% 0}55%,100%{background-position:-30% 0}}
    .hero .big-verified.bad{background:none;-webkit-text-fill-color:#fff;color:#fff;animation:none;filter:none}
    .verified-rule{width:86px;height:3px;border-radius:999px;background:linear-gradient(90deg,#fde68a,#d4a017);margin:10px 0 0;box-shadow:0 0 12px -2px rgba(212,160,23,.6)}
    .verified-rule.bad{background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);box-shadow:none}
    .hero.revoked .hero-bg{background:linear-gradient(135deg,#b91c1c,#7f1d1d)}

    /* showcase grid */
    .showcase{display:grid;grid-template-columns:1.55fr 1fr;gap:22px;margin-top:18px;align-items:start}
    @media(max-width:880px){.showcase{grid-template-columns:1fr}}
    .cert-card{background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:20px;padding:16px;box-shadow:0 24px 54px -30px rgba(2,6,23,.4)}
    .cert-frame{position:relative;border-radius:12px;overflow:hidden;background:var(--cf-surface-2)}
    .cert-frame img{width:100%;display:block}
    .cert-ph{aspect-ratio:1.41/1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--cf-ink-300)}
    .cert-ph .material-icons{font-size:48px}
    .cert-sheen{position:absolute;inset:0;background:linear-gradient(115deg,transparent 32%,rgba(255,255,255,.5) 48%,transparent 64%);transform:translateX(-130%);animation:csheen 5s ease-in-out 1.2s infinite;pointer-events:none;z-index:1}
    @keyframes csheen{0%{transform:translateX(-130%)}20%,100%{transform:translateX(130%)}}
    .cert-emboss{position:absolute;bottom:14px;inset-inline-end:14px;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 35% 30%,#fde68a,#d4a017);color:#7c5e10;box-shadow:0 6px 16px -6px rgba(180,120,20,.7),inset 0 0 0 2px rgba(255,255,255,.4);z-index:2}
    .cert-emboss .material-icons{font-size:23px}
    .cert-toolbar{display:flex;gap:9px;margin-top:14px}
    .trust{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}
    .tb{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--cf-ink-600);background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:999px;padding:7px 13px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .tb .material-icons{font-size:15px;color:#16a34a}

    .vbtn{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:44px;padding:0 15px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-800);font:inherit;font-size:13.5px;font-weight:700;border-radius:12px;cursor:pointer;transition:background .14s,border-color .14s,transform .12s,box-shadow .16s}
    .vbtn:hover{background:var(--cf-surface-2);transform:translateY(-1px)}.vbtn:active{transform:scale(.97)}.vbtn .material-icons{font-size:18px}
    .vbtn.primary{flex:1;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;border-color:transparent;box-shadow:0 12px 24px -10px color-mix(in srgb,var(--cf-brand-600) 85%,transparent)}
    .vbtn.primary:hover{filter:brightness(1.05)}.vbtn.ghost{background:none}.vbtn:disabled{opacity:.5;cursor:not-allowed;transform:none}

    /* sticky passport sidebar */
    .show-side{position:sticky;top:78px;display:flex;flex-direction:column;gap:16px}
    @media(max-width:880px){.show-side{position:static}}
    .card{background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:16px;padding:18px;box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .card-t{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:var(--cf-ink-900);margin-bottom:14px;text-transform:uppercase;letter-spacing:.03em}
    .card-t .material-icons{font-size:17px;color:var(--cf-brand-600)}
    .pp-recip{display:flex;align-items:center;gap:12px;padding-bottom:14px;margin-bottom:12px;border-bottom:1px solid var(--cf-line)}
    .pp-av{width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;display:grid;place-items:center;font-size:15px;font-weight:800;flex:none;box-shadow:0 6px 14px -6px color-mix(in srgb,var(--cf-brand-600) 70%,transparent)}
    .pp-rtx{display:flex;flex-direction:column;min-width:0}
    .pp-name{font-size:15px;font-weight:800;color:var(--cf-ink-900);letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .pp-mail{font-size:12px;color:var(--cf-ink-500);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .pp-item{display:flex;align-items:center;gap:11px;padding:9px 0}
    .pp-ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--cf-surface-2);border:1px solid var(--cf-line);color:var(--cf-brand-600);flex:none;overflow:hidden}
    .pp-ic.alt{color:var(--cf-ink-500)}
    .pp-ic .material-icons{font-size:17px}.pp-ic img{width:100%;height:100%;object-fit:contain;background:#fff}
    .pp-l{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-400)}
    .pp-v{display:block;font-size:13.5px;font-weight:700;color:var(--cf-ink-900);margin-top:1px}
    .pp-v.id{display:flex;align-items:center;gap:6px}
    .pp-v.sig-script{font-family:'Brush Script MT','Segoe Script',cursive;font-size:19px;color:var(--cf-brand-700);font-weight:400}
    .pp-v.id code{font-family:'Courier New',monospace;font-size:11px;background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:5px;padding:1px 6px;max-width:120px;overflow:hidden;text-overflow:ellipsis}
    .mini-copy{width:22px;height:22px;border:1px solid var(--cf-line);border-radius:6px;background:var(--cf-surface);color:var(--cf-ink-500);display:grid;place-items:center;cursor:pointer;flex:none}
    .mini-copy:hover{color:var(--cf-brand-700)}.mini-copy .material-icons{font-size:12px}
    .pp-status{display:flex;align-items:center;gap:8px;margin-top:14px;padding:11px 13px;border-radius:11px;font-size:13px;font-weight:700;color:#15803d;background:color-mix(in srgb,#16a34a 11%,transparent);border:1px solid color-mix(in srgb,#16a34a 26%,transparent)}
    .pp-status .material-icons{font-size:18px}
    .pp-status.bad{color:var(--cf-danger);background:var(--cf-danger-soft);border-color:color-mix(in srgb,var(--cf-danger) 26%,transparent)}

    .share-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
    .sbtn{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 13px;border:1px solid var(--cf-line);border-radius:12px;background:var(--cf-surface);color:var(--cf-ink-800);font-size:13px;font-weight:700;text-decoration:none;transition:transform .12s,box-shadow .16s}
    .sbtn:hover{transform:translateY(-2px);box-shadow:0 10px 22px -12px rgba(15,23,42,.5)}
    .sbtn .si{width:23px;height:23px;border-radius:7px;display:grid;place-items:center;font-size:12px;font-weight:800;color:#fff;flex:none}
    .sbtn.li .si{background:#0a66c2}.sbtn.x .si{background:#000}.sbtn.fb .si{background:#1877f2}
    .sbtn.copy{color:var(--cf-ink-700);background:var(--cf-surface);cursor:pointer}
    .sbtn.copy .material-icons{font-size:17px;color:var(--cf-ink-400)}
    .sbtn.copy:hover .material-icons{color:var(--cf-brand-600)}
    .li-feature{display:flex;align-items:center;gap:13px;text-decoration:none;border:1px solid color-mix(in srgb,#0a66c2 30%,var(--cf-line));background:linear-gradient(135deg,color-mix(in srgb,#0a66c2 10%,var(--cf-surface)),var(--cf-surface) 72%);border-radius:13px;padding:13px 14px;margin-bottom:13px;transition:border-color .15s,box-shadow .16s,transform .12s}
    .li-feature:hover{transform:translateY(-2px);box-shadow:0 16px 32px -16px color-mix(in srgb,#0a66c2 60%,transparent);border-color:#0a66c2}
    .li-logo{width:44px;height:44px;border-radius:11px;background:#0a66c2;display:grid;place-items:center;flex:none;box-shadow:0 6px 14px -6px rgba(10,102,194,.6)}
    .li-in{color:#fff;font-weight:800;font-size:20px;font-family:Georgia,"Times New Roman",serif;line-height:1}
    .li-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
    .li-tx b{font-size:13.5px;font-weight:800;color:var(--cf-ink-900)}
    .li-tx small{font-size:11.5px;color:var(--cf-ink-500);line-height:1.4}
    .li-go{font-size:18px;color:#0a66c2;flex:none;transition:transform .15s}
    .li-feature:hover .li-go{transform:translateX(3px)}
    .share-or{display:block;position:relative;text-align:center;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--cf-ink-400);margin:0 0 12px}
    .share-or::before,.share-or::after{content:"";position:absolute;top:50%;width:26%;height:1px;background:var(--cf-line)}
    .share-or::before{inset-inline-start:0}.share-or::after{inset-inline-end:0}

    .contact{margin-top:20px}
    .contact-head{display:flex;align-items:center;gap:13px;margin-bottom:16px}
    .ch-ic{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;background:color-mix(in srgb,var(--cf-brand-500) 12%,transparent);color:var(--cf-brand-600);flex:none}
    .ch-ic .material-icons{font-size:22px}
    .contact-head h3{font-size:16px;font-weight:800;color:var(--cf-ink-900)}
    .contact-head p{font-size:13px;color:var(--cf-ink-500);margin-top:2px}
    .contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}
    .cf{display:flex;flex-direction:column;gap:6px}.cf.full{grid-column:1 / -1}
    .cf span{font-size:12px;font-weight:700;color:var(--cf-ink-600)}
    .cf input,.cf textarea{border:1px solid var(--cf-line);border-radius:10px;padding:10px 12px;font:inherit;font-size:13.5px;background:var(--cf-surface);color:var(--cf-ink-900);outline:none;transition:border-color .14s,box-shadow .14s;resize:vertical}
    .cf input:focus,.cf textarea:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .contact-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:15px;flex-wrap:wrap}
    .link-btn{display:inline-flex;align-items:center;gap:6px;border:0;background:none;color:var(--cf-brand-600);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
    .link-btn:hover{text-decoration:underline}.link-btn .material-icons{font-size:16px}
    .contact-foot .vbtn{flex:none;min-width:170px}

    .vfoot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:26px;padding-top:18px;border-top:1px solid var(--cf-line);font-size:12px;color:var(--cf-ink-400);flex-wrap:wrap}
    .vfoot span{display:inline-flex;align-items:center;gap:6px}.vfoot .material-icons{font-size:14px}
    .vfoot a{color:var(--cf-brand-600);text-decoration:none;font-weight:600}
    .powered .pw-txt{display:inline}
    @media(max-width:768px){
      .vp{padding:0 16px 48px}
      .vbar{margin:0 -16px}
      .vbar-in{padding:10px 16px}
      .hero{padding:32px 18px 30px;border-radius:20px;margin-top:16px}
      .seal{width:78px;height:78px}.seal .material-icons{font-size:42px}
      .rib{top:44px;height:42px}
      .showcase{gap:16px;margin-top:16px}
      .cert-card{padding:12px;border-radius:16px}
      .card{padding:16px}
      .contact{margin-top:16px}
      .contact-grid{grid-template-columns:1fr}
    }
    @media(max-width:480px){
      .vp{padding:0 12px 40px}
      .vbar{margin:0 -12px}.vbar-in{padding:9px 12px;gap:8px}
      .iss-logo{width:36px;height:36px}
      .iss-id strong{font-size:13.5px;max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .iss-id small{display:none}
      .powered .pw-txt{display:none}
      .powered{padding:8px}.powered .material-icons{font-size:19px}
      .hero{padding:26px 14px 24px}
      .vpill{font-size:11px;padding:5px 11px}
      .cert-toolbar{flex-wrap:wrap}
      .vbtn{height:42px}
      .vbtn.primary{flex:1 1 100%}
      .trust{gap:7px}.tb{font-size:11px;padding:6px 10px}
      .share-grid{gap:8px}
      .contact-foot{flex-direction:column-reverse;align-items:stretch}
      .contact-foot .vbtn{width:100%;min-width:0}
      .link-btn{justify-content:center}
      .vfoot{flex-direction:column;align-items:center;text-align:center;gap:8px}
      .pp-v.id code{max-width:200px}
    }
    @media(max-width:600px){
      .hero{padding:24px 18px;text-align:center}
      .hero-in{flex-direction:column;gap:13px}
      .hero-tx{align-items:center}
      .verified-rule{margin-left:auto;margin-right:auto}
    }
    @media(max-width:380px){
      .share-grid{grid-template-columns:1fr}
    }
  `],
})
export class VerifyComponent {
  private route = inject(ActivatedRoute);
  private templates = inject(TemplateService);
  private issued = inject(IssuedService);
  private alerts = inject(AlertService);
  private brandSvc = inject(BrandService);

  id = this.route.snapshot.paramMap.get('id') || '';
  loading = signal(true);
  record = signal<IssuedRecord | null>(null);
  art = signal('');
  readonly confetti = Array.from({ length: 18 }, (_, i) => ({ left: Math.round(((i + 0.5) / 18) * 100), delay: (i % 9) * 0.12, dur: 2.4 + (i % 5) * 0.4, color: ['#ffffff', '#fde68a', '#fff3c4', '#d4a017', 'rgba(255,255,255,.75)'][i % 5] }));
  verifyUrl = '';

  cName = signal('');
  cEmail = signal('');
  cMsg = signal('');
  contactValid = computed(() => this.cName().trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.cEmail().trim()) && this.cMsg().trim().length > 2);
  fields = computed(() => { const r = this.record(); return r ? Object.entries(r.data).map(([k, v]) => ({ k: this.pretty(k), v })) : []; });

  constructor() {
    this.issued.syncFromApi();
    this.verifyUrl = this.buildVerifyUrl();
    const primary = this.brand().primary || (this.brand().colors || [])[0];
    if (primary) this.brandSvc.themeFrom(primary, this.brand().colors);
    const org = this.issuerOrg();
    document.title = `Verified Credential${org && org !== 'the issuing organization' ? ' · ' + org : ' · Certifada'}`;
    setTimeout(() => this.load(), 10);
  }

  private brand(): any { try { return JSON.parse(localStorage.getItem('cf-brand') || '{}') || {}; } catch { return {}; } }
  private onboarding(): any { try { return JSON.parse(localStorage.getItem('cf-onboarding') || '{}') || {}; } catch { return {}; } }
  issuerOrg(): string { return (this.brand().org || this.onboarding().company || '').trim() || 'the issuing organization'; }
  issuerLogo(): string { return this.brand().logo || ''; }
  recipInitials(): string { const r = this.record(); const b = (r?.recipientName || r?.recipientEmail || '?').trim(); const p = b.split(/[\s@._-]+/).filter(Boolean); return (((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase()) || b.charAt(0).toUpperCase(); }

  private buildVerifyUrl(): string {
    const loc = window.location;
    const domain = (this.onboarding().domain || '').trim();
    const port = loc.port ? ':' + loc.port : '';
    if (domain) {
      const h = loc.hostname;
      let base = '';
      if (h === 'localhost' || h.endsWith('.localhost')) base = 'localhost';
      else if (h.endsWith('certifada.com')) base = 'certifada.com';
      if (base) return `${loc.protocol}//${domain}.${base}${port}/verify/${this.id}`;
    }
    return `${loc.origin}/verify/${this.id}`;
  }

  private load(): void {
    const rec = this.issued.records().find((r) => r.id === this.id) || null;
    this.record.set(rec);
    this.loading.set(false);
    if (!rec) return;
    if (rec.fileDataUrl) this.art.set(rec.fileDataUrl);
    this.templates.get(rec.templateId).subscribe({
      next: async (t) => {
        try {
          if (t?.canvasJson) {
            const json = mergeDataIntoJson(t.canvasJson, rec.data);
            const pend = rec.status === 'Pending';   // awaiting approval -> show the Pending Approval stamp
            this.art.set(await renderJsonToPng(json, t.width, t.height, 2, pend ? null : localStorage.getItem('cf-signature'), pend));
          } else if (t?.thumbnailDataUrl && !this.art()) { this.art.set(t.thumbnailDataUrl); }
        } catch { /* keep fallback */ }
      },
      error: () => {
        if (this.art()) return;
        try { const c = JSON.parse(localStorage.getItem('cf-tpl-cache') || '[]'); const hit = Array.isArray(c) ? c.find((x: any) => x.id === rec.templateId) : null; if (hit?.thumbnailDataUrl) this.art.set(hit.thumbnailDataUrl); } catch { /* ignore */ }
      },
    });
  }

  pretty(k: string): string { return k.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }

  async downloadPng(): Promise<void> {
    if (!this.art()) { this.alerts.info('Certificate image is not available to download.'); return; }
    const a = document.createElement('a'); a.href = this.art(); a.download = this.fileName('png'); a.click();
  }
  async downloadPdf(): Promise<void> {
    if (!this.art()) { this.alerts.info('Certificate image is not available to download.'); return; }
    const img = new Image(); img.src = this.art();
    try { await img.decode(); } catch { /* ignore */ }
    const w = img.naturalWidth || 1123, h = img.naturalHeight || 794;
    const doc = new jsPDF({ orientation: w >= h ? 'landscape' : 'portrait', unit: 'px', format: [w, h], compress: true });
    doc.addImage(this.art(), 'PNG', 0, 0, w, h);
    doc.save(this.fileName('pdf'));
  }
  private fileName(ext: string): string { return `${(this.record()?.recipientName || 'certificate').replace(/[^a-z0-9]+/gi, '-')}-credential.${ext}`; }

  private enc(): string { return encodeURIComponent(this.verifyUrl); }
  copyLink(): void { this.copy(location.href, 'Verification link'); }
  shareLinkedIn(): string { return `https://www.linkedin.com/sharing/share-offsite/?url=${this.enc()}`; }
  shareX(): string { return `https://twitter.com/intent/tweet?text=${encodeURIComponent('I earned a verified credential from ' + this.issuerOrg() + '!')}&url=${this.enc()}`; }
  shareFacebook(): string { return `https://www.facebook.com/sharer/sharer.php?u=${this.enc()}`; }
  addToLinkedIn(): string {
    const r = this.record();
    const y = r ? new Date(r.createdAt).getFullYear() : new Date().getFullYear();
    const m = r ? new Date(r.createdAt).getMonth() + 1 : 1;
    return `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(r?.templateName || 'Certificate')}&organizationName=${encodeURIComponent(this.issuerOrg())}&issueYear=${y}&issueMonth=${m}&certId=${encodeURIComponent(this.id)}&certUrl=${this.enc()}`;
  }
  copy(text: string, label: string): void {
    try { navigator.clipboard?.writeText(text); this.alerts.success(`${label} copied to clipboard.`); }
    catch { this.alerts.info(text); }
  }

  sendMessage(): void {
    if (!this.contactValid()) return;
    this.alerts.success(`Your message was sent to ${this.issuerOrg()}.`, { title: 'Message sent' });
    this.cName.set(''); this.cEmail.set(''); this.cMsg.set('');
  }
  pastConvos(): void { this.alerts.info('You have no past conversations with this issuer yet.'); }
}

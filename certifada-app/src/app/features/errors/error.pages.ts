import { Component, Directive, ElementRef, HostListener, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Shared pointer-parallax + reference code for the error scenes. */
@Directive()
abstract class ErrorBase {
  protected host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly ref = Math.random().toString(36).slice(2, 8).toUpperCase();
  protected abstract code: string;
  @HostListener('pointermove', ['$event']) pm(e: PointerEvent): void {
    const el = this.host.nativeElement, r = el.getBoundingClientRect();
    el.style.setProperty('--px', (((e.clientX - r.left) / r.width) - 0.5).toFixed(3));
    el.style.setProperty('--py', (((e.clientY - r.top) / r.height) - 0.5).toFixed(3));
  }
  @HostListener('pointerleave') pl(): void {
    this.host.nativeElement.style.setProperty('--px', '0');
    this.host.nativeElement.style.setProperty('--py', '0');
  }
}

const SHARED = `
  :host{display:block;min-height:100dvh;position:relative;overflow:hidden;display:grid;place-items:center;padding:44px 28px;background:var(--cf-surface-2)}

  .bg{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;
    transform:translate(calc(var(--px,0)*-10px),calc(var(--py,0)*-10px));transition:transform .5s cubic-bezier(.2,.8,.3,1)}
  .glow{position:absolute;border-radius:50%;filter:blur(84px)}
  .g1{width:64vmax;height:48vmax;left:50%;margin-left:-32vmax;top:-28%;opacity:.2;
    background:radial-gradient(closest-side,color-mix(in srgb,var(--cf-brand-500) 72%,transparent),transparent);animation:breathe1 17s ease-in-out infinite}
  .g2{width:42vmax;height:42vmax;right:-12%;bottom:-24%;opacity:.12;
    background:radial-gradient(closest-side,#e6bd49,transparent);animation:breathe2 22s ease-in-out infinite}
  @keyframes breathe1{0%,100%{transform:scale(1);opacity:.15}50%{transform:scale(1.06);opacity:.24}}
  @keyframes breathe2{0%,100%{transform:scale(1);opacity:.08}50%{transform:scale(1.07);opacity:.15}}
  .grid{position:absolute;inset:-2px;opacity:.5;
    background-image:linear-gradient(to right,var(--cf-line) 1px,transparent 1px),linear-gradient(to bottom,var(--cf-line) 1px,transparent 1px);
    background-size:48px 48px;
    -webkit-mask-image:radial-gradient(120% 95% at 50% 40%,#000 32%,transparent 82%);mask-image:radial-gradient(120% 95% at 50% 40%,#000 32%,transparent 82%)}
  .grain{position:absolute;inset:0;opacity:.04;background-size:150px 150px;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
  .vignette{position:absolute;inset:0;z-index:1;pointer-events:none;
    background:radial-gradient(135% 105% at 50% 30%,transparent 56%,color-mix(in srgb,var(--cf-ink-900) 8%,transparent))}

  .wrap{position:relative;z-index:2;max-width:560px;width:100%;display:flex;flex-direction:column;align-items:center;text-align:center;
    animation:rise .6s cubic-bezier(.2,.85,.3,1) both}
  @keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
  .scene{width:100%;max-width:420px;height:auto;display:block;margin:0 auto 22px;overflow:visible;
    transform:translate(calc(var(--px,0)*16px),calc(var(--py,0)*16px));transition:transform .3s cubic-bezier(.2,.8,.3,1);
    filter:drop-shadow(0 28px 48px rgba(2,6,23,.18))}

  .s-card{transform-box:fill-box;transform-origin:center;animation:float 7.5s ease-in-out infinite}
  @keyframes float{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-9px) rotate(-3.4deg)}}
  .s-halo{transform-box:fill-box;transform-origin:center;animation:halo 3.6s ease-in-out infinite}
  @keyframes halo{0%,100%{opacity:.45;transform:scale(.9)}50%{opacity:.85;transform:scale(1.16)}}
  .s-beam{transform-box:fill-box;animation:beam 3.8s cubic-bezier(.5,0,.5,1) infinite}
  @keyframes beam{0%{transform:translateX(-30px);opacity:0}16%{opacity:1}84%{opacity:1}100%{transform:translateX(248px);opacity:0}}
  .s-mag{transform-box:fill-box;transform-origin:center;animation:scan 7s ease-in-out infinite}
  @keyframes scan{0%,100%{transform:translate(0,0) rotate(0)}30%{transform:translate(-15px,12px) rotate(-6deg)}65%{transform:translate(10px,-6px) rotate(5deg)}}
  .s-lock{transform-box:fill-box;transform-origin:center;animation:bob 5.4s ease-in-out infinite}
  @keyframes bob{0%,100%{transform:translateY(0) rotate(4deg)}50%{transform:translateY(-7px) rotate(6deg)}}
  .s-stamp{transform-box:fill-box;transform-origin:center;animation:stamp 5s ease-in-out infinite}
  @keyframes stamp{0%{transform:rotate(-13deg) scale(.97);opacity:0}10%{opacity:1}16%{transform:rotate(-13deg) scale(1.1)}24%{transform:rotate(-13deg) scale(1)}100%{transform:rotate(-13deg) scale(1);opacity:1}}
  .s-ghost{animation:ghost 8s ease-in-out infinite}
  @keyframes ghost{0%,100%{opacity:.07}50%{opacity:.13}}
  .spark{transform-box:fill-box;transform-origin:center;animation:twinkle 3.2s ease-in-out infinite}
  .spark.b{animation-delay:.7s}.spark.c{animation-delay:1.4s}.spark.d{animation-delay:2s}
  @keyframes twinkle{0%,100%{opacity:.2;transform:scale(.55)}50%{opacity:.9;transform:scale(1.1)}}

  .eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;
    color:var(--cf-brand-600);padding:6px 8px 6px 13px;border-radius:999px;background:color-mix(in srgb,var(--cf-brand-500) 9%,transparent);
    border:1px solid color-mix(in srgb,var(--cf-brand-500) 22%,transparent);margin-bottom:18px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}
  .eyebrow .material-icons{font-size:14px}
  .eyebrow .ref{font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:10.5px;letter-spacing:.04em;color:var(--cf-ink-500);
    background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:999px;padding:2px 8px}
  h1{font-size:34px;font-weight:800;letter-spacing:-.03em;line-height:1.1;color:var(--cf-ink-900);margin:0 0 13px}
  p{font-size:14.5px;line-height:1.7;color:var(--cf-ink-500);margin:0 auto 26px;max-width:434px}
  .acts{display:flex;gap:11px;justify-content:center;flex-wrap:wrap}
  .cf-btn{display:inline-flex;align-items:center;gap:7px}.cf-btn .material-icons{font-size:18px}

  .divider{height:1px;width:100%;max-width:300px;background:linear-gradient(90deg,transparent,var(--cf-line),transparent);margin:30px auto 16px}
  .foot{font-size:12.5px;color:var(--cf-ink-500);display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:center}
  .foot a{color:var(--cf-brand-600);font-weight:700;text-decoration:none}.foot a:hover{text-decoration:underline}
  .foot .dot{opacity:.5}
  .foot code{font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:11.5px;color:var(--cf-ink-400)}

  @media(max-width:560px){.scene{max-width:330px}h1{font-size:27px}}
  @media(prefers-reduced-motion:reduce){.bg,.scene{transform:none}
    .g1,.g2,.s-card,.s-halo,.s-beam,.s-mag,.s-lock,.s-stamp,.s-ghost,.spark{animation:none}}
`;

const DEFS = `
  <defs>
    <linearGradient id="bgg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#4338ca"/></linearGradient>
    <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0d27a"/><stop offset="1" stop-color="#bd902a"/></linearGradient>
    <linearGradient id="beamG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
    <radialGradient id="halo"><stop offset="0" stop-color="#818cf8" stop-opacity="0.8"/><stop offset="1" stop-color="#818cf8" stop-opacity="0"/></radialGradient>
    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>
    <clipPath id="cc"><rect x="146" y="84" width="196" height="156" rx="14"/></clipPath>
  </defs>`;

const SPARKS = `
  <g>
    <path class="spark"   d="M88 92 l5.5 12 12 5.5 -12 5.5 -5.5 12 -5.5 -12 -12 -5.5 12 -5.5z" fill="url(#gg)"/>
    <circle class="spark b" cx="428" cy="226" r="5.5" fill="#6366f1"/>
    <circle class="spark c" cx="56" cy="244" r="6" fill="url(#gg)"/>
    <path class="spark d" d="M250 34 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" fill="#a5b4fc"/>
  </g>`;

const CARD = `
  <g class="s-card">
    <circle class="s-halo" cx="183" cy="214" r="32" fill="url(#halo)" filter="url(#soft)"/>
    <rect x="146" y="84" width="196" height="156" rx="14" fill="#ffffff" stroke="#e5e7eb" stroke-width="1.5"/>
    <rect x="146" y="84" width="196" height="9" rx="4.5" fill="url(#bgg)"/>
    <text x="168" y="121" font-family="Inter,Arial,sans-serif" font-weight="800" font-size="9" letter-spacing="2.6" fill="#94a3b8">CERTIFICATE</text>
    <rect x="168" y="131" width="150" height="22" rx="5" fill="none" stroke="#a5b4fc" stroke-width="1.6" stroke-dasharray="6 5"/>
    <rect x="168" y="169" width="150" height="6" rx="3" fill="#eef1f6"/>
    <rect x="168" y="182" width="112" height="6" rx="3" fill="#eef1f6"/>
    <circle cx="183" cy="214" r="15" fill="url(#gg)" stroke="#ffffff" stroke-width="2"/>
    <path d="M183 205 l2.3 4.7 5.2 .6 -3.8 3.7 .9 5.2 -4.6 -2.5 -4.6 2.5 .9 -5.2 -3.8 -3.7 5.2 -.6z" fill="#ffffff" opacity=".92"/>
    <rect x="210" y="206" width="104" height="6" rx="3" fill="#eef1f6"/>
    <rect x="210" y="219" width="74" height="6" rx="3" fill="#eef1f6"/>
    <g clip-path="url(#cc)"><rect class="s-beam" x="120" y="84" width="60" height="156" fill="url(#beamG)"/></g>
  </g>`;

const BG = `
  <div class="bg" aria-hidden="true">
    <span class="glow g1"></span>
    <span class="glow g2"></span>
    <span class="grid"></span>
    <span class="grain"></span>
    <span class="vignette"></span>
  </div>`;

/** 404 — wildcard route. */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
  ${BG}
  <div class="wrap">
    <svg class="scene" viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="404 — page not found">
      ${DEFS}
      <text class="s-ghost" x="240" y="206" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="190" fill="#4338ca">404</text>
      ${SPARKS}
      ${CARD}
      <g class="s-stamp">
        <rect x="156" y="150" width="176" height="44" rx="9" fill="none" stroke="#dc2626" stroke-width="3" stroke-dasharray="9 6"/>
        <text x="244" y="180" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="22" letter-spacing="1.5" fill="#dc2626">NOT FOUND</text>
      </g>
      <g class="s-mag">
        <circle cx="340" cy="112" r="33" fill="rgba(99,102,241,.12)" filter="url(#soft)"/>
        <circle cx="340" cy="112" r="31" fill="rgba(255,255,255,.55)" stroke="url(#bgg)" stroke-width="6"/>
        <circle cx="340" cy="112" r="31" fill="none" stroke="#ffffff" stroke-width="1.5"/>
        <line x1="362" y1="134" x2="389" y2="161" stroke="url(#bgg)" stroke-width="9" stroke-linecap="round"/>
        <path d="M328 104 a16 16 0 0 1 13 -7" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".85"/>
      </g>
    </svg>
    <span class="eyebrow"><span class="material-icons">search_off</span> Error 404 <span class="ref">REF&nbsp;{{ code }}-{{ ref }}</span></span>
    <h1>This page could not be found</h1>
    <p>The page or credential you're looking for doesn't exist, may have moved, or the link is broken. Head back to your dashboard to continue.</p>
    <div class="acts">
      <a class="cf-btn cf-btn-primary" routerLink="/app/dashboard"><span class="material-icons">dashboard</span> Go to dashboard</a>
      <a class="cf-btn cf-btn-secondary" routerLink="/"><span class="material-icons">home</span> Back to home</a>
    </div>
    <div class="divider"></div>
    <div class="foot"><span>Still stuck?</span> <a routerLink="/app/support">Contact support</a> <span class="dot">·</span> <span>Reference</span> <code>{{ code }}-{{ ref }}</code></div>
  </div>`,
  styles: [SHARED],
})
export class NotFoundPage extends ErrorBase { protected code = '404'; }

/** 403 — authenticated user whose role lacks access. */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
  ${BG}
  <div class="wrap">
    <svg class="scene" viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="403 — access restricted">
      ${DEFS}
      <text class="s-ghost" x="240" y="206" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="190" fill="#4338ca">403</text>
      ${SPARKS}
      ${CARD}
      <g class="s-stamp">
        <rect x="160" y="150" width="168" height="44" rx="9" fill="none" stroke="#d97706" stroke-width="3" stroke-dasharray="9 6"/>
        <text x="244" y="180" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="20" letter-spacing="1.5" fill="#b45309">RESTRICTED</text>
      </g>
      <g class="s-lock">
        <rect x="306" y="116" width="66" height="52" rx="13" fill="rgba(99,102,241,.12)" filter="url(#soft)"/>
        <rect x="308" y="118" width="62" height="50" rx="12" fill="#ffffff" stroke="url(#bgg)" stroke-width="6"/>
        <path d="M320 118 v-9 a19 19 0 0 1 38 0 v9" fill="none" stroke="url(#bgg)" stroke-width="6"/>
        <circle cx="339" cy="139" r="7" fill="#4338ca"/>
        <rect x="336" y="143" width="6" height="14" rx="3" fill="#4338ca"/>
      </g>
    </svg>
    <span class="eyebrow"><span class="material-icons">shield_person</span> Error 403 <span class="ref">REF&nbsp;{{ code }}-{{ ref }}</span></span>
    <h1>You don't have access to this page</h1>
    <p>Your role doesn't include permission for this area. If you believe this is a mistake, contact your workspace administrator to update your access.</p>
    <div class="acts">
      <a class="cf-btn cf-btn-primary" routerLink="/app/dashboard"><span class="material-icons">dashboard</span> Go to dashboard</a>
      <a class="cf-btn cf-btn-secondary" routerLink="/app/support"><span class="material-icons">support_agent</span> Request access</a>
    </div>
    <div class="divider"></div>
    <div class="foot"><span>Need this access?</span> <a routerLink="/app/support">Ask your administrator</a> <span class="dot">·</span> <span>Reference</span> <code>{{ code }}-{{ ref }}</code></div>
  </div>`,
  styles: [SHARED],
})
export class ForbiddenPage extends ErrorBase { protected code = '403'; }

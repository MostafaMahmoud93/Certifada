import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { ServiceResponse, TokenModel } from '../../../core/models/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslocoModule],
  template: `
  <div class="lg">
    <div class="brand">
      <div class="aurora ba1"></div><div class="aurora ba2"></div><div class="dots"></div>
      <a class="top" routerLink="/"><span class="mark"><span class="material-icons">workspace_premium</span></span><span class="bn">Certifada</span></a>
      <div class="cert-mini" aria-hidden="true">
        <div class="cm-in">
          <div class="cm-top"><span class="material-icons">workspace_premium</span><i></i></div>
          <div class="cm-name">Sarah Al Mansouri</div>
          <div class="cm-line"></div><div class="cm-line short"></div>
          <div class="cm-foot"><span class="cm-seal"></span><span class="cm-qr"></span></div>
          <div class="cm-stamp"><span class="material-icons">verified</span></div>
        </div>
      </div>
      <div class="body">
        <h2>{{ 'auth.brandHeadline' | transloco }}</h2>
        <p>{{ 'auth.brandSub' | transloco }}</p>
      </div>
    </div>
    <div class="form">
      <div class="inner">
        @switch (magic()) {
        @case ('off') {
        <h1>{{ 'auth.welcome' | transloco }}</h1>
        <p class="sub">{{ 'auth.signinSub' | transloco }}</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="lbl">{{ 'auth.email' | transloco }}</label>
          <div class="inwrap"><span class="material-icons lead">mail</span>
            <input class="in" type="email" formControlName="email" placeholder="you@company.com" /></div>

          <label class="lbl">{{ 'auth.password' | transloco }}</label>
          <div class="inwrap"><span class="material-icons lead">lock</span>
            <input class="in" [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="••••••••" />
            <button type="button" class="trail" (click)="showPassword.set(!showPassword())">
              <span class="material-icons">{{ showPassword() ? 'visibility_off' : 'visibility' }}</span></button></div>

          <div class="row">
            <span class="chk-wrap">
              <label class="chk"><input type="checkbox" formControlName="remember" /> {{ 'auth.remember' | transloco }}</label>
              <span class="rm-tip" tabindex="0" role="button" [attr.aria-label]="'auth.rememberTipTitle' | transloco">
                <span class="material-icons rm-i">info</span>
                <span class="rm-bubble">
                  <span class="rm-head">
                    <span class="rm-badge"><span class="material-icons">verified_user</span></span>
                    <b>{{ 'auth.rememberTipTitle' | transloco }}</b>
                    <i class="rm-days">30&nbsp;{{ 'auth.rememberDays' | transloco }}</i>
                  </span>
                  <span class="rm-body">{{ 'auth.rememberTip' | transloco }}</span>
                  <span class="rm-note"><span class="material-icons">lock_clock</span>{{ 'auth.rememberTipNote' | transloco }}</span>
                </span>
              </span>
            </span>
            <a routerLink="/auth/forgot">{{ 'auth.forgot' | transloco }}</a>
          </div>

          @if (error()) { <div class="err">{{ error() }}</div> }
          <button type="submit" class="primary" [disabled]="form.invalid || loading()">{{ loading() ? ('auth.signingIn' | transloco) : ('auth.signin' | transloco) }}</button>
        </form>

        <button type="button" class="magicbtn" (click)="startMagic()">
          <span class="mg-spark">✨</span>{{ 'auth.magicBtn' | transloco }}<span class="material-icons mg-arrow">arrow_forward</span>
        </button>

        <div class="div">{{ 'auth.continueWith' | transloco }}</div>
        <div class="socials">
          <button class="soc" (click)="google()" aria-label="Google">
            <svg viewBox="0 0 24 24" width="19" height="19"><path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A11.99 11.99 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.29a12 12 0 0 0 0 10.76l4-3.1z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.97 11.97 0 0 0 1.29 7.62l4 3.1C6.23 6.88 8.88 4.77 12 4.77z"/></svg>
          </button>
          <button class="soc" (click)="facebook()" aria-label="Facebook">
            <svg viewBox="0 0 24 24" width="19" height="19"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12z"/></svg>
          </button>
          <button class="soc" (click)="microsoft()" aria-label="Microsoft">
            <svg viewBox="0 0 24 24" width="17" height="17"><path fill="#F25022" d="M1 1h10.5v10.5H1z"/><path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z"/><path fill="#00A4EF" d="M1 12.5h10.5V23H1z"/><path fill="#FFB900" d="M12.5 12.5H23V23H12.5z"/></svg>
          </button>
        </div>
        <p class="alt">{{ 'auth.noAccount' | transloco }} <a routerLink="/auth/register">{{ 'auth.createAccount' | transloco }}</a></p>
        }
        @case ('form') {
        <div class="magic-pane">
          <button type="button" class="mg-back" (click)="backToLogin()"><span class="material-icons">arrow_back</span>{{ 'auth.magicBack' | transloco }}</button>
          <div class="mg-hero"><span>✨</span></div>
          <h1 class="mg-t">{{ 'auth.magicTitle' | transloco }}</h1>
          <p class="sub">{{ 'auth.magicDesc' | transloco }}</p>
          <label class="lbl">{{ 'auth.email' | transloco }}</label>
          <div class="inwrap"><span class="material-icons lead">mail</span>
            <input class="in" type="email" [formControl]="magicCtrl" placeholder="you@company.com" (keyup.enter)="sendMagic()" /></div>
          @if (error()) { <div class="err">{{ error() }}</div> }
          <button type="button" class="primary mg-send" [disabled]="magicCtrl.invalid || magicLoading()" (click)="sendMagic()">
            {{ magicLoading() ? ('auth.magicSending' | transloco) : ('auth.magicSend' | transloco) }} ✨
          </button>
        </div>
        }
        @case ('sent') {
        <div class="magic-pane sent">
          <div class="mg-mail">
            <span class="material-icons">mark_email_read</span>
            <i class="sp s1">✦</i><i class="sp s2">✦</i><i class="sp s3">✦</i>
          </div>
          <h1 class="mg-t">{{ 'auth.magicSentTitle' | transloco }}</h1>
          <p class="sub">{{ 'auth.magicSentDesc' | transloco: { email: magicEmail() } }}</p>
          <span class="mg-exp">⏳ {{ 'auth.magicExpiry' | transloco }}</span>
          <button type="button" class="mg-again" (click)="magic.set('form')">{{ 'auth.magicResend' | transloco }}</button>
          <button type="button" class="mg-back center" (click)="backToLogin()"><span class="material-icons">arrow_back</span>{{ 'auth.magicBack' | transloco }}</button>
        </div>
        }
        }
      </div>
    </div>
  </div>
  `,
  styles: [`
    :host{display:block}
    .lg{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;background:var(--cf-bg);font-family:var(--cf-font)}

    /* brand panel */
    .brand{position:relative;overflow:hidden;background:#070B17;color:#EDF0FF;padding:44px 48px;display:flex;flex-direction:column;isolation:isolate}
    .aurora{position:absolute;border-radius:50%;filter:blur(80px);z-index:-1;pointer-events:none}
    .ba1{width:480px;height:420px;top:-180px;inset-inline-start:-120px;background:radial-gradient(circle,#4338CA,transparent 65%);opacity:.55;animation:drift 18s ease-in-out infinite alternate}
    .ba2{width:420px;height:420px;bottom:-190px;inset-inline-end:-120px;background:radial-gradient(circle,#0EA5E9,transparent 62%);opacity:.3;animation:drift 22s ease-in-out infinite alternate-reverse}
    @keyframes drift{from{transform:translate(0,0)}to{transform:translate(40px,26px) scale(1.1)}}
    .dots{position:absolute;inset:0;z-index:-1;background-image:radial-gradient(rgba(255,255,255,.12) 1px,transparent 1px);background-size:24px 24px;mask-image:radial-gradient(ellipse 80% 70% at 50% 40%,#000 30%,transparent 75%)}
    .top{display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff;align-self:flex-start}
    .mark{width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,#6366F1,#7C3AED);display:grid;place-items:center;box-shadow:0 8px 20px -8px rgba(99,102,241,.8)}
    .mark .material-icons{font-size:21px}
    .bn{font-weight:700;font-size:17.5px;letter-spacing:-.01em}

    /* mini certificate */
    .cert-mini{margin:auto 0;display:grid;place-items:center;padding:30px 0}
    .cm-in{position:relative;width:min(300px,80%);aspect-ratio:10/7;background:linear-gradient(165deg,#FDFDFB,#F2F0E9);border-radius:14px;box-shadow:0 36px 70px -28px rgba(0,0,0,.7);padding:18px 20px;display:flex;flex-direction:column;animation:float 7s ease-in-out infinite}
    @keyframes float{0%,100%{translate:0 0;rotate:-2deg}50%{translate:0 -10px;rotate:-2deg}}
    .cm-in::before{content:"";position:absolute;inset:7px;border:1.2px solid rgba(180,148,72,.5);border-radius:9px}
    .cm-top{display:flex;align-items:center;gap:8px;color:#8B6F35}
    .cm-top .material-icons{font-size:16px}
    .cm-top i{flex:1;height:1px;background:linear-gradient(90deg,rgba(180,148,72,.5),transparent)}
    .cm-name{font-family:"Playfair Display",Georgia,serif;font-size:19px;font-weight:600;color:#141A2B;text-align:center;margin-top:16px}
    .cm-line{height:5px;border-radius:99px;background:#E4E1D6;margin:12px 14% 0}
    .cm-line.short{margin:8px 26% 0}
    .cm-foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between}
    .cm-seal{width:32px;height:32px;border-radius:50%;background:radial-gradient(circle at 32% 28%,#F1D48A,#D9A441 60%,#B98A2E);box-shadow:0 5px 12px -4px rgba(185,138,46,.8)}
    .cm-qr{width:30px;height:30px;border-radius:6px;background:repeating-conic-gradient(#20263A 0 25%,#fff 0 50%) 0 0/7.5px 7.5px;border:3px solid #fff;outline:1px solid #E3DFD3}
    .cm-stamp{position:absolute;top:-12px;inset-inline-end:-12px;width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#10B981,#059669);color:#fff;display:grid;place-items:center;box-shadow:0 10px 22px -8px rgba(5,150,105,.8);animation:stampin .6s cubic-bezier(.2,1.6,.4,1) .7s both}
    .cm-stamp .material-icons{font-size:20px}
    @keyframes stampin{from{transform:scale(2.2);opacity:0}to{transform:scale(1);opacity:1}}
    .body{position:relative}
    .body h2{color:#fff;font-size:26px;line-height:1.28;letter-spacing:-.02em;max-width:18ch;font-weight:700}
    .body p{color:#A9B4D6;margin-top:12px;max-width:44ch;font-size:14.5px;line-height:1.65}

    /* form panel */
    .form{display:flex;align-items:center;justify-content:center;background:var(--cf-surface);padding:40px 24px}
    .inner{width:100%;max-width:392px}
    h1{font-size:26px;color:var(--cf-ink-900);letter-spacing:-.02em;font-weight:700}
    .sub{color:var(--cf-ink-500);margin:6px 0 26px;font-size:14px}
    .lbl{display:block;font-size:12.5px;font-weight:600;color:var(--cf-ink-700);margin:15px 0 7px}
    .inwrap{position:relative}
    .lead{position:absolute;inset-inline-start:13px;top:50%;transform:translateY(-50%);color:var(--cf-ink-400);font-size:19px;transition:color .18s}
    .inwrap:focus-within .lead{color:var(--cf-brand-600)}
    .in{width:100%;height:46px;border:1.5px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-900);border-radius:13px;padding:0 14px;padding-inline-start:42px;font:inherit;font-size:14px;outline:none;transition:border-color .18s,box-shadow .18s}
    .in:focus{border-color:var(--cf-brand-500);box-shadow:0 0 0 4px color-mix(in srgb,var(--cf-brand-500) 14%,transparent)}
    .trail{position:absolute;inset-inline-end:10px;top:50%;transform:translateY(-50%);border:0;background:none;color:var(--cf-ink-400);cursor:pointer;padding:4px;border-radius:8px}
    .trail:hover{color:var(--cf-ink-700)}
    .row{display:flex;align-items:center;justify-content:space-between;margin:15px 0 19px;font-size:13px}
    .chk{display:inline-flex;align-items:center;gap:8px;color:var(--cf-ink-600);cursor:pointer}
    .chk input{accent-color:var(--cf-brand-600)}
    /* "Remember me" explainer tooltip */
    .chk-wrap{display:inline-flex;align-items:center;gap:6px}
    .rm-tip{position:relative;display:inline-grid;place-items:center;cursor:help;outline:none}
    .rm-i{font-size:16px;color:var(--cf-ink-400);transition:color .15s,transform .15s}
    .rm-tip:hover .rm-i,.rm-tip:focus .rm-i{color:var(--cf-brand-600);transform:scale(1.12)}
    .rm-bubble{position:absolute;bottom:calc(100% + 12px);inset-inline-start:-14px;width:264px;padding:12px 13px;display:flex;flex-direction:column;gap:7px;
      background:linear-gradient(var(--cf-surface),var(--cf-surface)) padding-box,linear-gradient(135deg,#6366F1,#0EA5E9) border-box;
      border:1.5px solid transparent;border-radius:14px;box-shadow:0 18px 40px -14px rgba(15,23,42,.35);
      opacity:0;visibility:hidden;transform:translateY(6px) scale(.97);transform-origin:bottom left;
      transition:opacity .18s ease,transform .18s cubic-bezier(.2,.8,.3,1),visibility .18s;z-index:20;pointer-events:none;text-align:start}
    .rm-bubble::after{content:"";position:absolute;top:100%;inset-inline-start:16px;border:7px solid transparent;border-top-color:var(--cf-surface);filter:drop-shadow(0 1.5px 0 #818cf8)}
    .rm-tip:hover .rm-bubble,.rm-tip:focus .rm-bubble{opacity:1;visibility:visible;transform:translateY(0) scale(1)}
    .rm-head{display:flex;align-items:center;gap:8px}
    .rm-badge{width:26px;height:26px;flex:none;display:grid;place-items:center;border-radius:8px;background:linear-gradient(135deg,#6366F1,#0EA5E9);color:#fff}
    .rm-badge .material-icons{font-size:15px}
    .rm-head b{font-size:12.5px;color:var(--cf-ink-900);flex:1}
    .rm-days{font-style:normal;font-size:10px;font-weight:800;color:var(--cf-brand-700);background:color-mix(in srgb,var(--cf-brand-500) 14%,transparent);padding:2px 7px;border-radius:999px;white-space:nowrap}
    .rm-body{font-size:12px;line-height:1.55;color:var(--cf-ink-600)}
    .rm-note{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--cf-ink-400);border-top:1px dashed var(--cf-line);padding-top:7px}
    .rm-note .material-icons{font-size:13px;color:var(--cf-brand-500)}
    .row a{color:var(--cf-brand-600);text-decoration:none;font-weight:600}
    .err{background:var(--cf-danger-soft);color:var(--cf-danger);border-radius:11px;padding:10px 13px;font-size:13px;margin-bottom:12px}
    .primary{width:100%;height:48px;border:0;border-radius:13px;background:linear-gradient(135deg,#6366F1,#4338CA);color:#fff;font:inherit;font-weight:600;font-size:14.5px;cursor:pointer;box-shadow:0 12px 26px -12px rgba(79,70,229,.7),inset 0 1px 0 rgba(255,255,255,.18);transition:transform .16s,box-shadow .2s,filter .18s}
    .primary:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.05);box-shadow:0 18px 34px -14px rgba(79,70,229,.8)}
    .primary:disabled{opacity:.55;cursor:not-allowed}
    .div{display:flex;align-items:center;gap:12px;color:var(--cf-ink-400);font-size:12px;margin:20px 0}
    .div::before,.div::after{content:"";height:1px;background:var(--cf-line);flex:1}
    .socials{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .soc{display:grid;place-items:center;height:46px;border:1.5px solid var(--cf-line);border-radius:13px;background:var(--cf-surface);cursor:pointer;transition:border-color .18s,transform .16s,box-shadow .2s}
    .soc:hover{border-color:color-mix(in srgb,var(--cf-brand-500) 40%,var(--cf-line));transform:translateY(-1px);box-shadow:0 10px 22px -14px rgba(15,23,42,.3)}
    .alt{margin-top:20px;text-align:center;font-size:13px;color:var(--cf-ink-500)}.alt a{color:var(--cf-brand-600);font-weight:600;text-decoration:none}
    /* ---- Magic link ---- */
    .magicbtn{position:relative;width:100%;height:46px;margin-top:12px;display:flex;align-items:center;justify-content:center;gap:8px;
      font:inherit;font-size:13.5px;font-weight:700;color:var(--cf-brand-700);cursor:pointer;border-radius:13px;
      background:linear-gradient(var(--cf-surface),var(--cf-surface)) padding-box,linear-gradient(135deg,#6366F1,#0EA5E9,#8B5CF6) border-box;
      border:1.5px solid transparent;transition:transform .16s,box-shadow .2s}
    .magicbtn:hover{transform:translateY(-1px);box-shadow:0 12px 26px -14px rgba(99,102,241,.55)}
    .magicbtn:hover .mg-arrow{transform:translateX(3px)}
    .mg-spark{font-size:15px;animation:twinkle 1.8s ease-in-out infinite}
    .mg-arrow{font-size:16px;transition:transform .16s}
    @keyframes twinkle{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.25) rotate(12deg);opacity:.75}}
    .magic-pane{animation:mgIn .22s cubic-bezier(.2,.8,.3,1)}
    @keyframes mgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    .mg-back{display:inline-flex;align-items:center;gap:5px;border:0;background:none;font:inherit;font-size:12.5px;font-weight:600;color:var(--cf-ink-500);cursor:pointer;padding:0;margin-bottom:18px}
    .mg-back:hover{color:var(--cf-brand-600)}
    .mg-back .material-icons{font-size:15px}
    .mg-back.center{margin:16px auto 0;display:flex}
    .mg-hero{width:58px;height:58px;display:grid;place-items:center;border-radius:18px;margin-bottom:16px;
      background:linear-gradient(135deg,#6366F1,#0EA5E9);box-shadow:0 14px 30px -12px rgba(99,102,241,.7);font-size:26px}
    .mg-hero span{animation:twinkle 1.8s ease-in-out infinite}
    .mg-t{font-size:24px;color:var(--cf-ink-900);letter-spacing:-.02em;font-weight:700}
    .mg-send{margin-top:16px}
    .magic-pane.sent{text-align:center;display:flex;flex-direction:column;align-items:center;padding:12px 0}
    .mg-mail{position:relative;width:76px;height:76px;display:grid;place-items:center;border-radius:50%;margin-bottom:18px;
      background:linear-gradient(135deg,#6366F1,#0EA5E9);color:#fff;box-shadow:0 18px 40px -14px rgba(99,102,241,.75);animation:mgPop .5s cubic-bezier(.2,1.6,.4,1) both}
    .mg-mail .material-icons{font-size:34px}
    @keyframes mgPop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
    .sp{position:absolute;font-style:normal;color:#F1D48A;animation:spark 1.6s ease-in-out infinite}
    .s1{top:-8px;inset-inline-end:-4px;font-size:15px}
    .s2{bottom:-4px;inset-inline-start:-10px;font-size:11px;animation-delay:.4s}
    .s3{top:8px;inset-inline-start:-16px;font-size:9px;animation-delay:.9s}
    @keyframes spark{0%,100%{opacity:0;transform:scale(.6)}50%{opacity:1;transform:scale(1.15)}}
    .mg-exp{display:inline-block;margin-top:12px;padding:5px 13px;border-radius:999px;font-size:12px;font-weight:700;color:var(--cf-brand-700);background:color-mix(in srgb,var(--cf-brand-500) 12%,transparent)}
    .mg-again{margin-top:18px;border:0;background:none;font:inherit;font-size:13px;font-weight:700;color:var(--cf-brand-600);cursor:pointer;text-decoration:underline;text-underline-offset:3px}
    @media(max-width:860px){.lg{grid-template-columns:1fr}.brand{display:none}}
    @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms !important}}
  `],
})
export class LoginPage implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private t = inject(TranslocoService);

  showPassword = signal(false);
  loading = signal(false);
  error = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [false],
  });

  // ---- Magic link (passwordless) ----
  magic = signal<'off' | 'form' | 'sent'>('off');
  magicLoading = signal(false);
  magicEmail = signal('');
  magicCtrl = this.fb.control('', [Validators.required, Validators.email]);

  startMagic(): void {
    this.magicCtrl.setValue(this.form.value.email || '');
    this.error.set('');
    this.magic.set('form');
  }
  backToLogin(): void { this.magic.set('off'); this.error.set(''); }
  sendMagic(): void {
    if (this.magicCtrl.invalid || this.magicLoading()) return;
    this.magicLoading.set(true);
    this.error.set('');
    const email = (this.magicCtrl.value || '').trim();
    this.auth.requestMagicLink(email).subscribe({
      next: () => { this.magicLoading.set(false); this.magicEmail.set(email); this.magic.set('sent'); },
      error: () => { this.magicLoading.set(false); this.error.set(this.t.translate('auth.magicError')); },
    });
  }

  /**
   * Social-login OAuth callback. After Google/Facebook/Microsoft, the backend
   * redirects to /auth/login?redirectResponse=<json> with the auth result
   * (PascalCase, hence toCamelCase). Read once via snapshot — no subscription.
   */
  ngOnInit(): void {
    const raw = this.route.snapshot.queryParamMap.get('redirectResponse');
    if (!raw) return;
    try {
      const res = this.toCamelCase(JSON.parse(raw)) as ServiceResponse<TokenModel>;
      const tokenData = res?.data;
      if (res?.success && tokenData && this.auth.isTokenValid(tokenData)) {
        this.auth.accessToken = tokenData;
        this.router.navigateByUrl('/app/dashboard');
      } else {
        this.error.set(res?.message || this.t.translate('auth.tokenInvalid'));
      }
    } catch {
      this.error.set(this.t.translate('auth.signinFailed'));
    }
  }

  /** Normalize PascalCase API JSON to camelCase so res.data/res.success work. */
  private toCamelCase(obj: any): any {
    if (Array.isArray(obj)) return obj.map((v) => this.toCamelCase(v));
    if (obj && obj.constructor === Object) {
      return Object.keys(obj).reduce((acc: any, key) => {
        acc[key.charAt(0).toLowerCase() + key.slice(1)] = this.toCamelCase(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email, password, remember } = this.form.value;
    this.auth.login(email!, password!, !!remember).subscribe({
      next: (res: ServiceResponse<TokenModel>) => {
        this.loading.set(false);
        if (res?.success && res.data && this.auth.isTokenValid(res.data)) {
          this.auth.accessToken = res.data;
          this.router.navigateByUrl('/app/dashboard');
        } else {
          this.error.set(res?.message || this.t.translate('auth.invalidCreds'));
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.t.translate('auth.loginFailed'));
      },
    });
  }

  google(): void { this.auth.loginWithGoogle(); }
  facebook(): void { this.auth.loginWithFacebook(); }
  microsoft(): void { this.auth.loginWithMicrosoft(); }
}

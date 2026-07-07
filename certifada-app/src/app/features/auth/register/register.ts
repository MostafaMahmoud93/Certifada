import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { BillingService } from '../../../core/services/billing.service';
import { PlanService, PlanTier } from '../../../core/services/plan.service';
import { ServiceResponse, TokenModel } from '../../../core/models/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslocoModule],
  template: `
  <div class="lg">
    <div class="brand">
      <div class="aurora ba1"></div><div class="aurora ba2"></div><div class="dots"></div>
      <a class="top" routerLink="/"><span class="mark"><span class="material-icons">workspace_premium</span></span><span class="bn">Certifada</span></a>
      <div class="mid">
        <h2>{{ 'auth.regBrandHeadline' | transloco }}</h2>
        <p>{{ 'auth.regBrandSub' | transloco }}</p>
        <ul class="perks">
          <li><span class="material-icons">design_services</span>{{ 'auth.regPerk1' | transloco }}</li>
          <li><span class="material-icons">bolt</span>{{ 'auth.regPerk2' | transloco }}</li>
          <li><span class="material-icons">verified_user</span>{{ 'auth.regPerk3' | transloco }}</li>
        </ul>
      </div>
    </div>
    <div class="form"><div class="inner">
      @if (sent()) {
        <!-- ---- Check your inbox (post-signup) ---- -->
        <div class="verify">
          <div class="vf-mail"><span class="material-icons">mark_email_unread</span><i class="vsp v1">✦</i><i class="vsp v2">✦</i></div>
          <h1>{{ 'auth.verifyTitle' | transloco }}</h1>
          <p class="sub center">{{ 'auth.verifySub' | transloco: { email: sentEmail() } }}</p>
          <span class="vf-exp">⏳ {{ 'auth.verifyExpiry' | transloco }}</span>
          @if (chosenPlan(); as cp) {
            <p class="vf-next">
              <span class="material-icons">{{ cp.monthly > 0 ? 'credit_card' : 'rocket_launch' }}</span>
              {{ (cp.monthly > 0 ? 'auth.verifyNextPaid' : 'auth.verifyNextFree') | transloco: { plan: cp.name } }}
            </p>
          }
          <p class="alt">{{ 'auth.verifySpam' | transloco }}</p>
        </div>
      } @else {
      <h1>{{ 'auth.createTitle' | transloco }}</h1>
      <p class="sub">{{ 'auth.createSub' | transloco }}</p>

      @if (chosenPlan(); as cp) {
        <!-- ---- Chosen plan banner ---- -->
        <div class="planban" [class.freeplan]="cp.monthly === 0">
          <span class="pb-ic"><span class="material-icons">{{ cp.monthly === 0 ? 'auto_awesome' : 'workspace_premium' }}</span></span>
          <span class="pb-tt">
            @if (cp.monthly === 0) {
              <b>{{ 'auth.planFreeTitle' | transloco }}</b>
              <small>{{ 'auth.planFreeSub' | transloco }}</small>
            } @else {
              <b>{{ 'auth.planPaidTitle' | transloco: { plan: cp.name } }}</b>
              <small>{{ 'auth.planPaidSub' | transloco: { price: planPrice() } }}</small>
            }
          </span>
          <a class="pb-change" routerLink="/pricing">{{ 'auth.planChange' | transloco }}</a>
        </div>
      }

      <div class="socials">
        <button type="button" class="soc" (click)="google()">
          <svg viewBox="0 0 24 24" width="17" height="17"><path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3c-1.07.72-2.44 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A11.99 11.99 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.29a12 12 0 0 0 0 10.76l4-3.1z"/><path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.97 11.97 0 0 0 1.29 7.62l4 3.1C6.23 6.88 8.88 4.77 12 4.77z"/></svg>
          Google</button>
        <button type="button" class="soc" (click)="facebook()">
          <svg viewBox="0 0 24 24" width="17" height="17"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.92-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12z"/></svg>
          Facebook</button>
        <button type="button" class="soc" (click)="microsoft()">
          <svg viewBox="0 0 24 24" width="15" height="15"><path fill="#F25022" d="M1 1h10.5v10.5H1z"/><path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z"/><path fill="#00A4EF" d="M1 12.5h10.5V23H1z"/><path fill="#FFB900" d="M12.5 12.5H23V23H12.5z"/></svg>
          Microsoft</button>
      </div>
      <div class="div">{{ 'auth.signupWithEmail' | transloco }}</div>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="names">
          <div class="fld">
            <label class="lbl">{{ 'auth.firstName' | transloco }}</label>
            <div class="inwrap"><span class="material-icons lead">person</span><input class="in" formControlName="firstName" [placeholder]="'auth.firstName' | transloco" [class.bad]="invalid('firstName')" /></div>
            @if (invalid('firstName')) { <small class="ferr">{{ 'auth.firstNameReq' | transloco }}</small> }
          </div>
          <div class="fld">
            <label class="lbl">{{ 'auth.lastName' | transloco }}</label>
            <div class="inwrap"><span class="material-icons lead">person</span><input class="in" formControlName="lastName" [placeholder]="'auth.lastName' | transloco" [class.bad]="invalid('lastName')" /></div>
            @if (invalid('lastName')) { <small class="ferr">{{ 'auth.lastNameReq' | transloco }}</small> }
          </div>
        </div>

        <label class="lbl">{{ 'auth.emailAddress' | transloco }}</label>
        <div class="inwrap"><span class="material-icons lead">mail</span><input class="in" type="email" formControlName="email" [placeholder]="'auth.emailPh' | transloco" [class.bad]="invalid('email')" /></div>
        @if (invalid('email')) { <small class="ferr">{{ 'auth.emailInvalid' | transloco }}</small> }

        <label class="lbl">{{ 'auth.password' | transloco }}</label>
        <div class="inwrap"><span class="material-icons lead">lock</span>
          <input class="in" [type]="show() ? 'text' : 'password'" formControlName="password" [placeholder]="'auth.passwordPh' | transloco" [class.bad]="invalid('password')" />
          <button type="button" class="trail" (click)="show.set(!show())"><span class="material-icons">{{ show() ? 'visibility_off' : 'visibility' }}</span></button>
        </div>
        @if (invalid('password')) { <small class="ferr">{{ 'auth.passwordRule' | transloco }}</small> }

        <label class="lbl">{{ 'auth.confirmPassword' | transloco }}</label>
        <div class="inwrap"><span class="material-icons lead">lock</span>
          <input class="in" [type]="show() ? 'text' : 'password'" formControlName="confirm" [placeholder]="'auth.confirmPh' | transloco" [class.bad]="mismatch()" />
        </div>
        @if (mismatch()) { <small class="ferr">{{ 'auth.passwordsMismatch' | transloco }}</small> }

        @if (error()) { <div class="err">{{ error() }}</div> }
        <button type="submit" class="primary" [disabled]="loading()">{{ loading() ? ('auth.creating' | transloco) : ('auth.createBtn' | transloco) }}</button>
        <p class="tos">{{ 'auth.tos' | transloco }}</p>
      </form>

      <p class="alt">{{ 'auth.haveAccount' | transloco }} <a routerLink="/auth/login">{{ 'auth.signInLink' | transloco }}</a></p>
      }
    </div></div>
  </div>
  `,
  styles: [`
    :host{display:block}
    .lg{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;background:var(--cf-bg);font-family:var(--cf-font)}
    .brand{position:relative;overflow:hidden;background:#070B17;color:#EDF0FF;padding:44px 48px;display:flex;flex-direction:column;isolation:isolate}
    .aurora{position:absolute;border-radius:50%;filter:blur(80px);z-index:-1;pointer-events:none}
    .ba1{width:480px;height:420px;top:-180px;inset-inline-start:-120px;background:radial-gradient(circle,#4338CA,transparent 65%);opacity:.55;animation:drift 18s ease-in-out infinite alternate}
    .ba2{width:420px;height:420px;bottom:-190px;inset-inline-end:-120px;background:radial-gradient(circle,#7C3AED,transparent 62%);opacity:.32;animation:drift 22s ease-in-out infinite alternate-reverse}
    @keyframes drift{from{transform:translate(0,0)}to{transform:translate(40px,26px) scale(1.1)}}
    .dots{position:absolute;inset:0;z-index:-1;background-image:radial-gradient(rgba(255,255,255,.12) 1px,transparent 1px);background-size:24px 24px;mask-image:radial-gradient(ellipse 80% 70% at 50% 40%,#000 30%,transparent 75%)}
    .top{display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff;align-self:flex-start}
    .mark{width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,#6366F1,#7C3AED);display:grid;place-items:center;box-shadow:0 8px 20px -8px rgba(99,102,241,.8)}
    .mark .material-icons{font-size:21px}
    .bn{font-weight:700;font-size:17.5px;letter-spacing:-.01em}
    .mid{margin:auto 0;position:relative}
    .mid h2{color:#fff;font-size:30px;line-height:1.2;letter-spacing:-.02em;max-width:14ch;font-weight:700}
    .mid p{color:#A9B4D6;margin-top:14px;max-width:42ch;font-size:14.5px;line-height:1.65}
    .perks{list-style:none;padding:0;margin:30px 0 0;display:grid;gap:14px}
    .perks li{display:flex;align-items:center;gap:12px;font-size:14px;color:#C9D2EC}
    .perks .material-icons{font-size:18px;color:#E2B45A;background:rgba(226,180,90,.12);border:1px solid rgba(226,180,90,.25);border-radius:9px;padding:6px}

    .form{display:flex;align-items:center;justify-content:center;background:var(--cf-surface);padding:40px 24px;overflow:auto}
    .inner{width:100%;max-width:412px}
    h1{font-size:26px;color:var(--cf-ink-900);letter-spacing:-.02em;font-weight:700}
    .sub{color:var(--cf-ink-500);margin:6px 0 22px;font-size:14px}
    .socials{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
    .soc{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:44px;border:1.5px solid var(--cf-line);border-radius:13px;background:var(--cf-surface);color:var(--cf-ink-700);font:inherit;font-size:13px;font-weight:600;cursor:pointer;transition:border-color .18s,transform .16s,box-shadow .2s}
    .soc:hover{border-color:color-mix(in srgb,var(--cf-brand-500) 40%,var(--cf-line));transform:translateY(-1px);box-shadow:0 10px 22px -14px rgba(15,23,42,.3)}
    .div{display:flex;align-items:center;gap:12px;color:var(--cf-ink-400);font-size:12px;margin:19px 0}
    .div::before,.div::after{content:"";height:1px;background:var(--cf-line);flex:1}
    .names{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .fld{min-width:0}
    .lbl{display:block;font-size:12.5px;font-weight:600;color:var(--cf-ink-700);margin:14px 0 7px}
    .inwrap{position:relative}
    .lead{position:absolute;inset-inline-start:13px;top:50%;transform:translateY(-50%);color:var(--cf-ink-400);font-size:19px;transition:color .18s}
    .inwrap:focus-within .lead{color:var(--cf-brand-600)}
    .in{width:100%;height:46px;border:1.5px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-900);border-radius:13px;padding:0 14px;padding-inline-start:42px;font:inherit;font-size:14px;outline:none;transition:border-color .18s,box-shadow .18s}
    .in:focus{border-color:var(--cf-brand-500);box-shadow:0 0 0 4px color-mix(in srgb,var(--cf-brand-500) 14%,transparent)}
    .in.bad{border-color:var(--cf-danger)}
    .trail{position:absolute;inset-inline-end:10px;top:50%;transform:translateY(-50%);border:0;background:none;color:var(--cf-ink-400);cursor:pointer;padding:4px;border-radius:8px}
    .trail:hover{color:var(--cf-ink-700)}
    .ferr{display:block;color:var(--cf-danger);font-size:11.5px;margin-top:6px}
    .err{background:var(--cf-danger-soft);color:var(--cf-danger);border-radius:11px;padding:10px 13px;font-size:13px;margin:14px 0 0}
    .primary{width:100%;height:48px;border:0;border-radius:13px;background:linear-gradient(135deg,#6366F1,#4338CA);color:#fff;font:inherit;font-weight:600;font-size:14.5px;cursor:pointer;margin-top:19px;box-shadow:0 12px 26px -12px rgba(79,70,229,.7),inset 0 1px 0 rgba(255,255,255,.18);transition:transform .16s,box-shadow .2s,filter .18s}
    .primary:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.05);box-shadow:0 18px 34px -14px rgba(79,70,229,.8)}
    .primary:disabled{opacity:.55;cursor:not-allowed}
    .tos{font-size:11.5px;color:var(--cf-ink-400);text-align:center;margin-top:12px;line-height:1.5}
    .alt{margin-top:16px;text-align:center;font-size:13px;color:var(--cf-ink-500)}.alt a{color:var(--cf-brand-600);font-weight:600;text-decoration:none}
    /* chosen-plan banner */
    .planban{display:flex;align-items:center;gap:11px;margin:0 0 18px;padding:12px 14px;border-radius:14px;
      background:linear-gradient(var(--cf-surface),var(--cf-surface)) padding-box,linear-gradient(135deg,#6366F1,#7C3AED) border-box;
      border:1.5px solid transparent;box-shadow:0 10px 26px -18px rgba(99,102,241,.6);animation:pbIn .3s cubic-bezier(.2,.8,.3,1)}
    .planban.freeplan{background:linear-gradient(var(--cf-surface),var(--cf-surface)) padding-box,linear-gradient(135deg,#10B981,#0EA5E9) border-box}
    @keyframes pbIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
    .pb-ic{width:38px;height:38px;flex:none;display:grid;place-items:center;border-radius:11px;color:#fff;background:linear-gradient(135deg,#6366F1,#7C3AED)}
    .freeplan .pb-ic{background:linear-gradient(135deg,#10B981,#0EA5E9)}
    .pb-ic .material-icons{font-size:19px}
    .pb-tt{flex:1;display:flex;flex-direction:column;gap:1px;min-width:0}
    .pb-tt b{font-size:13px;color:var(--cf-ink-900)}
    .pb-tt small{font-size:11.5px;color:var(--cf-ink-500)}
    .pb-change{font-size:11.5px;font-weight:700;color:var(--cf-brand-600);text-decoration:none;white-space:nowrap}
    .pb-change:hover{text-decoration:underline}
    /* verify-inbox state */
    .verify{display:flex;flex-direction:column;align-items:center;text-align:center;padding:20px 0}
    .center{text-align:center}
    .vf-mail{position:relative;width:80px;height:80px;display:grid;place-items:center;border-radius:50%;margin-bottom:20px;
      background:linear-gradient(135deg,#6366F1,#7C3AED);color:#fff;box-shadow:0 18px 40px -14px rgba(99,102,241,.75);animation:vfPop .5s cubic-bezier(.2,1.6,.4,1) both}
    .vf-mail .material-icons{font-size:36px}
    @keyframes vfPop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
    .vsp{position:absolute;font-style:normal;color:#F1D48A;animation:vspark 1.6s ease-in-out infinite}
    .v1{top:-8px;inset-inline-end:-4px;font-size:15px}.v2{bottom:-4px;inset-inline-start:-10px;font-size:11px;animation-delay:.5s}
    @keyframes vspark{0%,100%{opacity:0;transform:scale(.6)}50%{opacity:1;transform:scale(1.15)}}
    .vf-exp{display:inline-block;margin-top:14px;padding:5px 14px;border-radius:999px;font-size:12px;font-weight:700;color:var(--cf-brand-700);background:color-mix(in srgb,var(--cf-brand-500) 12%,transparent)}
    .vf-next{display:flex;align-items:center;gap:8px;margin-top:18px;padding:10px 16px;border-radius:12px;font-size:12.5px;font-weight:600;color:var(--cf-ink-700);background:var(--cf-surface-2,#f1f5f9)}
    .vf-next .material-icons{font-size:17px;color:var(--cf-brand-600)}
    @media(max-width:860px){.lg{grid-template-columns:1fr}.brand{display:none}}
    @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms !important}}
  `],
})
export class RegisterPage implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private t = inject(TranslocoService);
  private billing = inject(BillingService);
  private plans = inject(PlanService);
  show = signal(false);
  loading = signal(false);
  error = signal('');
  /** Post-signup "check your inbox" state. */
  sent = signal(false);
  sentEmail = signal('');
  /** Plan carried from the pricing/home page (?plan=…&interval=…). */
  private planCode = signal<string | null>(null);
  private interval = signal<'monthly' | 'yearly'>('monthly');
  readonly chosenPlan = computed<PlanTier | null>(() => {
    const code = this.planCode();
    return code ? this.plans.tier(code) ?? null : null;
  });
  planPrice(): string {
    const p = this.chosenPlan();
    if (!p) return '';
    return this.interval() === 'yearly' ? `$${p.yearly}/yr` : `$${p.monthly}/mo`;
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const plan = q.get('plan');
    const interval = q.get('interval') === 'yearly' ? 'yearly' : 'monthly';
    this.interval.set(interval);
    if (plan) {
      this.planCode.set(plan);
      // Remembered locally so we can send them to Stripe right after email verification.
      this.billing.setPendingPlan(plan, interval);
    } else {
      const pending = this.billing.pendingPlan();
      if (pending) { this.planCode.set(pending.code); this.interval.set(pending.interval); }
    }
  }

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(1)]],
    lastName: ['', [Validators.required, Validators.minLength(1)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)]],
    confirm: ['', [Validators.required]],
  });

  invalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
  mismatch(): boolean {
    const c = this.form.get('confirm');
    return !!c && (c.touched || c.dirty) && !!c.value && c.value !== this.form.get('password')!.value;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.mismatch()) return;
    const { firstName, lastName, email, password } = this.form.value;
    const fullName = `${firstName} ${lastName}`.trim();
    this.loading.set(true);
    this.error.set('');
    this.auth.register(fullName, email!, password!).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        const r = res as ServiceResponse<TokenModel>;
        const ok = r?.success ?? res?.Success;
        if (ok) {
          // Email sign-up now verifies the address first — show "check your inbox".
          this.sentEmail.set(email!);
          this.sent.set(true);
        } else {
          this.error.set((r?.message ?? res?.Message) || this.t.translate('auth.createFailed'));
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.t.translate('auth.createFailedRetry'));
      },
    });
  }

  google(): void { this.auth.loginWithGoogle(); }
  facebook(): void { this.auth.loginWithFacebook(); }
  microsoft(): void { this.auth.loginWithMicrosoft(); }
}

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
      <a class="top" routerLink="/"><span class="mark"><span class="material-icons">workspace_premium</span></span><span class="bn">Certifada</span></a>
      <div class="body">
        <h2>{{ 'auth.brandHeadline' | transloco }}</h2>
        <p>{{ 'auth.brandSub' | transloco }}</p>
      </div>
    </div>
    <div class="form">
      <div class="inner">
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
            <label class="chk"><input type="checkbox" formControlName="remember" /> {{ 'auth.remember' | transloco }}</label>
            <a href="#">{{ 'auth.forgot' | transloco }}</a>
          </div>

          @if (error()) { <div class="err">{{ error() }}</div> }
          <button type="submit" class="primary" [disabled]="form.invalid || loading()">{{ loading() ? ('auth.signingIn' | transloco) : ('auth.signin' | transloco) }}</button>
        </form>

        <div class="div">{{ 'auth.continueWith' | transloco }}</div>
        <div class="socials">
          <button class="soc" (click)="google()" aria-label="Google">G</button>
          <button class="soc" (click)="facebook()" aria-label="Facebook">f</button>
          <button class="soc" (click)="microsoft()" aria-label="Microsoft">⊞</button>
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    :host{display:block}
    .lg{min-height:100vh;display:grid;grid-template-columns:1.05fr 1fr;background:var(--cf-bg);font-family:var(--cf-font)}
    .brand{position:relative;overflow:hidden;background:var(--cf-brand-700);color:#fff;padding:46px;display:flex;flex-direction:column}
    .brand::before{content:"";position:absolute;inset:0;opacity:.5;background:radial-gradient(420px 220px at 85% 8%,rgba(255,255,255,.16),transparent 60%),radial-gradient(360px 300px at 8% 100%,rgba(217,164,65,.3),transparent 60%)}
    .top{display:flex;align-items:center;gap:10px;position:relative;text-decoration:none;color:#fff}
    .mark{width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.16);display:grid;place-items:center}
    .mark .material-icons{font-size:20px}
    .bn{font-weight:700;font-size:17px}
    .body{margin-top:auto;position:relative}
    .body h2{color:#fff;font-size:27px;line-height:1.25;letter-spacing:-.02em;max-width:16ch}
    .body p{color:rgba(255,255,255,.82);margin-top:12px;max-width:40ch}
    .form{display:flex;align-items:center;justify-content:center;background:var(--cf-surface);padding:40px 24px}
    .inner{width:100%;max-width:380px}
    h1{font-size:24px;color:var(--cf-ink-900)} .sub{color:var(--cf-ink-500);margin:4px 0 22px}
    .lbl{display:block;font-size:12.5px;font-weight:500;color:var(--cf-ink-700);margin:14px 0 7px}
    .inwrap{position:relative}
    .lead{position:absolute;inset-inline-start:12px;top:50%;transform:translateY(-50%);color:var(--cf-ink-400);font-size:19px}
    .in{width:100%;height:42px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-900);border-radius:var(--cf-radius-sm);padding:0 14px 0 40px;font:inherit;font-size:14px;outline:none}
    .in:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .trail{position:absolute;inset-inline-end:10px;top:8px;border:0;background:none;color:var(--cf-ink-400);cursor:pointer}
    .row{display:flex;align-items:center;justify-content:space-between;margin:14px 0 18px;font-size:13px}
    .chk{display:inline-flex;align-items:center;gap:8px;color:var(--cf-ink-600)}
    .row a{color:var(--cf-brand-600);text-decoration:none}
    .err{background:var(--cf-danger-soft);color:var(--cf-danger);border-radius:var(--cf-radius-sm);padding:9px 12px;font-size:13px;margin-bottom:12px}
    .primary{width:100%;height:46px;border:0;border-radius:var(--cf-radius-sm);background:var(--cf-brand-600);color:#fff;font:inherit;font-weight:500;font-size:14px;cursor:pointer}
    .primary:hover{background:var(--cf-brand-700)} .primary:disabled{opacity:.55;cursor:not-allowed}
    .div{display:flex;align-items:center;gap:12px;color:var(--cf-ink-400);font-size:12px;margin:18px 0}
    .div::before,.div::after{content:"";height:1px;background:var(--cf-line);flex:1}
    .socials{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .soc{height:44px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);background:var(--cf-surface);color:var(--cf-ink-700);font-weight:600;font-size:16px;cursor:pointer}
    .soc:hover{background:var(--cf-surface-2)}
    @media(max-width:860px){.lg{grid-template-columns:1fr}.brand{display:none}}
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
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
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

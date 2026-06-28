import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ServiceResponse, TokenModel } from '../../../core/models/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
  <div class="lg">
    <div class="brand">
      <a class="top" routerLink="/"><span class="mark"><span class="material-icons">workspace_premium</span></span><span class="bn">Certifada</span></a>
      <div class="body">
        <h2>Get started in minutes.</h2>
        <p>No credit card required for trials. Design, issue and verify credentials your recipients can trust.</p>
      </div>
    </div>
    <div class="form"><div class="inner">
      <h1>Create your account</h1>
      <p class="sub">Get started in minutes. No credit card required for trials.</p>

      <div class="socials">
        <button type="button" class="soc" (click)="google()"><span class="ic g">G</span> Google</button>
        <button type="button" class="soc" (click)="facebook()"><span class="ic f">f</span> Facebook</button>
        <button type="button" class="soc" (click)="microsoft()"><span class="ic m">&#8862;</span> Microsoft</button>
      </div>
      <div class="div">or sign up with email</div>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="names">
          <div class="fld">
            <label class="lbl">First name</label>
            <div class="inwrap"><span class="material-icons lead">person</span><input class="in" formControlName="firstName" placeholder="First name" [class.bad]="invalid('firstName')" /></div>
            @if (invalid('firstName')) { <small class="ferr">First name is required.</small> }
          </div>
          <div class="fld">
            <label class="lbl">Last name</label>
            <div class="inwrap"><span class="material-icons lead">person</span><input class="in" formControlName="lastName" placeholder="Last name" [class.bad]="invalid('lastName')" /></div>
            @if (invalid('lastName')) { <small class="ferr">Last name is required.</small> }
          </div>
        </div>

        <label class="lbl">Email address</label>
        <div class="inwrap"><span class="material-icons lead">mail</span><input class="in" type="email" formControlName="email" placeholder="you@company.com" [class.bad]="invalid('email')" /></div>
        @if (invalid('email')) { <small class="ferr">Enter a valid email address.</small> }

        <label class="lbl">Password</label>
        <div class="inwrap"><span class="material-icons lead">lock</span>
          <input class="in" [type]="show() ? 'text' : 'password'" formControlName="password" placeholder="At least 8 characters" [class.bad]="invalid('password')" />
          <button type="button" class="trail" (click)="show.set(!show())"><span class="material-icons">{{ show() ? 'visibility_off' : 'visibility' }}</span></button>
        </div>
        @if (invalid('password')) { <small class="ferr">Use at least 8 characters, including a letter and a number.</small> }

        <label class="lbl">Confirm password</label>
        <div class="inwrap"><span class="material-icons lead">lock</span>
          <input class="in" [type]="show() ? 'text' : 'password'" formControlName="confirm" placeholder="Re-enter password" [class.bad]="mismatch()" />
        </div>
        @if (mismatch()) { <small class="ferr">Passwords do not match.</small> }

        @if (error()) { <div class="err">{{ error() }}</div> }
        <button type="submit" class="primary" [disabled]="loading()">{{ loading() ? 'Creating account…' : 'Create account' }}</button>
        <p class="tos">By creating an account you agree to our Terms and Privacy Policy.</p>
      </form>

      <p class="alt">Already have an account? <a routerLink="/auth/login">Sign in</a></p>
    </div></div>
  </div>
  `,
  styles: [`
    :host{display:block}
    .lg{min-height:100vh;display:grid;grid-template-columns:1.05fr 1fr;background:var(--cf-bg);font-family:var(--cf-font)}
    .brand{position:relative;overflow:hidden;background:var(--cf-brand-700);color:#fff;padding:46px;display:flex;flex-direction:column}
    .brand::before{content:"";position:absolute;inset:0;opacity:.5;background:radial-gradient(420px 220px at 85% 8%,rgba(255,255,255,.16),transparent 60%),radial-gradient(360px 300px at 8% 100%,rgba(217,164,65,.3),transparent 60%)}
    .top{display:flex;align-items:center;gap:10px;position:relative;text-decoration:none;color:#fff}
    .mark{width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.16);display:grid;place-items:center}.mark .material-icons{font-size:20px}
    .bn{font-weight:700;font-size:17px}
    .body{margin-top:auto;position:relative}
    .body h2{color:#fff;font-size:28px;line-height:1.2;letter-spacing:-.02em;max-width:14ch}
    .body p{color:rgba(255,255,255,.82);margin-top:12px;max-width:42ch}
    .form{display:flex;align-items:center;justify-content:center;background:var(--cf-surface);padding:40px 24px;overflow:auto}
    .inner{width:100%;max-width:400px}
    h1{font-size:24px;color:var(--cf-ink-900)} .sub{color:var(--cf-ink-500);margin:4px 0 20px}
    .socials{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
    .soc{display:inline-flex;align-items:center;justify-content:center;gap:7px;height:42px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);background:var(--cf-surface);color:var(--cf-ink-700);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
    .soc:hover{background:var(--cf-surface-2)}
    .soc .ic{width:18px;height:18px;border-radius:5px;display:grid;place-items:center;font-weight:800;font-size:12px;color:#fff}
    .soc .ic.g{background:#ea4335}.soc .ic.f{background:#1877f2}.soc .ic.m{background:#0067b8}
    .div{display:flex;align-items:center;gap:12px;color:var(--cf-ink-400);font-size:12px;margin:18px 0}
    .div::before,.div::after{content:"";height:1px;background:var(--cf-line);flex:1}
    .names{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .fld{min-width:0}
    .lbl{display:block;font-size:12.5px;font-weight:500;color:var(--cf-ink-700);margin:13px 0 7px}
    .inwrap{position:relative}
    .lead{position:absolute;inset-inline-start:12px;top:50%;transform:translateY(-50%);color:var(--cf-ink-400);font-size:19px}
    .in{width:100%;height:42px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-900);border-radius:var(--cf-radius-sm);padding:0 14px 0 40px;font:inherit;font-size:14px;outline:none}
    .in:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .in.bad{border-color:var(--cf-danger)}
    .trail{position:absolute;inset-inline-end:10px;top:8px;border:0;background:none;color:var(--cf-ink-400);cursor:pointer}
    .ferr{display:block;color:var(--cf-danger);font-size:11.5px;margin-top:6px}
    .err{background:var(--cf-danger-soft);color:var(--cf-danger);border-radius:var(--cf-radius-sm);padding:9px 12px;font-size:13px;margin:14px 0 0}
    .primary{width:100%;height:46px;border:0;border-radius:var(--cf-radius-sm);background:var(--cf-brand-600);color:#fff;font:inherit;font-weight:500;font-size:14px;cursor:pointer;margin-top:18px}
    .primary:hover{background:var(--cf-brand-700)} .primary:disabled{opacity:.55;cursor:not-allowed}
    .tos{font-size:11.5px;color:var(--cf-ink-400);text-align:center;margin-top:12px;line-height:1.5}
    .alt{margin-top:16px;text-align:center;font-size:13px;color:var(--cf-ink-500)}.alt a{color:var(--cf-brand-600);font-weight:600;text-decoration:none}
    @media(max-width:860px){.lg{grid-template-columns:1fr}.brand{display:none}}
  `],
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  show = signal(false);
  loading = signal(false);
  error = signal('');

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
        const data = (r?.data ?? res?.Data) as TokenModel;
        if (ok && data && this.auth.isTokenValid(data)) {
          this.auth.accessToken = data;
          this.router.navigateByUrl('/app/dashboard');
        } else {
          this.error.set((r?.message ?? res?.Message) || 'Could not create your account.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not create your account. Please try again.');
      },
    });
  }

  google(): void { this.auth.loginWithGoogle(); }
  facebook(): void { this.auth.loginWithFacebook(); }
  microsoft(): void { this.auth.loginWithMicrosoft(); }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
  <div class="lg">
    <div class="brand">
      <a class="top" routerLink="/"><span class="mark"><span class="material-icons">workspace_premium</span></span><span class="bn">Certifada</span></a>
      <div class="body"><h2>Forgot your password?</h2><p>We'll email you a secure link to set a new one.</p></div>
    </div>
    <div class="form"><div class="inner">
      <h1>Reset your password</h1><p class="sub">Enter your account email and we'll send a reset link.</p>
      @if (sent()) {
        <div class="ok"><span class="material-icons">mark_email_read</span><span>If an account exists for that email, a reset link is on its way. Check your inbox (and spam).</span></div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="lbl">Email</label>
          <div class="inwrap"><span class="material-icons lead">mail</span><input class="in" type="email" formControlName="email" placeholder="you@company.com" /></div>
          @if (error()) { <div class="err">{{ error() }}</div> }
          <button type="submit" class="primary" [disabled]="form.invalid || loading()">{{ loading() ? 'Sending…' : 'Send reset link' }}</button>
        </form>
      }
      <a class="back" routerLink="/auth/login"><span class="material-icons">arrow_back</span> Back to sign in</a>
    </div></div>
  </div>`,
  styles: [`:host{display:block}
    .lg{min-height:100vh;display:grid;grid-template-columns:1.05fr 1fr;background:var(--cf-bg);font-family:var(--cf-font)}
    .brand{position:relative;overflow:hidden;background:var(--cf-brand-700);color:#fff;padding:46px;display:flex;flex-direction:column}
    .brand::before{content:"";position:absolute;inset:0;opacity:.5;background:radial-gradient(420px 220px at 85% 8%,rgba(255,255,255,.16),transparent 60%),radial-gradient(360px 300px at 8% 100%,rgba(217,164,65,.3),transparent 60%)}
    .top{display:flex;align-items:center;gap:10px;position:relative;text-decoration:none;color:#fff}
    .mark{width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.16);display:grid;place-items:center}.mark .material-icons{font-size:20px}
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
    .err{background:var(--cf-danger-soft);color:var(--cf-danger);border-radius:var(--cf-radius-sm);padding:9px 12px;font-size:13px;margin:12px 0}
    .ok{background:color-mix(in srgb,#16a34a 12%,transparent);color:#15803d;border:1px solid color-mix(in srgb,#16a34a 30%,transparent);border-radius:var(--cf-radius-sm);padding:11px 13px;font-size:13px;margin:12px 0;display:flex;gap:8px;align-items:flex-start}.ok .material-icons{font-size:18px}
    .primary{width:100%;height:46px;border:0;border-radius:var(--cf-radius-sm);background:var(--cf-brand-600);color:#fff;font:inherit;font-weight:500;font-size:14px;cursor:pointer;margin-top:18px}
    .primary:hover{background:var(--cf-brand-700)} .primary:disabled{opacity:.55;cursor:not-allowed}
    .alt{margin-top:18px;text-align:center;font-size:13px;color:var(--cf-ink-500)}.alt a{color:var(--cf-brand-600);font-weight:600;text-decoration:none}
    .back{display:inline-flex;align-items:center;gap:6px;margin-top:18px;color:var(--cf-brand-600);font-size:13px;font-weight:600;text-decoration:none}.back .material-icons{font-size:17px}
    @media(max-width:860px){.lg{grid-template-columns:1fr}.brand{display:none}}`],
})
export class ForgotPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  loading = signal(false); error = signal(''); sent = signal(false);
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true); this.error.set('');
    this.auth.forgotPassword(this.form.value.email!).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: () => { this.loading.set(false); this.sent.set(true); },
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslocoModule],
  template: `
  <div class="lg">
    <div class="brand">
      <div class="aurora ba1"></div><div class="aurora ba2"></div><div class="dots"></div>
      <a class="top" routerLink="/"><span class="mark"><span class="material-icons">workspace_premium</span></span><span class="bn">Certifada</span></a>
      <div class="mid"><h2>{{ 'auth.resetBrandHeadline' | transloco }}</h2><p>{{ 'auth.resetBrandSub' | transloco }}</p></div>
    </div>
    <div class="form"><div class="inner">
      <span class="badge"><span class="material-icons">lock_reset</span></span>
      <h1>{{ 'auth.resetTitle' | transloco }}</h1><p class="sub">{{ 'auth.resetSub' | transloco }}</p>
      @if (done()) {
        <div class="ok"><span class="material-icons">check_circle</span><span>{{ 'auth.resetDone' | transloco }}</span></div>
        <a class="back" routerLink="/auth/login"><span class="material-icons">login</span> {{ 'auth.goToSignin' | transloco }}</a>
      } @else if (!token) {
        <div class="err">{{ 'auth.resetInvalidLink' | transloco }}</div>
        <a class="back" routerLink="/auth/forgot"><span class="material-icons">arrow_back</span> {{ 'auth.requestNewLink' | transloco }}</a>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="lbl">{{ 'auth.newPassword' | transloco }}</label>
          <div class="inwrap"><span class="material-icons lead">lock</span><input class="in" [type]="show() ? 'text' : 'password'" formControlName="password" [placeholder]="'auth.passwordPh' | transloco" />
            <button type="button" class="trail" (click)="show.set(!show())"><span class="material-icons">{{ show() ? 'visibility_off' : 'visibility' }}</span></button></div>
          <label class="lbl">{{ 'auth.confirmPassword' | transloco }}</label>
          <div class="inwrap"><span class="material-icons lead">lock</span><input class="in" [type]="show() ? 'text' : 'password'" formControlName="confirm" [placeholder]="'auth.confirmPh' | transloco" /></div>
          @if (error()) { <div class="err">{{ error() }}</div> }
          <button type="submit" class="primary" [disabled]="form.invalid || loading()">{{ loading() ? ('auth.saving' | transloco) : ('auth.resetBtn' | transloco) }}</button>
        </form>
      }
    </div></div>
  </div>`,
  styles: [`:host{display:block}
    .lg{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;background:var(--cf-bg);font-family:var(--cf-font)}
    .brand{position:relative;overflow:hidden;background:#070B17;color:#EDF0FF;padding:44px 48px;display:flex;flex-direction:column;isolation:isolate}
    .aurora{position:absolute;border-radius:50%;filter:blur(80px);z-index:-1;pointer-events:none}
    .ba1{width:480px;height:420px;top:-180px;inset-inline-start:-120px;background:radial-gradient(circle,#4338CA,transparent 65%);opacity:.55;animation:drift 18s ease-in-out infinite alternate}
    .ba2{width:420px;height:420px;bottom:-190px;inset-inline-end:-120px;background:radial-gradient(circle,#7C3AED,transparent 62%);opacity:.3;animation:drift 22s ease-in-out infinite alternate-reverse}
    @keyframes drift{from{transform:translate(0,0)}to{transform:translate(40px,26px) scale(1.1)}}
    .dots{position:absolute;inset:0;z-index:-1;background-image:radial-gradient(rgba(255,255,255,.12) 1px,transparent 1px);background-size:24px 24px;mask-image:radial-gradient(ellipse 80% 70% at 50% 40%,#000 30%,transparent 75%)}
    .top{display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff;align-self:flex-start}
    .mark{width:36px;height:36px;border-radius:11px;background:linear-gradient(135deg,#6366F1,#7C3AED);display:grid;place-items:center;box-shadow:0 8px 20px -8px rgba(99,102,241,.8)}
    .mark .material-icons{font-size:21px}
    .bn{font-weight:700;font-size:17.5px;letter-spacing:-.01em}
    .mid{margin:auto 0;position:relative}
    .mid h2{color:#fff;font-size:28px;line-height:1.25;letter-spacing:-.02em;max-width:16ch;font-weight:700}
    .mid p{color:#A9B4D6;margin-top:12px;max-width:40ch;font-size:14.5px;line-height:1.65}
    .form{display:flex;align-items:center;justify-content:center;background:var(--cf-surface);padding:40px 24px}
    .inner{width:100%;max-width:392px}
    .badge{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;background:linear-gradient(135deg,var(--cf-brand-50),var(--cf-accent-50));border:1px solid var(--cf-brand-100);color:var(--cf-brand-600);margin-bottom:18px}
    .badge .material-icons{font-size:24px}
    h1{font-size:26px;color:var(--cf-ink-900);letter-spacing:-.02em;font-weight:700}
    .sub{color:var(--cf-ink-500);margin:6px 0 22px;font-size:14px}
    .lbl{display:block;font-size:12.5px;font-weight:600;color:var(--cf-ink-700);margin:14px 0 7px}
    .inwrap{position:relative}
    .lead{position:absolute;inset-inline-start:13px;top:50%;transform:translateY(-50%);color:var(--cf-ink-400);font-size:19px;transition:color .18s}
    .inwrap:focus-within .lead{color:var(--cf-brand-600)}
    .in{width:100%;height:46px;border:1.5px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-900);border-radius:13px;padding:0 14px;padding-inline-start:42px;font:inherit;font-size:14px;outline:none;transition:border-color .18s,box-shadow .18s}
    .in:focus{border-color:var(--cf-brand-500);box-shadow:0 0 0 4px color-mix(in srgb,var(--cf-brand-500) 14%,transparent)}
    .trail{position:absolute;inset-inline-end:10px;top:50%;transform:translateY(-50%);border:0;background:none;color:var(--cf-ink-400);cursor:pointer;padding:4px;border-radius:8px}
    .trail:hover{color:var(--cf-ink-700)}
    .err{background:var(--cf-danger-soft);color:var(--cf-danger);border-radius:11px;padding:10px 13px;font-size:13px;margin:12px 0}
    .ok{background:color-mix(in srgb,#16a34a 12%,transparent);color:#15803d;border:1px solid color-mix(in srgb,#16a34a 30%,transparent);border-radius:13px;padding:12px 14px;font-size:13px;margin:12px 0;display:flex;gap:9px;align-items:flex-start;line-height:1.55}.ok .material-icons{font-size:18px}
    .primary{width:100%;height:48px;border:0;border-radius:13px;background:linear-gradient(135deg,#6366F1,#4338CA);color:#fff;font:inherit;font-weight:600;font-size:14.5px;cursor:pointer;margin-top:18px;box-shadow:0 12px 26px -12px rgba(79,70,229,.7),inset 0 1px 0 rgba(255,255,255,.18);transition:transform .16s,box-shadow .2s,filter .18s}
    .primary:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.05)}
    .primary:disabled{opacity:.55;cursor:not-allowed}
    .back{display:inline-flex;align-items:center;gap:6px;margin-top:20px;color:var(--cf-brand-600);font-size:13px;font-weight:600;text-decoration:none}.back .material-icons{font-size:17px}
    :host-context([dir=rtl]) .back .material-icons{transform:scaleX(-1)}
    @media(max-width:860px){.lg{grid-template-columns:1fr}.brand{display:none}}
    @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms !important}}`],
})
export class ResetPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private t = inject(TranslocoService);
  token = this.route.snapshot.queryParamMap.get('token') || '';
  show = signal(false); loading = signal(false); error = signal(''); done = signal(false);
  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm: ['', Validators.required],
  });
  submit(): void {
    if (this.form.invalid || !this.token) return;
    const { password, confirm } = this.form.value;
    if (password !== confirm) { this.error.set(this.t.translate('auth.passwordsMismatch')); return; }
    this.loading.set(true); this.error.set('');
    this.auth.resetPassword(this.token, password!).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        const ok = (res?.success ?? res?.Success);
        if (ok) { this.done.set(true); setTimeout(() => this.router.navigateByUrl('/auth/login'), 2500); }
        else this.error.set((res?.message ?? res?.Message) || this.t.translate('auth.resetExpired'));
      },
      error: () => { this.loading.set(false); this.error.set(this.t.translate('auth.resetFailed')); },
    });
  }
}

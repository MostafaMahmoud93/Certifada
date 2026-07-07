import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoModule } from '@ngneat/transloco';
import { WalletService, WalletCredential } from '../../core/services/wallet.service';
import { AlertService } from '../../core/services/alert.service';
import { LanguageService } from '../../core/services/language.service';

type State = 'resolving' | 'request' | 'sent' | 'list';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslocoModule],
  template: `
  <div class="wl">
    <header class="wl-top">
      <a class="brand" routerLink="/"><span class="mark"><span class="material-icons">workspace_premium</span></span><b>Certifada</b></a>
      <div class="wl-acts">
        <button class="signout" (click)="lang.toggle($event)">{{ lang.lang() === 'en' ? 'العربية' : 'English' }}<span class="material-icons">language</span></button>
        @if (state() === 'list') {
          <button class="signout" (click)="signOut()"><span class="material-icons">logout</span>{{ 'wallet.signOut' | transloco }}</button>
        }
      </div>
    </header>

    <main class="wl-main">
      @switch (state()) {
        @case ('resolving') {
          <div class="pane center"><span class="spin"></span><p>{{ 'wallet.opening' | transloco }}</p></div>
        }

        @case ('request') {
          <div class="pane card">
            <span class="hero"><span class="material-icons">account_balance_wallet</span></span>
            <h1>{{ 'wallet.title' | transloco }}</h1>
            <p class="sub">{{ 'wallet.subtitle' | transloco }}</p>
            <label class="lbl">{{ 'wallet.email' | transloco }}</label>
            <div class="inwrap"><span class="material-icons lead">mail</span>
              <input class="in" type="email" [formControl]="emailCtrl" placeholder="you@company.com" (keyup.enter)="send()" /></div>
            @if (error()) { <div class="err">{{ error() }}</div> }
            <button class="primary" [disabled]="emailCtrl.invalid || loading()" (click)="send()">
              {{ loading() ? ('wallet.sending' | transloco) : ('wallet.sendLink' | transloco) }}</button>
            <p class="note"><span class="material-icons">lock</span>{{ 'wallet.privacy' | transloco }}</p>
          </div>
        }

        @case ('sent') {
          <div class="pane card">
            <span class="hero ok"><span class="material-icons">mark_email_read</span></span>
            <h1>{{ 'wallet.checkTitle' | transloco }}</h1>
            <p class="sub">{{ 'wallet.checkDesc' | transloco: { email: sentTo() } }}</p>
            <div class="code-row">
              <label class="lbl">{{ 'wallet.enterCode' | transloco }}</label>
              <div class="inwrap"><span class="material-icons lead">pin</span>
                <input class="in code" inputmode="numeric" maxlength="6" [formControl]="codeCtrl" placeholder="000000" (keyup.enter)="verifyCode()" /></div>
              @if (error()) { <div class="err">{{ error() }}</div> }
              <button class="primary" [disabled]="codeCtrl.invalid || loading()" (click)="verifyCode()">
                {{ loading() ? ('wallet.opening' | transloco) : ('wallet.openWallet' | transloco) }}</button>
            </div>
            <button class="ghost" (click)="state.set('request')"><span class="material-icons">arrow_back</span>{{ 'wallet.useAnother' | transloco }}</button>
          </div>
        }

        @case ('list') {
          <div class="pane wide">
            <div class="wl-head">
              <div><h1>{{ 'wallet.myCreds' | transloco }}</h1><p class="sub">{{ wallet.email() }} · {{ creds().length }} {{ 'wallet.credentials' | transloco }}</p></div>
              <div class="search"><span class="material-icons">search</span><input [formControl]="searchCtrl" [placeholder]="'wallet.search' | transloco" /></div>
            </div>

            @if (filtered().length === 0) {
              <div class="empty"><span class="material-icons">inbox</span><p>{{ 'wallet.empty' | transloco }}</p></div>
            } @else {
              <div class="grid">
                @for (c of filtered(); track c.id) {
                  <article class="cred" [class.revoked]="isRevoked(c)">
                    <div class="cr-top">
                      <span class="cr-seal"><span class="material-icons">{{ isRevoked(c) ? 'gpp_bad' : 'workspace_premium' }}</span></span>
                      <span class="cr-badge" [class.bad]="isRevoked(c)">{{ (isRevoked(c) ? 'wallet.revoked' : 'wallet.valid') | transloco }}</span>
                    </div>
                    <h3>{{ c.title }}</h3>
                    <p class="cr-iss">{{ c.issuer }}</p>
                    <p class="cr-date">{{ c.issuedAt ? (c.issuedAt | date: 'mediumDate') : '' }}</p>
                    <div class="cr-acts">
                      <a class="cbtn primary" [routerLink]="['/verify', c.id]"><span class="material-icons">open_in_new</span>{{ 'wallet.open' | transloco }}</a>
                      @if (c.downloadUrl) { <a class="cbtn" [href]="c.downloadUrl" target="_blank" rel="noopener"><span class="material-icons">download</span></a> }
                      <button class="cbtn" (click)="copyLink(c)"><span class="material-icons">link</span></button>
                    </div>
                  </article>
                }
              </div>
            }
          </div>
        }
      }
    </main>
    <footer class="wl-foot"><a routerLink="/">{{ 'wallet.poweredBy' | transloco }}</a></footer>
  </div>
  `,
  styles: [`
    :host{display:block;min-height:100vh;background:
      radial-gradient(900px 460px at 12% -10%, color-mix(in srgb,var(--cf-brand-500) 12%,transparent), transparent 60%),
      radial-gradient(760px 420px at 100% 0%, color-mix(in srgb,var(--cf-accent2-500) 10%,transparent), transparent 55%),
      var(--cf-bg);font-family:var(--cf-font)}
    .wl{min-height:100vh;display:flex;flex-direction:column}
    .wl-top{display:flex;align-items:center;justify-content:space-between;padding:16px 22px;max-width:1120px;margin:0 auto;width:100%}
    .brand{display:inline-flex;align-items:center;gap:9px;text-decoration:none;color:var(--cf-ink-900);font-size:17px}
    .brand b{font-weight:800}
    .mark{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#6366F1,#7C3AED);color:#fff;display:grid;place-items:center}
    .mark .material-icons{font-size:19px}
    .wl-acts{display:inline-flex;align-items:center;gap:8px}
    .signout{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:13px;font-weight:600;color:var(--cf-ink-600);background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:999px;padding:8px 14px;cursor:pointer}
    .signout:hover{border-color:var(--cf-brand-500);color:var(--cf-brand-600)}
    .signout .material-icons{font-size:16px}
    .wl-main{flex:1;display:flex;justify-content:center;padding:22px}
    .pane{width:100%}
    .pane.center{display:grid;place-items:center;gap:14px;color:var(--cf-ink-500);padding-top:12vh}
    .card{max-width:420px;margin:6vh auto 0;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:22px;padding:34px 30px;box-shadow:var(--cf-shadow-md);text-align:center}
    .hero{width:60px;height:60px;border-radius:18px;display:grid;place-items:center;margin:0 auto 16px;background:linear-gradient(135deg,var(--cf-brand-50),var(--cf-accent-50));border:1px solid var(--cf-brand-100);color:var(--cf-brand-600)}
    .hero.ok{background:color-mix(in srgb,#16a34a 12%,transparent);border-color:color-mix(in srgb,#16a34a 30%,transparent);color:#15803d}
    .hero .material-icons{font-size:28px}
    h1{font-size:23px;color:var(--cf-ink-900);letter-spacing:-.02em}
    .sub{color:var(--cf-ink-500);font-size:14px;margin:7px 0 20px;line-height:1.6}
    .lbl{display:block;text-align:start;font-size:12.5px;font-weight:600;color:var(--cf-ink-700);margin:12px 0 7px}
    .inwrap{position:relative}
    .lead{position:absolute;inset-inline-start:13px;top:50%;transform:translateY(-50%);color:var(--cf-ink-400);font-size:19px}
    .in{width:100%;height:46px;border:1.5px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-900);border-radius:13px;padding:0 14px;padding-inline-start:42px;font:inherit;font-size:14px;outline:none;transition:border-color .18s,box-shadow .18s}
    .in:focus{border-color:var(--cf-brand-500);box-shadow:0 0 0 4px color-mix(in srgb,var(--cf-brand-500) 14%,transparent)}
    .in.code{letter-spacing:8px;font-weight:700;font-size:20px;text-align:center;padding-inline-start:42px}
    .err{background:var(--cf-danger-soft);color:var(--cf-danger);border-radius:11px;padding:9px 12px;font-size:13px;margin:12px 0}
    .primary{width:100%;height:48px;margin-top:16px;border:0;border-radius:13px;background:linear-gradient(135deg,#6366F1,#4338CA);color:#fff;font:inherit;font-weight:600;font-size:14.5px;cursor:pointer;box-shadow:0 12px 26px -12px rgba(79,70,229,.7)}
    .primary:hover:not(:disabled){filter:brightness(1.05)}
    .primary:disabled{opacity:.55;cursor:not-allowed}
    .ghost{display:inline-flex;align-items:center;gap:6px;margin-top:16px;background:none;border:0;color:var(--cf-brand-600);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
    :host-context([dir=rtl]) .ghost .material-icons{transform:scaleX(-1)}
    .note{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:18px;font-size:12px;color:var(--cf-ink-400);line-height:1.5}
    .note .material-icons{font-size:15px}
    .spin{width:34px;height:34px;border-radius:50%;border:3px solid var(--cf-line);border-top-color:var(--cf-brand-500);animation:sp 1s linear infinite}
    @keyframes sp{to{transform:rotate(360deg)}}

    .pane.wide{max-width:1120px;margin:0 auto}
    .wl-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:10px 0 22px;flex-wrap:wrap}
    .wl-head h1{font-size:26px}
    .search{display:inline-flex;align-items:center;gap:8px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:999px;padding:9px 16px;min-width:240px}
    .search .material-icons{font-size:18px;color:var(--cf-ink-400)}
    .search input{border:0;background:none;outline:none;font:inherit;font-size:14px;color:var(--cf-ink-900);width:100%}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
    .cred{background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:18px;padding:20px;transition:transform .2s,box-shadow .25s,border-color .2s;display:flex;flex-direction:column}
    .cred:hover{transform:translateY(-3px);box-shadow:0 26px 52px -28px rgba(15,23,42,.28);border-color:color-mix(in srgb,var(--cf-brand-500) 30%,var(--cf-line))}
    .cred.revoked{opacity:.7}
    .cr-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
    .cr-seal{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,var(--cf-brand-50),var(--cf-accent-50));color:var(--cf-brand-600);border:1px solid var(--cf-brand-100)}
    .cred.revoked .cr-seal{background:var(--cf-danger-soft);color:var(--cf-danger);border-color:transparent}
    .cr-seal .material-icons{font-size:22px}
    .cr-badge{font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;background:var(--cf-success-soft);color:var(--cf-success)}
    .cr-badge.bad{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .cred h3{font-size:15.5px;color:var(--cf-ink-900);line-height:1.3}
    .cr-iss{font-size:13px;color:var(--cf-ink-600);margin-top:4px}
    .cr-date{font-size:12px;color:var(--cf-ink-400);margin-top:2px}
    .cr-acts{display:flex;gap:8px;margin-top:16px}
    .cbtn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:38px;padding:0 12px;border-radius:11px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-700);font:inherit;font-size:13px;font-weight:600;cursor:pointer;text-decoration:none;transition:.18s}
    .cbtn:hover{border-color:var(--cf-brand-500);color:var(--cf-brand-600)}
    .cbtn.primary{flex:1;background:linear-gradient(135deg,#6366F1,#4338CA);color:#fff;border-color:transparent}
    .cbtn .material-icons{font-size:16px}
    .empty{text-align:center;color:var(--cf-ink-400);padding:8vh 0}
    .empty .material-icons{font-size:46px;opacity:.5}
    .wl-foot{text-align:center;padding:22px}
    .wl-foot a{color:var(--cf-ink-400);font-size:12.5px;text-decoration:none}
    @media(prefers-reduced-motion:reduce){.spin{animation-duration:.01ms}}
  `],
})
export class WalletPage implements OnInit {
  wallet = inject(WalletService);
  lang = inject(LanguageService);
  private route = inject(ActivatedRoute);
  private alerts = inject(AlertService);

  state = signal<State>('request');
  loading = signal(false);
  error = signal('');
  sentTo = signal('');
  creds = signal<WalletCredential[]>([]);

  emailCtrl = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  codeCtrl = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{6}$/)] });
  searchCtrl = new FormControl('', { nonNullable: true });
  private search = signal('');

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.creds();
    if (!q) return list;
    return list.filter((c) => (c.title + ' ' + c.issuer).toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.searchCtrl.valueChanges.subscribe((v) => this.search.set(v || ''));
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) { this.resolveToken(token); return; }
    if (this.wallet.isOpen) { this.state.set('resolving'); this.load(); return; }
    this.state.set('request');
  }

  private resolveToken(token: string): void {
    this.state.set('resolving');
    this.wallet.exchange({ token }).subscribe({
      next: (res) => { if (res?.success) this.load(); else { this.error.set(res?.message || ''); this.state.set('request'); } },
      error: () => this.state.set('request'),
    });
  }

  send(): void {
    if (this.emailCtrl.invalid) return;
    this.loading.set(true); this.error.set('');
    const email = this.emailCtrl.value.trim();
    this.wallet.requestLink({ email }).subscribe({
      next: () => { this.loading.set(false); this.sentTo.set(email); this.state.set('sent'); },
      error: () => { this.loading.set(false); this.sentTo.set(email); this.state.set('sent'); }, // never reveal
    });
  }

  verifyCode(): void {
    if (this.codeCtrl.invalid) return;
    this.loading.set(true); this.error.set('');
    this.wallet.exchange({ email: this.sentTo(), code: this.codeCtrl.value.trim() }).subscribe({
      next: (res) => { this.loading.set(false); if (res?.success) this.load(); else this.error.set(res?.message || ''); },
      error: () => { this.loading.set(false); this.error.set(''); },
    });
  }

  private load(): void {
    this.wallet.credentials().subscribe({
      next: (res) => { this.creds.set(res?.data || []); this.state.set('list'); },
      error: () => { this.wallet.signOut(); this.state.set('request'); },
    });
  }

  isRevoked(c: WalletCredential): boolean { return (c.status || '').toLowerCase() === 'revoked'; }

  copyLink(c: WalletCredential): void {
    const url = `${location.origin}/verify/${c.id}`;
    navigator.clipboard?.writeText(url).then(() => this.alerts.success('Verification link copied.')).catch(() => {});
  }

  signOut(): void { this.wallet.signOut(); this.creds.set([]); this.emailCtrl.reset(); this.codeCtrl.reset(); this.state.set('request'); }
}

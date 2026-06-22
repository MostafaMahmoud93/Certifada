import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AlertService } from '../../core/services/alert.service';

interface ApiToken { id: number; name: string; scope: string; masked: string; created: string; lastUsed: string; }
interface Integration { key: string; name: string; desc: string; icon: string; connected: boolean; }
interface Webhook { id: number; url: string; active: boolean; }

@Component({
  selector: 'app-developers',
  standalone: true,
  imports: [FormsModule],
  template: `
  <div class="intro">
    <h2>Developer tools</h2>
    <p class="cf-muted">Integrate Certifada into your stack — REST API, access tokens, webhooks and more.</p>
  </div>

  <!-- API base -->
  <div class="card sect">
    <h3>API base URL</h3>
    <p class="cf-muted">Point your integrations and SDKs here.</p>
    <div class="code-row">
      <code>{{ apiBase }}</code>
      <button class="cf-btn cf-btn-secondary sm" (click)="copy(apiBase)"><span class="material-icons">content_copy</span> Copy</button>
    </div>
    <a class="docs" [href]="apiBase + '/swagger'" target="_blank" rel="noopener"><span class="material-icons">description</span> Open the API reference</a>
  </div>

  <!-- Access tokens -->
  <div class="card sect">
    <div class="srow">
      <div><h3>Access tokens</h3><p class="cf-muted">Authenticate requests with <code>Authorization: Bearer &lt;token&gt;</code></p></div>
      <button class="cf-btn cf-btn-primary" (click)="openCreate()"><span class="material-icons">add</span> Create token</button>
    </div>

    @if (createOpen()) {
      <div class="create">
        <label class="fld">Token name<input [(ngModel)]="tokenName" placeholder="e.g. Production server" /></label>
        <label class="fld">Scope<select [(ngModel)]="tokenScope"><option>Read only</option><option>Read &amp; write</option><option>Full access</option></select></label>
        <div class="ca">
          <button class="cf-btn cf-btn-secondary" (click)="createOpen.set(false)">Cancel</button>
          <button class="cf-btn cf-btn-primary" [disabled]="!tokenName.trim()" (click)="createToken()">Generate</button>
        </div>
      </div>
    }

    @if (revealed(); as rt) {
      <div class="reveal">
        <span class="material-icons">vpn_key</span>
        <div class="rv"><strong>Copy your token now — you won't be able to see it again.</strong><code>{{ rt }}</code></div>
        <button class="cf-btn cf-btn-secondary sm" (click)="copy(rt)"><span class="material-icons">content_copy</span></button>
        <button class="rx" (click)="revealed.set(null)"><span class="material-icons">close</span></button>
      </div>
    }

    @if (tokens().length === 0) {
      <p class="cf-muted empty">No tokens yet — create one to start using the API.</p>
    } @else {
      <div class="tbl">
        <table>
          <thead><tr><th>Name</th><th>Token</th><th>Scope</th><th>Created</th><th>Last used</th><th></th></tr></thead>
          <tbody>
            @for (t of tokens(); track t.id) {
              <tr>
                <td><strong>{{ t.name }}</strong></td>
                <td><code>{{ t.masked }}</code></td>
                <td>{{ t.scope }}</td>
                <td>{{ t.created }}</td>
                <td>{{ t.lastUsed }}</td>
                <td class="r"><button class="ic danger" title="Revoke" (click)="revoke(t)"><span class="material-icons">delete</span></button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  </div>

  <!-- Integrations -->
  <div class="card sect">
    <h3>API integrations</h3>
    <p class="cf-muted">Connect Certifada to the tools you already use.</p>
    <div class="integ">
      @for (i of integrations(); track i.key) {
        <div class="ig" [class.on]="i.connected">
          <span class="ig-ic"><span class="material-icons">{{ i.icon }}</span></span>
          <div class="ig-m"><strong>{{ i.name }}</strong><small class="cf-muted">{{ i.desc }}</small></div>
          @if (i.connected) { <span class="pill">Connected</span> }
          <button class="cf-btn sm" [class.cf-btn-secondary]="i.connected" [class.cf-btn-primary]="!i.connected" (click)="toggleInteg(i)">{{ i.connected ? 'Disconnect' : 'Connect' }}</button>
        </div>
      }
    </div>
  </div>

  <!-- Webhooks -->
  <div class="card sect">
    <h3>Webhooks</h3>
    <p class="cf-muted">Get a POST callback when a credential is issued, approved or revoked.</p>
    <div class="wh-add">
      <input [(ngModel)]="webhookUrl" placeholder="https://your-service.com/webhook" />
      <button class="cf-btn cf-btn-primary" [disabled]="!webhookUrl.trim()" (click)="addWebhook()">Add endpoint</button>
    </div>
    @for (w of webhooks(); track w.id) {
      <div class="wh" [class.off]="!w.active">
        <span class="material-icons" [class.ok]="w.active">{{ w.active ? 'check_circle' : 'pause_circle' }}</span>
        <code>{{ w.url }}</code>
        <span class="sp"></span>
        <button class="ic" [title]="w.active ? 'Pause' : 'Resume'" (click)="toggleWebhook(w)"><span class="material-icons">{{ w.active ? 'pause' : 'play_arrow' }}</span></button>
        <button class="ic danger" title="Delete" (click)="removeWebhook(w)"><span class="material-icons">delete</span></button>
      </div>
    }
  </div>

  <p class="soon cf-muted"><span class="material-icons">construction</span> More coming soon — SDKs, OAuth apps and usage analytics.</p>
  `,
  styles: [`
    :host{display:block}
    .intro{margin-bottom:18px}
    .intro h2{font-size:20px;color:var(--cf-ink-900)}
    .intro p{font-size:13.5px;margin-top:4px}
    .sect{padding:20px;margin-bottom:16px}
    .sect h3{font-size:15px;color:var(--cf-ink-900)}
    .sect>.cf-muted{font-size:13px;margin:4px 0 0}
    .srow{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:6px}
    .cf-btn .material-icons{font-size:17px}
    .cf-btn.sm{padding:7px 12px;font-size:13px}
    code{font-family:'Courier New',monospace;font-size:13px;background:var(--cf-surface-2);color:var(--cf-brand-700);padding:2px 7px;border-radius:5px}
    .code-row{display:flex;align-items:center;gap:10px;margin-top:12px}
    .code-row code{flex:1;padding:11px 13px;font-size:13.5px;color:var(--cf-ink-800);overflow:auto;white-space:nowrap}
    .docs{display:inline-flex;align-items:center;gap:7px;margin-top:12px;font-size:13px;font-weight:600;color:var(--cf-brand-600);text-decoration:none}
    .docs:hover{text-decoration:underline}
    .docs .material-icons{font-size:18px}
    .create{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;padding:16px;background:var(--cf-surface-2);border-radius:var(--cf-radius-md)}
    .fld{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:500;color:var(--cf-ink-600)}
    input,select{height:38px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);padding:0 10px;font:inherit;font-size:13.5px;background:var(--cf-surface);color:var(--cf-ink-900);outline:none}
    input:focus,select:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .ca{grid-column:1 / -1;display:flex;justify-content:flex-end;gap:10px}
    .reveal{display:flex;align-items:center;gap:12px;margin-top:14px;padding:13px 15px;border:1px solid var(--cf-brand-200);background:var(--cf-brand-50);border-radius:var(--cf-radius-md)}
    .reveal>.material-icons{color:var(--cf-brand-600)}
    .rv{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
    .rv strong{font-size:12.5px;color:var(--cf-brand-700)}
    .rv code{background:var(--cf-surface);overflow:auto;white-space:nowrap}
    .rx{border:0;background:none;color:var(--cf-ink-400);cursor:pointer}
    .empty{padding:16px 0 2px}
    .tbl{margin-top:14px;overflow:auto}
    table{width:100%;border-collapse:collapse}
    thead th{text-align:start;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-400);padding:9px 10px;border-bottom:1px solid var(--cf-line)}
    tbody td{padding:11px 10px;border-bottom:1px solid var(--cf-line);font-size:13px;color:var(--cf-ink-700)}
    tbody tr:last-child td{border-bottom:0}
    td.r{text-align:end}
    .ic{width:32px;height:32px;border-radius:8px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-500);display:inline-grid;place-items:center;cursor:pointer;margin-inline-start:4px}
    .ic:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .ic.danger:hover{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .ic .material-icons{font-size:17px}
    .integ{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:14px}
    .ig{display:flex;align-items:center;gap:12px;padding:13px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-md)}
    .ig.on{border-color:var(--cf-brand-200);background:var(--cf-brand-50)}
    .ig-ic{width:38px;height:38px;border-radius:10px;background:var(--cf-surface-2);color:var(--cf-ink-700);display:grid;place-items:center;flex:none}
    .ig.on .ig-ic{background:var(--cf-surface);color:var(--cf-brand-600)}
    .ig-ic .material-icons{font-size:20px}
    .ig-m{flex:1;min-width:0;display:flex;flex-direction:column}
    .ig-m strong{font-size:13.5px;color:var(--cf-ink-900)}
    .ig-m small{font-size:11.5px}
    .pill{font-size:10.5px;font-weight:700;color:#15803d;background:#dcfce7;padding:3px 8px;border-radius:999px}
    .wh-add{display:flex;gap:8px;margin:14px 0 12px}
    .wh-add input{flex:1}
    .wh{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);margin-bottom:8px}
    .wh.off{opacity:.6}
    .wh>.material-icons{font-size:18px;color:var(--cf-ink-400)}
    .wh>.material-icons.ok{color:#16a34a}
    .wh code{flex:none}
    .wh .sp{flex:1}
    .soon{display:flex;align-items:center;gap:8px;font-size:13px;justify-content:center;margin-top:6px}
    .soon .material-icons{font-size:18px;color:var(--cf-brand-500)}
    @media(max-width:780px){.create,.integ{grid-template-columns:1fr}}
  `],
})
export class DevelopersSectionComponent {
  private alerts = inject(AlertService);
  apiBase = environment.apiURL;

  private seq = 1;
  createOpen = signal(false);
  tokenName = '';
  tokenScope = 'Read & write';
  revealed = signal<string | null>(null);

  tokens = signal<ApiToken[]>([
    { id: 1, name: 'Production server', scope: 'Full access', masked: 'cf_live_••••••••a4f9', created: '2026-05-20', lastUsed: '2 hours ago' },
  ]);

  integrations = signal<Integration[]>([
    { key: 'rest', name: 'REST API', desc: 'Direct HTTP access to your data', icon: 'api', connected: true },
    { key: 'webhooks', name: 'Webhooks', desc: 'Event callbacks to your endpoints', icon: 'webhook', connected: true },
    { key: 'zapier', name: 'Zapier', desc: 'Automate with 6,000+ apps', icon: 'bolt', connected: false },
    { key: 'slack', name: 'Slack', desc: 'Post issuance updates to a channel', icon: 'tag', connected: false },
    { key: 'sheets', name: 'Google Sheets', desc: 'Generate from a spreadsheet', icon: 'table_chart', connected: false },
    { key: 'teams', name: 'Microsoft Teams', desc: 'Notify your team', icon: 'groups', connected: false },
  ]);

  webhooks = signal<Webhook[]>([
    { id: 1, url: 'https://hooks.example.com/certifada', active: true },
  ]);
  webhookUrl = '';

  copy(text: string): void {
    try {
      navigator.clipboard?.writeText(text);
      this.alerts.success('Copied to clipboard.');
    } catch {
      this.alerts.info('Select and copy manually.');
    }
  }

  openCreate(): void { this.tokenName = ''; this.tokenScope = 'Read & write'; this.createOpen.set(true); }
  createToken(): void {
    if (!this.tokenName.trim()) return;
    const full = 'cf_live_' + this.rand(32);
    this.tokens.update((l) => [...l, {
      id: ++this.seq,
      name: this.tokenName.trim(),
      scope: this.tokenScope,
      masked: 'cf_live_••••••••' + full.slice(-4),
      created: new Date().toISOString().slice(0, 10),
      lastUsed: 'Never',
    }]);
    this.revealed.set(full);
    this.createOpen.set(false);
    this.alerts.success('Access token created.');
  }
  async revoke(t: ApiToken): Promise<void> {
    const ok = await this.alerts.confirm({ title: 'Revoke token', message: 'Revoke “' + t.name + '”? Apps using it will stop working immediately.', danger: true, confirmText: 'Revoke' });
    if (!ok) return;
    this.tokens.update((l) => l.filter((x) => x.id !== t.id));
    this.alerts.info('Token revoked.');
  }

  toggleInteg(i: Integration): void {
    this.integrations.update((l) => l.map((x) => (x.key === i.key ? { ...x, connected: !x.connected } : x)));
    this.alerts.success(i.name + (i.connected ? ' disconnected.' : ' connected.'));
  }

  addWebhook(): void {
    const url = this.webhookUrl.trim();
    if (!url) return;
    this.webhooks.update((l) => [...l, { id: ++this.seq, url, active: true }]);
    this.webhookUrl = '';
    this.alerts.success('Webhook endpoint added.');
  }
  toggleWebhook(w: Webhook): void { this.webhooks.update((l) => l.map((x) => (x.id === w.id ? { ...x, active: !x.active } : x))); }
  removeWebhook(w: Webhook): void { this.webhooks.update((l) => l.filter((x) => x.id !== w.id)); }

  private rand(n: number): string {
    const c = 'abcdef0123456789';
    let s = '';
    for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)];
    return s;
  }
}

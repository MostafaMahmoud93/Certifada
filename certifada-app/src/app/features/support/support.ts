import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';
import { DevelopersSectionComponent } from './developers';

interface Faq { q: string; a: string; cat: string; }
interface Topic { icon: string; title: string; desc: string; key: string; }

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [FormsModule, DevelopersSectionComponent],
  template: `
  <div class="subnav">
    <button [class.on]="section() === 'help'" (click)="section.set('help')"><span class="material-icons">help_center</span> Help center</button>
    <button [class.on]="section() === 'dev'" (click)="section.set('dev')"><span class="material-icons">code</span> Developers</button>
  </div>

  @if (section() === 'help') {
  <!-- Hero -->
  <div class="hero">
    <span class="status"><i></i> All systems operational</span>
    <h1>How can we help?</h1>
    <p>Search our help center, browse topics, or reach our team — we usually reply within a few hours.</p>
    <div class="hsearch">
      <span class="material-icons">search</span>
      <input [(ngModel)]="q" placeholder="Search for help, e.g. “bulk generate” or “domain”" />
      @if (q) { <button class="clr" (click)="q=''" aria-label="Clear"><span class="material-icons">close</span></button> }
    </div>
  </div>

  <!-- Quick actions -->
  <div class="quick">
    @for (a of quick; track a.title) {
      <button class="qcard" (click)="quickAction(a.key)">
        <span class="qic" [style.background]="a.bg" [style.color]="a.fg"><span class="material-icons">{{ a.icon }}</span></span>
        <strong>{{ a.title }}</strong>
        <small class="cf-muted">{{ a.desc }}</small>
      </button>
    }
  </div>

  <!-- Browse by topic -->
  @if (!q) {
    <h2 class="sec">Browse by topic</h2>
    <div class="topics">
      @for (t of topics; track t.key) {
        <button class="tcard" (click)="q = t.key">
          <span class="material-icons">{{ t.icon }}</span>
          <span class="tt"><strong>{{ t.title }}</strong><small class="cf-muted">{{ t.desc }}</small></span>
          <span class="material-icons go">chevron_right</span>
        </button>
      }
    </div>
  }

  <!-- FAQ -->
  <h2 class="sec">{{ q ? 'Search results' : 'Frequently asked questions' }}</h2>
  @if (filteredFaqs().length === 0) {
    <div class="empty"><span class="material-icons">help_outline</span><p class="cf-muted">No articles match “{{ q }}”. Try another term, or contact us below.</p></div>
  } @else {
    <div class="faqs">
      @for (f of filteredFaqs(); track f.q; let i = $index) {
        <div class="faq" [class.open]="open() === i">
          <button class="faq-q" (click)="open.set(open() === i ? -1 : i)">
            <span>{{ f.q }}</span><span class="material-icons chev">expand_more</span>
          </button>
          @if (open() === i) { <div class="faq-a">{{ f.a }}</div> }
        </div>
      }
    </div>
  }

  <!-- Contact -->
  <div class="contact card" id="contact">
    <div class="c-left">
      <span class="cic"><span class="material-icons">support_agent</span></span>
      <h3>Still need help?</h3>
      <p class="cf-muted">Send us a message and our team will get back to you. We typically reply within a few hours on business days.</p>
      <div class="c-meta">
        <span><span class="material-icons">mail</span> support&#64;certifada.com</span>
        <span><span class="material-icons">schedule</span> Sun–Thu, 9am–6pm</span>
      </div>
    </div>
    <div class="c-form">
      <div class="two">
        <label class="fld">Your name<input [(ngModel)]="name" /></label>
        <label class="fld">Email<input [(ngModel)]="email" type="email" /></label>
      </div>
      <div class="two">
        <label class="fld">Category<select [(ngModel)]="category">@for (c of categories; track c) { <option [value]="c">{{ c }}</option> }</select></label>
        <label class="fld">Subject<input [(ngModel)]="subject" placeholder="How can we help?" /></label>
      </div>
      <label class="fld">Message<textarea [(ngModel)]="message" rows="4" placeholder="Describe your question or issue…"></textarea></label>
      <div class="c-actions">
        <button class="cf-btn cf-btn-primary" [disabled]="!subject.trim() || !message.trim()" (click)="send()">
          <span class="material-icons">send</span> Send message
        </button>
      </div>
    </div>
  </div>
  }

  @if (section() === 'dev') { <app-developers /> }
  `,
  styles: [`
    :host{display:block}
    .subnav{display:flex;gap:6px;margin-bottom:18px;border-bottom:1px solid var(--cf-line)}
    .subnav button{display:flex;align-items:center;gap:7px;padding:10px 16px;border:0;background:none;color:var(--cf-ink-500);font:inherit;font-size:14px;font-weight:600;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
    .subnav button:hover{color:var(--cf-ink-900)}
    .subnav button.on{color:var(--cf-brand-700);border-bottom-color:var(--cf-brand-600)}
    .subnav .material-icons{font-size:18px}
    .hero{position:relative;border-radius:var(--cf-radius-lg);padding:40px 24px 30px;text-align:center;color:#fff;overflow:hidden;background:linear-gradient(135deg,var(--cf-brand-600),var(--cf-brand-700) 60%,#312e81);box-shadow:var(--cf-shadow-sm)}
    .status{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;padding:5px 11px;border-radius:999px;background:rgba(255,255,255,.15);margin-bottom:14px}
    .status i{width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 3px rgba(74,222,128,.3)}
    .hero h1{font-size:30px;font-weight:700;margin-bottom:8px}
    .hero p{font-size:14px;opacity:.9;max-width:560px;margin:0 auto 20px}
    .hsearch{display:flex;align-items:center;gap:10px;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:0 14px;height:52px;box-shadow:var(--cf-shadow-lg)}
    .hsearch .material-icons{color:var(--cf-ink-400);font-size:22px}
    .hsearch input{flex:1;border:0;outline:none;font:inherit;font-size:15px;color:var(--cf-ink-900);background:none}
    .hsearch .clr{border:0;background:none;color:var(--cf-ink-400);cursor:pointer;display:grid;place-items:center}
    .hsearch .clr .material-icons{font-size:18px}

    .quick{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:-26px;position:relative;z-index:2;padding:0 6px}
    .qcard{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:16px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-md);background:var(--cf-surface);box-shadow:var(--cf-shadow-sm);cursor:pointer;text-align:start;transition:transform .12s,box-shadow .12s}
    .qcard:hover{transform:translateY(-2px);box-shadow:var(--cf-shadow-lg)}
    .qic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;margin-bottom:4px}
    .qic .material-icons{font-size:21px}
    .qcard strong{font-size:14px;color:var(--cf-ink-900)}
    .qcard small{font-size:12px}

    .sec{font-size:16px;color:var(--cf-ink-900);margin:30px 0 14px}
    .topics{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
    .tcard{display:flex;align-items:center;gap:13px;padding:15px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-md);background:var(--cf-surface);cursor:pointer;text-align:start;transition:border-color .12s,background .12s}
    .tcard:hover{border-color:var(--cf-brand-400);background:var(--cf-brand-50)}
    .tcard>.material-icons{font-size:24px;color:var(--cf-brand-600);flex:none}
    .tt{flex:1;min-width:0;display:flex;flex-direction:column}
    .tt strong{font-size:14px;color:var(--cf-ink-900)}
    .tt small{font-size:12px}
    .tcard .go{color:var(--cf-ink-400);font-size:20px}

    .faqs{display:flex;flex-direction:column;gap:8px}
    .faq{border:1px solid var(--cf-line);border-radius:var(--cf-radius-md);background:var(--cf-surface);overflow:hidden}
    .faq.open{border-color:var(--cf-brand-300)}
    .faq-q{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:14px 16px;border:0;background:none;font:inherit;font-size:14px;font-weight:600;color:var(--cf-ink-900);cursor:pointer;text-align:start}
    .faq-q .chev{color:var(--cf-ink-400);transition:transform .18s}
    .faq.open .chev{transform:rotate(180deg);color:var(--cf-brand-600)}
    .faq-a{padding:0 16px 16px;font-size:13.5px;line-height:1.6;color:var(--cf-ink-600)}
    .empty{text-align:center;padding:30px;color:var(--cf-ink-500)}
    .empty .material-icons{font-size:36px;color:var(--cf-brand-400)}

    .contact{display:grid;grid-template-columns:1fr 1.3fr;gap:24px;margin-top:30px;padding:24px}
    .cic{width:46px;height:46px;border-radius:12px;background:var(--cf-brand-50);color:var(--cf-brand-600);display:grid;place-items:center;margin-bottom:12px}
    .cic .material-icons{font-size:24px}
    .c-left h3{font-size:18px;color:var(--cf-ink-900);margin-bottom:6px}
    .c-left p{font-size:13px;line-height:1.6}
    .c-meta{display:flex;flex-direction:column;gap:8px;margin-top:16px}
    .c-meta span{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--cf-ink-700)}
    .c-meta .material-icons{font-size:17px;color:var(--cf-ink-400)}
    .c-form{display:flex;flex-direction:column;gap:12px}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .fld{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:500;color:var(--cf-ink-600)}
    input,select,textarea{border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);padding:9px 11px;font:inherit;font-size:14px;background:var(--cf-surface);color:var(--cf-ink-900);outline:none}
    input,select{height:40px;padding:0 11px}
    textarea{resize:vertical}
    input:focus,select:focus,textarea:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .c-actions{display:flex;justify-content:flex-end}
    .cf-btn .material-icons{font-size:18px}
    @media(max-width:900px){.quick{grid-template-columns:repeat(2,1fr)}.contact{grid-template-columns:1fr}}
    @media(max-width:560px){.quick,.topics,.two{grid-template-columns:1fr}.hero h1{font-size:24px}}
  `],
})
export class SupportPage {
  private auth = inject(AuthService);
  private alerts = inject(AlertService);

  section = signal<'help' | 'dev'>('help');
  q = '';
  open = signal(-1);

  quick = [
    { icon: 'menu_book', title: 'Documentation', desc: 'Guides & how-tos', key: 'docs', bg: 'var(--cf-brand-50)', fg: 'var(--cf-brand-600)' },
    { icon: 'smart_display', title: 'Video tutorials', desc: 'Watch & learn', key: 'videos', bg: '#fef3c7', fg: '#b45309' },
    { icon: 'support_agent', title: 'Contact support', desc: 'Message our team', key: 'contact', bg: '#dcfce7', fg: '#15803d' },
    { icon: 'forum', title: 'Community', desc: 'Ask other users', key: 'community', bg: '#fce7f3', fg: '#be185d' },
  ];

  topics: Topic[] = [
    { icon: 'rocket_launch', title: 'Getting started', desc: 'Set up your account and first design', key: 'started' },
    { icon: 'design_services', title: 'The designer', desc: 'Canvas, text, shapes, images & layers', key: 'designer' },
    { icon: 'data_object', title: 'Variables & bulk', desc: 'Dynamic fields and mass generation', key: 'bulk' },
    { icon: 'workspace_premium', title: 'Credentials & approvals', desc: 'Issue, review and revoke', key: 'credentials' },
    { icon: 'palette', title: 'Branding & domain', desc: 'Brand kit and your .certifada.com', key: 'brand' },
    { icon: 'bolt', title: 'Automation', desc: 'Workflows, emails and reviews', key: 'automation' },
    { icon: 'account_circle', title: 'Account & billing', desc: 'Plans, invoices and limits', key: 'billing' },
    { icon: 'lock', title: 'Security & privacy', desc: 'How we protect your data', key: 'security' },
  ];

  faqs: Faq[] = [
    { cat: 'started', q: 'How do I create my first certificate?', a: 'Click “New template” from the dashboard or sidebar to open the designer. Add text, images and dynamic fields, then save — your design is ready to issue.' },
    { cat: 'designer bulk', q: 'How do I add dynamic fields (variables)?', a: 'In the designer, open the Variables tab and click a field like {{name}} or {{date}} to drop it on the canvas. Each one is filled in automatically per recipient.' },
    { cat: 'bulk', q: 'How does bulk generation work?', a: 'Open a saved template and choose Bulk. Upload a spreadsheet or paste rows; we merge each row into the design and produce a certificate for every recipient, ready to download or email.' },
    { cat: 'brand designer', q: 'Can I use my own fonts and brand colors?', a: 'Yes. Add them in the Branding page (logo, palette and fonts) or during onboarding. They become available across the designer and exports.' },
    { cat: 'brand domain', q: 'How do I get my own .certifada.com domain?', a: 'Complete your profile from the dashboard popup and pick an available name. Your domain becomes the address for your published credentials.' },
    { cat: 'credentials', q: 'How do approvals work?', a: 'Add a “Send for review” step in an Automation workflow, or flag a credential as pending. Reviewers handle it in the Approvals queue, approving or rejecting with a reason.' },
    { cat: 'designer', q: 'How do I export to PDF or PNG?', a: 'Use the Export menu in the designer toolbar to download PNG, PDF, SVG or the raw JSON template. Bulk batches can be exported together as a ZIP.' },
    { cat: 'security', q: 'Is my data secure?', a: 'Your designs and recipient data are stored against your account and scoped to your organization. Access is controlled by roles and permissions you manage under Roles.' },
  ];

  filteredFaqs = computed(() => {
    const query = this.q.trim().toLowerCase();
    if (!query) return this.faqs;
    return this.faqs.filter((f) => (f.q + ' ' + f.a + ' ' + f.cat).toLowerCase().includes(query));
  });

  // contact form
  name = this.cap(this.auth.userName);
  email = this.auth.email;
  category = 'General question';
  subject = '';
  message = '';
  categories = ['General question', 'Designer', 'Bulk generation', 'Credentials', 'Branding & domain', 'Billing', 'Bug report', 'Feature request'];

  quickAction(key: string): void {
    if (key === 'contact') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    this.alerts.info('Opening ' + key + ' (coming soon).');
  }

  send(): void {
    if (!this.subject.trim() || !this.message.trim()) return;
    this.alerts.success('Thanks ' + (this.name || 'there') + '! Your message has been sent — we will reply to ' + (this.email || 'you') + ' shortly.', { title: 'Message sent' });
    this.subject = '';
    this.message = '';
  }

  private cap(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
}

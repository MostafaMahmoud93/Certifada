import { Component, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TemplateService } from '../../core/services/template.service';
import { TemplateListItem } from '../../core/models/models';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { TranslocoModule } from '@ngneat/transloco';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, HasActionDirective, TranslocoModule],
  template: `
  <div class="head">
    <div>
      <h1>{{ 'tpl.title' | transloco }}</h1>
      <p class="cf-muted">{{ 'tpl.subtitle' | transloco }}</p>
    </div>
    <a class="cf-btn cf-btn-primary" routerLink="/canvas"
       [appHasAction]="A.Template_Edit" [tooltipMessage]="'🔒 Upgrade your plan to create templates.'">
      <span class="material-icons">add</span> {{ 'tpl.newTemplate' | transloco }}
    </a>
  </div>

  @if (loading()) {
    <div class="grid">
      @for (s of [1,2,3,4]; track s) { <div class="card skel"></div> }
    </div>
  } @else if (error()) {
    <div class="state"><span class="material-icons">cloud_off</span><h3>{{ 'tpl.loadError' | transloco }}</h3><p class="cf-muted">{{ error() }}</p><button class="cf-btn cf-btn-secondary" (click)="refresh()">{{ 'common.retry' | transloco }}</button></div>
  } @else if (items().length === 0) {
    <div class="state"><span class="material-icons">workspace_premium</span><h3>{{ 'tpl.noneTitle' | transloco }}</h3><p class="cf-muted">{{ 'tpl.noneBody' | transloco }}</p>
      <a class="cf-btn cf-btn-primary" routerLink="/canvas" [appHasAction]="A.Template_Edit">{{ 'tpl.startDesigning' | transloco }}</a></div>
  } @else {
    <div class="grid">
      @for (t of items(); track t.id) {
        <div class="card tcard">
          <a class="thumb" [routerLink]="['/canvas', t.id]" [appHasAction]="A.Template_Edit" [tooltipMessage]="'🔒 Editing isn\\'t in your plan.'">
            @if (t.thumbnailDataUrl) { <img [src]="t.thumbnailDataUrl" [alt]="t.name" /> }
            @else { <div class="thumb-empty"><span class="material-icons">image</span></div> }
            @if (t.status === 'Archived') { <span class="status arch">Archived</span> }
          </a>
          <div class="tbody">
            <div class="trow">
              <strong class="tname" [title]="t.name">{{ t.name || 'Untitled Certificate' }}</strong>
              <span class="cf-badge cf-badge-gold">{{ fields(t) }} {{ 'tpl.fields' | transloco }}</span>
            </div>
            <small class="cf-muted">{{ 'tpl.updated' | transloco }} {{ t.updatedAt | date: 'mediumDate' }}</small>
            <div class="actions">
              <a class="cf-btn cf-btn-secondary sm" [routerLink]="['/canvas', t.id]"
                 [appHasAction]="A.Template_Edit" [tooltipMessage]="'🔒 Editing isn\\'t in your plan.'">{{ 'tpl.edit' | transloco }}</a>
              <a class="cf-btn cf-btn-secondary sm" [routerLink]="['/bulk', t.id]"
                 [appHasAction]="A.Credential_Bulk" [tooltipMessage]="'🔒 Bulk generation isn\\'t in your plan.'">{{ 'tpl.bulk' | transloco }}</a>
              <span class="spacer"></span>
              <button class="ic" (click)="info.set(t)" title="Info"
                      [appHasAction]="A.Template_Info" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">info</span></button>
              <button class="ic" (click)="archive(t)" title="Archive"
                      [appHasAction]="A.Template_Archive" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">archive</span></button>
              <button class="ic danger" (click)="remove(t)" title="Delete"
                      [appHasAction]="A.Template_Delete" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">delete</span></button>
            </div>
          </div>
        </div>
      }
    </div>
  }

  @if (info(); as t) {
    <div class="overlay" (click)="info.set(null)">
      <div class="modal" (click)="$event.stopPropagation()">
        <button class="close" (click)="info.set(null)"><span class="material-icons">close</span></button>
        <h3>{{ t.name || 'Untitled Certificate' }}</h3>
        <table class="cf-table info">
          <tr><td>Status</td><td>{{ t.status || 'Draft' }}</td></tr>
          <tr><td>Size</td><td>{{ t.width }} × {{ t.height }} px</td></tr>
          <tr><td>Dynamic fields</td><td>{{ fields(t) }}</td></tr>
          <tr><td>Created</td><td>{{ t.createdAt | date: 'medium' }}</td></tr>
          <tr><td>Updated</td><td>{{ t.updatedAt | date: 'medium' }}</td></tr>
        </table>
        <div class="modal-actions">
          <a class="cf-btn cf-btn-primary" [routerLink]="['/canvas', t.id]" (click)="info.set(null)">Open in designer</a>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`
    :host{display:block}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:6px}
    .head h1{font-size:22px}
    .cf-btn .material-icons{font-size:18px}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(248px,1fr));gap:18px;margin-top:18px}
    .tcard{overflow:hidden;display:flex;flex-direction:column;padding:0}
    .thumb{position:relative;display:block;aspect-ratio:1.41/1;background:var(--cf-surface-2);overflow:hidden}
    .thumb img{width:100%;height:100%;object-fit:contain}
    .thumb-empty{width:100%;height:100%;display:grid;place-items:center;color:var(--cf-ink-400)}
    .thumb-empty .material-icons{font-size:34px}
    .status{position:absolute;top:8px;inset-inline-start:8px;font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px}
    .status.arch{background:var(--cf-ink-700);color:#fff}
    .tbody{padding:14px}
    .trow{display:flex;align-items:center;justify-content:space-between;gap:8px}
    .tname{font-size:14px;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .actions{display:flex;align-items:center;gap:6px;margin-top:12px}
    .cf-btn.sm{padding:6px 10px;font-size:12.5px}
    .spacer{flex:1}
    .ic{width:32px;height:32px;border-radius:8px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-500);display:grid;place-items:center;cursor:pointer}
    .ic:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .ic.danger:hover{background:var(--cf-danger-soft);color:var(--cf-danger);border-color:color-mix(in srgb,var(--cf-danger) 30%,transparent)}
    .ic .material-icons{font-size:18px}
    .skel{height:230px;background:linear-gradient(90deg,var(--cf-surface-2),var(--cf-line),var(--cf-surface-2));background-size:200% 100%;animation:sh 1.2s infinite}
    @keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}
    .state{max-width:420px;margin:10vh auto;text-align:center;color:var(--cf-ink-600)}
    .state .material-icons{font-size:42px;color:var(--cf-brand-500)}
    .state h3{margin:10px 0 4px;color:var(--cf-ink-900)}
    .state .cf-btn{margin-top:14px}
    .overlay{position:fixed;inset:0;background:rgba(2,6,23,.5);display:grid;place-items:center;z-index:60;padding:20px}
    .modal{position:relative;width:100%;max-width:420px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:var(--cf-radius-lg);box-shadow:var(--cf-shadow-lg);padding:22px}
    .modal h3{font-size:17px;margin-bottom:12px;padding-inline-end:28px}
    .close{position:absolute;top:12px;inset-inline-end:12px;border:0;background:none;color:var(--cf-ink-400);cursor:pointer}
    .info td{padding:8px 6px}
    .info td:first-child{color:var(--cf-ink-500);width:40%}
    .info td:last-child{color:var(--cf-ink-900);font-weight:500}
    .modal-actions{margin-top:16px;display:flex;justify-content:flex-end}
  `],
})
export class TemplatesPage {
  private service = inject(TemplateService);
  readonly A = Actions;

  items = signal<TemplateListItem[]>([]);
  loading = signal(true);
  error = signal('');
  info = signal<TemplateListItem | null>(null);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.list().subscribe({
      next: (items) => { this.items.set(items ?? []); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set('Is the templates API running?'); },
    });
  }

  fields(t: TemplateListItem): number {
    try { return (JSON.parse(t.placeholdersJson) as string[]).length; } catch { return 0; }
  }

  remove(t: TemplateListItem): void {
    if (!confirm(`Delete "${t.name || 'this template'}"? This cannot be undone.`)) return;
    this.service.remove(t.id).subscribe({
      next: () => this.items.update((l) => l.filter((x) => x.id !== t.id)),
      error: () => alert('Delete failed.'),
    });
  }

  archive(t: TemplateListItem): void {
    this.service.archive(t.id).subscribe({
      next: () => this.refresh(),
      error: () => alert('Archive failed.'),
    });
  }
}

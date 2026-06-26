import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TemplateService } from '../../core/services/template.service';
import { TemplateListItem } from '../../core/models/models';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { AlertService } from '../../core/services/alert.service';
import { IssuedService } from '../../core/services/issued.service';
import { PlanService } from '../../core/services/plan.service';
import { AuthService } from '../../core/services/auth.service';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { ExportMenuComponent } from '../../shared/components/export-menu/export-menu.component';
import { ExcelExportService, ExcelColumn } from '../../core/services/excel-export.service';

type SortKey = 'updated' | 'name' | 'issued' | 'fields';
type StatusFilter = 'all' | 'active' | 'archived';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, DatePipe, HasActionDirective, PaginatorComponent, ExportMenuComponent],
  template: `
  <!-- ===================== HEADER ===================== -->
  <div class="head">
    <div class="head-l">
      <h1>Templates</h1>
      <p class="cf-muted">Design, search, issue and bulk-generate certificates.</p>
    </div>
    <div class="head-r" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <app-export-menu [disabled]="!filtered().length" (excel)="exportExcel()" (csv)="exportCsv()"></app-export-menu>
      <button class="cf-btn cf-btn-primary new-btn" (click)="newTemplate()" [disabled]="overLimit()"
              [appHasAction]="A.Template_Edit" [tooltipMessage]="'🔒 Upgrade your plan to create templates.'">
        <span class="material-icons">add</span> New template
      </button>
    </div>
  </div>

  <!-- ===================== OVERVIEW STRIP ===================== -->
  @if (!error()) {
    <div class="overview">
      <div class="ov-card">
        <div class="ov-ic brand"><span class="material-icons">dashboard_customize</span></div>
        <div class="ov-meta"><div class="ov-val">{{ loading() ? '—' : rawCount() }}</div><div class="ov-lbl">Templates</div></div>
      </div>
      <div class="ov-card">
        <div class="ov-ic ok"><span class="material-icons">verified</span></div>
        <div class="ov-meta"><div class="ov-val">{{ loading() ? '—' : totalIssued() }}</div><div class="ov-lbl">Credentials issued</div></div>
      </div>
      <div class="ov-card">
        <div class="ov-ic info"><span class="material-icons">bolt</span></div>
        <div class="ov-meta"><div class="ov-val">{{ loading() ? '—' : activeCount() }}</div><div class="ov-lbl">Active</div></div>
      </div>
      <div class="ov-card plan" [class.warn]="overLimit()">
        <div class="ov-meta full">
          <div class="ov-plan-top"><span class="material-icons">workspace_premium</span> {{ plan.plan() }} plan <span class="ov-use">{{ used() }} / {{ limitLabel() }}</span></div>
          <div class="ov-bar"><span [style.width.%]="usagePct()"></span></div>
          <div class="ov-lbl">{{ overLimit() ? 'Limit reached — upgrade to add more' : (limitLabel() === '∞' ? 'Unlimited templates' : (remaining() + ' templates remaining')) }}</div>
        </div>
      </div>
    </div>
  }

  @if (overLimit()) {
    <div class="limit-banner">
      <span class="material-icons">lock</span>
      <div><strong>You've reached your plan limit</strong><span class="cf-muted"> — {{ used() }} of {{ limitLabel() }} templates on the {{ plan.plan() }} plan.</span></div>
      <button class="cf-btn cf-btn-secondary sm" (click)="goUpgrade()">Upgrade plan</button>
    </div>
  }

  <!-- ===================== TOOLBAR ===================== -->
  @if (!loading() && !error() && rawCount() > 0) {
    <div class="toolbar">
      <div class="search">
        <span class="material-icons">search</span>
        <input [value]="query()" (input)="query.set($any($event.target).value); page.set(1)" placeholder="Search templates…" />
        @if (query()) { <button class="clr" (click)="query.set('')"><span class="material-icons">close</span></button> }
      </div>
      <div class="chips">
        <button [class.on]="status() === 'all'" (click)="status.set('all'); page.set(1)">All</button>
        <button [class.on]="status() === 'active'" (click)="status.set('active'); page.set(1)">Active</button>
        <button [class.on]="status() === 'archived'" (click)="status.set('archived'); page.set(1)">Archived</button>
      </div>
      <div class="sortwrap">
        <span class="material-icons">sort</span>
        <select [value]="sort()" (change)="sort.set($any($event.target).value); sortDir.set($any($event.target).value === 'name' ? 'asc' : 'desc'); page.set(1)">
          <option value="updated">Recently updated</option>
          <option value="name">Name A–Z</option>
          <option value="issued">Most issued</option>
        </select>
      </div>
      <div class="view-toggle">
        <button [class.on]="view() === 'grid'" (click)="setView('grid')" title="Grid view"><span class="material-icons">grid_view</span></button>
        <button [class.on]="view() === 'table'" (click)="setView('table')" title="Table view"><span class="material-icons">view_list</span></button>
      </div>
    </div>
    <div class="result-line"><span class="cf-muted">{{ filtered().length }} of {{ rawCount() }} template{{ rawCount() === 1 ? '' : 's' }}</span></div>
  }

  <!-- ===================== BODY ===================== -->
  @if (loading()) {
    <div class="grid">@for (s of [1,2,3,4]; track s) { <div class="card skel"></div> }</div>
  } @else if (error()) {
    <div class="state"><span class="material-icons">cloud_off</span><h3>Couldn't load templates</h3><p class="cf-muted">{{ error() }}</p><button class="cf-btn cf-btn-secondary" (click)="refresh()">Retry</button></div>
  } @else if (rawCount() === 0) {
    <div class="state"><span class="material-icons">workspace_premium</span><h3>No templates yet</h3><p class="cf-muted">Create your first certificate template to start issuing.</p>
      <button class="cf-btn cf-btn-primary" (click)="newTemplate()" [appHasAction]="A.Template_Edit">Start designing</button></div>
  } @else if (filtered().length === 0) {
    <div class="state"><span class="material-icons">search_off</span><h3>No matches</h3><p class="cf-muted">Nothing matches your search or filter.</p><button class="cf-btn cf-btn-secondary" (click)="query.set(''); status.set('all')">Clear filters</button></div>
  } @else if (view() === 'grid') {
    <div class="grid">
      @for (t of paged(); track t.id) {
        <div class="card tcard" [class.raised]="menuId() === t.id">
          <button class="thumb" (click)="edit(t)" title="Open in designer">
            @if (t.thumbnailDataUrl) { <img [src]="t.thumbnailDataUrl" [alt]="t.name" /> }
            @else { <div class="thumb-empty"><span class="material-icons">workspace_premium</span></div> }
            <span class="thumb-grad"></span>
            <span class="orient">{{ orientation(t) }}</span>
            @if (issuedCount(t)) { <span class="badge-issued"><span class="material-icons">verified</span> {{ issuedCount(t) }}</span> }
            @if (t.status === 'Archived') { <span class="status arch">Archived</span> }
          </button>
          <div class="tbody">
            <div class="tname-row">
              <strong class="tname" [title]="t.name">{{ t.name || 'Untitled Certificate' }}</strong>
            </div>
            <div class="vars">
              <span class="vchip"><span class="material-icons">data_object</span>{{ fields(t) }}</span>
              @for (v of varNames(t).slice(0, 3); track v) { <span class="vtag">{{ pretty(v) }}</span> }
              @if (varNames(t).length > 3) { <span class="vtag more">+{{ varNames(t).length - 3 }}</span> }
              @if (!varNames(t).length) { <span class="vtag more">No variables</span> }
            </div>
            <div class="meta">
              @if (issuedCount(t)) {
                <button class="issued-chip" (click)="insights(t)" title="View issued & insights"><span class="material-icons">verified</span> {{ issuedCount(t) }} Issued <span class="material-icons go">chevron_right</span></button>
              } @else {
                <button class="issued-chip none" (click)="issue(t)" title="No credentials issued yet — issue now"><span class="material-icons">send</span> Issue now</button>
              }
              <span title="Updated"><span class="material-icons">schedule</span> {{ t.updatedAt | date: 'mediumDate' }}</span>
            </div>
            <div class="meta sub"><span title="Created by"><span class="material-icons">person</span> {{ creator() }}</span></div>
            <div class="actions">
              <button class="cf-btn cf-btn-primary sm grow" (click)="issue(t)"
                      [appHasAction]="A.Credential_Bulk" [tooltipMessage]="'🔒 Issuing isn\\'t in your plan.'"><span class="material-icons">send</span> Issue</button>
              <button class="cf-btn cf-btn-secondary sm" (click)="edit(t)"
                      [appHasAction]="A.Template_Edit" [tooltipMessage]="'🔒 Editing isn\\'t in your plan.'"><span class="material-icons">edit</span> Edit</button>
              <div class="more-wrap">
                <button class="ic" [class.on]="menuId() === t.id" (click)="toggleMenu(t.id, $event)" title="More"><span class="material-icons">more_horiz</span></button>
                @if (menuId() === t.id) {
                  <div class="cardmenu" (click)="$event.stopPropagation()">
                    <button (click)="open(info.set(t))"><span class="material-icons">info</span> Details</button>
                    <button (click)="open(issue(t))"><span class="material-icons">send</span> Issue</button>
                    <button (click)="open(insights(t))"><span class="material-icons">insights</span> Issued &amp; insights</button>
                    <button (click)="open(archive(t))" [appHasAction]="A.Template_Archive" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">archive</span> Archive</button>
                    <div class="mdiv"></div>
                    <button class="danger" (click)="open(remove(t))" [appHasAction]="A.Template_Delete" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">delete</span> Delete</button>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
    <app-paginator [total]="filtered().length" [page]="pageSafe()" [pageSize]="pageSize()" [sizes]="[12,24,48]" (pageChange)="page.set($event)" (pageSizeChange)="pageSize.set($event); page.set(1)" icon="grid_view" label="templates"></app-paginator>
  } @else {
    @if (selCount()) {
      <div class="bulkbar">
        <span class="bb-count"><b>{{ selCount() }}</b> selected</span>
        <button class="cf-btn cf-btn-secondary sm" (click)="bulkArchive()"><span class="material-icons">archive</span> Archive</button>
        <button class="cf-btn sm bb-del" (click)="bulkDelete()"><span class="material-icons">delete</span> Delete</button>
        <button class="bb-clear" (click)="clearSel()">Clear selection</button>
      </div>
    }
    <div class="tablewrap">
      <table class="cf-table tpl-table">
        <thead><tr>
          <th class="sel-th"><label class="cbx" (click)="$event.stopPropagation()"><input type="checkbox" [checked]="pageAllSel()" (change)="toggleAllPage()" /><span></span></label></th>
          <th class="sortable" (click)="sortBy('name')">Template <span class="material-icons caret" [class.act]="sort()==='name'">{{ caretIcon('name') }}</span></th>
          <th class="sortable" (click)="sortBy('fields')">Variables <span class="material-icons caret" [class.act]="sort()==='fields'">{{ caretIcon('fields') }}</span></th>
          <th class="ta-c sortable" (click)="sortBy('issued')">Issued <span class="material-icons caret" [class.act]="sort()==='issued'">{{ caretIcon('issued') }}</span></th>
          <th>Created by</th>
          <th class="sortable" (click)="sortBy('updated')">Updated <span class="material-icons caret" [class.act]="sort()==='updated'">{{ caretIcon('updated') }}</span></th>
          <th>Status</th><th class="ta-end">Actions</th>
        </tr></thead>
        <tbody>
          @for (t of paged(); track t.id) {
            <tr [class.row-sel]="isSel(t.id)">
              <td class="sel-td"><label class="cbx" (click)="$event.stopPropagation()"><input type="checkbox" [checked]="isSel(t.id)" (change)="toggleSel(t.id)" /><span></span></label></td>
              <td>
                <button class="cellname" (click)="edit(t)">
                  <span class="mini">@if (t.thumbnailDataUrl) { <img [src]="t.thumbnailDataUrl" alt="" /> } @else { <span class="material-icons">workspace_premium</span> }</span>
                  <span class="cn-text"><strong>{{ t.name || 'Untitled Certificate' }}</strong><span class="dim-chip"><span class="material-icons">aspect_ratio</span>{{ t.width }}×{{ t.height }} · {{ orientation(t) }}</span></span>
                </button>
              </td>
              <td><span class="vchip sm" [title]="varNames(t).join(', ') || 'No variables'"><span class="material-icons">data_object</span>{{ fields(t) }}</span></td>
              <td class="ta-c">@if (issuedCount(t)) { <button class="issued-chip" (click)="insights(t)" title="View issued & insights"><span class="material-icons">verified</span> {{ issuedCount(t) }} Issued <span class="material-icons go">chevron_right</span></button> } @else { <button class="issued-chip none" (click)="issue(t)" title="No credentials issued yet — issue now"><span class="material-icons">send</span> Issue now</button> }</td>
              <td><span class="byline"><span class="by-av">{{ creatorInitials() }}</span><span class="by-name">{{ creator() }}</span></span></td>
              <td class="cf-muted">{{ t.updatedAt | date: 'mediumDate' }}</td>
              <td><span class="st-pill" [attr.data-st]="t.status === 'Archived' ? 'arch' : 'draft'"><span class="st-dot"></span>{{ t.status || 'Draft' }}</span></td>
              <td class="ta-end">
                <div class="tactbar">
                  <button class="tact issue" (click)="issue(t)" title="Issue" [appHasAction]="A.Credential_Bulk" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">send</span></button>
                  <button class="tact edit" (click)="edit(t)" title="Edit" [appHasAction]="A.Template_Edit" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">edit</span></button>
                  <button class="tact info" (click)="info.set(t)" title="Details"><span class="material-icons">info</span></button>
                  <span class="tact-div"></span>
                  <button class="tact danger" (click)="remove(t)" title="Delete" [appHasAction]="A.Template_Delete" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">delete</span></button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <app-paginator [total]="filtered().length" [page]="pageSafe()" [pageSize]="pageSize()" [sizes]="[12,24,48]" (pageChange)="page.set($event)" (pageSizeChange)="pageSize.set($event); page.set(1)" icon="grid_view" label="templates"></app-paginator>
  }

  <!-- ===================== DETAILS MODAL ===================== -->
  @if (info(); as t) {
    <div class="overlay" (click)="info.set(null)">
      <div class="modal" (click)="$event.stopPropagation()">
        <button class="close" (click)="info.set(null)"><span class="material-icons">close</span></button>
        <div class="m-head">
          <span class="m-thumb">@if (t.thumbnailDataUrl) { <img [src]="t.thumbnailDataUrl" alt="" /> } @else { <span class="material-icons">workspace_premium</span> }</span>
          <div><h3>{{ t.name || 'Untitled Certificate' }}</h3><span class="cf-badge" [class.cf-badge-gold]="t.status !== 'Archived'">{{ t.status || 'Draft' }}</span></div>
        </div>
        <table class="cf-table info">
          <tr><td>Size</td><td>{{ t.width }} × {{ t.height }} px · {{ orientation(t) }}</td></tr>
          <tr><td>Variables</td><td>{{ varNames(t).join(', ') || '—' }}</td></tr>
          <tr><td>Issued</td><td>{{ issuedCount(t) }} credential{{ issuedCount(t) === 1 ? '' : 's' }}</td></tr>
          <tr><td>Created by</td><td>{{ creator() }}</td></tr>
          <tr><td>Created</td><td>{{ t.createdAt | date: 'medium' }}</td></tr>
          <tr><td>Updated</td><td>{{ t.updatedAt | date: 'medium' }}</td></tr>
        </table>
        <div class="modal-actions">
          <button class="cf-btn cf-btn-secondary" (click)="info.set(null); issue(t)"><span class="material-icons">send</span> Issue</button>
          <button class="cf-btn cf-btn-primary" (click)="info.set(null); edit(t)"><span class="material-icons">edit</span> Open in designer</button>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`
    :host{display:block}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px}
    .head-l h1{font-size:24px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900)}
    .head-l p{font-size:13.5px;margin-top:3px}
    .cf-btn .material-icons{font-size:16px}
    .cf-btn:disabled{opacity:.5;cursor:not-allowed}
    .new-btn{height:36px;padding:0 14px;font-weight:600}

    /* overview strip */
    .overview{display:grid;grid-template-columns:repeat(3,1fr) 1.5fr;gap:12px;margin-bottom:16px}
    .ov-card{display:flex;align-items:center;gap:13px;padding:14px 16px;border:1px solid var(--cf-line);border-radius:14px;background:var(--cf-surface);box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .ov-ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;flex:none}
    .ov-ic .material-icons{font-size:21px}
    .ov-ic.brand{background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .ov-ic.ok{background:color-mix(in srgb,#16a34a 14%,transparent);color:#16a34a}
    .ov-ic.info{background:color-mix(in srgb,#0ea5e9 14%,transparent);color:#0284c7}
    .ov-val{font-size:23px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900);line-height:1}
    .ov-lbl{font-size:12px;color:var(--cf-ink-500);margin-top:4px}
    .ov-meta.full{flex:1;min-width:0}
    .ov-plan-top{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--cf-ink-800)}
    .ov-plan-top .material-icons{font-size:17px;color:var(--cf-brand-600)}
    .ov-use{margin-inline-start:auto;font-size:12.5px;font-weight:700;color:var(--cf-ink-600);font-variant-numeric:tabular-nums}
    .ov-bar{height:7px;border-radius:999px;background:var(--cf-surface-2);border:1px solid var(--cf-line);margin:8px 0 6px;overflow:hidden}
    .ov-bar span{display:block;height:100%;background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-brand-600));transition:width .5s}
    .ov-card.plan.warn .ov-bar span{background:linear-gradient(90deg,#f59e0b,var(--cf-danger))}
    @media(max-width:900px){.overview{grid-template-columns:1fr 1fr}}

    .limit-banner{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:12px;margin-bottom:16px;background:var(--cf-danger-soft);border:1px solid color-mix(in srgb,var(--cf-danger) 28%,var(--cf-line))}
    .limit-banner>.material-icons{color:var(--cf-danger)}
    .limit-banner strong{color:var(--cf-ink-900);font-size:13.5px}
    .limit-banner .cf-btn{margin-inline-start:auto;flex:none}

    /* toolbar */
    .toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}
    .search{flex:1;min-width:200px;display:flex;align-items:center;gap:8px;height:42px;padding:0 12px;border:1px solid var(--cf-line);border-radius:11px;background:var(--cf-surface);transition:border-color .14s,box-shadow .14s}
    .search:focus-within{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .search .material-icons{font-size:19px;color:var(--cf-ink-400)}
    .search input{flex:1;border:0;background:none;outline:none;font:inherit;font-size:14px;color:var(--cf-ink-900)}
    .clr{border:0;background:none;color:var(--cf-ink-400);cursor:pointer;display:grid;place-items:center}
    .clr .material-icons{font-size:17px}
    .chips{display:inline-flex;gap:4px;padding:4px;background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:11px}
    .chips button{border:0;background:none;color:var(--cf-ink-600);font:inherit;font-size:12.5px;font-weight:600;padding:7px 13px;border-radius:8px;cursor:pointer}
    .chips button.on{background:var(--cf-surface);color:var(--cf-brand-700);box-shadow:var(--cf-shadow-sm)}
    .sortwrap{display:flex;align-items:center;gap:6px;height:42px;padding:0 10px 0 12px;border:1px solid var(--cf-line);border-radius:11px;background:var(--cf-surface)}
    .sortwrap .material-icons{font-size:18px;color:var(--cf-ink-400)}
    .sortwrap select{border:0;background:none;outline:none;font:inherit;font-size:13px;font-weight:600;color:var(--cf-ink-700);cursor:pointer}
    .view-toggle{display:inline-flex;border:1px solid var(--cf-line);border-radius:11px;overflow:hidden;background:var(--cf-surface)}
    .view-toggle button{width:40px;height:42px;border:0;background:none;color:var(--cf-ink-500);cursor:pointer;display:grid;place-items:center}
    .view-toggle button.on{background:var(--cf-brand-50);color:var(--cf-brand-700)}
    .view-toggle button:hover:not(.on){background:var(--cf-surface-2)}
    .view-toggle .material-icons{font-size:20px}
    .result-line{margin:2px 0 16px;font-size:12.5px}

    /* grid */
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
    .tcard{position:relative;overflow:visible;display:flex;flex-direction:column;padding:0;border-radius:16px;transition:box-shadow .2s,transform .12s,border-color .2s}
    .tcard:hover{box-shadow:0 18px 40px -20px rgba(15,23,42,.34);border-color:color-mix(in srgb,var(--cf-brand-500) 32%,var(--cf-line));transform:translateY(-2px)}
    .tcard.raised{z-index:5}
    @keyframes cardInT{from{opacity:0;transform:translateY(10px) scale(.99)}to{opacity:1;transform:none}}
    .tcard{animation:cardInT .34s ease both}
    .grid .tcard:nth-child(2){animation-delay:.05s}.grid .tcard:nth-child(3){animation-delay:.1s}.grid .tcard:nth-child(4){animation-delay:.15s}.grid .tcard:nth-child(5){animation-delay:.2s}.grid .tcard:nth-child(n+6){animation-delay:.24s}
    .thumb{position:relative;display:block;width:100%;aspect-ratio:1.5/1;background:var(--cf-surface-2);overflow:hidden;border:0;cursor:pointer;padding:0;border-radius:16px 16px 0 0}
    .thumb img{width:100%;height:100%;object-fit:contain}
    .thumb-empty{width:100%;height:100%;display:grid;place-items:center;color:var(--cf-brand-300, var(--cf-ink-400))}
    .thumb-empty .material-icons{font-size:40px;color:var(--cf-ink-300, var(--cf-ink-400));opacity:.5}
    .thumb-grad{position:absolute;inset:0;background:linear-gradient(180deg,transparent 60%,rgba(2,6,23,.16));pointer-events:none}
    .orient{position:absolute;top:9px;inset-inline-end:9px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#fff;background:rgba(2,6,23,.42);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);padding:3px 7px;border-radius:6px}
    .badge-issued{position:absolute;bottom:9px;inset-inline-start:9px;display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:4px 9px;border-radius:999px;background:color-mix(in srgb,#16a34a 92%,transparent);color:#fff;box-shadow:0 3px 10px -3px rgba(0,0,0,.45)}
    .badge-issued .material-icons{font-size:13px}
    .status{position:absolute;top:9px;inset-inline-start:9px;font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px}
    .status.arch{background:var(--cf-ink-700);color:#fff}
    .tbody{padding:14px 15px 15px;display:flex;flex-direction:column;gap:9px}
    .tname-row{display:flex;align-items:center;gap:8px}
    .tname{font-size:15px;font-weight:700;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.01em}
    .vars{display:flex;flex-wrap:wrap;gap:5px;align-items:center}
    .vchip{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--cf-brand-700);background:var(--cf-brand-50);border:1px solid var(--cf-brand-100);border-radius:999px;padding:2px 8px}
    .vchip .material-icons{font-size:13px}
    .vchip.sm{color:var(--cf-ink-700);background:var(--cf-surface-2);border-color:var(--cf-line)}
    .vtag{font-size:10.5px;font-weight:600;color:var(--cf-ink-600);background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:6px;padding:2px 7px;max-width:90px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .vtag.more{color:var(--cf-ink-400)}
    .meta{display:flex;flex-wrap:wrap;gap:14px;font-size:11.5px;color:var(--cf-ink-500)}
    .meta.sub{margin-top:-4px}
    .meta span{display:inline-flex;align-items:center;gap:4px}
    .meta .material-icons{font-size:14px;color:var(--cf-ink-400)}
    .actions{display:flex;align-items:center;gap:7px;margin-top:4px;padding-top:11px;border-top:1px solid var(--cf-line-soft)}
    .cf-btn.sm{padding:7px 11px;font-size:12.5px}
    .cf-btn.sm.grow{flex:1}
    .cf-btn.sm .material-icons{font-size:15px}
    .more-wrap{position:relative}
    .ic{width:34px;height:34px;border-radius:9px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-500);display:grid;place-items:center;cursor:pointer;transition:background .14s,color .14s}
    .ic:hover,.ic.on{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .ic.danger:hover{background:var(--cf-danger-soft);color:var(--cf-danger);border-color:color-mix(in srgb,var(--cf-danger) 30%,transparent)}
    .ic .material-icons{font-size:18px}
    .cardmenu{position:absolute;bottom:calc(100% + 8px);inset-inline-end:0;min-width:170px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:12px;box-shadow:0 18px 40px -14px rgba(2,6,23,.4);padding:6px;z-index:40;animation:menu-in .14s ease}
    @keyframes menu-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .cardmenu button{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;color:var(--cf-ink-700);font:inherit;font-size:13px;text-align:start;padding:9px 10px;border-radius:8px;cursor:pointer}
    .cardmenu button:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .cardmenu button .material-icons{font-size:17px;color:var(--cf-ink-400)}
    .cardmenu button.danger{color:var(--cf-danger)}
    .cardmenu button.danger:hover{background:var(--cf-danger-soft)}
    .cardmenu button.danger .material-icons{color:var(--cf-danger)}
    .mdiv{height:1px;background:var(--cf-line);margin:5px 6px}
    .skel{height:320px;background:linear-gradient(90deg,var(--cf-surface-2),var(--cf-line),var(--cf-surface-2));background-size:200% 100%;animation:sh 1.2s infinite;border:1px solid var(--cf-line);border-radius:16px}
    @keyframes sh{0%{background-position:200% 0}100%{background-position:-200% 0}}

    /* table */
    .tablewrap{overflow-x:auto;border:1px solid var(--cf-line);border-radius:14px;background:var(--cf-surface);box-shadow:0 1px 2px rgba(15,23,42,.04)}
    .tpl-table{width:100%;border-collapse:collapse;font-size:13.5px}
    .tpl-table thead th{position:sticky;top:0;z-index:1;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--cf-ink-500);font-weight:700;text-align:start;padding:12px 14px;white-space:nowrap;background:var(--cf-surface-2);border-bottom:1px solid var(--cf-line)}
    .tpl-table tbody td{padding:12px 14px;vertical-align:middle;border-bottom:1px solid var(--cf-line-soft)}
    .tpl-table tbody tr:last-child td{border-bottom:0}
    .tpl-table tbody td:first-child{border-inline-start:3px solid transparent;transition:border-color .16s}
    
    .tpl-table tbody tr:hover td{background:var(--cf-surface-2)}
    .tpl-table tbody tr:hover td:first-child{border-inline-start-color:var(--cf-brand-500)}
    .tpl-table tbody tr:hover .cn-text strong{color:var(--cf-brand-700)}
    .tpl-table tbody tr:hover .mini{box-shadow:0 3px 10px -4px rgba(15,23,42,.22),inset 0 0 0 2px var(--cf-surface);transform:scale(1.03)}
    @keyframes rowInT{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
    .tpl-table tbody tr{animation:rowInT .3s ease backwards}
    .tpl-table tbody tr:nth-child(2){animation-delay:.04s}.tpl-table tbody tr:nth-child(3){animation-delay:.08s}.tpl-table tbody tr:nth-child(4){animation-delay:.12s}.tpl-table tbody tr:nth-child(5){animation-delay:.16s}.tpl-table tbody tr:nth-child(n+6){animation-delay:.2s}
    .ta-end{text-align:end}.ta-c{text-align:center}
    .cellname{display:flex;align-items:center;gap:11px;border:0;background:none;cursor:pointer;text-align:start;padding:0;color:inherit}
    .mini{width:56px;height:40px;border-radius:9px;background:var(--cf-surface-2);border:1px solid var(--cf-line);box-shadow:0 1px 3px rgba(15,23,42,.1),inset 0 0 0 2px var(--cf-surface);display:grid;place-items:center;overflow:hidden;flex:none;transition:box-shadow .16s,transform .16s}
    .mini img{width:100%;height:100%;object-fit:cover}
    .mini .material-icons{font-size:18px;color:var(--cf-ink-400)}
    .cn-text{display:flex;flex-direction:column;min-width:0}
    .cn-text strong{font-size:13.5px;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:240px}
    .num{font-weight:700;color:var(--cf-ink-900)}
    .issued-chip{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--cf-brand-200);background:var(--cf-brand-50);color:var(--cf-brand-700);font:inherit;font-size:12px;font-weight:700;padding:6px 8px 6px 12px;border-radius:999px;cursor:pointer;transition:transform .14s,box-shadow .16s,background .16s,color .16s,border-color .14s}
    .issued-chip:hover{transform:translateY(-1px);background:var(--cf-brand-600);border-color:var(--cf-brand-600);color:#fff;box-shadow:0 9px 20px -7px color-mix(in srgb,var(--cf-brand-600) 78%,transparent)}
    .issued-chip:active{transform:scale(.96)}
    .issued-chip .material-icons{font-size:14px}
    .issued-chip .go{font-size:16px;margin-inline-start:1px;opacity:.55;transform:translateX(-3px);transition:transform .18s,opacity .18s}
    .issued-chip:hover .go{opacity:1;transform:translateX(1px)}
    .issued-chip.sm{padding:3px 9px;font-size:11px}
    .issued-chip.none{background:var(--cf-surface-2);border-color:var(--cf-line);color:var(--cf-ink-500)}
    .issued-chip.none:hover{color:#fff;background:var(--cf-brand-600);border-color:var(--cf-brand-600)}
    .cf-badge-muted{background:var(--cf-surface-2);color:var(--cf-ink-500)}
    .rowacts{display:inline-flex;align-items:center;gap:6px;justify-content:flex-end}
    .rowacts .cf-btn.sm{padding:6px 10px}
    .rowacts .cf-btn.sm .material-icons{font-size:15px}
    .sel-th,.sel-td{width:42px;text-align:center}
    .cbx{display:inline-grid;place-items:center;cursor:pointer;position:relative}
    .cbx input{position:absolute;opacity:0;width:0;height:0}
    .cbx span{width:18px;height:18px;border:1.5px solid var(--cf-line);border-radius:6px;position:relative;transition:background .14s,border-color .14s;background:var(--cf-surface)}
    .cbx:hover span{border-color:var(--cf-brand-400)}
    .cbx input:checked + span{background:var(--cf-brand-600);border-color:var(--cf-brand-600)}
    .cbx span::after{content:'';position:absolute;left:5px;top:1px;width:4px;height:9px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg) scale(0);transition:transform .15s}
    .cbx input:checked + span::after{transform:rotate(45deg) scale(1)}
    .tpl-table th.sortable{cursor:pointer;user-select:none;transition:color .14s}
    .tpl-table th.sortable:hover{color:var(--cf-ink-800)}
    .tpl-table th .caret{font-size:15px;vertical-align:middle;margin-inline-start:2px;color:var(--cf-ink-300);transition:color .14s}
    .tpl-table th .caret.act{color:var(--cf-brand-600)}
    .row-sel td{background:var(--cf-brand-50) !important}
    .row-sel td:first-child{border-inline-start-color:var(--cf-brand-600) !important}
    .row-sel:hover td{background:var(--cf-brand-100) !important}
    .tactbar{display:inline-flex;align-items:center;gap:2px;padding:3px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);box-shadow:0 1px 2px rgba(15,23,42,.05);transition:box-shadow .16s,border-color .16s}
    .tactbar:hover{box-shadow:0 6px 16px -10px rgba(15,23,42,.3);border-color:color-mix(in srgb,var(--cf-brand-500) 24%,var(--cf-line))}
    .tact{width:28px;height:28px;display:grid;place-items:center;border:0;background:none;border-radius:8px;color:var(--cf-ink-400);cursor:pointer;transition:background .15s,color .15s,transform .12s}
    .tact .material-icons{font-size:16px;transition:transform .25s cubic-bezier(.2,1.3,.4,1)}
    .tact:hover{background:var(--cf-surface-2)}
    .tact:active{transform:scale(.88)}
    .tact.issue:hover{color:var(--cf-brand-600)}.tact.issue:hover .material-icons{transform:translateX(2px) rotate(-10deg)}
    .tact.edit:hover{color:#0284c7}.tact.edit:hover .material-icons{transform:rotate(-12deg)}
    .tact.info:hover{color:var(--cf-ink-800)}.tact.info:hover .material-icons{transform:scale(1.18)}
    .tact.danger:hover{color:var(--cf-danger)}.tact.danger:hover .material-icons{transform:rotate(90deg)}
    .tact-div{width:1px;height:16px;background:var(--cf-line);margin:0 2px}
    .st-pill{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.02em;padding:4px 11px;border-radius:999px;border:1px solid transparent;text-transform:capitalize}
    .st-pill .st-dot{width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 0 3px color-mix(in srgb,currentColor 18%,transparent)}
    .st-pill[data-st="draft"]{color:#b45309;background:color-mix(in srgb,#f59e0b 12%,transparent);border-color:color-mix(in srgb,#f59e0b 24%,transparent)}
    .st-pill[data-st="arch"]{color:var(--cf-ink-500);background:var(--cf-surface-2);border-color:var(--cf-line)}
    .byline{display:inline-flex;align-items:center;gap:9px;font-size:13px;color:var(--cf-ink-700)}
    .by-av{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:10.5px;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));flex:none;box-shadow:0 2px 7px -2px color-mix(in srgb,var(--cf-brand-600) 70%,transparent)}
    .by-name{font-weight:500;color:var(--cf-ink-700)}
    .dim-chip{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:600;color:var(--cf-ink-500);background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:7px;padding:2px 8px;margin-top:4px;width:fit-content}
    .dim-chip .material-icons{font-size:12px;color:var(--cf-ink-400)}
    .bulkbar{display:flex;align-items:center;gap:10px;padding:10px 14px;margin-bottom:12px;border:1px solid var(--cf-brand-200);background:var(--cf-brand-50);border-radius:12px;animation:bbIn .2s ease;box-shadow:0 6px 16px -10px color-mix(in srgb,var(--cf-brand-600) 60%,transparent)}
    @keyframes bbIn{from{opacity:0;transform:translateY(-7px)}to{opacity:1;transform:none}}
    .bb-count{font-size:13px;color:var(--cf-ink-900);font-weight:600}.bb-count b{font-weight:800;color:var(--cf-brand-700)}
    .bulkbar .cf-btn.sm{display:inline-flex;align-items:center;gap:5px;padding:6px 11px;font-size:12.5px}
    .bulkbar .cf-btn.sm .material-icons{font-size:15px}
    .bb-del{background:var(--cf-danger);color:#fff;border:1px solid var(--cf-danger)}.bb-del:hover{filter:brightness(.94)}
    .bb-clear{margin-inline-start:auto;border:0;background:none;color:var(--cf-ink-500);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer}.bb-clear:hover{color:var(--cf-ink-900)}

    /* states + modal */
    .state{max-width:440px;margin:9vh auto;text-align:center;color:var(--cf-ink-600)}
    .state .material-icons{font-size:46px;color:var(--cf-brand-500)}
    .state h3{margin:10px 0 4px;color:var(--cf-ink-900)}
    .state .cf-btn{margin-top:14px}
    .overlay{position:fixed;inset:0;background:rgba(2,6,23,.5);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);display:grid;place-items:center;z-index:60;padding:20px}
    .modal{position:relative;width:100%;max-width:470px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:18px;box-shadow:var(--cf-shadow-lg);padding:24px}
    .m-head{display:flex;align-items:center;gap:13px;margin-bottom:16px;padding-inline-end:26px}
    .m-thumb{width:54px;height:40px;border-radius:9px;background:var(--cf-surface-2);border:1px solid var(--cf-line);display:grid;place-items:center;overflow:hidden;flex:none}
    .m-thumb img{width:100%;height:100%;object-fit:cover}
    .m-thumb .material-icons{font-size:20px;color:var(--cf-ink-400)}
    .m-head h3{font-size:17px;color:var(--cf-ink-900);margin-bottom:5px}
    .close{position:absolute;top:14px;inset-inline-end:14px;border:0;background:none;color:var(--cf-ink-400);cursor:pointer}
    .info td{padding:8px 6px}
    .info td:first-child{color:var(--cf-ink-500);width:38%}
    .info td:last-child{color:var(--cf-ink-900);font-weight:500}
    .modal-actions{margin-top:18px;display:flex;justify-content:flex-end;gap:10px}
    .modal-actions .material-icons{font-size:17px}
  `],
})
export class TemplatesPage {
  private service = inject(TemplateService);
  private alerts = inject(AlertService);
  private router = inject(Router);
  private auth = inject(AuthService);
  readonly issued = inject(IssuedService);
  readonly plan = inject(PlanService);
  private xlsx = inject(ExcelExportService);
  readonly A = Actions;

  items = signal<TemplateListItem[]>([]);
  loading = signal(true);
  error = signal('');
  info = signal<TemplateListItem | null>(null);
  menuId = signal<string | null>(null);
  query = signal('');
  status = signal<StatusFilter>('all');
  sort = signal<SortKey>('updated');
  sortDir = signal<'asc' | 'desc'>('desc');
  selected = signal<Set<string>>(new Set<string>());
  selCount = computed(() => this.selected().size);
  view = signal<'grid' | 'table'>((localStorage.getItem('cf-tpl-view') as 'grid' | 'table') || 'grid');

  rawCount = computed(() => this.items().length);
  activeCount = computed(() => this.items().filter((t) => t.status !== 'Archived').length);
  totalIssued = computed(() => this.items().reduce((sum, t) => sum + this.issued.countFor(t.id), 0));
  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const st = this.status();
    let list = this.items().filter((t) => {
      if (st === 'active' && t.status === 'Archived') return false;
      if (st === 'archived' && t.status !== 'Archived') return false;
      if (q && !((t.name || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))) return false;
      return true;
    });
    const s = this.sort();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      let c = 0;
      if (s === 'name') c = (a.name || '').localeCompare(b.name || '');
      else if (s === 'issued') c = this.issued.countFor(a.id) - this.issued.countFor(b.id);
      else if (s === 'fields') c = this.varNames(a).length - this.varNames(b).length;
      else c = +new Date(a.updatedAt) - +new Date(b.updatedAt);
      return c * dir;
    });
    return list;
  });
  used = computed(() => this.items().length);
  remaining = computed(() => { const lim = this.plan.templateLimit(); return isFinite(lim) ? Math.max(0, lim - this.used()) : 0; });
  usagePct = computed(() => { const lim = this.plan.templateLimit(); return !isFinite(lim) || lim <= 0 ? 0 : Math.min(100, Math.round((this.used() / lim) * 100)); });
  overLimit = computed(() => { const lim = this.plan.templateLimit(); return isFinite(lim) && this.used() >= lim; });
  limitLabel(): string { const lim = this.plan.templateLimit(); return isFinite(lim) ? String(lim) : '∞'; }

  page = signal(1);
  pageSize = signal(12);
  pageSafe = computed(() => { const mp = Math.max(1, Math.ceil(this.filtered().length / this.pageSize())); return Math.min(this.page(), mp); });
  paged = computed(() => { const f = this.filtered(); const ps = this.pageSize(); const start = (this.pageSafe() - 1) * ps; return f.slice(start, start + ps); });
  pageAllSel = computed(() => { const pg = this.paged(); return pg.length > 0 && pg.every((t) => this.selected().has(t.id)); });

  constructor() { this.refresh(); this.issued.syncFromApi(); }

  @HostListener('document:click') closeMenu(): void { if (this.menuId()) this.menuId.set(null); }
  toggleMenu(id: string, e: Event): void { e.stopPropagation(); this.menuId.update((v) => (v === id ? null : id)); }
  open(_: unknown): void { this.menuId.set(null); }

  setView(v: 'grid' | 'table'): void { this.view.set(v); localStorage.setItem('cf-tpl-view', v); }
  caretIcon(key: SortKey): string { return this.sort() !== key ? 'unfold_more' : (this.sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward'); }
  sortBy(key: SortKey): void { if (this.sort() === key) this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc')); else { this.sort.set(key); this.sortDir.set(key === 'name' ? 'asc' : 'desc'); } this.page.set(1); }
  isSel(id: string): boolean { return this.selected().has(id); }
  toggleSel(id: string): void { const x = new Set(this.selected()); x.has(id) ? x.delete(id) : x.add(id); this.selected.set(x); }
  toggleAllPage(): void { const pg = this.paged(); const x = new Set(this.selected()); const all = pg.every((t) => x.has(t.id)); pg.forEach((t) => (all ? x.delete(t.id) : x.add(t.id))); this.selected.set(x); }
  clearSel(): void { this.selected.set(new Set<string>()); }
  async bulkArchive(): Promise<void> { const ids = [...this.selected()]; if (!ids.length) return; const ok = await this.alerts.confirm({ title: 'Archive templates', message: `Archive ${ids.length} selected template${ids.length === 1 ? '' : 's'}?`, confirmText: 'Archive' }); if (!ok) return; ids.forEach((id) => this.service.archive(id).subscribe({ next: () => {}, error: () => {} })); this.clearSel(); this.alerts.success(`${ids.length} template${ids.length === 1 ? '' : 's'} archived.`); setTimeout(() => this.refresh(), 350); }
  async bulkDelete(): Promise<void> { const ids = new Set(this.selected()); if (!ids.size) return; const ok = await this.alerts.confirm({ title: 'Delete templates', message: `Delete ${ids.size} selected template${ids.size === 1 ? '' : 's'}? This cannot be undone.`, danger: true, confirmText: 'Delete' }); if (!ok) return; [...ids].forEach((id) => this.service.remove(id).subscribe({ next: () => {}, error: () => {} })); this.items.update((l) => l.filter((x) => !ids.has(x.id))); this.clearSel(); this.alerts.success(`${ids.size} template${ids.size === 1 ? '' : 's'} deleted.`); }

  refresh(): void {
    this.loading.set(true);
    this.error.set('');
    this.service.list().subscribe({
      next: (items) => {
        const list = items ?? [];
        this.items.set(list);
        this.loading.set(false);
        try { localStorage.setItem('cf-tpl-cache', JSON.stringify(list)); } catch { /* ignore */ }
      },
      error: () => {
        try {
          const cached = JSON.parse(localStorage.getItem('cf-tpl-cache') || '[]');
          if (Array.isArray(cached) && cached.length) { this.items.set(cached); this.loading.set(false); return; }
        } catch { /* ignore */ }
        this.loading.set(false);
        this.error.set('Is the templates API running?');
      },
    });
  }

  fields(t: TemplateListItem): number { return this.varNames(t).length; }
  varNames(t: TemplateListItem): string[] {
    try { const a = JSON.parse(t.placeholdersJson) as string[]; return Array.isArray(a) ? a : []; } catch { return []; }
  }
  pretty(key: string): string { return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
  orientation(t: TemplateListItem): string { return (t.width || 0) >= (t.height || 0) ? 'Landscape' : 'Portrait'; }
  issuedCount(t: TemplateListItem): number { return this.issued.countFor(t.id); }
  creator(): string { return this.auth.userName ? this.cap(this.auth.userName) : 'You'; }
  creatorInitials(): string { const n = (this.auth.userName || 'You').trim(); const p = n.split(/\s+/); return (((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase()) || n.charAt(0).toUpperCase(); }
  private cap(s: string): string { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  private exportCols(): ExcelColumn[] {
    return [
      { key: 'name', label: 'Template Name' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'issued', label: 'Issued', type: 'number' },
      { key: 'fields', label: 'Variables', type: 'number' },
      { key: 'orientation', label: 'Orientation' },
      { key: 'size', label: 'Size (px)' },
      { key: 'created', label: 'Created', type: 'date' },
      { key: 'updated', label: 'Updated', type: 'date' },
      { key: 'id', label: 'Template ID' },
    ];
  }
  private exportData(): any[] {
    return this.filtered().map((t) => ({ name: t.name || 'Untitled', status: t.status || 'Active', issued: this.issuedCount(t), fields: this.fields(t), orientation: this.orientation(t), size: `${t.width || 0}×${t.height || 0}`, created: t.createdAt, updated: t.updatedAt, id: t.id }));
  }
  exportExcel(): void {
    const rows = this.exportData(); if (!rows.length) return;
    const sc = this.status() !== 'all' ? ` · ${this.status()}` : '';
    this.xlsx.export(rows, {
      fileName: `templates-${new Date().toISOString().slice(0, 10)}`,
      sheetName: 'Templates',
      title: 'Templates',
      subtitle: `Template library${sc}`,
      columns: this.exportCols(),
      summary: [
        { label: 'Templates', value: rows.length },
        { label: 'Active', value: this.activeCount() },
        { label: 'Total Issued', value: this.totalIssued() },
      ],
    });
    this.alerts.success(`Exported ${rows.length} template${rows.length === 1 ? '' : 's'} to Excel.`);
  }
  exportCsv(): void {
    const rows = this.exportData(); if (!rows.length) return;
    this.xlsx.csv(rows, this.exportCols(), `templates-${new Date().toISOString().slice(0, 10)}`);
    this.alerts.success(`Exported ${rows.length} template${rows.length === 1 ? '' : 's'} to CSV.`);
  }
  newTemplate(): void {
    if (this.overLimit()) { this.alerts.warning(`You've reached the ${this.plan.plan()} plan limit of ${this.limitLabel()} templates. Upgrade to create more.`, { title: 'Plan limit reached' }); return; }
    this.router.navigate(['/canvas']);
  }
  goUpgrade(): void { this.router.navigate(['/app/settings']); }
  issue(t: TemplateListItem): void { this.router.navigate(['/app/templates', t.id, 'issue']); }
  insights(t: TemplateListItem): void { this.router.navigate(['/app/templates', t.id, 'issued']); }

  async edit(t: TemplateListItem): Promise<void> {
    const n = this.issuedCount(t);
    if (n > 0) {
      const ok = await this.alerts.confirm({
        title: 'This template has issued credentials',
        message: `“${t.name || 'This template'}” has already been used to issue ${n} credential${n === 1 ? '' : 's'}. Editing this template design will affect the layout/data of those already-issued certificates. Do you want to proceed to the editor?`,
        confirmText: 'Edit Anyway', cancelText: 'Cancel', danger: true,
      });
      if (!ok) return;
    }
    this.router.navigate(['/canvas', t.id]);
  }

  async remove(t: TemplateListItem): Promise<void> {
    const ok = await this.alerts.confirm({ title: 'Delete template', message: `Delete “${t.name || 'this template'}”? This cannot be undone.`, danger: true, confirmText: 'Delete' });
    if (!ok) return;
    this.service.remove(t.id).subscribe({
      next: () => { this.items.update((l) => l.filter((x) => x.id !== t.id)); this.alerts.success('Template deleted.'); },
      error: () => this.alerts.error('Delete failed.'),
    });
  }

  archive(t: TemplateListItem): void {
    this.service.archive(t.id).subscribe({
      next: () => { this.alerts.success('Template archived.'); this.refresh(); },
      error: () => this.alerts.error('Archive failed.'),
    });
  }
}

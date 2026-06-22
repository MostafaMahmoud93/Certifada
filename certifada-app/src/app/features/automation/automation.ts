import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { AlertService } from '../../core/services/alert.service';
import { RichTextEditorComponent } from '../../shared/components/rich-text/rich-text-editor';

type ActionKind = 'email' | 'review' | 'notify' | 'slack' | 'report' | 'export' | 'webhook' | 'wait' | 'condition';
interface Rule { field: string; op: string; value: string; }
interface WAction {
  id: number;
  kind: ActionKind;
  to?: string;
  subject?: string;
  body?: string;
  reviewer?: string;
  message?: string;
  url?: string;
  amount?: number;
  unit?: 'minutes' | 'hours' | 'days';
  match?: 'all' | 'any';
  rules?: Rule[];
}
interface Workflow {
  id: number;
  name: string;
  trigger: string;
  enabled: boolean;
  actions: WAction[];
  lastRun: string;
}
interface ActionType { kind: ActionKind; label: string; icon: string; desc: string; color: string; long: string; needs: string; tip: string; }
interface InfoCard { icon: string; color: string; title: string; what: string; needs?: string; tip?: string; }

@Component({
  selector: 'app-automation',
  standalone: true,
  imports: [FormsModule, HasActionDirective, RichTextEditorComponent],
  template: `
  <div class="head">
    <div>
      <h1>Automation</h1>
      <p class="cf-muted">Build dynamic workflows — a trigger, then any sequence of actions.</p>
    </div>
    <div class="newwrap" (click)="$event.stopPropagation()">
      <button class="cf-btn cf-btn-primary" (click)="recipeMenuOpen.set(!recipeMenuOpen())"
              [appHasAction]="A.Automation_Manage" [tooltipMessage]="'🔒 Managing automations isn\\'t in your plan.'">
        <span class="material-icons">add</span> New workflow <span class="material-icons caret">expand_more</span>
      </button>
      @if (recipeMenuOpen()) {
        <div class="recipes">
          <button class="recipe" (click)="newWorkflow()">
            <span class="material-icons">draw</span>
            <span class="rc"><strong>Blank workflow</strong><small class="cf-muted">Start from scratch</small></span>
          </button>
          <div class="rc-sep">Start from a recipe</div>
          @for (r of recipes; track r.key) {
            <button class="recipe" (click)="createFromRecipe(r)">
              <span class="material-icons">{{ r.icon }}</span>
              <span class="rc"><strong>{{ r.name }}</strong><small class="cf-muted">{{ r.desc }}</small></span>
            </button>
          }
        </div>
      }
    </div>
  </div>

  <div class="stats">
    <div class="stat"><span class="material-icons">bolt</span><div class="sv"><b>{{ workflows().length }}</b><small>Workflows</small></div></div>
    <div class="stat live"><span class="material-icons">play_circle</span><div class="sv"><b>{{ activeCount() }}</b><small>Active</small></div></div>
    <div class="stat"><span class="material-icons">layers</span><div class="sv"><b>{{ totalSteps() }}</b><small>Total steps</small></div></div>
    <div class="stat"><span class="material-icons">schedule</span><div class="sv"><b>{{ scheduledCount() }}</b><small>Scheduled</small></div></div>
  </div>

  <div class="cols">
    <div class="list-wrap">
      <div class="list-search"><span class="material-icons">search</span><input [ngModel]="q()" (ngModelChange)="q.set($event)" placeholder="Find a workflow…" /></div>
      <div class="filters">
        <button [class.on]="filter()==='all'" (click)="filter.set('all')">All</button>
        <button [class.on]="filter()==='on'" (click)="filter.set('on')">Active</button>
        <button [class.on]="filter()==='off'" (click)="filter.set('off')">Paused</button>
      </div>
      <div class="card list">
        @for (w of filtered(); track w.id) {
          <div class="wf-row" [class.on]="w.id === selectedId()">
            <button class="wf-item" (click)="selectedId.set(w.id)">
              <span class="wf-ic" [class.off]="!w.enabled"><span class="material-icons">{{ w.enabled ? 'bolt' : 'flash_off' }}</span></span>
              <span class="wf-main">
                <strong>{{ w.name }}</strong>
                <span class="wf-meta"><span class="dot" [class.liv]="w.enabled"></span>{{ w.enabled ? 'Active' : 'Paused' }} · {{ w.actions.length }} step{{ w.actions.length === 1 ? '' : 's' }} · {{ w.lastRun }}</span>
                @if (w.actions.length) { <span class="wf-steps">@for (a of w.actions; track a.id) { <span class="material-icons" [title]="labelFor(a.kind)">{{ iconFor(a.kind) }}</span> }</span> }
              </span>
            </button>
            <label class="switch sm" (click)="$event.stopPropagation()" [title]="w.enabled ? 'Disable' : 'Enable'"><input type="checkbox" [(ngModel)]="w.enabled" /><span class="track"></span></label>
          </div>
        }
        @if (filtered().length === 0) { <p class="cf-muted empty">No workflows match.</p> }
      </div>
    </div>

    @if (selected(); as w) {
      <div class="builder">
        <div class="card sect bhead">
          <label class="fld grow">Workflow name<input [(ngModel)]="w.name" /></label>
          <label class="switch" [title]="w.enabled ? 'Enabled' : 'Disabled'"><input type="checkbox" [(ngModel)]="w.enabled" /><span class="track"></span></label>
          <button class="ic" title="Duplicate workflow" (click)="duplicateWorkflow(w)"><span class="material-icons">content_copy</span></button>
          <button class="ic danger" title="Delete workflow" (click)="deleteWorkflow(w)"><span class="material-icons">delete</span></button>
        </div>

        <div class="card sect insight">
          <div class="flow-sum">
            <span class="fs-when"><span class="material-icons">play_circle</span>{{ w.trigger }}</span>
            @for (a of w.actions; track a.id) {
              <span class="material-icons fs-arr">arrow_forward</span>
              <span class="fs-step" [class.warn]="!isComplete(a)"><span class="material-icons">{{ iconFor(a.kind) }}</span>{{ labelFor(a.kind) }}</span>
            }
            @if (!w.actions.length) { <span class="material-icons fs-arr">arrow_forward</span><span class="fs-empty">add an action…</span> }
          </div>
          @if (issues(w).length) {
            <div class="health warn"><span class="material-icons">warning</span><span>{{ issues(w).length }} item{{ issues(w).length === 1 ? '' : 's' }} need setup — {{ issues(w).join('; ') }}</span></div>
          } @else {
            <div class="health ok"><span class="material-icons">check_circle</span><span>Looks good — ready to run.</span></div>
          }
        </div>

        <div class="flow">
          <!-- trigger -->
          <div class="node">
            <span class="tag when">WHEN</span>
            <div class="card ncard">
              <span class="nic trig"><span class="material-icons">play_circle</span></span>
              <div class="nmain">
                <div class="nhead"><strong>Trigger</strong><span class="sp"></span><button class="ic info" title="What is this trigger?" (click)="openTriggerInfo(w.trigger)"><span class="material-icons">info</span></button></div>
                <select [(ngModel)]="w.trigger">@for (t of triggers; track t) { <option [value]="t">{{ t }}</option> }</select>
              </div>
            </div>
          </div>

          @for (a of w.actions; track a.id; let i = $index) {
            <div class="conn"></div>
            <div class="node">
              <span class="tag">{{ i === 0 ? 'THEN' : 'AND' }}</span>
              <div class="card ncard">
                <span class="nic" [style.--ac]="actionColor(a.kind)"><span class="material-icons">{{ iconFor(a.kind) }}</span></span>
                <div class="nmain">
                  <div class="nhead">
                    <strong>{{ labelFor(a.kind) }}</strong>
                    <span class="sp"></span>
                    <button class="ic info" title="What does this do?" (click)="openActionInfo(a.kind)"><span class="material-icons">info</span></button>
                    <button class="ic" title="Move up" [disabled]="i === 0" (click)="moveAction(i, -1)"><span class="material-icons">keyboard_arrow_up</span></button>
                    <button class="ic" title="Move down" [disabled]="i === w.actions.length - 1" (click)="moveAction(i, 1)"><span class="material-icons">keyboard_arrow_down</span></button>
                    <button class="ic" title="Duplicate step" (click)="duplicateAction(i)"><span class="material-icons">content_copy</span></button>
                    <button class="ic danger" title="Remove" (click)="removeAction(i)"><span class="material-icons">close</span></button>
                  </div>

                  @switch (a.kind) {
                    @case ('email') {
                      <div class="cfg">
                        <div class="two">
                          <label class="fld">To<input [(ngModel)]="a.to" placeholder="Recipient address or field" /></label>
                          <label class="fld">Subject<input [(ngModel)]="a.subject" placeholder="Email subject" /></label>
                        </div>
                        <span class="fld lbl">Message</span>
                        <app-rich-text [(value)]="a.body" [placeholders]="placeholders" placeholder="Compose the email — use Placeholder to insert recipient data like the name or course."></app-rich-text>
                        <p class="hint"><span class="material-icons">lightbulb</span> Tip: type or insert fields like <code>{{ '{{' }}name{{ '}}' }}</code> and they're filled in per recipient when the email is sent.</p>
                      </div>
                    }
                    @case ('review') {
                      <div class="cfg">
                        <label class="fld">Send to reviewer<select [(ngModel)]="a.reviewer">@for (r of reviewers; track r) { <option [value]="r">{{ r }}</option> }</select></label>
                        <label class="fld">Instructions<textarea [(ngModel)]="a.message" rows="2" placeholder="What should the reviewer check before approving?"></textarea></label>
                        <p class="hint"><span class="material-icons">pause_circle</span> The workflow pauses here until the reviewer approves or rejects.</p>
                      </div>
                    }
                    @case ('webhook') {
                      <div class="cfg"><label class="fld">Endpoint URL<input [(ngModel)]="a.url" placeholder="https://your-service/hook" /></label></div>
                    }
                    @case ('wait') {
                      <div class="cfg">
                        <div class="two">
                          <label class="fld">Wait for<input type="number" min="1" [(ngModel)]="a.amount" placeholder="2" /></label>
                          <label class="fld">Unit<select [(ngModel)]="a.unit"><option value="minutes">minutes</option><option value="hours">hours</option><option value="days">days</option></select></label>
                        </div>
                        <p class="hint"><span class="material-icons">schedule</span> The next step runs only after this delay has passed.</p>
                      </div>
                    }
                    @case ('condition') {
                      <div class="cfg cond">
                        <div class="cond-mode">Continue when <select [(ngModel)]="a.match"><option value="all">all</option><option value="any">any</option></select> of these rules match:</div>
                        @for (rule of a.rules ?? []; track $index; let ri = $index) {
                          <div class="rule">
                            <select [(ngModel)]="rule.field">@for (f of fields; track f) { <option [value]="f">{{ f }}</option> }</select>
                            <select [(ngModel)]="rule.op">@for (o of operators; track o.op) { <option [value]="o.op">{{ o.label }}</option> }</select>
                            @if (opNeedsValue(rule.op)) { <input [(ngModel)]="rule.value" placeholder="value" /> }
                            <button class="ic danger" title="Remove rule" [disabled]="(a.rules?.length ?? 0) <= 1" (click)="removeRule(a, ri)"><span class="material-icons">close</span></button>
                          </div>
                        }
                        <button class="add-rule" (click)="addRule(a)"><span class="material-icons">add</span> Add rule</button>
                        <p class="hint cond-sum"><span class="material-icons">alt_route</span> {{ conditionText(a) }}</p>
                      </div>
                    }
                    @default {
                      <div class="cfg"><label class="fld">Note<input [(ngModel)]="a.message" placeholder="Optional details for this step" /></label></div>
                    }
                  }
                </div>
              </div>
            </div>
          }

          <div class="conn"></div>
          <div class="add" [class.open]="pickerOpen()">
            <button class="add-btn" (click)="pickerOpen.set(!pickerOpen())"><span class="material-icons">add</span> Add action</button>
            @if (pickerOpen()) {
              <div class="picker">
                @for (t of actionTypes; track t.kind) {
                  <button (click)="addAction(t.kind)">
                    <span class="material-icons">{{ t.icon }}</span>
                    <span class="pt"><strong>{{ t.label }}</strong><small class="cf-muted">{{ t.desc }}</small></span>
                  </button>
                }
              </div>
            }
          </div>
        </div>

        <div class="save-bar">
          <button class="cf-btn cf-btn-secondary" [disabled]="issues(w).length > 0" (click)="testRun(w)" [title]="issues(w).length ? 'Fix the items above first' : 'Run with sample data'"><span class="material-icons">play_arrow</span> Test run</button>
          <button class="cf-btn cf-btn-primary" (click)="save()"
                  [appHasAction]="A.Automation_Manage" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">save</span> Save workflow</button>
        </div>
      </div>
    } @else {
      <div class="state"><span class="material-icons">bolt</span><h3>Pick a workflow</h3><p class="cf-muted">Select one on the left, or create a new workflow to start building.</p></div>
    }
  </div>

  @if (infoOpen(); as info) {
    <div class="info-backdrop" (click)="closeInfo()">
      <div class="info-pop" (click)="$event.stopPropagation()" [style.--ga]="info.color">
        <button class="info-x" (click)="closeInfo()" title="Close"><span class="material-icons">close</span></button>
        <div class="info-head"><span class="info-ic"><span class="material-icons">{{ info.icon }}</span></span><h4>{{ info.title }}</h4></div>
        <p class="info-desc">{{ info.what }}</p>
        @if (info.needs) { <div class="info-row"><span class="ir-k"><span class="material-icons">checklist</span> Needs</span><span class="ir-v">{{ info.needs }}</span></div> }
        @if (info.tip) { <div class="info-tip"><span class="material-icons">lightbulb</span> {{ info.tip }}</div> }
      </div>
    </div>
  }
  `,
  styles: [`
    :host{display:block}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
    .head h1{font-size:22px}
    .cf-btn .material-icons{font-size:18px}
    .caret{font-size:18px!important;margin-inline-start:1px}
    .newwrap{position:relative}
    .recipes{position:absolute;top:calc(100% + 8px);inset-inline-end:0;width:300px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:var(--cf-radius-md);box-shadow:var(--cf-shadow-lg);padding:6px;z-index:60}
    .recipe{display:flex;align-items:center;gap:11px;width:100%;padding:9px 10px;border:0;background:none;border-radius:var(--cf-radius-sm);cursor:pointer;text-align:start;font:inherit}
    .recipe:hover{background:var(--cf-surface-2)}
    .recipe>.material-icons{font-size:20px;color:var(--cf-brand-600);flex:none}
    .recipe .rc{display:flex;flex-direction:column;min-width:0}
    .recipe .rc strong{font-size:13px;color:var(--cf-ink-900)}
    .recipe .rc small{font-size:11px}
    .rc-sep{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--cf-ink-400);padding:9px 10px 4px}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px}
    .stat{display:flex;align-items:center;gap:12px;padding:13px 15px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-md);background:var(--cf-surface)}
    .stat>.material-icons{width:38px;height:38px;flex:none;display:grid;place-items:center;border-radius:10px;font-size:20px;background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .stat.live>.material-icons{background:#dcfce7;color:#16a34a}
    .sv{display:flex;flex-direction:column;line-height:1.1}
    .sv b{font-size:20px;font-weight:800;color:var(--cf-ink-900)}
    .sv small{font-size:11.5px;color:var(--cf-ink-500)}
    .cols{display:grid;grid-template-columns:280px minmax(0,1fr);gap:18px;align-items:start}
    .cols>*{min-width:0}
    .list-wrap{display:flex;flex-direction:column;gap:8px;min-width:0}
    .list-search{display:flex;align-items:center;gap:7px;height:36px;padding:0 10px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);background:var(--cf-surface-2)}
    .list-search .material-icons{font-size:17px;color:var(--cf-ink-400)}
    .list-search input{flex:1;border:0;background:none;height:auto;padding:0;font:inherit;font-size:13px;outline:none;box-shadow:none}
    .filters{display:flex;gap:6px}
    .filters button{flex:1;padding:5px 0;border:1px solid var(--cf-line);border-radius:999px;background:var(--cf-surface);color:var(--cf-ink-600);font:inherit;font-size:11.5px;font-weight:600;cursor:pointer}
    .filters button.on{border-color:var(--cf-brand-500);background:var(--cf-brand-50);color:var(--cf-brand-700)}
    .list{padding:8px;display:flex;flex-direction:column;gap:2px}
    .wf-row{display:flex;align-items:center;gap:4px;border-radius:var(--cf-radius-sm);padding-inline-end:8px;min-width:0}
    .wf-row.on{background:var(--cf-brand-50)}
    .wf-row.on .wf-main strong{color:var(--cf-brand-700)}
    .wf-meta{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--cf-ink-500);margin-top:1px}
    .dot{width:7px;height:7px;border-radius:50%;background:var(--cf-ink-400);flex:none}
    .dot.liv{background:#22c55e}
    .wf-steps{display:flex;gap:4px;margin-top:5px}
    .wf-steps .material-icons{font-size:14px;color:var(--cf-ink-400)}
    .switch.sm{width:34px;height:20px;margin:0;flex:none}
    .switch.sm .track::after{width:16px;height:16px}
    .switch.sm input:checked + .track::after{inset-inline-start:16px}
    .insight{display:flex;flex-direction:column;gap:12px;padding:16px}
    .flow-sum{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .fs-when,.fs-step{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;font-size:12.5px;font-weight:600}
    .fs-when{background:var(--cf-brand-50);color:var(--cf-brand-700)}
    .fs-when .material-icons{font-size:16px}
    .fs-step{background:var(--cf-surface-2);color:var(--cf-ink-700);border:1px solid var(--cf-line)}
    .fs-step .material-icons{font-size:16px;color:var(--cf-ink-500)}
    .fs-step.warn{background:#fffbeb;border-color:#fde68a;color:#92400e}
    .fs-step.warn .material-icons{color:#d97706}
    .fs-arr{font-size:16px!important;color:var(--cf-ink-400)}
    .fs-empty{font-size:12.5px;color:var(--cf-ink-400);font-style:italic}
    .health{display:flex;align-items:center;gap:8px;font-size:12.5px;padding:9px 12px;border-radius:var(--cf-radius-sm)}
    .health .material-icons{font-size:17px;flex:none}
    .health.ok{background:#f0fdf4;color:#15803d}
    .health.warn{background:#fffbeb;color:#b45309}
    .empty{padding:14px;text-align:center;font-size:13px}
    .wf-item{flex:1;min-width:0;display:flex;align-items:center;gap:11px;padding:10px 11px;border:0;background:none;border-radius:var(--cf-radius-sm);cursor:pointer;text-align:start;font:inherit}
    .wf-item:hover{background:var(--cf-surface-2)}
    .wf-item.on{background:var(--cf-brand-50)}
    .wf-item.on .wf-main strong{color:var(--cf-brand-700)}
    .wf-ic{width:34px;height:34px;border-radius:9px;background:var(--cf-brand-50);color:var(--cf-brand-600);display:grid;place-items:center;flex:none}
    .wf-ic.off{background:var(--cf-surface-2);color:var(--cf-ink-400)}
    .wf-ic .material-icons{font-size:19px}
    .wf-main{flex:1;min-width:0;display:flex;flex-direction:column}
    .wf-main strong{font-size:13.5px;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .wf-main small{font-size:11.5px}
    .builder{display:flex;flex-direction:column;gap:14px;min-width:0}
    .bhead{display:flex;align-items:flex-end;gap:14px;padding:16px}
    .fld{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:500;color:var(--cf-ink-600)}
    .fld.grow{flex:1}
    .fld.lbl{margin-bottom:6px}
    input,select,textarea{border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);padding:8px 10px;font:inherit;font-size:13.5px;background:var(--cf-surface);color:var(--cf-ink-900);outline:none}
    input,select{height:38px;padding:0 10px}
    textarea{resize:vertical}
    input:focus,select:focus,textarea:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .switch{position:relative;display:inline-block;width:42px;height:24px;flex:none;cursor:pointer;margin-bottom:6px}
    .switch input{position:absolute;opacity:0;width:0;height:0}
    .track{position:absolute;inset:0;border-radius:999px;background:var(--cf-ink-400);transition:.18s}
    .track::after{content:'';position:absolute;top:2px;inset-inline-start:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.18s}
    .switch input:checked + .track{background:var(--cf-brand-600)}
    .switch input:checked + .track::after{inset-inline-start:20px}
    .ic{width:32px;height:32px;border-radius:8px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-500);display:grid;place-items:center;cursor:pointer}
    .ic:hover{background:var(--cf-surface-2);color:var(--cf-ink-900)}
    .ic:disabled{opacity:.4;cursor:default}
    .ic.danger:hover{background:var(--cf-danger-soft);color:var(--cf-danger)}
    .ic .material-icons{font-size:18px}
    .flow{display:flex;flex-direction:column;align-items:stretch}
    .node{position:relative;padding-inline-start:64px}
    .tag{position:absolute;inset-inline-start:0;top:14px;width:50px;text-align:center;font-size:10px;font-weight:700;letter-spacing:.05em;color:var(--cf-ink-400)}
    .tag.when{color:var(--cf-brand-600)}
    .ncard{display:flex;gap:12px;padding:14px}
    .nic{width:38px;height:38px;border-radius:10px;background:var(--cf-surface-2);color:var(--cf-ink-600);display:grid;place-items:center;flex:none}
    .nic.trig{background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .nic .material-icons{font-size:20px;color:var(--ac, inherit)}
    .ic.info:hover{border-color:var(--cf-brand-500);color:var(--cf-brand-600)}
    .nmain{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}
    .nmain>strong{font-size:14px;color:var(--cf-ink-900)}
    .nhead{display:flex;align-items:center;gap:4px}
    .nhead strong{font-size:14px;color:var(--cf-ink-900)}
    .nhead .sp{flex:1}
    .conn{width:2px;height:18px;background:var(--cf-line);margin-inline-start:82px}
    .cfg{display:flex;flex-direction:column;gap:10px;margin-top:2px}
    .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .hint{display:flex;align-items:flex-start;gap:7px;font-size:12px;color:var(--cf-ink-500);margin:0}
    .hint .material-icons{font-size:16px;color:var(--cf-brand-500)}
    .hint code{font-family:'Courier New',monospace;background:var(--cf-brand-50);color:var(--cf-brand-700);padding:0 4px;border-radius:4px}
    .cond{gap:8px}
    .cond-mode{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:12.5px;color:var(--cf-ink-600)}
    .cond-mode select{height:32px;width:auto;flex:none;padding:0 8px}
    .rule{display:flex;align-items:center;gap:6px}
    .rule select,.rule input{height:34px;min-width:0;flex:1}
    .rule .ic{flex:none}
    .add-rule{align-self:flex-start;display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 12px;border:1px dashed var(--cf-line);border-radius:var(--cf-radius-sm);background:var(--cf-surface);color:var(--cf-brand-600);font:inherit;font-size:12.5px;font-weight:600;cursor:pointer}
    .add-rule:hover{border-color:var(--cf-brand-500);background:var(--cf-brand-50)}
    .add-rule .material-icons{font-size:16px}
    .cond-sum{background:var(--cf-surface-2);border-radius:var(--cf-radius-sm);padding:8px 11px;align-items:center}
    .cond-sum .material-icons{color:#e11d48}
    .add{position:relative;padding-inline-start:64px}
    .add-btn{display:inline-flex;align-items:center;gap:7px;height:40px;padding:0 16px;border:1px dashed var(--cf-line);border-radius:var(--cf-radius-md);background:var(--cf-surface);color:var(--cf-brand-600);font:inherit;font-size:13.5px;font-weight:600;cursor:pointer}
    .add-btn:hover{border-color:var(--cf-brand-500);background:var(--cf-brand-50)}
    .add-btn .material-icons{font-size:19px}
    .picker{margin-top:8px;width:340px;max-width:100%;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:var(--cf-radius-md);box-shadow:var(--cf-shadow-lg);padding:6px}
    .picker button{display:flex;align-items:center;gap:11px;width:100%;padding:10px 11px;border:0;background:none;border-radius:var(--cf-radius-sm);cursor:pointer;text-align:start;font:inherit}
    .picker button:hover{background:var(--cf-surface-2)}
    .picker .material-icons{font-size:20px;color:var(--cf-brand-600);flex:none}
    .picker .pt{display:flex;flex-direction:column}
    .picker .pt strong{font-size:13.5px;color:var(--cf-ink-900)}
    .picker .pt small{font-size:11.5px}
    .save-bar{display:flex;justify-content:flex-end;gap:10px}
    .info-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.45);display:grid;place-items:center;z-index:90;padding:20px;animation:fade .12s ease}
    .info-pop{position:relative;width:min(440px,100%);background:var(--cf-surface);border:1px solid var(--cf-line);border-top:4px solid var(--ga);border-radius:var(--cf-radius-md);box-shadow:var(--cf-shadow-lg);padding:20px}
    .info-x{position:absolute;top:12px;inset-inline-end:12px;width:30px;height:30px;display:grid;place-items:center;border:0;background:none;border-radius:8px;color:var(--cf-ink-500);cursor:pointer}
    .info-x:hover{background:var(--cf-surface-2);color:var(--cf-ink-800)}
    .info-x .material-icons{font-size:19px}
    .info-head{display:flex;align-items:center;gap:12px;margin-bottom:12px;padding-inline-end:30px}
    .info-ic{width:38px;height:38px;flex:none;display:grid;place-items:center;border-radius:10px;background:var(--ga)}
    .info-ic .material-icons{font-size:20px;color:#fff}
    .info-head h4{margin:0;font-size:16px;color:var(--cf-ink-900)}
    .info-desc{margin:0 0 14px;font-size:13.5px;line-height:1.55;color:var(--cf-ink-700)}
    .info-row{display:flex;flex-direction:column;gap:4px;padding-top:12px;border-top:1px solid var(--cf-line);margin-bottom:10px}
    .ir-k{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:var(--cf-ink-500)}
    .ir-k .material-icons{font-size:15px}
    .ir-v{font-size:13px;color:var(--cf-ink-700);line-height:1.5}
    .info-tip{display:flex;align-items:flex-start;gap:7px;font-size:12.5px;color:var(--cf-ink-600);background:var(--cf-surface-2);border-radius:var(--cf-radius-sm);padding:9px 11px}
    .info-tip .material-icons{font-size:16px;color:var(--ga);flex:none}
    @keyframes fade{from{opacity:0}to{opacity:1}}
    .state{max-width:420px;margin:8vh auto;text-align:center;color:var(--cf-ink-600)}
    .state .material-icons{font-size:42px;color:var(--cf-brand-500)}
    .state h3{margin:10px 0 4px;color:var(--cf-ink-900)}
    @media(max-width:900px){.cols{grid-template-columns:1fr}.two{grid-template-columns:1fr}}
  `],
})
export class AutomationPage {
  readonly A = Actions;
  private alerts = inject(AlertService);

  triggers = [
    'A batch finishes generating',
    'A credential is issued',
    'A credential is approved',
    'A new user is invited',
    'Every day at 6:00 AM',
    'Every Monday at 9:00 AM',
  ];
  reviewers = ['Any admin', 'Mostafa Mahmoud', 'Lina Saeed', 'Karim Adel'];
  placeholders = ['name', 'email', 'course', 'date', 'signature1', 'organization', 'credential_id'];

  actionTypes: ActionType[] = [
    { kind: 'email', label: 'Send email', icon: 'mail', desc: 'Compose and send an email', color: '#0ea5e9',
      long: 'Composes and sends a personalised email to each recipient, merging fields from the certificate data.',
      needs: 'A recipient address (or a {{field}}) and a subject line.',
      tip: 'Insert fields like {{name}} or {{course}} — they are filled in per recipient when the email is sent.' },
    { kind: 'review', label: 'Send for review', icon: 'fact_check', desc: 'Pause for an approver', color: '#f59e0b',
      long: 'Pauses the workflow and routes the credential to a reviewer, who must approve before it continues.',
      needs: 'A reviewer — a specific person or “Any admin”.',
      tip: 'Use this as a quality gate before certificates are emailed out.' },
    { kind: 'condition', label: 'Condition', icon: 'alt_route', desc: 'Continue only if criteria match', color: '#e11d48',
      long: 'Checks the recipient data against your rules and only lets the workflow continue when they match — like a smart filter or gate.',
      needs: 'At least one rule — a field, an operator, and (for most operators) a value.',
      tip: 'Use it to email certificates only to people who passed, or to skip steps for a segment.' },
    { kind: 'notify', label: 'Notify admins', icon: 'notifications', desc: 'In-app / email notification', color: '#8b5cf6',
      long: 'Sends an in-app and email notification to your workspace admins.',
      needs: 'Nothing — an optional note can be added.',
      tip: 'Keep the team informed when an important event happens.' },
    { kind: 'slack', label: 'Post to Slack', icon: 'tag', desc: 'Send a message to a channel', color: '#10b981',
      long: 'Posts a message to a Slack channel through your connected workspace.',
      needs: 'A connected Slack workspace and a target channel.',
      tip: 'Announce new certificates to a #certificates channel automatically.' },
    { kind: 'report', label: 'Generate report', icon: 'summarize', desc: 'Build a summary report', color: '#6366f1',
      long: 'Builds a summary report of the run — totals, recipients and status.',
      needs: 'Nothing.',
      tip: 'Pair it with “Send email” to deliver the report to a manager.' },
    { kind: 'export', label: 'Export to ZIP', icon: 'folder_zip', desc: 'Bundle the files into a ZIP', color: '#ec4899',
      long: 'Bundles all generated certificates from the run into a single ZIP archive.',
      needs: 'Nothing.',
      tip: 'Handy for archiving a batch or sharing it as one download.' },
    { kind: 'webhook', label: 'Call webhook', icon: 'webhook', desc: 'POST data to a URL', color: '#0891b2',
      long: 'Sends the run data as JSON to an external URL (HTTP POST) so other systems can react.',
      needs: 'An HTTPS endpoint URL.',
      tip: 'Push data into your CRM, LMS, or a Zapier / Make hook.' },
    { kind: 'wait', label: 'Wait / delay', icon: 'schedule', desc: 'Pause before the next step', color: '#64748b',
      long: 'Pauses the workflow for a set amount of time before running the next step.',
      needs: 'A duration in minutes, hours or days.',
      tip: 'Add a delay before sending a reminder or a follow-up email.' },
  ];

  private wseq = 10;
  private aseq = 100;
  pickerOpen = signal(false);

  workflows = signal<Workflow[]>([
    { id: 1, name: 'Deliver certificates after a batch', trigger: 'A batch finishes generating', enabled: true, lastRun: '2 days ago', actions: [
      { id: 11, kind: 'email', to: '{{email}}', subject: 'Your {{course}} certificate', body: '<p>Hi {{name}},</p><p>Congratulations on completing <b>{{course}}</b>! Your certificate is attached.</p><p>Issued on {{date}}.</p>' },
    ] },
    { id: 2, name: 'Approve awards before sending', trigger: 'A credential is issued', enabled: false, lastRun: 'Never', actions: [
      { id: 21, kind: 'review', reviewer: 'Any admin', message: 'Check the recipient name and award title are correct.' },
      { id: 22, kind: 'email', to: '{{email}}', subject: 'You have earned an award', body: '<p>Dear {{name}},</p><p>You have been recognized with an award. The certificate is attached.</p>' },
    ] },
  ]);
  selectedId = signal(1);
  selected = computed(() => this.workflows().find((w) => w.id === this.selectedId()));

  // ---- list search + filter ----
  q = signal('');
  filter = signal<'all' | 'on' | 'off'>('all');
  filtered = computed(() => {
    const s = this.q().trim().toLowerCase();
    const f = this.filter();
    return this.workflows().filter((w) =>
      (f === 'all' || (f === 'on' ? w.enabled : !w.enabled)) &&
      (!s || w.name.toLowerCase().includes(s)));
  });

  // ---- summary stats ----
  activeCount = computed(() => this.workflows().filter((w) => w.enabled).length);
  totalSteps = computed(() => this.workflows().reduce((s, w) => s + w.actions.length, 0));
  scheduledCount = computed(() => this.workflows().filter((w) => w.trigger.startsWith('Every')).length);

  // ---- quick-start recipes ----
  recipeMenuOpen = signal(false);
  @HostListener('document:click') closeMenus(): void { if (this.recipeMenuOpen()) this.recipeMenuOpen.set(false); }
  @HostListener('document:keydown.escape') onEsc(): void { this.recipeMenuOpen.set(false); this.infoOpen.set(null); }
  recipes: { key: string; name: string; desc: string; icon: string; trigger: string; kinds: ActionKind[] }[] = [
    { key: 'deliver', name: 'Deliver after batch', desc: 'Email each recipient when a batch finishes', icon: 'mark_email_read', trigger: 'A batch finishes generating', kinds: ['email'] },
    { key: 'gate', name: 'Approval gate', desc: 'Review before issuing, then email', icon: 'verified', trigger: 'A credential is issued', kinds: ['review', 'email'] },
    { key: 'announce', name: 'Announce on Slack', desc: 'Post to a channel and notify admins', icon: 'tag', trigger: 'A credential is issued', kinds: ['slack', 'notify'] },
    { key: 'passgate', name: 'Email only those who passed', desc: 'Check a condition, then send the email', icon: 'alt_route', trigger: 'A batch finishes generating', kinds: ['condition', 'email'] },
    { key: 'digest', name: 'Weekly report', desc: 'Build & email a report every Monday', icon: 'summarize', trigger: 'Every Monday at 9:00 AM', kinds: ['report', 'email'] },
  ];
  createFromRecipe(r: { name: string; trigger: string; kinds: ActionKind[] }): void {
    const id = ++this.wseq;
    const actions = r.kinds.map((k) => this.makeAction(k));
    this.workflows.update((l) => [...l, { id, name: r.name, trigger: r.trigger, enabled: false, lastRun: 'Never', actions }]);
    this.selectedId.set(id);
    this.recipeMenuOpen.set(false);
    this.alerts.success('Workflow created from recipe.');
  }

  duplicateWorkflow(w: Workflow): void {
    const id = ++this.wseq;
    const actions = w.actions.map((a) => ({ ...a, id: ++this.aseq }));
    this.workflows.update((l) => [...l, { ...w, id, name: w.name + ' (copy)', enabled: false, lastRun: 'Never', actions }]);
    this.selectedId.set(id);
    this.alerts.success('Workflow duplicated.');
  }

  // ---- smart validation ----
  isComplete(a: WAction): boolean {
    if (a.kind === 'email') return !!(a.to && a.subject);
    if (a.kind === 'review') return !!a.reviewer;
    if (a.kind === 'webhook') return !!a.url;
    if (a.kind === 'wait') return !!a.amount && a.amount > 0;
    if (a.kind === 'condition') return !!a.rules?.length && a.rules.every((r) => r.field && r.op && (!this.opNeedsValue(r.op) || !!r.value));
    return true;
  }
  issues(w: Workflow): string[] {
    const out: string[] = [];
    if (!w.actions.length) out.push('add at least one action');
    w.actions.forEach((a, i) => {
      if (a.kind === 'email' && !a.to) out.push(`step ${i + 1} email needs a recipient`);
      else if (a.kind === 'email' && !a.subject) out.push(`step ${i + 1} email needs a subject`);
      else if (a.kind === 'review' && !a.reviewer) out.push(`step ${i + 1} needs a reviewer`);
      else if (a.kind === 'webhook' && !a.url) out.push(`step ${i + 1} webhook needs a URL`);
      else if (a.kind === 'wait' && (!a.amount || a.amount <= 0)) out.push(`step ${i + 1} needs a duration`);
      else if (a.kind === 'condition' && !this.isComplete(a)) out.push(`step ${i + 1} condition needs a value`);
    });
    return out;
  }

  private makeAction(kind: ActionKind): WAction {
    const id = ++this.aseq;
    const a: WAction = { id, kind };
    if (kind === 'email') { a.to = '{{email}}'; a.subject = ''; a.body = ''; }
    else if (kind === 'review') { a.reviewer = this.reviewers[0]; a.message = ''; }
    else if (kind === 'webhook') { a.url = ''; }
    else if (kind === 'wait') { a.amount = 1; a.unit = 'hours'; }
    else if (kind === 'condition') { a.match = 'all'; a.rules = [{ field: this.fields[0], op: 'eq', value: '' }]; }
    else { a.message = ''; }
    return a;
  }
  duplicateAction(i: number): void {
    const sid = this.selectedId();
    this.workflows.update((l) => l.map((w) => {
      if (w.id !== sid) return w;
      const acts = [...w.actions];
      acts.splice(i + 1, 0, { ...acts[i], id: ++this.aseq });
      return { ...w, actions: acts };
    }));
  }
  testRun(w: Workflow): void {
    this.alerts.info(w.actions.length + ' step' + (w.actions.length === 1 ? '' : 's') + ' ran with sample data — nothing was actually sent.', { title: 'Test run complete' });
  }

  iconFor(k: ActionKind): string { return this.actionTypes.find((t) => t.kind === k)?.icon ?? 'bolt'; }
  labelFor(k: ActionKind): string { return this.actionTypes.find((t) => t.kind === k)?.label ?? k; }

  // ---- conditions ----
  fields = ['score', 'status', 'course', 'department', 'name', 'email', 'organization', 'date', 'credential_id'];
  operators = [
    { op: 'eq', label: 'is' },
    { op: 'ne', label: 'is not' },
    { op: 'contains', label: 'contains' },
    { op: 'gt', label: 'is greater than' },
    { op: 'lt', label: 'is less than' },
    { op: 'gte', label: 'is at least' },
    { op: 'lte', label: 'is at most' },
    { op: 'empty', label: 'is empty' },
    { op: 'notempty', label: 'is not empty' },
  ];
  opNeedsValue(op: string): boolean { return op !== 'empty' && op !== 'notempty'; }
  opLabel(op: string): string { return this.operators.find((o) => o.op === op)?.label ?? op; }
  addRule(a: WAction): void { a.rules = [...(a.rules ?? []), { field: this.fields[0], op: 'eq', value: '' }]; }
  removeRule(a: WAction, i: number): void { a.rules = (a.rules ?? []).filter((_, k) => k !== i); }
  conditionText(a: WAction): string {
    const rules = a.rules ?? [];
    if (!rules.length) return 'No rules yet — this gate lets everything through.';
    const parts = rules.map((r) => this.opNeedsValue(r.op) ? `${r.field} ${this.opLabel(r.op)} ${r.value || '…'}` : `${r.field} ${this.opLabel(r.op)}`);
    return 'Continue when ' + (a.match === 'any' ? 'any' : 'all') + ': ' + parts.join(a.match === 'any' ? '  ·  OR  ·  ' : '  ·  AND  ·  ');
  }
  actionColor(k: ActionKind): string { return this.actionTypes.find((t) => t.kind === k)?.color ?? '#6366f1'; }

  // ---- info popup ----
  infoOpen = signal<InfoCard | null>(null);
  closeInfo(): void { this.infoOpen.set(null); }
  openActionInfo(k: ActionKind): void {
    const t = this.actionTypes.find((x) => x.kind === k);
    if (t) this.infoOpen.set({ icon: t.icon, color: t.color, title: t.label, what: t.long, needs: t.needs, tip: t.tip });
  }
  triggerDesc: Record<string, string> = {
    'A batch finishes generating': 'Runs right after a bulk-generation job completes, with access to every certificate in that batch.',
    'A credential is issued': 'Runs each time a single certificate is generated and issued.',
    'A credential is approved': 'Runs when a reviewer approves a pending certificate.',
    'A new user is invited': 'Runs when a new person is invited to the workspace.',
    'Every day at 6:00 AM': 'A scheduled trigger that runs once every day at 6:00 AM.',
    'Every Monday at 9:00 AM': 'A scheduled trigger that runs every week on Monday at 9:00 AM.',
  };
  openTriggerInfo(trigger: string): void {
    this.infoOpen.set({ icon: 'play_circle', color: '#4f46e5', title: trigger, what: this.triggerDesc[trigger] ?? 'Starts the workflow.', tip: 'The trigger is the event that kicks off every step below it.' });
  }

  newWorkflow(): void {
    const id = ++this.wseq;
    this.workflows.update((l) => [...l, { id, name: 'New workflow', trigger: this.triggers[0], enabled: true, lastRun: 'Never', actions: [] }]);
    this.selectedId.set(id);
    this.pickerOpen.set(false);
  }

  async deleteWorkflow(w: Workflow): Promise<void> {
    const ok = await this.alerts.confirm({ title: 'Delete workflow', message: 'Delete the "' + w.name + '" workflow?', danger: true, confirmText: 'Delete' });
    if (!ok) return;
    this.workflows.update((l) => l.filter((x) => x.id !== w.id));
    const first = this.workflows()[0];
    this.selectedId.set(first ? first.id : 0);
    this.alerts.success('Workflow deleted.');
  }

  addAction(kind: ActionKind): void {
    const sid = this.selectedId();
    const a = this.makeAction(kind);
    this.workflows.update((l) => l.map((w) => (w.id === sid ? { ...w, actions: [...w.actions, a] } : w)));
    this.pickerOpen.set(false);
  }

  removeAction(i: number): void {
    const sid = this.selectedId();
    this.workflows.update((l) => l.map((w) => (w.id === sid ? { ...w, actions: w.actions.filter((_, k) => k !== i) } : w)));
  }

  moveAction(i: number, dir: -1 | 1): void {
    const sid = this.selectedId();
    this.workflows.update((l) => l.map((w) => {
      if (w.id !== sid) return w;
      const acts = [...w.actions];
      const j = i + dir;
      if (j < 0 || j >= acts.length) return w;
      [acts[i], acts[j]] = [acts[j], acts[i]];
      return { ...w, actions: acts };
    }));
  }

  save(): void { this.alerts.success('Workflow saved.', { title: 'Automation' }); }
}

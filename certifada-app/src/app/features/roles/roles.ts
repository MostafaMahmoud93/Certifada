import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { AlertService } from '../../core/services/alert.service';

interface PermGroup { area: string; icon: string; color: string; perms: { code: string; label: string; desc: string }[]; }
interface Role { id: number; name: string; desc: string; system: boolean; perms: string[]; color: string; members: number; }
interface Level { label: string; color: string; bg: string; }

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [FormsModule, HasActionDirective],
  template: `
  <div class="head">
    <div>
      <h1>Roles &amp; permissions</h1>
      <p class="cf-muted">Define what each role can do — dependencies are handled for you.</p>
    </div>
    <button class="cf-btn cf-btn-primary" (click)="addRole()"
            [appHasAction]="A.Role_Manage" [tooltipMessage]="'🔒 Managing roles isn\\'t in your plan.'">
      <span class="material-icons">add</span> New role
    </button>
  </div>

  <div class="stats">
    <div class="stat"><span class="material-icons">badge</span><div class="st-v"><b>{{ roles().length }}</b><small>Roles</small></div></div>
    <div class="stat sens-stat"><span class="material-icons">shield</span><div class="st-v"><b>{{ sensitiveCount() }}</b><small>Sensitive</small></div></div>
    <div class="stat"><span class="material-icons">group</span><div class="st-v"><b>{{ totalMembers() }}</b><small>Members</small></div></div>
    <div class="stat"><span class="material-icons">tune</span><div class="st-v"><b>{{ avgAccess() }}%</b><small>Avg access</small></div></div>
  </div>

  <div class="cols">
    <!-- Role list -->
    <div class="list">
      <div class="list-search"><span class="material-icons">search</span><input [ngModel]="rq()" (ngModelChange)="rq.set($event)" placeholder="Find a role…" /></div>
      @for (r of filteredRoles(); track r.id) {
        <button class="role-item card" [class.on]="r.id === selectedId()" (click)="selectedId.set(r.id)">
          <span class="ravatar" [style.background]="r.color">{{ initial(r) }}</span>
          <span class="ri-main">
            <strong>{{ r.name }}
              @if (r.system) { <span class="lock material-icons" title="Built-in role">lock</span> }
              @if (isSensitive(r)) { <span class="sens material-icons" title="Elevated permissions">shield</span> }
            </strong>
            <small class="cf-muted">{{ r.members }} {{ r.members === 1 ? 'member' : 'members' }} · {{ r.perms.length }} perms</small>
            <span class="ri-bar"><i [style.width.%]="accessPct(r) * 100" [style.background]="r.color"></i></span>
          </span>
        </button>
      }
    </div>

    @if (selected(); as r) {
      <div class="detail">
        <!-- Header -->
        <div class="card sect rhead">
          <span class="ravatar lg" [style.background]="r.color">{{ initial(r) }}</span>
          <div class="rhead-meta">
            <input class="rname" [(ngModel)]="r.name" [disabled]="r.system" placeholder="Role name" />
            <input class="rdesc" [(ngModel)]="r.desc" [disabled]="r.system" placeholder="What this role is for…" />
            <div class="caps">
              @for (cap of caps(r); track cap.label) {
                <span class="cap"><span class="material-icons">{{ cap.icon }}</span>{{ cap.label }}</span>
              }
            </div>
          </div>
          <div class="rhead-side">
            <span class="lvl" [style.color]="lvl(r).color" [style.background]="lvl(r).bg">{{ lvl(r).label }}</span>
            @if (isSensitive(r)) { <span class="sens-pill"><span class="material-icons">shield</span> Sensitive</span> }
            @if (isDirty()) { <span class="dirty-pill"><span class="material-icons">edit</span> Unsaved</span> }
            <span class="cf-muted xs">{{ r.perms.length }} / {{ total }} permissions</span>
          </div>
        </div>

        <!-- Smart toolbar -->
        <div class="card sect tools">
          <div class="search"><span class="material-icons">search</span>
            <input [ngModel]="q()" (ngModelChange)="q.set($event)" placeholder="Search permissions…" /></div>
          <label class="copy">Start from
            <select [disabled]="r.system" (change)="copyFrom(r, $any($event.target).value); $any($event.target).value=''">
              <option value="">choose…</option>
              @for (o of roles(); track o.id) { @if (o.id !== r.id) { <option [value]="o.id">{{ o.name }}</option> } }
            </select>
          </label>
          <label class="copy">Compare
            <select [ngModel]="compareId() ?? ''" (ngModelChange)="compareId.set($event ? +$event : null)">
              <option value="">off</option>
              @for (o of roles(); track o.id) { @if (o.id !== r.id) { <option [value]="o.id">{{ o.name }}</option> } }
            </select>
          </label>
          <button class="cf-btn cf-btn-secondary sm" (click)="cloneRole(r)" title="Duplicate this role"><span class="material-icons">content_copy</span> Clone</button>
          @if (!r.system) {
            <button class="iconbtn danger" (click)="deleteRole(r)" title="Delete role"><span class="material-icons">delete</span></button>
          }
        </div>

        @if (!r.system) {
          <div class="card sect presets">
            <span class="ps-label">Quick presets</span>
            <div class="ps-row">
              @for (p of presets; track p.key) {
                <button class="ps" (click)="applyPreset(r, p.codes)">{{ p.label }}</button>
              }
            </div>
          </div>
        }

        @if (r.system) {
          <div class="banner"><span class="material-icons">lock</span> This is a built-in role. <button class="link" (click)="cloneRole(r)">Clone it</button> to customise permissions.</div>
        }
        @if (compareRole(); as cmp) {
          <div class="card sect cmp">
            <div class="cmp-top"><span class="material-icons">compare_arrows</span> Comparison</div>
            <div class="cmp-head">
              <div class="cmp-role">
                <span class="ravatar sm" [style.background]="r.color">{{ initial(r) }}</span>
                <span class="cmp-meta"><b>{{ r.name }}</b><span class="lvl xs2" [style.color]="lvl(r).color" [style.background]="lvl(r).bg">{{ lvl(r).label }}</span></span>
              </div>
              <button class="cmp-swap" (click)="swapCompare(r)" title="Swap sides"><span class="material-icons">swap_horiz</span></button>
              <div class="cmp-role rev">
                <span class="cmp-meta end"><b>{{ cmp.name }}</b><span class="lvl xs2" [style.color]="lvl(cmp).color" [style.background]="lvl(cmp).bg">{{ lvl(cmp).label }}</span></span>
                <span class="ravatar sm" [style.background]="cmp.color">{{ initial(cmp) }}</span>
              </div>
            </div>

            <div class="cmp-bar">
              @if (diffMore(r)) { <i class="seg a" [style.flex]="diffMore(r)" [title]="'Only ' + r.name"></i> }
              @if (diffShared(r)) { <i class="seg s" [style.flex]="diffShared(r)" title="Shared"></i> }
              @if (diffFewer(r)) { <i class="seg b" [style.flex]="diffFewer(r)" [title]="'Only ' + cmp.name"></i> }
            </div>
            <div class="cmp-legend">
              <span><i class="d a"></i> Only here · <b>{{ diffMore(r) }}</b></span>
              <span><i class="d s"></i> Shared · <b>{{ diffShared(r) }}</b></span>
              <span><i class="d b"></i> Only {{ cmp.name }} · <b>{{ diffFewer(r) }}</b></span>
            </div>

            <div class="cmp-areas">
              @for (g of groups; track g.area) {
                <div class="cmp-area" [class.diff]="groupCount(r, g) !== groupCount(cmp, g)">
                  <span class="ca-name"><span class="material-icons">{{ g.icon }}</span> {{ g.area }}</span>
                  <span class="ca-cnt"><b>{{ groupCount(r, g) }}</b><i>vs</i><b>{{ groupCount(cmp, g) }}</b></span>
                </div>
              }
            </div>

            @if (!r.system && diffFewer(r) > 0) {
              <div class="cmp-acts">
                <button class="cf-btn cf-btn-secondary sm" (click)="addMissing(r)"><span class="material-icons">add</span> Add the {{ diffFewer(r) }} {{ cmp.name }} has</button>
                <button class="cf-btn cf-btn-secondary sm" (click)="copyFrom(r, cmp.id + '')"><span class="material-icons">sync_alt</span> Match exactly</button>
              </div>
            } @else if (diffMore(r) === 0 && diffFewer(r) === 0) {
              <p class="cmp-eq"><span class="material-icons">check_circle</span> Identical permissions.</p>
            }
          </div>
        }
        @if (twinName(r); as twin) {
          <div class="banner warn"><span class="material-icons">info</span> Identical permissions to <b>{{ twin }}</b> — consider merging or differentiating.</div>
        }

        @if (filteredGroups().length) {
        <div class="groups">
        @for (g of filteredGroups(); track g.area) {
          <div class="gcard" [style.--ga]="g.color">
            <div class="ghead">
              <span class="gicon"><span class="material-icons">{{ g.icon }}</span></span>
              <span class="gh-title">{{ g.area }}</span>
              <button class="gtoggle" [class.full]="areaAll(r, g)" [class.some]="areaSome(r, g)" [disabled]="r.system"
                      (click)="toggleArea(r, g)" [title]="areaAll(r, g) ? 'Clear all' : 'Select all'">
                <span class="material-icons">{{ areaAll(r, g) ? 'check_box' : (areaSome(r, g) ? 'indeterminate_check_box' : 'check_box_outline_blank') }}</span>
                <span class="gt-count">{{ groupCount(r, g) }}/{{ g.perms.length }}</span>
              </button>
            </div>
            <span class="gbar"><i [style.width.%]="g.perms.length ? groupCount(r, g) / g.perms.length * 100 : 0"></i></span>
            <div class="perms">
              @for (p of g.perms; track p.code) {
                <label class="perm" [class.on]="r.perms.includes(p.code)" [class.dis]="r.system"
                       [class.d-add]="permDiff(r, p.code) === 'add'" [class.d-rem]="permDiff(r, p.code) === 'rem'">
                  <input type="checkbox" [checked]="r.perms.includes(p.code)" [disabled]="r.system" (change)="toggle(r, p.code)" />
                  <span class="pl">{{ p.label }}</span>
                  @if (isRequired(r, p.code)) { <span class="req" title="Required by another enabled permission">auto</span> }
                  @if (permDiff(r, p.code) === 'add') { <span class="dmark add" [title]="'Only in this role'">+</span> }
                  @else if (permDiff(r, p.code) === 'rem') { <span class="dmark rem" [title]="'Only in ' + compareRole()?.name">−</span> }
                  <button type="button" class="pinfo" (click)="openInfo(p, g); $event.preventDefault(); $event.stopPropagation()" title="What does this do?"><span class="material-icons">info</span></button>
                </label>
              }
            </div>
          </div>
        }
        </div>
        } @else { <div class="card sect cf-muted">No permissions match “{{ q() }}”.</div> }

        @if (!r.system) {
          <div class="save-bar">
            @if (isDirty()) { <span class="dirty-note"><span class="material-icons">history</span> You have unsaved changes</span> }
            @if (isDirty()) { <button class="cf-btn cf-btn-secondary" (click)="resetRole(r)"><span class="material-icons">undo</span> Reset</button> }
            <button class="cf-btn cf-btn-primary" [class.glow]="isDirty()" (click)="save()"
                    [appHasAction]="A.Role_Manage" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">save</span> Save changes</button>
          </div>
        }
      </div>
    }
  </div>

  @if (msg()) { <div class="toast">{{ msg() }}</div> }

  @if (infoOpen(); as info) {
    <div class="info-backdrop" (click)="closeInfo()">
      <div class="info-pop" (click)="$event.stopPropagation()" [style.--ga]="info.color">
        <button class="info-x" (click)="closeInfo()" title="Close"><span class="material-icons">close</span></button>
        <div class="info-head">
          <span class="gicon"><span class="material-icons">{{ info.icon }}</span></span>
          <div class="info-ht"><h4>{{ info.label }}</h4><span class="info-area">{{ info.area }}</span></div>
        </div>
        <p class="info-desc">{{ info.desc }}</p>
        @if (requiredLabels(info.code).length) {
          <div class="info-block">
            <span class="ib-label"><span class="material-icons">link</span> Turning this on also enables</span>
            <div class="ib-chips">@for (l of requiredLabels(info.code); track l) { <span class="ib-chip">{{ l }}</span> }</div>
          </div>
        }
        @if (enabledByLabels(info.code).length) {
          <div class="info-block">
            <span class="ib-label"><span class="material-icons">lock</span> Required by</span>
            <div class="ib-chips">@for (l of enabledByLabels(info.code); track l) { <span class="ib-chip">{{ l }}</span> }</div>
          </div>
        }
      </div>
    </div>
  }
  `,
  styles: [`
    :host{display:block}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
    .head h1{font-size:22px}
    .cf-btn .material-icons{font-size:18px}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:18px}
    .stat{display:flex;align-items:center;gap:12px;padding:13px 15px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-md);background:var(--cf-surface)}
    .stat>.material-icons{width:38px;height:38px;flex:none;display:grid;place-items:center;border-radius:10px;font-size:20px;background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .stat.sens-stat>.material-icons{background:#fef3c7;color:#d97706}
    .st-v{display:flex;flex-direction:column;line-height:1.1}
    .st-v b{font-size:20px;font-weight:800;color:var(--cf-ink-900)}
    .st-v small{font-size:11.5px;color:var(--cf-ink-500)}
    .dirty-pill{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#b45309;background:#fffbeb;border:1px solid #fde68a;padding:2px 9px;border-radius:999px}
    .dirty-pill .material-icons{font-size:13px}
    .dirty-note{display:inline-flex;align-items:center;gap:6px;margin-inline-end:auto;font-size:12.5px;font-weight:600;color:#b45309}
    .dirty-note .material-icons{font-size:16px}
    .cf-btn.glow{box-shadow:0 0 0 3px var(--cf-brand-100,var(--cf-brand-50))}
    .cols{display:grid;grid-template-columns:280px 1fr;gap:18px;align-items:start}
    .list{display:flex;flex-direction:column;gap:8px}
    .list-search{display:flex;align-items:center;gap:7px;height:36px;padding:0 10px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);background:var(--cf-surface-2);margin-bottom:2px}
    .list-search .material-icons{font-size:17px;color:var(--cf-ink-400)}
    .list-search input{flex:1;border:0;background:none;height:auto;padding:0;outline:none;box-shadow:none;font:inherit;font-size:13px}
    .sens{font-size:14px!important;color:#d97706}
    .sens-pill{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:#b45309;background:#fef3c7;padding:3px 9px;border-radius:999px}
    .sens-pill .material-icons{font-size:14px}
    .caps{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}
    .cap{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:var(--cf-ink-600);background:var(--cf-surface-2);border:1px solid var(--cf-line);padding:2px 8px;border-radius:999px}
    .cap .material-icons{font-size:13px;color:var(--cf-brand-600)}
    .presets{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .ps-label{font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-400)}
    .ps-row{display:flex;flex-wrap:wrap;gap:6px}
    .ps{padding:6px 12px;border:1px solid var(--cf-line);border-radius:999px;background:var(--cf-surface);color:var(--cf-ink-700);font:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:border-color .12s,color .12s,background .12s}
    .ps:hover{border-color:var(--cf-brand-500);color:var(--cf-brand-700);background:var(--cf-brand-50)}
    .role-item{display:flex;align-items:center;gap:11px;padding:11px;border:1px solid var(--cf-line);cursor:pointer;text-align:start;font:inherit;transition:border-color .12s,box-shadow .12s,transform .12s}
    .role-item:hover{transform:translateY(-1px)}
    .role-item.on{border-color:var(--cf-brand-500);box-shadow:0 0 0 2px var(--cf-brand-50)}
    .ravatar{width:34px;height:34px;flex:none;border-radius:10px;display:grid;place-items:center;color:#fff;font-weight:800;font-size:15px}
    .ravatar.lg{width:48px;height:48px;border-radius:13px;font-size:20px}
    .ri-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
    .ri-main strong{font-size:13.5px;color:var(--cf-ink-900);display:flex;align-items:center;gap:6px}
    .ri-main small{font-size:11px}
    .lock{font-size:14px!important;color:var(--cf-ink-400)}
    .ri-bar{height:4px;border-radius:999px;background:var(--cf-line);overflow:hidden;margin-top:2px}
    .ri-bar i{display:block;height:100%;border-radius:999px;transition:width .25s}
    .detail{display:flex;flex-direction:column;gap:14px}
    .sect{padding:16px 18px}
    .sect h3{font-size:13px}
    .rhead{display:flex;align-items:center;gap:14px}
    .rhead-meta{flex:1;min-width:0;display:flex;flex-direction:column;gap:7px}
    .rname{height:38px;font-size:16px;font-weight:700}
    .rdesc{height:34px;font-size:13px;color:var(--cf-ink-600)}
    input,select{border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);padding:0 10px;font:inherit;background:var(--cf-surface);color:var(--cf-ink-900);outline:none;height:36px}
    input:focus,select:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    input:disabled,select:disabled{background:var(--cf-surface-2);color:var(--cf-ink-500)}
    .rhead-side{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex:none}
    .lvl{font-size:11.5px;font-weight:700;padding:4px 11px;border-radius:999px}
    .xs{font-size:11px}
    .tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .search{flex:1;min-width:140px;display:flex;align-items:center;gap:7px;height:36px;padding:0 10px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);background:var(--cf-surface-2)}
    .search .material-icons{font-size:17px;color:var(--cf-ink-400)}
    .search input{flex:1;border:0;background:none;height:auto;padding:0;box-shadow:none}
    .copy{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--cf-ink-600)}
    .copy select{height:36px}
    .cf-btn.sm{padding:7px 11px;font-size:12.5px}
    .iconbtn{width:36px;height:36px;display:grid;place-items:center;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);background:var(--cf-surface);color:var(--cf-ink-600);cursor:pointer}
    .iconbtn.danger:hover{border-color:var(--cf-danger);color:var(--cf-danger);background:var(--cf-danger-soft)}
    .iconbtn .material-icons{font-size:18px}
    .banner{display:flex;align-items:center;gap:8px;padding:11px 14px;border:1px solid var(--cf-brand-200,var(--cf-line));background:var(--cf-brand-50);border-radius:var(--cf-radius-md);font-size:13px;color:var(--cf-brand-700)}
    .banner .material-icons{font-size:18px}
    .banner .link{border:0;background:none;color:var(--cf-brand-700);font:inherit;font-weight:700;text-decoration:underline;cursor:pointer;padding:0}
    .banner.warn{border-color:#fde68a;background:#fffbeb;color:#92400e}
    .cmp{display:flex;flex-direction:column;gap:11px}
    .ravatar.sm{width:26px;height:26px;border-radius:8px;font-size:12px}
    .cmp-head{display:flex;align-items:center;gap:12px}
    .cmp-role{flex:1;min-width:0;display:flex;align-items:center;gap:8px;font-size:14px}
    .cmp-role b{color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .cmp-role.rev{justify-content:flex-end}
    .cmp-swap{width:32px;height:32px;flex:none;display:grid;place-items:center;border:1px solid var(--cf-line);border-radius:50%;background:var(--cf-surface);color:var(--cf-ink-600);cursor:pointer}
    .cmp-swap:hover{border-color:var(--cf-brand-500);color:var(--cf-brand-600)}
    .cmp-swap .material-icons{font-size:18px}
    .cmp-top{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--cf-ink-500)}
    .cmp-top .material-icons{font-size:16px;color:var(--cf-brand-600)}
    .cmp-meta{display:flex;flex-direction:column;gap:3px;min-width:0}
    .cmp-meta.end{align-items:flex-end;text-align:right}
    .cmp-meta b{font-size:14px;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px}
    .lvl.xs2{font-size:9.5px;font-weight:700;padding:1px 7px;border-radius:999px;align-self:flex-start}
    .cmp-meta.end .lvl.xs2{align-self:flex-end}
    .cmp-bar{display:flex;height:14px;border-radius:999px;overflow:hidden;background:var(--cf-surface-2);gap:0}
    .cmp-bar .seg{display:block;transition:flex .25s}
    .cmp-bar .seg.a{background:#22c55e}
    .cmp-bar .seg.s{background:var(--cf-brand-500)}
    .cmp-bar .seg.b{background:#f59e0b}
    .cmp-legend{display:flex;flex-wrap:wrap;gap:14px;font-size:11.5px;color:var(--cf-ink-600)}
    .cmp-legend span{display:inline-flex;align-items:center;gap:6px}
    .cmp-legend b{color:var(--cf-ink-900)}
    .cmp-legend .d{width:10px;height:10px;border-radius:3px;flex:none}
    .cmp-legend .d.a{background:#22c55e}
    .cmp-legend .d.s{background:var(--cf-brand-500)}
    .cmp-legend .d.b{background:#f59e0b}
    .cmp-acts{display:flex;gap:8px;flex-wrap:wrap}
    .cmp-areas{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px}
    .cmp-area{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 9px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);font-size:12px;background:var(--cf-surface)}
    .cmp-area.diff{border-color:var(--cf-brand-500);background:var(--cf-brand-50)}
    .ca-name{display:inline-flex;align-items:center;gap:6px;color:var(--cf-ink-700);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .ca-name .material-icons{font-size:15px;color:var(--cf-ink-400)}
    .cmp-area.diff .ca-name{color:var(--cf-ink-900);font-weight:600}
    .cmp-area.diff .ca-name .material-icons{color:var(--cf-brand-600)}
    .ca-cnt{display:inline-flex;align-items:center;gap:5px;flex:none;font-variant-numeric:tabular-nums}
    .ca-cnt b{color:var(--cf-ink-900)}
    .ca-cnt i{font-style:normal;color:var(--cf-ink-400);font-size:10px}
    .cmp-eq{display:flex;align-items:center;gap:7px;font-size:12.5px;margin:0;color:var(--cf-ink-600)}
    .cmp-eq .material-icons{font-size:17px;color:#16a34a}
    .perm.d-add{border-color:#86efac;background:#f0fdf4}
    .perm.d-rem{border-color:#fcd34d;background:#fffbeb}
    .dmark{width:16px;height:16px;flex:none;display:grid;place-items:center;border-radius:50%;font-size:12px;font-weight:800;color:#fff}
    .dmark.add{background:#16a34a}
    .dmark.rem{background:#d97706}
    .ghead{display:flex;align-items:center;gap:10px;margin-bottom:9px}
    .gh-title{flex:1;min-width:0;font-size:12.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .gcount{font-size:11.5px;font-weight:700;color:var(--cf-ink-500);background:var(--cf-surface-2);padding:2px 8px;border-radius:999px}
    .gcount.full{color:var(--cf-brand-700);background:var(--cf-brand-50)}
    .gtoggle{flex:none;display:inline-flex;align-items:center;gap:5px;padding:3px 10px 3px 6px;border:1px solid var(--cf-line);border-radius:999px;background:var(--cf-surface);color:var(--cf-ink-500);font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;transition:border-color .12s,color .12s,background .12s}
    .gtoggle .material-icons{font-size:17px}
    .gtoggle .gt-count{font-variant-numeric:tabular-nums}
    .gtoggle:hover:not(:disabled){border-color:var(--ga);color:var(--ga)}
    .gtoggle.some{color:var(--ga);border-color:var(--ga)}
    .gtoggle.full{color:#fff;background:var(--ga);border-color:var(--ga)}
    .gtoggle:disabled{opacity:.55;cursor:default}
    .gbar{display:block;height:4px;border-radius:999px;background:var(--cf-line);overflow:hidden;margin-bottom:12px}
    .gbar i{display:block;height:100%;border-radius:999px;transition:width .25s;background:var(--ga)}
    .groups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}
    .gcard{display:flex;flex-direction:column;padding:14px 15px;border:1px solid var(--cf-line);border-top:3px solid var(--ga);border-radius:var(--cf-radius-md);background:var(--cf-surface);box-shadow:0 1px 2px rgba(16,24,40,.05);transition:box-shadow .15s,transform .15s}
    .gcard:hover{box-shadow:var(--cf-shadow-lg);transform:translateY(-2px)}
    .gicon{width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:9px;background:var(--ga)}
    .gicon .material-icons{font-size:17px;color:#fff}
    .perms{display:flex;flex-wrap:wrap;gap:8px}
    .perm{flex:1 1 150px;display:flex;align-items:center;gap:9px;padding:8px 11px;border:1px solid var(--cf-line);border-radius:var(--cf-radius-sm);font-size:12.5px;color:var(--cf-ink-700);cursor:pointer;transition:border-color .12s,background .12s}
    .perm.on{border-color:var(--cf-brand-500);background:var(--cf-brand-50)}
    .perm input{width:16px;height:16px;accent-color:var(--cf-brand-600);cursor:pointer}
    .perm .pl{flex:1}
    .perm.dis{opacity:.65;cursor:default}
    .pinfo{flex:none;width:22px;height:22px;display:grid;place-items:center;border:0;background:none;border-radius:6px;color:var(--cf-ink-400);cursor:pointer;opacity:.55;transition:opacity .12s,color .12s,background .12s}
    .pinfo:hover{opacity:1;color:var(--ga);background:var(--cf-surface-2)}
    .pinfo .material-icons{font-size:16px}
    .info-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.45);display:grid;place-items:center;z-index:90;padding:20px;animation:fade .12s ease}
    .info-pop{position:relative;width:min(420px,100%);background:var(--cf-surface);border:1px solid var(--cf-line);border-top:4px solid var(--ga);border-radius:var(--cf-radius-md);box-shadow:var(--cf-shadow-lg);padding:20px}
    .info-x{position:absolute;top:12px;inset-inline-end:12px;width:30px;height:30px;display:grid;place-items:center;border:0;background:none;border-radius:8px;color:var(--cf-ink-500);cursor:pointer}
    .info-x:hover{background:var(--cf-surface-2);color:var(--cf-ink-800)}
    .info-x .material-icons{font-size:19px}
    .info-head{display:flex;align-items:center;gap:12px;margin-bottom:14px;padding-inline-end:30px}
    .info-ht h4{margin:0;font-size:16px;color:var(--cf-ink-900)}
    .info-area{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--ga)}
    .info-desc{margin:0 0 16px;font-size:13.5px;line-height:1.55;color:var(--cf-ink-700)}
    .info-block{padding-top:12px;border-top:1px solid var(--cf-line)}
    .info-block + .info-block{margin-top:10px}
    .ib-label{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:var(--cf-ink-500);margin-bottom:7px}
    .ib-label .material-icons{font-size:15px}
    .ib-chips{display:flex;flex-wrap:wrap;gap:6px}
    .ib-chip{font-size:12px;font-weight:600;color:var(--cf-ink-700);background:var(--cf-surface-2);border:1px solid var(--cf-line);padding:3px 9px;border-radius:999px}
    @keyframes fade{from{opacity:0}to{opacity:1}}
    .req{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-brand-700);background:var(--cf-brand-100,var(--cf-brand-50));padding:1px 6px;border-radius:999px}
    .save-bar{display:flex;align-items:center;justify-content:flex-end;gap:10px}
    .toast{position:fixed;bottom:22px;inset-inline-end:22px;background:var(--cf-ink-900);color:#fff;padding:11px 16px;border-radius:var(--cf-radius-md);box-shadow:var(--cf-shadow-lg);font-size:13.5px;z-index:80}
    @media(min-width:1500px){.groups{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:880px){.cols{grid-template-columns:1fr}}
    @media(max-width:760px){.groups{grid-template-columns:1fr}}
  `],
})
export class RolesPage {
  readonly A = Actions;
  private alerts = inject(AlertService);
  msg = signal('');
  q = signal('');

  groups: PermGroup[] = [
    { area: 'Templates', icon: 'grid_view', color: '#6366f1', perms: [
      { code: Actions.Template_View, label: 'View templates', desc: 'See every certificate template in the workspace and open it for preview. This is the baseline access most other template actions build on.' },
      { code: Actions.Template_Create, label: 'Create templates', desc: 'Start brand-new templates from scratch or from a preset, and save them to the workspace library.' },
      { code: Actions.Template_Edit, label: 'Edit in designer', desc: 'Open a template in the design studio and change its layout, text, images, colours and variables.' },
      { code: Actions.Template_Delete, label: 'Delete templates', desc: 'Permanently remove templates from the workspace. Deleted templates cannot be recovered.' },
      { code: Actions.Template_Export, label: 'Export templates', desc: 'Download templates as PDF, PNG or JSON, or share them outside Certifada.' },
    ] },
    { area: 'Credentials', icon: 'workspace_premium', color: '#0ea5e9', perms: [
      { code: Actions.Credential_View, label: 'View credentials', desc: 'Browse issued certificates and view each recipient’s details and status.' },
      { code: Actions.Credential_Generate, label: 'Generate single', desc: 'Issue one certificate at a time from a chosen template and recipient.' },
      { code: Actions.Credential_Bulk, label: 'Bulk generate', desc: 'Generate many certificates in one run from a data file such as CSV or Excel.' },
      { code: Actions.Credential_Approve, label: 'Approve / revoke', desc: 'Approve certificates before they are issued, or revoke ones that were already issued. A sensitive action.' },
    ] },
    { area: 'Branding', icon: 'palette', color: '#ec4899', perms: [{ code: Actions.Branding_Manage, label: 'Manage brand kit', desc: 'Set the organisation’s logo, colours, fonts and default signature used across all templates.' }] },
    { area: 'People', icon: 'group', color: '#10b981', perms: [
      { code: Actions.User_View, label: 'View users', desc: 'See the list of people in the workspace along with the role assigned to each.' },
      { code: Actions.User_Manage, label: 'Invite & manage users', desc: 'Invite new users, deactivate accounts and assign roles to people. A sensitive action.' },
      { code: Actions.Role_View, label: 'View roles', desc: 'See all roles and the permissions granted to each of them.' },
      { code: Actions.Role_Manage, label: 'Manage roles', desc: 'Create, edit and delete roles and change which permissions they grant. A sensitive action.' },
    ] },
    { area: 'Automation', icon: 'bolt', color: '#f59e0b', perms: [
      { code: Actions.Automation_View, label: 'View automations', desc: 'See automated workflows and their recent run history.' },
      { code: Actions.Automation_Manage, label: 'Manage automations', desc: 'Create, edit, enable or disable automated workflows that issue or route credentials.' },
    ] },
    { area: 'Settings', icon: 'settings', color: '#64748b', perms: [{ code: Actions.Settings_Manage, label: 'Manage settings', desc: 'Change workspace-wide settings, integrations and security options. A sensitive action.' }] },
  ];

  private allCodes = this.groups.flatMap((g) => g.perms.map((p) => p.code));
  readonly total = this.allCodes.length;

  /** Each permission's prerequisites (enabling it auto-enables these). */
  private implies: Record<string, string[]> = {
    [Actions.Template_Create]: [Actions.Template_View],
    [Actions.Template_Edit]: [Actions.Template_View],
    [Actions.Template_Delete]: [Actions.Template_View],
    [Actions.Template_Export]: [Actions.Template_View],
    [Actions.Credential_Generate]: [Actions.Credential_View],
    [Actions.Credential_Bulk]: [Actions.Credential_View, Actions.Credential_Generate],
    [Actions.Credential_Approve]: [Actions.Credential_View],
    [Actions.User_Manage]: [Actions.User_View],
    [Actions.Role_Manage]: [Actions.Role_View],
    [Actions.Automation_Manage]: [Actions.Automation_View],
  };

  private palette = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];
  private seq = 10;
  roles = signal<Role[]>([
    { id: 1, name: 'Administrator', desc: 'Full access to everything.', system: true, color: '#4f46e5', members: 2, perms: [...this.allCodes] },
    { id: 2, name: 'Editor', desc: 'Designs templates and issues credentials.', system: false, color: '#0ea5e9', members: 5, perms: [
      Actions.Template_View, Actions.Template_Create, Actions.Template_Edit, Actions.Template_Export,
      Actions.Credential_View, Actions.Credential_Generate, Actions.Credential_Bulk,
      Actions.Branding_Manage, Actions.Automation_View,
    ] },
    { id: 3, name: 'Viewer', desc: 'Read-only access.', system: true, color: '#10b981', members: 12, perms: [
      Actions.Template_View, Actions.Credential_View, Actions.User_View, Actions.Role_View, Actions.Automation_View,
    ] },
  ]);
  selectedId = signal(2);
  selected = computed(() => this.roles().find((r) => r.id === this.selectedId()));

  rq = signal('');
  readonly filteredRoles = computed(() => {
    const s = this.rq().trim().toLowerCase();
    const l = this.roles();
    return s ? l.filter((r) => r.name.toLowerCase().includes(s)) : l;
  });

  private elevated = [Actions.Template_Delete, Actions.Credential_Approve, Actions.User_Manage, Actions.Role_Manage, Actions.Settings_Manage];
  isSensitive(r: Role): boolean { return this.elevated.some((c) => r.perms.includes(c)); }

  // ---- org summary ----
  totalMembers = computed(() => this.roles().reduce((s, r) => s + r.members, 0));
  sensitiveCount = computed(() => this.roles().filter((r) => this.isSensitive(r)).length);
  avgAccess = computed(() => { const l = this.roles(); return l.length ? Math.round(l.reduce((s, r) => s + this.accessPct(r), 0) / l.length * 100) : 0; });

  // ---- unsaved-change tracking ----
  private snap = new Map<number, string>();
  private snapKey(r: Role): string { return JSON.stringify({ n: r.name, d: r.desc, p: [...r.perms].sort() }); }
  private _snapFx = effect(() => { const r = this.selected(); if (r && !this.snap.has(r.id)) this.snap.set(r.id, this.snapKey(r)); });
  isDirty(): boolean { const r = this.selected(); return !!r && !r.system && this.snap.has(r.id) && this.snap.get(r.id) !== this.snapKey(r); }
  resetRole(r: Role): void {
    const b = this.snap.get(r.id); if (!b) return;
    const o = JSON.parse(b) as { n: string; d: string; p: string[] };
    r.name = o.n; r.desc = o.d; r.perms = [...o.p];
    this.alerts.success('Changes reverted.');
  }

  presets: { key: string; label: string; codes: string[] }[] = [
    { key: 'full', label: 'Full access', codes: [...this.allCodes] },
    { key: 'editor', label: 'Editor', codes: [Actions.Template_View, Actions.Template_Create, Actions.Template_Edit, Actions.Template_Export, Actions.Credential_View, Actions.Credential_Generate, Actions.Credential_Bulk, Actions.Branding_Manage, Actions.Automation_View] },
    { key: 'issuer', label: 'Issuer', codes: [Actions.Template_View, Actions.Credential_View, Actions.Credential_Generate, Actions.Credential_Bulk] },
    { key: 'approver', label: 'Approver', codes: [Actions.Credential_View, Actions.Credential_Approve] },
    { key: 'readonly', label: 'Read-only', codes: [Actions.Template_View, Actions.Credential_View, Actions.User_View, Actions.Role_View, Actions.Automation_View] },
    { key: 'none', label: 'No access', codes: [] },
  ];
  applyPreset(r: Role, codes: string[]): void {
    if (r.system) return;
    r.perms = [...new Set(codes.flatMap((c) => [c, ...this.requiredBy(c)]))];
    this.alerts.success('Preset applied.');
  }

  /** High-level capabilities derived from the role's permissions. */
  caps(r: Role): { icon: string; label: string }[] {
    const h = (c: string) => r.perms.includes(c);
    const out: { icon: string; label: string }[] = [];
    if (h(Actions.Template_Create) || h(Actions.Template_Edit)) out.push({ icon: 'design_services', label: 'Design' });
    if (h(Actions.Credential_Generate) || h(Actions.Credential_Bulk)) out.push({ icon: 'workspace_premium', label: 'Issue' });
    if (h(Actions.Credential_Bulk)) out.push({ icon: 'dynamic_feed', label: 'Bulk' });
    if (h(Actions.Credential_Approve)) out.push({ icon: 'verified', label: 'Approve' });
    if (h(Actions.Branding_Manage)) out.push({ icon: 'palette', label: 'Brand' });
    if (h(Actions.User_Manage) || h(Actions.Role_Manage)) out.push({ icon: 'group', label: 'People' });
    if (h(Actions.Automation_Manage)) out.push({ icon: 'bolt', label: 'Automate' });
    if (h(Actions.Settings_Manage)) out.push({ icon: 'settings', label: 'Settings' });
    if (!out.length) out.push({ icon: 'visibility', label: 'View only' });
    return out;
  }

  // ---- compare & insights ----
  compareId = signal<number | null>(null);
  compareRole = computed(() => { const id = this.compareId(); return id ? (this.roles().find((r) => r.id === id) ?? null) : null; });
  diffMore(r: Role): number { const c = this.compareRole(); return c ? r.perms.filter((p) => !c.perms.includes(p)).length : 0; }
  diffFewer(r: Role): number { const c = this.compareRole(); return c ? c.perms.filter((p) => !r.perms.includes(p)).length : 0; }
  permDiff(r: Role, code: string): '' | 'add' | 'rem' {
    const c = this.compareRole();
    if (!c) return '';
    const a = r.perms.includes(code), b = c.perms.includes(code);
    return a && !b ? 'add' : !a && b ? 'rem' : '';
  }
  twinName(r: Role): string | null {
    const key = (x: Role) => [...x.perms].sort().join('|');
    const k = key(r);
    return this.roles().find((x) => x.id !== r.id && key(x) === k)?.name ?? null;
  }
  diffShared(r: Role): number { const c = this.compareRole(); return c ? r.perms.filter((p) => c.perms.includes(p)).length : 0; }
  swapCompare(r: Role): void { const cmp = this.compareId(); if (!cmp) return; this.compareId.set(r.id); this.selectedId.set(cmp); }
  addMissing(r: Role): void {
    const c = this.compareRole();
    if (!c || r.system) return;
    const missing = c.perms.filter((p) => !r.perms.includes(p));
    r.perms = [...new Set([...r.perms, ...missing, ...missing.flatMap((m) => this.requiredBy(m))])];
    this.alerts.success('Added ' + missing.length + ' permission' + (missing.length === 1 ? '' : 's') + '.');
  }

  readonly filteredGroups = computed<PermGroup[]>(() => {
    const s = this.q().trim().toLowerCase();
    if (!s) return this.groups;
    return this.groups
      .map((g) => ({ ...g, perms: g.perms.filter((p) => p.label.toLowerCase().includes(s)) }))
      .filter((g) => g.perms.length);
  });

  // ---- smart helpers ----
  private requiredBy(code: string): string[] {
    const out = new Set<string>();
    const walk = (c: string) => (this.implies[c] ?? []).forEach((d) => { if (!out.has(d)) { out.add(d); walk(d); } });
    walk(code);
    return [...out];
  }
  private dependentsOf(code: string): string[] {
    return this.allCodes.filter((x) => this.requiredBy(x).includes(code));
  }
  isRequired(r: Role, code: string): boolean {
    return r.perms.includes(code) && this.dependentsOf(code).some((d) => r.perms.includes(d));
  }

  accessPct(r: Role): number { return this.total ? r.perms.length / this.total : 0; }
  lvl(r: Role): Level {
    const p = this.accessPct(r);
    if (p >= 0.999) return { label: 'Full access', color: '#4f46e5', bg: '#eef2ff' };
    if (p >= 0.6) return { label: 'Standard', color: '#0369a1', bg: '#e0f2fe' };
    if (p >= 0.25) return { label: 'Limited', color: '#b45309', bg: '#fef3c7' };
    return { label: 'Read-only', color: '#475569', bg: '#f1f5f9' };
  }
  initial(r: Role): string { return (r.name || '?').trim().charAt(0).toUpperCase() || '?'; }
  groupCount(r: Role, g: PermGroup): number { return g.perms.filter((p) => r.perms.includes(p.code)).length; }

  toggle(r: Role, code: string): void {
    if (r.system) return;
    if (r.perms.includes(code)) {
      const drop = new Set([code, ...this.dependentsOf(code)]);
      r.perms = r.perms.filter((c) => !drop.has(c));
    } else {
      r.perms = [...new Set([...r.perms, code, ...this.requiredBy(code)])];
    }
  }
  areaAll(r: Role, g: PermGroup): boolean { return g.perms.every((p) => r.perms.includes(p.code)); }
  areaSome(r: Role, g: PermGroup): boolean { const n = this.groupCount(r, g); return n > 0 && n < g.perms.length; }

  // ---- permission info popup ----
  infoOpen = signal<{ label: string; desc: string; area: string; icon: string; color: string; code: string } | null>(null);
  openInfo(p: { code: string; label: string; desc: string }, g: PermGroup): void {
    this.infoOpen.set({ label: p.label, desc: p.desc, area: g.area, icon: g.icon, color: g.color, code: p.code });
  }
  closeInfo(): void { this.infoOpen.set(null); }
  @HostListener('document:keydown.escape') onEsc(): void { if (this.infoOpen()) this.closeInfo(); }
  private labelOf(code: string): string {
    for (const g of this.groups) { const p = g.perms.find((x) => x.code === code); if (p) return p.label; }
    return code;
  }
  requiredLabels(code: string): string[] { return this.requiredBy(code).map((c) => this.labelOf(c)); }
  enabledByLabels(code: string): string[] { return this.dependentsOf(code).map((c) => this.labelOf(c)); }
  toggleArea(r: Role, g: PermGroup): void {
    if (r.system) return;
    const codes = g.perms.map((p) => p.code);
    if (this.areaAll(r, g)) {
      const drop = new Set([...codes, ...codes.flatMap((c) => this.dependentsOf(c))]);
      r.perms = r.perms.filter((c) => !drop.has(c));
    } else {
      r.perms = [...new Set([...r.perms, ...codes, ...codes.flatMap((c) => this.requiredBy(c))])];
    }
  }

  copyFrom(r: Role, sourceId: string): void {
    if (r.system || !sourceId) return;
    const src = this.roles().find((x) => x.id === +sourceId);
    if (!src) return;
    r.perms = [...src.perms];
    this.alerts.success('Copied permissions from “' + src.name + '”.');
  }
  cloneRole(r: Role): void {
    const id = ++this.seq;
    this.roles.update((l) => [...l, { id, name: r.name + ' (copy)', desc: r.desc, system: false, color: this.palette[id % this.palette.length], members: 0, perms: [...r.perms] }]);
    this.selectedId.set(id);
    this.alerts.success('Role cloned — now fully editable.');
  }
  addRole(): void {
    const id = ++this.seq;
    this.roles.update((l) => [...l, { id, name: 'New role', desc: '', system: false, color: this.palette[id % this.palette.length], members: 0, perms: [Actions.Template_View, Actions.Credential_View] }]);
    this.selectedId.set(id);
  }
  async deleteRole(r: Role): Promise<void> {
    if (r.system) return;
    const ok = await this.alerts.confirm({ title: 'Delete role', message: 'Delete the “' + r.name + '” role?', danger: true, confirmText: 'Delete' });
    if (!ok) return;
    this.roles.update((l) => l.filter((x) => x.id !== r.id));
    const first = this.roles()[0];
    if (first) this.selectedId.set(first.id);
    this.alerts.success('Role deleted.');
  }
  save(): void { const r = this.selected(); if (r) this.snap.set(r.id, this.snapKey(r)); this.alerts.success('Role saved.'); }
}

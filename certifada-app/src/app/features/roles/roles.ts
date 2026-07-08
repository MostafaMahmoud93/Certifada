import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from '../../core/services/alert.service';
import { RbacService, RbacRole } from '../../core/services/rbac.service';
import { RbacScreen, RbacPermission } from '../../core/rbac/permission-catalog';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [FormsModule, HasActionDirective],
  template: `
  <header class="rp-top">
    <div class="rp-title">
      <span class="rp-ic"><span class="material-icons">admin_panel_settings</span></span>
      <div>
        <h1>Roles &amp; permissions</h1>
        <p class="cf-muted">Define what each role can do — dependencies are handled for you.</p>
      </div>
    </div>
    <button class="cf-btn cf-btn-primary" (click)="addRole()" [appHasAction]="A.Role_Manage" [tooltipMessage]="'🔒 Managing roles is not in your plan.'">
      <span class="material-icons">add</span> New role
    </button>
  </header>

  <div class="stats">
    <div class="stat"><span class="s-ic i1"><span class="material-icons">badge</span></span><div><b>{{ roles().length }}</b><small>Roles</small></div></div>
    <div class="stat"><span class="s-ic i2"><span class="material-icons">shield</span></span><div><b>{{ sensitiveCount() }}</b><small>Sensitive</small></div></div>
    <div class="stat"><span class="s-ic i3"><span class="material-icons">group</span></span><div><b>{{ totalMembers() }}</b><small>Members</small></div></div>
    <div class="stat"><span class="s-ic i4"><span class="material-icons">tune</span></span><div><b>{{ avgAccess() }}%</b><small>Avg access</small></div></div>
  </div>

  <div class="rp-grid">
    <aside class="rail">
      <div class="rail-search"><span class="material-icons">search</span><input [ngModel]="rq()" (ngModelChange)="rq.set($event)" placeholder="Find a role…" /></div>
      <div class="rail-list">
        @for (r of filteredRoles(); track r.id) {
          <button class="role" [class.on]="selectedId() === r.id" (click)="select(r.id)">
            <span class="role-ava" [style.background]="r.color">{{ (r.name[0] || '?').toUpperCase() }}</span>
            <span class="role-tx">
              <span class="role-name">{{ r.name }} @if (r.isSystem) { <span class="material-icons rl">lock</span> } @if (rbac.isSensitiveCodes(r.permissions)) { <span class="material-icons rs">shield</span> }</span>
              <span class="role-sub">{{ rbac.membersOf(r.id) }} member{{ rbac.membersOf(r.id) === 1 ? '' : 's' }} · {{ r.permissions.length }} perms</span>
              <span class="role-bar"><i [style.width.%]="pct(r.permissions) * 100" [style.background]="r.color"></i></span>
            </span>
          </button>
        }
        @if (!filteredRoles().length) { <p class="rail-empty cf-muted">No roles match “{{ rq() }}”.</p> }
      </div>
    </aside>

    <section class="pane">
      @if (selected(); as r) {
        <div class="hero">
          <span class="hero-ava" [style.background]="r.color">{{ (r.name[0] || '?').toUpperCase() }}</span>
          <div class="hero-meta">
            @if (r.isSystem) {
              <div class="hero-name">{{ r.name }} <span class="pilllock"><span class="material-icons">lock</span> Built-in</span></div>
              <p class="hero-desc cf-muted">{{ r.desc }}</p>
            } @else {
              <input class="hero-name-in" [ngModel]="draftName()" (ngModelChange)="draftName.set($event)" placeholder="Role name" [appHasAction]="A.Role_Manage" [tooltipMessage]="'🔒 Not in your plan.'" />
              <input class="hero-desc-in" [ngModel]="draftDesc()" (ngModelChange)="draftDesc.set($event)" placeholder="Describe this role…" />
            }
            <div class="hero-facts">
              <span class="hf"><span class="material-icons">group</span>{{ rbac.membersOf(r.id) }} member{{ rbac.membersOf(r.id) === 1 ? '' : 's' }}</span>
              <span class="hf"><span class="material-icons">vpn_key</span>{{ draftPerms().size }} / {{ rbac.total }} permissions</span>
              @if (rbac.isSensitiveCodes(draftCodes())) { <span class="hf sens"><span class="material-icons">shield</span> Sensitive</span> }
              <span class="hf">{{ r.isSystem ? 'Built-in role' : 'Custom role' }}</span>
            </div>
            <div class="caps">@for (c of caps(draftCodes()); track c.label) { <span class="cap"><span class="material-icons">{{ c.icon }}</span>{{ c.label }}</span> }</div>
          </div>
          <div class="hero-meter">
            <div class="ring" [style.--p]="pct(draftCodes()) * 100" [style.--c]="r.color"><b>{{ draftPerms().size }}</b><small>of {{ rbac.total }}</small></div>
            <span class="lvl" [style.background]="lvl(draftCodes()).bg" [style.color]="lvl(draftCodes()).color">{{ lvl(draftCodes()).label }}</span>
          </div>
        </div>

        <div class="tools">
          <div class="psearch"><span class="material-icons">search</span><input [ngModel]="q()" (ngModelChange)="q.set($event)" placeholder="Search permissions…" />@if (q()) { <button class="clr" (click)="q.set('')"><span class="material-icons">close</span></button> }</div>
          @if (!r.isSystem) { <button class="ico st" [class.act]="startOpen()" (click)="toggleStartBar()" title="Copy another role's permissions as a starting point"><span class="material-icons">content_copy</span> Start from</button> }
          <button class="ico" [class.act]="comparing()" (click)="toggleCompareBar()" title="Compare with another role"><span class="material-icons">compare_arrows</span> Compare</button>
          <button class="ico" (click)="preview(r)" title="Preview as this role"><span class="material-icons">visibility</span></button>
          <button class="ico wide" (click)="clone(r)" [appHasAction]="A.Role_Manage" [tooltipMessage]="'🔒 Not in your plan.'" title="Clone"><span class="material-icons">content_copy</span> Clone</button>
          @if (!r.isSystem) { <button class="ico danger" (click)="del(r)" [appHasAction]="A.Role_Manage" [tooltipMessage]="'🔒 Not in your plan.'" title="Delete role"><span class="material-icons">delete</span></button> }
        </div>

        @if (r.isSystem) {
          <div class="note"><span class="material-icons">lock</span> This is a built-in role and can't be edited. <button class="lk" (click)="clone(r)">Clone it</button> to customise.</div>
        } @else {
          <div class="presets"><span class="presets-l"><span class="material-icons">auto_awesome</span> Quick presets</span>@for (p of presets; track p.key) { <button class="preset" [class.on]="activePreset() === p.key" (click)="applyPreset(p.codes)"><span class="material-icons">{{ p.icon }}</span>{{ p.label }}@if (activePreset() === p.key) { <span class="material-icons pchk">check</span> }</button> }</div>
        }

        @if (startOpen() && !r.isSystem) {
          <div class="cbar sbar">
            <span class="cbar-l"><span class="material-icons">content_copy</span> Start from</span>
            <div class="cbar-chips">
              @for (o of roles(); track o.id) { @if (o.id !== r.id) {
                <button type="button" class="cchip" (click)="pickStart(o.id)"><i class="cc-dot" [style.background]="o.color"></i>{{ o.name }}<span class="cc-n">{{ o.permissions.length }}</span></button>
              } }
            </div>
            <button class="cbar-x" (click)="startOpen.set(false)" title="Close"><span class="material-icons">close</span></button>
          </div>
        }

        @if (comparing()) {
          <div class="cbar">
            <span class="cbar-l"><span class="material-icons">compare_arrows</span> Compare with</span>
            <div class="cbar-chips">
              @for (o of roles(); track o.id) { @if (o.id !== r.id) {
                <button type="button" class="cchip" [class.on]="compareId() === o.id" (click)="pickCompare(o.id)">
                  <i class="cc-dot" [style.background]="o.color"></i>{{ o.name }}
                  @if (compareId() === o.id) { <span class="material-icons cc-ck">check</span> }
                </button>
              } }
            </div>
            <button class="cbar-x" (click)="closeCompare()" title="Close compare"><span class="material-icons">close</span></button>
          </div>
        }

        @if (compareRole(); as cmp) {
          <div class="cmp">
            <div class="cmp-top">
              <span class="cmp-pair">
                <span class="cmp-role"><i class="cd" [style.background]="r.color"></i>{{ r.name }}</span>
                <span class="material-icons cmp-vs">sync_alt</span>
                <span class="cmp-role"><i class="cd" [style.background]="cmp.color"></i>{{ cmp.name }}</span>
              </span>
              <div class="cmp-views" role="tablist">
                <button [class.on]="compareView() === 'overlay'" (click)="compareView.set('overlay')" title="Overlay diff on the cards"><span class="material-icons">layers</span>Overlay</button>
                <button [class.on]="compareView() === 'split'" (click)="compareView.set('split')" title="Side-by-side columns"><span class="material-icons">vertical_split</span>Split</button>
                <button [class.on]="compareView() === 'matrix'" (click)="compareView.set('matrix')" title="Full comparison table"><span class="material-icons">grid_on</span>Matrix</button>
              </div>
              <button class="cmp-x" (click)="compareId.set(null)" title="Stop comparing"><span class="material-icons">close</span></button>
            </div>
            <div class="cmp-legend">
              <span class="lg add"><span class="dot"></span><b>{{ diffMore() }}</b> only in {{ r.name }}</span>
              <span class="lg rem"><span class="dot"></span><b>{{ diffFewer() }}</b> only in {{ cmp.name }}</span>
              <span class="lg same"><span class="dot"></span><b>{{ diffSame() }}</b> shared</span>
              @if (compareView() !== 'overlay') { <label class="cmp-diffonly"><input type="checkbox" [checked]="diffOnly()" (change)="diffOnly.set(!diffOnly())" /><span class="cdo-box"></span> Differences only</label> }
            </div>
          </div>
        }

        @if (compareRole() && compareView() === 'matrix') {
          <div class="mtx">
            <div class="mtx-head">
              <span class="mtx-c0">Permission</span>
              <span class="mtx-c"><i class="cd" [style.background]="r.color"></i>{{ selected()?.name }}</span>
              <span class="mtx-c"><i class="cd" [style.background]="compareRole()?.color"></i>{{ compareRole()?.name }}</span>
            </div>
            @for (s of searchedScreens(); track s.key) {
              @if (matrixRows(s).length) {
                <div class="mtx-scr"><span class="material-icons" [style.color]="s.color">{{ s.icon }}</span>{{ s.label }}</div>
                @for (p of matrixRows(s); track p.code) {
                  <div class="mtx-row" [class.d]="has(p.code) !== cmpHas(p.code)">
                    <span class="mtx-c0"><span class="mtx-tt">{{ p.label }}</span><span class="mtx-hint">{{ p.hint }}</span></span>
                    <span class="mtx-c"><span class="mk" [class.yes]="has(p.code)"><span class="material-icons">{{ has(p.code) ? 'check' : 'remove' }}</span></span></span>
                    <span class="mtx-c"><span class="mk" [class.yes]="cmpHas(p.code)"><span class="material-icons">{{ cmpHas(p.code) ? 'check' : 'remove' }}</span></span></span>
                  </div>
                }
              }
            }
            @if (!matrixTotal()) { <p class="cf-muted" style="padding:22px;text-align:center">No permissions to show.</p> }
          </div>
        } @else if (compareRole() && compareView() === 'split') {
          <div class="split">
            @for (col of [selected(), compareRole()]; track $index) {
              <div class="split-col">
                <div class="split-head"><span class="hero-ava sm" [style.background]="col?.color">{{ (col?.name?.[0] || '?').toUpperCase() }}</span><b>{{ col?.name }}</b><span class="split-n">{{ col?.permissions?.length }}</span></div>
                @for (s of searchedScreens(); track s.key) {
                  @if (splitRows(s, col).length) {
                    <div class="split-scr"><span class="material-icons" [style.color]="s.color">{{ s.icon }}</span>{{ s.label }}</div>
                    @for (p of splitRows(s, col); track p.code) {
                      <div class="split-row" [class.uniq]="isUnique(p.code, col)"><span class="material-icons">check</span>{{ p.label }}</div>
                    }
                  }
                }
              </div>
            }
          </div>
        } @else {
        <div class="cards-top">
          <span class="ct-sum"><b>{{ draftPerms().size }}</b> of {{ rbac.total }} granted · {{ filteredScreens().length }} screens</span>
          <div class="ct-filters">
            @for (fo of filterOptions; track fo.key) { <button class="ct-f" [class.on]="permFilter() === fo.key" (click)="permFilter.set(fo.key)"><span class="material-icons">{{ fo.icon }}</span>{{ fo.label }}</button> }
          </div>
          <button class="ct-toggle" (click)="toggleAllCards()"><span class="material-icons">{{ allOpen() ? 'unfold_less' : 'unfold_more' }}</span>{{ allOpen() ? 'Collapse all' : 'Expand all' }}</button>
        </div>
        <div class="cards">
          @for (s of filteredScreens(); track s.key) {
            <div class="card" [style.--sc]="s.color">
              <div class="card-h" (click)="toggleCard(s.key)">
                <span class="card-ic" [style.color]="s.color" [style.background]="tint(s.color)"><span class="material-icons">{{ s.icon }}</span></span>
                <span class="card-tt">{{ s.label }} <em>{{ s.desc }}</em></span>
                <button type="button" class="card-all" [class.full]="allOn(s)" [class.some]="screenState(s) === 'indeterminate_check_box'" [disabled]="r.isSystem" (click)="$event.stopPropagation(); toggleScreenAll(s)" [title]="allOn(s) ? 'Clear all in this screen' : 'Select all in this screen'">
                  <span class="material-icons">{{ screenState(s) }}</span>
                  <span class="ca-tx">{{ allOn(s) ? 'All selected' : 'Select all' }}</span>
                  <span class="ca-n">{{ granted(s) }}/{{ s.perms.length }}</span>
                </button>
                <span class="material-icons card-chev" [class.open]="isOpen(s.key)">expand_more</span>
              </div>
              <div class="card-bar"><i [style.width.%]="ratio(s) * 100" [style.background]="s.color"></i></div>
              @if (isOpen(s.key)) {
              <div class="card-perms">
                @for (p of s.perms; track p.code) {
                  <label class="pk" [class.on]="has(p.code)" [class.dis]="r.isSystem" [class.d-add]="diff(p.code) === 'add'" [class.d-rem]="diff(p.code) === 'rem'">
                    <input type="checkbox" [checked]="has(p.code)" [disabled]="r.isSystem" (change)="toggle(p.code)" /><span class="pk-box"></span>
                    <span class="pk-main">
                      <span class="pk-top">
                        <span class="pk-tt">{{ p.label }}</span>
                        @if (isRequired(p.code)) { <span class="pk-auto" title="Auto-enabled — required by another permission">AUTO</span> }
                        @if (sensitive(p.code)) { <span class="material-icons pk-sens" title="Sensitive">shield</span> }
                      </span>
                      <span class="pk-hint">{{ p.hint }}</span>
                    </span>
                    <button type="button" class="pk-i" (click)="openInfo(p, s, $event)" title="What does this do?"><span class="material-icons">info</span></button>
                  </label>
                }
              </div>
              }
            </div>
          }
          @if (!filteredScreens().length) { <p class="cf-muted" style="grid-column:1/-1;padding:22px;text-align:center">No permissions match your search or filter.</p> }
        </div>
        }
      } @else {
        <div class="empty"><span class="material-icons">admin_panel_settings</span><p>{{ rbac.loading() ? 'Loading roles…' : 'Select a role to view and edit its permissions.' }}</p></div>
      }
    </section>
  </div>

  @if (dirty()) {
    <div class="savebar">
      <span class="sb-l"><span class="material-icons">edit</span> You have unsaved changes</span>
      <div class="sb-r">
        <button class="sb-discard" (click)="discard()">Discard</button>
        <button class="sb-save" (click)="save()"><span class="material-icons">save</span> Save changes</button>
      </div>
    </div>
  }

  @if (info(); as i) {
    <div class="iover" (click)="closeInfo()">
      <div class="imodal" (click)="$event.stopPropagation()">
        <button class="iclose" (click)="closeInfo()"><span class="material-icons">close</span></button>
        <div class="ihead" [style.background]="tint(i.color)">
          <span class="ii" [style.background]="i.color"><span class="material-icons">{{ i.icon }}</span></span>
          <div class="ihx">
            <small>{{ i.screen }}</small>
            <h4>{{ i.label }}</h4>
            @if (i.sensitive) { <span class="ibadge"><span class="material-icons">shield</span> Sensitive action</span> }
          </div>
        </div>
        <div class="ibody">
          <div class="ilbl">What it does</div>
          <p class="idesc">{{ i.desc }}</p>
          @if (i.requires.length) { <div class="isec"><span class="isec-l"><span class="material-icons">link</span> Turning this on also enables</span><div class="ichips">@for (x of i.requires; track x) { <span class="ichip on">{{ x }}</span> }</div></div> }
          @if (i.enables.length) { <div class="isec"><span class="isec-l"><span class="material-icons">account_tree</span> Required by these permissions</span><div class="ichips">@for (x of i.enables; track x) { <span class="ichip">{{ x }}</span> }</div></div> }
          <div class="icode"><span class="material-icons">tag</span> Permission code <code>{{ i.code }}</code></div>
        </div>
      </div>
    </div>
  }
  `,
  styles: [`
    :host{display:block;padding-bottom:70px}
    .cf-btn .material-icons{font-size:18px}
    .rp-top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px}
    .rp-title{display:flex;align-items:center;gap:13px;min-width:0}
    .rp-ic{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;flex:none;background:var(--cf-brand-50);color:var(--cf-brand-600);border:1px solid var(--cf-brand-100)}
    .rp-ic .material-icons{font-size:24px}
    .rp-top h1{font-size:22px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900)}
    .rp-top p{font-size:13.5px;margin-top:2px}

    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
    @media(max-width:820px){.stats{grid-template-columns:1fr 1fr}}
    .stat{display:flex;align-items:center;gap:11px;padding:13px 15px;border:1px solid var(--cf-line);border-radius:14px;background:var(--cf-surface);transition:border-color .14s,box-shadow .14s}
    .stat:hover{border-color:var(--cf-brand-200);box-shadow:0 8px 20px -16px rgba(15,23,42,.4)}
    .s-ic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;flex:none}.s-ic .material-icons{font-size:20px}
    .s-ic.i1{background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .s-ic.i2{background:color-mix(in srgb,#f59e0b 16%,transparent);color:#d97706}
    .s-ic.i3{background:color-mix(in srgb,#10b981 14%,transparent);color:#059669}
    .s-ic.i4{background:color-mix(in srgb,#8b5cf6 15%,transparent);color:#7c3aed}
    .stat b{font-size:19px;font-weight:800;color:var(--cf-ink-900);display:block;line-height:1.1}
    .stat small{font-size:11.5px;color:var(--cf-ink-500)}

    .rp-grid{display:grid;grid-template-columns:270px 1fr;gap:18px;align-items:start}
    @media(max-width:980px){.rp-grid{grid-template-columns:1fr}}
    .rail{position:sticky;top:12px;display:flex;flex-direction:column;gap:10px}
    .rail-search{display:flex;align-items:center;gap:8px;height:40px;padding:0 12px;border:1px solid var(--cf-line);border-radius:12px;background:var(--cf-surface)}
    .rail-search .material-icons{font-size:18px;color:var(--cf-ink-400)}
    .rail-search input{flex:1;border:0;background:none;outline:none;font:inherit;font-size:13.5px;color:var(--cf-ink-900)}
    .rail-list{display:flex;flex-direction:column;gap:6px}
    .role{display:flex;align-items:center;gap:11px;width:100%;border:1px solid transparent;background:var(--cf-surface);border-radius:13px;padding:10px 12px;cursor:pointer;text-align:start;transition:border-color .14s,background .14s,box-shadow .14s}
    .role:hover{border-color:var(--cf-line)}
    .role.on{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring);background:var(--cf-brand-50)}
    .role-ava{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#fff;font-weight:800;font-size:14px;flex:none}
    .role-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
    .role-name{display:flex;align-items:center;gap:5px;font-size:14px;font-weight:700;color:var(--cf-ink-900);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .role-name .rl{font-size:13px;color:var(--cf-ink-400)}.role-name .rs{font-size:13px;color:#d97706}
    .role-sub{font-size:11.5px;color:var(--cf-ink-500)}
    .role-bar{height:3px;border-radius:3px;background:var(--cf-surface-2);overflow:hidden}.role-bar i{display:block;height:100%;border-radius:3px;opacity:.85}
    .rail-empty{padding:14px;font-size:13px;text-align:center}

    .pane{border:1px solid var(--cf-line);border-radius:18px;background:var(--cf-surface);padding:20px 22px;min-height:420px}
    .hero{display:flex;align-items:center;gap:16px;padding-bottom:16px;border-bottom:1px solid var(--cf-line-soft)}
    .hero-ava{width:52px;height:52px;border-radius:15px;display:grid;place-items:center;color:#fff;font-weight:800;font-size:22px;flex:none;box-shadow:0 8px 18px -8px rgba(15,23,42,.45)}
    .hero-meta{flex:1;min-width:0}
    .hero-name{font-size:20px;font-weight:800;color:var(--cf-ink-900);display:flex;align-items:center;gap:9px}
    .hero-desc{font-size:13px;margin-top:3px}
    .pilllock{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:3px 8px;border-radius:999px;background:var(--cf-surface-2);color:var(--cf-ink-500)}.pilllock .material-icons{font-size:12px}
    .hero-name-in{width:100%;border:1px solid transparent;background:none;font:inherit;font-size:20px;font-weight:800;color:var(--cf-ink-900);border-radius:9px;padding:3px 8px;margin-inline-start:-8px}
    .hero-name-in:hover{border-color:var(--cf-line)}.hero-name-in:focus{border-color:var(--cf-brand-500);outline:none}
    .hero-desc-in{width:100%;border:1px solid transparent;background:none;font:inherit;font-size:13px;color:var(--cf-ink-600);border-radius:9px;padding:3px 8px;margin:3px 0 0 -8px}
    .hero-desc-in:hover{border-color:var(--cf-line)}.hero-desc-in:focus{border-color:var(--cf-brand-500);outline:none}
    .hero-facts{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-top:9px}
    .hf{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:var(--cf-ink-500)}
    .hf .material-icons{font-size:15px;color:var(--cf-ink-400)}
    .hf.sens{color:#b45309}.hf.sens .material-icons{color:#d97706}
    .hf+.hf{padding-inline-start:14px;border-inline-start:1px solid var(--cf-line)}
    .caps{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}
    .cap{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:var(--cf-ink-600);background:var(--cf-surface-2);border-radius:999px;padding:3px 9px}
    .cap .material-icons{font-size:13px;color:var(--cf-brand-600)}
    .hero-meter{display:flex;flex-direction:column;align-items:center;gap:8px;flex:none}
    .ring{--p:0;--c:var(--cf-brand-500);width:70px;height:70px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(var(--c) calc(var(--p)*1%),var(--cf-surface-2) 0);position:relative}
    .ring::before{content:'';position:absolute;inset:6px;border-radius:50%;background:var(--cf-surface)}
    .ring b{position:relative;font-size:18px;font-weight:800;color:var(--cf-ink-900);line-height:1}
    .ring small{position:relative;font-size:9px;color:var(--cf-ink-400);font-weight:600}
    .lvl{font-size:10.5px;font-weight:800;padding:3px 10px;border-radius:999px;white-space:nowrap}

    .tools{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:16px 0 14px}
    .psearch{flex:1;min-width:200px;display:flex;align-items:center;gap:8px;height:38px;padding:0 13px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface)}
    .psearch .material-icons{font-size:18px;color:var(--cf-ink-400)}
    .psearch input{flex:1;border:0;background:none;outline:none;font:inherit;font-size:13.5px;color:var(--cf-ink-900)}
    .psearch .clr{border:0;background:none;color:var(--cf-ink-400);cursor:pointer;display:grid;place-items:center}.psearch .clr .material-icons{font-size:16px}
    .ico{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 11px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface);font:inherit;font-size:12.5px;font-weight:600;color:var(--cf-ink-700);cursor:pointer;transition:.14s}
    .ico:hover{border-color:var(--cf-brand-400);background:var(--cf-brand-50);color:var(--cf-brand-700)}
    .ico .material-icons{font-size:17px}
    .ico.danger:hover{border-color:transparent;background:var(--cf-danger-soft);color:var(--cf-danger)}
    .ico.act{border-color:transparent;background:#7c3aed;color:#fff}
    .ico.act:hover{background:#6d28d9;color:#fff}
    .ico.st.act{background:var(--cf-brand-600)}.ico.st.act:hover{background:var(--cf-brand-700)}

    /* easy one-click compare bar */
    .cbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px;margin-bottom:12px;border:1px solid color-mix(in srgb,#8b5cf6 24%,var(--cf-line));background:color-mix(in srgb,#8b5cf6 6%,var(--cf-surface));border-radius:13px}
    .cbar-l{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#7c3aed;white-space:nowrap}
    .cbar-l .material-icons{font-size:16px}
    .cbar-chips{display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex:1;min-width:0}
    .cchip{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--cf-line);background:var(--cf-surface);border-radius:999px;padding:5px 12px;font:inherit;font-size:12.5px;font-weight:700;color:var(--cf-ink-700);cursor:pointer;transition:.13s}
    .cchip:hover{border-color:#a78bfa;color:#6d28d9}
    .cchip .cc-dot{width:11px;height:11px;border-radius:50%;flex:none;box-shadow:0 1px 3px rgba(15,23,42,.25)}
    .cchip.on{border-color:transparent;background:#7c3aed;color:#fff}
    .cchip.on .cc-dot{box-shadow:0 0 0 2px rgba(255,255,255,.6)}
    .cchip .cc-ck{font-size:15px;margin-inline-start:-2px}
    .cbar-x{border:0;background:rgba(124,58,237,.1);color:#7c3aed;border-radius:8px;width:28px;height:28px;display:grid;place-items:center;cursor:pointer;transition:.13s;flex:none}
    .cbar-x:hover{background:rgba(124,58,237,.22)}.cbar-x .material-icons{font-size:16px}
    .cc-n{font-size:10.5px;font-weight:800;color:var(--cf-ink-400);background:var(--cf-surface-2);border-radius:999px;padding:1px 7px;margin-inline-start:1px}
    .cchip.on .cc-n{background:rgba(255,255,255,.22);color:#fff}
    .sbar{border-color:var(--cf-brand-200);background:var(--cf-brand-50)}
    .sbar .cbar-l{color:var(--cf-brand-700)}
    .sbar .cchip:hover{border-color:var(--cf-brand-400);color:var(--cf-brand-700)}
    .sbar .cbar-x{background:var(--cf-brand-100);color:var(--cf-brand-700)}
    .sbar .cbar-x:hover{background:var(--cf-brand-200)}

    .note{display:flex;align-items:center;gap:9px;font-size:13px;color:var(--cf-ink-700);background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:12px;padding:11px 14px;margin-bottom:14px}
    .note .material-icons{font-size:17px;color:var(--cf-ink-400)}
    .note .lk,.cmpbar .lk{border:0;background:none;color:var(--cf-brand-700);font:inherit;font-weight:700;cursor:pointer;text-decoration:underline}
    .presets{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:16px}
    .presets-l{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--cf-ink-400);margin-inline-end:2px}
    .presets-l .material-icons{font-size:14px;color:var(--cf-brand-500)}
    .preset{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--cf-line);background:var(--cf-surface);border-radius:999px;padding:5px 12px;font:inherit;font-size:12px;font-weight:600;color:var(--cf-ink-700);cursor:pointer;transition:.13s}
    .preset .material-icons{font-size:14px;color:var(--cf-ink-400);transition:color .13s}
    .preset:hover{border-color:var(--cf-brand-400);background:var(--cf-brand-50);color:var(--cf-brand-700)}
    .preset:hover .material-icons{color:var(--cf-brand-500)}
    .preset.on{border-color:transparent;background:var(--cf-brand-600);color:#fff;box-shadow:0 6px 14px -8px var(--cf-brand-600)}
    .preset.on .material-icons{color:#fff}
    .preset.on .pchk{font-size:15px;margin-inline-start:1px}
    .cmp{border:1px solid color-mix(in srgb,#8b5cf6 24%,var(--cf-line));background:color-mix(in srgb,#8b5cf6 7%,var(--cf-surface));border-radius:13px;padding:11px 13px;margin-bottom:14px}
    .cmp-top{display:flex;align-items:center;justify-content:space-between;gap:10px}
    .cmp-pair{display:flex;align-items:center;gap:11px;flex-wrap:wrap}
    .cmp-role{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--cf-ink-900)}
    .cmp-role .cd{width:11px;height:11px;border-radius:3px;flex:none;box-shadow:0 1px 3px rgba(15,23,42,.25)}
    .cmp-vs{font-size:16px;color:#7c3aed}
    .cmp-x{border:0;background:rgba(124,58,237,.1);color:#7c3aed;border-radius:8px;width:26px;height:26px;display:grid;place-items:center;cursor:pointer;transition:.13s;flex:none}
    .cmp-x:hover{background:rgba(124,58,237,.22)}.cmp-x .material-icons{font-size:16px}
    .cmp-legend{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid color-mix(in srgb,#8b5cf6 16%,var(--cf-line))}
    .lg{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--cf-ink-600)}
    .lg b{color:var(--cf-ink-900);font-weight:800}
    .lg .dot{width:9px;height:9px;border-radius:50%;flex:none}
    .lg.add .dot{background:#10b981}.lg.rem .dot{background:#ef4444}.lg.same .dot{background:var(--cf-ink-300)}
    .cmp-views{display:inline-flex;background:var(--cf-surface);border:1px solid color-mix(in srgb,#8b5cf6 20%,var(--cf-line));border-radius:10px;padding:2px;gap:2px}
    .cmp-views button{display:inline-flex;align-items:center;gap:5px;border:0;background:none;font:inherit;font-size:12px;font-weight:700;color:var(--cf-ink-500);padding:5px 11px;border-radius:8px;cursor:pointer;transition:.12s}
    .cmp-views button .material-icons{font-size:15px}
    .cmp-views button:hover{color:#6d28d9}
    .cmp-views button.on{background:#7c3aed;color:#fff;box-shadow:0 4px 10px -4px rgba(124,58,237,.6)}
    .cmp-diffonly{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--cf-ink-600);cursor:pointer;margin-inline-start:auto}
    .cmp-diffonly input{position:absolute;opacity:0;width:0;height:0}
    .cmp-diffonly .cdo-box{width:15px;height:15px;border-radius:4px;border:1.5px solid color-mix(in srgb,#8b5cf6 40%,var(--cf-line));display:inline-grid;place-items:center;transition:.12s}
    .cmp-diffonly .cdo-box::after{content:'check';font-family:'Material Icons';font-size:11px;color:#fff;opacity:0}
    .cmp-diffonly input:checked+.cdo-box{background:#7c3aed;border-color:#7c3aed}.cmp-diffonly input:checked+.cdo-box::after{opacity:1}

    /* compare — matrix table */
    .mtx{border:1px solid var(--cf-line);border-radius:14px;overflow:hidden;background:var(--cf-surface)}
    .mtx-head,.mtx-row{display:grid;grid-template-columns:1fr 120px 120px;align-items:center}
    .mtx-head{background:var(--cf-surface-2);border-bottom:1px solid var(--cf-line);padding:10px 14px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-500)}
    .mtx-head .mtx-c{justify-self:center;display:inline-flex;align-items:center;gap:6px;color:var(--cf-ink-800)}
    .mtx-head .cd{width:10px;height:10px;border-radius:3px}
    .mtx-scr{display:flex;align-items:center;gap:7px;padding:9px 14px;background:color-mix(in srgb,var(--cf-brand-500) 4%,var(--cf-surface-2));font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-600);border-top:1px solid var(--cf-line-soft)}
    .mtx-scr .material-icons{font-size:15px}
    .mtx-row{padding:9px 14px;border-top:1px solid var(--cf-line-soft)}
    .mtx-row.d{background:color-mix(in srgb,#f59e0b 7%,transparent)}
    .mtx-c0{display:flex;flex-direction:column;gap:1px;min-width:0}
    .mtx-tt{font-size:12.5px;font-weight:600;color:var(--cf-ink-800)}
    .mtx-hint{font-size:11px;color:var(--cf-ink-500)}
    .mtx-c{justify-self:center}
    .mk{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:var(--cf-surface-2);color:var(--cf-ink-300);border:1px solid var(--cf-line)}
    .mk .material-icons{font-size:16px}
    .mk.yes{background:color-mix(in srgb,#10b981 15%,transparent);color:#059669;border-color:transparent}

    /* compare — split columns */
    .split{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    @media(max-width:700px){.split{grid-template-columns:1fr}}
    .split-col{border:1px solid var(--cf-line);border-radius:14px;background:var(--cf-surface);overflow:hidden}
    .split-head{display:flex;align-items:center;gap:9px;padding:12px 14px;border-bottom:1px solid var(--cf-line);font-size:14px;color:var(--cf-ink-900)}
    .split-head .split-n{margin-inline-start:auto;font-size:11px;font-weight:800;color:var(--cf-ink-500);background:var(--cf-surface-2);border-radius:999px;padding:2px 9px}
    .hero-ava.sm{width:28px;height:28px;border-radius:9px;font-size:13px;box-shadow:none}
    .split-scr{display:flex;align-items:center;gap:7px;padding:8px 14px;background:var(--cf-surface-2);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-500)}
    .split-scr .material-icons{font-size:14px}
    .split-row{display:flex;align-items:center;gap:8px;padding:7px 14px 7px 16px;font-size:12.5px;color:var(--cf-ink-700);border-top:1px solid var(--cf-line-soft)}
    .split-row .material-icons{font-size:15px;color:#10b981}
    .split-row.uniq{background:color-mix(in srgb,#10b981 8%,transparent);font-weight:600;color:var(--cf-ink-900)}

    /* screen cards grid */
    .cards{display:flex;flex-direction:column;gap:12px}
    .card{border:1px solid var(--cf-line);border-inline-start:3px solid var(--sc,var(--cf-brand-500));border-radius:13px;background:var(--cf-surface);overflow:hidden;transition:box-shadow .16s,border-color .16s}
    .card:hover{box-shadow:0 12px 26px -18px rgba(15,23,42,.38)}
    .card-h{display:flex;align-items:center;gap:11px;padding:12px 15px;cursor:pointer;transition:background .13s}
    .card-h:hover{background:var(--cf-surface-2)}
    .card-tt em{font-style:normal;font-weight:500;text-transform:none;letter-spacing:0;color:var(--cf-ink-400);font-size:11.5px;margin-inline-start:8px}
    .card-ic{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex:none}.card-ic .material-icons{font-size:18px}
    .card-tt{flex:1;min-width:0;font-size:12.5px;font-weight:800;letter-spacing:.02em;text-transform:uppercase;color:var(--cf-ink-800);line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .card-all{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:11px;font-weight:700;color:var(--cf-ink-500);background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:999px;padding:3px 6px 3px 8px;cursor:pointer;transition:.13s}
    .card-all:hover:not(:disabled){border-color:var(--cf-brand-400);color:var(--cf-brand-700);background:var(--cf-brand-50)}
    .card-all:disabled{cursor:default;opacity:.55}
    .card-all .material-icons{font-size:16px}
    .card-all .ca-tx{white-space:nowrap;letter-spacing:.01em}
    .card-all .ca-n{font-size:10px;font-weight:800;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:999px;padding:1px 6px}
    .card-all.some{color:var(--sc,var(--cf-brand-700));border-color:color-mix(in srgb,var(--sc,var(--cf-brand-500)) 40%,var(--cf-line));background:color-mix(in srgb,var(--sc,var(--cf-brand-500)) 8%,transparent)}
    .card-all.full{color:#fff;background:var(--sc,var(--cf-brand-600));border-color:transparent}
    .card-all.full .material-icons{color:#fff}
    .card-all.full .ca-n{background:rgba(255,255,255,.22);border-color:transparent;color:#fff}
    .card-bar{height:3px;background:var(--cf-surface-2);margin:0 15px 2px}.card-bar i{display:block;height:100%;border-radius:3px;transition:width .2s}
    .card-perms{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:8px;padding:11px 15px 14px;animation:cardin .16s ease}
    @media(max-width:520px){.card-perms{grid-template-columns:1fr}}
    @keyframes cardin{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
    .card-chev{margin-inline-start:1px;color:var(--cf-ink-300);transition:transform .2s;font-size:18px}
    .card-chev.open{transform:rotate(180deg)}
    .cards-top{position:sticky;top:8px;z-index:20;display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;padding:9px 12px;border:1px solid var(--cf-line);border-radius:12px;background:color-mix(in srgb,var(--cf-surface) 82%,transparent);backdrop-filter:blur(8px)}
    .ct-sum{font-size:12.5px;font-weight:600;color:var(--cf-ink-500);white-space:nowrap}.ct-sum b{color:var(--cf-ink-800);font-weight:800}
    .ct-filters{display:inline-flex;align-items:center;gap:5px;flex-wrap:wrap;margin-inline:auto}
    .ct-f{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--cf-line);background:var(--cf-surface);border-radius:999px;padding:4px 11px;font:inherit;font-size:11.5px;font-weight:700;color:var(--cf-ink-600);cursor:pointer;transition:.12s}
    .ct-f .material-icons{font-size:14px;color:var(--cf-ink-400)}
    .ct-f:hover{border-color:var(--cf-brand-400);color:var(--cf-brand-700)}
    .ct-f.on{background:var(--cf-brand-600);border-color:transparent;color:#fff}.ct-f.on .material-icons{color:#fff}
    .ct-toggle{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--cf-line);background:var(--cf-surface);border-radius:8px;padding:5px 12px;font:inherit;font-size:12px;font-weight:700;color:var(--cf-brand-700);cursor:pointer;transition:.13s}
    .ct-toggle:hover{background:var(--cf-brand-50);border-color:var(--cf-brand-400)}.ct-toggle .material-icons{font-size:16px}
    .pk:focus-within{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .pk{display:flex;align-items:flex-start;gap:9px;padding:9px 10px;border:1px solid var(--cf-line);border-radius:10px;cursor:pointer;background:var(--cf-surface);transition:border-color .12s,background .12s;position:relative}
    .pk:hover{border-color:color-mix(in srgb,var(--cf-brand-500) 35%,var(--cf-line));background:var(--cf-surface-2)}
    .pk.on{border-color:var(--cf-brand-300);background:var(--cf-brand-50)}
    .pk.on:hover{background:color-mix(in srgb,var(--cf-brand-500) 8%,var(--cf-brand-50))}
    .pk.dis{cursor:not-allowed;opacity:.8}
    .pk.d-add{box-shadow:inset 3px 0 0 #10b981}.pk.d-rem{box-shadow:inset 3px 0 0 #ef4444}
    .pk input{position:absolute;opacity:0;width:0;height:0}
    .pk-box{width:17px;height:17px;border-radius:5px;border:1.5px solid var(--cf-line);background:var(--cf-surface);flex:none;margin-top:1px;position:relative;transition:.13s}
    .pk.on .pk-box{background:var(--cf-brand-500);border-color:var(--cf-brand-500)}
    .pk-box::after{content:'check';font-family:'Material Icons';font-size:13px;color:#fff;position:absolute;inset:0;display:grid;place-items:center;opacity:0;transition:opacity .12s}
    .pk.on .pk-box::after{opacity:1}
    .pk-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
    .pk-top{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    .pk-tt{font-size:12.5px;font-weight:700;color:var(--cf-ink-800);line-height:1.2}
    .pk-hint{font-size:11px;color:var(--cf-ink-500);line-height:1.35}
    .pk-auto{font-size:8px;font-weight:800;letter-spacing:.05em;color:var(--cf-brand-700);background:var(--cf-brand-50);border:1px solid var(--cf-brand-100);border-radius:4px;padding:1px 4px;flex:none}
    .pk-sens{font-size:13px;color:#d97706;flex:none}
    .pk-i{border:0;background:none;color:#d7dbe3;cursor:pointer;display:grid;place-items:center;flex:none;padding:0;width:22px;height:22px;border-radius:50%;transition:.13s;margin-top:-1px}
    .pk-i:hover{color:var(--sc,var(--cf-brand-500));background:color-mix(in srgb,var(--sc,var(--cf-brand-500)) 15%,transparent)}
    .pk-i .material-icons{font-size:17px}
    .pk.on .pk-i{color:#d7dbe3}

    .empty{text-align:center;color:var(--cf-ink-400);padding:70px 20px}.empty .material-icons{font-size:42px}.empty p{margin-top:8px;font-size:14px}

    .savebar{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:60;display:flex;align-items:center;gap:18px;padding:10px 12px 10px 18px;border-radius:14px;background:var(--cf-ink-900);color:#fff;box-shadow:0 20px 44px -18px rgba(2,6,23,.6);animation:sbin .2s ease}
    @keyframes sbin{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}
    .sb-l{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600}.sb-l .material-icons{font-size:17px;color:#fde68a}
    .sb-r{display:flex;align-items:center;gap:8px}
    .sb-discard{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font:inherit;font-size:12.5px;font-weight:600;border-radius:9px;padding:7px 13px;cursor:pointer}
    .sb-discard:hover{background:rgba(255,255,255,.16)}
    .sb-save{display:inline-flex;align-items:center;gap:6px;border:0;background:var(--cf-brand-500);color:#fff;font:inherit;font-size:12.5px;font-weight:700;border-radius:9px;padding:7px 14px;cursor:pointer}
    .sb-save:hover{background:var(--cf-brand-600)}.sb-save .material-icons{font-size:16px}

    .iover{position:fixed;inset:0;background:rgba(2,6,23,.5);backdrop-filter:blur(3px);display:grid;place-items:center;z-index:80;padding:20px}
    .imodal{position:relative;width:100%;max-width:400px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:18px;box-shadow:0 36px 72px -26px rgba(2,6,23,.55);overflow:hidden;animation:iin .18s ease}
    @keyframes iin{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
    .iclose{position:absolute;top:12px;inset-inline-end:12px;border:0;background:rgba(255,255,255,.6);border-radius:8px;width:26px;height:26px;display:grid;place-items:center;color:var(--cf-ink-500);cursor:pointer;z-index:1;transition:.13s}
    .iclose:hover{background:#fff;color:var(--cf-ink-900)}.iclose .material-icons{font-size:17px}
    .ihead{display:flex;align-items:flex-start;gap:12px;padding:16px 18px 15px;border-bottom:1px solid var(--cf-line-soft)}
    .ii{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;flex:none;color:#fff;box-shadow:0 6px 14px -6px rgba(15,23,42,.45)}.ii .material-icons{font-size:21px}
    .ihx{flex:1;min-width:0;padding-inline-end:24px}
    .ihx small{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:var(--cf-ink-500)}
    .ihx h4{font-size:16px;font-weight:800;color:var(--cf-ink-900);margin-top:1px;line-height:1.25}
    .ibadge{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:800;color:#b45309;background:#fef3c7;border:1px solid #fde68a;border-radius:999px;padding:2px 8px;margin-top:6px}.ibadge .material-icons{font-size:11px}
    .ibody{padding:15px 18px 18px}
    .ilbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--cf-ink-400);margin-bottom:5px}
    .idesc{font-size:13px;line-height:1.6;color:var(--cf-ink-700);margin-bottom:15px}
    .isec{margin-bottom:13px}
    .isec-l{display:flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--cf-ink-600);margin-bottom:6px}.isec-l .material-icons{font-size:14px;color:var(--cf-ink-400)}
    .ichips{display:flex;flex-wrap:wrap;gap:5px}
    .ichip{font-size:11px;font-weight:600;color:var(--cf-ink-700);background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:7px;padding:3px 9px}
    .ichip.on{color:var(--cf-brand-700);background:var(--cf-brand-50);border-color:var(--cf-brand-100)}
    .icode{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--cf-ink-500);border-top:1px solid var(--cf-line-soft);padding-top:13px;margin-top:2px}.icode .material-icons{font-size:14px;color:var(--cf-ink-400)}.icode code{margin-inline-start:auto;background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:6px;padding:2px 8px;font-family:monospace;font-size:11px;color:var(--cf-ink-800)}
  `],
})
export class RolesPage {
  readonly A = Actions;
  readonly rbac = inject(RbacService);
  private alerts = inject(AlertService);
  private router = inject(Router);

  readonly roles = this.rbac.roles;
  selectedId = signal<string>('');
  selected = computed<RbacRole | undefined>(() => {
    const l = this.roles();
    return l.find((r) => r.id === this.selectedId()) ?? l.find((r) => r.systemKey === 'editor') ?? l[0];
  });

  rq = signal('');
  q = signal('');
  compareId = signal<string | null>(null);
  compareView = signal<'overlay' | 'split' | 'matrix'>('overlay');
  diffOnly = signal<boolean>(false);
  permFilter = signal<'all' | 'granted' | 'sensitive' | 'missing'>('all');
  startFrom = signal<string>('');
  startOpen = signal<boolean>(false);
  compareOpen = signal<boolean>(false);
  /** True when the compare bar is showing OR a role is actively being compared. */
  comparing = computed<boolean>(() => this.compareOpen() || !!this.compareId());

  toggleStartBar(): void { this.startOpen.set(!this.startOpen()); if (this.startOpen()) this.compareOpen.set(false); }
  pickStart(id: string): void { this.onStartFrom(id); this.startOpen.set(false); }
  toggleCompareBar(): void { if (this.comparing()) this.closeCompare(); else { this.compareOpen.set(true); this.startOpen.set(false); } }
  pickCompare(id: string | null): void { this.compareId.set(id); this.compareOpen.set(true); }
  closeCompare(): void { this.compareOpen.set(false); this.compareId.set(null); }

  readonly filterOptions: { key: 'all' | 'granted' | 'sensitive' | 'missing'; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'apps' },
    { key: 'granted', label: 'Granted', icon: 'check_circle' },
    { key: 'sensitive', label: 'Sensitive', icon: 'shield' },
    { key: 'missing', label: 'Not granted', icon: 'radio_button_unchecked' },
  ];

  draftPerms = signal<Set<string>>(new Set());
  draftName = signal('');
  draftDesc = signal('');
  private loadedId = '';

  constructor() {
    effect(() => {
      const r = this.selected();
      if (r && r.id !== this.loadedId) { this.loadDraft(r); this.loadedId = r.id; }
    });
  }
  private loadDraft(r: RbacRole): void { this.draftPerms.set(new Set(r.permissions)); this.draftName.set(r.name); this.draftDesc.set(r.desc); }
  select(id: string): void { this.selectedId.set(id); }
  draftCodes = computed(() => [...this.draftPerms()]);

  collapsed = signal<Set<string>>(new Set<string>());
  isOpen(k: string): boolean { return !this.collapsed().has(k); }
  toggleCard(k: string): void { const s = new Set(this.collapsed()); if (s.has(k)) s.delete(k); else s.add(k); this.collapsed.set(s); }
  allOpen = computed(() => this.collapsed().size === 0);
  toggleAllCards(): void { this.collapsed.set(this.allOpen() ? new Set(this.rbac.screens.map((s) => s.key)) : new Set<string>()); }

  readonly filteredRoles = computed(() => {
    const s = this.rq().trim().toLowerCase();
    return s ? this.roles().filter((r) => r.name.toLowerCase().includes(s)) : this.roles();
  });
  private matchSearch(p: { label: string; desc: string; hint: string }, s: string): boolean {
    return !s || p.label.toLowerCase().includes(s) || p.desc.toLowerCase().includes(s) || p.hint.toLowerCase().includes(s);
  }
  /** Screens filtered by the search box only (used by Split / Matrix compare views). */
  readonly searchedScreens = computed<RbacScreen[]>(() => {
    const s = this.q().trim().toLowerCase();
    if (!s) return this.rbac.screens;
    return this.rbac.screens.map((g) => ({ ...g, perms: g.perms.filter((p) => this.matchSearch(p, s)) })).filter((g) => g.perms.length);
  });
  /** Screens filtered by search AND the active filter chip (used by the editable cards). */
  readonly filteredScreens = computed<RbacScreen[]>(() => {
    const s = this.q().trim().toLowerCase();
    const f = this.permFilter();
    const draft = this.draftPerms();
    return this.rbac.screens
      .map((g) => ({ ...g, perms: g.perms.filter((p) => {
        if (!this.matchSearch(p, s)) return false;
        if (f === 'granted') return draft.has(p.code);
        if (f === 'missing') return !draft.has(p.code);
        if (f === 'sensitive') return this.sensitive(p.code);
        return true;
      }) }))
      .filter((g) => g.perms.length);
  });

  sensitiveCount = computed(() => this.roles().filter((r) => this.rbac.isSensitiveCodes(r.permissions)).length);
  totalMembers = computed(() => this.roles().reduce((s, r) => s + (r.members ?? 0), 0));
  avgAccess = computed(() => { const l = this.roles(); return l.length ? Math.round((l.reduce((s, r) => s + this.pct(r.permissions), 0) / l.length) * 100) : 0; });

  compareRole = computed<RbacRole | null>(() => { const id = this.compareId(); return id ? (this.roles().find((r) => r.id === id) ?? null) : null; });
  diffMore = computed(() => { const c = this.compareRole(); if (!c) return 0; return [...this.draftPerms()].filter((p) => !c.permissions.includes(p)).length; });
  diffFewer = computed(() => { const c = this.compareRole(); if (!c) return 0; return c.permissions.filter((p) => !this.draftPerms().has(p)).length; });
  diffSame = computed(() => { const c = this.compareRole(); if (!c) return 0; return [...this.draftPerms()].filter((p) => c.permissions.includes(p)).length; });
  diff(code: string): '' | 'add' | 'rem' {
    const c = this.compareRole(); if (!c) return '';
    const a = this.draftPerms().has(code); const b = c.permissions.includes(code);
    return a && !b ? 'add' : !a && b ? 'rem' : '';
  }
  // ---- Split / Matrix compare helpers ----
  cmpHas(code: string): boolean { return this.compareRole()?.permissions.includes(code) ?? false; }
  /** Matrix rows for a screen — all perms, or only the ones that differ when "Differences only" is on. */
  matrixRows(s: RbacScreen): RbacPermission[] {
    const perms = (this.searchedScreens().find((g) => g.key === s.key)?.perms ?? []) as RbacPermission[];
    return this.diffOnly() ? perms.filter((p) => this.has(p.code) !== this.cmpHas(p.code)) : perms;
  }
  matrixTotal(): number { return this.searchedScreens().reduce((n, s) => n + this.matrixRows(s).length, 0); }
  /** Split-column rows: perms the given role grants (optionally only the ones unique to that role). */
  splitRows(s: RbacScreen, col: RbacRole | null | undefined): RbacPermission[] {
    if (!col) return [];
    const perms = (this.searchedScreens().find((g) => g.key === s.key)?.perms ?? []) as RbacPermission[];
    return perms.filter((p) => this.roleHas(col, p.code) && (!this.diffOnly() || this.isUnique(p.code, col)));
  }
  private roleHas(col: RbacRole, code: string): boolean {
    return col.id === this.selected()?.id ? this.draftPerms().has(code) : col.permissions.includes(code);
  }
  /** True when this role grants the code but the *other* compared role does not. */
  isUnique(code: string, col: RbacRole | null | undefined): boolean {
    if (!col) return false;
    const other = col.id === this.selected()?.id ? this.compareRole() : this.selected();
    return this.roleHas(col, code) && !(other ? this.roleHas(other, code) : false);
  }

  presets: { key: string; label: string; icon: string; codes: string[] }[] = [
    { key: 'full', label: 'Full access', icon: 'all_inclusive', codes: [...this.rbac.allCodes] },
    { key: 'editor', label: 'Editor', icon: 'design_services', codes: [Actions.Template_View, Actions.Template_Create, Actions.Template_Edit, Actions.Template_Export, Actions.Canvas_View, Actions.Canvas_Edit, Actions.Canvas_Save, Actions.Credential_View, Actions.Credential_Generate, Actions.Credential_Bulk, Actions.Branding_Manage] },
    { key: 'issuer', label: 'Issuer', icon: 'workspace_premium', codes: [Actions.Credential_View, Actions.Credential_Generate, Actions.Credential_Bulk, Actions.Credential_Download] },
    { key: 'approver', label: 'Approver', icon: 'verified', codes: [Actions.Approval_View, Actions.Credential_View, Actions.Credential_Approve, Actions.Credential_Reject, Actions.Credential_Revoke] },
    { key: 'readonly', label: 'Read-only', icon: 'visibility', codes: [Actions.Dashboard_View, Actions.Template_View, Actions.Credential_View, Actions.User_View, Actions.Role_View] },
    { key: 'none', label: 'No access', icon: 'block', codes: [] },
  ];
  /** The preset whose full (dependency-resolved) code set exactly matches the current draft, if any. */
  activePreset = computed<string>(() => {
    const cur = [...this.draftPerms()].sort().join('|');
    for (const p of this.presets) {
      const full = [...new Set(p.codes.flatMap((c) => [c, ...this.rbac.requiredBy(c)]))].sort().join('|');
      if (full === cur) return p.key;
    }
    return '';
  });

  pct(codes: string[]): number { return this.rbac.total ? codes.length / this.rbac.total : 0; }
  ratio(s: RbacScreen): number { return s.perms.length ? this.granted(s) / s.perms.length : 0; }
  has(code: string): boolean { return this.draftPerms().has(code); }
  sensitive(code: string): boolean { return this.rbac.isSensitiveCodes([code]); }
  granted(s: RbacScreen): number { return s.perms.filter((p) => this.draftPerms().has(p.code)).length; }
  allOn(s: RbacScreen): boolean { return s.perms.length > 0 && s.perms.every((p) => this.draftPerms().has(p.code)); }
  screenState(s: RbacScreen): 'check_box' | 'indeterminate_check_box' | 'check_box_outline_blank' {
    const g = this.granted(s);
    return g === 0 ? 'check_box_outline_blank' : g === s.perms.length ? 'check_box' : 'indeterminate_check_box';
  }
  toggleScreenAll(s: RbacScreen): void {
    const r = this.selected(); if (!r || r.isSystem) return;
    const codes = s.perms.map((p) => p.code);
    const cur = this.draftPerms();
    if (codes.every((c) => cur.has(c))) { const drop = new Set([...codes, ...codes.flatMap((c) => this.rbac.dependentsOf(c))]); this.setDraft([...cur].filter((c) => !drop.has(c))); }
    else this.setDraft([...new Set([...cur, ...codes, ...codes.flatMap((c) => this.rbac.requiredBy(c))])]);
  }
  isRequired(code: string): boolean { return this.draftPerms().has(code) && this.rbac.dependentsOf(code).some((d) => this.draftPerms().has(d)); }
  tint(c: string): string { return `color-mix(in srgb, ${c} 14%, transparent)`; }
  lvl(codes: string[]): { label: string; color: string; bg: string } {
    const p = this.pct(codes);
    if (p >= 0.999) return { label: 'Full access', color: '#4338ca', bg: '#eef2ff' };
    if (p >= 0.6) return { label: 'Standard', color: '#0369a1', bg: '#e0f2fe' };
    if (p >= 0.25) return { label: 'Limited', color: '#b45309', bg: '#fef3c7' };
    return { label: 'Read-only', color: '#475569', bg: '#f1f5f9' };
  }
  caps(codes: string[]): { icon: string; label: string }[] {
    const h = (c: string) => codes.includes(c);
    const out: { icon: string; label: string }[] = [];
    if (h(Actions.Template_Create) || h(Actions.Template_Edit)) out.push({ icon: 'design_services', label: 'Design' });
    if (h(Actions.Credential_Generate) || h(Actions.Credential_Bulk)) out.push({ icon: 'workspace_premium', label: 'Issue' });
    if (h(Actions.Credential_Bulk)) out.push({ icon: 'dynamic_feed', label: 'Bulk' });
    if (h(Actions.Credential_Approve) || h(Actions.Credential_Revoke)) out.push({ icon: 'verified', label: 'Approve' });
    if (h(Actions.Branding_Manage)) out.push({ icon: 'palette', label: 'Brand' });
    if (h(Actions.User_Manage) || h(Actions.Role_Manage)) out.push({ icon: 'group', label: 'People' });
    if (h(Actions.Automation_Manage)) out.push({ icon: 'bolt', label: 'Automate' });
    if (h(Actions.Billing_Manage) || h(Actions.Plan_Change)) out.push({ icon: 'credit_card', label: 'Billing' });
    if (h(Actions.Settings_Manage)) out.push({ icon: 'settings', label: 'Settings' });
    if (!out.length) out.push({ icon: 'visibility', label: 'View only' });
    return out;
  }

  private setDraft(codes: string[]): void { this.draftPerms.set(new Set(codes)); }
  toggle(code: string): void {
    const r = this.selected(); if (!r || r.isSystem) return;
    const cur = this.draftPerms();
    if (cur.has(code)) { const drop = new Set([code, ...this.rbac.dependentsOf(code)]); this.setDraft([...cur].filter((c) => !drop.has(c))); }
    else this.setDraft([...new Set([...cur, code, ...this.rbac.requiredBy(code)])]);
  }
  applyPreset(codes: string[]): void {
    const r = this.selected(); if (!r || r.isSystem) return;
    this.setDraft([...new Set(codes.flatMap((c) => [c, ...this.rbac.requiredBy(c)]))]);
  }
  onStartFrom(id: string): void {
    const r = this.selected(); if (!r || r.isSystem || !id) { this.startFrom.set(''); return; }
    const src = this.roles().find((x) => x.id === id);
    if (src) this.setDraft([...new Set(src.permissions.flatMap((c) => [c, ...this.rbac.requiredBy(c)]))]);
    this.startFrom.set('');
  }

  dirty = computed<boolean>(() => {
    const r = this.selected(); if (!r || r.isSystem) return false;
    const a = [...this.draftPerms()].sort().join('|'); const b = [...r.permissions].sort().join('|');
    return a !== b || this.draftName() !== r.name || this.draftDesc() !== r.desc;
  });
  save(): void {
    const r = this.selected(); if (!r || r.isSystem) return;
    if (this.draftName() !== r.name || this.draftDesc() !== r.desc) this.rbac.rename(r.id, this.draftName().trim() || r.name, this.draftDesc());
    this.rbac.setPermissions(r.id, [...this.draftPerms()]);
    this.alerts.success('Role saved.');
  }
  discard(): void { const r = this.selected(); if (r) this.loadDraft(r); }

  addRole(): void {
    const r = this.rbac.createRole('New role', [Actions.Dashboard_View, Actions.Template_View, Actions.Credential_View]);
    this.selectedId.set(r.id); this.loadedId = ''; this.loadDraft(r); this.loadedId = r.id;
    this.alerts.success('Role created — customise its permissions, then Save.');
  }
  clone(r: RbacRole): void {
    const n = this.rbac.cloneRole(r);
    this.selectedId.set(n.id); this.loadedId = ''; this.loadDraft(n); this.loadedId = n.id;
    this.alerts.success('Role cloned — now fully editable.');
  }
  async del(r: RbacRole): Promise<void> {
    if (r.isSystem) return;
    const ok = await this.alerts.confirm({ title: 'Delete role', message: `Delete the “${r.name}” role?`, danger: true, confirmText: 'Delete' });
    if (!ok) return;
    this.rbac.deleteRole(r.id);
    this.selectedId.set(''); this.loadedId = '';
    this.alerts.success('Role deleted.');
  }
  preview(r: RbacRole): void {
    this.rbac.startPreview(r.id);
    this.alerts.info(`Previewing the app as “${r.name}”. Use the banner at the top to exit preview.`);
    this.router.navigateByUrl('/app/dashboard');
  }

  private permLabel(code: string): string {
    for (const s of this.rbac.screens) { const p = s.perms.find((x) => x.code === code); if (p) return p.label; }
    return code;
  }
  info = signal<{ label: string; desc: string; screen: string; icon: string; color: string; code: string; requires: string[]; enables: string[]; sensitive: boolean } | null>(null);
  openInfo(p: { code: string; label: string; desc: string }, s: RbacScreen, e: Event): void {
    e.preventDefault(); e.stopPropagation();
    this.info.set({ label: p.label, desc: p.desc, screen: s.label, icon: s.icon, color: s.color, code: p.code, requires: this.rbac.requiredBy(p.code).map((c) => this.permLabel(c)), enables: this.rbac.dependentsOf(p.code).map((c) => this.permLabel(c)), sensitive: this.sensitive(p.code) });
  }
  closeInfo(): void { this.info.set(null); }
  @HostListener('document:keydown.escape') onEsc(): void { if (this.info()) { this.closeInfo(); return; } if (this.startOpen()) { this.startOpen.set(false); return; } if (this.compareOpen()) { this.closeCompare(); return; } if (this.q()) this.q.set(''); }
}

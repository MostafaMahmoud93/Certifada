import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HasActionDirective } from '../../shared/directives/has-action.directive';
import { Actions } from '../../core/constants/actions';
import { AlertService } from '../../core/services/alert.service';
import { PlanService } from '../../core/services/plan.service';

type UStatus = 'Active' | 'Invited' | 'Suspended';
interface AppUser { id: number; name: string; email: string; role: string; status: UStatus; lastActive: string | null; }

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, HasActionDirective],
  template: `
  <div class="head">
    <div>
      <h1>Team Members &amp; Seat Management</h1>
      <p class="cf-muted">Invite designers, reviewers, and creators to collaborate, and manage active seats.</p>
    </div>
    <button class="cf-btn cf-btn-primary" (click)="openInvite()" [appHasAction]="A.User_Manage" [tooltipMessage]="'🔒 Managing the team is not in your plan.'">
      <span class="material-icons">person_add</span> Invite member
    </button>
  </div>

  <!-- ===================== SEAT UTILIZATION ===================== -->
  <div class="cf-card seats">
    <div class="seats-top">
      <div class="seats-title"><span class="st-ic"><span class="material-icons">event_seat</span></span><h3>Plan Seats Utilization</h3></div>
      <div class="seats-act"><span class="plan-chip"><span class="material-icons">workspace_premium</span> Active Plan: <b>{{ plan.current().name }}</b></span><a class="seats-up" routerLink="/pricing"><span class="material-icons">add_circle</span> Add seats</a></div>
    </div>
    <div class="sm-head"><span class="sm-big">{{ allocated() }} <small>of {{ seatLimitLabel() }} seats allocated</small></span><span class="sm-pct">{{ seatPct() }}%</span></div>
    <div class="sm-bar"><span class="active" [style.width.%]="pctOf(activeCount())"></span><span class="pending" [style.width.%]="pctOf(pendingCount())"></span></div>
    <div class="seats-legend">
      <span class="sl"><i class="active"></i> <b>{{ activeCount() }}</b> Active</span>
      <span class="dotsep">·</span>
      <span class="sl"><i class="pending"></i> <b>{{ pendingCount() }}</b> Pending</span>
      <span class="dotsep">·</span>
      <span class="sl"><i class="empty"></i> <b>{{ availableLabel() }}</b> Available</span>
    </div>
  </div>

  <!-- ===================== TOOLBAR ===================== -->
  <div class="toolbar">
    <div class="search"><span class="material-icons">search</span><input [(ngModel)]="search" placeholder="Search name or email…" /></div>
    <div class="chips">
      <button [class.on]="roleFilter()==='all'" (click)="roleFilter.set('all')">All <span class="c">{{ users().length }}</span></button>
      @for (r of roles; track r) { <button [class.on]="roleFilter()===r" (click)="roleFilter.set(r)">{{ r }} <span class="c">{{ countRole(r) }}</span></button> }
    </div>
  </div>

  <!-- ===================== MEMBERS ===================== -->
  @if (filtered().length === 0) {
    <div class="state"><div class="st-badge"><span class="material-icons">group_off</span></div><h3>No members match</h3><p class="cf-muted">Try a different search or role filter.</p></div>
  } @else {
    <div class="cf-card table-wrap">
      <table class="cf-table">
        <thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Last active</th><th class="r">Actions</th></tr></thead>
        <tbody>
          @for (u of filtered(); track u.id) {
            <tr>
              <td>
                <div class="who">
                  <span class="ava" [class]="'s-' + u.status.toLowerCase()">{{ initials(u.name) }}<i class="pres"></i></span>
                  <div class="who-tx"><strong>{{ u.name }}</strong><small class="cf-muted">{{ u.email }}</small></div>
                </div>
              </td>
              <td>
                <div class="roledd" [class.open]="roleMenu() === u.id">
                  <button class="rdd-btn" [class]="'rp-' + u.role.toLowerCase()" (click)="toggleRoleMenu(u.id, $event)" [appHasAction]="A.User_Manage" [tooltipMessage]="'🔒 Not in your plan.'">
                    <span class="material-icons rico">{{ roleIcon(u.role) }}</span> {{ u.role }} <span class="material-icons chev">expand_more</span>
                  </button>
                  @if (roleMenu() === u.id) {
                    <div class="rdd-menu" (click)="$event.stopPropagation()">
                      @for (r of roles; track r) {
                        <button class="rdd-opt" [class.on]="u.role === r" (click)="setRole(u, r); roleMenu.set(null)">
                          <span class="ro-ic" [class]="'rp-' + r.toLowerCase()"><span class="material-icons">{{ roleIcon(r) }}</span></span>
                          <span class="ro-tx"><b>{{ r }}</b><small>{{ roleDesc(r) }}</small></span>
                          @if (u.role === r) { <span class="material-icons ro-check">check_circle</span> }
                        </button>
                      }
                    </div>
                  }
                </div>
              </td>
              <td><span class="badge" [class.active]="u.status==='Active'" [class.invited]="u.status==='Invited'" [class.susp]="u.status==='Suspended'"><span class="bdot"></span>{{ u.status }}</span></td>
              <td class="cf-muted">{{ u.lastActive ? (u.lastActive | date: 'mediumDate') : 'Never' }}</td>
              <td class="r">
                <div class="actbar">
                  @if (u.status === 'Active') {
                    <button class="ic" title="Suspend" (click)="toggle(u)" [appHasAction]="A.User_Manage" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">pause_circle</span></button>
                  } @else if (u.status === 'Suspended') {
                    <button class="ic" title="Reactivate" (click)="toggle(u)" [appHasAction]="A.User_Manage" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">play_circle</span></button>
                  } @else {
                    <button class="ic" title="Resend invite" (click)="flash('Invite re-sent to ' + u.email)" [appHasAction]="A.User_Manage" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">forward_to_inbox</span></button>
                  }
                  <button class="ic danger" title="Remove" (click)="remove(u)" [appHasAction]="A.User_Manage" [tooltipMessage]="'🔒 Not in your plan.'"><span class="material-icons">delete</span></button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  }

  @if (inviteOpen()) {
    <div class="overlay" (click)="inviteOpen.set(false)">
      <div class="modal invite" (click)="inviteRoleOpen.set(false); $event.stopPropagation()">
        <button class="close" (click)="inviteOpen.set(false)"><span class="material-icons">close</span></button>
        <div class="m-hero"><span class="m-seal"><span class="material-icons">person_add</span></span><h3>Invite a team member</h3><p class="cf-muted">They'll get an email invite and use one of your seats.</p></div>
        <label class="fld"><span class="fld-l">Email address</span><input [(ngModel)]="inviteEmail" type="email" placeholder="name@company.com" /></label>
        <div class="fld">
          <span class="fld-l">Assign a role</span>
          <div class="roledd block" [class.open]="inviteRoleOpen()">
            <button type="button" class="rdd-btn full" (click)="toggleInviteRole($event)">
              <span class="ro-ic" [class]="'rp-' + inviteRole.toLowerCase()"><span class="material-icons">{{ roleIcon(inviteRole) }}</span></span>
              <span class="rdd-lbl"><b>{{ inviteRole }}</b><small>{{ roleDesc(inviteRole) }}</small></span>
              <span class="material-icons chev">expand_more</span>
            </button>
            @if (inviteRoleOpen()) {
              <div class="rdd-menu block" (click)="$event.stopPropagation()">
                @for (r of roles; track r) {
                  <button type="button" class="rdd-opt" [class.on]="inviteRole === r" (click)="inviteRole = r; inviteRoleOpen.set(false)">
                    <span class="ro-ic" [class]="'rp-' + r.toLowerCase()"><span class="material-icons">{{ roleIcon(r) }}</span></span>
                    <span class="ro-tx"><b>{{ r }}</b><small>{{ roleDesc(r) }}</small></span>
                    @if (inviteRole === r) { <span class="material-icons ro-check">check_circle</span> }
                  </button>
                }
              </div>
            }
          </div>
        </div>
        <div class="m-seatinfo"><span class="material-icons">event_seat</span> <span><b>{{ availableLabel() }}</b> of {{ seatLimitLabel() }} seats available</span></div>
        @if (!seatsLeft()) { <div class="seat-warn"><span class="material-icons">info</span> All {{ seatLimitLabel() }} seats are in use. <a routerLink="/pricing">Upgrade your plan</a> for more.</div> }
        <div class="modal-actions">
          <button class="cf-btn cf-btn-secondary" (click)="inviteOpen.set(false)">Cancel</button>
          <button class="cf-btn cf-btn-primary" [disabled]="!inviteEmail.trim() || !seatsLeft()" (click)="sendInvite()"><span class="material-icons">send</span> Send invite</button>
        </div>
      </div>
    </div>
  }

  @if (msg()) { <div class="toast">{{ msg() }}</div> }
  `,
  styles: [`
    :host{display:block}
    .head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:16px}
    .head h1{font-size:22px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900)}
    .head p{font-size:13.5px;margin-top:3px}
    .cf-btn .material-icons{font-size:18px}

    /* seat utilization */
    .seats{padding:18px 20px;margin-bottom:16px}
    .ring{position:relative;width:124px;height:124px;flex:none}
    .ring svg{width:124px;height:124px;transform:rotate(-90deg)}
    .ring .rt{fill:none;stroke:color-mix(in srgb,var(--cf-brand-500) 16%,var(--cf-surface-2));stroke-width:11}
    .ring .rp{fill:none;stroke:url(#seatG);stroke-width:11;stroke-linecap:round;transition:stroke-dashoffset .8s cubic-bezier(.3,1,.4,1)}
    .ring-c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
    .rc-v{font-size:26px;font-weight:800;letter-spacing:-.02em;color:var(--cf-ink-900);line-height:1}.rc-v small{font-size:15px;font-weight:700;color:var(--cf-ink-400)}
    .rc-l{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--cf-ink-500);margin-top:4px}
    .seats-main{flex:1;min-width:0;position:relative;z-index:1}
    .seats-top{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:15px}
    .seats-title{display:flex;align-items:center;gap:11px}
    .seats-title h3{font-size:15px;font-weight:800;color:var(--cf-ink-900)}
    .st-ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--cf-brand-50);color:var(--cf-brand-600);flex:none}.st-ic .material-icons{font-size:18px}
    .seats-act{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .sm-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:9px}
    .sm-big{font-size:20px;font-weight:800;letter-spacing:-.01em;color:var(--cf-ink-900)}.sm-big small{font-size:13px;font-weight:600;color:var(--cf-ink-500)}
    .sm-pct{font-size:13px;font-weight:800;color:var(--cf-brand-700)}
    .sm-bar{display:flex;height:12px;border-radius:999px;background:var(--cf-surface-2);border:1px solid var(--cf-line);overflow:hidden}
    .sm-bar span{display:block;height:100%;transition:width .7s cubic-bezier(.3,1,.4,1)}
    .sm-bar .active{background:linear-gradient(90deg,var(--cf-brand-500),var(--cf-brand-700))}
    .sm-bar .pending{background:var(--cf-warning)}
    .seats-legend{margin-top:12px}
    .plan-chip{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;color:var(--cf-brand-700);background:var(--cf-surface);border:1px solid var(--cf-brand-100);padding:6px 12px;border-radius:999px}
    .plan-chip .material-icons{font-size:15px;color:var(--cf-brand-600)}.plan-chip b{font-weight:800}
    .seats-up{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;color:var(--cf-brand-700);text-decoration:none}
    .seats-up .material-icons{font-size:16px;transition:transform .15s}.seats-up:hover .material-icons{transform:translateY(-2px)}
    .seat-strip{display:flex;gap:6px;margin:16px 0 13px}
    .seg{flex:1;min-width:12px;height:26px;border-radius:7px;transition:transform .12s}
    .seg:hover{transform:translateY(-2px)}
    .seg.active{background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));box-shadow:0 4px 10px -4px color-mix(in srgb,var(--cf-brand-600) 65%,transparent)}
    .seg.pending{background:var(--cf-warning-soft);border:1.5px dashed var(--cf-warning)}
    .seg.empty{background:var(--cf-surface-2);border:1.5px solid var(--cf-line)}
    .seats-legend{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12.5px;color:var(--cf-ink-600)}
    .seats-legend b{color:var(--cf-ink-900);font-weight:800}
    .sl{display:inline-flex;align-items:center;gap:6px}
    .sl i{width:10px;height:10px;border-radius:3px;display:inline-block}
    .sl i.active{background:var(--cf-brand-600)}.sl i.pending{background:var(--cf-warning)}.sl i.empty{background:var(--cf-surface-2);border:1px solid var(--cf-line)}
    .dotsep{color:var(--cf-ink-300)}
    @media(max-width:680px){.seats{flex-direction:column;align-items:flex-start;gap:16px}}

    /* toolbar */
    .toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px}
    .search{flex:1;min-width:200px;max-width:340px;display:flex;align-items:center;gap:8px;height:38px;padding:0 12px;border:1px solid var(--cf-line);border-radius:10px;background:var(--cf-surface)}
    .search:focus-within{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .search .material-icons{font-size:18px;color:var(--cf-ink-400)}
    .search input{flex:1;border:0;background:none;outline:none;font:inherit;font-size:13.5px;color:var(--cf-ink-900)}
    .chips{display:inline-flex;gap:4px;padding:4px;background:var(--cf-surface-2);border:1px solid var(--cf-line);border-radius:11px}
    .chips button{display:inline-flex;align-items:center;gap:6px;border:0;background:none;color:var(--cf-ink-600);font:inherit;font-size:12.5px;font-weight:600;padding:6px 12px;border-radius:8px;cursor:pointer}
    .chips button.on{background:var(--cf-surface);color:var(--cf-brand-700);box-shadow:var(--cf-shadow-sm)}
    .chips .c{font-size:10.5px;font-weight:700;color:var(--cf-ink-400);background:var(--cf-surface-2);border-radius:999px;padding:1px 6px}
    .chips button.on .c{background:var(--cf-brand-50);color:var(--cf-brand-700)}

    /* members table */
    .table-wrap{padding:0;overflow:visible}
    table{width:100%;border-collapse:collapse}
    thead th{text-align:start;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--cf-ink-500);font-weight:700;padding:12px 16px;border-bottom:1px solid var(--cf-line);background:var(--cf-surface-2)}
    th.r,td.r{text-align:end}
    tbody td{padding:11px 16px;border-bottom:1px solid var(--cf-line-soft);font-size:13.5px;color:var(--cf-ink-700);vertical-align:middle}
    tbody tr:last-child td{border-bottom:0}
    tbody tr:hover{background:var(--cf-surface-2)}
    .who{display:flex;align-items:center;gap:11px}
    .who-tx{display:flex;flex-direction:column;min-width:0}.who strong{color:var(--cf-ink-900);font-size:13.5px}.who small{font-size:12px}
    .ava{position:relative;width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;display:grid;place-items:center;font-weight:700;font-size:12.5px;flex:none}
    .ava .pres{position:absolute;bottom:-1px;inset-inline-end:-1px;width:11px;height:11px;border-radius:50%;border:2px solid var(--cf-surface);background:var(--cf-ink-300)}
    .ava.s-active .pres{background:#16a34a}.ava.s-invited .pres{background:var(--cf-warning)}.ava.s-suspended .pres{background:var(--cf-ink-400)}
    .role-pill{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--cf-line);border-radius:999px;padding:3px 6px 3px 10px;background:var(--cf-surface)}
    .role-pill .material-icons{font-size:14px}
    .role-pill.rp-admin{border-color:var(--cf-brand-200);background:var(--cf-brand-50)}.role-pill.rp-admin .material-icons{color:var(--cf-brand-600)}
    .role-pill.rp-editor .material-icons{color:#0284c7}
    .role-pill.rp-viewer .material-icons{color:var(--cf-ink-400)}
    .role-pill select{border:0;background:none;outline:none;font:inherit;font-size:12.5px;font-weight:600;color:var(--cf-ink-800);cursor:pointer;min-width:62px}
    .roledd{position:relative;display:inline-block}
    .roledd.block{display:block}
    .rdd-btn.full{display:flex;align-items:center;gap:11px;width:100%;border-radius:11px;padding:9px 11px;font-weight:600}
    .rdd-btn.full .ro-ic{width:34px;height:34px}
    .rdd-lbl{display:flex;flex-direction:column;flex:1;min-width:0;text-align:start}
    .rdd-lbl b{font-size:13.5px;font-weight:700;color:var(--cf-ink-900)}.rdd-lbl small{font-size:11.5px;color:var(--cf-ink-500)}
    .rdd-btn.full .chev{margin-inline-start:auto}
    .rdd-menu.block{inset-inline-start:0;inset-inline-end:0;min-width:0}
    .rdd-btn{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--cf-line);background:var(--cf-surface);border-radius:999px;padding:5px 8px 5px 11px;font:inherit;font-size:12.5px;font-weight:700;color:var(--cf-ink-800);cursor:pointer;transition:border-color .14s,background .14s}
    .rdd-btn:hover{border-color:color-mix(in srgb,var(--cf-brand-500) 35%,var(--cf-line));background:var(--cf-brand-50)}
    .rdd-btn .rico{font-size:15px}
    .rdd-btn.rp-admin .rico{color:var(--cf-brand-600)}.rdd-btn.rp-editor .rico{color:#0284c7}.rdd-btn.rp-viewer .rico{color:var(--cf-ink-400)}
    .rdd-btn .chev{font-size:16px;color:var(--cf-ink-400);transition:transform .18s}
    .roledd.open .rdd-btn{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .roledd.open .rdd-btn .chev{transform:rotate(180deg)}
    .rdd-menu{position:absolute;top:calc(100% + 6px);inset-inline-start:0;z-index:40;min-width:230px;max-height:288px;overflow-y:auto;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:13px;box-shadow:0 22px 48px -18px rgba(2,6,23,.42);padding:6px;animation:rddIn .15s ease;scrollbar-width:thin}
    @keyframes rddIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
    .rdd-opt{display:flex;align-items:center;gap:11px;width:100%;border:0;background:none;padding:8px 9px;border-radius:10px;cursor:pointer;text-align:start;transition:background .12s}
    .rdd-opt:hover{background:var(--cf-surface-2)}
    .rdd-opt.on{background:var(--cf-brand-50)}
    .ro-ic{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;flex:none;background:var(--cf-surface-2)}.ro-ic .material-icons{font-size:17px}
    .ro-ic.rp-admin{background:var(--cf-brand-50);color:var(--cf-brand-600)}.ro-ic.rp-editor{background:color-mix(in srgb,#0ea5e9 14%,transparent);color:#0284c7}.ro-ic.rp-viewer{background:var(--cf-surface-2);color:var(--cf-ink-500)}
    .ro-tx{display:flex;flex-direction:column;flex:1;min-width:0}.ro-tx b{font-size:13px;font-weight:700;color:var(--cf-ink-900)}.ro-tx small{font-size:11px;color:var(--cf-ink-500)}
    .ro-check{font-size:18px;color:var(--cf-brand-600);flex:none}
    .badge{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;padding:4px 11px;border-radius:999px}
    .badge .bdot{width:6px;height:6px;border-radius:50%;background:currentColor}
    .badge.active{background:#dcfce7;color:#15803d}.badge.invited{background:var(--cf-brand-50);color:var(--cf-brand-700)}.badge.susp{background:#fef3c7;color:#b45309}
    .actbar{display:inline-flex;gap:5px}
    .ic{width:32px;height:32px;border-radius:8px;border:1px solid var(--cf-line);background:var(--cf-surface);color:var(--cf-ink-500);display:inline-grid;place-items:center;cursor:pointer;transition:.14s}
    .ic:hover{background:var(--cf-surface-2);color:var(--cf-ink-900);border-color:color-mix(in srgb,var(--cf-brand-500) 30%,var(--cf-line))}
    .ic.danger:hover{background:var(--cf-danger-soft);color:var(--cf-danger);border-color:transparent}
    .ic .material-icons{font-size:17px}

    .state{max-width:420px;margin:7vh auto;text-align:center;color:var(--cf-ink-600)}
    .st-badge{width:60px;height:60px;border-radius:17px;display:grid;place-items:center;margin:0 auto 8px;background:var(--cf-surface-2);color:var(--cf-ink-400)}.st-badge .material-icons{font-size:28px}
    .state h3{margin:6px 0 4px;color:var(--cf-ink-900);font-size:16px}

    .overlay{position:fixed;inset:0;background:rgba(2,6,23,.5);display:grid;place-items:center;z-index:60;padding:20px}
    .modal{position:relative;width:100%;max-width:420px;background:var(--cf-surface);border:1px solid var(--cf-line);border-radius:18px;box-shadow:var(--cf-shadow-lg);padding:22px;animation:mIn .2s ease}
    @keyframes mIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
    .m-hero{text-align:center;margin-bottom:16px}
    .m-seal{width:50px;height:50px;border-radius:14px;display:grid;place-items:center;margin:0 auto 10px;background:linear-gradient(135deg,var(--cf-brand-500),var(--cf-brand-700));color:#fff;box-shadow:0 12px 26px -12px color-mix(in srgb,var(--cf-brand-600) 80%,transparent)}.m-seal .material-icons{font-size:24px}
    .m-hero h3{font-size:17px;font-weight:800;color:var(--cf-ink-900)}.m-hero p{font-size:12.5px;margin-top:4px}
    .close{position:absolute;top:12px;inset-inline-end:12px;border:0;background:none;color:var(--cf-ink-400);cursor:pointer}
    .fld{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:600;color:var(--cf-ink-600);margin-bottom:13px}
    .fld input,.fld select{height:40px;border:1px solid var(--cf-line);border-radius:10px;padding:0 11px;font:inherit;font-size:14px;background:var(--cf-surface);color:var(--cf-ink-900);outline:none}
    .fld input:focus,.fld select:focus{border-color:var(--cf-brand-500);box-shadow:var(--cf-ring)}
    .modal.invite{max-width:440px}
    .fld-l{font-size:12.5px;font-weight:600;color:var(--cf-ink-600);margin-bottom:7px;display:block}
    .role-picker{display:flex;flex-direction:column;gap:8px;max-height:248px;overflow-y:auto;padding-inline-end:3px;scrollbar-width:thin}
    .role-picker::-webkit-scrollbar{width:8px}.role-picker::-webkit-scrollbar-thumb{background:var(--cf-line);border-radius:999px;border:2px solid var(--cf-surface)}
    .rp-opt{display:flex;align-items:center;gap:11px;width:100%;border:1px solid var(--cf-line);background:var(--cf-surface);border-radius:11px;padding:10px 12px;cursor:pointer;text-align:start;transition:border-color .14s,background .14s,box-shadow .14s}
    .rp-opt:hover{border-color:color-mix(in srgb,var(--cf-brand-500) 35%,var(--cf-line))}
    .rp-opt.on{border-color:var(--cf-brand-500);background:var(--cf-brand-50);box-shadow:var(--cf-ring)}
    .rp-ic{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex:none}.rp-ic .material-icons{font-size:18px}
    .rp-ic.rp-admin{background:var(--cf-brand-50);color:var(--cf-brand-600)}
    .rp-ic.rp-editor{background:color-mix(in srgb,#0ea5e9 14%,transparent);color:#0284c7}
    .rp-ic.rp-viewer{background:var(--cf-surface-2);color:var(--cf-ink-500)}
    .rp-tx{display:flex;flex-direction:column;flex:1;min-width:0}.rp-tx b{font-size:13.5px;font-weight:700;color:var(--cf-ink-900)}.rp-tx small{font-size:11.5px;color:var(--cf-ink-500)}
    .rp-check{font-size:20px;color:var(--cf-ink-300);flex:none;transition:color .14s}
    .rp-opt.on .rp-check{color:var(--cf-brand-600)}
    .m-seatinfo{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--cf-ink-600);margin:14px 0 12px;padding:9px 12px;background:var(--cf-surface-2);border-radius:10px}
    .m-seatinfo .material-icons{font-size:16px;color:var(--cf-ink-400)}.m-seatinfo b{color:var(--cf-ink-900);font-weight:800}
    .seat-warn{display:flex;align-items:center;gap:7px;font-size:12.5px;color:#b45309;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:9px 11px;margin-bottom:6px}.seat-warn .material-icons{font-size:16px}.seat-warn a{color:var(--cf-brand-700);font-weight:700}
    .modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:12px}
    .toast{position:fixed;bottom:22px;inset-inline-end:22px;background:var(--cf-ink-900);color:#fff;padding:11px 16px;border-radius:var(--cf-radius-md);box-shadow:var(--cf-shadow-lg);font-size:13.5px;z-index:80}
  `],
})
export class UsersPage {
  readonly A = Actions;
  private alerts = inject(AlertService);
  readonly plan = inject(PlanService);
  roles = ['Admin', 'Editor', 'Viewer'];
  search = '';
  roleFilter = signal<string>('all');
  msg = signal('');
  readonly ringC = 2 * Math.PI * 46;

  inviteOpen = signal(false);
  inviteRoleOpen = signal(false);
  toggleInviteRole(e: Event): void { e.stopPropagation(); this.inviteRoleOpen.update((v) => !v); }
  inviteEmail = '';
  inviteRole = 'Editor';

  private seq = 100;
  users = signal<AppUser[]>([
    { id: 1, name: 'Mostafa Mahmoud', email: 'mostafa.ibrahim@binghatti.com', role: 'Admin', status: 'Active', lastActive: '2026-06-14' },
    { id: 2, name: 'Lina Saeed', email: 'lina.s@example.com', role: 'Editor', status: 'Active', lastActive: '2026-06-13' },
    { id: 3, name: 'Nour Tarek', email: 'nour.t@example.com', role: 'Viewer', status: 'Active', lastActive: '2026-06-11' },
  ]);

  // ---- seat utilization ----
  seatLimit = computed(() => this.plan.current().limits.team);
  allocated = computed(() => this.users().length);
  activeCount = computed(() => this.users().filter((u) => u.status === 'Active').length);
  pendingCount = computed(() => this.users().filter((u) => u.status === 'Invited').length);
  available = computed(() => { const l = this.seatLimit(); return isFinite(l) ? Math.max(0, l - this.allocated()) : Infinity; });
  seatPct = computed(() => { const l = this.seatLimit(); return !isFinite(l) || l <= 0 ? 0 : Math.min(100, Math.round((this.allocated() / l) * 100)); });
  ringOffset = computed(() => this.ringC * (1 - this.seatPct() / 100));
  seatLimitLabel = computed(() => { const l = this.seatLimit(); return isFinite(l) ? String(l) : '∞'; });
  availableLabel = computed(() => { const a = this.available(); return isFinite(a) ? String(a) : '∞'; });
  seatsLeft = computed(() => { const l = this.seatLimit(); return !isFinite(l) || this.allocated() < l; });
  seatDots = computed(() => {
    const l = this.seatLimit(); const lim = isFinite(l) ? l : Math.max(this.allocated() + 2, 12);
    const a = this.activeCount(), p = this.pendingCount();
    return Array.from({ length: lim }, (_, i) => (i < a ? 'active' : i < a + p ? 'pending' : 'empty'));
  });

  filtered = computed(() => {
    const q = this.search.trim().toLowerCase(); const rf = this.roleFilter();
    return this.users().filter((u) => (rf === 'all' || u.role === rf) && (!q || (u.name + ' ' + u.email).toLowerCase().includes(q)));
  });
  countRole(r: string): number { return this.users().filter((u) => u.role === r).length; }

  initials(n: string): string { return n.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(); }
  roleIcon(r: string): string { return r === 'Admin' ? 'shield' : r === 'Editor' ? 'edit' : r === 'Viewer' ? 'visibility' : 'badge'; }

  roleMenu = signal<number | null>(null);
  @HostListener('document:click') closeRoleMenu(): void { if (this.roleMenu() !== null) this.roleMenu.set(null); }
  toggleRoleMenu(id: number, e: Event): void { e.stopPropagation(); this.roleMenu.update((v) => (v === id ? null : id)); }
  roleDesc(r: string): string { return r === 'Admin' ? 'Full access & billing' : r === 'Editor' ? 'Create & issue credentials' : r === 'Viewer' ? 'Read-only access' : 'Custom role permissions'; }
  pctOf(n: number): number { const l = this.seatLimit(); return !isFinite(l) || l <= 0 ? 0 : Math.min(100, (n / l) * 100); }
  setRole(u: AppUser, role: string): void { this.users.update((l) => l.map((x) => (x.id === u.id ? { ...x, role } : x))); }
  toggle(u: AppUser): void { const status: UStatus = u.status === 'Active' ? 'Suspended' : 'Active'; this.users.update((l) => l.map((x) => (x.id === u.id ? { ...x, status } : x))); }
  async remove(u: AppUser): Promise<void> {
    const ok = await this.alerts.confirm({ title: 'Remove member', message: 'Remove ' + u.name + ' from the workspace? Their seat will be freed.', danger: true, confirmText: 'Remove' });
    if (!ok) return;
    this.users.update((l) => l.filter((x) => x.id !== u.id));
    this.alerts.success(u.name + ' removed — seat freed.');
  }

  openInvite(): void { this.inviteEmail = ''; this.inviteRole = 'Editor'; this.inviteRoleOpen.set(false); this.inviteOpen.set(true); }
  sendInvite(): void {
    const email = this.inviteEmail.trim(); if (!email) return;
    if (!this.seatsLeft()) { this.alerts.warning('All ' + this.seatLimitLabel() + ' seats are in use. Upgrade your plan to invite more members.', { title: 'Seat limit reached' }); return; }
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    this.users.update((l) => [...l, { id: ++this.seq, name, email, role: this.inviteRole, status: 'Invited', lastActive: null }]);
    this.inviteOpen.set(false);
    this.flash('Invitation sent to ' + email);
  }
  flash(text: string): void { this.alerts.success(text); }
}

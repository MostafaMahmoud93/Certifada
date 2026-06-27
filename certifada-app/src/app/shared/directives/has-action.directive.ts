import {
  Directive, ElementRef, Input, OnInit, Renderer2, TemplateRef, ViewContainerRef, effect, inject,
} from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { PlanService, FeatureKey } from '../../core/services/plan.service';
import { UpgradeService } from '../../core/services/upgrade.service';

type ActionInput = string | string[] | null | undefined;
const toList = (a: ActionInput): string[] => (Array.isArray(a) ? a : [a]).filter((x): x is string => !!x);

/**
 * Permission GATE — disable mode. The element stays visible, but when the user's
 * role/token does not include the required action(s) it is dimmed, made
 * non-interactive (clicks, double-clicks, key and touch events are blocked in the
 * capture phase so child handlers never fire) and shows a lock tooltip.
 *
 *   <button [appHasAction]="actions.Template_Edit"
 *           [tooltipMessage]="'🔒 You cannot edit templates.'">Edit</button>
 *
 * Accepts a single action or an array (allowed if ANY matches). Reactive — it
 * re-evaluates automatically whenever the signed-in user (token) changes.
 */
@Directive({ selector: '[appHasAction]', standalone: true })
export class HasActionDirective implements OnInit {
  @Input('appHasAction') requiredAction: ActionInput = '';
  @Input() tooltipMessage = '🔒 You do not have permission to use this.';

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private renderer = inject(Renderer2);
  private perm = inject(PermissionService);
  private auth = inject(AuthService);
  private locked = false;
  private bound = false;

  constructor() {
    effect(() => { this.auth.token(); this.apply(); });   // re-gate when the user changes
  }
  ngOnInit(): void { this.bindOnce(); this.apply(); }

  private allowed(): boolean {
    const list = toList(this.requiredAction);
    return list.length === 0 ? true : this.perm.hasAny(list);
  }

  private bindOnce(): void {
    if (this.bound) return;
    this.bound = true;
    const el = this.el.nativeElement;
    const block = (e: Event): void => {
      if (!this.locked) return;
      e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
    };
    // Capture phase = intercept before the element's own (click) handler runs.
    ['click', 'mousedown', 'mouseup', 'dblclick', 'keydown', 'touchstart'].forEach((evt) =>
      el.addEventListener(evt, block, true),
    );
  }

  private apply(): void {
    this.locked = !this.allowed();
    const el = this.el.nativeElement;
    if (this.locked) {
      this.renderer.addClass(el, 'cf-locked');
      this.renderer.setAttribute(el, 'aria-disabled', 'true');
      this.renderer.setAttribute(el, 'tabindex', '-1');
      this.renderer.setAttribute(el, 'data-locktip', this.tooltipMessage);
    } else {
      this.renderer.removeClass(el, 'cf-locked');
      this.renderer.removeAttribute(el, 'aria-disabled');
      this.renderer.removeAttribute(el, 'tabindex');
      this.renderer.removeAttribute(el, 'data-locktip');
    }
  }
}

/**
 * Permission GATE — hide/show mode (structural). Removes the element from the DOM
 * entirely when the user's role lacks the action(s); renders it when allowed.
 *
 *   <button *appCanAction="actions.User_Invite">Invite</button>
 *   <a *appCanAction="[actions.Role_Manage, actions.Role_View]">Roles</a>
 *
 * Accepts a single action or an array (shown if ANY matches).
 */
@Directive({ selector: '[appCanAction]', standalone: true })
export class CanActionDirective {
  private tpl = inject<TemplateRef<unknown>>(TemplateRef);
  private vcr = inject(ViewContainerRef);
  private perm = inject(PermissionService);
  private auth = inject(AuthService);
  private shown = false;
  private action: ActionInput = '';

  @Input() set appCanAction(a: ActionInput) { this.action = a; this.update(); }

  constructor() {
    effect(() => { this.auth.token(); this.update(); });   // re-evaluate when the user changes
  }

  private update(): void {
    const list = toList(this.action);
    const ok = list.length === 0 ? true : this.perm.hasAny(list);
    if (ok && !this.shown) { this.vcr.createEmbeddedView(this.tpl); this.shown = true; }
    else if (!ok && this.shown) { this.vcr.clear(); this.shown = false; }
  }
}


/**
 * Plan GATE — disable mode for subscription features. When the current plan does
 * not unlock the feature, the host is dimmed, shows a gold premium crown, and any
 * interaction opens the "Upgrade to unlock" dialog instead of the host action.
 *
 *   <button [appPlanFeature]="'table'">Table tool</button>
 */
@Directive({ selector: '[appPlanFeature]', standalone: true })
export class PlanFeatureDirective implements OnInit {
  @Input('appPlanFeature') feature!: FeatureKey;

  private el = inject<ElementRef<HTMLElement>>(ElementRef);
  private renderer = inject(Renderer2);
  private plan = inject(PlanService);
  private up = inject(UpgradeService);
  private locked = false;
  private bound = false;
  private crown?: HTMLElement;

  constructor() { effect(() => { this.plan.plan(); this.apply(); }); }
  ngOnInit(): void { this.bindOnce(); this.apply(); }

  private bindOnce(): void {
    if (this.bound) return; this.bound = true;
    const el = this.el.nativeElement;
    const block = (e: Event): void => {
      if (!this.locked) return;
      e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
      this.up.open(this.feature);
    };
    ['click', 'mousedown', 'mouseup', 'dblclick', 'keydown'].forEach((ev) => el.addEventListener(ev, block, true));
  }

  private apply(): void {
    this.locked = !!this.feature && !this.plan.can(this.feature);
    const el = this.el.nativeElement;
    if (this.locked) {
      this.renderer.addClass(el, 'cf-plan-locked');
      if (!this.crown) {
        const c = this.renderer.createElement('span');
        this.renderer.addClass(c, 'cf-crown');
        const i = this.renderer.createElement('span');
        this.renderer.addClass(i, 'material-icons');
        this.renderer.appendChild(i, this.renderer.createText('workspace_premium'));
        this.renderer.appendChild(c, i);
        this.renderer.appendChild(el, c);
        this.crown = c;
      }
    } else {
      this.renderer.removeClass(el, 'cf-plan-locked');
      if (this.crown) { this.renderer.removeChild(el, this.crown); this.crown = undefined; }
    }
  }
}

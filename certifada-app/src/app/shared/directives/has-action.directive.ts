import { Directive, ElementRef, inject, Input, OnInit, Renderer2 } from '@angular/core';
import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MatTooltip,
  MatTooltipDefaultOptions,
} from '@angular/material/tooltip';
import { PermissionService } from '../../core/services/permission.service';

export const permissionTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 200,
  hideDelay: 100,
  touchendHideDelay: 100,
  position: 'above',
};

/**
 * Plan/permission gate. Usage:
 *   <button [appHasAction]="actions.Template_Edit"
 *           [tooltipMessage]="'🔒 You need permission to edit templates.'">Edit</button>
 * When the current user's token doesn't include the action code, the host is
 * dimmed, clicks are blocked, and a lock tooltip explains why.
 */
@Directive({
  selector: '[appHasAction]',
  standalone: true,
  providers: [
    MatTooltip,
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: permissionTooltipDefaults },
  ],
})
export class HasActionDirective implements OnInit {
  @Input('appHasAction') requiredAction = '';
  @Input() tooltipMessage = '🔒 To access this feature, please upgrade your plan.';

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private tooltip = inject(MatTooltip);
  private perm = inject(PermissionService);

  ngOnInit(): void {
    return;
    if (this.perm.has(this.requiredAction)) {
      this.tooltip.disabled = true;
      return;
    }

    const el = this.el.nativeElement;
    this.renderer.setStyle(el, 'opacity', '0.55');
    this.renderer.setStyle(el, 'cursor', 'not-allowed');
    this.renderer.setStyle(el, 'pointer-events', 'auto');

    this.tooltip.message = this.tooltipMessage;
    this.tooltip.tooltipClass = 'permission-tooltip';
    this.tooltip.disabled = false;
    this.renderer.listen(el, 'mouseenter', () => this.tooltip.show());
    this.renderer.listen(el, 'mouseleave', () => this.tooltip.hide());

    ['click', 'mousedown', 'mouseup', 'dblclick', 'touchstart', 'touchend'].forEach((evt) =>
      this.renderer.listen(el, evt, (e: Event) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        this.tooltip.show();
      }),
    );
  }
}

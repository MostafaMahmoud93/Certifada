import { Directive, ElementRef, inject, Input, OnInit, Renderer2 } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltip, MatTooltipDefaultOptions } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { UpgradePlan } from '../components/upgrade-plan/upgrade-plan';
export const permissionTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 200,
  hideDelay: 100,
  touchendHideDelay: 100,
  position: 'above',
};
@Directive({
  selector: '[appHasAction]',
    providers: [
    MatTooltip,
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: permissionTooltipDefaults },
  ],
})
export class HasAction implements OnInit {
  @Input('appHasAction') requiredAction!: string;
  @Input() tooltipMessage: string =
    '🔒 To access this feature, please upgrade your plan.';

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private tooltip = inject(MatTooltip);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  private hasPermission = false;

  ngOnInit(): void {
    const userActions = this.authService.userActions || [];
    this.hasPermission = userActions.some(
      (a) => a.toLowerCase() === this.requiredAction?.toLowerCase()
    );

    if (!this.hasPermission) {
      this.applyDisabledStyle();
      this.configureTooltip();
      this.blockClickEvents();
    } else {
      this.tooltip.disabled = true;
    }
  }

  private applyDisabledStyle(): void {
    const element = this.el.nativeElement;
    this.renderer.setStyle(element, 'opacity', '0.6');
    this.renderer.setStyle(element, 'cursor', 'not-allowed');
    this.renderer.setStyle(element, 'user-select', 'none');
    this.renderer.setStyle(element, 'pointer-events', 'auto'); // keep hover
  }

  private configureTooltip(): void {
    const element = this.el.nativeElement;
    this.tooltip.message = this.tooltipMessage;
    this.tooltip.tooltipClass = 'permission-tooltip';
    this.tooltip.disabled = false;

    this.renderer.listen(element, 'mouseenter', () => this.tooltip.show());
    this.renderer.listen(element, 'mouseleave', () => this.tooltip.hide());
  }

  private blockClickEvents(): void {
    const element = this.el.nativeElement;

    // ✅ Capture and block all click-related events
    ['click', 'mousedown', 'mouseup', 'dblclick', 'touchstart', 'touchend'].forEach(
      (evt) => {
        this.renderer.listen(element, evt, (e: Event) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          e.stopPropagation();
          this.showUpgradeDialog();
        });
      }
    );
  }

  private showUpgradeDialog(): void {
    this.dialog.open(UpgradePlan, {
      width: '380px',
      panelClass: 'upgrade-plan-dialog-panel',
    });
  }
}

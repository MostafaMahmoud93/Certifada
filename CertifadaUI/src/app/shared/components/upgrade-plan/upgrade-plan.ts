import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-upgrade-plan',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './upgrade-plan.html',
  styleUrl: './upgrade-plan.scss'
})
export class UpgradePlan {
  openUpgradePage() {
    // Navigate to upgrade page (customize as needed)
    window.open('/pricing', '_blank');
  }
}

import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.html',
  imports: [MatProgressSpinnerModule],
  styles: [`
    mat-progress-spinner {
      margin: auto;
    }
  `]
})
export class LoadingComponent {
    constructor() { }
}
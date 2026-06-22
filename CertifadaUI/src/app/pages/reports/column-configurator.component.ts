// column-configurator.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-column-configurator',
  templateUrl: './column-configurator.component.html',
  styleUrls: ['./column-configurator.component.css'],
  standalone: false
})
export class ColumnConfiguratorComponent {
  @Input() columns!: any[];
  @Input() saveLayout!: Function;

  togglePin(column: any) {
    column.isPinned = !column.isPinned;
  }
}

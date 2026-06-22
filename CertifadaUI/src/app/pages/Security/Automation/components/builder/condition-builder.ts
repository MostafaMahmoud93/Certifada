import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AutomationCondition } from '../../automation.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-condition-builder',
  templateUrl: './condition-builder.html',
  imports: [CommonModule, FormsModule],
})
export class ConditionBuilderComponent {
  @Input() conditions: AutomationCondition[] = [];
  @Output() conditionsChange = new EventEmitter<AutomationCondition[]>();

  addCondition(): void {
    this.conditions.push({ field: '', operator: '==', value: '' });
    this.conditionsChange.emit(this.conditions);
  }

  removeCondition(index: number): void {
    this.conditions.splice(index, 1);
    this.conditionsChange.emit(this.conditions);
  }
}

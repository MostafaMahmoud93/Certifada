import { Injectable } from '@angular/core';
import { Automation } from './automation.model';

@Injectable({ providedIn: 'root' })
export class AutomationService {
  private automations: Automation[] = [
    {
      id: 1,
      name: 'Notify on new template',
      process: 'Templates',
      trigger: 'Template Created',
      action: 'Send Notification',
      conditions: [],
      enabled: true,
      fireOnAnyCondition: true,
    },
  ];

  getAll(): Automation[] {
    return this.automations;
  }

  getByProcess(process: string): Automation[] {
    return this.automations.filter(a => a.process === process);
  }

  save(automation: Automation): void {
    const index = this.automations.findIndex(a => a.id === automation.id);
    if (index > -1) {
      this.automations[index] = automation;
    } else {
      automation.id = Date.now();
      this.automations.push(automation);
    }
  }
}

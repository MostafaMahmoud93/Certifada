import { Component, OnInit } from '@angular/core';
import { Automation } from './automation.model';
import { AutomationService } from './automation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConditionBuilderComponent } from './components/builder/condition-builder';
import { EmailTemplateEditor } from '../../email-templates/email-template-editor';

@Component({
  selector: 'app-automation',
  templateUrl: './automation.component.html',
standalone: false,
})

export class AutomationComponent implements OnInit {
  tabs = ['Templates', 'Credentials', 'Portal'];
  selectedTab = 'Templates';
  automations: Automation[] = [];
  selectedAutomation: Automation | null = null;

  testResults: { passed: boolean; reason: string }[] = [];
  finalTestResult: boolean | null = null;

  mockData: { [key: string]: string | number | boolean } = {
    role: 'Admin',
    branch: 'Main',
    templateType: 'Certificate',
    userStatus: 'Active',
    issuedCount: 5
  };

  constructor(private automationService: AutomationService) {}

  ngOnInit(): void {
    this.loadAutomations();
  }

  loadAutomations(): void {
    this.automations = this.automationService.getByProcess(this.selectedTab);
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
    this.loadAutomations();
  }

openAutomation(automation?: Automation): void {
  this.selectedAutomation = {
  id: automation?.id ?? 0,
  name: automation?.name ?? '',
  process: automation?.process ?? this.selectedTab,
  trigger: automation?.trigger ?? '',
  action: automation?.action ?? '',
  conditions: automation?.conditions ?? [],
  enabled: automation?.enabled ?? true,
  fireOnAnyCondition: automation?.fireOnAnyCondition ?? true,
  emailTemplate: automation?.emailTemplate ?? {
    subject: '',
    body: ''
  }
};
}

  closeSlide(): void {
    this.selectedAutomation = null;
  }

  saveAutomation(): void {
    if (this.selectedAutomation) {
      this.automationService.save(this.selectedAutomation);
      this.loadAutomations();
      this.closeSlide();
    }
  }

  runTest(): void {
  this.testResults = [];
  this.finalTestResult = null;

  if (!this.selectedAutomation) return;

  const results = this.selectedAutomation.conditions.map(cond => {
    const actual = this.mockData[cond.field];
    const expected = cond.value;
    let passed = false;

    switch (cond.operator) {
      case '==':
        passed = actual == expected;
        break;
      case '!=':
        passed = actual != expected;
        break;
      case '>':
        passed = Number(actual) > Number(expected);
        break;
      case '<':
        passed = Number(actual) < Number(expected);
        break;
      default:
        passed = false;
    }

    return {
      passed,
      reason: `${cond.field} (${actual}) ${cond.operator} ${expected} → ${passed ? 'Passed' : 'Failed'}`
    };
  });

  this.testResults = results;
  const hasPasses = results.some(r => r.passed);
  const allPass = results.every(r => r.passed);

  this.finalTestResult = this.selectedAutomation.fireOnAnyCondition ? hasPasses : allPass;
}
  

}

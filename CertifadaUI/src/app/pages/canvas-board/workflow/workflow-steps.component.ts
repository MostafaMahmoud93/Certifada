import { CdkDragDrop,moveItemInArray  } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';

@Component({
  selector: 'app-workflow-steps',
  templateUrl: './workflow-steps.component.html',
  styleUrls: ['./workflow-steps.component.css'],
  standalone: false,
})
export class WorkflowStepsComponent {
  workflowName: string = '';

  
  saveAsTemplate: boolean = false;
  templateName: string = '';
  publishCertificate: boolean = false;
  savedTemplates: any[] = [];
  selectedTemplate: string = '';

  // Sample data for users and actions
  users: string[] = ['User 1', 'User 2', 'User 3']; 
  actions: string[] = ['Approve (Sign)','Return (To Originator)','Decline (Remove)'];




  steps: any[] = [];

  ngOnInit() {
     this.steps = [this.createNewStep()];
    this.loadTemplates();
  }

  loadTemplates() {
      const raw = localStorage.getItem('workflowTemplates');
      this.savedTemplates = raw ? JSON.parse(raw) : [];
    }

 onTemplateSelect() {
    const template = this.savedTemplates.find(t => t.name === this.selectedTemplate);
    if (template) {
      this.workflowName = template.name;
      this.steps = template.steps.map((step: any) => ({
        ...this.createNewStep(),
        ...step
      }));
      this.saveAsTemplate = true;
      this.templateName = template.name;
      this.publishCertificate = template.publishCertificate;
    } else {
      this.workflowName = '';
      this.steps = [this.createNewStep()];
      this.saveAsTemplate = false;
      this.templateName = '';
      this.publishCertificate = false;
    }
  }

 createNewStep(): any {
    return {
      name: '',
      user: '',
      actions: [],
      actionInput: '',
      filteredActions: []
    };
 }

  addStep() {
    this.steps.push(this.createNewStep());
  }

  removeStep(index: number) {
    if (this.steps.length > 1) {
      this.steps.splice(index, 1);
    }
  }

 getAvailableActions(step: any): string[] {
    return this.actions.filter(a => !step.actions.includes(a));
 }

addAction(step: any, action: string) {
  if (!action || step.actions.includes(action)) return;

  if (step.actions.length >= 2) {
    alert('Only 2 actions can be selected per step.');
    return;
  }

  step.actions.push(action);
  step.filteredActions = [];
  step.actionInput = '';
}

  removeAction(step: any, action: string) {
    step.actions = step.actions.filter((a: string) => a !== action);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.steps, event.previousIndex, event.currentIndex);
  }

  // Validate for duplicate user
  userHasDuplicate(user: string, currentIndex: number): boolean {
    if (!user) return false;
    return this.steps.some((step, index) => index !== currentIndex && step.user === user);
  }

  updateFilteredActions(step: any) {
  const input = step.actionInput?.toLowerCase() || '';
  step.filteredActions = this.getAvailableActions(step).filter(action =>
    action.toLowerCase().includes(input)
  );
}

  saveWorkflow() {
    const hasDuplicates = this.steps.some((step, index) =>
      this.userHasDuplicate(step.user, index)
    );

    if (hasDuplicates) {
      alert('Each user must only be assigned to one step.');
      return;
    }

    if (!this.workflowName.trim()) {
      alert('Workflow name is required.');
      return;
    }

    if (this.saveAsTemplate && !this.templateName.trim()) {
      alert('Please enter a name for the template.');
      return;
    }

    const workflowData = {
      name: this.workflowName,
      steps: this.steps.map(step => ({
        name: step.name,
        user: step.user,
        actions: step.actions
      })),
      publishCertificate: this.publishCertificate
    };

    if (this.saveAsTemplate) {
      const templateData = {
        name: this.templateName.trim(),
        steps: this.steps.map(step => ({
          name: step.name,
          user: step.user,
          actions: step.actions
        })),
        publishCertificate: this.publishCertificate
      };

      const existing = this.savedTemplates.find(t => t.name === this.templateName.trim());
      if (existing) {
        Object.assign(existing, templateData);
      } else {
        this.savedTemplates.push(templateData);
      }

      localStorage.setItem('workflowTemplates', JSON.stringify(this.savedTemplates));
      alert('Template saved.');
    }

    console.log('Workflow saved:', workflowData);
  }


}

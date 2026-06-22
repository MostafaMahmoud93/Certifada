import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-roles',
  templateUrl: './roles.html',
standalone: false,
})
export class Roles {

  constructor( private toast: ToastService,) {}
  roles = [
    { id: 1, name: 'Admin', description: 'Full access to all settings and data.' },
    { id: 2, name: 'Desginer', description: 'Create and manage Certifcates Tempalates.' },
    { id: 3, name: 'Approver', description: 'Approve Certifcates Cerdintials.' },
    { id: 4, name: 'Viewer', description: 'Read-only access to content.' }

  ];
 rolePermissions: { [roleName: string]: string[] } = {
  Admin: ['Users.Create', 'Users.Delete', 'Dashboard.View'],
  Desginer: ['Users.Create', 'Dashboard.View'],
  Viewer: ['Dashboard.View'],
  Approver: ['Dashboard.View', 'Certificate.Sign', 'Certificate.View'],
  
};

  contextMenuRoleId: number | null = null;
  isPanelOpen = false;
  user = {
    name: '',
    email: '',
    role: '',
    branch: ''
  };

branches = [
  { id: 'branch1', name: 'Sharjah' },
  { id: 'branch2', name: 'Dubai' },
  { id: 'branch3', name: 'Abu Dhabi' }
];
selectedBranches: { id: string; name: string }[] = [];
showBranchDropdown = false;


showComparison = false;
rolesToCompare: any[] = [];
showSlide = false;
newRole = {id: Date.now(), name: '', description: '' };
editedPermissions = new Set<string>();
isEditMode = false;

// Example action list
allActions: string[] = [
  'Users.Create',
  'Users.Delete',
  'Users.View',
  'Dashboard.View',
  'Reports.Access',
];

editingRole: any = null;

openPanel(preselectedRole?: string) {
  this.user = {
    name: '',
    email: '',
    role: preselectedRole || '',
    branch: 'branch1'
  };
  this.isPanelOpen = true;
}

@HostListener('document:click')
closeContextMenu() {
  this.contextMenuRoleId = null;

}

getSidenavMode(): 'over' | 'side' {
  return window.innerWidth < 768 ? 'over' : 'side';
}

closePanel() {
  this.isPanelOpen = false;
}

assignUser() {
  this.closePanel();
}

addUserToRole(role: any) {
  if(this.showSlide || this.isEditMode || this.isPanelOpen){this.isPanelOpen = false;this.showSlide = false;this.isEditMode=false;return;}
  this.openPanel(role.name); 
}

openNewRolePanel() {
  this.isPanelOpen = true;
}

ContextMenuOp(role: any){
  this.toggleContextMenu(role.id);
}
toggleContextMenu(roleId: number) {
  this.contextMenuRoleId = this.contextMenuRoleId === roleId ? null : roleId;
}

openRoleComparison() {
  this.isPanelOpen = false;this.showSlide = false;this.isEditMode=false;

  this.rolesToCompare = this.roles; // All or filtered
  this.allActions = this.getAllActions();
  this.showComparison = true;
}

closeComparison() {
  this.showComparison = false;
}

// Matrix cell check
hasPermission(role: any, action: string): boolean {
  return this.rolePermissions[role.name]?.includes(action);
}

// Actions extraction
getAllActions(): string[] {
  const set = new Set<string>();
  Object.values(this.rolePermissions).forEach((actions) =>
    actions.forEach((a) => set.add(a))
  );
  return Array.from(set);
}

// Open permission editor
openPermissionEditor(role: any) {
  this.editingRole = role;
  this.editedPermissions = new Set(this.rolePermissions[role.name] || []);
}

// Save permission changes
savePermissions() {
  this.rolePermissions[this.editingRole.name] = Array.from(this.editedPermissions);
  this.closePermissionEditor();
  this.toast.success('Permissions updated successfully.');
}

// Close permission panel
closePermissionEditor() {
  this.editingRole = null;
  this.editedPermissions.clear();
}

openAddRolePanel() {
  if(this.isPanelOpen || this.isEditMode){this.isPanelOpen = false;this.showSlide = false;this.isEditMode=false;return;}

  this.isEditMode = false;
  this.showSlide = true;
  this.isPanelOpen = true;
  this.newRole = {id: Date.now(), name: '', description: '' };
  this.editedPermissions.clear();
}

openEditRolePanel(role: any) {
    if(this.isPanelOpen || this.isEditMode){this.isPanelOpen = false;this.showSlide = false;this.isEditMode=false;return;}

  this.isEditMode = true;
  this.newRole = { ...role };
  this.editedPermissions = new Set(this.rolePermissions[role.name] || []);
  this.showSlide = true;
  this.isPanelOpen = true;
}

togglePermission(action: string) {
  if (this.editedPermissions.has(action)) {
    this.editedPermissions.delete(action);
  } else {
    this.editedPermissions.add(action);
  }
}

saveRole() {
  const roleData = {
    ...this.newRole,
    permissions: Array.from(this.editedPermissions),
  };

  if (this.isEditMode) {
    // Update existing role permissions only
    this.rolePermissions[roleData.name] = roleData.permissions;
  } else {
    // Create new
    roleData.id = Date.now();
    this.roles.push(roleData);
    this.rolePermissions[roleData.name] = roleData.permissions;
  }

  this.closeSlide();
  this.toast.success('Role saved successfully.');
}

closeSlide() {
  this.showSlide = false;
  this.isEditMode = false;
  this.newRole = {id: Date.now(), name: '', description: '' };
  this.editedPermissions.clear();
}

toggleBranchDropdown() {
  this.showBranchDropdown = !this.showBranchDropdown;
}

isBranchSelected(branch: { id: string }): boolean {
  return this.selectedBranches.some(b => b.id === branch.id);
}

toggleBranchSelection(branch: { id: string; name: string }) {
  const index = this.selectedBranches.findIndex(b => b.id === branch.id);
  if (index > -1) {
    this.selectedBranches.splice(index, 1); // Remove if exists
  } else {
    this.selectedBranches.push(branch); // Add if not
  }
}

get selectedBranchNames(): string {
  return this.selectedBranches.length
    ? this.selectedBranches.map(b => b.name).join(', ')
    : 'Choose branches...';
}


}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { Dashboard } from '../dashboard/dashboard';
import { templates } from '../certificate/templates/templates';
import { Router } from '@angular/router';
import { BrandingComponent } from '../branding/branding.component';
import { FloatingWidget } from '../floating-widget/floating-widget';
import { UserList } from '../Security/users/list/list';
import { Roles } from '../Security/roles/roles';
import { AutomationComponent } from '../Security/Automation/automation.component';
import { EmailTemplateEditor } from '../email-templates/email-template-editor';
import { CredentialsList } from '../certificate/credentials/credentials';
import { land } from './land';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { GlobalFilterComponent } from '../../shared/filter/global-filter.component';
import { MatTooltip } from '@angular/material/tooltip';
import {
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  MatFormField,
  MatFormFieldModule,
  MatLabel,
} from '@angular/material/form-field';
import { AddUser } from '../Security/users/add-edit/add';
import { MatSidenav, MatSidenavContainer } from '@angular/material/sidenav';
import { ConditionBuilderComponent } from '../Security/Automation/components/builder/condition-builder';
import { LandRoutingModule } from './land.routing';
import { ReportTableComponent } from '../reports/report-table.component';
import { ColumnConfiguratorComponent } from '../reports/column-configurator.component';
import { AgGridModule } from 'ag-grid-angular';
import { agReport } from '../agReport/certificate-report.component';
import 'ag-grid-enterprise';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [
    land,
    Dashboard,
    templates,
    BrandingComponent,
    FloatingWidget,
    UserList,
    Roles,
    AutomationComponent,
    EmailTemplateEditor,
    CredentialsList,
    AddUser,
    ReportTableComponent,
    ColumnConfiguratorComponent,
    agReport,
  ],
  imports: [
    LandRoutingModule,
    CommonModule,
    SharedModule,
    FormsModule,
    QuillModule,
    DragDropModule,
    GlobalFilterComponent,
    MatTooltip,
    MatDialogActions,
    MatFormField,
    MatLabel,
    MatDialogContent,
    MatSidenavContainer,
    MatSidenav,
    ConditionBuilderComponent,
    AgGridModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class LandModule {}

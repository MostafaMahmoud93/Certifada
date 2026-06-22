import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasRoutingModule } from './canvas-routing-module';
import { DetailPanel } from './detail-panel/detail-panel';
import { FooterToolbar } from './footer-toolbar/footer-toolbar';
import { Header } from './header/header';
import { LayersPanel } from './layers-panel/layers-panel';
import { PropertiesPanel } from './properties-panel/properties-panel';
import { Sidebar } from './sidebar/sidebar';
import { Canvas } from './canvas/canvas';
import { CanvasBoard } from './canvas-board';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';  
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule } from '@angular/material/dialog';
import { ClickEditFieldComponent } from "../../click-edit-field/click-edit-field";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SharedModule } from '../../shared/shared.module';
import { GlobalFilterComponent } from '../../shared/filter/global-filter.component';
import { ConditionBuilderComponent } from '../Security/Automation/components/builder/condition-builder';
import { TableConfigComponent } from './table-config/table-config.component';
import { CellEditorComponent } from './table-config/cell-editor.component';
import { AiHelperService } from '../../shared/ai-helper.service';
import { WorkflowStepsComponent } from './workflow/workflow-steps.component';


@NgModule({
  declarations: [
    Header,
    Sidebar,
    PropertiesPanel,
    FooterToolbar,
    DetailPanel,
    Canvas,
    LayersPanel,
    CanvasBoard,
    ClickEditFieldComponent,
    TableConfigComponent,
    CellEditorComponent,
    WorkflowStepsComponent
    
  ],
  imports: [
    CommonModule,
    CanvasRoutingModule,
    ReactiveFormsModule,
    MatTooltipModule,
    FormsModule,
    MatTabsModule,
    HttpClientModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatSidenavModule,
    DragDropModule,
    SharedModule,
    GlobalFilterComponent,
    ConditionBuilderComponent,
    
],
providers: [{provide: 'AiHelperService', useClass: AiHelperService }]

})
export class CanvasModule { 
}

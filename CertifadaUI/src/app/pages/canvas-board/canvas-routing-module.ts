import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CanvasBoard } from './canvas-board';

const routes: Routes = [
    {
    path: '',
    component: CanvasBoard
  }, 
]; 

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CanvasRoutingModule { }

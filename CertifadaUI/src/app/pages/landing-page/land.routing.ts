import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { land } from './land';

const routes: Routes = [
    {
    path: '',
    component: land
  }, 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LandRoutingModule { }

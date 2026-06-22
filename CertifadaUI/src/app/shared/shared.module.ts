import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { FilterBySearchPipe } from './pipes/filter-by-search.pipe';
import { TranslocoModule } from '@ngneat/transloco';
import { HasAction } from './directives/has-action.directive';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    NgxEchartsModule.forRoot({ echarts: () => import('echarts') }),
    FilterBySearchPipe,
    TranslocoModule,
    HasAction
  ],
    exports: [
    CommonModule,
    NgxEchartsModule,
    FilterBySearchPipe,
    TranslocoModule,
    HasAction,
    MatTooltipModule
  ]
})
export class SharedModule { 

  
}

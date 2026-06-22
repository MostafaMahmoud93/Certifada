import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../../pages/home/components/footer/footer.component';
import { SwitcherComponent } from '../../pages/home/components/switcher/switcher.component';

@Component({
  selector: 'app-empty-layout',
  imports: [RouterOutlet,FooterComponent,SwitcherComponent],
  templateUrl: './empty-layout.html',
  styleUrl: './empty-layout.scss'
})
export class EmptyLayout {

}

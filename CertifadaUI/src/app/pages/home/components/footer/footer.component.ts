import { Component } from '@angular/core';
import { IconsModule } from '../../icons/icons.module';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    RouterLink,
    IconsModule
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

}

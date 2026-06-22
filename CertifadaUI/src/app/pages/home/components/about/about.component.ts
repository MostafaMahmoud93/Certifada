import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CountUpModule } from 'ngx-countup';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule, 
    CountUpModule,
    RouterLink
  ],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent {

}

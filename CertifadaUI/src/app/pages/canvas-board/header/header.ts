import { Ruler } from '../../../shared/ruler';
import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone : false,
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  constructor(public ruler: Ruler) {}


}


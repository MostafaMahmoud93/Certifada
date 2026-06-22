// @ts-nocheck
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss'
})
export class ModalComponent implements OnInit {
  @Input() active: boolean;

  ngOnInit() {
   
  }

  pepito() {
    console.log("algo")
  }
 
}

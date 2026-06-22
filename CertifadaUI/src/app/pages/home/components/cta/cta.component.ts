// @ts-nocheck
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    RouterLink
  ],
  templateUrl: './cta.component.html',
  styleUrl: './cta.component.scss'
})
export class CtaComponent {

  name = 'Angular';
  isActive: boolean = false

  openModal(value) {
    value.active = true
  }

  closeModal(value) {
    value.active = false
  }

}

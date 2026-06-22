// @ts-nocheck
import { CommonModule } from '@angular/common';
import { Component,  HostListener, VERSION ,Renderer2} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-nav-light',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule
  ],
  templateUrl: './nav-light.component.html',
  styleUrl: './nav-light.component.scss'
})
export class NavLightComponent {
  manu:boolean = false
  toggleManu(){
      this.manu = !this.manu
  }

    name = 'Angular ' + VERSION.major;
    sections: NodeListOf<HTMLElement>;
    navLi: NodeListOf<HTMLElement>;
  
    ngOnInit() {
      this.sections = document.querySelectorAll('section');
      this.navLi = document.querySelectorAll('nav .container .navigation ul li');
    }
  
    current: any = '';
    scrolled: boolean = false;
    @HostListener('window:scroll', ['$event'])
    onscroll(event: Event) {
      this.sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        this.scrolled = window.scrollY > 50;
        if (scrollY >= sectionTop - 60) {
          this.current = section.getAttribute('id');
        }
      });
  
      this.navLi.forEach((li) => {
        if (li.classList.contains(this.current)) {
          li.classList.add('active');
        } else{
          li.classList.remove('active');
        }
      });
    }

    constructor(public renderer: Renderer2) {}
    
    scrollToSection(sectionId: string): void {
      const section = document.getElementById(sectionId); // Find the section by ID
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  
}

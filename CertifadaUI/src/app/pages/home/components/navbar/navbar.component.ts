// @ts-nocheck
import { CommonModule } from '@angular/common';
import { Component, HostListener, Renderer2, VERSION  } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
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
        if (scrollY >= sectionTop - 60) {
          this.current = section.getAttribute('id');
          this.scrolled = window.scrollY > 50;
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

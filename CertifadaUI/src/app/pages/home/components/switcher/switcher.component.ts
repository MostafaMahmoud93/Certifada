import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { IconsModule } from '../../icons/icons.module';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-switcher',
  standalone: true,
  imports: [
    CommonModule,
    IconsModule,
    RouterLink
  ],
  templateUrl: './switcher.component.html',
  styleUrl: './switcher.component.scss'
})
export class SwitcherComponent {
  htmlTag:any = ''
  switcherRtl:any = ''

  change(event:any) {
    this.htmlTag = document.getElementsByTagName("html")[0]  as any
    if (this.htmlTag.className.includes("dark")) {
      this.htmlTag.className = 'light'
      } else {
          this.htmlTag.className = 'dark'
      }
    }

    changeLayout(e:string){

      if (e.toString() === "ltr") {
          document.documentElement.dir = "ltr"
        }
        else {
          document.documentElement.dir = "rtl"
        }

       document.documentElement.classList.remove('dir-ltr', 'dir-rtl');
       document.documentElement.classList.add(`dir-${document.documentElement.dir}`);
       localStorage.setItem('app-dir', document.documentElement.dir);


    }

    scrolled: boolean = false;
    @HostListener("window:scroll", [])
    onWindowScroll() {
        this.scrolled = window.scrollY > 50;
    }
    topFunction(){
      window.scroll({ 
        top: 0, 
        left: 0, 
        behavior: 'smooth' 
      });
    }
}

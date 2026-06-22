import { Component, DOCUMENT, Inject } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { ToastComponent } from '../../../shared/components/toast/toast.component';
import { SignaturePopupComponent } from '../../../shared/signature/signature.component';

@Component({
  selector: 'app-header',
  imports: [SharedModule,ToastComponent, SignaturePopupComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  isDark = false;
  protected title = 'Certifada';
  currentDir: 'ltr' | 'rtl' = 'ltr';
  showPopup = false;

 constructor(private translate: TranslocoService, private router: Router,@Inject(DOCUMENT) private _doc: Document,) {
    const lang = localStorage.getItem('lang') || 'en';
    translate.setDefaultLang('en'); 
    translate.setActiveLang(lang);
    console.log('Language loaded');
  }

   goToLanding() {
      this.router.navigate(['/land']);
  }


ngOnInit() {
    const saved = localStorage.getItem('theme');
    this.isDark =
      saved === 'dark' ||
      (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    this.updateHtmlClass();

    const savedDir = localStorage.getItem('app-dir') as 'ltr' | 'rtl';
    this.setDirection(savedDir || 'ltr');

}

toggleTheme(event: MouseEvent) {
  const circle = document.getElementById('theme-transition-circle');
  if (!circle) return;

  const x = event.clientX;
  const y = event.clientY;

  const maxDim = Math.max(window.innerWidth, window.innerHeight) * 2;

  // Position & color
  circle.style.left = `${x}px`;
  circle.style.top = `${y}px`;
  circle.style.backgroundColor = this.isDark ? '#ffffff' : '#111827';
  circle.style.transition = 'none';
  circle.style.transform = 'translate(-50%, -50%) scale(0)';
  circle.style.opacity = '0.5';

  // Force reflow
  circle.offsetWidth;

  // Expand with transition
  circle.style.transition = 'transform 0.6s ease, opacity 0.4s ease';
  circle.style.transform = `translate(-50%, -50%) scale(${maxDim / 100})`;
  circle.style.opacity = '1';

  // Delay theme switch until animation completes
  setTimeout(() => {
    this.isDark = !this.isDark;
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    this.updateHtmlClass();
  }, 600);

  // Fade out and reset
  setTimeout(() => {
    circle.style.opacity = '0';
    circle.style.transform = 'translate(-50%, -50%) scale(0)';
  }, 1000);
}

private updateHtmlClass() {
    document.documentElement.classList.toggle('dark', this.isDark);
}


toggleDirection() {
    const newDir = this.currentDir === 'ltr' ? 'rtl' : 'ltr';
    this.setDirection(newDir);
    
    const newLang = this.translate.getActiveLang() === 'en' ? 'ar' : 'en';
    this.translate.setActiveLang(newLang);
    localStorage.setItem('lang', newLang);

    this._doc.body.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    this._doc.documentElement.setAttribute('lang', newLang);

    document.documentElement.lang = newLang;
    document.body.classList.toggle('font-arabic', newLang === 'ar');
  
}

  setDirection(dir: 'ltr' | 'rtl') {
    this.currentDir = dir;
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.classList.remove('dir-ltr', 'dir-rtl');
    document.documentElement.classList.add(`dir-${dir}`);
    localStorage.setItem('app-dir', dir);
  } 
  

}

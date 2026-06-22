import { Component, inject, OnInit ,AfterViewInit, DestroyRef} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import { WizardDialogComponent } from './wizard-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-land',
  templateUrl: './land.html',
  standalone: false,
  styleUrls: ['./land.css']
})

export class land implements AfterViewInit {
  openSubMenu: string | null = null;
  
  constructor(private router: Router,private translate: TranslocoService) { }

  showMenu=true;
  showDetails=true;
  activeMenu= 'dashboard';
  activeicon ='home'
  activeSubMenu= '';

  activities = [
  { user: 1, message: 'Activity 1' },
  { user: 2, message: 'Activity 2' },
  { user: 3, message: 'Activity 3' },
 ]

 events = [
  { title: 1, date: 'Activity 1' },
  { title: 2, date: 'Activity 2' },
  { title: 3, date: 'Activity 3' },
 ]
  isDrawerOpen = true;

     #dialog = inject(MatDialog);
  #destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
 const ref = this.#dialog.open(WizardDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      disableClose: true,           
      autoFocus: false,                 
      panelClass: ['p-0']               
    });

    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(result => {
        if (result) {
          // result.step1 / result.step2 / result.step3.fullDomain
          // TODO: persist to backend
        }
      });
  }

   
   
  openWizard() {
    const ref = this.#dialog.open(WizardDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      panelClass: ['p-0'] // Tailwind classes OK if you enabled emulation
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        // result.step1 / result.step2 / result.step3.fullDomain
        console.log('Wizard result:', result);
        // TODO: persist to your backend
      }
    });
  }
  
toggleDrawer() {
  this.isDrawerOpen = !this.isDrawerOpen;
}

closeDrawer() {
  this.isDrawerOpen = false;
}

setActiveMenu(menu: string, icon: string) {
    this.activeMenu = menu;
    this.activeicon = icon;
    this.isDrawerOpen = false;
    this.openSubMenu = null;
    this.activeSubMenu = '';
}

setActiveSubMenu(MainMenu: string, SubMenu: string, icon: string) {
    this.activeMenu = MainMenu;
    this.activeicon = icon;
    this.activeSubMenu = SubMenu;
    this.isDrawerOpen = false;
} 

createNew() {
    this.router.navigate(['/canvas']);
}

openSupport() {
    //this.router.navigate(['/support']);
    window.open('/support', '_blank');

}
getActiveMenu() {
    const MainMenu = this.translate.translate('LAND.'+this.activeMenu.toUpperCase());
    if (this.activeSubMenu !='') { 
      return MainMenu+ ' > ' + this.translate.translate('LAND.'+this.activeSubMenu.toUpperCase());
     } else{
      return MainMenu;  
     }
    
}

logout(){
  this.router.navigate(['/auth/login']);
}

toggleSubMenu(menu: string) {
  //this.activeMenu = menu;
  this.openSubMenu = this.openSubMenu === menu ? null : menu;
}

 isPanelOpen = false;

  togglePanel() {
    this.isPanelOpen = !this.isPanelOpen;
  }

}
import { CommonModule } from '@angular/common';
import { Component,ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../shared/components/toast/toast.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoadingComponent } from '../../Loading/loading';
import { NgZone } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { DialogComponent, DialogData, DialogType } from '../../shared/dialog/dialog';

interface BrandSection {
  name: string;
  fonts: { name: string; fontUrl: string }[];
  logoPreview: string | null;
  colorPalette: string[];
  isFontUploading: boolean;
  isLogoUploading: boolean;
  isDraggingFont: boolean;
  isDraggingLogo: boolean;
  expanded : boolean
}

@Component({
  selector: 'app-branding',
  templateUrl: './branding.component.html',
  styleUrls: ['./branding.component.scss'],
  standalone: false
})
export class BrandingComponent {
  fonts: { name: string; fontUrl: string }[] = [];
  logoPreview: string | null = null;
  isFontUploading = false;
  isLogoUploading = false;
  isDraggingFont = false;
  isDraggingLogo = false;
  expanded = false;
  branches: BrandSection[] = [];
  newBranchName = '';
  selectedCopyBranch: string | null = null
  defaultPalette = ['#1D4ED8', '#10B981', '#F59E0B'];

  private loadingRef: MatDialogRef<LoadingComponent> | null = null;
  @ViewChildren('colorInput') colorInputs!: QueryList<ElementRef<HTMLInputElement>>;
  maxColors = 8;  // Set max allowed colors

  constructor(private toast: ToastService, 
              private dialog: MatDialog, 
              private zone: NgZone,   
              private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadBrandingFromLocalStorage(); // ✅ Load data here
  }

addBranch() {
    if (!this.newBranchName.trim()) return;
    const copyFrom = this.branches.find(b => b.name === this.selectedCopyBranch);
    const newBranch: BrandSection = {
      name: this.newBranchName.trim(),
      fonts: copyFrom ? [...copyFrom.fonts] : [],
      logoPreview: copyFrom?.logoPreview || null,
      colorPalette: copyFrom ? [...copyFrom.colorPalette] : [...this.defaultPalette],
      isFontUploading: false,
      isLogoUploading: false,
      isDraggingFont: false,
      isDraggingLogo: false,
      expanded : false
    };
    this.branches.push(newBranch);
    this.newBranchName = '';
    this.selectedCopyBranch = null;
    this.toast.success('Branch added.');

} 

isBranchesEmpty(): boolean {
  return this.branches.length === 0;
}

onFontUpload(event: any, branch: BrandSection) {
    const files = Array.from(event.target.files) as File[];
    if (!files.length) return;
    branch.isFontUploading = true;
    let loaded = 0;
    
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        const fontUrl = reader.result as string;
        const fontName = file.name.split('.')[0];

        const style = document.createElement('style');
        style.innerHTML = `
          @font-face {
            font-family: '${fontName}';
            src: url('${fontUrl}');
          }
        `;
        document.head.appendChild(style);

        branch.fonts.push({ name: fontName, fontUrl });
        if (++loaded === files.length) branch.isFontUploading = false;
      };
      reader.readAsDataURL(file);
    }
}

onLogoUpload(event: any, branch: BrandSection) {
    const file = event.target.files[0];
    if (!file) return;

    branch.isLogoUploading = true;
    const reader = new FileReader();
    reader.onload = () => {
      branch.logoPreview = reader.result as string;
      branch.isLogoUploading = false;
    };
    reader.readAsDataURL(file);
}

onColorChange(index: number, color: string, branch: BrandSection) {
    branch.colorPalette[index] = color;
}

deleteBranch(branchName: string) {
  this.Confirm('Are you sure you want to delete [ '+branchName+' ] branch?', 'Delete Branch!').subscribe(result => {
      if (result === true) {
          this.branches = this.branches.filter(branch => branch.name !== branchName);
      }});
}

 Confirm(Q:string,title:string) { 
      const dialogRef = this.dialog.open(DialogComponent, {
        width: '400px',
        data: <DialogData>{
          type: 'confirm',
          title: title,
          message: Q,
          confirmText:'Yes',
          cancelText: 'No',
          icon  : 'warning'
        }
      });
        return dialogRef.afterClosed();
}

  onDragOver(event: DragEvent, branch: any, type: 'font' | 'logo') {
  event.preventDefault();
  branch[`isDragging${type === 'font' ? 'Font' : 'Logo'}`] = true;
}

onDragLeave(event: DragEvent, branch: any, type: 'font' | 'logo') {
  branch[`isDragging${type === 'font' ? 'Font' : 'Logo'}`] = false;
}

onDropFont(event: DragEvent, branch: any) {
  event.preventDefault();
  branch.isDraggingFont = false;
  const files = event.dataTransfer?.files;
  if (files?.length) {
    this.onFontUpload({ target: { files } } as any, branch);
  }
}

onDropLogo(event: DragEvent, branch: any) {
  event.preventDefault();
  branch.isDraggingLogo = false;
  const files = event.dataTransfer?.files;
  if (files?.length) {
    this.onLogoUpload({ target: { files } } as any, branch);
  }
}

removeFont(branch: any, index: number) {
  branch.fonts.splice(index, 1);
}

removeLogo(branch: any) {
  branch.logoPreview = null;
}



saveBrandingToLocalStorage() {
  try {
    const data = JSON.stringify(this.branches);
    localStorage.setItem('branding-config', data);
    this.toast.success('Branding saved to local storage.');
  } catch (error) {
    this.toast.error('Failed to save branding to local storage.');
    console.error(error);
  }
} 

loadBrandingFromLocalStorage() {
  const data = localStorage.getItem('branding-config');
  console.log(data);

  if (!data) {
    this.toast.error('No branding data found in local storage.');
    return;
  }

  try {
    const json = JSON.parse(data);

    if (!Array.isArray(json)) throw new Error('Invalid format');

    this.branches = json.map(branch => ({
      ...branch,
      isFontUploading: false,
      isLogoUploading: false,
      expanded : true
    }));

    this.cdr.detectChanges();
    this.toast.success('Branding loaded from local storage.');
  } catch (err) {
    this.toast.error('Failed to load branding from local storage.');
    console.error(err);
  }
}

addColor(branch: BrandSection) {
  if (branch.colorPalette.length < this.maxColors) {
    // Add a default color (white or any color you want)
    branch.colorPalette.push('#ffffff');
  }
}

removeColor(index: number, branch: BrandSection) {
  if (branch.colorPalette.length > 1) {
    branch.colorPalette.splice(index, 1);
  }
}

}

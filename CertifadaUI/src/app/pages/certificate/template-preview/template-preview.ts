import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-template-preview',
  templateUrl: './template-preview.html',
  styleUrls: ['./template-preview.css']
})
export class TemplatePreview {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<TemplatePreview>,
    private router: Router
  ) {}

  close() {
    this.dialogRef.close();
  }

 
}

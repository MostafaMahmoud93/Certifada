import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

export type DialogType = 'info' | 'warning' | 'confirm' | 'input';

export interface DialogData {
  type: DialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  inputPlaceholder?: string;
  inputValue?: string;
  icon?: string;
}

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.html',
  styleUrls: ['./dialog.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class DialogComponent {
  userInput: string = '';

  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.userInput = data.inputValue || '';
  }

  ngOnInit() {
}

  onConfirm(): void {
    if (this.data.type === 'input') {
      this.dialogRef.close(this.userInput);
    } else {
      this.dialogRef.close(true);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}

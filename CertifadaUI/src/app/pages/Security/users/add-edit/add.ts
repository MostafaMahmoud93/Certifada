import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-add-user',
  templateUrl: './add.html',
  standalone: false
})
export class AddUser {
  user = {
    name: '',
    email: '',
    role: '',
    avatar: ''
  };

  isEdit = false;

    constructor(
    public dialogRef: MatDialogRef<AddUser>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data?.user) {
      this.user = { ...data.user };
    }
    this.isEdit = data?.isEdit ?? false;
  }


  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.user);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.user.avatar = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  
}

import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-table-config',
  templateUrl: './table-config.component.html',
  standalone: false
})
export class TableConfigComponent {
  rows = 3;
  columns = 3;

  constructor(private dialogRef: MatDialogRef<TableConfigComponent>) {}

  submit() {
    this.dialogRef.close({ rows: this.rows, columns: this.columns });
  }

  close() {
    this.dialogRef.close();
  }
}
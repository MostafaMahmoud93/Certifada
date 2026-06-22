import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TableCell } from './table.model';

@Component({
  selector: 'app-cell-editor-dialog',
  templateUrl: './cell-editor.component.html',
  standalone: false
})
export class CellEditorComponent {
  cell: TableCell;

  constructor(
    public dialogRef: MatDialogRef<CellEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cell: TableCell }
  ) {
    this.cell = { ...data.cell };
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.dialogRef.close(this.cell);
  }
}
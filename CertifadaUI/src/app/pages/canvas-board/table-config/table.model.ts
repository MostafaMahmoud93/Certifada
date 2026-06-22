
export interface TableCell {
  text: string;
  alignment: 'left' | 'center' | 'right';
  fontSize: number;
  bold: boolean;
  backgroundColor: string;
  textColor: string;
  colIndex: number;
  rowIndex: number;
  colspan?: number;
  rowspan?: number;
  top: number;
  width: number;
  height: number;
  left: number;
}

export interface TableRow {
  cells: TableCell[];
}

export interface TableModel {
  id: string;
  rows: TableRow[];
  columnWidths: number[];
  position: { x: number; y: number };
  dimensions: { rowHeight: number };
}
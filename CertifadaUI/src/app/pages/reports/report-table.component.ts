import { Component } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HostListener } from '@angular/core';


export interface ColumnFilter {
  type: 'text' | 'number' | 'date'; // ✅ Required
  operator: string;
  value: any;
  valueTo?: any;
}

export interface ColumnConfig {
  field: string;
  name: string;
  width: number;
  isVisible: boolean;
  isPinned: boolean;
  filter?: ColumnFilter;
  sortOrder?: 'asc' | 'desc' | null; 
  formatter?: (value: any) => any;

}

interface Row {
  name: string;
  age: number;
  score: number;
  status: boolean;
  address: string;
  [key: string]: string | number | boolean;
}

@Component({
  selector: 'app-report-table',
  templateUrl: './report-table.component.html',
  styleUrls: ['./report-table.component.css'],
  standalone: false
})
export class ReportTableComponent {

columns: ColumnConfig[] = [
  {
    field: 'name',
    name: 'Name',
    width: 150,
    isVisible: true,
    isPinned: false,
    formatter: (value: string) => this.getDefaultStyle(value),
    filter: {
      type: 'text',
      operator: 'contains',
      value: ''
    }
  },
  {
    field: 'age',
    name: 'Age',
    width: 100,
    isVisible: true,
    isPinned: false,
    formatter: (value: number) => this.getAgeStyle(value),
    filter: {
      type: 'number',
      operator: 'equals',
      value: ''
    }
  },
    {
      field: 'score', 
      name: 'Score', 
      width: 100,
      isVisible: true,
      isPinned: false,
      formatter: (value: number) => this.getScoreStyle(value), // Conditional formatting for score
      filter: {
        type: 'number',
        operator: 'equals',
        value: ''
    }
    },
    {
      field: 'status', 
      name: 'Status',
      width: 100,
      isVisible: true,
      isPinned: false,
      formatter: (value: boolean) => this.getStatusIcon(value),
      filter: {
        type: 'number',
        operator: 'equals',
        value: ''
    }
    },{
    field: 'address',
    name: 'Address',
    width: 150,
    isVisible: true,
    isPinned: false,
    formatter: (value: string) => this.getDefaultStyle(value),
    filter: {
      type: 'text',
      operator: 'contains',
      value: ''
    }
  },
  
];

data: Row[] = [
    { name: 'John Doe', age: 30, score: 85, status: true, address: '123 Main St' },
    { name: 'Jane Doe', age: 28, score: 92, status: false, address: '456 Oak St' },
];

isConfigModalOpen = false;
isMenuVisible: boolean = false;
selectedColumn: ColumnConfig | null = null;

ngOnInit() {
   this.loadLayout(); 
}

  hideMenu() {
    this.isMenuVisible = false;
    this.selectedColumn = null;
  }

  showMenu() {
    this.isMenuVisible = true;
  }

dropColumn(event: CdkDragDrop<ColumnConfig[]>) {
  const visible = this.visibleColumns;
  moveItemInArray(visible, event.previousIndex, event.currentIndex);

  // Reorder the full columns[] array based on new visibleColumns order
  const newOrder = visible.map(c => c.field);
  this.columns.sort((a, b) => newOrder.indexOf(a.field) - newOrder.indexOf(b.field));

  // Optional: persist layout
  this.saveLayout();

  // Clear drop target highlight
  this.hoveredIndex = null;
}

  openColumnConfigurator() {
    this.isConfigModalOpen = true;
  }

  closeColumnConfigurator() {
    this.isConfigModalOpen = false;
  }

  saveLayout() {
    localStorage.setItem('columnLayout', JSON.stringify(this.columns));
    this.closeColumnConfigurator();
  }

  toggleColumnVisibility(column: any) {
    column.isVisible = !column.isVisible;
  }

  get pinnedColumns() {
  return this.columns.filter(c => c.isVisible && c.isPinned);
}

get unpinnedColumns() {
  return this.columns.filter(c => c.isVisible && !c.isPinned);
}

get visibleColumns() {
  return [...this.columns.filter(c => c.isVisible && c.isPinned), ...this.columns.filter(c => c.isVisible && !c.isPinned)];
}

  loadLayout() {
    const savedLayout = JSON.parse(localStorage.getItem('columnLayout') || '[]');
    if (savedLayout.length) {
      this.columns = savedLayout;
    }
  }

  startResize(event: MouseEvent, column: any) {
  const startX = event.pageX;
  const startWidth = column.width;

  const onMouseMove = (moveEvent: MouseEvent) => {
    const newWidth = startWidth + (moveEvent.pageX - startX);
    column.width = Math.max(newWidth, 50); // min width
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

getPinnedOffset(index: number): number {
  const columns = this.visibleColumns;
  let offset = 0;

  for (let i = 0; i < index; i++) {
    if (columns[i].isPinned) {
      offset += columns[i].width;
    }
  }

  return offset;
}


hoveredIndex: number | null = null;

onDragEnter(index: number) {
  this.hoveredIndex = index;
}

onDragLeave(index: number) {
  if (this.hoveredIndex === index) {
    this.hoveredIndex = null;
  }
}

activeMenuIndex: number | null = null;
activeFilterMenuIndex: number | null = null;

hideColumn(column: ColumnConfig) {
    this.hideMenu();
  column.isVisible = false;
  this.activeMenuIndex = null;
  this.saveLayout();
}

pinColumn(column: ColumnConfig) {
    this.hideMenu();
  column.isPinned = !column.isPinned;
  this.activeMenuIndex = null;
  this.saveLayout();
}

renameColumn(column: ColumnConfig) {
    this.hideMenu();
  const newName = prompt('Enter new column name:', column.name);
  if (newName !== null && newName.trim() !== '') {
    column.name = newName.trim();
    this.saveLayout();
  }
  this.activeMenuIndex = null;
}

toggleColumnMenu(index: number) {

  this.activeMenuIndex = this.activeMenuIndex === index ? null : index;
  this.activeFilterMenuIndex = null;
      this.showMenu();

}

toggleFilterMenu(index: number) {
  this.activeFilterMenuIndex = this.activeFilterMenuIndex === index ? null : index;
}

getOperators(column: ColumnConfig): string[] {
      return ['equals', 'contains', 'starts with', 'ends with'];

  console.log('Operators for', column.field, ':', column.filter?.type, '→', this.getOperators(column));

  switch (column.filter?.type) {
    case 'text':
      return ['equals', 'contains', 'starts with', 'ends with'];
    case 'number':
      return ['equals', 'greater than', 'less than', 'between'];
    case 'date':
      return ['before', 'after', 'between'];
    default:
      return [];
  }
}

applyFilter(column: ColumnConfig) {
  // Close the active filter menu
    this.hideMenu();

  this.activeFilterMenuIndex = null;

  // Optionally save the layout (including filters)
  this.saveLayout();
}

get filteredData() {
  return this.data.filter(row => {
    return this.columns.every(col => {
      if (!col.isVisible || !col.filter?.value) return true;

      const val = row[col.field];
      const filter = col.filter;

      switch (filter.type) {
        case 'text':
          return this.evaluateTextFilter(val, filter);
        case 'number':
          return this.evaluateNumberFilter(val, filter);
        case 'date':
          return this.evaluateDateFilter(val, filter);
        default:
          return true;
      }
    });
  });
}

evaluateTextFilter(value: any, filter: ColumnFilter): boolean {
  const v = String(value || '').toLowerCase();
  const f = String(filter.value || '').toLowerCase();

  switch (filter.operator) {
    case 'equals': return v === f;
    case 'contains': return v.includes(f);
    case 'starts with': return v.startsWith(f);
    case 'ends with': return v.endsWith(f);
    default: return true;
  }
}

evaluateNumberFilter(value: any, filter: ColumnFilter): boolean {
  const v = Number(value);
  const f = Number(filter.value);
  const t = Number(filter.valueTo);

  if (isNaN(v) || isNaN(f)) return false;

  switch (filter.operator) {
    case 'equals': return v === f;
    case 'greater than': return v > f;
    case 'less than': return v < f;
    case 'between': return v >= f && v <= t;
    default: return true;
  }
}

evaluateDateFilter(value: any, filter: ColumnFilter): boolean {
  const v = new Date(value).getTime();
  const f = new Date(filter.value).getTime();
  const t = new Date(filter.valueTo).getTime();

  if (isNaN(v) || isNaN(f)) return false;

  switch (filter.operator) {
    case 'before': return v < f;
    case 'after': return v > f;
    case 'between': return v >= f && v <= t;
    default: return true;
  }
}

toggleSort(column: ColumnConfig, sortOrder: 'asc' | 'desc') {
   column.sortOrder = sortOrder;
   this.columns.forEach(col => {
    if (col !== column) col.sortOrder = null;
  });

  // Apply sorting to rows
  this.sortRows(column);
}

sortRows(column: ColumnConfig) {
    this.hideMenu();
  const field = column.field;
  const order = column.sortOrder;

  this.data.sort((a, b) => {
    const valueA = a[field];
    const valueB = b[field];

    if (order === 'asc') {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else if (order === 'desc') {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    }
    return 0; // No sorting
  });
}

moveColumn(column: ColumnConfig, direction: 'left' | 'right') {
  this.hideMenu();
  const index = this.columns.indexOf(column);
  if (index === -1) return;
  let newIndex = direction === 'left' ? index - 1 : index + 1;

  if (newIndex < 0 || newIndex >= this.columns.length) {
    return;
  }
  this.columns.splice(index, 1);
  this.columns.splice(newIndex, 0, column);
}

getCellStyle(value: any, column: ColumnConfig) {
  let style = {};
  if (column.formatter) {
    style = column.formatter(value); 
  }
 
  return {style: style};
}

getAgeStyle(age: number) {
  if (age < 20) {
    return { 'background-color': 'lightgreen', 'color': 'darkgreen' };
  }
  if (age >= 20 && age < 40) {
    return { 'background-color': 'lightblue', 'color': 'darkblue' };
  }
  return { 'background-color': 'lightcoral', 'color': 'darkred' };
}

getDefaultStyle(text: string) {
    return { };
}

// Conditional formatting function for score (color scale)
getScoreStyle(score: number) {
  if (score >= 80) {
    return { 'background-color': 'green', 'color': 'white' };
  }
  if (score >= 50) {
    return { 'background-color': 'yellow', 'color': 'black' };
  }
  return { 'background-color': 'red', 'color': 'white' };
}

getStatusIcon(value: boolean) {
  let icon = '⚪'; 
  let style = {
    'font-size': '16px', 
    'color': 'grey'     
  };
    icon = value ? '✔️' : '❌';  
    style['color'] = value ? 'green' : 'red'; 

  return {
    icon: icon,      
    style: style  
  };
}

}

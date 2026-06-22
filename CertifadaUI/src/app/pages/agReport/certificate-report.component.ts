import { Component } from '@angular/core';
import { ColDef, GridReadyEvent , ColGroupDef,GridApi  } from 'ag-grid-community';
import { GridTheme } from 'ag-grid-community';

@Component({
  selector: 'app-certificate-report',
  templateUrl: './certificate-report.component.html',
  standalone: false
})
export class agReport {
    private gridApi!: GridApi;
    public gridTheme!: GridTheme;
    isDarkMode = false;

  rowData = [
    { id: 1, name: 'Alice Johnson', course: 'Angular', grade: 'A', issuedOn: '2025-07-15', location: 'New York' },
    { id: 2, name: 'Bob Smith', course: 'React', grade: 'B', issuedOn: '2025-07-14', location: 'London' },
    { id: 3, name: 'Charlie Lee', course: 'Angular', grade: 'A', issuedOn: '2025-07-13', location: 'New York' },
    { id: 4, name: 'Dana Kim', course: 'Vue', grade: 'C', issuedOn: '2025-07-12', location: 'Seoul' },
    { id: 5, name: 'Evan White', course: 'Angular', grade: 'B', issuedOn: '2025-07-11', location: 'Toronto' },
  ];

  sideBar = {
  toolPanels: [
    {
      id: 'columns',
      labelDefault: 'Columns',
      labelKey: 'columns',
      iconKey: 'columns',
      toolPanel: 'agColumnsToolPanel',
      toolPanelParams: {
        suppressRowGroups: true,  // optional - hide row groups if you want
        suppressValues: true,     // optional
        suppressPivots: true      // optional
      }
    },
    {
      id: 'filters',
      labelDefault: 'Filters',
      labelKey: 'filters',
      iconKey: 'filter',
      toolPanel: 'agFiltersToolPanel'
    }
  ],
  defaultToolPanel: 'columns'  // open columns panel by default
};

columnDefs: (ColDef | ColGroupDef)[] = [
    {
      headerName: 'User Info',
      children: [
        { field: 'name', filter: true, sortable: true, checkboxSelection: true },
        { field: 'location', filter: 'agTextColumnFilter' }
      ]
    },
    {
      headerName: 'Certificate Info',
      children: [
        { field: 'course', rowGroup: true, filter: 'agSetColumnFilter' },
        { field: 'grade', filter: true, sortable: true },
        { field: 'issuedOn', filter: 'agDateColumnFilter', sortable: true }
      ]
    }
  ];

  defaultColDef: ColDef = {
    flex: 1,
    minWidth: 120,
    resizable: true,
    filter: true,
    sortable: true
  };

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    params.api.sizeColumnsToFit();
  }

  exportCSV() {
   if (this.gridApi) {
      this.gridApi.exportDataAsCsv({
        fileName: 'certificate-report.csv',
      });
    } else {
      console.warn('Grid API is not ready yet.');
    }
  }

  checkDarkMode() {
    this.isDarkMode = document.documentElement.classList.contains('dark');
  }

}

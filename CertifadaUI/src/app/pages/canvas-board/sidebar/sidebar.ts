import { Component } from '@angular/core';
import { Selection } from '../../../shared/selection';

interface MenuItem {
  key: 'template' | 'images' | 'fonts' | 'elements' | 'qr' | 'addons' | 
       'variables' | 'backgrounds' | 'drawing' | 'brand' | 'table';
  label: string;
}

@Component({
  selector: 'app-sidebar', 
  standalone : false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})

export class Sidebar {
  isCollapsed = false;

   menuItems: MenuItem[] = [
    { key: 'template', label: 'Design' },
    { key: 'fonts',  label: 'Fonts'  },
    { key: 'images', label: 'Images' },
    { key: 'backgrounds', label: 'Backgrounds' },
    { key: 'variables', label: 'Variables' },
    { key: 'elements', label: 'Elements' },
    { key: 'qr', label: 'QR Code' },
    { key: 'addons', label: 'Addons' },
    { key: 'drawing', label: 'Drawing' },  
    { key: 'brand', label: 'My Brand' },  
    { key: 'table', label: 'Table' } ,
  ];

  selectedKey: string = '';

  constructor(private selection: Selection) {}
    ngOnInit() {
       this.selection.setSelectedItem(this.selectedKey);
    }

   selectItem(key: string) {
      this.selectedKey = key;
      this.selection.setSelectedItem(key);
      this.selection.openDetailsPanel(true); 
    }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

 onSelect(item: string) {
  this.selection.setSelectedItem(item);
}



}



 
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FilterConfigService } from "./filter-config.service";
import { FilterCategory, FilterField, UserFilter } from "./filter.model";
import { ComponentModel } from "echarts";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-global-filter',
  templateUrl: './global-filter.component.html',
  imports: [CommonModule, FormsModule],
})
export class GlobalFilterComponent implements OnInit {
  @Input() contextPage!: string;
  @Output() filtersChanged = new EventEmitter<UserFilter[]>();

  categories: FilterCategory[] = [];
  selectedFilters: UserFilter[] = [];
  CurrentFilter: UserFilter[] = [];

  constructor(private configService: FilterConfigService,) {}

  ngOnInit() {
    this.categories = this.configService.getFilterCategories(this.contextPage);
  }

  addFilter() {
  const firstCategory = this.categories[0];
  const firstField = firstCategory.fields[0];

  const newFilter: UserFilter = {
    category: firstCategory.name,
    field: firstField.name,
    operator: firstField.operators[0],
    value: '',
    isEditing: true, // start in edit mode
  };
  this.CurrentFilter =[newFilter];
  this.CurrentFilter.concat(newFilter);
  
  this.selectedFilters.push(newFilter);
}

applyFilter(filter: UserFilter) {
  filter.isEditing = false;
  this.emitFilters();
}

cancelFilter(filter: UserFilter) {
  filter.isEditing = false;
}


  emitFilters() {
    this.filtersChanged.emit(this.selectedFilters);
  }

  removeFilter(index: number) {
    this.selectedFilters.splice(index, 1);
    this.emitFilters();
  }

  onFieldChange(filter: UserFilter, categoryName: string) {
    const category = this.categories.find(c => c.name === categoryName);
    const field = category?.fields.find(f => f.name === filter.field);
    if (field) {
      filter.operator = field.operators[0];
      filter.value = null; // Reset value
    }
  }

  getFieldOptions(categoryName: string) {
    return this.categories.find(c => c.name === categoryName)?.fields || [];
  }

  getOperators(fieldName: string, categoryName: string): string[] {
    const category = this.categories.find(c => c.name === categoryName);
    const field = category?.fields.find(f => f.name === fieldName);
    return field?.operators || [];
  }

  getFieldType(categoryName: string, fieldName: string): FilterField | undefined {
    return this.categories
      .find(c => c.name === categoryName)
      ?.fields.find(f => f.name === fieldName);
  }

  isMultiSelect(filter: UserFilter): boolean {
    const multiSelectOps = ['includes', 'excludes'];
    const fieldType = this.getFieldType(filter.category, filter.field);
    return fieldType?.type === 'select' && multiSelectOps.includes(filter.operator);
  }

getFilterLabel(filter: UserFilter): string {
  const cat = this.categories.find(c => c.name === filter.category);
  const field = cat?.fields.find(f => f.name === filter.field);
  const fieldLabel = field?.label || filter.field;
  const catLabel = cat?.label || filter.category;

  let valueStr = '';

  if (filter.operator === 'between' && Array.isArray(filter.value)) {
    valueStr = `${filter.value[0]} and ${filter.value[1]}`;
  } else if (Array.isArray(filter.value)) {
    valueStr = filter.value.join(', ');
  } else {
    valueStr = filter.value;
  }

  return `${catLabel} - ${fieldLabel} ${filter.operator} ${valueStr}`;
}

isEditingFilterActive(): boolean {
  return this.selectedFilters.some(f => f.isEditing);
}
}

import { Injectable } from "@angular/core";
import { FilterCategory } from "./filter.model";

@Injectable({ providedIn: 'root' })
export class FilterConfigService {
  private configs: { [key: string]: FilterCategory[] } = {
    reports: [
      {
        name: 'credential',
        label: 'Credential Info',
        fields: [
          {
            name: 'createdDate',
            label: 'Cretaed Date',
            type: 'date',
            operators: ['equals', 'before', 'after', 'between']
          },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            operators: ['is', 'is not', 'includes', 'excludes'],
            options: ['Draft', 'Approved', 'Signed', 'Deleted']
          }
        ]
      }
    ]
  };

  getFilterCategories(page: string): FilterCategory[] {
    return this.configs[page] || [];
  }
}

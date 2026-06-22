import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterBySearch',
  standalone: true
})
export class FilterBySearchPipe implements PipeTransform {
  transform(items: any[], searchTerm: string): any[] {
    if (!items) return [];
    if (!searchTerm) return items;

    const lowerTerm = searchTerm.toLowerCase();

    return items.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(lowerTerm)
      )
    );
  }
}

export interface FilterField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  operators: string[];
  options?: string[]; // For dropdown/select fields
}

export interface FilterCategory {
  name: string;
  label: string;
  fields: FilterField[];
}

export interface UserFilter {
  category: string;
  field: string;
  operator: string;
  value: any;
  isEditing?: boolean;

}

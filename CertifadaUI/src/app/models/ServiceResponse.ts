export interface ServiceResponse <T>{
    data: T;
    message: string;
    success: boolean;
}

export interface CollectionResponse <T>{
    collection : T;
    length : number;
}

export interface Pagging {
    page: number;
    pageSize: number;
    sortBy: string | null;
    isSortAsc: boolean;
}

export interface PaggingFilter {
    page: number;
    pageSize: number;
    sortBy: string | null;
    isSortAsc: boolean;
    filterSearch: string | null;
}
export interface DDLModel<T> {
    id: T;
    name: string;
}
export interface CustomDDLModel<T,U> {
    id: T;
    id2: U;
    name: string;
}
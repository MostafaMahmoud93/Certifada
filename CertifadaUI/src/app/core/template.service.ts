import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SaveTemplateRequest, TemplateDetail, TemplateListItem } from './models';

/**
 * Template persistence. Expects a REST controller at `{apiURL}/templates`:
 *   GET    /templates            -> TemplateListItem[]
 *   GET    /templates/{id}       -> TemplateDetail
 *   POST   /templates            -> TemplateDetail
 *   PUT    /templates/{id}       -> TemplateDetail
 *   DELETE /templates/{id}       -> 204
 * The designer works standalone (edit + export) even if these are not yet
 * implemented; only save/load require them.
 */
@Injectable({ providedIn: 'root' })
export class TemplateService {
  private http = inject(HttpClient);
  private base = `${environment.apiURL}/templates`;

  list(): Observable<TemplateListItem[]> {
    return this.http.get<TemplateListItem[]>(this.base);
  }

  get(id: number): Observable<TemplateDetail> {
    return this.http.get<TemplateDetail>(`${this.base}/${id}`);
  }

  create(body: SaveTemplateRequest): Observable<TemplateDetail> {
    return this.http.post<TemplateDetail>(this.base, body);
  }

  update(id: number, body: SaveTemplateRequest): Observable<TemplateDetail> {
    return this.http.put<TemplateDetail>(`${this.base}/${id}`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

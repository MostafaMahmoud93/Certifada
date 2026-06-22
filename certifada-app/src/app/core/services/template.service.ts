import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SaveTemplateRequest, ServiceResponse, TemplateDetail, TemplateListItem } from '../models/models';

/**
 * Template persistence. Talks to the Certifada API (ServiceResponse-wrapped)
 * at {apiURL}/api/Template/* and unwraps `.data` for the components.
 */
@Injectable({ providedIn: 'root' })
export class TemplateService {
  private http = inject(HttpClient);
  private base = `${environment.apiURL}/api/Template`;

  list(): Observable<TemplateListItem[]> {
    return this.http.get<ServiceResponse<TemplateListItem[]>>(`${this.base}/GetTemplates`).pipe(map((r) => r.data ?? []));
  }

  get(id: string): Observable<TemplateDetail> {
    return this.http.get<ServiceResponse<TemplateDetail>>(`${this.base}/GetTemplate/${id}`).pipe(map((r) => r.data));
  }

  create(body: SaveTemplateRequest): Observable<TemplateDetail> {
    return this.http.post<ServiceResponse<TemplateDetail>>(`${this.base}/CreateTemplate`, body).pipe(map((r) => r.data));
  }

  update(id: string, body: SaveTemplateRequest): Observable<TemplateDetail> {
    return this.http.put<ServiceResponse<TemplateDetail>>(`${this.base}/EditTemplate/${id}`, body).pipe(map((r) => r.data));
  }

  remove(id: string): Observable<boolean> {
    return this.http.delete<ServiceResponse<boolean>>(`${this.base}/DeleteTemplate/${id}`).pipe(map((r) => r.data));
  }

  archive(id: string): Observable<boolean> {
    return this.http.post<ServiceResponse<boolean>>(`${this.base}/ArchiveTemplate/${id}`, {}).pipe(map((r) => r.data));
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BatchResult,
  GeneratedCertificate,
  SaveBatchRequest,
  SaveCertificateRequest,
} from './models';

/** Generated-certificate history. Expects a REST controller at `{apiURL}/certificates`. */
@Injectable({ providedIn: 'root' })
export class CertificateService {
  private http = inject(HttpClient);
  private base = `${environment.apiURL}/certificates`;

  list(templateId?: number): Observable<GeneratedCertificate[]> {
    const url = templateId ? `${this.base}?templateId=${templateId}` : this.base;
    return this.http.get<GeneratedCertificate[]>(url);
  }

  save(body: SaveCertificateRequest): Observable<GeneratedCertificate> {
    return this.http.post<GeneratedCertificate>(this.base, body);
  }

  saveBatch(body: SaveBatchRequest): Observable<BatchResult> {
    return this.http.post<BatchResult>(`${this.base}/batch`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

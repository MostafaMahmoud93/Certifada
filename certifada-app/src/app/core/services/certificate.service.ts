import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BatchResult,
  GeneratedCertificate,
  SaveBatchRequest,
  SaveCertificateRequest,
  ServiceResponse,
} from '../models/models';

/**
 * Generated-certificate history. Talks to {apiURL}/api/Certificate/*
 * (ServiceResponse-wrapped) and unwraps `.data`.
 */
@Injectable({ providedIn: 'root' })
export class CertificateService {
  private http = inject(HttpClient);
  private base = `${environment.apiURL}/api/Certificate`;

  list(templateId?: string): Observable<GeneratedCertificate[]> {
    const url = templateId ? `${this.base}/GetCertificates?templateId=${templateId}` : `${this.base}/GetCertificates`;
    return this.http.get<ServiceResponse<GeneratedCertificate[]>>(url).pipe(map((r) => r.data ?? []));
  }

  save(body: SaveCertificateRequest): Observable<GeneratedCertificate> {
    return this.http.post<ServiceResponse<GeneratedCertificate>>(`${this.base}/SaveCertificate`, body).pipe(map((r) => r.data));
  }

  saveBatch(body: SaveBatchRequest): Observable<BatchResult> {
    return this.http.post<ServiceResponse<BatchResult>>(`${this.base}/SaveBatch`, body).pipe(map((r) => r.data));
  }

  remove(id: string): Observable<boolean> {
    return this.http.delete<ServiceResponse<boolean>>(`${this.base}/DeleteCertificate/${id}`).pipe(map((r) => r.data));
  }
}

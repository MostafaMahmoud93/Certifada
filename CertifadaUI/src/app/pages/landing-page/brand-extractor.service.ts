import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface BrandKit {
  name?: string;
  colors: string[];
  fonts: string[];
  logos: string[];
}

@Injectable({ providedIn: 'root' })
export class BrandExtractorService {
  #http = inject(HttpClient);
  Url = environment.apiURL;

  // Point these to your backend:
  #base = `${this.Url}/api/brand`;
  #domainBase = `${this.Url}/api/domain`;

  extractFromWebsite(url: string) {
    return this.#http.post<BrandKit>(`${this.#base}/extract`, { url }).toPromise();
  }

  checkDomainAvailability(subdomain: string) {
    return this.#http.get<{available: boolean; reason?: string}>(`${this.#domainBase}/check/${encodeURIComponent(subdomain)}`).toPromise();
  }
}

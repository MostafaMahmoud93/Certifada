import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WalletCredential {
  id: string;
  title: string;
  issuer: string;
  issuedAt?: string;
  status: string;
  downloadUrl?: string | null;
}
export interface WalletSession { token: string; email: string; }
interface ServiceResponse<T> { success: boolean; data: T; message?: string; }

const TOKEN_KEY = 'wallet_token';
const EMAIL_KEY = 'wallet_email';

/**
 * Recipient wallet — passwordless, email-owned. Its token is stored SEPARATELY from the
 * staff `access_token` and only ever sent to `/api/wallet/*`, so recipient and org
 * sessions never collide.
 */
@Injectable({ providedIn: 'root' })
export class WalletService {
  private http = inject(HttpClient);
  private readonly url = environment.apiURL;

  readonly email = signal<string>(localStorage.getItem(EMAIL_KEY) || '');
  get token(): string { return localStorage.getItem(TOKEN_KEY) || ''; }
  get isOpen(): boolean { return !!this.token; }

  /** Email a wallet link + code. `credentialId` lets the verify page ask without exposing the email. */
  requestLink(payload: { email?: string; credentialId?: string }): Observable<ServiceResponse<boolean>> {
    return this.http.post<ServiceResponse<boolean>>(`${this.url}/api/Wallet/Request`, payload);
  }

  /** Exchange a link token OR email+code for a wallet session; persists it on success. */
  exchange(payload: { token?: string; email?: string; code?: string }): Observable<ServiceResponse<WalletSession>> {
    return this.http.post<ServiceResponse<WalletSession>>(`${this.url}/api/Wallet/Exchange`, payload).pipe(
      tap((res) => {
        if (res?.success && res.data?.token) {
          localStorage.setItem(TOKEN_KEY, res.data.token);
          localStorage.setItem(EMAIL_KEY, res.data.email || '');
          this.email.set(res.data.email || '');
        }
      }),
    );
  }

  /** All credentials for the session email (cross-issuer). Sends the wallet token explicitly. */
  credentials(): Observable<ServiceResponse<WalletCredential[]>> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.token}` });
    return this.http.get<ServiceResponse<WalletCredential[]>>(`${this.url}/api/Wallet/Credentials`, { headers });
  }

  signOut(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    this.email.set('');
  }
}

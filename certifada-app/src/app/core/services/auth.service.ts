import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ServiceResponse, TokenModel } from '../models/models';

const TOKEN_KEY = 'access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly url = environment.apiURL;

  /** Source of truth for auth state. */
  readonly token = signal<TokenModel | null>(this.read());
  readonly isAuthenticated = computed(() => this.isTokenValid(this.token()));

  get accessToken(): TokenModel | null {
    return this.token();
  }
  set accessToken(value: TokenModel | null) {
    if (value) localStorage.setItem(TOKEN_KEY, JSON.stringify(value));
    else localStorage.removeItem(TOKEN_KEY);
    this.token.set(value);
  }

  /** Action codes the user's plan/role allows (read by appHasAction + permissionGuard). */
  get userActions(): string[] {
    return this.token()?.userActions ?? [];
  }

  /** Display name for greetings/avatar, with sensible fallbacks. */
  get userName(): string {
    const t = this.token();
    return t?.userName || t?.email?.split('@')[0] || 'there';
  }

  get email(): string {
    return this.token()?.email ?? '';
  }

  get initials(): string {
    const name = this.userName;
    const parts = name.trim().split(/[\s.@_-]+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
  }

  login(email: string, password: string): Observable<ServiceResponse<TokenModel>> {
    return this.http.post<ServiceResponse<TokenModel>>(`${this.url}/api/auth/login`, { email, password });
  }

  isTokenValid(t: TokenModel | null): boolean {
    return !!t?.token && !!t?.expiration && new Date(t.expiration) > new Date();
  }

  signOut(): void {
    this.accessToken = null;
  }

  loginWithGoogle(): void { this.social('Google'); }
  loginWithFacebook(): void { this.social('Facebook'); }
  loginWithMicrosoft(): void { this.social('Microsoft'); }

  private social(provider: 'Google' | 'Facebook' | 'Microsoft'): void {
    const returnUrl = encodeURIComponent(window.location.origin + '/auth/login');
    window.location.href = `${this.url}/api/auth/${provider}Url?returnUrl=${returnUrl}`;
  }

  private read(): TokenModel | null {
    try {
      const s = localStorage.getItem(TOKEN_KEY);
      return s ? (JSON.parse(s) as TokenModel) : null;
    } catch {
      return null;
    }
  }
}

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

  /** `rememberMe` asks the API for a 30-day token instead of the default 24h. */
  login(email: string, password: string, rememberMe = false): Observable<ServiceResponse<TokenModel>> {
    return this.http.post<ServiceResponse<TokenModel>>(`${this.url}/api/auth/login`, { email, password, rememberMe });
  }
  register(fullName: string, email: string, password: string): Observable<ServiceResponse<TokenModel>> {
    return this.http.post<ServiceResponse<TokenModel>>(`${this.url}/api/Auth/Register`, { fullName, email, password });
  }
  forgotPassword(email: string): Observable<ServiceResponse<boolean>> {
    return this.http.post<ServiceResponse<boolean>>(`${this.url}/api/Auth/ForgotPassword`, { email });
  }
  resetPassword(token: string, password: string): Observable<ServiceResponse<boolean>> {
    return this.http.post<ServiceResponse<boolean>>(`${this.url}/api/Auth/ResetPassword`, { token, password });
  }
  /** Ask the API to email a one-time passwordless sign-in link. */
  requestMagicLink(email: string): Observable<ServiceResponse<boolean>> {
    return this.http.post<ServiceResponse<boolean>>(`${this.url}/api/Auth/MagicLink`, { email });
  }
  /** Exchange a magic-link token for a session. */
  magicLogin(token: string): Observable<ServiceResponse<TokenModel>> {
    return this.http.post<ServiceResponse<TokenModel>>(`${this.url}/api/Auth/MagicLogin`, { token });
  }
  /** Activate an account from the emailed 24h verification link (returns a session on success). */
  confirmEmail(token: string): Observable<ServiceResponse<TokenModel>> {
    return this.http.post<ServiceResponse<TokenModel>>(`${this.url}/api/Auth/ConfirmEmail`, { token });
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

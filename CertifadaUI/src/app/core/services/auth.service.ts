import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceResponse } from '../../models/ServiceResponse';
import { TokenModel } from '../../models/User';
const Url = environment.apiURL;
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _apiLogin = `${Url}/api/AuthInvestor/Token`;
  private _apiGoogleUrl = `${Url}/api/Auth/GoogleUrl`;
  private _apiFacebookUrl = `${Url}/api/Auth/FacebookUrl`;
  private _apiMicrosoftUrl = `${Url}/api/Auth/MicrosoftUrl`;
  constructor(private _http: HttpClient) {}
  login(
    username: string,
    password: string
  ): Observable<ServiceResponse<TokenModel>> {
    return this._http.post<ServiceResponse<TokenModel>>(this._apiLogin, {
      userName: username,
      password,
    });
  }
  get accessToken(): TokenModel | null {
    const tokenStr = localStorage.getItem('access_token');
    return tokenStr ? (JSON.parse(tokenStr) as TokenModel) : null;
  }
  set accessToken(token: TokenModel | null) {
    if (token) {
      localStorage.setItem('access_token', JSON.stringify(token));
    } else {
      localStorage.removeItem('access_token');
    }
  }
  get userActions(): string[] {
    const token = this.accessToken;
    return token?.userActions || [];
  }
  get isAuthenticated(): boolean {
    const token = this.accessToken;
    return !!token && new Date(token.expiration) > new Date();
  }
  isTokenValid(token: TokenModel): boolean {
    if (!token?.token || !token?.expiration) return false;

    const expiryDate = new Date(token.expiration);
    return expiryDate > new Date();
  }
  signOut(): void {
    localStorage.removeItem('access_token');
  }
  loginWithGoogle() {
    const returnUrl = encodeURIComponent(
      window.location.origin + '/auth/login'
    );
    window.location.href = `${this._apiGoogleUrl}?returnUrl=${returnUrl}`;
  }
  loginWithFacebook() {
    const returnUrl = encodeURIComponent(
      window.location.origin + '/auth/login'
    );
    window.location.href = `${this._apiFacebookUrl}?returnUrl=${returnUrl}`;
  }
  loginWithMicrosoft() {
    const returnUrl = encodeURIComponent(
      window.location.origin + '/auth/login'
    );
    window.location.href = `${this._apiMicrosoftUrl}?returnUrl=${returnUrl}`;
  }
}

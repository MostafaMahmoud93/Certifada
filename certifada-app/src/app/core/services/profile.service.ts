import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Shape of GET api/User/GetCurrentUser (returned unwrapped by the controller). */
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  userRole?: string | null;
  profilePictureURL?: string | null;
  signeePictureURL?: string | null;
  isActive?: boolean;
  tenantName?: string | null;
  joinedOn?: string | null;
  emailConfirmed?: boolean;
}

/**
 * The signed-in user's REAL profile — single source of truth for the greeting,
 * avatars and the Settings → Profile section. Loads from the API on startup
 * (token fields are the instant fallback) and refreshes after every edit.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private url = environment.apiURL;

  readonly profile = signal<UserProfile | null>(null);
  readonly loading = signal(false);

  constructor() {
    if (this.auth.isAuthenticated()) this.load();
  }

  load(): void {
    this.loading.set(true);
    this.http.get<UserProfile | null>(`${this.url}/api/User/GetCurrentUser`).subscribe({
      next: (p) => { this.loading.set(false); if (p?.id) this.profile.set(p); },
      error: () => this.loading.set(false),
    });
  }

  /** Display name: API profile → token name → email prefix → 'there'. */
  readonly displayName = computed(() => {
    const n = this.profile()?.fullName || this.auth.userName;
    return (n || 'there').trim();
  });
  readonly email = computed(() => this.profile()?.email || this.auth.email || '');
  readonly initials = computed(() => {
    const parts = this.displayName().split(/[\s.@_-]+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'U';
  });
  /** Absolute avatar URL (photos are served from the API's wwwroot). */
  readonly avatarUrl = computed<string | null>(() => {
    const pic = this.profile()?.profilePictureURL;
    if (!pic) return null;
    return /^https?:\/\//i.test(pic) ? pic : `${this.url}/${pic.replace(/^\/+/, '')}`;
  });
  readonly role = computed(() => this.profile()?.userRole || '');
  readonly tenantName = computed(() => this.profile()?.tenantName || '');
  readonly joinedOn = computed(() => this.profile()?.joinedOn ? new Date(this.profile()!.joinedOn!) : null);
  readonly emailVerified = computed(() => !!this.profile()?.emailConfirmed);

  /** Save the display name to the database, then refresh. */
  updateName(fullName: string): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(`${this.url}/api/User/UpdateProfile`, { fullName })
      .pipe(tap((res) => { if (res?.success) this.load(); }));
  }

  /** Upload a new profile photo, then refresh. */
  uploadAvatar(file: File): Observable<{ success: boolean; message?: string }> {
    const form = new FormData();
    form.append('ProfilePicture', file);
    return this.http.post<{ success: boolean; message?: string }>(`${this.url}/api/User/UpdateImgeProfileUser`, form)
      .pipe(tap((res) => { if (res?.success) this.load(); }));
  }

  /** Absolute signature URL from the users table. */
  readonly signatureUrl = computed<string | null>(() => {
    const pic = this.profile()?.signeePictureURL;
    if (!pic) return null;
    return /^https?:\/\//i.test(pic) ? pic : `${this.url}/${pic.replace(/^\/+/, '')}`;
  });

  /** Persist a drawn/typed signature (data URL) to Users.Signature_URL. */
  uploadSignature(dataUrl: string): Observable<{ success: boolean; message?: string }> {
    const blob = this.dataUrlToBlob(dataUrl);
    const form = new FormData();
    form.append('signaturePicture', blob, 'signature.png');
    return this.http.post<{ success: boolean; message?: string }>(`${this.url}/api/User/UpdateSignature`, form)
      .pipe(tap((res) => { if (res?.success) this.load(); }));
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const [head, body] = dataUrl.split(',');
    const mime = /data:([^;]+)/.exec(head)?.[1] || 'image/png';
    const bin = atob(body);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
}

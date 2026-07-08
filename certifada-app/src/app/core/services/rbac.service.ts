import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { ALL_PERMISSION_CODES, PERMISSION_IMPLIES, PERMISSION_SCREENS, SENSITIVE_CODES } from '../rbac/permission-catalog';
import { SYSTEM_ROLE_TEMPLATES } from '../rbac/system-roles.seed';

export interface RbacRole {
  id: string;
  tenantId: string;
  name: string;
  desc: string;
  isSystem: boolean;
  systemKey?: string;
  color: string;
  permissions: string[];
  createdAt: string;
  members?: number;
}
export interface UserRoleLink { userId: string; roleId: string; }

interface Api<T> { success: boolean; message: string; data: T; }

/**
 * RBAC — now backed by the API. Roles + their granted permission codes are read
 * from GET /api/Role/GetRoles, the permission catalogue (code -> Guid) from
 * GET /api/RoleAction/GetPermissions, and every change is persisted through the
 * backend (AddEditRoleAction / CreateRole / EditRole / DeleteRole / AssignUserRole).
 * Live gating uses the signed-in user's token codes (which the backend derives from
 * their role); "preview as role" overrides that with a chosen role's codes.
 */
@Injectable({ providedIn: 'root' })
export class RbacService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private readonly url = environment.apiURL;

  readonly screens = PERMISSION_SCREENS;
  readonly allCodes = ALL_PERMISSION_CODES;
  readonly total = ALL_PERMISSION_CODES.length;

  readonly roles = signal<RbacRole[]>([]);
  readonly userRoles = signal<UserRoleLink[]>([]);
  readonly previewRoleId = signal<string | null>(null);
  readonly loading = signal<boolean>(true);

  /** permission code -> backend Permission Guid (needed for AddEditRoleAction). */
  private codeToId = new Map<string, string>();

  constructor() { this.reload(); }

  // ---------- load from DB ----------
  reload(): void {
    this.loading.set(true);
    this.http.get<Api<{ screenKey: string; actions: { id: string; code: string }[] }[]>>(`${this.url}/api/RoleAction/GetPermissions`).subscribe({
      next: (res) => {
        this.codeToId.clear();
        for (const s of res?.data ?? []) for (const a of s.actions ?? []) this.codeToId.set(a.code, a.id);
        this.fetchRoles((rs) => { this.roles.set(rs); this.loading.set(false); });
      },
      error: () => { this.seedFallback(); this.loading.set(false); },
    });
  }
  private fetchRoles(done: (roles: RbacRole[]) => void): void {
    this.http.get<Api<{ length: number; collection: any[] }>>(`${this.url}/api/Role/GetRoles`).subscribe({
      next: (res) => done((res?.data?.collection ?? []).map((r) => this.toRole(r))),
      error: () => done(this.seedRoles()),
    });
  }
  private toRole(r: any): RbacRole {
    return { id: r.roleId, tenantId: '', name: r.name, desc: r.description ?? '', isSystem: !!r.isSystem, color: this.colorFor(r.name), permissions: r.codes ?? [], createdAt: '', members: r.members ?? 0 };
  }
  private seedFallback(): void { this.roles.set(this.seedRoles()); }
  private seedRoles(): RbacRole[] {
    return SYSTEM_ROLE_TEMPLATES.map((t) => ({ id: 'sys-' + t.key, tenantId: '', name: t.name, desc: t.desc, isSystem: true, systemKey: t.key, color: t.color, permissions: [...t.codes], createdAt: '', members: 0 }));
  }
  private colorFor(name: string): string {
    const known = SYSTEM_ROLE_TEMPLATES.find((t) => t.name.toLowerCase() === (name || '').toLowerCase());
    if (known) return known.color;
    let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return `hsl(${h}, 60%, 50%)`;
  }

  // ---------- dependency graph ----------
  requiredBy(code: string): string[] {
    const out = new Set<string>();
    const walk = (c: string) => (PERMISSION_IMPLIES[c] ?? []).forEach((d) => { if (!out.has(d)) { out.add(d); walk(d); } });
    walk(code); return [...out];
  }
  dependentsOf(code: string): string[] { return this.allCodes.filter((x) => this.requiredBy(x).includes(code)); }
  isSensitiveCodes(codes: string[]): boolean { return SENSITIVE_CODES.some((c) => codes.includes(c)); }
  private withDeps(codes: string[]): string[] { return [...new Set(codes.flatMap((c) => [c, ...this.requiredBy(c)]))]; }

  // ---------- queries ----------
  role(id: string): RbacRole | undefined { return this.roles().find((r) => r.id === id); }
  systemRole(key: string): RbacRole | undefined { return this.roles().find((r) => r.systemKey === key || r.name.toLowerCase() === key.toLowerCase()); }
  private update(id: string, fn: (r: RbacRole) => RbacRole): void { this.roles.update((l) => l.map((r) => (r.id === id ? fn(r) : r))); }
  private newId(): string { return 'tmp-' + Math.random().toString(36).slice(2, 9); }
  private palette = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6'];

  // ---------- persistence helpers ----------
  private persistPerm(roleId: string, code: string, isAdd: boolean): void {
    const actionId = this.codeToId.get(code);
    if (!actionId || roleId.startsWith('tmp-')) return;
    this.http.post(`${this.url}/api/RoleAction/AddEditRoleAction`, { roleId, actionId, isAdd }).subscribe({ error: () => this.reload() });
  }
  /** Optimistically set a role's full permission set + persist the add/remove delta. */
  private applyPermissions(r: RbacRole, nextCodes: string[]): void {
    if (r.isSystem) return;
    const cur = new Set(r.permissions); const next = new Set(nextCodes);
    const added = [...next].filter((c) => !cur.has(c));
    const removed = [...cur].filter((c) => !next.has(c));
    this.update(r.id, (x) => ({ ...x, permissions: [...next] }));
    for (const c of added) this.persistPerm(r.id, c, true);
    for (const c of removed) this.persistPerm(r.id, c, false);
  }

  // ---------- role CRUD ----------
  togglePermission(id: string, code: string): void {
    const r = this.role(id); if (!r || r.isSystem) return;
    let next: string[];
    if (r.permissions.includes(code)) { const drop = new Set([code, ...this.dependentsOf(code)]); next = r.permissions.filter((c) => !drop.has(c)); }
    else next = [...new Set([...r.permissions, code, ...this.requiredBy(code)])];
    this.applyPermissions(r, next);
  }
  toggleScreen(id: string, codes: string[]): void {
    const r = this.role(id); if (!r || r.isSystem) return;
    const all = codes.every((c) => r.permissions.includes(c));
    let next: string[];
    if (all) { const drop = new Set([...codes, ...codes.flatMap((c) => this.dependentsOf(c))]); next = r.permissions.filter((c) => !drop.has(c)); }
    else next = [...new Set([...r.permissions, ...codes, ...codes.flatMap((c) => this.requiredBy(c))])];
    this.applyPermissions(r, next);
  }
  setPermissions(id: string, codes: string[]): void {
    const r = this.role(id); if (!r || r.isSystem) return;
    this.applyPermissions(r, this.withDeps(codes));
  }
  rename(id: string, name: string, desc: string): void {
    const r = this.role(id); if (!r || r.isSystem) return;
    this.update(id, (x) => ({ ...x, name, desc }));
    if (!id.startsWith('tmp-')) this.http.post(`${this.url}/api/Role/EditRole`, { roleId: id, name, description: desc }).subscribe({ error: () => this.reload() });
  }
  createRole(name = 'New role', codes: string[] = []): RbacRole {
    const temp: RbacRole = { id: this.newId(), tenantId: '', name, desc: '', isSystem: false, color: this.palette[this.roles().length % this.palette.length], permissions: this.withDeps(codes), createdAt: '', members: 0 };
    this.roles.update((l) => [...l, temp]);
    this.http.post(`${this.url}/api/Role/CreateRole`, { name }).subscribe({
      next: () => this.reloadThenApply(name, temp.permissions),
      error: () => this.reload(),
    });
    return temp;
  }
  cloneRole(src: RbacRole): RbacRole { return this.createRole(src.name + ' (copy)', [...src.permissions]); }
  private reloadThenApply(name: string, codes: string[]): void {
    this.fetchRoles((rs) => {
      this.roles.set(rs);
      const created = rs.filter((r) => r.name === name).slice(-1)[0];
      if (created && codes.length) this.setPermissions(created.id, codes);
    });
  }
  deleteRole(id: string): void {
    const r = this.role(id); if (!r || r.isSystem) return;
    this.roles.update((l) => l.filter((x) => x.id !== id));
    if (this.previewRoleId() === id) this.previewRoleId.set(null);
    if (!id.startsWith('tmp-')) this.http.post(`${this.url}/api/Role/DeleteRole?id=${id}`, {}).subscribe({ error: () => this.reload() });
  }

  // ---------- UserRoles ----------
  roleIdOfUser(userId: string): string | null { return this.userRoles().find((l) => l.userId === userId)?.roleId ?? null; }
  roleOfUser(userId: string): RbacRole | null { const id = this.roleIdOfUser(userId); return id ? (this.role(id) ?? null) : null; }
  setUserRole(userId: string, roleId: string): void {
    this.userRoles.update((l) => [...l.filter((x) => x.userId !== userId), { userId, roleId }]);
    if (!roleId.startsWith('tmp-')) this.http.post(`${this.url}/api/RoleAction/AssignUserRole`, { userId, roleId }).subscribe({ error: () => {} });
  }
  removeUserRole(userId: string): void { this.userRoles.update((l) => l.filter((x) => x.userId !== userId)); }
  membersOf(roleId: string): number { return this.role(roleId)?.members ?? this.userRoles().filter((l) => l.roleId === roleId).length; }
  effectiveCodes(userId: string): string[] { return this.roleOfUser(userId)?.permissions ?? []; }

  // ---------- current user + live gating ----------
  get currentUserId(): string { return (this.auth.email || this.auth.userName || 'me').toLowerCase(); }
  readonly currentRole = computed<RbacRole | null>(() => this.systemRole('owner') ?? null);
  /** Codes the UI enforces now: preview role if active, else the signed-in user's token codes. */
  readonly gateCodes = computed<string[]>(() => {
    const pid = this.previewRoleId();
    if (pid) return this.role(pid)?.permissions ?? [];
    const tok = this.auth.userActions ?? [];
    return tok.length ? tok : [...ALL_PERMISSION_CODES];
  });
  readonly isPreviewing = computed(() => !!this.previewRoleId());
  readonly previewRole = computed<RbacRole | null>(() => { const id = this.previewRoleId(); return id ? (this.role(id) ?? null) : null; });
  startPreview(id: string): void { this.previewRoleId.set(id); }
  stopPreview(): void { this.previewRoleId.set(null); }
}

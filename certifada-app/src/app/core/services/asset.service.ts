import { Injectable, signal } from '@angular/core';

/** One image in the user's personal asset library (shared across every template). */
export interface UserAsset {
  id: string;
  name: string;
  dataUrl: string;
  size: number;
  type: string;
  addedAt: number;
  /** Source folder name (when uploaded from a folder); undefined = an individual asset. */
  folder?: string;
}

/** A file queued for import, optionally with the folder it came from. */
export interface AssetEntry { file: File; folder?: string; }

const DB_NAME = 'certifada-assets';
const STORE = 'assets';
export const MAX_ASSET_BYTES = 500 * 1024; // 500 KB per image

/**
 * Personal image library, persisted in IndexedDB so it survives reloads and is
 * available in every template the user opens. Stored as data-URLs so they drop
 * straight onto the canvas with no network round-trip.
 */
@Injectable({ providedIn: 'root' })
export class AssetService {
  /** Reactive list, newest first. */
  readonly assets = signal<UserAsset[]>([]);
  readonly ready = signal(false);
  private dbp: Promise<IDBDatabase | null>;

  constructor() {
    this.dbp = this.open();
    void this.refresh();
  }

  private open(): Promise<IDBDatabase | null> {
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private async store(mode: IDBTransactionMode): Promise<IDBObjectStore | null> {
    const db = await this.dbp;
    if (!db) return null;
    return db.transaction(STORE, mode).objectStore(STORE);
  }

  /** Load the library from IndexedDB into the signal. */
  async refresh(): Promise<void> {
    const store = await this.store('readonly');
    if (!store) { this.ready.set(true); return; }
    const req = store.getAll();
    req.onsuccess = () => {
      const list = ((req.result as UserAsset[]) || []).sort((a, b) => b.addedAt - a.addedAt);
      this.assets.set(list);
      this.ready.set(true);
    };
    req.onerror = () => this.ready.set(true);
  }

  /** Validate + store one image (optionally tagged with a folder). Returns an error, or null. */
  async add(file: File, folder?: string): Promise<string | null> {
    if (!/^image\//i.test(file.type)) return `“${file.name}” isn't an image`;
    if (file.size > MAX_ASSET_BYTES) return `“${file.name}” is ${this.kb(file.size)} — max is 500 KB`;
    let dataUrl: string;
    try { dataUrl = await this.readDataUrl(file); } catch { return `Couldn't read “${file.name}”`; }
    const asset: UserAsset = {
      id: `a_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
      name: file.name, dataUrl, size: file.size, type: file.type, addedAt: Date.now(),
      folder: folder || undefined,
    };
    const store = await this.store('readwrite');
    if (!store) return 'Asset storage is unavailable in this browser';
    store.put(asset);
    this.assets.update((a) => [asset, ...a]);
    return null;
  }

  /** Add many files (multi-select). Non-images are silently skipped. */
  async addFiles(files: ArrayLike<File>, folder?: string): Promise<{ added: number; tooBig: number; errors: string[] }> {
    return this.addEntries(Array.from(files as any as File[]).map((file) => ({ file, folder })));
  }

  /** Add a batch of entries, each optionally tagged with its source folder. */
  async addEntries(entries: AssetEntry[]): Promise<{ added: number; tooBig: number; errors: string[] }> {
    let added = 0, tooBig = 0;
    const errors: string[] = [];
    for (const { file, folder } of entries) {
      if (!file || !/^image\//i.test(file.type)) continue;        // skip non-images quietly (common in folders)
      if (file.size > MAX_ASSET_BYTES) { tooBig++; continue; }
      const err = await this.add(file, folder);
      if (err) errors.push(err); else added++;
    }
    return { added, tooBig, errors };
  }

  /** Remove every asset in a folder. */
  async removeFolder(folder: string): Promise<void> {
    const ids = this.assets().filter((a) => a.folder === folder).map((a) => a.id);
    const store = await this.store('readwrite');
    if (store) ids.forEach((id) => store.delete(id));
    this.assets.update((a) => a.filter((x) => x.folder !== folder));
  }

  async remove(id: string): Promise<void> {
    const store = await this.store('readwrite');
    if (store) store.delete(id);
    this.assets.update((a) => a.filter((x) => x.id !== id));
  }

  async clear(): Promise<void> {
    const store = await this.store('readwrite');
    if (store) store.clear();
    this.assets.set([]);
  }

  /** Total bytes used by the library. */
  totalBytes(): number { return this.assets().reduce((s, a) => s + a.size, 0); }
  kb(bytes: number): string { return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`; }

  private readDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
}

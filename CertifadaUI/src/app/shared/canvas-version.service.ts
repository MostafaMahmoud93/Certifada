import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';

export interface CanvasVersion {
  id?: number;
  json: any;
  createdAt: number;
}

/** Persists canvas auto-save versions in IndexedDB via Dexie. */
@Injectable({ providedIn: 'root' })
export class CanvasVersionService extends Dexie {
  versions!: Table<CanvasVersion, number>;

  constructor() {
    super('CertifadaCanvasVersions');
    this.version(1).stores({ versions: '++id,createdAt' });
  }

  async saveVersion(json: any): Promise<number> {
    return this.versions.add({ json, createdAt: Date.now() });
  }

  async getVersions(): Promise<CanvasVersion[]> {
    return this.versions.orderBy('createdAt').toArray();
  }

  async deleteVersion(id: number): Promise<void> {
    await this.versions.delete(id);
  }
}

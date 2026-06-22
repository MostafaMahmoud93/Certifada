import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { TemplateService } from '../../core/services/template.service';
import { CertificateService } from '../../core/services/certificate.service';
import { TemplateDetail, BatchItem } from '../../core/models/models';
import { mergeDataIntoJson, applySignature, renderJsonToPng } from '../../core/utils/render.util';
import { expandDynamicTablesInJson } from '../designer/fabric-canvas.service';
import { createZipBlob, base64ToBytes, ZipEntry } from '../../core/utils/zip.util';

type ExportFormat = 'png-zip' | 'pdf-zip' | 'pdf-single';

@Component({
  selector: 'app-bulk',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './bulk.component.html',
  styleUrl: './bulk.component.scss',
})
export class BulkComponent {
  private route = inject(ActivatedRoute);
  private templates = inject(TemplateService);
  private certificates = inject(CertificateService);

  template = signal<TemplateDetail | null>(null);
  placeholders = signal<string[]>([]);
  columns = signal<string[]>([]);
  rows = signal<Record<string, string>[]>([]);
  mapping = signal<Record<string, string>>({});
  nameField = signal<string>('');

  // Dynamic (roster) table: every data row becomes one row inside a single certificate.
  dynamicTable = signal<{ cols: number; colKeys: string[]; headers: string[] } | null>(null);
  rosterMode = true;
  tableMapping = signal<Record<string, string>>({});

  format: ExportFormat = 'png-zip';
  storeImages = false;
  saveToHistory = true;

  previewUrl = signal<string | null>(null);
  generating = signal(false);
  progress = signal({ done: 0, total: 0 });
  error = signal('');

  readonly rowCount = computed(() => this.rows().length);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (id) this.loadTemplate(id);
  }

  private loadTemplate(id: string): void {
    this.templates.get(id).subscribe({
      next: (t) => {
        this.template.set(t);
        let ph: string[] = [];
        try { ph = JSON.parse(t.placeholdersJson); } catch { ph = []; }
        this.placeholders.set(ph);
        this.nameField.set(ph[0] ?? '');
        const dt = this.detectDynamicTable(t.canvasJson);
        this.dynamicTable.set(dt);
        this.rosterMode = !!dt;
        this.initManual();
      },
      error: () => this.error.set('Could not load the template.'),
    });
  }

  /** Start with a manual grid whose columns are the placeholders (+ any dynamic-table columns). */
  private initManual(): void {
    const ph = this.placeholders();
    const dt = this.dynamicTable();
    const cols = [...ph, ...(dt ? dt.colKeys.filter((k) => !ph.includes(k)) : [])];
    this.columns.set(cols);
    this.mapping.set(Object.fromEntries(ph.map((p) => [p, p])));
    if (dt) this.tableMapping.set(Object.fromEntries(dt.colKeys.map((k) => [k, cols.find((c) => c.toLowerCase() === k.toLowerCase()) ?? k])));
    this.rows.set([Object.fromEntries(cols.map((p) => [p, '']))]);
  }

  /** Find the first dynamic table in the template and read its column keys + header titles. */
  private detectDynamicTable(json: string): { cols: number; colKeys: string[]; headers: string[] } | null {
    try {
      const root = JSON.parse(json);
      const walk = (arr: any[]): any => {
        for (const o of arr ?? []) {
          if (o?.objType === 'table' && o.tableSpec?.dynamic) return o.tableSpec;
          if (Array.isArray(o?.objects)) { const f = walk(o.objects); if (f) return f; }
        }
        return null;
      };
      const spec = walk(root?.objects ?? []);
      if (!spec) return null;
      const cols = spec.cols ?? (spec.colKeys?.length || 0);
      if (!cols) return null;
      const colKeys: string[] = (spec.colKeys ?? Array.from({ length: cols }, (_, c) => `col_${c + 1}`)).slice(0, cols);
      const headers: string[] = spec.opts?.showHeader && Array.isArray(spec.cells?.[0]) ? spec.cells[0].slice(0, cols) : colKeys;
      return { cols, colKeys, headers };
    } catch { return null; }
  }
  setTableMapping(colKey: string, column: string): void {
    this.tableMapping.update((m) => ({ ...m, [colKey]: column }));
  }

  // ----------------------------- file import -----------------------------
  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.error.set('');
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (['csv', 'txt', 'xlsx', 'xls'].includes(ext)) this.parseSpreadsheet(file);
    else this.error.set('Unsupported file. Use .csv, .xlsx or .xls');
    (event.target as HTMLInputElement).value = '';
  }

  /** Parse CSV or Excel via SheetJS (xlsx auto-detects the format). */
  private async parseSpreadsheet(file: File): Promise<void> {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '', raw: false });
      const cols = json.length ? Object.keys(json[0]) : [];
      this.applyData(cols, json);
    } catch {
      this.error.set('Failed to read the file. Use .csv, .xlsx or .xls');
    }
  }

  private applyData(cols: string[], data: Record<string, string>[]): void {
    const cleanCols = cols.filter((c) => c && c.trim().length);
    this.columns.set(cleanCols);
    this.rows.set(data.map((r) => ({ ...r })));
    // Auto-map placeholders to same-named columns (case-insensitive).
    const map: Record<string, string> = {};
    for (const ph of this.placeholders()) {
      const hit = cleanCols.find((c) => c.toLowerCase() === ph.toLowerCase());
      map[ph] = hit ?? cleanCols[0] ?? '';
    }
    this.mapping.set(map);
    const dt = this.dynamicTable();
    if (dt) {
      const tm: Record<string, string> = {};
      for (const k of dt.colKeys) tm[k] = cleanCols.find((c) => c.toLowerCase() === k.toLowerCase()) ?? cleanCols[0] ?? '';
      this.tableMapping.set(tm);
    }
    if (!cleanCols.includes(this.nameField())) {
      this.nameField.set(this.mapping()[this.placeholders()[0]] ?? cleanCols[0] ?? '');
    }
  }

  setMapping(placeholder: string, column: string): void {
    this.mapping.update((m) => ({ ...m, [placeholder]: column }));
  }

  // --------------------------- manual editing ----------------------------
  addRow(): void {
    this.rows.update((rows) => [...rows, Object.fromEntries(this.columns().map((c) => [c, '']))]);
  }
  removeRow(i: number): void {
    this.rows.update((rows) => rows.filter((_, idx) => idx !== i));
  }
  updateCell(i: number, col: string, value: string): void {
    this.rows.update((rows) => rows.map((r, idx) => (idx === i ? { ...r, [col]: value } : r)));
  }

  private dataForRow(row: Record<string, string>): Record<string, string> {
    const data: Record<string, string> = {};
    for (const ph of this.placeholders()) {
      data[ph] = String(row[this.mapping()[ph]] ?? '');
    }
    return data;
  }

  /** The issuer's saved signature (profile) — injected into signature objects at generation. */
  private profileSignature(): string | null { try { return localStorage.getItem('cf-signature'); } catch { return null; } }
  /** Merge row data, then swap every signature object's image for the issuer's signature. */
  private mergedJson(canvasJson: string, data: Record<string, string>): string {
    return applySignature(mergeDataIntoJson(canvasJson, data), this.profileSignature());
  }

  // ------------------------------- preview --------------------------------
  async preview(): Promise<void> {
    const t = this.template();
    const first = this.rows()[0];
    if (!t || !first) return;
    const merged = this.mergedJson(t.canvasJson, this.dataForRow(first));
    this.previewUrl.set(await renderJsonToPng(merged, t.width, t.height, 1.5));
  }

  // ------------------------------ generation ------------------------------
  async generate(): Promise<void> {
    if (this.rosterMode && this.dynamicTable()) { await this.generateRoster(); return; }
    const t = this.template();
    if (!t) return;
    const rows = this.rows().filter((r) => Object.values(r).some((v) => `${v}`.trim().length));
    if (!rows.length) { this.error.set('Add at least one data row.'); return; }

    this.error.set('');
    this.generating.set(true);
    this.progress.set({ done: 0, total: rows.length });

    try {
      const historyItems: BatchItem[] = [];
      const usedNames = new Map<string, number>();

      if (this.format === 'pdf-single') {
        const doc = new jsPDF({
          orientation: t.width >= t.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [t.width, t.height],
          compress: true,
        });
        for (let i = 0; i < rows.length; i++) {
          const data = this.dataForRow(rows[i]);
          const png = await renderJsonToPng(this.mergedJson(t.canvasJson, data), t.width, t.height, 2);
          if (i > 0) doc.addPage([t.width, t.height], t.width >= t.height ? 'landscape' : 'portrait');
          doc.addImage(png, 'PNG', 0, 0, t.width, t.height);
          historyItems.push(this.toHistoryItem(data, this.storeImages ? png : null));
          this.progress.set({ done: i + 1, total: rows.length });
        }
        doc.save(`${this.fileBase()}.pdf`);
      } else {
        const entries: ZipEntry[] = [];
        for (let i = 0; i < rows.length; i++) {
          const data = this.dataForRow(rows[i]);
          const merged = this.mergedJson(t.canvasJson, data);
          const png = await renderJsonToPng(merged, t.width, t.height, 2);
          const fname = this.uniqueName(data, i, usedNames);

          if (this.format === 'png-zip') {
            entries.push({ name: `${fname}.png`, data: base64ToBytes(png.split(',')[1]) });
          } else {
            const doc = new jsPDF({
              orientation: t.width >= t.height ? 'landscape' : 'portrait',
              unit: 'px',
              format: [t.width, t.height],
              compress: true,
            });
            doc.addImage(png, 'PNG', 0, 0, t.width, t.height);
            entries.push({ name: `${fname}.pdf`, data: new Uint8Array(doc.output('arraybuffer')) });
          }
          historyItems.push(this.toHistoryItem(data, this.storeImages ? png : null));
          this.progress.set({ done: i + 1, total: rows.length });
        }
        saveAs(createZipBlob(entries), `${this.fileBase()}.zip`);
      }

      if (this.saveToHistory) {
        this.certificates
          .saveBatch({ templateId: t.id, format: this.format.startsWith('pdf') ? 'pdf' : 'png', items: historyItems })
          .subscribe();
      }
    } catch (e) {
      console.error(e);
      this.error.set('Generation failed. See console for details.');
    } finally {
      this.generating.set(false);
    }
  }

  /** Roster mode: all data rows become rows inside ONE certificate (the dynamic table expands). */
  async generateRoster(): Promise<void> {
    const t = this.template();
    const dt = this.dynamicTable();
    if (!t || !dt) return;
    const rows = this.rows().filter((r) => Object.values(r).some((v) => `${v}`.trim().length));
    if (!rows.length) { this.error.set('Add at least one data row.'); return; }

    this.error.set('');
    this.generating.set(true);
    this.progress.set({ done: 0, total: 1 });
    try {
      const list = rows.map((row) => dt.colKeys.map((k) => String(row[this.tableMapping()[k]] ?? '')));
      const scalars = this.dataForRow(rows[0]);                       // single-value fields use the first row
      let json = await expandDynamicTablesInJson(t.canvasJson, list); // grow the table to one row per item
      json = this.mergedJson(json, scalars);                          // fill {{name}}, {{date}}, … + signature
      const png = await renderJsonToPng(json, t.width, t.height, 2);
      const base = this.fileBase();

      if (this.format.startsWith('pdf')) {
        const doc = new jsPDF({ orientation: t.width >= t.height ? 'landscape' : 'portrait', unit: 'px', format: [t.width, t.height], compress: true });
        doc.addImage(png, 'PNG', 0, 0, t.width, t.height);
        doc.save(`${base}.pdf`);
      } else {
        saveAs(new Blob([base64ToBytes(png.split(',')[1])], { type: 'image/png' }), `${base}.png`);
      }
      this.progress.set({ done: 1, total: 1 });
      this.previewUrl.set(png);

      if (this.saveToHistory) {
        this.certificates
          .saveBatch({ templateId: t.id, format: this.format.startsWith('pdf') ? 'pdf' : 'png', items: [this.toHistoryItem(scalars, this.storeImages ? png : null)] })
          .subscribe();
      }
    } catch (e) {
      console.error(e);
      this.error.set('Generation failed. See console for details.');
    } finally {
      this.generating.set(false);
    }
  }

  private toHistoryItem(data: Record<string, string>, file: string | null): BatchItem {
    return {
      recipientName: data[this.nameField()] || 'certificate',
      dataJson: JSON.stringify(data),
      fileDataUrl: file,
    };
  }

  private uniqueName(data: Record<string, string>, index: number, used: Map<string, number>): string {
    let base = (data[this.nameField()] || `certificate_${index + 1}`)
      .replace(/[^a-z0-9_\- ]/gi, '')
      .replace(/\s+/g, '_') || `certificate_${index + 1}`;
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  }

  private fileBase(): string {
    return (this.template()?.name || 'certificates').replace(/[^a-z0-9_\- ]/gi, '').replace(/\s+/g, '_');
  }
}

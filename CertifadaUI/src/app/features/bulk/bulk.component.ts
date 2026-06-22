import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { TemplateService } from '../../core/template.service';
import { CertificateService } from '../../core/certificate.service';
import { TemplateDetail, BatchItem } from '../../core/models';
import { mergeDataIntoJson, renderJsonToPng } from '../../core/render.util';
import { createZipBlob, base64ToBytes, ZipEntry } from '../../core/zip.util';

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

  format: ExportFormat = 'png-zip';
  storeImages = false;
  saveToHistory = true;

  previewUrl = signal<string | null>(null);
  generating = signal(false);
  progress = signal({ done: 0, total: 0 });
  error = signal('');

  readonly rowCount = computed(() => this.rows().length);

  constructor() {
    const id = +(this.route.snapshot.paramMap.get('id') ?? 0);
    if (id) this.loadTemplate(id);
  }

  private loadTemplate(id: number): void {
    this.templates.get(id).subscribe({
      next: (t) => {
        this.template.set(t);
        let ph: string[] = [];
        try { ph = JSON.parse(t.placeholdersJson); } catch { ph = []; }
        this.placeholders.set(ph);
        this.nameField.set(ph[0] ?? '');
        this.initManual();
      },
      error: () => this.error.set('Could not load the template.'),
    });
  }

  /** Start with a manual grid whose columns are the placeholders themselves. */
  private initManual(): void {
    const ph = this.placeholders();
    this.columns.set([...ph]);
    this.mapping.set(Object.fromEntries(ph.map((p) => [p, p])));
    this.rows.set([Object.fromEntries(ph.map((p) => [p, '']))]);
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

  // ------------------------------- preview --------------------------------
  async preview(): Promise<void> {
    const t = this.template();
    const first = this.rows()[0];
    if (!t || !first) return;
    const merged = mergeDataIntoJson(t.canvasJson, this.dataForRow(first));
    this.previewUrl.set(await renderJsonToPng(merged, t.width, t.height, 1.5));
  }

  // ------------------------------ generation ------------------------------
  async generate(): Promise<void> {
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
          const png = await renderJsonToPng(mergeDataIntoJson(t.canvasJson, data), t.width, t.height, 2);
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
          const merged = mergeDataIntoJson(t.canvasJson, data);
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

import { Injectable, inject } from '@angular/core';
import * as XLSX from 'xlsx-js-style';
import { BrandService } from './brand.service';

export type ExcelColType = 'text' | 'number' | 'date' | 'status' | 'email';
export interface ExcelColumn {
  key: string;
  label: string;
  type?: ExcelColType;
  width?: number;
  align?: 'left' | 'center' | 'right';
}
export interface ExcelExportOptions {
  fileName: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
  columns?: ExcelColumn[];
  summary?: { label: string; value: string | number }[];
  brandColor?: string;
}

/**
 * Creative, fully-styled .xlsx export (powered by xlsx-js-style).
 * Produces a branded report: colour-banded title banner, KPI strip, a bold
 * brand-coloured & filterable header, zebra striping, status-coloured cells,
 * smart number/date formatting, auto-fit columns and a signed footer.
 */
@Injectable({ providedIn: 'root' })
export class ExcelExportService {
  private brand = inject(BrandService);

  export(rows: any[], options: ExcelExportOptions): void {
    if (!rows || !rows.length) return;

    const columns: ExcelColumn[] = options.columns?.length
      ? options.columns
      : Object.keys(rows[0]).map((k) => ({ key: k, label: this.pretty(k) }));
    const C = columns.length;
    const last = C - 1;

    // ---- palette ----
    const brand = this.norm(options.brandColor || (this.isHex(this.brand.kit().primary) ? this.brand.kit().primary : '#4F46E5'));
    const brandDark = this.shade(brand, -0.22);
    const zebra = this.shade(brand, 0.90);          // very light brand tint
    const ink = '111827', muted = '6B7280', line = 'E7E9EE', white = 'FFFFFF', headTx = 'FFFFFF';
    const org = (this.brand.kit().org || '').trim();
    const now = new Date();
    const stamp = now.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    // ---- build the grid (array-of-arrays) ----
    const fill = Array(Math.max(0, C - 1)).fill('');
    const aoa: any[][] = [];
    const heights: { hpt: number }[] = [];
    const merges: XLSX.Range[] = [];
    let r = 0;

    const title = (org ? `${org}  —  ` : '') + (options.title || options.sheetName || 'Report');
    aoa.push([title, ...fill]); merges.push({ s: { r, c: 0 }, e: { r, c: last } }); heights.push({ hpt: 36 }); const rTitle = r++;

    const subParts = [options.subtitle, `Generated ${stamp}`].filter(Boolean);
    aoa.push([subParts.join('      ·      '), ...fill]); merges.push({ s: { r, c: 0 }, e: { r, c: last } }); heights.push({ hpt: 19 }); const rSub = r++;

    let rSum = -1;
    if (options.summary?.length) {
      const txt = options.summary.map((s) => `${s.label.toUpperCase()}:  ${this.fmtNum(s.value)}`).join('        •        ');
      aoa.push([txt, ...fill]); merges.push({ s: { r, c: 0 }, e: { r, c: last } }); heights.push({ hpt: 22 }); rSum = r++;
    }

    aoa.push([{ v: '', s: {} }, ...fill]); heights.push({ hpt: 6 }); const rGap = r++;        // thin spacer

    aoa.push(columns.map((c) => c.label.toUpperCase())); heights.push({ hpt: 24 }); const rHead = r++;

    const rFirst = r;
    for (const item of rows) {
      aoa.push(columns.map((c) => this.value(item[c.key], c.type)));
      heights.push({ hpt: 19 }); r++;
    }
    const rLast = r - 1;

    aoa.push([`${org || 'Certifada'} · ${rows.length} record${rows.length === 1 ? '' : 's'} · exported from Certifada`, ...fill]);
    merges.push({ s: { r, c: 0 }, e: { r, c: last } }); heights.push({ hpt: 16 }); const rFoot = r++;

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = merges;
    ws['!rows'] = heights;
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: rHead, c: 0 }, e: { r: rLast, c: last } }) };

    // ---- column widths (auto-fit, clamped) ----
    ws['!cols'] = columns.map((c, ci) => {
      if (c.width) return { wch: c.width };
      let max = c.label.length;
      for (const item of rows) max = Math.max(max, String(this.value(item[c.key], c.type) ?? '').length);
      const isNum = c.type === 'number';
      return { wch: Math.min(isNum ? 16 : 46, Math.max(isNum ? 8 : 12, max + 3)) };
    });

    // ---- per-cell styling ----
    const thin = (color: string) => ({ style: 'thin', color: { rgb: color } });
    for (const addr in ws) {
      if (addr[0] === '!') continue;
      const cell = XLSX.utils.decode_cell(addr);
      const cr = cell.r, cc = cell.c;
      const col = cr >= rHead ? columns[cc] : null;

      if (cr === rTitle) {
        ws[addr].s = { font: { name: 'Calibri', bold: true, sz: 16, color: { rgb: white } }, fill: solid(brand), alignment: { vertical: 'center', horizontal: 'left', indent: 1 } };
      } else if (cr === rSub) {
        ws[addr].s = { font: { name: 'Calibri', sz: 10, italic: true, color: { rgb: this.shade(brand, 0.78) } }, fill: solid(brandDark), alignment: { vertical: 'center', horizontal: 'left', indent: 1 } };
      } else if (cr === rSum) {
        ws[addr].s = { font: { name: 'Calibri', bold: true, sz: 10, color: { rgb: brandDark } }, fill: solid(zebra), alignment: { vertical: 'center', horizontal: 'left', indent: 1 }, border: { top: thin(line), bottom: thin(line) } };
      } else if (cr === rGap) {
        ws[addr].s = { fill: solid(white) };
      } else if (cr === rHead) {
        ws[addr].s = {
          font: { name: 'Calibri', bold: true, sz: 10.5, color: { rgb: headTx } },
          fill: solid(brand),
          alignment: { vertical: 'center', horizontal: col?.align || (col?.type === 'number' ? 'center' : 'left'), wrapText: true },
          border: { bottom: { style: 'medium', color: { rgb: brandDark } }, right: thin(this.shade(brand, -0.08)) },
        };
      } else if (cr === rFoot) {
        ws[addr].s = { font: { name: 'Calibri', italic: true, sz: 8.5, color: { rgb: muted } }, alignment: { vertical: 'center', horizontal: 'left', indent: 1 } };
      } else if (cr >= rFirst && cr <= rLast && col) {
        const even = (cr - rFirst) % 2 === 1;
        const s: any = {
          font: { name: 'Calibri', sz: 10, color: { rgb: ink } },
          alignment: { vertical: 'center', horizontal: col.align || (col.type === 'number' ? 'right' : col.type === 'date' || col.type === 'status' ? 'center' : 'left') },
          border: { bottom: thin(line), right: thin(line), left: thin(line) },
          fill: solid(even ? zebra : white),
        };
        if (col.type === 'number') s.numFmt = '#,##0';
        if (col.type === 'email') s.font.color = { rgb: brandDark };
        if (col.type === 'status') {
          const sc = this.statusColor(ws[addr].v);
          if (sc) { s.font.color = { rgb: sc }; s.font.bold = true; }
        }
        ws[addr].s = s;
        if (col.type === 'number' && typeof ws[addr].v === 'number') ws[addr].t = 'n';
      }
    }

    function solid(rgb: string) { return { patternType: 'solid', fgColor: { rgb }, bgColor: { rgb } }; }

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (options.sheetName || 'Report').slice(0, 31));
    XLSX.writeFile(wb, `${options.fileName.replace(/\.xlsx$/i, '')}.xlsx`);
  }

  /** Build a plain CSV (BOM + CRLF) from the same column model. */
  csv(rows: any[], columns: ExcelColumn[], fileName: string): void {
    if (!rows?.length) return;
    const head = columns.map((c) => c.label);
    const data = rows.map((row) => columns.map((c) => this.value(row[c.key], c.type)));
    const esc = (c: any) => (/[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : String(c));
    const csv = [head, ...data].map((row) => row.map(esc).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${fileName.replace(/\.csv$/i, '')}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  // ---- helpers ----
  private value(v: any, type?: ExcelColType): any {
    if (v == null || v === '') return type === 'number' ? 0 : '';
    if (type === 'number') { const n = Number(v); return isNaN(n) ? v : n; }
    if (type === 'date') return this.fmtDate(v);
    return v;
  }
  private fmtDate(v: any): string {
    const d = new Date(v); if (isNaN(+d)) return String(v);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  private fmtNum(v: string | number): string { return typeof v === 'number' ? v.toLocaleString() : String(v); }
  private pretty(k: string): string { return k.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
  private statusColor(v: any): string {
    const s = String(v || '').toLowerCase();
    if (/(sent|active|verified|success|delivered|live)/.test(s)) return '15803D';
    if (/(pending|sending|queued|processing|draft)/.test(s)) return 'B45309';
    if (/(revoked|archived|disabled|inactive|expired)/.test(s)) return '6B7280';
    if (/(failed|error|bounced|rejected)/.test(s)) return 'B91C1C';
    return '';
  }
  private isHex(c: string): boolean { return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c || ''); }
  private norm(hex: string): string { let h = (hex || '').replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); return h.toUpperCase(); }
  /** amt>0 lightens toward white, amt<0 darkens toward black. Returns 6-hex (no #). */
  private shade(hex: string, amt: number): string {
    const h = this.norm(hex); const n = parseInt(h, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
    return [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
}

import { Injectable, signal } from '@angular/core';
import {
  ActiveSelection,
  Canvas,
  Circle,
  CircleBrush,
  Ellipse,
  config,
  FabricImage,
  FabricObject,
  Gradient,
  Group,
  Line,
  Path,
  Pattern,
  PencilBrush,
  Point,
  Polygon,
  Rect,
  Shadow,
  SprayBrush,
  StaticCanvas,
  Textbox,
  Triangle,
  filters,
} from 'fabric';

/** Extra (non-standard) properties we persist on objects. */
const CUSTOM_PROPS = ['objType', 'fieldKey', 'tableId', 'imgFx', 'cellRC', 'layerName', 'frameKind', 'tableSpec'] as const;

/** Editable description of a table so it can be rebuilt after insertion. */
export interface TableSpec {
  rows: number;
  cols: number;
  startX: number;
  startY: number;
  cellW: number;
  cellH: number;
  opts: {
    headerFill: string; headerText: string; zebra: boolean; zebraColor: string;
    borderColor: string; borderWidth: number; cellText: string; fontSize: number;
    align: 'left' | 'center' | 'right'; showHeader: boolean; headerCol: boolean;
  };
  cells: string[][];
  /** When true, the data rows are filled from a list at Bulk time (one row per list item). */
  dynamic?: boolean;
  /** Field key per column (used to map Bulk/list data onto the columns). Length === cols. */
  colKeys?: string[];
}

/** A table cell located by a double-click, with its rect in canvas/scene coordinates. */
export interface TableCellHit { id: string; r: number; c: number; x: number; y: number; w: number; h: number; text: string; header: boolean; }

/**
 * Build a table as one Fabric Group from a spec — pure (no canvas needed), so both the
 * live editor and the offscreen Bulk renderer can use the exact same layout.
 */
export function buildTableGroup(id: string, spec: TableSpec): Group {
  const { rows, cols, startX, startY, cellW, cellH, opts, cells } = spec;
  const tableW = cols * cellW, tableH = rows * cellH;
  const firstData = opts.showHeader ? 1 : 0;

  const parts: FabricObject[] = [];
  const tag = (o: FabricObject, t: string) => { (o as any).objType = t; parts.push(o); };

  if (opts.showHeader) tag(new Rect({ left: startX, top: startY, width: tableW, height: cellH, fill: opts.headerFill, stroke: '' }), 'tableBg');
  if (opts.headerCol) tag(new Rect({ left: startX, top: startY, width: cellW, height: tableH, fill: opts.headerFill, stroke: '' }), 'tableBg');
  if (opts.zebra) {
    for (let r = firstData; r < rows; r++) {
      if ((r - firstData) % 2 === 1) continue;
      tag(new Rect({ left: startX, top: startY + r * cellH, width: tableW, height: cellH, fill: opts.zebraColor, stroke: '' }), 'tableBg');
    }
  }
  if (opts.borderWidth > 0) {
    const lo = { stroke: opts.borderColor, strokeWidth: opts.borderWidth };
    for (let r = 0; r <= rows; r++) tag(new Line([startX, startY + r * cellH, startX + tableW, startY + r * cellH], lo), 'tableLine');
    for (let col = 0; col <= cols; col++) tag(new Line([startX + col * cellW, startY, startX + col * cellW, startY + tableH], lo), 'tableLine');
  }

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const text = cells[r]?.[col] ?? '';
      const head = (opts.showHeader && r === 0) || (opts.headerCol && col === 0);
      const cell = new Textbox(text || ' ', {
        left: startX + col * cellW + 8,
        top: startY + r * cellH + cellH / 2 - opts.fontSize / 2 - 2,
        width: cellW - 16,
        fontSize: opts.fontSize,
        fontFamily: 'Inter',
        fill: head ? opts.headerText : opts.cellText,
        fontWeight: head ? '700' : '400',
        textAlign: opts.align,
      });
      const isVar = /^\{\{\s*[a-zA-Z0-9_@.]+\s*\}\}$/.test(text);
      (cell as any).objType = isVar ? 'cell' : 'text';
      if (isVar) (cell as any).fieldKey = text.replace(/[{}]/g, '').trim();
      (cell as any).cellRC = [r, col];
      parts.push(cell);
    }
  }

  const grp = new Group(parts, {});
  (grp as any).objType = 'table';
  (grp as any).tableId = id;
  (grp as any).tableSpec = spec;          // survives save/reload via CUSTOM_PROPS → table stays editable
  return grp;
}

/** Concrete (non-dynamic) copy of a spec whose data rows come from `list` — one row per item. */
export function expandTableForList(spec: TableSpec, list: string[][]): TableSpec {
  const cols = spec.cols;
  const header = spec.opts.showHeader
    ? [spec.cells[0] ?? Array.from({ length: cols }, (_, c) => spec.colKeys?.[c] ?? `Column ${c + 1}`)]
    : [];
  const dataRows = (list.length ? list : [Array.from({ length: cols }, () => '')])
    .map((item) => Array.from({ length: cols }, (_, c) => String(item?.[c] ?? '')));
  const cells = [...header, ...dataRows];
  return { ...spec, rows: cells.length, cells, dynamic: false };
}

/**
 * Load a canvas JSON, replace every dynamic table with one expanded to `list`
 * (a 2-D array of row values, columns already in table order), return new JSON.
 * Used by Bulk to render a roster certificate. Static tables are left untouched.
 */
export async function expandDynamicTablesInJson(json: string, list: string[][]): Promise<string> {
  let root: any;
  try { root = JSON.parse(json); } catch { return json; }
  if (!Array.isArray(root?.objects) && !Array.isArray(root)) return json;
  const hasDynamic = JSON.stringify(root).includes('"dynamic":true');
  if (!hasDynamic) return json;

  const el = document.createElement('canvas');
  const sc = new StaticCanvas(el, {});
  try {
    await sc.loadFromJSON(json);
    const tables = sc.getObjects().filter((o: any) => o.objType === 'table' && o.tableSpec && o.tableSpec.dynamic);
    for (const t of tables as any[]) {
      const spec = t.tableSpec as TableSpec;
      const expanded = expandTableForList(spec, list);
      const grp = buildTableGroup(t.tableId ?? `t_${Date.now()}`, expanded);
      grp.set({ left: t.left, top: t.top, scaleX: t.scaleX ?? 1, scaleY: t.scaleY ?? 1, angle: t.angle ?? 0 });
      grp.setCoords();
      sc.remove(t);
      sc.add(grp);
    }
    sc.renderAll();
    return JSON.stringify(sc.toObject(CUSTOM_PROPS as unknown as string[]));
  } catch {
    return json;
  } finally {
    sc.dispose();
  }
}

/** One page of a multi-page document. Inactive pages keep their serialized state. */
export interface CanvasPage {
  id: string;
  name: string;
  width: number;
  height: number;
  json: string | null;   // serialized canvas (toObject) — null = blank page not yet rendered
  thumb: string | null;  // small PNG dataURL preview for the filmstrip
}

export type BrushType = 'pencil' | 'spray' | 'circle';

/** Build a repeating SVG tile (data-URI ready) for a background pattern. */
export function patternTileSvg(kind: string, fg: string, bg: string, size = 40): string {
  const s = size;
  let body = '';
  switch (kind) {
    case 'dots': body = `<circle cx='10' cy='10' r='3' fill='${fg}'/><circle cx='30' cy='30' r='3' fill='${fg}'/>`; break;
    case 'grid': body = `<path d='M0 0H${s}M0 0V${s}' stroke='${fg}' stroke-width='1' fill='none'/>`; break;
    case 'lines': body = `<path d='M0 13H${s}M0 27H${s}' stroke='${fg}' stroke-width='2'/>`; break;
    case 'diagonal': body = `<path d='M-4 12L12 -4M8 ${s + 4}L${s + 4} 8M0 ${s}L${s} 0' stroke='${fg}' stroke-width='2'/>`; break;
    case 'cross': body = `<path d='M0 20H${s}M20 0V${s}' stroke='${fg}' stroke-width='1.5'/>`; break;
    case 'chevron': body = `<path d='M0 24L10 14L20 24L30 14L40 24' stroke='${fg}' stroke-width='2' fill='none'/>`; break;
    case 'triangles': body = `<path d='M20 8L33 30H7Z' fill='${fg}'/>`; break;
    case 'plus': body = `<path d='M20 12V28M12 20H28' stroke='${fg}' stroke-width='2.5' stroke-linecap='round'/>`; break;
    case 'confetti': body = `<rect x='6' y='8' width='6' height='6' rx='1' fill='${fg}' transform='rotate(20 9 11)'/><rect x='27' y='24' width='6' height='6' rx='1' fill='${fg}' transform='rotate(-18 30 27)'/><circle cx='31' cy='9' r='2.5' fill='${fg}'/>`; break;
    case 'waves': body = `<path d='M0 20 Q10 10 20 20 T40 20' stroke='${fg}' stroke-width='2' fill='none'/><path d='M0 32 Q10 22 20 32 T40 32' stroke='${fg}' stroke-width='2' fill='none'/>`; break;
    default: body = '';
  }
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}' viewBox='0 0 ${s} ${s}'><rect width='${s}' height='${s}' fill='${bg}'/>${body}</svg>`;
}

/** All available decorative border-frame styles. */
export const FRAME_KINDS = [
  'thin', 'double', 'triple', 'rounded', 'roundedDouble', 'dashed', 'dashedDouble', 'dotted', 'rope',
  'ticks', 'beaded', 'rings', 'groove', 'pinstripe', 'inlineDouble', 'mat', 'ribbon', 'bold', 'hairline',
  'decoBars', 'deco', 'brackets', 'bracketsBold', 'studio', 'fan', 'cornerDots', 'cornerPlus', 'cornerArc',
  'diamonds', 'stars', 'scalloped', 'lace', 'greek', 'notched', 'ornate', 'ornateDouble', 'royal',
];

/** Build a decorative border-frame SVG (transparent centre) sized to the canvas. */
export function frameSvg(kind: string, w: number, h: number, color = '#b8860b', weight = 1, insetPct = 0.04): string {
  const mn = Math.min(w, h);
  const m = Math.round(mn * insetPct) + 6;
  const sw = Math.max(1.5, mn * 0.005 * weight);
  const x = m, y = m, iw = w - 2 * m, ih = h - 2 * m, g = sw * 4;
  const xr = x + iw, yb = y + ih;
  const R = (ix: number, iy: number, iww: number, ihh: number, s: number, rx = 0, extra = '') =>
    `<rect x="${ix}" y="${iy}" width="${iww}" height="${ihh}" rx="${rx}" fill="none" stroke="${color}" stroke-width="${s}" ${extra}/>`;
  // Place a corner motif (opening into +x,+y) at all four corners, mirrored.
  const corners = (motif: string) =>
    `<g transform="translate(${x},${y})">${motif}</g><g transform="translate(${xr},${y}) scale(-1,1)">${motif}</g>` +
    `<g transform="translate(${x},${yb}) scale(1,-1)">${motif}</g><g transform="translate(${xr},${yb}) scale(-1,-1)">${motif}</g>`;
  // Repeat a unit along all four edges (centred on the rule).
  const edges = (uH: string, uV: string, step: number) => {
    let s = '';
    for (let p = 0; p <= iw + 0.5; p += step) s += `<g transform="translate(${x + p},${y})">${uH}</g><g transform="translate(${x + p},${yb})">${uH}</g>`;
    for (let p = step; p <= ih - step + 0.5; p += step) s += `<g transform="translate(${x},${y + p})">${uV}</g><g transform="translate(${xr},${y + p})">${uV}</g>`;
    return s;
  };
  let body = '';
  switch (kind) {
    case 'thin': body = R(x, y, iw, ih, sw); break;
    case 'double': body = R(x, y, iw, ih, sw * 1.6) + R(x + g, y + g, iw - 2 * g, ih - 2 * g, sw); break;
    case 'triple': body = R(x, y, iw, ih, sw * 1.6) + R(x + g, y + g, iw - 2 * g, ih - 2 * g, sw) + R(x + g * 2, y + g * 2, iw - 4 * g, ih - 4 * g, sw * 0.7); break;
    case 'rounded': body = R(x, y, iw, ih, sw, 18); break;
    case 'roundedDouble': body = R(x, y, iw, ih, sw * 1.4, 20) + R(x + g, y + g, iw - 2 * g, ih - 2 * g, sw, 14); break;
    case 'dashed': body = R(x, y, iw, ih, sw * 1.4) + R(x + g, y + g, iw - 2 * g, ih - 2 * g, sw, 0, `stroke-dasharray="${sw * 3} ${sw * 3}"`); break;
    case 'dashedDouble': body = R(x, y, iw, ih, sw * 1.4) + R(x + g, y + g, iw - 2 * g, ih - 2 * g, sw, 0, `stroke-dasharray="${sw * 4} ${sw * 2.5}" stroke-linecap="round"`); break;
    case 'dotted': body = R(x, y, iw, ih, sw * 1.5, 0, `stroke-dasharray="0 ${sw * 2.6}" stroke-linecap="round"`); break;
    case 'ticks': { const t = sw * 4; const uH = `<line x1="0" y1="${-t / 2}" x2="0" y2="${t / 2}" stroke="${color}" stroke-width="${sw}"/>`; const uV = `<line x1="${-t / 2}" y1="0" x2="${t / 2}" y2="0" stroke="${color}" stroke-width="${sw}"/>`; body = R(x, y, iw, ih, sw) + edges(uH, uV, Math.max(16, Math.round(mn * 0.05))); break; }
    case 'beaded': { const r = sw * 1.5; const dot = `<circle cx="0" cy="0" r="${r}" fill="${color}"/>`; body = R(x, y, iw, ih, sw) + edges(dot, dot, Math.max(16, Math.round(mn * 0.055))); break; }
    case 'groove': body = R(x, y, iw, ih, sw * 2.4) + R(x + g * 1.5, y + g * 1.5, iw - 3 * g, ih - 3 * g, sw * 0.8) + R(x + g * 1.5 + sw * 2, y + g * 1.5 + sw * 2, iw - 3 * g - sw * 4, ih - 3 * g - sw * 4, sw * 0.8); break;
    case 'mat': body = R(x, y, iw, ih, sw * 2) + R(x + g * 3, y + g * 3, iw - 6 * g, ih - 6 * g, sw); break;
    case 'ribbon': body = R(x, y, iw, ih, sw * 3.2) + R(x + g * 1.6, y + g * 1.6, iw - 3.2 * g, ih - 3.2 * g, sw); break;
    case 'decoBars': { const bar = sw * 5; body = R(x, y, iw, ih, sw) + `<rect x="${x}" y="${y}" width="${iw}" height="${bar}" fill="${color}"/><rect x="${x}" y="${yb - bar}" width="${iw}" height="${bar}" fill="${color}"/>`; break; }
    case 'deco': { const c = sw * 7; const sq = (cx: number, cy: number) => `<rect x="${cx - c / 2}" y="${cy - c / 2}" width="${c}" height="${c}" fill="${color}"/>`; body = R(x, y, iw, ih, sw * 1.4) + sq(x, y) + sq(xr, y) + sq(x, yb) + sq(xr, yb) + R(x + g * 2, y + g * 2, iw - 4 * g, ih - 4 * g, sw); break; }
    case 'brackets': { const L = Math.round(mn * 0.08); const br = (cx: number, cy: number, dx: number, dy: number) => `<path d="M${cx} ${cy + dy * L} L${cx} ${cy} L${cx + dx * L} ${cy}" fill="none" stroke="${color}" stroke-width="${sw * 2}" stroke-linecap="round"/>`; body = R(x, y, iw, ih, sw, 0, 'stroke-opacity="0.45"') + br(x, y, 1, 1) + br(xr, y, -1, 1) + br(x, yb, 1, -1) + br(xr, yb, -1, -1); break; }
    case 'bracketsBold': { const L = Math.round(mn * 0.1); const br = (cx: number, cy: number, dx: number, dy: number) => `<path d="M${cx} ${cy + dy * L} L${cx} ${cy} L${cx + dx * L} ${cy}" fill="none" stroke="${color}" stroke-width="${sw * 3.5}"/>`; body = br(x, y, 1, 1) + br(xr, y, -1, 1) + br(x, yb, 1, -1) + br(xr, yb, -1, -1); break; }
    case 'cornerDots': { const r = sw * 3; body = R(x, y, iw, ih, sw) + corners(`<circle cx="0" cy="0" r="${r}" fill="${color}"/>`); break; }
    case 'cornerPlus': { const s2 = sw * 4; body = R(x, y, iw, ih, sw, 0, 'stroke-opacity="0.5"') + corners(`<path d="M0 ${-s2} V${s2} M${-s2} 0 H${s2}" stroke="${color}" stroke-width="${sw * 1.4}" stroke-linecap="round"/>`); break; }
    case 'diamonds': { const d = sw * 4; body = R(x, y, iw, ih, sw) + corners(`<path d="M0 ${-d} L${d} 0 L0 ${d} L${-d} 0 Z" fill="${color}"/>`); break; }
    case 'studio': { const a = Math.round(mn * 0.12); body = R(x, y, iw, ih, sw * 1.2) + corners(`<path d="M0 0 H${a} M0 0 V${a}" stroke="${color}" stroke-width="${sw * 4}"/>`); break; }
    case 'scalloped': { const sc = Math.max(18, Math.round(mn * 0.05)), r = sc / 2; let p = `M${x} ${y}`; for (let px = x; px < xr - 1; px += sc) p += ` a ${r} ${r} 0 0 1 ${sc} 0`; for (let py = y; py < yb - 1; py += sc) p += ` a ${r} ${r} 0 0 1 0 ${sc}`; for (let px = xr; px > x + 1; px -= sc) p += ` a ${r} ${r} 0 0 1 ${-sc} 0`; for (let py = yb; py > y + 1; py -= sc) p += ` a ${r} ${r} 0 0 1 0 ${-sc}`; body = `<path d="${p} Z" fill="none" stroke="${color}" stroke-width="${sw}"/>`; break; }
    case 'greek': { const u = Math.round(mn * 0.018); const key = `<path d="M0 ${6 * u} L0 0 L${6 * u} 0 M${u} ${5 * u} L${u} ${u} L${5 * u} ${u} L${5 * u} ${3 * u} L${3 * u} ${3 * u} L${3 * u} ${5 * u}" fill="none" stroke="${color}" stroke-width="${sw}"/>`; body = R(x, y, iw, ih, sw, 0, 'stroke-opacity="0.4"') + corners(key); break; }
    case 'ornate': case 'ornateDouble': {
      const f = Math.round(mn * 0.09);
      const flour = (cx: number, cy: number, sx: number, sy: number) =>
        `<g transform="translate(${cx},${cy}) scale(${sx},${sy})"><path d="M0 ${f} L0 0 L${f} 0" fill="none" stroke="${color}" stroke-width="${sw * 1.8}"/><path d="M${f * 0.28} ${f * 0.28} Q${f * 0.85} ${f * 0.28} ${f * 0.85} ${f * 0.85}" fill="none" stroke="${color}" stroke-width="${sw}"/><circle cx="0" cy="0" r="${sw * 2}" fill="${color}"/></g>`;
      body = R(x, y, iw, ih, sw) + (kind === 'ornateDouble' ? R(x + g, y + g, iw - 2 * g, ih - 2 * g, sw * 0.8) : '') +
        flour(x + g, y + g, 1, 1) + flour(xr - g, y + g, -1, 1) + flour(x + g, yb - g, 1, -1) + flour(xr - g, yb - g, -1, -1);
      break;
    }
    case 'bold': body = R(x, y, iw, ih, sw * 3.4); break;
    case 'hairline': body = R(x, y, iw, ih, Math.max(1, sw * 0.6)); break;
    case 'pinstripe': body = R(x, y, iw, ih, sw * 0.8) + R(x + sw * 2.5, y + sw * 2.5, iw - sw * 5, ih - sw * 5, sw * 0.8); break;
    case 'inlineDouble': body = R(x, y, iw, ih, sw * 2.4) + R(x + sw * 3, y + sw * 3, iw - sw * 6, ih - sw * 6, sw * 0.8); break;
    case 'rope': body = R(x, y, iw, ih, sw, 0, `stroke-dasharray="${sw * 2.6} ${sw * 1.8}"`) + R(x + sw * 1.8, y + sw * 1.8, iw - sw * 3.6, ih - sw * 3.6, sw, 0, `stroke-dasharray="${sw * 2.6} ${sw * 1.8}" stroke-dashoffset="${sw * 2.2}"`); break;
    case 'notched': { const n = Math.round(mn * 0.05); body = `<path d="M${x + n} ${y} L${xr - n} ${y} L${xr} ${y + n} L${xr} ${yb - n} L${xr - n} ${yb} L${x + n} ${yb} L${x} ${yb - n} L${x} ${y + n} Z" fill="none" stroke="${color}" stroke-width="${sw}"/>`; break; }
    case 'cornerArc': { const a = Math.round(mn * 0.07); body = R(x, y, iw, ih, sw, 0, 'stroke-opacity="0.4"') + corners(`<path d="M0 ${a} A ${a} ${a} 0 0 1 ${a} 0" fill="none" stroke="${color}" stroke-width="${sw * 2}"/>`); break; }
    case 'rings': { const r = sw * 2.2; const ring = `<circle cx="0" cy="0" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}"/>`; body = R(x, y, iw, ih, sw) + edges(ring, ring, Math.max(22, Math.round(mn * 0.07))); break; }
    case 'stars': { const st = sw * 4, q = st * 0.32; const star = `<path d="M0 ${-st} L${q} ${-q} L${st} 0 L${q} ${q} L0 ${st} L${-q} ${q} L${-st} 0 L${-q} ${-q} Z" fill="${color}"/>`; body = R(x, y, iw, ih, sw, 0, 'stroke-opacity="0.45"') + corners(star); break; }
    case 'fan': { const a = Math.round(mn * 0.09); body = R(x, y, iw, ih, sw, 0, 'stroke-opacity="0.4"') + corners(`<path d="M0 ${a} L${a} 0 M0 ${a * 0.62} L${a * 0.62} 0 M0 ${a * 0.28} L${a * 0.28} 0" fill="none" stroke="${color}" stroke-width="${sw * 1.4}"/>`); break; }
    case 'lace': {
      const sc = Math.max(16, Math.round(mn * 0.045));
      const sp = (ox: number, oy: number, ow: number, oh: number) => {
        const rr = sc / 2, rx2 = ox + ow, ry2 = oy + oh; let pp = `M${ox} ${oy}`;
        for (let px = ox; px < rx2 - 1; px += sc) pp += ` a ${rr} ${rr} 0 0 1 ${sc} 0`;
        for (let py = oy; py < ry2 - 1; py += sc) pp += ` a ${rr} ${rr} 0 0 1 0 ${sc}`;
        for (let px = rx2; px > ox + 1; px -= sc) pp += ` a ${rr} ${rr} 0 0 1 ${-sc} 0`;
        for (let py = ry2; py > oy + 1; py -= sc) pp += ` a ${rr} ${rr} 0 0 1 0 ${-sc}`;
        return pp + ' Z';
      };
      body = `<path d="${sp(x, y, iw, ih)}" fill="none" stroke="${color}" stroke-width="${sw}"/><path d="${sp(x + g, y + g, iw - 2 * g, ih - 2 * g)}" fill="none" stroke="${color}" stroke-width="${sw * 0.8}"/>`;
      break;
    }
    case 'royal': {
      const f = Math.round(mn * 0.09);
      const fl = (cx: number, cy: number, sx: number, sy: number) =>
        `<g transform="translate(${cx},${cy}) scale(${sx},${sy})"><path d="M0 ${f} L0 0 L${f} 0" fill="none" stroke="${color}" stroke-width="${sw * 1.8}"/><path d="M${f * 0.28} ${f * 0.28} Q${f * 0.85} ${f * 0.28} ${f * 0.85} ${f * 0.85}" fill="none" stroke="${color}" stroke-width="${sw}"/><circle cx="0" cy="0" r="${sw * 2}" fill="${color}"/></g>`;
      body = R(x, y, iw, ih, sw * 3) + R(x + g * 1.7, y + g * 1.7, iw - 3.4 * g, ih - 3.4 * g, sw) +
        fl(x + g * 1.7, y + g * 1.7, 1, 1) + fl(xr - g * 1.7, y + g * 1.7, -1, 1) + fl(x + g * 1.7, yb - g * 1.7, 1, -1) + fl(xr - g * 1.7, yb - g * 1.7, -1, -1);
      break;
    }
    default: body = R(x, y, iw, ih, sw);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">${body}</svg>`;
}

/** Image adjustment state stored on each image object as `imgFx`. */
export interface ImageFx {
  brightness: number; contrast: number; saturation: number; blur: number; pixelate: number;
  grayscale: boolean; sepia: boolean; invert: boolean;
  tint: string; tintAlpha: number;
}
const DEFAULT_FX: ImageFx = {
  brightness: 0, contrast: 0, saturation: 0, blur: 0, pixelate: 0,
  grayscale: false, sepia: false, invert: false,
  tint: '', tintAlpha: 0.45,
};
/** Sepia colour matrix (Fabric v6 has no Sepia filter — use ColorMatrix). */
const SEPIA_MATRIX = [
  0.393, 0.769, 0.189, 0, 0,
  0.349, 0.686, 0.168, 0, 0,
  0.272, 0.534, 0.131, 0, 0,
  0, 0, 0, 1, 0,
];

/** One element in a ready-made template layout (positioned by its centre). */
export interface TemplateItem {
  kind: 'text' | 'field' | 'line' | 'rect' | 'circle' | 'triangle' | 'seal';
  text?: string; key?: string;
  x: number; y: number; w?: number; h?: number;
  fontSize?: number; fill?: string; fontFamily?: string; fontWeight?: string;
  align?: 'left' | 'center' | 'right'; stroke?: string; strokeWidth?: number; rx?: number;
  grad?: string; angle?: number; opacity?: number; charSpacing?: number; fontStyle?: string; lineHeight?: number; dir?: 'rtl' | 'ltr';
}

/**
 * Thin wrapper around a Fabric.js v6 canvas with all certificate-editing
 * operations. Provided at the component level so each designer gets its own
 * isolated instance.
 */
@Injectable()
export class FabricCanvasService {
  private canvas!: Canvas;

  // Undo / redo history — a single indexed timeline of JSON snapshots.
  private states: string[] = [];
  private counts: number[] = [];
  private hindex = -1;
  private tableSpecs = new Map<string, TableSpec>();
  private isRestoring = false;

  // Copy / paste clipboard (a cloned object) + grid snapping.
  private clipboard: FabricObject | null = null;
  snapToGrid = false;
  gridSize = 20;
  /** Snap sensitivity in screen px. */
  snapTol = 6;
  /** Manual draggable ruler guides (canvas-px positions). */
  readonly vGuides = signal<number[]>([]);
  readonly hGuides = signal<number[]>([]);

  // Smart alignment guides (snap to canvas centre / other objects' edges & centres).
  smartGuides = true;
  private vLines: { x: number; y1: number; y2: number }[] = [];
  private hLines: { y: number; x1: number; x2: number }[] = [];

  // Free-draw brush settings.
  private brushType: BrushType = 'pencil';
  private brushColor = '#0f172a';
  private brushWidth = 5;
  private brushAlpha = 1;
  private brushGlow = false;
  private brushSmooth = 0;

  /** The currently selected object, exposed to the properties panel. */
  readonly selected = signal<FabricObject | null>(null);
  /** Bumped on every meaningful change so the UI can re-read properties. */
  readonly revision = signal(0);
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);
  /** Visible history timeline + the index of the current point. */
  readonly history = signal<{ label: string; icon: string; at: number }[]>([]);
  readonly historyIndex = signal(-1);
  readonly zoom = signal(1);
  readonly drawing = signal(false);

  /** Multi-page document state. */
  readonly pages = signal<CanvasPage[]>([]);
  readonly activePage = signal(0);

  /** Custom fonts the user uploaded (family names), available in the picker. */
  readonly userFonts = signal<string[]>([]);

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
  init(el: HTMLCanvasElement, width: number, height: number): void {
    // Render at a high pixel density so the canvas stays crisp at every zoom level.
    // The view never zooms past 3×, so a 3× backing store is always ≥ the displayed
    // size and never has to be upscaled (Fabric treats this like retina, so pointer
    // hit-testing stays accurate). Raise the perf limits so Fabric doesn't auto-downscale.
    try {
      const ratio = Math.max(window.devicePixelRatio || 1, 3);
      const c = config as any;
      if (typeof c.configure === 'function') c.configure({ devicePixelRatio: ratio, perfLimitSizeTotal: 16777216, maxCacheSideLimit: 8192 });
      else { c.devicePixelRatio = ratio; c.perfLimitSizeTotal = 16777216; c.maxCacheSideLimit = 8192; }
    } catch { /* fall back to defaults */ }

    this.canvas = new Canvas(el, {
      width,
      height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
      uniformScaling: false, // free resize by default; hold Shift to lock aspect ratio
      enableRetinaScaling: true,
    });

    FabricObject.prototype.transparentCorners = false;
    FabricObject.prototype.cornerColor = '#4f46e5';
    FabricObject.prototype.cornerStyle = 'circle';
    FabricObject.prototype.borderColor = '#4f46e5';
    FabricObject.prototype.cornerSize = 9;

    this.canvas.on('selection:created', () => this.syncSelection());
    this.canvas.on('selection:updated', () => this.syncSelection());
    this.canvas.on('selection:cleared', () => this.syncSelection());
    this.canvas.on('object:modified', () => this.snapshot());
    this.canvas.on('path:created', () => this.snapshot());

    // Snap to grid while dragging when enabled.
    this.canvas.on('object:moving', (e) => {
      if (!this.snapToGrid) return;
      const o = e.target as FabricObject | undefined;
      if (!o) return;
      const g = this.gridSize;
      o.set({ left: Math.round((o.left ?? 0) / g) * g, top: Math.round((o.top ?? 0) / g) * g });
    });

    // Smart alignment guides.
    this.canvas.on('object:moving', (e) => this.onMovingGuides(e));
    this.canvas.on('object:moving', (e) => this.snapToManualGuides(e));
    this.canvas.on('object:moving', () => { this.dragging = true; });
    this.canvas.on('object:scaling', () => { this.dragging = true; });
    this.canvas.on('mouse:up', () => { this.dragging = false; this.clearGuides(); this.canvas.requestRenderAll(); });
    this.canvas.on('after:render', () => this.drawGuides());
    this.canvas.on('after:render', () => this.drawDistances());
    this.canvas.on('mouse:dblclick', (opt) => this.onTableDblClick(opt));

    this.snapshot();

    // Seed the first page from the freshly-initialised canvas.
    this.pages.set([{ id: this.uid(), name: 'Page 1', width, height, json: this.toJSON(), thumb: this.makeThumb() }]);
    this.activePage.set(0);
  }

  dispose(): void {
    this.canvas?.dispose();
    this.states = [];
    this.counts = [];
    this.hindex = -1;
    this.history.set([]);
    this.historyIndex.set(-1);
    this.pages.set([]);
    this.activePage.set(0);
  }

  constructor() {
    this.loadSavedFonts();
  }

  // -------------------------------------------------------------------------
  // Custom fonts (upload + persist)
  // -------------------------------------------------------------------------
  /** Register a user font file (ttf/otf/woff/woff2), persist it, return its family name. */
  async addFontFromFile(file: File): Promise<string> {
    const family = this.fontFamilyName(file.name);
    const dataUrl = await this.fileToDataUrl(file);
    await this.registerFont(family, dataUrl);
    this.userFonts.update((l) => (l.includes(family) ? l : [...l, family]));
    this.persistFont(family, dataUrl);
    return family;
  }

  private fontFamilyName(name: string): string {
    return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Custom Font';
  }
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); });
  }
  private async registerFont(family: string, src: string): Promise<void> {
    try {
      const ff = new FontFace(family, `url(${src})`);
      await ff.load();
      (document as any).fonts.add(ff);
    } catch { /* ignore bad font */ }
  }
  private persistFont(family: string, dataUrl: string): void {
    try {
      const arr = JSON.parse(localStorage.getItem('cf-fonts') || '[]');
      if (!arr.some((f: any) => f.family === family)) { arr.push({ family, dataUrl }); localStorage.setItem('cf-fonts', JSON.stringify(arr)); }
    } catch { /* storage quota — font still works this session */ }
  }
  private loadSavedFonts(): void {
    try {
      const arr = JSON.parse(localStorage.getItem('cf-fonts') || '[]') as { family: string; dataUrl: string }[];
      arr.forEach((f) => this.registerFont(f.family, f.dataUrl));
      if (arr.length) this.userFonts.set(arr.map((f) => f.family));
    } catch { /* ignore */ }
  }

  getCanvas(): Canvas {
    return this.canvas;
  }

  private syncSelection(): void {
    this.selected.set(this.canvas.getActiveObject() ?? null);
    this.revision.update((v) => v + 1);
  }

  /** Re-read the currently selected object's properties into the UI. */
  touch(): void {
    this.canvas.requestRenderAll();
    this.revision.update((v) => v + 1);
  }

  /** Quick-bar: patch props on the active object and re-render. */
  quickSet(patch: Record<string, any>): void {
    const o: any = this.canvas.getActiveObject();
    if (!o) return;
    o.set(patch);
    o.setCoords?.();
    this.touch();
  }
  /** Quick-bar: read a prop from the active object. */
  quickGet(prop: string): any {
    const o: any = this.canvas.getActiveObject();
    return o ? o[prop] : undefined;
  }
  /** Run cb while the active object is moved/scaled/rotated (for live overlays). */
  onInteract(cb: () => void): void {
    ['object:moving', 'object:scaling', 'object:rotating', 'object:modified'].forEach((e) => this.canvas.on(e as any, cb));
  }

  // -------------------------------------------------------------------------
  // Adding objects
  // -------------------------------------------------------------------------
  private place(obj: FabricObject, objType?: string): void {
    const c = this.canvas;
    if (objType) (obj as any).objType = objType;
    obj.set({ left: c.getWidth() / 2, top: c.getHeight() / 2, originX: 'center', originY: 'center' });
    c.add(obj);
    c.setActiveObject(obj);
    c.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }

  addHeading(): void {
    this.addText('Certificate of Achievement', { fontSize: 48, fontFamily: 'Playfair Display', fontWeight: '700' });
  }

  addText(text = 'Double-click to edit', extra: Record<string, unknown> = {}): void {
    const options: any = {
      fontSize: 24,
      fill: '#0f172a',
      fontFamily: 'Inter',
      textAlign: 'center',
      width: 360,
      ...extra,
    };
    const tb = new Textbox(text, options);
    (tb as any).objType = 'text';
    this.place(tb);
  }

  /** Add a Textbox from a full style spec (Text-tab style gallery / phrases). */
  addStyledText(text: string, spec: {
    fontFamily?: string; fontSize?: number; fontWeight?: string; fill?: string;
    fontStyle?: string; underline?: boolean; textAlign?: string; charSpacing?: number; lineHeight?: number;
    shadow?: boolean; outline?: boolean; outlineColor?: string;
  } = {}): void {
    const extra: any = {
      fontFamily: spec.fontFamily ?? 'Inter',
      fontSize: spec.fontSize ?? 28,
      fontWeight: spec.fontWeight ?? '400',
      fill: spec.fill ?? '#0f172a',
      fontStyle: spec.fontStyle ?? 'normal',
      underline: !!spec.underline,
      textAlign: spec.textAlign ?? 'center',
      charSpacing: spec.charSpacing ?? 0,
      lineHeight: spec.lineHeight ?? 1.16,
    };
    if (spec.shadow) extra.shadow = new Shadow({ color: 'rgba(15,23,42,0.35)', blur: 8, offsetX: 2, offsetY: 4 });
    if (spec.outline) { extra.stroke = spec.outlineColor ?? '#0f172a'; extra.strokeWidth = 1.5; extra.paintFirst = 'stroke'; }
    this.addText(text, extra);
  }

  // ---- text effects (applied to the selected text object) ----
  private activeText(): any {
    const o = this.canvas.getActiveObject() as any;
    return o && (o.type === 'textbox' || o.type === 'i-text' || o.type === 'text') ? o : null;
  }
  hasTextSelected(): boolean { return !!this.activeText(); }

  toggleTextShadow(): void {
    const o = this.activeText(); if (!o) return;
    o.set('shadow', o.shadow ? null : new Shadow({ color: 'rgba(15,23,42,0.35)', blur: 8, offsetX: 2, offsetY: 4 }));
    this.afterFx();
  }
  toggleTextOutline(): void {
    const o = this.activeText(); if (!o) return;
    if (o.strokeWidth) o.set({ stroke: '', strokeWidth: 0 });
    else o.set({ stroke: '#0f172a', strokeWidth: 1.5, paintFirst: 'stroke' });
    this.afterFx();
  }
  setTextGradient(from = '#4f46e5', to = '#ec4899'): void {
    const o = this.activeText(); if (!o) return;
    const w = (o.width as number) || 320;
    o.set('fill', new Gradient({ type: 'linear', coords: { x1: 0, y1: 0, x2: w, y2: 0 }, colorStops: [{ offset: 0, color: from }, { offset: 1, color: to }] }) as any);
    this.afterFx();
  }
  setTextHighlight(color: string): void {
    const o = this.activeText(); if (!o) return;
    o.set('textBackgroundColor', color);
    this.afterFx();
  }
  setTextCase(mode: 'upper' | 'lower' | 'title'): void {
    const o = this.activeText();
    if (!o || typeof o.text !== 'string') return;
    if (o.objType === 'field' || o.objType === 'cell') return; // never break {{variables}}
    const t = o.text as string;
    o.set('text', mode === 'upper' ? t.toUpperCase()
      : mode === 'lower' ? t.toLowerCase()
      : t.replace(/\w\S*/g, (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()));
    this.afterFx();
  }
  private afterFx(): void { this.canvas.requestRenderAll(); this.touch(); this.snapshot(); }

  /** Read the current text effects of the selected text (for the Effects studio). */
  getTextFx(): {
    shadow: boolean; shadowColor: string; shadowBlur: number; shadowOffset: number;
    outline: boolean; outlineColor: string; outlineWidth: number;
    gradient: boolean; gradFrom: string; gradTo: string; gradDir: 'h' | 'v' | 'd';
    curve: number; letterSpacing: number; lineHeight: number;
  } | null {
    const o = this.activeText();
    if (!o) return null;
    const sh = o.shadow;
    return {
      shadow: !!sh,
      shadowColor: (sh && sh.color) || '#94a3b8',
      shadowBlur: sh ? (sh.blur ?? 8) : 8,
      shadowOffset: sh ? (sh.offsetY ?? 4) : 4,
      outline: !!o.strokeWidth,
      outlineColor: o.stroke || '#0f172a',
      outlineWidth: o.strokeWidth || 0,
      gradient: !!(o.fill && typeof o.fill === 'object'),
      gradFrom: o._gradFrom || '#4f46e5',
      gradTo: o._gradTo || '#ec4899',
      gradDir: o._gradDir || 'h',
      curve: o._curve ?? 0,
      letterSpacing: o.charSpacing ?? 0,
      lineHeight: o.lineHeight ?? 1.16,
    };
  }

  /** Patch text effects on the selected text. */
  setTextFx(patch: Record<string, any>): void {
    const o = this.activeText();
    const cur = this.getTextFx();
    if (!o || !cur) return;
    const fx = { ...cur, ...patch };
    if ('shadow' in patch || 'shadowColor' in patch || 'shadowBlur' in patch || 'shadowOffset' in patch) {
      o.set('shadow', fx.shadow ? new Shadow({ color: fx.shadowColor, blur: +fx.shadowBlur, offsetX: Math.round(+fx.shadowOffset * 0.6), offsetY: +fx.shadowOffset }) : null);
    }
    if ('outline' in patch || 'outlineColor' in patch || 'outlineWidth' in patch) {
      if (fx.outline) o.set({ stroke: fx.outlineColor, strokeWidth: +fx.outlineWidth || 1.5, paintFirst: 'stroke' });
      else o.set({ stroke: '', strokeWidth: 0 });
    }
    if ('gradient' in patch || 'gradFrom' in patch || 'gradTo' in patch || 'gradDir' in patch) {
      if (fx.gradient) {
        const w = (o.width as number) || 320, h = (o.height as number) || 60;
        const coords = fx.gradDir === 'v' ? { x1: 0, y1: 0, x2: 0, y2: h } : fx.gradDir === 'd' ? { x1: 0, y1: 0, x2: w, y2: h } : { x1: 0, y1: 0, x2: w, y2: 0 };
        o.set('fill', new Gradient({ type: 'linear', coords, colorStops: [{ offset: 0, color: fx.gradFrom }, { offset: 1, color: fx.gradTo }] }) as any);
      } else {
        o.set('fill', '#0f172a');
      }
      o._gradFrom = fx.gradFrom; o._gradTo = fx.gradTo; o._gradDir = fx.gradDir;
    }
    if ('letterSpacing' in patch) o.set('charSpacing', +fx.letterSpacing);
    if ('lineHeight' in patch) o.set('lineHeight', +fx.lineHeight);
    if ('curve' in patch) this.applyCurve(o, +fx.curve);
    this.afterFx();
  }

  /** Bend the selected text along an arc (-100..100); 0 straightens it. */
  private applyCurve(o: any, amount: number): void {
    o._curve = amount;
    if (!amount) { o.set('path', null); return; }
    const text = (o.text as string) || ' ';
    const fs = o.fontSize || 24;
    const w = Math.max(text.length * fs * 0.6, fs * 2);
    const dir = amount > 0 ? 1 : -1;
    const sag = (Math.abs(amount) / 100) * (w * 0.5);
    const path = new Path(`M 0 0 Q ${w / 2} ${2 * sag * dir} ${w} 0`, { fill: '', stroke: '' });
    o.set('path', path);
    o.pathAlign = 'center';
  }

  /** A dynamic field rendered as {{key}} and merged with data on export. */
  addField(key: string): void {
    const clean = key.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!clean) return;
    const tb = new Textbox(`{{${clean}}}`, {
      fontSize: 28,
      fill: '#4f46e5',
      fontFamily: 'Inter',
      fontWeight: '600',
      textAlign: 'center',
      width: 360,
      editable: false,   // the {{placeholder}} text is locked; only styling/position change
    });
    (tb as any).objType = 'field';
    (tb as any).fieldKey = clean;
    this.place(tb);
  }

  /** Place an uploaded signature image, tagged as a fillable signature field. */
  async addSignatureImage(key: string, url: string): Promise<void> {
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    this.scaleToFit(img, 260, 130);
    (img as any).objType = 'signature';
    (img as any).fieldKey = key;
    // Only one object per signature slot — replace any existing one.
    this.canvas.getObjects().filter((o) => (o as any).objType === 'signature' && (o as any).fieldKey === key).forEach((o) => this.canvas.remove(o));
    this.place(img);
  }

  /** Drop a dashed signature placeholder (an image, so bulk can swap in the issuer's signature). */
  addSignaturePlaceholder(key: string): void {
    const w = 240, h = 96;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect x='1.5' y='1.5' width='${w - 3}' height='${h - 3}' rx='10' fill='rgba(148,163,184,0.06)' stroke='#94a3b8' stroke-width='1.5' stroke-dasharray='6 4'/><text x='50%' y='55%' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='15' fill='#64748b'>✎ Signature</text></svg>`;
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    this.addSignatureImage(key, url);
  }

  /** fieldKeys of signature objects currently on the canvas. */
  usedSignatureKeys(): string[] {
    const keys = new Set<string>();
    for (const o of this.canvas.getObjects()) {
      if ((o as any).objType === 'signature') { const k = (o as any).fieldKey as string | undefined; if (k) keys.add(k); }
    }
    return [...keys];
  }

  removeSignature(key: string): void {
    const targets = this.canvas.getObjects().filter((o) => (o as any).objType === 'signature' && (o as any).fieldKey === key);
    if (!targets.length) return;
    for (const o of targets) this.canvas.remove(o);
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }

  selectSignature(key: string): void {
    const o = this.canvas.getObjects().find((x) => (x as any).objType === 'signature' && (x as any).fieldKey === key);
    if (!o) return;
    this.canvas.setActiveObject(o);
    this.canvas.requestRenderAll();
    this.syncSelection();
  }

  /** Preview: fill on-canvas signature variables for `key` with the issuer's profile signature, in place. */
  async fillSignaturePreview(key: string): Promise<void> {
    let url: string | null = null;
    try { url = localStorage.getItem('cf-signature'); } catch { url = null; }
    if (!url) return;
    for (const o of this.canvas.getObjects()) {
      const a = o as any;
      if (a.objType !== 'signature' || a.fieldKey !== key) continue;
      if (/image/i.test(a.type)) {
        await this.swapImageSrc(a, url);
      } else if (typeof a.getObjects === 'function') {
        const inner = a.getObjects().find((c: any) => c.objType === 'signature' || /image/i.test(c.type));
        if (inner) { await this.swapImageSrc(inner, url); a.dirty = true; a.set?.('dirty', true); }
      }
    }
    this.canvas.requestRenderAll();
    this.snapshot();
  }
  private async swapImageSrc(img: any, url: string): Promise<void> {
    const w = typeof img.getScaledWidth === 'function' ? img.getScaledWidth() : (img.width || 200) * (img.scaleX || 1);
    await img.setSrc(url, { crossOrigin: 'anonymous' });
    const nw = img.width || w || 200;
    const s = (w || 200) / nw;
    img.scaleX = s; img.scaleY = s;
    img.dirty = true;
  }

  /** Revert a previewed signature back to its variable placeholder. */
  async clearSignaturePreview(key: string): Promise<void> {
    const sw = 200, sh = 70;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${sw}' height='${sh}'><rect x='0.5' y='0.5' width='${sw - 1}' height='${sh - 1}' rx='8' fill='none' stroke='#cbd5e1' stroke-width='1' stroke-dasharray='5 4'/><text x='50%' y='58%' text-anchor='middle' font-family='Segoe Script, Bradley Hand, cursive' font-size='26' fill='#b6c0cf'>signature</text></svg>`;
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    for (const o of this.canvas.getObjects()) {
      const a = o as any;
      if (a.objType !== 'signature' || a.fieldKey !== key) continue;
      if (/image/i.test(a.type)) await this.swapImageSrc(a, url);
      else if (typeof a.getObjects === 'function') {
        const inner = a.getObjects().find((c: any) => c.objType === 'signature' || /image/i.test(c.type));
        if (inner) { await this.swapImageSrc(inner, url); a.dirty = true; a.set?.('dirty', true); }
      }
    }
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  /** A professional signature block: signature variable placeholder + underline + role caption. */
  async addSignatureBlock(key: string, role: string): Promise<void> {
    const sw = 200, sh = 70;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${sw}' height='${sh}'><rect x='0.5' y='0.5' width='${sw - 1}' height='${sh - 1}' rx='8' fill='none' stroke='#cbd5e1' stroke-width='1' stroke-dasharray='5 4'/><text x='50%' y='58%' text-anchor='middle' font-family='Segoe Script, Bradley Hand, cursive' font-size='26' fill='#b6c0cf'>signature</text></svg>`;
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    const W = 200, sc = W / (img.width || W);
    img.scale(sc);
    const H = (img.height || 60) * sc;
    (img as any).objType = 'signature';
    (img as any).fieldKey = key;
    img.set({ left: 0, top: 0 });
    const line = new Line([0, H + 12, W, H + 12], { stroke: '#0f172a', strokeWidth: 1.5 });
    const cap = new Textbox(role || 'Authorized Signature', { left: 0, top: H + 18, width: W, fontSize: 13, fontWeight: '600', fill: '#0f172a', fontFamily: 'Inter', textAlign: 'center', editable: false });
    const g = new Group([img, line, cap], {});
    (g as any).objType = 'signature';
    (g as any).fieldKey = key;
    this.canvas.getObjects().filter((o) => (o as any).objType === 'signature' && (o as any).fieldKey === key).forEach((o) => this.canvas.remove(o));
    this.place(g);
  }

  /** An emoji / unicode icon as a single-glyph text object (Elements → icons/badges). */
  addIcon(glyph: string): void {
    const tb = new Textbox(glyph, {
      fontSize: 84,
      fontFamily: 'Inter',
      textAlign: 'center',
      width: 120,
      editable: false,
    });
    (tb as any).objType = 'icon';
    this.place(tb);
  }

  addRect(): void {
    this.place(new Rect({ width: 220, height: 130, fill: 'rgba(79,70,229,0.12)', stroke: '#4f46e5', strokeWidth: 2, rx: 8, ry: 8 }));
  }

  addRoundRect(): void {
    this.place(new Rect({ width: 210, height: 120, rx: 24, ry: 24, fill: 'rgba(99,102,241,0.12)', stroke: '#6366f1', strokeWidth: 2 }));
  }

  addCircle(): void {
    this.place(new Circle({ radius: 70, fill: 'rgba(22,163,74,0.15)', stroke: '#16a34a', strokeWidth: 2 }));
  }

  addEllipse(): void {
    this.place(new Ellipse({ rx: 95, ry: 58, fill: 'rgba(59,130,246,0.15)', stroke: '#3b82f6', strokeWidth: 2 }));
  }

  addTriangle(): void {
    this.place(new Triangle({ width: 140, height: 120, fill: 'rgba(217,119,6,0.18)', stroke: '#d97706', strokeWidth: 2 }));
  }

  /** Regular polygon (5 = pentagon, 6 = hexagon, …). */
  addPolygon(sides: number): void {
    const r = 70;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < sides; i++) {
      const a = (Math.PI * 2 * i) / sides - Math.PI / 2;
      pts.push({ x: r + r * Math.cos(a), y: r + r * Math.sin(a) });
    }
    this.place(new Polygon(pts, { fill: 'rgba(16,185,129,0.16)', stroke: '#10b981', strokeWidth: 2 }));
  }

  addStar(points = 5): void {
    const outer = 74, inner = 31;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (Math.PI * i) / points - Math.PI / 2;
      pts.push({ x: outer + r * Math.cos(a), y: outer + r * Math.sin(a) });
    }
    this.place(new Polygon(pts, { fill: 'rgba(245,158,11,0.2)', stroke: '#f59e0b', strokeWidth: 2 }));
  }

  addDiamond(): void {
    this.place(new Polygon([{ x: 50, y: 0 }, { x: 100, y: 60 }, { x: 50, y: 120 }, { x: 0, y: 60 }],
      { fill: 'rgba(236,72,153,0.16)', stroke: '#ec4899', strokeWidth: 2 }));
  }

  addArrow(): void {
    const pts = [
      { x: 0, y: 22 }, { x: 70, y: 22 }, { x: 70, y: 4 }, { x: 110, y: 40 },
      { x: 70, y: 76 }, { x: 70, y: 58 }, { x: 0, y: 58 },
    ];
    this.place(new Polygon(pts, { fill: 'rgba(2,132,199,0.18)', stroke: '#0284c7', strokeWidth: 2 }));
  }

  addHeart(): void {
    const d = 'M 50 88 C -30 40 22 -2 50 30 C 78 -2 130 40 50 88 Z';
    this.place(new Path(d, { fill: 'rgba(239,68,68,0.2)', stroke: '#ef4444', strokeWidth: 2 }));
  }

  addLine(): void {
    const c = this.canvas;
    const y = c.getHeight() / 2;
    const line = new Line([c.getWidth() / 2 - 150, y, c.getWidth() / 2 + 150, y], {
      stroke: '#0f172a',
      strokeWidth: 3,
    });
    c.add(line);
    c.setActiveObject(line);
    c.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }

  // ---- extra shapes ----
  addOctagon(): void { this.addPolygon(8); }
  addShield(): void {
    this.place(new Path('M 60 0 L 120 22 L 120 70 C 120 118 60 140 60 140 C 60 140 0 118 0 70 L 0 22 Z', { fill: 'rgba(79,70,229,0.16)', stroke: '#4f46e5', strokeWidth: 2 }));
  }
  addChevron(): void {
    this.place(new Polygon([{ x: 0, y: 0 }, { x: 80, y: 0 }, { x: 120, y: 35 }, { x: 80, y: 70 }, { x: 0, y: 70 }, { x: 40, y: 35 }], { fill: 'rgba(2,132,199,0.18)', stroke: '#0284c7', strokeWidth: 2 }));
  }
  addCross(): void {
    this.place(new Polygon([{ x: 40, y: 0 }, { x: 80, y: 0 }, { x: 80, y: 40 }, { x: 120, y: 40 }, { x: 120, y: 80 }, { x: 80, y: 80 }, { x: 80, y: 120 }, { x: 40, y: 120 }, { x: 40, y: 80 }, { x: 0, y: 80 }, { x: 0, y: 40 }, { x: 40, y: 40 }], { fill: 'rgba(239,68,68,0.16)', stroke: '#ef4444', strokeWidth: 2 }));
  }
  addParallelogram(): void {
    this.place(new Polygon([{ x: 30, y: 0 }, { x: 140, y: 0 }, { x: 110, y: 70 }, { x: 0, y: 70 }], { fill: 'rgba(16,185,129,0.16)', stroke: '#10b981', strokeWidth: 2 }));
  }
  addSpeechBubble(): void {
    this.place(new Path('M 16 0 L 144 0 Q 160 0 160 16 L 160 70 Q 160 86 144 86 L 56 86 L 30 112 L 36 86 L 16 86 Q 0 86 0 70 L 0 16 Q 0 0 16 0 Z', { fill: 'rgba(99,102,241,0.14)', stroke: '#6366f1', strokeWidth: 2 }));
  }
  addBlob(): void {
    this.place(new Path('M 70 8 C 110 4 150 30 146 72 C 142 112 108 138 66 132 C 28 126 4 92 10 54 C 16 22 36 12 70 8 Z', { fill: 'rgba(245,158,11,0.18)', stroke: '#f59e0b', strokeWidth: 2 }));
  }

  // ---- certificate decorations (recolorable) ----
  /** Scalloped award seal. */
  addSeal(): void {
    const points = 16, outer = 80, inner = 70, cx = outer, cy = outer;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (Math.PI * i) / points - Math.PI / 2;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    this.place(new Polygon(pts, { fill: '#b08d2e', stroke: '#8a6d1e', strokeWidth: 2 }));
  }
  /** Ribbon banner. */
  addRibbon(): void {
    this.place(new Polygon([{ x: 0, y: 0 }, { x: 220, y: 0 }, { x: 196, y: 24 }, { x: 220, y: 48 }, { x: 0, y: 48 }, { x: 24, y: 24 }], { fill: '#4f46e5', stroke: '#4338ca', strokeWidth: 1 }));
  }
  /** Decorative frame/border sized to the canvas. */
  addFrame(style: 'single' | 'double' = 'single'): void {
    const c = this.canvas;
    const m = 40;
    const w = c.getWidth() - m * 2, h = c.getHeight() - m * 2;
    const mk = (inset: number, sw: number) => new Rect({ left: m + inset, top: m + inset, width: w - inset * 2, height: h - inset * 2, fill: '', stroke: '#4f46e5', strokeWidth: sw });
    let obj: FabricObject;
    if (style === 'double') obj = new Group([mk(0, 3), mk(10, 1)]);
    else obj = mk(0, 3);
    (obj as any).objType = 'shape';
    c.add(obj);
    c.setActiveObject(obj);
    c.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }
  /** Apply a full-canvas decorative border frame as a fixed overlay (replaces any existing one). */
  async addBorderFrame(kind: string, color: string, opts: { weight?: number; inset?: number; opacity?: number; behind?: boolean } = {}): Promise<void> {
    const c = this.canvas;
    const w = c.getWidth(), h = c.getHeight();
    this.removeFrameObjects();
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(frameSvg(kind, w, h, color, opts.weight ?? 1, opts.inset ?? 0.04));
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    (img as any).objType = 'frame';
    (img as any).frameKind = kind;
    img.set({ left: 0, top: 0, selectable: false, evented: false, hoverCursor: 'default', opacity: opts.opacity ?? 1 });
    img.scaleX = w / (img.width || w);
    img.scaleY = h / (img.height || h);
    c.add(img);
    if (opts.behind) (c as any).sendObjectToBack?.(img);
    c.requestRenderAll();
    this.touch();
    this.snapshot();
  }
  private removeFrameObjects(): void {
    this.canvas.getObjects().filter((o) => (o as any).objType === 'frame').forEach((o) => this.canvas.remove(o));
  }
  removeFrame(): void {
    this.removeFrameObjects();
    this.canvas.requestRenderAll();
    this.touch();
    this.snapshot();
  }
  hasFrame(): boolean { return this.canvas.getObjects().some((o) => (o as any).objType === 'frame'); }
  activeFrameKind(): string | null { const f = this.canvas.getObjects().find((o) => (o as any).objType === 'frame') as any; return f ? (f.frameKind ?? null) : null; }

  /** Decorative divider line. */
  addDivider(style: 'plain' | 'dashed' | 'ornament' = 'plain'): void {
    const c = this.canvas;
    const cx = c.getWidth() / 2, cy = c.getHeight() / 2, half = 160;
    const line = new Line([cx - half, cy, cx + half, cy], { stroke: '#0f172a', strokeWidth: 2, strokeDashArray: style === 'dashed' ? [8, 6] : undefined });
    let obj: FabricObject = line;
    if (style === 'ornament') {
      const dia = new Polygon([{ x: cx, y: cy - 9 }, { x: cx + 9, y: cy }, { x: cx, y: cy + 9 }, { x: cx - 9, y: cy }], { fill: '#0f172a', stroke: '' });
      obj = new Group([line, dia]);
    }
    (obj as any).objType = 'shape';
    c.add(obj);
    c.setActiveObject(obj);
    c.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }

  /** Recolour / restyle the active shape or decoration (and group children). */
  applyShapeStyle(opts: { fill?: string; stroke?: string; fillIt?: boolean; strokeWidth?: number; opacity?: number }): void {
    const o = this.canvas.getActiveObject() as any;
    if (!o) return;
    const skip = (t: any) => t.objType === 'text' || t.objType === 'field' || t.objType === 'cell' || t.type === 'image';
    const paint = (t: any) => {
      if (skip(t)) return;
      if (opts.fillIt && opts.fill && t.fill !== '' && t.fill != null && t.type !== 'line') t.set('fill', opts.fill);
      if (opts.stroke != null && t.stroke !== undefined) t.set('stroke', opts.stroke);
      if (opts.strokeWidth != null && t.type !== 'group') t.set('strokeWidth', opts.strokeWidth);
      t.dirty = true;
    };
    if (o.getObjects) { paint(o); o.getObjects().forEach(paint); } else paint(o);
    if (opts.opacity != null && !skip(o)) o.set('opacity', opts.opacity);
    this.canvas.requestRenderAll();
    this.touch();
    this.snapshot();
  }

  /** Concentric rings that read as a fingerprint placeholder (Addons). */
  addFingerprint(): void {
    const rings: FabricObject[] = [];
    for (let i = 0; i < 5; i++) {
      rings.push(new Ellipse({
        rx: 16 + i * 9, ry: 22 + i * 11, left: 0, top: 0,
        originX: 'center', originY: 'center',
        fill: '', stroke: '#334155', strokeWidth: 2,
      }));
    }
    const g = new Group(rings, {});
    this.place(g, 'fingerprint');
  }

  /** SHA-256 of the document's content (excludes verification marks so it stays stable). */
  async documentHash(): Promise<string> {
    const objs = this.canvas.getObjects().filter((o) => (o as any).objType !== 'fingerprint' && (o as any).objType !== 'watermark');
    const json = JSON.stringify(objs.map((o) => o.toObject(CUSTOM_PROPS as unknown as string[])));
    const buf = new TextEncoder().encode(json || ' ');
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /** Place a verification fingerprint — a unique hash derived from the document content. */
  async addContentFingerprint(format: 'short' | 'full' = 'short'): Promise<void> {
    const hash = await this.documentHash();
    const shown = (format === 'full' ? hash : hash.slice(0, 16)).toUpperCase();
    const tb = new Textbox(`⬢ DOC ID\n${shown}`, {
      fontSize: 16, fontFamily: 'monospace', fill: '#0f172a', fontWeight: '600',
      textAlign: 'center', lineHeight: 1.3, width: format === 'full' ? 380 : 280,
      backgroundColor: 'rgba(15,23,42,0.05)', editable: false,
    });
    (tb as any).objType = 'fingerprint';
    (tb as any).docHash = hash;
    this.place(tb);
  }

  /** A recolourable circular "rubber stamp" (double ring + bold label + stars). */
  addRubberStamp(text: string, color = '#b91c1c'): void {
    const r = 72;
    const parts: FabricObject[] = [
      new Circle({ radius: r, fill: '', stroke: color, strokeWidth: 4, originX: 'center', originY: 'center', left: 0, top: 0 }),
      new Circle({ radius: r - 9, fill: '', stroke: color, strokeWidth: 1.5, originX: 'center', originY: 'center', left: 0, top: 0 }),
      new Textbox(text.toUpperCase(), { fontSize: 20, fontWeight: '800', fill: color, fontFamily: 'Inter', textAlign: 'center', width: 2 * (r - 16), originX: 'center', originY: 'center', left: 0, top: 0, editable: false }),
      new Textbox('★ ★ ★', { fontSize: 12, fill: color, textAlign: 'center', width: 2 * (r - 16), originX: 'center', originY: 'center', left: 0, top: r - 28, editable: false }),
    ];
    const g = new Group(parts, { angle: -12, opacity: 0.92 });
    this.place(g, 'stamp');
  }

  /** A signature line with caption. */
  addSignatureLine(): void {
    const parts: FabricObject[] = [
      new Line([0, 0, 220, 0], { stroke: '#0f172a', strokeWidth: 2, originX: 'center', originY: 'center', left: 0, top: 0 }),
      new Textbox('Authorized Signature', { fontSize: 13, fill: '#64748b', textAlign: 'center', width: 220, originX: 'center', originY: 'center', left: 0, top: 16, editable: false }),
    ];
    this.place(new Group(parts, {}));
  }

  /** A diagonal, low-opacity watermark sent behind the design. */
  addWatermark(text = 'ORIGINAL'): void {
    const W = this.canvas.getWidth();
    const tb = new Textbox(text.toUpperCase(), {
      fontSize: Math.max(40, W * 0.1), fontWeight: '800', fill: 'rgba(15,23,42,0.06)',
      textAlign: 'center', width: W * 0.9, angle: -30, editable: false,
    });
    (tb as any).objType = 'watermark';
    this.place(tb);
    (this.canvas as any).sendObjectToBack?.(tb);
    this.canvas.requestRenderAll();
  }

  async addImageFromUrl(url: string, objType = 'image'): Promise<void> {
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    this.scaleToFit(img, 320, 320);
    (img as any).objType = objType;
    this.place(img);
  }

  addImageFromFile(file: File, objType = 'image'): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await this.addImageFromUrl(reader.result as string, objType);
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private scaleToFit(img: FabricImage, maxW: number, maxH: number): void {
    const w = img.width ?? maxW;
    const h = img.height ?? maxH;
    const scale = Math.min(maxW / w, maxH / h, 1);
    img.scale(scale);
  }

  /**
   * A styled, creative table: header band + zebra rows + grid lines + editable
   * cells. Every piece is tagged with the same tableId.
   */
  addTable(rows = 3, cols = 3, opts: {
    headerFill?: string; headerText?: string; zebra?: boolean; zebraColor?: string;
    borderColor?: string; borderWidth?: number; cellText?: string; fontSize?: number;
    align?: 'left' | 'center' | 'right'; showHeader?: boolean; headerCol?: boolean; headers?: string[];
  } = {}): void {
    const o = this.resolveTableOpts(opts);
    const headers = opts.headers ?? [];
    const cellW = 150, cellH = 44;
    const startX = (this.canvas.getWidth() - cols * cellW) / 2;
    const startY = (this.canvas.getHeight() - rows * cellH) / 2;
    const cells: string[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: string[] = [];
      for (let col = 0; col < cols; col++) {
        const isHeader = o.showHeader && r === 0;
        row.push(isHeader && headers[col] ? headers[col] : `{{cell_${r}_${col}}}`);
      }
      cells.push(row);
    }
    this.createTable({ rows, cols, startX, startY, cellW, cellH, opts: o, cells });
  }

  /** Build a table from pasted text (CSV or tab-separated); the first line becomes the header. */
  addTableFromText(text: string, opts: any = {}): void {
    const lines = (text || '').split(/\r?\n/).filter((l) => l.trim().length);
    if (!lines.length) return;
    const grid = lines.map((l) => (l.includes('\t') ? l.split('\t') : l.split(',')).map((s) => s.trim()));
    const cols = Math.max(...grid.map((r) => r.length));
    const cells = grid.map((r) => { const row = [...r]; while (row.length < cols) row.push(''); return row; });
    const rows = cells.length;
    const cellW = 150, cellH = 44;
    const startX = (this.canvas.getWidth() - cols * cellW) / 2;
    const startY = (this.canvas.getHeight() - rows * cellH) / 2;
    this.createTable({ rows, cols, startX, startY, cellW, cellH, opts: this.resolveTableOpts(opts), cells });
  }

  // ---- live cell editing + dynamic data binding (public API for the panel & canvas) ----

  private cellEditCb: ((hit: TableCellHit) => void) | null = null;
  /** Register a listener that fires when a table cell is double-clicked (opens an inline editor). */
  onCellEdit(cb: (hit: TableCellHit) => void): void { this.cellEditCb = cb; }

  private onTableDblClick(opt: any): void {
    const g = opt?.target as any;
    if (!g || g.objType !== 'table' || !g.tableId) return;
    const pt = opt.scenePoint ?? (this.canvas as any).getScenePoint?.(opt.e) ?? this.canvas.getPointer(opt.e);
    const hit = this.tableCellAtScene(g, { x: pt.x, y: pt.y });
    if (hit) this.cellEditCb?.(hit);
  }

  /** Locate the cell (and its scene-space rect) under a point inside a table group. */
  private tableCellAtScene(g: any, pt: { x: number; y: number }): TableCellHit | null {
    if (Math.abs(g.angle ?? 0) > 0.01) return null;     // rotated tables: fall back to the panel grid
    const spec = (this.tableSpecs.get(g.tableId) ?? g.tableSpec) as TableSpec | undefined;
    if (!spec) return null;
    const sx = g.scaleX ?? 1, sy = g.scaleY ?? 1;
    const left = g.left ?? 0, top = g.top ?? 0;
    const cw = spec.cellW * sx, ch = spec.cellH * sy;
    const c = Math.floor((pt.x - left) / cw);
    const r = Math.floor((pt.y - top) / ch);
    if (c < 0 || r < 0 || c >= spec.cols || r >= spec.rows) return null;
    const header = (spec.opts.showHeader && r === 0) || (spec.opts.headerCol && c === 0);
    return { id: g.tableId, r, c, x: left + c * cw, y: top + r * ch, w: cw, h: ch, text: spec.cells[r]?.[c] ?? '', header };
  }

  /** Set the text of one cell and re-render the table (used by the inline editor and the panel grid). */
  tableSetCell(r: number, c: number, text: string): void {
    this.editTable((s) => { (s.cells[r] ??= [])[c] = text; });
  }

  /** Read the active table's spec (for the panel grid / dynamic controls). */
  activeTableSpec(): TableSpec | null {
    const id = this.activeTableId();
    if (!id) return null;
    const grp = this.tableGroup(id);
    return (this.tableSpecs.get(id) ?? (grp as any)?.tableSpec ?? this.reconstructSpec(id)) ?? null;
  }

  private defaultColKeys(s: TableSpec): string[] {
    return Array.from({ length: s.cols }, (_, c) => {
      const h = s.opts.showHeader ? (s.cells[0]?.[c] ?? '') : '';
      const slug = h.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      return slug || `col_${c + 1}`;
    });
  }

  /** Toggle whether this table is data-bound (Bulk fills its rows from a list). */
  tableSetDynamic(on: boolean): void {
    this.editTable((s) => {
      s.dynamic = on;
      if (on && (!s.colKeys || s.colKeys.length !== s.cols)) s.colKeys = this.defaultColKeys(s);
    });
  }

  /** Set the field-key a column maps to (used by Bulk to pull the right data). */
  tableSetColKey(c: number, key: string): void {
    this.editTable((s) => { (s.colKeys ??= this.defaultColKeys(s))[c] = key.trim().replace(/[^a-zA-Z0-9_@.]/g, ''); });
  }

  /** Replace the table's data rows from pasted/typed text (CSV or tab-separated; keeps the header row). */
  tableFillRowsFromText(text: string): void {
    const lines = (text || '').split(/\r?\n/).map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim().length);
    if (!lines.length) return;
    this.editTable((s) => {
      const body = lines.map((l) => (l.includes('\t') ? l.split('\t') : l.split(',')).map((x) => x.trim()));
      const cols = Math.max(s.cols, ...body.map((r) => r.length));
      const header = s.opts.showHeader ? [this.padRow(s.cells[0] ?? this.defaultColKeys(s), cols)] : [];
      const rows = body.map((r) => this.padRow(r, cols));
      s.cols = cols;
      s.cells = [...header, ...rows];
      s.rows = s.cells.length;
      if (s.colKeys) s.colKeys = this.padRow(s.colKeys, cols).map((k, i) => k || `col_${i + 1}`);
    });
  }
  private padRow(row: string[], cols: number): string[] { const r = [...(row ?? [])]; while (r.length < cols) r.push(''); return r.slice(0, cols); }

  private createTable(spec: TableSpec): void {
    const id = `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.tableSpecs.set(id, spec);
    this.renderTable(id, spec);
    this.selectTableById(id);
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  private resolveTableOpts(opts: any): TableSpec['opts'] {
    return {
      headerFill: opts.headerFill ?? '#4f46e5',
      headerText: opts.headerText ?? '#ffffff',
      zebra: opts.zebra ?? true,
      zebraColor: opts.zebraColor ?? '#eef2ff',
      borderColor: opts.borderColor ?? '#cbd5e1',
      borderWidth: opts.borderWidth ?? 1,
      cellText: opts.cellText ?? '#0f172a',
      fontSize: opts.fontSize ?? 14,
      align: opts.align ?? 'left',
      showHeader: opts.showHeader !== false,
      headerCol: opts.headerCol ?? false,
    };
  }

  private renderTable(id: string, spec: TableSpec): void {
    const grp = buildTableGroup(id, spec);   // shared builder (also used by Bulk)
    this.canvas.add(grp);
    // Remember where the group sits now, so a later move/scale can be re-applied before the next edit.
    (spec as any)._gx = grp.left ?? 0;
    (spec as any)._gy = grp.top ?? 0;
    (spec as any)._gsx = grp.scaleX ?? 1;
    (spec as any)._gsy = grp.scaleY ?? 1;
  }

  // ---- editing a table that is already on the canvas ----
  hasActiveTable(): boolean { return !!this.activeTableId(); }

  private activeTableId(): string | null {
    const a = this.canvas.getActiveObject() as any;
    if (!a) return null;
    if (a.tableId) return a.tableId;
    const objs = a.type === 'activeselection' && a.getObjects ? a.getObjects() : [a];
    for (const o of objs) if ((o as any).tableId) return (o as any).tableId;
    return null;
  }

  tableAddRow(): void { this.editTable((s) => { s.cells.push(Array.from({ length: s.cols }, (_, col) => `{{cell_${s.rows}_${col}}}`)); s.rows++; }); }
  tableRemoveRow(): void { this.editTable((s) => { if (s.rows > 1) { s.cells.pop(); s.rows--; } }); }
  tableAddCol(): void { this.editTable((s) => { for (let r = 0; r < s.rows; r++) s.cells[r].push(`{{cell_${r}_${s.cols}}}`); s.cols++; }); }
  tableRemoveCol(): void { this.editTable((s) => { if (s.cols > 1) { for (let r = 0; r < s.rows; r++) s.cells[r].pop(); s.cols--; } }); }
  tableApplyStyle(opts: any): void { this.editTable((s) => { s.opts = this.resolveTableOpts({ ...s.opts, ...opts }); }); }

  private editTable(mut: (s: TableSpec) => void): void {
    const id = this.activeTableId();
    if (!id) return;
    const grp = this.tableGroup(id);
    // Prefer the live in-memory spec; fall back to the one saved on the group (survives reload); finally rebuild it.
    const spec = this.tableSpecs.get(id) ?? (grp as any)?.tableSpec ?? this.reconstructSpec(id);
    if (!spec) return;
    this.tableSpecs.set(id, spec);
    // Re-apply any move/scale the user did to the group, so the table doesn't jump back to its original spot/size.
    if (grp) this.bakeGroupTransform(grp, spec);
    this.syncSpecFromCanvas(id, spec);
    mut(spec);
    this.removeTableObjects(id);
    this.renderTable(id, spec);
    this.selectTableById(id);
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  /** The single Group that represents a table (new tables) — or the first tagged part (legacy flat tables). */
  private tableGroup(id: string): FabricObject | null {
    return this.canvas.getObjects().find((o) => (o as any).tableId === id) ?? null;
  }

  /** Fold a group's current translation/scale back into the spec, then it will be rebuilt unscaled in place. */
  private bakeGroupTransform(g: any, spec: any): void {
    if (typeof spec._gx === 'number' && typeof spec._gy === 'number') {
      spec.startX += (g.left ?? 0) - spec._gx;
      spec.startY += (g.top ?? 0) - spec._gy;
    }
    const sx = (g.scaleX ?? 1) / (spec._gsx ?? 1);
    const sy = (g.scaleY ?? 1) / (spec._gsy ?? 1);
    if (Math.abs(sx - 1) > 1e-3 || Math.abs(sy - 1) > 1e-3) {
      spec.cellW *= sx;
      spec.cellH *= sy;
    }
  }

  private removeTableObjects(id: string): void {
    this.canvas.getObjects().filter((o) => (o as any).tableId === id).forEach((o) => this.canvas.remove(o));
  }
  private selectTableById(id: string): void {
    this.canvas.discardActiveObject();
    const objs = this.canvas.getObjects().filter((o) => (o as any).tableId === id);
    if (objs.length > 1) this.canvas.setActiveObject(new ActiveSelection(objs, { canvas: this.canvas }));
    else if (objs[0]) this.canvas.setActiveObject(objs[0]);
    this.syncSelection();
  }
  private syncSpecFromCanvas(id: string, spec: TableSpec): void {
    const apply = (o: any): void => {
      const rc = o?.cellRC as [number, number] | undefined;
      if (rc && spec.cells[rc[0]]?.[rc[1]] !== undefined) {
        spec.cells[rc[0]][rc[1]] = o.text ?? spec.cells[rc[0]][rc[1]];
      }
    };
    for (const o of this.canvas.getObjects()) {
      if ((o as any).tableId !== id) continue;
      apply(o);                                              // legacy flat tables (cell is top-level)
      const kids = (o as any)._objects as FabricObject[] | undefined;
      if (kids?.length) kids.forEach(apply);                 // grouped tables (cells nested in the group)
    }
  }
  private reconstructSpec(id: string): TableSpec | null {
    const objs = this.canvas.getObjects().filter((o) => (o as any).tableId === id);
    const cellObjs = objs.filter((o) => (o as any).objType === 'cell' || (o as any).objType === 'text');
    // Grouped table with no usable spec: rebuild from the group's nested cells + its on-canvas geometry.
    if (!cellObjs.length) {
      const grp = objs.find((o) => (o as any).objType === 'table') as any;
      const kids = (grp?._objects as FabricObject[] | undefined) ?? [];
      const cellKids = kids.filter((o) => (o as any).cellRC);
      if (!grp || !cellKids.length) return null;
      let rows = 0, cols = 0;
      const map = new Map<string, string>();
      for (const o of cellKids) {
        const [r, col] = (o as any).cellRC as [number, number];
        rows = Math.max(rows, r + 1); cols = Math.max(cols, col + 1);
        map.set(`${r}_${col}`, (o as any).text ?? `{{cell_${r}_${col}}}`);
      }
      const cells: string[][] = [];
      for (let r = 0; r < rows; r++) { const row: string[] = []; for (let col = 0; col < cols; col++) row.push(map.get(`${r}_${col}`) ?? `{{cell_${r}_${col}}}`); cells.push(row); }
      const startX = grp.left ?? 0, startY = grp.top ?? 0;
      const cellW = ((grp.width ?? cols * 150) * (grp.scaleX ?? 1)) / cols;
      const cellH = ((grp.height ?? rows * 44) * (grp.scaleY ?? 1)) / rows;
      // Geometry above already includes the group's current scale/position, so neutralise bakeGroupTransform.
      const spec: any = { rows, cols, startX, startY, cellW, cellH, opts: this.resolveTableOpts({}), cells };
      spec._gx = startX; spec._gy = startY; spec._gsx = grp.scaleX ?? 1; spec._gsy = grp.scaleY ?? 1;
      return spec as TableSpec;
    }
    let rows = 0, cols = 0;
    const map = new Map<string, string>();
    for (const o of cellObjs) {
      let r = -1, col = -1;
      const rc = (o as any).cellRC as [number, number] | undefined;
      if (rc) { r = rc[0]; col = rc[1]; }
      else { const m = ((o as any).fieldKey as string)?.match(/cell_(\d+)_(\d+)/); if (m) { r = +m[1]; col = +m[2]; } }
      if (r < 0) continue;
      rows = Math.max(rows, r + 1); cols = Math.max(cols, col + 1);
      map.set(`${r}_${col}`, (o as any).text ?? `{{cell_${r}_${col}}}`);
    }
    if (!rows || !cols) return null;
    const cells: string[][] = [];
    for (let r = 0; r < rows; r++) { const row: string[] = []; for (let col = 0; col < cols; col++) row.push(map.get(`${r}_${col}`) ?? `{{cell_${r}_${col}}}`); cells.push(row); }
    const cellW = 150, cellH = 44;
    const startX = Math.min(...cellObjs.map((o) => ((o as any).left ?? 0) - 8));
    const startY = Math.min(...cellObjs.map((o) => ((o as any).top ?? 0) - (cellH / 2 - 9)));
    return { rows, cols, startX, startY, cellW, cellH, opts: this.resolveTableOpts({}), cells };
  }

  // -------------------------------------------------------------------------
  // Free drawing
  // -------------------------------------------------------------------------
  setDrawingMode(on: boolean): void {
    this.canvas.isDrawingMode = on;
    this.drawing.set(on);
    if (on) this.applyBrush();
  }

  configureBrush(o: { type: BrushType; color: string; width: number; opacity?: number; glow?: boolean; smoothing?: number }): void {
    this.brushType = o.type;
    this.brushColor = o.color;
    this.brushWidth = o.width;
    this.brushAlpha = o.opacity ?? 1;
    this.brushGlow = !!o.glow;
    this.brushSmooth = o.smoothing ?? 0;
    if (this.canvas.isDrawingMode) this.applyBrush();
  }

  private applyBrush(): void {
    let brush: any;
    if (this.brushType === 'spray') brush = new SprayBrush(this.canvas);
    else if (this.brushType === 'circle') brush = new CircleBrush(this.canvas);
    else brush = new PencilBrush(this.canvas);
    brush.color = this.brushAlpha < 1 ? this.hexToRgba(this.brushColor, this.brushAlpha) : this.brushColor;
    brush.width = this.brushWidth;
    if ('decimate' in brush) brush.decimate = this.brushSmooth;
    brush.shadow = this.brushGlow ? new Shadow({ color: this.brushColor, blur: Math.max(8, this.brushWidth * 1.6), offsetX: 0, offsetY: 0 }) : null;
    this.canvas.freeDrawingBrush = brush;
    this.updateBrushCursor();
  }

  /** Show a tool-shaped cursor (pen / brush / spray) while drawing, in the brush colour. */
  private updateBrushCursor(): void {
    const col = this.brushColor;
    let body: string, hx: number, hy: number;
    if (this.brushType === 'spray') {
      body = `<rect x='9' y='9' width='9' height='13' rx='2' fill='${col}'/><rect x='11' y='4.5' width='5' height='5' rx='1' fill='${col}'/><circle cx='4' cy='5' r='1.1' fill='${col}'/><circle cx='6.5' cy='2.6' r='1' fill='${col}'/><circle cx='3' cy='9' r='1' fill='${col}'/>`;
      hx = 13.5; hy = 9;
    } else if (this.brushType === 'circle') {
      body = `<path d='M15 3 L21 9 L13.5 16.5 L7.5 10.5 Z' fill='${col}'/><path d='M7.5 10.5 L13.5 16.5 C 11 20 6 22.5 2.5 22.5 C 3 19 5.2 13 7.5 10.5 Z' fill='${col}'/>`;
      hx = 2.5; hy = 22.5;
    } else {
      body = `<path d='M15.5 3.5 L20.5 8.5 L8 21 L2.5 22.5 L4 17 Z' fill='${col}'/><path d='M13.7 5.3 L18.7 10.3' stroke='#ffffff' stroke-width='1.3'/>`;
      hx = 2.5; hy = 22.5;
    }
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'><g stroke='#ffffff' stroke-width='1.3' stroke-linejoin='round' stroke-linecap='round'>${body}</g></svg>`;
    const url = 'data:image/svg+xml;base64,' + btoa(svg);
    this.canvas.freeDrawingCursor = `url("${url}") ${hx} ${hy}, crosshair`;
  }

  private hexToRgba(hex: string, a: number): string {
    const h = hex.replace('#', '');
    const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // -------------------------------------------------------------------------
  // Smart alignment guides
  // -------------------------------------------------------------------------
  /** While dragging, snap the object's edges/centre to the canvas centre and to
   *  other objects' edges/centres, and remember the guide lines to draw. */
  private onMovingGuides(e: { target?: FabricObject }): void {
    if (!this.smartGuides) return;
    const obj = e.target;
    if (!obj) return;

    this.vLines = [];
    this.hLines = [];

    const c = this.canvas;
    const W = c.getWidth(), H = c.getHeight();
    const th = 7;

    const center = obj.getCenterPoint();
    const sw = obj.getScaledWidth(), sh = obj.getScaledHeight();
    let cx = center.x, cy = center.y;
    const top = cy - sh / 2, bottom = cy + sh / 2, left = cx - sw / 2, right = cx + sw / 2;

    const others = c.getObjects().filter((o) => o !== obj && o.visible !== false);

    interface Tgt { pos: number; from: number; to: number; }
    const xT: Tgt[] = [{ pos: W / 2, from: 0, to: H }];
    const yT: Tgt[] = [{ pos: H / 2, from: 0, to: W }];
    for (const o of others) {
      const oc = o.getCenterPoint(); const ow = o.getScaledWidth(), oh = o.getScaledHeight();
      const ol = oc.x - ow / 2, or = oc.x + ow / 2, ot = oc.y - oh / 2, ob = oc.y + oh / 2;
      xT.push({ pos: ol, from: ot, to: ob }, { pos: oc.x, from: ot, to: ob }, { pos: or, from: ot, to: ob });
      yT.push({ pos: ot, from: ol, to: or }, { pos: oc.y, from: ol, to: or }, { pos: ob, from: ol, to: or });
    }

    const movX = [{ p: left, off: -sw / 2 }, { p: cx, off: 0 }, { p: right, off: sw / 2 }];
    outerX:
    for (const m of movX) {
      for (const t of xT) {
        if (Math.abs(m.p - t.pos) <= th) {
          cx = t.pos - m.off;
          this.vLines.push({ x: t.pos, y1: Math.min(t.from, top) - 14, y2: Math.max(t.to, bottom) + 14 });
          break outerX;
        }
      }
    }

    const movY = [{ p: top, off: -sh / 2 }, { p: cy, off: 0 }, { p: bottom, off: sh / 2 }];
    outerY:
    for (const m of movY) {
      for (const t of yT) {
        if (Math.abs(m.p - t.pos) <= th) {
          cy = t.pos - m.off;
          this.hLines.push({ y: t.pos, x1: Math.min(t.from, left) - 14, x2: Math.max(t.to, right) + 14 });
          break outerY;
        }
      }
    }

    if (cx !== center.x || cy !== center.y) {
      obj.setPositionByOrigin(new Point(cx, cy), 'center', 'center');
      obj.setCoords();
    }
  }

  private drawGuides(): void {
    if (!this.vLines.length && !this.hLines.length) return;
    const ctx = this.canvas.getContext();
    const vpt = this.canvas.viewportTransform;
    // Include the retina/device-pixel scaling so guides render at the right
    // size & position on the high-density backing store.
    const r = (this.canvas as any).getRetinaScaling?.() ?? (window.devicePixelRatio || 1);
    ctx.save();
    if (vpt) ctx.setTransform(vpt[0] * r, vpt[1] * r, vpt[2] * r, vpt[3] * r, vpt[4] * r, vpt[5] * r);
    else ctx.setTransform(r, 0, 0, r, 0, 0);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ec4899';
    for (const l of this.vLines) { ctx.beginPath(); ctx.moveTo(l.x, l.y1); ctx.lineTo(l.x, l.y2); ctx.stroke(); }
    for (const l of this.hLines) { ctx.beginPath(); ctx.moveTo(l.x1, l.y); ctx.lineTo(l.x2, l.y); ctx.stroke(); }
    ctx.restore();
  }

  private clearGuides(): void {
    if (!this.vLines.length && !this.hLines.length) return;
    this.vLines = [];
    this.hLines = [];
    this.canvas.requestRenderAll();
  }

  // -------------------------------------------------------------------------
  // Distance indicators — measured gaps from the selected object to the edges
  // -------------------------------------------------------------------------
  distanceIndicators = false;
  private dragging = false;
  setDistanceIndicators(on: boolean): void { this.distanceIndicators = on; this.canvas.requestRenderAll(); }

  private drawDistances(): void {
    if (!this.distanceIndicators || !this.dragging) return;
    const o = this.canvas.getActiveObject() as any;
    if (!o || o.type === 'activeselection' || typeof o.getBoundingRect !== 'function') return;
    const bb = o.getBoundingRect();
    const W = this.canvas.getWidth(), H = this.canvas.getHeight();
    const ctx = this.canvas.getContext();
    const vpt = this.canvas.viewportTransform;
    const r = (this.canvas as any).getRetinaScaling?.() ?? (window.devicePixelRatio || 1);
    ctx.save();
    if (vpt) ctx.setTransform(vpt[0] * r, vpt[1] * r, vpt[2] * r, vpt[3] * r, vpt[4] * r, vpt[5] * r);
    else ctx.setTransform(r, 0, 0, r, 0, 0);

    const aL = bb.left, aT = bb.top, aR = bb.left + bb.width, aB = bb.top + bb.height;
    const aCx = aL + bb.width / 2, aCy = aT + bb.height / 2;
    const color = '#2563eb';
    ctx.strokeStyle = color; ctx.lineWidth = 1;

    // Other objects' boxes (ignore the active one, helpers and table grid lines).
    const others = this.canvas.getObjects()
      .filter((x: any) => x !== o && x.visible !== false && x.selectable !== false && x.objType !== 'tableLine' && x.objType !== 'tableBg')
      .map((x: any) => x.getBoundingRect());

    const seg = (x1: number, y1: number, x2: number, y2: number, val: number, vertical: boolean, neighbor: boolean) => {
      if (val <= 0.5) return;
      ctx.strokeStyle = color;
      ctx.setLineDash(neighbor ? [] : [4, 3]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
      const t = 4;
      ctx.beginPath();
      if (vertical) { ctx.moveTo(x1 - t, y1); ctx.lineTo(x1 + t, y1); ctx.moveTo(x2 - t, y2); ctx.lineTo(x2 + t, y2); }
      else { ctx.moveTo(x1, y1 - t); ctx.lineTo(x1, y1 + t); ctx.moveTo(x2, y2 - t); ctx.lineTo(x2, y2 + t); }
      ctx.stroke();
      this.distLabel(ctx, String(Math.round(val)), (x1 + x2) / 2, (y1 + y2) / 2, color);
    };

    // LEFT — nearest object whose vertical span overlaps, else the canvas edge.
    { let best: number | null = null, edge = aL, pos = aCy;
      for (const b of others) { const bR = b.left + b.width, ov = Math.min(aB, b.top + b.height) - Math.max(aT, b.top);
        if (bR <= aL + 0.5 && ov > 0) { const g = aL - bR; if (best === null || g < best) { best = g; edge = bR; pos = (Math.max(aT, b.top) + Math.min(aB, b.top + b.height)) / 2; } } }
      best !== null ? seg(edge, pos, aL, pos, best, false, true) : seg(0, aCy, aL, aCy, aL, false, false); }
    // RIGHT
    { let best: number | null = null, edge = aR, pos = aCy;
      for (const b of others) { const bL = b.left, ov = Math.min(aB, b.top + b.height) - Math.max(aT, b.top);
        if (bL >= aR - 0.5 && ov > 0) { const g = bL - aR; if (best === null || g < best) { best = g; edge = bL; pos = (Math.max(aT, b.top) + Math.min(aB, b.top + b.height)) / 2; } } }
      best !== null ? seg(aR, pos, edge, pos, best, false, true) : seg(aR, aCy, W, aCy, W - aR, false, false); }
    // TOP
    { let best: number | null = null, edge = aT, pos = aCx;
      for (const b of others) { const bB = b.top + b.height, ov = Math.min(aR, b.left + b.width) - Math.max(aL, b.left);
        if (bB <= aT + 0.5 && ov > 0) { const g = aT - bB; if (best === null || g < best) { best = g; edge = bB; pos = (Math.max(aL, b.left) + Math.min(aR, b.left + b.width)) / 2; } } }
      best !== null ? seg(pos, edge, pos, aT, best, true, true) : seg(aCx, 0, aCx, aT, aT, true, false); }
    // BOTTOM
    { let best: number | null = null, edge = aB, pos = aCx;
      for (const b of others) { const bT = b.top, ov = Math.min(aR, b.left + b.width) - Math.max(aL, b.left);
        if (bT >= aB - 0.5 && ov > 0) { const g = bT - aB; if (best === null || g < best) { best = g; edge = bT; pos = (Math.max(aL, b.left) + Math.min(aR, b.left + b.width)) / 2; } } }
      best !== null ? seg(pos, aB, pos, edge, best, true, true) : seg(aCx, aB, aCx, H, H - aB, true, false); }

    ctx.restore();
  }

  private distLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
    ctx.font = '600 10.5px Inter, system-ui, sans-serif';
    const label = text + ' px';
    const h = 16, w = ctx.measureText(label).width + 12, rad = 8;
    const rx = x - w / 2, ry = y - h / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(15,23,42,0.28)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1;
    ctx.beginPath();
    ctx.moveTo(rx + rad, ry);
    ctx.arcTo(rx + w, ry, rx + w, ry + h, rad);
    ctx.arcTo(rx + w, ry + h, rx, ry + h, rad);
    ctx.arcTo(rx, ry + h, rx, ry, rad);
    ctx.arcTo(rx, ry, rx + w, ry, rad);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
  }

  // -------------------------------------------------------------------------
  // Brand
  // -------------------------------------------------------------------------
  /** Apply a colour to the active object's fill, or to the canvas background if nothing is selected. */
  applyColor(color: string): void {
    const o = this.canvas.getActiveObject() as any;
    if (o) {
      o.set('fill', color);
      this.canvas.requestRenderAll();
      this.revision.update((v) => v + 1);
      this.snapshot();
    } else {
      this.setBackgroundColor(color);
    }
  }

  // -------------------------------------------------------------------------
  // Object operations
  // -------------------------------------------------------------------------
  deleteSelected(): void {
    const objs = this.canvas.getActiveObjects();
    if (!objs.length) return;
    objs.forEach((o) => this.canvas.remove(o));
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }

  /** Variables & signatures are single bound slots — they can't be copied, duplicated or replaced. */
  private isProtected(o: any): boolean {
    if (!o) return false;
    if (o.objType === 'field' || o.objType === 'signature') return true;
    if (o.type === 'activeselection' && typeof o.getObjects === 'function') return o.getObjects().some((c: any) => this.isProtected(c));
    return false;
  }
  isProtectedActive(): boolean { return this.isProtected(this.canvas.getActiveObject()); }

  /** A cloned table must become its own table (fresh id + independent spec) or edits would hit both copies. */
  private reidTableClone(o: any): void {
    const fix = (g: any): void => {
      if (g?.objType !== 'table' || !g.tableId) return;
      const id = `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      g.tableId = id;
      if (g.tableSpec) { const s = JSON.parse(JSON.stringify(g.tableSpec)); g.tableSpec = s; this.tableSpecs.set(id, s); }
    };
    fix(o);
    const kids = o?._objects as FabricObject[] | undefined;
    if (kids?.length) kids.forEach((k) => fix(k));     // table inside a duplicated multi-selection
  }

  async cloneSelected(): Promise<void> {
    const active = this.canvas.getActiveObject();
    if (!active || this.isProtected(active)) return;
    const cloned = await active.clone(CUSTOM_PROPS as unknown as string[]);
    cloned.set({ left: (active.left ?? 0) + 20, top: (active.top ?? 0) + 20 });
    this.reidTableClone(cloned);
    this.canvas.add(cloned);
    this.canvas.setActiveObject(cloned);
    this.canvas.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }

  // -------------------------------------------------------------------------
  // Clipboard (copy / cut / paste) + lock + selection
  // -------------------------------------------------------------------------
  async copy(): Promise<void> {
    const active = this.canvas.getActiveObject();
    if (!active || this.isProtected(active)) return;
    this.clipboard = await active.clone(CUSTOM_PROPS as unknown as string[]);
  }

  async cut(): Promise<void> {
    if (this.isProtectedActive()) return;
    await this.copy();
    this.deleteSelected();
  }

  async paste(): Promise<void> {
    if (!this.clipboard) return;
    const clone = await this.clipboard.clone(CUSTOM_PROPS as unknown as string[]);
    clone.set({ left: (clone.left ?? 0) + 24, top: (clone.top ?? 0) + 24 });
    this.reidTableClone(clone);
    this.canvas.add(clone);
    this.canvas.setActiveObject(clone);
    this.canvas.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }

  hasClipboard(): boolean {
    return !!this.clipboard;
  }

  /** Toggle lock (movement / scaling / rotation / editing) on the active object. */
  toggleLock(): void {
    const o = this.canvas.getActiveObject() as any;
    if (!o) return;
    const locked = !!o.lockMovementX;
    o.set({
      lockMovementX: !locked,
      lockMovementY: !locked,
      lockScalingX: !locked,
      lockScalingY: !locked,
      lockRotation: !locked,
      hasControls: locked,
      editable: locked,
    });
    o.setCoords();
    this.canvas.requestRenderAll();
    this.revision.update((v) => v + 1);
    this.snapshot();
  }

  isLocked(): boolean {
    const o = this.canvas.getActiveObject() as any;
    return !!o?.lockMovementX;
  }

  /** Select every object on the canvas as one active selection. */
  selectAll(): void {
    const objs = this.canvas.getObjects().filter((o) => (o as any).selectable !== false);
    if (!objs.length) return;
    this.canvas.discardActiveObject();
    const sel = new ActiveSelection(objs, { canvas: this.canvas });
    this.canvas.setActiveObject(sel);
    this.canvas.requestRenderAll();
    this.syncSelection();
  }

  /** Hit-test the object under a pointer event and make it active (for right-click). */
  selectAtPointer(e: MouseEvent): FabricObject | null {
    const target = (this.canvas as any).findTarget(e) as FabricObject | undefined;
    if (target) {
      this.canvas.setActiveObject(target);
    } else {
      this.canvas.discardActiveObject();
    }
    this.canvas.requestRenderAll();
    this.syncSelection();
    return target ?? null;
  }

  // -------------------------------------------------------------------------
  // Text / image quick actions (used by the smart context menu)
  // -------------------------------------------------------------------------
  editText(): void {
    const o = this.canvas.getActiveObject() as any;
    if (o && o.editable !== false && typeof o.enterEditing === 'function') {
      o.enterEditing();
      o.selectAll?.();
      this.canvas.requestRenderAll();
    }
  }

  toggleStyle(prop: 'fontWeight' | 'fontStyle' | 'underline'): void {
    const o = this.canvas.getActiveObject() as any;
    if (!o) return;
    if (prop === 'fontWeight') o.set('fontWeight', o.fontWeight === 'bold' || o.fontWeight === '700' ? 'normal' : 'bold');
    else if (prop === 'fontStyle') o.set('fontStyle', o.fontStyle === 'italic' ? 'normal' : 'italic');
    else o.set('underline', !o.underline);
    this.canvas.requestRenderAll();
    this.revision.update((v) => v + 1);
    this.snapshot();
  }

  flipActive(axis: 'x' | 'y'): void {
    const o = this.canvas.getActiveObject() as any;
    if (!o) return;
    if (axis === 'x') o.set('flipX', !o.flipX); else o.set('flipY', !o.flipY);
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  async replaceActiveImage(file: File): Promise<void> {
    const o = this.canvas.getActiveObject() as any;
    if (!o || o.type !== 'image' || o.objType === 'signature') return;
    const url = await this.fileToUrl(file);
    await o.setSrc(url, { crossOrigin: 'anonymous' });
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  private fileToUrl(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  // -------------------------------------------------------------------------
  // Image filters
  // -------------------------------------------------------------------------
  getImageFx(): ImageFx | null {
    const o = this.canvas?.getActiveObject() as any;
    if (!o || o.type !== 'image') return null;
    return { ...DEFAULT_FX, ...(o.imgFx ?? {}) };
  }

  setImageFx(patch: Partial<ImageFx>): void {
    const o = this.canvas.getActiveObject() as any;
    if (!o || o.type !== 'image') return;
    const fx: ImageFx = { ...DEFAULT_FX, ...(o.imgFx ?? {}), ...patch };
    o.imgFx = fx;
    const F = filters as any;
    const arr: any[] = [];
    if (fx.grayscale) arr.push(new F.Grayscale());
    if (fx.sepia) arr.push(new F.ColorMatrix({ matrix: SEPIA_MATRIX }));
    if (fx.invert) arr.push(new F.Invert());
    if (fx.brightness) arr.push(new F.Brightness({ brightness: fx.brightness }));
    if (fx.contrast) arr.push(new F.Contrast({ contrast: fx.contrast }));
    if (fx.saturation) arr.push(new F.Saturation({ saturation: fx.saturation }));
    if (fx.blur) arr.push(new F.Blur({ blur: fx.blur }));
    if (fx.pixelate > 1) arr.push(new F.Pixelate({ blocksize: Math.round(fx.pixelate) }));
    if (fx.tint) arr.push(new F.BlendColor({ color: fx.tint, mode: 'tint', alpha: fx.tintAlpha }));
    o.filters = arr;
    o.applyFilters();
    this.canvas.requestRenderAll();
    this.revision.update((v) => v + 1);
  }

  resetImageFx(): void {
    const o = this.canvas.getActiveObject() as any;
    if (!o || o.type !== 'image') return;
    o.imgFx = { ...DEFAULT_FX };
    o.filters = [];
    o.applyFilters();
    this.canvas.requestRenderAll();
    this.revision.update((v) => v + 1);
    this.snapshot();
  }

  // -------------------------------------------------------------------------
  // Image: mask, frame & quick adjustments
  // -------------------------------------------------------------------------
  private activeImage(): any {
    const o = this.canvas?.getActiveObject() as any;
    return o && o.type === 'image' ? o : null;
  }

  /** Clip the selected image into a shape (circle / rounded / hexagon / star / triangle). */
  setImageMask(kind: 'none' | 'circle' | 'rounded' | 'hexagon' | 'star' | 'triangle'): void {
    const o = this.activeImage();
    if (!o) return;
    const w = o.width ?? 0, h = o.height ?? 0;
    const r = Math.min(w, h) / 2;
    const base = { originX: 'center' as const, originY: 'center' as const, left: 0, top: 0 };
    const poly = (n: number, rad: number) => {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < n; i++) { const a = (-90 + (i * 360) / n) * Math.PI / 180; pts.push({ x: rad * Math.cos(a), y: rad * Math.sin(a) }); }
      return pts;
    };
    const star = (n: number, outer: number, inner: number) => {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < n * 2; i++) { const rad = i % 2 ? inner : outer; const a = (-90 + (i * 180) / n) * Math.PI / 180; pts.push({ x: rad * Math.cos(a), y: rad * Math.sin(a) }); }
      return pts;
    };
    let clip: any = null;
    if (kind === 'circle') clip = new Circle({ ...base, radius: r });
    else if (kind === 'rounded') clip = new Rect({ ...base, width: w, height: h, rx: Math.min(w, h) * 0.14, ry: Math.min(w, h) * 0.14 });
    else if (kind === 'triangle') clip = new Triangle({ ...base, width: w, height: h });
    else if (kind === 'hexagon') clip = new Polygon(poly(6, r), base);
    else if (kind === 'star') clip = new Polygon(star(5, r, r * 0.5), base);
    o.clipPath = kind === 'none' ? undefined : clip;
    o.dirty = true;
    this.canvas.requestRenderAll();
    this.touch();
    this.snapshot();
  }

  /** Crop the selected image to an aspect ratio (centred). Pass null to clear. */
  cropImageRatio(ratio: number | null): void {
    const o = this.activeImage();
    if (!o) return;
    if (ratio == null) {
      o.clipPath = undefined;
    } else {
      const w = o.width ?? 0, h = o.height ?? 0;
      let cw = w, ch = w / ratio;
      if (ch > h) { ch = h; cw = h * ratio; }
      o.clipPath = new Rect({ originX: 'center', originY: 'center', left: 0, top: 0, width: cw, height: ch });
    }
    o.dirty = true;
    this.canvas.requestRenderAll();
    this.touch();
    this.snapshot();
  }

  /** Rotate the selected image 90° clockwise. */
  rotateImage(): void {
    const o = this.activeImage();
    if (!o) return;
    o.rotate(((o.angle ?? 0) + 90) % 360);
    o.setCoords();
    this.canvas.requestRenderAll();
    this.touch();
    this.snapshot();
  }

  /** Toggle a clean white frame around the selected image. */
  toggleImageBorder(): void {
    const o = this.activeImage();
    if (!o) return;
    const on = (o.strokeWidth ?? 0) > 0 && !!o.stroke;
    if (on) o.set({ stroke: null, strokeWidth: 0 });
    else o.set({ stroke: '#ffffff', strokeWidth: Math.max(4, Math.round((o.width ?? 200) * 0.025)), strokeUniform: true });
    o.dirty = true;
    this.canvas.requestRenderAll();
    this.touch();
    this.snapshot();
  }

  toggleImageShadow(): void {
    const o = this.activeImage();
    if (!o) return;
    o.set('shadow', o.shadow ? null : new Shadow({ color: 'rgba(15,23,42,0.35)', blur: 22, offsetX: 0, offsetY: 12 }));
    this.canvas.requestRenderAll();
    this.touch();
    this.snapshot();
  }

  setImageOpacity(pct: number): void {
    const o = this.activeImage();
    if (!o) return;
    o.set('opacity', Math.max(0.05, Math.min(1, pct / 100)));
    this.canvas.requestRenderAll();
    this.revision.update((v) => v + 1);
  }

  /** Push the selected image onto the page background. */
  useActiveImageAsBackground(): void {
    const o = this.activeImage();
    if (!o) return;
    const src = typeof o.getSrc === 'function' ? o.getSrc() : o._element?.src;
    if (src) this.setBackgroundImage(src);
  }

  // -------------------------------------------------------------------------
  // Backgrounds
  // -------------------------------------------------------------------------
  setBackgroundImageFromFile(file: File): Promise<void> {
    return this.fileToUrl(file).then((url) => this.setBackgroundImage(url));
  }

  setBackgroundGradient(c1: string, c2: string, diagonal = true): void {
    const W = this.canvas.getWidth(), H = this.canvas.getHeight();
    const g = new Gradient({
      type: 'linear',
      gradientUnits: 'pixels',
      coords: { x1: 0, y1: 0, x2: diagonal ? W : 0, y2: H },
      colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }],
    });
    this.canvas.backgroundColor = g as any;
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  /** Custom background gradient — linear (with angle) or radial, optional middle stop. */
  setBgGradientAdvanced(c1: string, c2: string, angle: number, radial: boolean, mid?: string): void {
    const W = this.canvas.getWidth(), H = this.canvas.getHeight();
    const cx = W / 2, cy = H / 2;
    const stops = mid
      ? [{ offset: 0, color: c1 }, { offset: 0.5, color: mid }, { offset: 1, color: c2 }]
      : [{ offset: 0, color: c1 }, { offset: 1, color: c2 }];
    let g: any;
    if (radial) {
      g = new Gradient({
        type: 'radial', gradientUnits: 'pixels',
        coords: { x1: cx, y1: cy, r1: 0, x2: cx, y2: cy, r2: Math.max(W, H) / 1.35 },
        colorStops: stops,
      });
    } else {
      // Match CSS linear-gradient angle semantics (0deg = upward, 90deg = →, clockwise)
      // so the on-screen preview lines up with what Fabric paints.
      const rad = (angle * Math.PI) / 180;
      const dirX = Math.sin(rad), dirY = -Math.cos(rad);
      const len = Math.abs(W * dirX) + Math.abs(H * dirY);
      const dx = (dirX * len) / 2, dy = (dirY * len) / 2;
      g = new Gradient({
        type: 'linear', gradientUnits: 'pixels',
        coords: { x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy },
        colorStops: stops,
      });
    }
    this.canvas.backgroundColor = g;
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  /** Tile a generated SVG pattern across the page background. */
  setBackgroundPattern(kind: string, fg: string, bg: string, size = 40): void {
    const svg = patternTileSvg(kind, fg, bg, size);
    const img = new Image();
    img.onload = () => {
      const p = new Pattern({ source: img, repeat: 'repeat' });
      this.canvas.backgroundColor = p as any;
      this.canvas.requestRenderAll();
      this.snapshot();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  hasBackgroundImage(): boolean { return !!this.canvas?.backgroundImage; }

  /** Re-fit the current background image (cover / contain / stretch). */
  setBgImageFit(mode: 'cover' | 'contain' | 'stretch'): void {
    const img = this.canvas.backgroundImage as any;
    if (!img) return;
    const cw = this.canvas.getWidth(), ch = this.canvas.getHeight();
    const iw = img.width ?? cw, ih = img.height ?? ch;
    if (mode === 'stretch') img.set({ scaleX: cw / iw, scaleY: ch / ih });
    else { const s = mode === 'cover' ? Math.max(cw / iw, ch / ih) : Math.min(cw / iw, ch / ih); img.set({ scaleX: s, scaleY: s }); }
    img.set({ originX: 'center', originY: 'center', left: cw / 2, top: ch / 2 });
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  setBgImageBlur(px: number): void {
    const img = this.canvas.backgroundImage as any;
    if (!img) return;
    const F = filters as any;
    img.filters = px > 0 ? [new F.Blur({ blur: px / 100 })] : [];
    img.applyFilters();
    this.canvas.requestRenderAll();
    this.revision.update((v) => v + 1);
  }

  setBgImageOpacity(pct: number): void {
    const img = this.canvas.backgroundImage as any;
    if (!img) return;
    img.set('opacity', Math.max(0.05, Math.min(1, pct / 100)));
    this.canvas.requestRenderAll();
    this.revision.update((v) => v + 1);
  }

  // -------------------------------------------------------------------------
  // Layers (operate on a specific object)
  // -------------------------------------------------------------------------
  layerObjects(): FabricObject[] { return this.canvas ? [...this.canvas.getObjects()] : []; }
  selectLayer(o: FabricObject): void { this.canvas.setActiveObject(o); this.canvas.requestRenderAll(); this.syncSelection(); }
  isActive(o: FabricObject): boolean { return this.canvas?.getActiveObject() === o; }
  toggleVisible(o: FabricObject): void { o.visible = o.visible === false; this.canvas.requestRenderAll(); this.snapshot(); }
  isVisible(o: FabricObject): boolean { return o.visible !== false; }
  toggleObjLock(o: FabricObject): void {
    const a = o as any;
    const locked = !!a.lockMovementX;
    a.set({ lockMovementX: !locked, lockMovementY: !locked, lockScalingX: !locked, lockScalingY: !locked, lockRotation: !locked, hasControls: locked, editable: locked });
    this.canvas.requestRenderAll();
    this.snapshot();
  }
  isObjLocked(o: FabricObject): boolean { return !!(o as any).lockMovementX; }
  raiseObj(o: FabricObject): void { this.canvas.bringObjectForward(o); this.canvas.requestRenderAll(); this.snapshot(); }
  lowerObj(o: FabricObject): void { this.canvas.sendObjectBackwards(o); this.canvas.requestRenderAll(); this.snapshot(); }
  removeObj(o: FabricObject): void {
    this.canvas.remove(o);
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }
  async duplicateObj(o: FabricObject): Promise<void> {
    const cl = await o.clone(CUSTOM_PROPS as unknown as string[]);
    cl.set({ left: (o.left ?? 0) + 20, top: (o.top ?? 0) + 20 });
    this.canvas.add(cl);
    this.canvas.setActiveObject(cl);
    this.canvas.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }
  /** Drag-reorder: move `drag` into `target`'s stacking slot. */
  moveLayerBefore(drag: FabricObject, target: FabricObject): void {
    if (drag === target) return;
    const ti = this.canvas.getObjects().indexOf(target);
    if (ti < 0) return;
    (this.canvas as any).moveObjectTo?.(drag, ti);
    this.canvas.requestRenderAll();
    this.snapshot();
  }
  objToFront(o: FabricObject): void { this.canvas.bringObjectToFront(o); this.canvas.requestRenderAll(); this.snapshot(); }
  objToBack(o: FabricObject): void { this.canvas.sendObjectToBack(o); this.canvas.requestRenderAll(); this.snapshot(); }
  objOpacity(o: FabricObject): number { return Math.round((((o as any).opacity ?? 1) as number) * 100); }
  setObjOpacity(o: FabricObject, pct: number): void {
    (o as any).set('opacity', Math.max(0.05, Math.min(1, pct / 100)));
    this.canvas.requestRenderAll();
    this.revision.update((v) => v + 1);
  }
  renameObj(o: FabricObject, name: string): void {
    (o as any).layerName = name.trim() || undefined;
    this.revision.update((v) => v + 1);
    this.snapshot();
  }

  // -------------------------------------------------------------------------
  // Manual ruler guides
  // -------------------------------------------------------------------------
  addVGuide(x: number): void { this.vGuides.update((a) => [...a, Math.round(x)]); }
  addHGuide(y: number): void { this.hGuides.update((a) => [...a, Math.round(y)]); }
  moveVGuide(i: number, x: number): void { this.vGuides.update((a) => a.map((v, j) => (j === i ? Math.round(x) : v))); }
  moveHGuide(i: number, y: number): void { this.hGuides.update((a) => a.map((v, j) => (j === i ? Math.round(y) : v))); }
  removeVGuide(i: number): void { this.vGuides.update((a) => a.filter((_, j) => j !== i)); }
  removeHGuide(i: number): void { this.hGuides.update((a) => a.filter((_, j) => j !== i)); }
  clearAllGuides(): void { this.vGuides.set([]); this.hGuides.set([]); }
  addCenterGuides(): void { this.addVGuide(this.canvas.getWidth() / 2); this.addHGuide(this.canvas.getHeight() / 2); }
  addMarginGuides(pct = 0.06): void {
    const W = this.canvas.getWidth(), H = this.canvas.getHeight();
    this.vGuides.update((a) => [...a, Math.round(W * pct), Math.round(W * (1 - pct))]);
    this.hGuides.update((a) => [...a, Math.round(H * pct), Math.round(H * (1 - pct))]);
  }
  /** Snap a moving object's edges/centre to the nearest manual guide. */
  private snapToManualGuides(e: { target?: FabricObject }): void {
    const o = e.target as any;
    if (!o) return;
    const vg = this.vGuides(), hg = this.hGuides();
    if (!vg.length && !hg.length) return;
    const thr = this.snapTol / (this.zoom() || 1);
    const b = o.getBoundingRect();
    const ax = [b.left, b.left + b.width / 2, b.left + b.width];
    for (const gx of vg) { for (const a of ax) { if (Math.abs(a - gx) < thr) { o.set('left', (o.left ?? 0) + (gx - a)); o.setCoords(); break; } } }
    const ay = [b.top, b.top + b.height / 2, b.top + b.height];
    for (const gy of hg) { for (const a of ay) { if (Math.abs(a - gy) < thr) { o.set('top', (o.top ?? 0) + (gy - a)); o.setCoords(); break; } } }
  }

  // -------------------------------------------------------------------------
  // Table — select every part of a table as one movable selection
  // -------------------------------------------------------------------------
  tableIdOf(o: FabricObject | null): string | null {
    return o ? ((o as any).tableId ?? null) : null;
  }
  selectTable(o: FabricObject): void {
    const id = (o as any).tableId;
    if (!id) return;
    const parts = this.canvas.getObjects().filter((x) => (x as any).tableId === id);
    if (!parts.length) return;
    this.canvas.discardActiveObject();
    const sel = new ActiveSelection(parts, { canvas: this.canvas });
    this.canvas.setActiveObject(sel);
    this.canvas.requestRenderAll();
    this.syncSelection();
  }

  bringForward(): void {
    const o = this.canvas.getActiveObject();
    if (o) { this.canvas.bringObjectForward(o); this.canvas.requestRenderAll(); this.snapshot(); }
  }
  sendBackwards(): void {
    const o = this.canvas.getActiveObject();
    if (o) { this.canvas.sendObjectBackwards(o); this.canvas.requestRenderAll(); this.snapshot(); }
  }
  bringToFront(): void {
    const o = this.canvas.getActiveObject();
    if (o) { this.canvas.bringObjectToFront(o); this.canvas.requestRenderAll(); this.snapshot(); }
  }
  sendToBack(): void {
    const o = this.canvas.getActiveObject();
    if (o) { this.canvas.sendObjectToBack(o); this.canvas.requestRenderAll(); this.snapshot(); }
  }

  /** Update one or more properties on the active object. */
  setProp(props: Record<string, unknown>): void {
    const o = this.canvas.getActiveObject();
    if (!o) return;
    o.set(props);
    o.setCoords();
    this.canvas.requestRenderAll();
    this.revision.update((v) => v + 1);
  }

  commit(): void {
    this.snapshot();
  }

  align(mode: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'): void {
    const o = this.canvas.getActiveObject();
    if (!o) return;
    const w = this.canvas.getWidth();
    const h = this.canvas.getHeight();
    const b = o.getBoundingRect();
    switch (mode) {
      case 'left': o.set({ left: (o.left ?? 0) - b.left }); break;
      case 'right': o.set({ left: (o.left ?? 0) + (w - (b.left + b.width)) }); break;
      case 'center-h': o.set({ left: (o.left ?? 0) + (w / 2 - (b.left + b.width / 2)) }); break;
      case 'top': o.set({ top: (o.top ?? 0) - b.top }); break;
      case 'bottom': o.set({ top: (o.top ?? 0) + (h - (b.top + b.height)) }); break;
      case 'center-v': o.set({ top: (o.top ?? 0) + (h / 2 - (b.top + b.height / 2)) }); break;
    }
    o.setCoords();
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  // -------------------------------------------------------------------------
  // Arrange: align / distribute / group (selection-aware)
  // -------------------------------------------------------------------------
  private selectedObjects(): FabricObject[] {
    const a = this.canvas.getActiveObject() as any;
    if (!a) return [];
    if (a.type === 'activeselection' && a.getObjects) return [...a.getObjects()];
    return [a];
  }

  private reselect(objs: FabricObject[]): void {
    this.canvas.discardActiveObject();
    if (objs.length > 1) {
      const sel = new ActiveSelection(objs, { canvas: this.canvas });
      this.canvas.setActiveObject(sel);
    } else if (objs[0]) {
      this.canvas.setActiveObject(objs[0]);
    }
    this.canvas.requestRenderAll();
    this.syncSelection();
  }

  /** Align objects relative to each other when several are selected, else to the canvas. */
  alignObjects(mode: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'): void {
    const objs = this.selectedObjects();
    if (objs.length <= 1) { this.align(mode); return; }
    this.canvas.discardActiveObject();
    objs.forEach((o) => o.setCoords());
    const rects = objs.map((o) => ({ o, b: o.getBoundingRect() }));
    const left = Math.min(...rects.map((r) => r.b.left));
    const right = Math.max(...rects.map((r) => r.b.left + r.b.width));
    const top = Math.min(...rects.map((r) => r.b.top));
    const bottom = Math.max(...rects.map((r) => r.b.top + r.b.height));
    for (const { o, b } of rects) {
      let dx = 0, dy = 0;
      switch (mode) {
        case 'left': dx = left - b.left; break;
        case 'center-h': dx = (left + right) / 2 - (b.left + b.width / 2); break;
        case 'right': dx = right - (b.left + b.width); break;
        case 'top': dy = top - b.top; break;
        case 'center-v': dy = (top + bottom) / 2 - (b.top + b.height / 2); break;
        case 'bottom': dy = bottom - (b.top + b.height); break;
      }
      o.set({ left: (o.left ?? 0) + dx, top: (o.top ?? 0) + dy });
      o.setCoords();
    }
    this.reselect(objs);
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  /** Evenly space 3+ selected objects along an axis. */
  distributeObjects(axis: 'h' | 'v'): void {
    const objs = this.selectedObjects();
    if (objs.length < 3) return;
    this.canvas.discardActiveObject();
    objs.forEach((o) => o.setCoords());
    const rects = objs.map((o) => ({ o, b: o.getBoundingRect() }));
    const cen = (r: { b: any }) => (axis === 'h' ? r.b.left + r.b.width / 2 : r.b.top + r.b.height / 2);
    rects.sort((a, b) => cen(a) - cen(b));
    const c0 = cen(rects[0]);
    const c1 = cen(rects[rects.length - 1]);
    const step = (c1 - c0) / (rects.length - 1);
    rects.forEach((r, i) => {
      const d = c0 + step * i - cen(r);
      if (axis === 'h') r.o.set({ left: (r.o.left ?? 0) + d });
      else r.o.set({ top: (r.o.top ?? 0) + d });
      r.o.setCoords();
    });
    this.reselect(objs);
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  /** Group the active multi-selection into a single object. */
  groupActive(): void {
    const a = this.canvas.getActiveObject() as any;
    if (!a || a.type !== 'activeselection' || !a.getObjects) return;
    const objs = [...a.getObjects()];
    this.canvas.discardActiveObject();
    for (const o of objs) this.canvas.remove(o);
    const group = new Group(objs);
    (group as any).objType = 'group';
    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.canvas.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }

  /** Break a selected group back into its objects. */
  ungroupActive(): void {
    const g = this.canvas.getActiveObject() as any;
    if (!g || g.type !== 'group' || !g.removeAll) return;
    const objs: FabricObject[] = g.removeAll();
    this.canvas.remove(g);
    for (const o of objs) this.canvas.add(o);
    this.reselect(objs);
    this.snapshot();
  }

  // -------------------------------------------------------------------------
  // Style clipboard (format painter) + nudge
  // -------------------------------------------------------------------------
  private styleClip: Record<string, any> | null = null;
  private readonly STYLE_KEYS = ['fill', 'stroke', 'strokeWidth', 'opacity', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'underline', 'linethrough', 'textAlign', 'charSpacing', 'lineHeight', 'rx', 'ry'];

  copyStyle(): void {
    const o = this.canvas.getActiveObject() as any;
    if (!o) return;
    const s: Record<string, any> = {};
    for (const k of this.STYLE_KEYS) if (o[k] !== undefined) s[k] = o[k];
    this.styleClip = s;
  }
  hasStyleClip(): boolean { return !!this.styleClip; }
  pasteStyle(): void {
    const o = this.canvas.getActiveObject() as any;
    if (!o || !this.styleClip) return;
    const apply = (t: any) => { for (const k of Object.keys(this.styleClip!)) { try { t.set(k, this.styleClip![k]); } catch { /* skip */ } } t.dirty = true; };
    if (o.type === 'activeselection' && o.getObjects) o.getObjects().forEach(apply);
    else apply(o);
    this.canvas.requestRenderAll();
    this.touch();
    this.snapshot();
  }

  /** Move the active object/selection by a pixel delta (arrow-key nudge). */
  nudgeActive(dx: number, dy: number): void {
    const o = this.canvas.getActiveObject();
    if (!o) return;
    o.set({ left: (o.left ?? 0) + dx, top: (o.top ?? 0) + dy });
    o.setCoords();
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  // -------------------------------------------------------------------------
  // Canvas background & size
  // -------------------------------------------------------------------------
  setBackgroundColor(color: string): void {
    this.canvas.backgroundColor = color;
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  async setBackgroundImage(url: string): Promise<void> {
    const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
    const cw = this.canvas.getWidth(), ch = this.canvas.getHeight();
    const iw = img.width ?? cw, ih = img.height ?? ch;
    // "cover": fill the canvas, keep aspect ratio, centre (no distortion).
    const scale = Math.max(cw / iw, ch / ih);
    img.set({ scaleX: scale, scaleY: scale, originX: 'center', originY: 'center', left: cw / 2, top: ch / 2 });
    this.canvas.backgroundImage = img;
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  removeBackgroundImage(): void {
    this.canvas.backgroundImage = undefined;
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  resize(width: number, height: number): void {
    this.canvas.setDimensions({ width, height });
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  // -------------------------------------------------------------------------
  // Zoom (visual only — does not affect export resolution)
  // -------------------------------------------------------------------------
  setZoom(z: number): void {
    const clamped = Math.min(3, Math.max(0.2, z));
    this.canvas.setZoom(clamped);
    this.zoom.set(clamped);
  }

  // -------------------------------------------------------------------------
  // Serialization
  // -------------------------------------------------------------------------
  toJSON(): string {
    // Use toObject (not toJSON) so our custom props are reliably serialized in Fabric v6.
    // Always persist {{placeholders}} even when a sample-data preview is active.
    const fields = this.canvas.getObjects().filter((o) => (o as any).objType === 'field');
    const saved = fields.map((o) => (o as any).text);
    fields.forEach((o) => (o as any).set('text', `{{${(o as any).fieldKey}}}`));
    const json = JSON.stringify(this.canvas.toObject(CUSTOM_PROPS as unknown as string[]));
    fields.forEach((o, i) => (o as any).set('text', saved[i]));
    return json;
  }

  async loadJSON(json: string): Promise<void> {
    if (!json) return;
    this.isRestoring = true;
    await this.canvas.loadFromJSON(json);
    this.canvas.requestRenderAll();
    this.isRestoring = false;
    this.seedHistory('Document opened', 'flag');
    this.syncSelection();
  }

  clear(): void {
    this.canvas.clear();
    this.canvas.backgroundColor = '#ffffff';
    this.canvas.requestRenderAll();
    this.snapshot();
  }

  /** Replace the whole canvas with a ready-made template layout, then resize to fit. */
  applyTemplate(width: number, height: number, items: TemplateItem[], bg = '#ffffff'): void {
    const c = this.canvas;
    this.isRestoring = true;
    c.clear();
    c.backgroundColor = bg;
    c.setDimensions({ width, height });
    for (const obj of this.buildTemplateObjects(items)) c.add(obj);
    c.requestRenderAll();
    this.isRestoring = false;
    this.seedHistory('Template applied', 'grid_view');
    this.syncSelection();
    this.revision.update((v) => v + 1);
  }

  /** Render a template's layout to a small PNG thumbnail (for the Templates gallery). */
  async renderTemplatePreview(width: number, height: number, items: TemplateItem[], bg = '#ffffff', maxW = 280): Promise<string> {
    if (document.fonts?.ready) { try { await document.fonts.ready; } catch { /* ignore */ } }
    const el = document.createElement('canvas');
    const sc = new StaticCanvas(el, { width, height, backgroundColor: bg, enableRetinaScaling: false });
    for (const obj of this.buildTemplateObjects(items)) sc.add(obj);
    sc.renderAll();
    const url = sc.toDataURL({ format: 'png', multiplier: Math.min(1, maxW / width) });
    sc.dispose();
    return url;
  }

  /** Build the Fabric objects for a template layout (shared by apply + preview). */
  private buildTemplateObjects(items: TemplateItem[]): FabricObject[] {
    const grad = (from: string, to: string, w: number, h: number) =>
      new Gradient({ type: 'linear', gradientUnits: 'pixels', coords: { x1: 0, y1: 0, x2: w, y2: h }, colorStops: [{ offset: 0, color: from }, { offset: 1, color: to }] });
    const out: FabricObject[] = [];
    for (const it of items) {
      let obj: any;
      if (it.kind === 'text' || it.kind === 'field') {
        const tb = new Textbox(it.kind === 'field' ? `{{${it.key}}}` : (it.text ?? ''), {
          left: it.x, top: it.y, width: it.w ?? 420,
          fontSize: it.fontSize ?? 24, fill: it.fill ?? '#0f172a',
          fontFamily: it.fontFamily ?? 'Inter', fontWeight: (it.fontWeight ?? '400') as any,
          fontStyle: (it.fontStyle ?? 'normal') as any, charSpacing: it.charSpacing ?? 0, lineHeight: it.lineHeight ?? 1.16,
          direction: (it.dir ?? 'ltr') as any,
          textAlign: it.align ?? 'center', originX: 'center', originY: 'center',
          editable: it.kind !== 'field',
        });
        (tb as any).objType = it.kind === 'field' ? 'field' : 'text';
        if (it.kind === 'field') (tb as any).fieldKey = it.key;
        obj = tb;
      } else if (it.kind === 'line') {
        const half = (it.w ?? 240) / 2;
        obj = new Line([it.x - half, it.y, it.x + half, it.y], { stroke: it.stroke ?? '#0f172a', strokeWidth: it.strokeWidth ?? 2 });
      } else if (it.kind === 'rect') {
        const w = it.w ?? 200, h = it.h ?? 120;
        obj = new Rect({
          left: it.x, top: it.y, width: w, height: h,
          fill: it.grad ? grad(it.fill ?? '#000', it.grad, w, h) as any : (it.fill ?? ''),
          stroke: it.stroke ?? '', strokeWidth: it.strokeWidth ?? 0,
          rx: it.rx ?? 0, ry: it.rx ?? 0, originX: 'center', originY: 'center',
        });
      } else if (it.kind === 'circle') {
        const r = (it.w ?? 100) / 2;
        obj = new Circle({
          left: it.x, top: it.y, radius: r,
          fill: it.grad ? grad(it.fill ?? '#000', it.grad, r * 2, r * 2) as any : (it.fill ?? ''),
          stroke: it.stroke ?? '', strokeWidth: it.strokeWidth ?? 0, originX: 'center', originY: 'center',
        });
      } else if (it.kind === 'triangle') {
        const w = it.w ?? 100, h = it.h ?? 100;
        obj = new Triangle({
          left: it.x, top: it.y, width: w, height: h,
          fill: it.grad ? grad(it.fill ?? '#000', it.grad, w, h) as any : (it.fill ?? '#000'),
          originX: 'center', originY: 'center',
        });
      } else if (it.kind === 'seal') {
        obj = this.buildSeal(it.x, it.y, it.w ?? 120, it.fill ?? '#b08d2e', it.stroke ?? '#0f172a');
      }
      if (obj) {
        if (it.angle != null) obj.set('angle', it.angle);
        if (it.opacity != null) obj.set('opacity', it.opacity);
        out.push(obj);
      }
    }
    return out;
  }

  /** A scalloped award seal (star + ring) used by certificate template layouts. */
  private buildSeal(x: number, y: number, size: number, fill: string, inner: string): FabricObject {
    const r = size / 2, n = 16;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < n * 2; i++) {
      const rad = i % 2 ? r : r * 0.84;
      const a = (i * Math.PI) / n - Math.PI / 2;
      pts.push({ x: rad * Math.cos(a), y: rad * Math.sin(a) });
    }
    const scallop = new Polygon(pts, { fill, originX: 'center', originY: 'center', left: 0, top: 0 });
    const ring = new Circle({ radius: r * 0.7, fill: '', stroke: fill, strokeWidth: Math.max(1.5, r * 0.05), originX: 'center', originY: 'center', left: 0, top: 0 });
    const disc = new Circle({ radius: r * 0.64, fill: inner, originX: 'center', originY: 'center', left: 0, top: 0 });
    const star = new Textbox('★', { fontSize: r * 0.8, fill, textAlign: 'center', width: size, originX: 'center', originY: 'center', left: 0, top: -r * 0.02, editable: false });
    const g = new Group([scallop, ring, disc, star], { left: x, top: y, originX: 'center', originY: 'center' });
    (g as any).objType = 'stamp';
    return g;
  }

  /** All distinct {{field}} keys found in the design (recurses into groups). */
  getPlaceholders(): string[] {
    const keys = new Set<string>();
    const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    const scan = (objs: FabricObject[]): void => {
      for (const o of objs) {
        const t = (o as any).text as string | undefined;
        if (typeof t === 'string') {
          let m: RegExpExecArray | null;
          while ((m = re.exec(t)) !== null) keys.add(m[1]);
          re.lastIndex = 0;
        }
        const fk = (o as any).fieldKey as string | undefined;
        if (fk) keys.add(fk);
        const kids = (o as any)._objects as FabricObject[] | undefined;
        if (kids?.length) scan(kids);
      }
    };
    scan(this.canvas.getObjects());
    return [...keys];
  }

  // -------------------------------------------------------------------------
  // Variables present on the canvas (Variables panel: add once / remove / select)
  // -------------------------------------------------------------------------
  /** Distinct fieldKeys of standalone {{variable}} objects currently on the canvas. */
  usedFieldKeys(): string[] {
    const keys = new Set<string>();
    for (const o of this.canvas.getObjects()) {
      if ((o as any).objType === 'field') {
        const k = (o as any).fieldKey as string | undefined;
        if (k) keys.add(k);
      }
    }
    return [...keys];
  }

  /** Remove every standalone field object that uses the given key. */
  removeField(key: string): void {
    const targets = this.canvas.getObjects().filter((o) => (o as any).objType === 'field' && (o as any).fieldKey === key);
    if (!targets.length) return;
    for (const o of targets) this.canvas.remove(o);
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
    this.syncSelection();
    this.snapshot();
  }

  /** Select the (first) field object that uses the given key. */
  selectField(key: string): void {
    const o = this.canvas.getObjects().find((x) => (x as any).objType === 'field' && (x as any).fieldKey === key);
    if (!o) return;
    this.canvas.setActiveObject(o);
    this.canvas.requestRenderAll();
    this.syncSelection();
  }

  /** Add the field if missing, otherwise remove it. Returns whether it is now on the canvas. */
  toggleField(key: string): boolean {
    const clean = key.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (!clean) return false;
    if (this.usedFieldKeys().includes(clean)) {
      this.removeField(clean);
      return false;
    }
    this.addField(clean);
    return true;
  }

  /** Live design preview: show sample values in place of {{placeholders}}. */
  setFieldPreview(map: Record<string, string>): void {
    for (const o of this.canvas.getObjects()) {
      const f = o as any;
      if (f.objType !== 'field') continue;
      const k = f.fieldKey as string;
      const v = map[k];
      f.set('text', v != null && v !== '' ? v : `{{${k}}}`);
      f.initDimensions?.();
      f.set('dirty', true);
    }
    this.canvas.requestRenderAll();
    this.revision.update((x) => x + 1);
  }

  /** Restore every field object to its {{placeholder}} text. */
  clearFieldPreview(): void {
    for (const o of this.canvas.getObjects()) {
      const f = o as any;
      if (f.objType !== 'field') continue;
      f.set('text', `{{${f.fieldKey}}}`);
      f.initDimensions?.();
      f.set('dirty', true);
    }
    this.canvas.requestRenderAll();
    this.revision.update((x) => x + 1);
  }

  // -------------------------------------------------------------------------
  // Multi-page document
  // -------------------------------------------------------------------------
  private uid(): string {
    return 'p_' + Math.random().toString(36).slice(2, 9);
  }

  /** Capture a small PNG preview of the live canvas (zoom-independent). */
  private makeThumb(): string | null {
    try {
      const vt = this.canvas.viewportTransform ? [...this.canvas.viewportTransform] : null;
      this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0] as any);
      const w = this.canvas.getWidth() || 1;
      const h = this.canvas.getHeight() || 1;
      const multiplier = Math.min(160 / w, 120 / h, 1);
      const url = this.canvas.toDataURL({ format: 'png', multiplier, enableRetinaScaling: false });
      if (vt) this.canvas.setViewportTransform(vt as any);
      this.canvas.requestRenderAll();
      return url;
    } catch {
      return null;
    }
  }

  /** Write the live canvas state (json + dims + thumb) into the active page slot. */
  private commitActive(): void {
    const i = this.activePage();
    const list = this.pages();
    if (!list[i]) return;
    const next = list.slice();
    next[i] = { ...list[i], json: this.toJSON(), width: this.canvas.getWidth(), height: this.canvas.getHeight(), thumb: this.makeThumb() };
    this.pages.set(next);
  }

  /** Load a page into the live canvas WITHOUT committing the previous one. */
  private loadPage(index: number): void {
    const page = this.pages()[index];
    if (!page) return;
    this.activePage.set(index);
    this.isRestoring = true;
    this.canvas.setDimensions({ width: page.width, height: page.height });
    const finish = () => {
      this.canvas.requestRenderAll();
      this.isRestoring = false;
      this.seedHistory('Page opened', 'description');
      this.syncSelection();
      this.revision.update((v) => v + 1);
    };
    if (page.json) {
      this.canvas.loadFromJSON(page.json).then(finish);
    } else {
      this.canvas.clear();
      this.canvas.backgroundColor = '#ffffff';
      finish();
    }
  }

  /** Switch the visible page (commits the current one first). */
  goToPage(index: number): void {
    if (index === this.activePage() || index < 0 || index >= this.pages().length) return;
    this.commitActive();
    this.loadPage(index);
  }

  /** Append a blank page (same size as the current) and switch to it. */
  addPage(): void {
    this.commitActive();
    const cur = this.pages()[this.activePage()];
    const width = cur?.width ?? this.canvas.getWidth();
    const height = cur?.height ?? this.canvas.getHeight();
    const page: CanvasPage = { id: this.uid(), name: `Page ${this.pages().length + 1}`, width, height, json: null, thumb: null };
    this.pages.set([...this.pages(), page]);
    this.loadPage(this.pages().length - 1);
  }

  /** Duplicate a page (defaults to the active one) and switch to the copy. */
  duplicatePage(index = this.activePage()): void {
    this.commitActive();
    const list = this.pages();
    const src = list[index];
    if (!src) return;
    const copy: CanvasPage = { ...src, id: this.uid(), name: `${src.name} copy` };
    this.pages.set([...list.slice(0, index + 1), copy, ...list.slice(index + 1)]);
    this.loadPage(index + 1);
  }

  /** Delete a page (keeps a minimum of one). */
  deletePage(index = this.activePage()): void {
    const list = this.pages();
    if (list.length <= 1) return;
    const wasActive = index === this.activePage();
    if (!wasActive) this.commitActive();
    const next = list.filter((_, k) => k !== index);
    this.pages.set(next);
    let active = this.activePage();
    if (wasActive) active = Math.min(index, next.length - 1);
    else if (index < active) active = active - 1;
    this.activePage.set(-1);          // force loadPage to (re)load fresh
    this.loadPage(active);
  }

  /** Rename a page. */
  renamePage(index: number, name: string): void {
    const list = this.pages();
    if (!list[index]) return;
    const next = list.slice();
    next[index] = { ...list[index], name: name.trim() || list[index].name };
    this.pages.set(next);
  }

  /** Move a page to a new position; keeps the same page active. */
  reorderPages(from: number, to: number): void {
    const list = this.pages().slice();
    if (from < 0 || to < 0 || from >= list.length || to >= list.length || from === to) return;
    this.commitActive();
    const activeId = list[this.activePage()]?.id;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    this.pages.set(list);
    const idx = list.findIndex((p) => p.id === activeId);
    this.activePage.set(idx < 0 ? 0 : idx);
  }

  /** Export every page for persistence / bulk generation. */
  exportDocument(): { pages: { name: string; width: number; height: number; json: string }[] } {
    this.commitActive();
    return { pages: this.pages().map((p) => ({ name: p.name, width: p.width, height: p.height, json: p.json ?? '' })) };
  }

  // -------------------------------------------------------------------------
  // Undo / redo
  // -------------------------------------------------------------------------
  /** Reset the timeline to a single starting point (on load / template / page switch). */
  private seedHistory(label = 'Document opened', icon = 'flag'): void {
    this.states = [this.toJSON()];
    this.counts = [this.canvas.getObjects().length];
    this.hindex = 0;
    this.history.set([{ label, icon, at: Date.now() }]);
    this.historyIndex.set(0);
    this.updateUndoRedoFlags();
  }

  private snapshot(): void {
    if (this.isRestoring) return;
    const count = this.canvas.getObjects().length;
    const meta = this.describeChange(count);
    // Drop any "redo" branch ahead of the current point.
    if (this.hindex < this.states.length - 1) {
      this.states.splice(this.hindex + 1);
      this.counts.splice(this.hindex + 1);
      this.history.set(this.history().slice(0, this.hindex + 1));
    }
    this.states.push(this.toJSON());
    this.counts.push(count);
    this.history.update((l) => [...l, { label: meta.label, icon: meta.icon, at: Date.now() }]);
    this.hindex = this.states.length - 1;
    // Cap the timeline length.
    if (this.states.length > 80) {
      this.states.shift(); this.counts.shift();
      this.history.update((l) => l.slice(1));
      this.hindex = this.states.length - 1;
    }
    this.historyIndex.set(this.hindex);
    this.updateUndoRedoFlags();
    this.revision.update((v) => v + 1);
  }

  /** Infer a friendly label + icon for a change by comparing object counts. */
  private describeChange(count: number): { label: string; icon: string } {
    if (this.hindex < 0) return { label: 'Document opened', icon: 'flag' };
    const prev = this.counts[this.hindex] ?? count;
    if (count > prev) {
      const objs = this.canvas.getObjects();
      return { label: 'Added ' + this.niceType(objs[objs.length - 1]), icon: 'add_circle' };
    }
    if (count < prev) return { label: 'Removed element', icon: 'remove_circle' };
    return { label: 'Edited design', icon: 'edit' };
  }
  private niceType(o: any): string {
    if (!o) return 'element';
    if (o.objType === 'field') return 'variable';
    if (o.objType === 'signature') return 'signature';
    if (o.objType === 'qr') return 'QR code';
    if (o.objType === 'table') return 'table';
    if (/image/i.test(o.type)) return 'image';
    if (o.type === 'textbox' || o.type === 'text') return 'text';
    if (o.type === 'group' || o.type === 'activeselection') return 'group';
    return 'shape';
  }

  async undo(): Promise<void> {
    if (this.hindex <= 0) return;
    this.hindex--;
    this.historyIndex.set(this.hindex);
    await this.restore(this.states[this.hindex]);
  }

  async redo(): Promise<void> {
    if (this.hindex >= this.states.length - 1) return;
    this.hindex++;
    this.historyIndex.set(this.hindex);
    await this.restore(this.states[this.hindex]);
  }

  /** Jump to any point on the history timeline. */
  async revertTo(index: number): Promise<void> {
    if (index < 0 || index >= this.states.length || index === this.hindex) return;
    this.hindex = index;
    this.historyIndex.set(index);
    await this.restore(this.states[index]);
  }

  private async restore(json: string): Promise<void> {
    this.isRestoring = true;
    await this.canvas.loadFromJSON(json);
    this.canvas.requestRenderAll();
    this.isRestoring = false;
    this.updateUndoRedoFlags();
    this.syncSelection();
  }

  private updateUndoRedoFlags(): void {
    this.canUndo.set(this.hindex > 0);
    this.canRedo.set(this.hindex < this.states.length - 1);
  }
}

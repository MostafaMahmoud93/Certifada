import { Canvas, StaticCanvas, FabricImage } from 'fabric';
import { jsPDF } from 'jspdf';

/** High-resolution PNG data URL from a live canvas. */
export function exportPng(canvas: Canvas, multiplier = 2): string {
  return canvas.toDataURL({ format: 'png', multiplier });
}

/** SVG markup string from a live canvas. */
export function exportSvg(canvas: Canvas): string {
  return canvas.toSVG();
}

/** Build a jsPDF document sized to the canvas, with the rendered PNG placed full-bleed. */
export function exportPdf(canvas: Canvas, multiplier = 2): jsPDF {
  const width = canvas.getWidth();
  const height = canvas.getHeight();
  const dataUrl = canvas.toDataURL({ format: 'png', multiplier });
  const doc = new jsPDF({
    orientation: width >= height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height],
    compress: true,
  });
  doc.addImage(dataUrl, 'PNG', 0, 0, width, height);
  return doc;
}

/**
 * Replace every {{placeholder}} in the serialized canvas JSON with values from
 * `data`. Unknown placeholders are left untouched. Used for bulk generation.
 */
export function mergeDataIntoJson(json: string, data: Record<string, string>): string {
  return json.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (full, key: string) =>
    Object.prototype.hasOwnProperty.call(data, key) ? escapeForJson(data[key] ?? '') : full,
  );
}

/**
 * Replace the image source of every signature object (objType === 'signature')
 * in the canvas JSON with the issuer's saved signature. Used so bulk-generated
 * certificates carry the user's profile signature.
 */
export function applySignature(json: string, signatureUrl: string | null): string {
  if (!signatureUrl) return json;
  try {
    const root = JSON.parse(json);
    const walk = (arr: any[]): void => {
      for (const o of arr ?? []) {
        if (o && o.objType === 'signature' && /image/i.test(o.type ?? '')) o.src = signatureUrl;
        if (o && Array.isArray(o.objects)) walk(o.objects);
      }
    };
    walk(root.objects);
    return JSON.stringify(root);
  } catch {
    return json;
  }
}

/** Escape a value so it remains valid inside a JSON string literal. */
function escapeForJson(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Render a canvas JSON (with data already merged) to a PNG data URL using an
 * offscreen StaticCanvas. Used for bulk generation without touching the editor.
 * When signatureUrl/pendingApproval is supplied, signature placeholders are
 * filled with the signature image (or a Pending Approval stamp).
 */
export async function renderJsonToPng(
  json: string,
  width: number,
  height: number,
  multiplier = 2,
  signatureUrl: string | null = null,
  pendingApproval = false,
): Promise<string> {
  // Make sure web fonts are ready so text isn't rendered with a fallback font.
  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* ignore */ }
  }
  const el = document.createElement('canvas');
  const sc = new StaticCanvas(el, { width, height });
  await sc.loadFromJSON(json);
  if (signatureUrl || pendingApproval) { try { await applySignatureFields(sc, signatureUrl, pendingApproval); } catch { /* leave fields as-is */ } }
  sc.renderAll();
  const dataUrl = sc.toDataURL({ format: 'png', multiplier });
  sc.dispose();
  return dataUrl;
}

/**
 * Paint the issuer's signature into every signature placeholder on a rendered
 * canvas — covering all three placeholder shapes:
 *   1. a plain signature image block (objType 'signature')
 *   2. a signature block group (image + line + caption)
 *   3. a signature text field ({{signatureN}} / objType 'field' named signature)
 * The source is trimmed of transparent margins and fitted to each placeholder's
 * box so the ink fills the space instead of rendering as a tiny mark. When
 * pending, an amber "Pending Approval" stamp is used instead of the signature.
 */
async function applySignatureFields(sc: StaticCanvas, rawUrl: string | null, pending = false): Promise<void> {
  const url = pending ? pendingStampUrl() : await trimTransparent(rawUrl || '');
  if (!url) return;
  for (const o of [...sc.getObjects()] as any[]) {
    const isImage = /image/i.test(o?.type || '');
    const isPlainBlock = o?.objType === 'signature' && isImage;
    const isGroupBlock = o?.objType === 'signature' && !isImage && typeof o?.getObjects === 'function';
    const isField =
      (o?.objType === 'field' && /^signature\d*$/i.test(o.fieldKey || '')) ||
      (typeof o?.text === 'string' && /\{\{\s*signature\d*\s*\}\}/i.test(o.text));
    try {
      if (isPlainBlock) {
        await swapAndFit(o, url);
      } else if (isGroupBlock) {
        const inner = o.getObjects().find((c: any) => c.objType === 'signature' || /image/i.test(c.type || ''));
        if (inner) { await swapAndFit(inner, url); o.dirty = true; o.set?.('dirty', true); }
      } else if (isField) {
        const c = o.getCenterPoint();
        const fieldW = typeof o.getScaledWidth === 'function' ? o.getScaledWidth() : (o.width || 240);
        const img = await FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
        const targetW = Math.max(120, Math.min(fieldW || 240, 280));
        let s = targetW / (img.width || targetW);
        const maxH = 120;                                          // keep it from overrunning the line/caption
        if ((img.height || 0) * s > maxH) s = maxH / (img.height || maxH);
        const idx = sc.getObjects().indexOf(o);
        img.set({ originX: 'center', originY: 'center', left: c.x, top: c.y, scaleX: s, scaleY: s, angle: o.angle || 0 });
        sc.remove(o);
        if (idx >= 0) sc.insertAt(idx, img); else sc.add(img);     // keep original stacking so the line stays visible
      }
    } catch { /* leave this placeholder as-is on failure */ }
  }
}

/** Swap an image object's source to the signature and rescale it to fit its current box (preserving aspect). */
async function swapAndFit(img: any, url: string): Promise<void> {
  const w = typeof img.getScaledWidth === 'function' ? img.getScaledWidth() : (img.width || 200) * (img.scaleX || 1);
  const h = typeof img.getScaledHeight === 'function' ? img.getScaledHeight() : (img.height || 70) * (img.scaleY || 1);
  await img.setSrc(url, { crossOrigin: 'anonymous' });
  const nw = img.width || w || 200, nh = img.height || h || 70;
  let s = (w || 200) / nw;
  if (nh * s > (h || 70)) s = (h || 70) / nh;                      // fit within the box, keep aspect ratio
  img.scaleX = s; img.scaleY = s;
  img.dirty = true;
}

/** An amber "Pending Approval" rubber stamp, sized to drop into a signature placeholder. */
function pendingStampUrl(): string {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='340' height='128' viewBox='0 0 340 128'>" +
    "<g transform='rotate(-7 170 64)'>" +
    "<rect x='6' y='6' width='328' height='116' rx='16' fill='none' stroke='#d97706' stroke-width='3.5' stroke-dasharray='10 7'/>" +
    "<text x='170' y='58' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='30' font-weight='800' fill='#d97706' letter-spacing='1.5'>PENDING</text>" +
    "<text x='170' y='92' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='23' font-weight='700' fill='#b45309' letter-spacing='5'>APPROVAL</text>" +
    "</g></svg>";
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/** Crop fully-transparent margins off a PNG data URL so the signature fills its box. Returns the original on any failure. */
function trimTransparent(url: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const w = img.naturalWidth, h = img.naturalHeight;
          if (!w || !h) return resolve(url);
          const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          const ctx = cv.getContext('2d'); if (!ctx) return resolve(url);
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, w, h).data;
          let minX = w, minY = h, maxX = -1, maxY = -1;
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              if (data[(y * w + x) * 4 + 3] > 10) {                // non-transparent pixel
                if (x < minX) minX = x; if (x > maxX) maxX = x;
                if (y < minY) minY = y; if (y > maxY) maxY = y;
              }
            }
          }
          if (maxX < minX || maxY < minY) return resolve(url);     // nothing drawn / opaque image
          const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.05) + 2;
          minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
          maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
          const cw = maxX - minX + 1, ch = maxY - minY + 1;
          if (cw >= w && ch >= h) return resolve(url);             // already tight
          const out = document.createElement('canvas'); out.width = cw; out.height = ch;
          const octx = out.getContext('2d'); if (!octx) return resolve(url);
          octx.drawImage(cv, minX, minY, cw, ch, 0, 0, cw, ch);
          resolve(out.toDataURL('image/png'));
        } catch { resolve(url); }
      };
      img.onerror = () => resolve(url);
      img.src = url;
    } catch { resolve(url); }
  });
}

/** Same as renderJsonToPng but returns a single-page jsPDF. */
export async function renderJsonToPdf(
  json: string,
  width: number,
  height: number,
  multiplier = 2,
): Promise<jsPDF> {
  const png = await renderJsonToPng(json, width, height, multiplier);
  const doc = new jsPDF({
    orientation: width >= height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [width, height],
    compress: true,
  });
  doc.addImage(png, 'PNG', 0, 0, width, height);
  return doc;
}

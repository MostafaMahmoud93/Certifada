import { Canvas, StaticCanvas } from 'fabric';
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
 */
export async function renderJsonToPng(
  json: string,
  width: number,
  height: number,
  multiplier = 2,
): Promise<string> {
  // Make sure web fonts are ready so text isn't rendered with a fallback font.
  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* ignore */ }
  }
  const el = document.createElement('canvas');
  const sc = new StaticCanvas(el, { width, height });
  await sc.loadFromJSON(json);
  sc.renderAll();
  const dataUrl = sc.toDataURL({ format: 'png', multiplier });
  sc.dispose();
  return dataUrl;
}

/** Same as above but returns a single-page jsPDF. */
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

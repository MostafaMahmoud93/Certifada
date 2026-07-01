/**
 * Extra built-in templates: more creative CERTIFICATES (incl. Award & Training
 * types) plus a set of professional DOCUMENTS (letterhead, proposal, invoice,
 * report cover, resume, agenda). Certificates reuse the landscape builders from
 * certificate-templates.data; documents use the A4-portrait helpers below.
 */
import type { TemplateItem } from './fabric-canvas.service';
import {
  CertTemplate, W, H, CX, gold, border, wedge, corner2, nested, seal, ribbon, titleBlock, body, signature, TXT, base,
} from './certificate-templates.data';

// A4 portrait reference (96dpi)
const PW = 794, PH = 1123, PCX = 397;
const ML = 78;                       // left margin
const COLW = PW - ML * 2;            // full content width

/** Full-width horizontal band. */
const band = (y: number, h: number, fill: string, stops?: { offset: number; color: string }[], gradDir?: 'h' | 'v' | 'diag'): TemplateItem =>
  ({ kind: 'rect', x: PCX, y, w: PW, h, fill, stops, gradDir });
/** Left-aligned text anchored at the left margin (or a given left edge). */
const tL = (text: string, y: number, fontSize: number, o: { left?: number; w?: number; fill?: string; weight?: string; font?: string; spacing?: number; italic?: boolean; lh?: number } = {}): TemplateItem => {
  const w = o.w ?? COLW, left = o.left ?? ML;
  return { kind: 'text', text, x: left + w / 2, y, w, align: 'left', fontSize, fill: o.fill ?? '#1f2937', fontWeight: o.weight ?? '400', fontFamily: o.font ?? 'Inter', charSpacing: o.spacing ?? 0, fontStyle: o.italic ? 'italic' : 'normal', lineHeight: o.lh ?? 1.4 };
};
const fL = (key: string, y: number, fontSize: number, o: { left?: number; w?: number; fill?: string; weight?: string; font?: string } = {}): TemplateItem => {
  const w = o.w ?? 300, left = o.left ?? ML;
  return { kind: 'field', key, x: left + w / 2, y, w, align: 'left', fontSize, fill: o.fill ?? '#1f2937', fontWeight: o.weight ?? '400', fontFamily: o.font ?? 'Inter' };
};
const hr = (y: number, w: number, color: string, left = ML, sw = 1): TemplateItem =>
  ({ kind: 'line', x: left + w / 2, y, w, stroke: color, strokeWidth: sw });

const docBase = { cat: 'document', w: PW, h: PH } as const;

export const EXTRA_TEMPLATES: CertTemplate[] = [
  // ===================== MORE CERTIFICATES =====================
  {
    ...base, id: 'cf-ach-monogram', grp: 'Achievement', name: 'Monogram Crest', accent: '#b8902f', bg: '#fcf9f0',
    tags: 'certificate achievement gold monogram crest ring elegant landscape',
    items: [
      ...border('#c9a227', 2.6, 26, true, 11),
      { kind: 'circle', x: CX, y: 120, w: 132, fill: '', stroke: '#c9a227', strokeWidth: 2 },
      seal(CX, 120, 88),
      ...titleBlock('Achievement', '#1f2937', 'Playfair Display', 214),
      ...body({ y: 320, nameColor: '#b8902f', accent: '#c9a227', text: TXT.achievement, presented: 'This certificate is proudly presented to' }),
      ...signature([{ name: 'Eleanor Hayes', role: 'PRESIDENT' }]),
    ],
  },
  {
    ...base, id: 'cf-exc-deco', grp: 'Excellence', name: 'Art Deco Excellence', accent: '#b8902f', bg: '#faf7ee',
    tags: 'certificate excellence art deco gold geometric vintage landscape',
    items: [
      ...border('#c9a227', 1.4, 24),
      { kind: 'rect', x: CX, y: H / 2, w: W - 78, h: H - 78, fill: '', stroke: '#c9a227', strokeWidth: 0.8 },
      { kind: 'rect', x: CX - 110, y: 96, w: 14, h: 14, fill: '#c9a227', angle: 45 },
      { kind: 'rect', x: CX + 110, y: 96, w: 14, h: 14, fill: '#c9a227', angle: 45 },
      { kind: 'line', x: CX, y: 96, w: 180, stroke: '#c9a227', strokeWidth: 2 },
      ...titleBlock('Excellence', '#1f2937'),
      ...body({ nameColor: '#b8902f', accent: '#c9a227', text: TXT.excellence, presented: 'This certificate is awarded to' }),
      { kind: 'rect', x: CX - 110, y: H - 96, w: 14, h: 14, fill: '#c9a227', angle: 45 },
      { kind: 'rect', x: CX + 110, y: H - 96, w: 14, h: 14, fill: '#c9a227', angle: 45 },
      { kind: 'line', x: CX, y: H - 96, w: 180, stroke: '#c9a227', strokeWidth: 2 },
      ...signature([{ name: 'James Carter', role: 'DIRECTOR' }], '#1f2937', 612),
    ],
  },
  {
    ...base, id: 'cf-app-botanical', grp: 'Appreciation', name: 'Botanical Appreciation', accent: '#15803d', bg: '#ffffff',
    tags: 'certificate appreciation green botanical leaf nature seal landscape',
    items: [
      { kind: 'rect', x: 16, y: H / 2, w: 10, h: H - 80, fill: '', stroke: '#15803d', strokeWidth: 0, },
      wedge('tl', 250, 250, '#dcfce7'), wedge('tl', 160, 160, '#15803d'),
      wedge('br', 250, 250, '#dcfce7'), wedge('br', 160, 160, '#15803d'),
      ...border('#15803d', 1.4, 30),
      seal(CX, 108, 82, '#15803d', '#bb9b33'),
      ...titleBlock('Appreciation', '#14532d', 'Playfair Display', 192),
      ...body({ y: 302, nameColor: '#15803d', accent: '#15803d', text: TXT.appreciation, presented: 'Presented with gratitude to', ink: '#475569' }),
      ...signature([{ name: 'Hannah Scott', role: 'TEAM LEAD' }], '#14532d'),
    ],
  },
  {
    ...base, id: 'cf-com-line', grp: 'Completion', name: 'Minimal Line', accent: '#0f766e', bg: '#ffffff',
    tags: 'certificate completion minimal clean modern simple landscape',
    items: [
      { kind: 'rect', x: CX, y: H / 2, w: W - 64, h: H - 64, fill: '', stroke: '#e2e8f0', strokeWidth: 1.5 },
      { kind: 'line', x: CX, y: 96, w: 64, stroke: '#0f766e', strokeWidth: 4 },
      ...titleBlock('Completion', '#0f172a', 'Playfair Display', 168),
      ...body({ y: 320, nameColor: '#0f766e', accent: '#0f766e', nameFont: 'Great Vibes, cursive', text: TXT.completion, presented: 'This is to certify that', ink: '#64748b' }),
      ...signature([{ name: 'Michael Brown', role: 'INSTRUCTOR' }], '#0f172a', 636),
    ],
  },
  {
    ...base, id: 'cf-rec-diagonal', grp: 'Recognition', name: 'Diagonal Edge', accent: '#6d28d9', bg: '#ffffff',
    tags: 'certificate recognition purple diagonal modern bold landscape',
    items: [
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 0, y: 300 }], fill: '#ede9fe' },
      wedge('bl', 470, 360, '#5b21b6'), wedge('bl', 340, 250, '#7c3aed'), wedge('bl', 220, 160, undefined, gold()),
      wedge('tr', 320, 250, '#7c3aed'), wedge('tr', 210, 160, undefined, gold()),
      ...border('#c9a227', 1.8, 30),
      seal(CX, 108, 84, '#c9a227', '#5b21b6'),
      ...titleBlock('Recognition', '#5b21b6', 'Playfair Display', 192),
      ...body({ y: 302, nameColor: '#6d28d9', accent: '#6d28d9', text: TXT.recognition, presented: 'Proudly presented to' }),
      ...signature([{ name: 'Olivia Bennett', role: 'HR DIRECTOR' }], '#5b21b6'),
    ],
  },
  {
    ...base, id: 'cf-par-aurora', grp: 'Participation', name: 'Aurora Gradient', accent: '#4f46e5', bg: '#ffffff',
    tags: 'certificate participation gradient aurora indigo cyan modern landscape',
    items: [
      { kind: 'rect', x: CX, y: 0, w: W, h: 150, fill: '', stops: [{ offset: 0, color: '#4f46e5' }, { offset: 1, color: '#06b6d4' }], gradDir: 'h' },
      { kind: 'rect', x: CX, y: H, w: W, h: 110, fill: '', stops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#4f46e5' }], gradDir: 'h' },
      seal(CX, 150, 78, '#4f46e5', '#312e81'),
      ...titleBlock('Participation', '#312e81', 'Playfair Display', 250),
      ...body({ y: 348, nameColor: '#4f46e5', accent: '#4f46e5', text: TXT.participation, presented: 'This is to certify that', ink: '#475569' }),
      ...signature([{ name: 'Christopher Lee', role: 'PROGRAM CHAIR' }], '#312e81', 612),
    ],
  },
  {
    ...base, id: 'cf-awd-star', grp: 'Award', name: 'Star Award', accent: '#e7c873', bg: '#0e1b3a',
    tags: 'certificate award star navy gold dark prize honor landscape',
    items: [
      ...border('#c9a227', 2.6, 28, true, 10),
      ...corner2('tl', '#132451'), ...corner2('br', '#132451'),
      ...ribbon(CX, 96, 96, '#e7c873', '#0e1b3a'),
      ...titleBlock('Award', '#e7c873', 'Playfair Display', 250),
      ...body({ y: 344, nameColor: '#f0d98a', accent: '#c9a227', ink: '#aab3c5', text: 'In recognition of exceptional performance and\noutstanding contribution.', presented: 'Proudly awarded to' }),
      ...signature([{ name: 'Daniel Foster', role: 'CHAIRMAN' }], '#e2e8f0', 656),
    ],
  },
  {
    ...base, id: 'cf-trn-course', grp: 'Training', name: 'Training Course', accent: '#2563eb', bg: '#ffffff',
    tags: 'certificate training course completion modern badge blue landscape',
    items: [
      wedge('tl', 420, 300, '#2563eb'), wedge('tl', 300, 210, '#3b82f6'),
      { kind: 'rect', x: CX, y: H / 2, w: W - 60, h: H - 60, fill: '', stroke: '#2563eb', strokeWidth: 1.5 },
      seal(948, 250, 116, '#2563eb', '#1e3a8a'),
      ...titleBlock('Training', '#1e3a8a'),
      ...body({ nameColor: '#2563eb', accent: '#2563eb', text: 'has successfully completed the training course\nwith dedication and commitment.', presented: 'This is to certify that', ink: '#475569' }),
      ...signature([{ name: 'Amanda Reed', role: 'LEAD TRAINER' }], '#1e3a8a'),
    ],
  },

  // ===================== DOCUMENTS =====================
  {
    ...docBase, id: 'doc-letterhead', grp: 'Letterheads', name: 'Modern Letterhead', accent: '#1d4ed8', bg: '#ffffff',
    tags: 'document letterhead letter business header portrait',
    items: [
      band(70, 134, '', [{ offset: 0, color: '#1d4ed8' }, { offset: 1, color: '#2563eb' }], 'h'),
      { kind: 'circle', x: ML + 26, y: 70, w: 50, fill: '#ffffff', opacity: 0.18 },
      tL('{{company}}', 56, 30, { fill: '#ffffff', weight: '700', font: 'Playfair Display', left: ML + 64, w: 460 }),
      tL('Your company tagline goes here', 92, 13.5, { fill: '#dbeafe', left: ML + 64, w: 460, spacing: 40 }),
      tL('{{date}}', 248, 13, { fill: '#64748b', left: ML, w: 300 }),
      tL('Dear {{name}},', 300, 16, { weight: '700' }),
      tL('Thank you for your interest. This letterhead template gives your\nletters a clean, professional header. Replace this paragraph with\nyour message — the body text wraps naturally and stays readable.', 340, 14.5, { fill: '#334155', lh: 1.6 }),
      tL('We look forward to working with you and remain at your service\nfor any questions you may have.', 452, 14.5, { fill: '#334155', lh: 1.6 }),
      tL('Sincerely,', 556, 14.5, { fill: '#334155' }),
      { kind: 'field', key: 'signature1', x: ML + 100, y: 600, w: 180 },
      tL('{{senderName}}', 648, 15, { weight: '700' }),
      tL('{{senderTitle}}', 672, 12.5, { fill: '#64748b' }),
      band(PH - 46, 60, '#1d4ed8'),
      tL('  {{email}}   ·   {{phone}}   ·   {{website}}', PH - 50, 12, { fill: '#dbeafe', left: ML, w: COLW, spacing: 20 }),
    ],
  },
  {
    ...docBase, id: 'doc-proposal', grp: 'Letterheads', name: 'Proposal Cover', accent: '#0f172a', bg: '#0f172a',
    tags: 'document proposal cover title page business dark portrait',
    items: [
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 0, y: 0 }, { x: PW, y: 0 }, { x: PW, y: 150 }, { x: 0, y: 250 }], fill: '#1e293b' },
      { kind: 'rect', x: PCX, y: 250, w: 96, h: 5, fill: '#f59e0b' },
      tL('BUSINESS', 360, 64, { fill: '#ffffff', weight: '800', font: 'Playfair Display', w: COLW, spacing: 60 }),
      tL('PROPOSAL', 432, 64, { fill: '#f59e0b', weight: '800', font: 'Playfair Display', w: COLW, spacing: 60 }),
      tL('Prepared for', 540, 13, { fill: '#94a3b8', spacing: 120 }),
      fL('client', 572, 24, { fill: '#ffffff', weight: '700', w: COLW }),
      tL('Prepared by', 642, 13, { fill: '#94a3b8', spacing: 120 }),
      fL('company', 674, 22, { fill: '#e2e8f0', weight: '600', w: COLW }),
      { kind: 'rect', x: PCX, y: PH - 150, w: PW, h: 1.5, fill: '#334155' },
      tL('{{date}}', PH - 120, 14, { fill: '#94a3b8' }),
      tL('CONFIDENTIAL', PH - 120, 12, { fill: '#94a3b8', spacing: 120, left: PCX, w: 290 }),
    ],
  },
  {
    ...docBase, id: 'doc-invoice', grp: 'Invoices', name: 'Modern Invoice', accent: '#0ea5e9', bg: '#ffffff',
    tags: 'document invoice bill receipt payment business portrait',
    items: [
      tL('INVOICE', 88, 44, { fill: '#0f172a', weight: '800', font: 'Playfair Display', w: 360 }),
      tL('Invoice #  {{invoiceNo}}', 92, 13, { fill: '#475569', left: PCX, w: 290 }),
      tL('Date  {{date}}', 114, 13, { fill: '#475569', left: PCX, w: 290 }),
      band(170, 4, '#0ea5e9'),
      tL('BILL TO', 210, 11, { fill: '#94a3b8', weight: '700', spacing: 80 }),
      fL('client', 236, 16, { weight: '700', w: 320 }),
      tL('{{clientAddress}}', 260, 12.5, { fill: '#64748b', w: 320 }),
      tL('FROM', 210, 11, { fill: '#94a3b8', weight: '700', spacing: 80, left: 430, w: 286 }),
      tL('{{company}}', 236, 16, { weight: '700', left: 430, w: 286 }),
      tL('{{companyAddress}}', 260, 12.5, { fill: '#64748b', left: 430, w: 286 }),
      band(330, 36, '#0f172a'),
      tL('DESCRIPTION', 342, 12, { fill: '#ffffff', weight: '700', left: 92, w: 300 }),
      tL('QTY', 342, 12, { fill: '#ffffff', weight: '700', left: 430, w: 70 }),
      tL('PRICE', 342, 12, { fill: '#ffffff', weight: '700', left: 520, w: 90 }),
      tL('AMOUNT', 342, 12, { fill: '#ffffff', weight: '700', left: 626, w: 90 }),
      hr(392, COLW, '#e2e8f0'), hr(428, COLW, '#e2e8f0'), hr(464, COLW, '#e2e8f0'), hr(500, COLW, '#e2e8f0'),
      tL('Service or product item', 378, 13, { fill: '#334155', left: 92, w: 320 }),
      tL('1', 378, 13, { fill: '#334155', left: 430, w: 70 }),
      tL('$0.00', 378, 13, { fill: '#334155', left: 520, w: 90 }),
      tL('$0.00', 378, 13, { fill: '#334155', left: 626, w: 90 }),
      { kind: 'rect', x: 560, y: 560, w: 312, h: 56, fill: '#f1f5f9', rx: 8 },
      tL('TOTAL', 560, 16, { weight: '700', left: 430, w: 110 }),
      fL('total', 560, 20, { weight: '800', fill: '#0ea5e9', left: 560, w: 150 }),
      band(PH - 44, 56, '#0ea5e9'),
      tL('Thank you for your business!', PH - 48, 13, { fill: '#ffffff', weight: '600', w: COLW }),
    ],
  },
  {
    ...docBase, id: 'doc-report', grp: 'Reports', name: 'Report Cover', accent: '#0f766e', bg: '#ffffff',
    tags: 'document report cover annual title page portrait',
    items: [
      band(0, 460, '', [{ offset: 0, color: '#0f766e' }, { offset: 1, color: '#115e59' }], 'v'),
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 0, y: 460 }, { x: PW, y: 380 }, { x: PW, y: 460 }], fill: '#ffffff' },
      tL('{{year}}', 150, 15, { fill: '#99f6e4', weight: '700', spacing: 120 }),
      tL('ANNUAL', 210, 60, { fill: '#ffffff', weight: '800', font: 'Playfair Display', w: COLW }),
      tL('REPORT', 276, 60, { fill: '#ffffff', weight: '800', font: 'Playfair Display', w: COLW }),
      tL('{{subtitle}}', 352, 16, { fill: '#ccfbf1', w: COLW, lh: 1.5 }),
      { kind: 'rect', x: PCX, y: 600, w: 90, h: 5, fill: '#0f766e' },
      tL('Prepared by', 650, 12, { fill: '#94a3b8', spacing: 100 }),
      fL('author', 680, 20, { weight: '700' }),
      tL('{{department}}', 712, 13.5, { fill: '#64748b' }),
      tL('{{date}}', PH - 90, 13, { fill: '#64748b' }),
    ],
  },
  {
    ...docBase, id: 'doc-resume', grp: 'Resumes', name: 'Resume / CV', accent: '#1e293b', bg: '#ffffff',
    tags: 'document resume cv profile job application portrait',
    items: [
      { kind: 'rect', x: 132, y: PH / 2, w: 264, h: PH, fill: '#1e293b' },
      { kind: 'circle', x: 132, y: 150, w: 128, fill: '', stroke: '#475569', strokeWidth: 2 },
      tL('CONTACT', 300, 13, { fill: '#f59e0b', weight: '700', spacing: 60, left: 36, w: 220 }),
      tL('{{email}}', 330, 11.5, { fill: '#cbd5e1', left: 36, w: 220 }),
      tL('{{phone}}', 352, 11.5, { fill: '#cbd5e1', left: 36, w: 220 }),
      tL('{{location}}', 374, 11.5, { fill: '#cbd5e1', left: 36, w: 220 }),
      tL('SKILLS', 430, 13, { fill: '#f59e0b', weight: '700', spacing: 60, left: 36, w: 220 }),
      tL('• Skill one\n• Skill two\n• Skill three\n• Skill four', 462, 12, { fill: '#cbd5e1', left: 36, w: 220, lh: 1.7 }),
      fL('name', 120, 34, { weight: '800', font: 'Playfair Display', left: 300, w: 420 }),
      fL('role', 158, 16, { fill: '#0f766e', weight: '600', left: 300, w: 420 }),
      tL('PROFILE', 220, 13, { fill: '#0f172a', weight: '800', spacing: 60, left: 300, w: 420 }),
      hr(234, 420, '#e2e8f0', 300),
      tL('A short professional summary highlighting your strengths,\nexperience and what you bring to the role.', 268, 12.5, { fill: '#475569', left: 300, w: 420, lh: 1.55 }),
      tL('EXPERIENCE', 360, 13, { fill: '#0f172a', weight: '800', spacing: 60, left: 300, w: 420 }),
      hr(374, 420, '#e2e8f0', 300),
      tL('Job Title — Company', 404, 13.5, { weight: '700', left: 300, w: 420 }),
      tL('20XX – Present', 424, 11.5, { fill: '#94a3b8', left: 300, w: 420 }),
      tL('Key responsibilities and notable achievements in this role.', 448, 12.5, { fill: '#475569', left: 300, w: 420, lh: 1.5 }),
      tL('EDUCATION', 520, 13, { fill: '#0f172a', weight: '800', spacing: 60, left: 300, w: 420 }),
      hr(534, 420, '#e2e8f0', 300),
      tL('Degree — Institution', 564, 13.5, { weight: '700', left: 300, w: 420 }),
      tL('20XX – 20XX', 584, 11.5, { fill: '#94a3b8', left: 300, w: 420 }),
    ],
  },
  {
    ...docBase, id: 'doc-agenda', grp: 'Reports', name: 'Meeting Agenda', accent: '#7c3aed', bg: '#ffffff',
    tags: 'document agenda meeting minutes plan schedule portrait',
    items: [
      band(76, 110, '', [{ offset: 0, color: '#7c3aed' }, { offset: 1, color: '#a855f7' }], 'h'),
      tL('MEETING AGENDA', 62, 30, { fill: '#ffffff', weight: '800', font: 'Playfair Display', left: ML, w: COLW }),
      tL('{{date}}   ·   {{time}}   ·   {{location}}', 102, 13, { fill: '#ede9fe', left: ML, w: COLW, spacing: 20 }),
      tL('ATTENDEES', 230, 12, { fill: '#7c3aed', weight: '700', spacing: 60 }),
      tL('{{attendees}}', 256, 13.5, { fill: '#334155', w: COLW }),
      hr(290, COLW, '#e2e8f0'),
      tL('AGENDA ITEMS', 322, 12, { fill: '#7c3aed', weight: '700', spacing: 60 }),
      tL('1.  Welcome & introductions', 360, 15, { fill: '#1f2937', weight: '600' }),
      tL('2.  Review of previous minutes', 400, 15, { fill: '#1f2937', weight: '600' }),
      tL('3.  Main discussion topic', 440, 15, { fill: '#1f2937', weight: '600' }),
      tL('4.  Action items & owners', 480, 15, { fill: '#1f2937', weight: '600' }),
      tL('5.  Any other business', 520, 15, { fill: '#1f2937', weight: '600' }),
      tL('6.  Next meeting & close', 560, 15, { fill: '#1f2937', weight: '600' }),
      hr(620, COLW, '#e2e8f0'),
      tL('NOTES', 652, 12, { fill: '#7c3aed', weight: '700', spacing: 60 }),
      hr(690, COLW, '#eef2f7'), hr(726, COLW, '#eef2f7'), hr(762, COLW, '#eef2f7'),
    ],
  },
];

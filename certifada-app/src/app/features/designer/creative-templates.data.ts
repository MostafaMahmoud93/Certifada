/**
 * Creative built-in templates: innovative, modern CERTIFICATE styles
 * (glassmorphism, neon tech, graduation, sports, kids, leadership, Swiss
 * minimal…) plus ready-made designs for the SOCIAL MEDIA, BUSINESS,
 * CARDS & INVITES, SIGNAGE and MENU categories.
 *
 * Everything is a vector spec (see {@link TemplateItem}) so each design renders
 * live, stays fully editable and adopts the user's brand kit.
 */
import type { TemplateItem } from './fabric-canvas.service';
import {
  CertTemplate, W, H, CX, gold, border, wedge, corner2, seal, ribbon, titleBlock, body, signature, TXT, base,
} from './certificate-templates.data';

type Stop = { offset: number; color: string };

// --------------------------------------------------------------------------
// Small local builders
// --------------------------------------------------------------------------
export interface TextOpts { fill?: string; font?: string; weight?: string; spacing?: number; align?: 'left' | 'center' | 'right'; lh?: number; italic?: boolean; opacity?: number; }
export const t = (text: string, x: number, y: number, w: number, fontSize: number, o: TextOpts = {}): TemplateItem => ({
  kind: 'text', text, x, y, w, fontSize,
  fill: o.fill ?? '#1f2937', fontFamily: o.font ?? 'Inter', fontWeight: o.weight ?? '400',
  charSpacing: o.spacing ?? 0, align: o.align ?? 'center', lineHeight: o.lh ?? 1.35,
  fontStyle: o.italic ? 'italic' : 'normal', opacity: o.opacity,
});
export const f = (key: string, x: number, y: number, w: number, fontSize: number, o: TextOpts = {}): TemplateItem => ({
  kind: 'field', key, x, y, w, fontSize,
  fill: o.fill ?? '#0f172a', fontFamily: o.font ?? 'Inter', fontWeight: o.weight ?? '400',
  charSpacing: o.spacing ?? 0, align: o.align ?? 'center',
});
export const dot = (x: number, y: number, d: number, fill: string, opacity?: number): TemplateItem =>
  ({ kind: 'circle', x, y, w: d, fill, opacity });
export const box = (x: number, y: number, w: number, h: number, fill: string, o: { stops?: Stop[]; dir?: 'h' | 'v' | 'diag'; rx?: number; stroke?: string; sw?: number; opacity?: number; angle?: number } = {}): TemplateItem =>
  ({ kind: 'rect', x, y, w, h, fill, stops: o.stops, gradDir: o.dir, rx: o.rx, stroke: o.stroke, strokeWidth: o.sw, opacity: o.opacity, angle: o.angle });
export const ln = (x: number, y: number, w: number, stroke: string, sw = 1.5): TemplateItem =>
  ({ kind: 'line', x, y, w, stroke, strokeWidth: sw });
/** Menu row: dish name (left) + price (right), optional description line. */
const menuRow = (name: string, price: string, y: number, left: number, w: number, ink: string, priceInk: string, desc?: string, descInk = '#78716c'): TemplateItem[] => {
  const cx = left + w / 2;
  const out: TemplateItem[] = [
    t(name, cx, y, w, 16, { align: 'left', fill: ink, weight: '600' }),
    t(price, cx, y, w, 16, { align: 'right', fill: priceInk, weight: '700' }),
  ];
  if (desc) out.push(t(desc, cx, y + 25, w, 12.5, { align: 'left', fill: descInk, italic: true }));
  return out;
};

const platinum: Stop[] = [{ offset: 0, color: '#6b7280' }, { offset: 0.5, color: '#e5e7eb' }, { offset: 1, color: '#9ca3af' }];

export const CREATIVE_TEMPLATES: CertTemplate[] = [
  // ===================== MODERN & CREATIVE CERTIFICATES =====================
  {
    ...base, id: 'cf-mod-glass', grp: 'Modern & Creative', name: 'Aurora Glass', accent: '#6366f1', bg: '#e0e7ff',
    tags: 'certificate modern glassmorphism gradient aurora pastel frosted innovative landscape',
    items: [
      box(CX, H / 2, W, H, '', { stops: [{ offset: 0, color: '#c7d2fe' }, { offset: 0.55, color: '#bae6fd' }, { offset: 1, color: '#a7f3d0' }], dir: 'diag' }),
      dot(150, 110, 240, '#ffffff', 0.35), dot(1010, 700, 300, '#ffffff', 0.28),
      dot(1035, 120, 150, '#818cf8', 0.3), dot(90, 690, 190, '#22d3ee', 0.25),
      box(CX, H / 2, W - 180, H - 140, '#ffffff', { rx: 30, stroke: '#ffffff', sw: 2, opacity: 0.78 }),
      ...titleBlock('Achievement', '#312e81', 'Playfair Display', 186),
      ...body({ y: 296, nameColor: '#4f46e5', accent: '#6366f1', text: TXT.achievement, presented: 'Proudly presented to', ink: '#475569' }),
      ...signature([{ name: 'Nora Ahmed', role: 'PROGRAM DIRECTOR' }], '#312e81', 648),
    ],
  },
  {
    ...base, id: 'cf-mod-sunset', grp: 'Modern & Creative', name: 'Sunset Waves', accent: '#f97316', bg: '#ffffff',
    tags: 'certificate modern creative sunset gradient wave colorful vibrant landscape',
    items: [
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 0, y: H }, { x: 0, y: H - 230 }, { x: 380, y: H - 150 }, { x: 760, y: H - 235 }, { x: W, y: H - 135 }, { x: W, y: H }], fill: '#fde68a' },
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 0, y: H }, { x: 0, y: H - 170 }, { x: 420, y: H - 105 }, { x: 820, y: H - 185 }, { x: W, y: H - 90 }, { x: W, y: H }], stops: [{ offset: 0, color: '#fb923c' }, { offset: 1, color: '#f43f5e' }], gradDir: 'h' },
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 0, y: H }, { x: 0, y: H - 95 }, { x: 460, y: H - 45 }, { x: 880, y: H - 105 }, { x: W, y: H - 60 }, { x: W, y: H }], stops: [{ offset: 0, color: '#7c3aed' }, { offset: 1, color: '#db2777' }], gradDir: 'h' },
      dot(1010, 110, 90, '#fde68a'),
      ...titleBlock('Creativity', '#0f172a', 'Playfair Display', 150),
      ...body({ y: 270, nameColor: '#db2777', accent: '#f97316', text: 'For bold imagination and a fearless approach\nto creative work.', presented: 'Presented with admiration to', ink: '#64748b' }),
      ...signature([{ name: 'Lena Ortiz', role: 'CREATIVE DIRECTOR' }], '#0f172a', 585),
    ],
  },
  {
    ...base, id: 'cf-mod-swiss', grp: 'Modern & Creative', name: 'Swiss Minimal', accent: '#ef4444', bg: '#ffffff',
    tags: 'certificate modern minimal swiss typography clean bold red landscape',
    items: [
      box(116, H / 2, 6, H - 200, '#ef4444'),
      t('CERTIFICATE', 520, 170, 720, 72, { align: 'left', weight: '800', fill: '#0f172a', spacing: 40 }),
      t('OF EXCELLENCE', 520, 234, 720, 20, { align: 'left', weight: '600', fill: '#ef4444', spacing: 320 }),
      t('This is to certify that', 520, 330, 720, 16, { align: 'left', fill: '#64748b' }),
      f('name', 520, 396, 720, 56, { align: 'left', font: 'Playfair Display', weight: '700', fill: '#0f172a' }),
      ln(340, 448, 360, '#0f172a', 2),
      t(TXT.excellence, 520, 502, 720, 15.5, { align: 'left', fill: '#475569', lh: 1.6 }),
      { kind: 'field', key: 'signature1', x: 300, y: 612, w: 200 },
      ln(300, 660, 260, '#0f172a', 1.5),
      t('Sarah Chen', 300, 678, 260, 15, { weight: '700', fill: '#0f172a' }),
      t('DIRECTOR', 300, 700, 260, 11.5, { fill: '#94a3b8', spacing: 60 }),
      f('date', 800, 632, 220, 16, { fill: '#0f172a', weight: '600' }),
      ln(800, 660, 260, '#0f172a', 1.5),
      t('DATE', 800, 678, 260, 11.5, { fill: '#94a3b8', spacing: 60 }),
    ],
  },

  // ===================== TECH & INNOVATION =====================
  {
    ...base, id: 'cf-tech-neon', grp: 'Tech & Innovation', name: 'Neon Circuit', accent: '#22d3ee', bg: '#060b18',
    tags: 'certificate tech innovation neon cyber hackathon coding dark futuristic landscape',
    items: [
      ...border('#22d3ee', 2, 28),
      box(CX, H / 2, W - 92, H - 92, '', { stroke: '#a855f7', sw: 1 }),
      box(140, 70, 130, 4, '', { stops: [{ offset: 0, color: '#22d3ee' }, { offset: 1, color: '#a855f7' }], dir: 'h' }),
      box(72, 118, 4, 90, '#22d3ee'), dot(72, 70, 10, '#22d3ee'),
      box(W - 140, H - 70, 130, 4, '', { stops: [{ offset: 0, color: '#a855f7' }, { offset: 1, color: '#22d3ee' }], dir: 'h' }),
      box(W - 72, H - 118, 4, 90, '#a855f7'), dot(W - 72, H - 70, 10, '#a855f7'),
      seal(945, 250, 112, '#22d3ee', '#0b1226'),
      ...titleBlock('Innovation', '#f1f5f9'),
      ...body({ nameColor: '#22d3ee', accent: '#a855f7', ink: '#8fa3c0', text: 'For pioneering ideas and building what\nothers thought impossible.', presented: 'Awarded to' }),
      ...signature([{ name: 'Adam Walker', role: 'CHIEF TECHNOLOGY OFFICER' }], '#e2e8f0'),
    ],
  },

  // ===================== GRADUATION =====================
  {
    ...base, id: 'cf-grad-diploma', grp: 'Graduation', name: 'Classic Diploma', accent: '#8a6d1f', bg: '#fdf8ec',
    tags: 'certificate graduation diploma classic parchment gold formal academic landscape',
    items: [
      ...border('#8a6d1f', 3, 24, true, 10),
      box(CX, H / 2, W - 110, H - 110, '', { stroke: '#c9a227', sw: 0.8 }),
      seal(CX, 112, 90, '#c9a227', '#3f2d09'),
      t('DIPLOMA', CX, 204, 900, 62, { font: 'Playfair Display', weight: '700', fill: '#3f2d09', spacing: 220 }),
      t('OF GRADUATION', CX, 256, 700, 20, { weight: '600', fill: '#8a6d1f', spacing: 300 }),
      ...body({ y: 316, nameColor: '#8a6d1f', accent: '#c9a227', nameFont: 'Great Vibes, cursive', text: 'having fulfilled all academic requirements is hereby\nawarded this diploma with all rights and honors.', presented: 'This diploma is proudly conferred upon', ink: '#5d5343' }),
      ...signature([{ name: 'Dr. Emily Ross', role: 'DEAN' }, { name: 'Prof. Alan Wright', role: 'PRESIDENT' }], '#3f2d09'),
    ],
  },
  {
    ...base, id: 'cf-grad-night', grp: 'Graduation', name: 'Graduate Night', accent: '#fbbf24', bg: '#141034',
    tags: 'certificate graduation cap dark night stars gold celebration modern landscape',
    items: [
      ...border('#fbbf24', 2.2, 28, true, 9),
      dot(180, 120, 6, '#fde68a', 0.8), dot(940, 100, 4, '#e0e7ff', 0.7), dot(1000, 170, 5, '#fde68a', 0.6),
      dot(120, 200, 4, '#e0e7ff', 0.6), dot(870, 650, 5, '#fde68a', 0.5), dot(220, 660, 4, '#e0e7ff', 0.5),
      { kind: 'polygon', x: 0, y: 0, points: [{ x: CX - 78, y: 120 }, { x: CX, y: 92 }, { x: CX + 78, y: 120 }, { x: CX, y: 148 }], fill: '#fbbf24' },
      box(CX, 158, 64, 24, '#f59e0b', { rx: 5 }),
      box(CX + 78, 145, 3, 46, '#fde68a'), dot(CX + 78, 172, 11, '#fde68a'),
      ...titleBlock('Graduation', '#fde68a', 'Playfair Display', 226),
      ...body({ y: 330, nameColor: '#fbbf24', accent: '#fbbf24', ink: '#b7b3d9', text: 'Congratulations, graduate! Tonight we celebrate\nyour hard work, growth and bright future.', presented: 'The class honors' }),
      ...signature([{ name: 'Class of 2026', role: 'GRADUATION COMMITTEE' }], '#e0e7ff'),
    ],
  },

  // ===================== SPORTS & FITNESS =====================
  {
    ...base, id: 'cf-spt-champion', grp: 'Sports & Fitness', name: 'Champion Stripes', accent: '#d97706', bg: '#ffffff',
    tags: 'certificate sports champion athletics dynamic stripes bold trophy landscape',
    items: [
      box(150, H - 70, 560, 46, '#0f172a', { angle: -32 }),
      box(210, H - 120, 520, 34, '', { stops: gold(), angle: -32 }),
      box(260, H - 160, 420, 14, '#dc2626', { angle: -32 }),
      box(W - 150, 70, 560, 46, '#0f172a', { angle: -32 }),
      box(W - 210, 120, 520, 34, '', { stops: gold(), angle: -32 }),
      box(W - 260, 160, 420, 14, '#dc2626', { angle: -32 }),
      ...border('#0f172a', 1.8, 30),
      ...ribbon(190, 240, 118, '#c9a227', '#0f172a'),
      ...titleBlock('Championship', '#0f172a'),
      ...body({ nameColor: '#d97706', accent: '#d97706', text: 'For extraordinary athletic performance and\nan unbeatable competitive spirit.', presented: 'This champion title is awarded to' }),
      ...signature([{ name: 'Coach Daniel Reyes', role: 'HEAD COACH' }], '#0f172a'),
    ],
  },
  {
    ...base, id: 'cf-spt-energy', grp: 'Sports & Fitness', name: 'Energy Rush', accent: '#f97316', bg: '#0c0a09',
    tags: 'certificate sports fitness energy orange dark bold gym training landscape',
    items: [
      wedge('tl', 430, 340, '#1c1917'), wedge('tl', 330, 250, undefined, [{ offset: 0, color: '#f97316' }, { offset: 1, color: '#dc2626' }]),
      wedge('br', 430, 340, '#1c1917'), wedge('br', 330, 250, undefined, [{ offset: 0, color: '#dc2626' }, { offset: 1, color: '#f97316' }]),
      ...border('#f97316', 2, 28),
      seal(CX, 108, 84, '#f97316', '#1c1917'),
      ...titleBlock('Sports Award', '#fafaf9', 'Playfair Display', 192),
      ...body({ y: 302, nameColor: '#fb923c', accent: '#f97316', ink: '#a8a29e', text: 'For relentless energy, discipline and dedication\nboth on and off the field.', presented: 'Proudly awarded to' }),
      ...signature([{ name: 'Marcus Cole', role: 'ATHLETIC DIRECTOR' }], '#e7e5e4'),
    ],
  },

  // ===================== KIDS & SCHOOL =====================
  {
    ...base, id: 'cf-kid-stars', grp: 'Kids & School', name: 'Playful Stars', accent: '#f472b6', bg: '#fffdf5',
    tags: 'certificate kids school children fun playful stars confetti colorful landscape',
    items: [
      box(CX, H / 2, W - 70, H - 70, '', { stroke: '#f472b6', sw: 4, rx: 36 }),
      box(CX, H / 2, W - 100, H - 100, '', { stroke: '#38bdf8', sw: 2, rx: 30 }),
      dot(150, 140, 18, '#fbbf24'), dot(985, 150, 14, '#34d399'), dot(180, 640, 14, '#38bdf8'),
      dot(950, 630, 18, '#f472b6'), dot(260, 110, 10, '#a78bfa'), dot(880, 690, 10, '#fb923c'),
      box(320, 660, 16, 16, '#fbbf24', { angle: 30 }), box(820, 120, 14, 14, '#f472b6', { angle: 45 }),
      { kind: 'triangle', x: 100, y: 400, w: 22, h: 20, fill: '#34d399', angle: 20 },
      { kind: 'triangle', x: 1020, y: 410, w: 22, h: 20, fill: '#a78bfa', angle: -15 },
      seal(CX, 118, 86, '#fbbf24', '#f472b6'),
      t('SUPER STAR', CX, 216, 800, 54, { font: 'Pacifico', fill: '#f472b6' }),
      t('CERTIFICATE OF AWESOMENESS', CX, 272, 760, 17, { weight: '700', fill: '#38bdf8', spacing: 200 }),
      ...body({ y: 334, nameColor: '#8b5cf6', nameFont: 'Dancing Script, cursive', accent: '#fbbf24', ink: '#64748b', text: 'For being kind, curious and totally awesome\nevery single day!', presented: 'This super star award goes to' }),
      ...signature([{ name: 'Ms. Lily Parker', role: 'CLASS TEACHER' }], '#475569', 648),
    ],
  },
  {
    ...base, id: 'cf-kid-rainbow', grp: 'Kids & School', name: 'Rainbow Day', accent: '#f43f5e', bg: '#ffffff',
    tags: 'certificate kids school rainbow bright cheerful fun preschool colorful landscape',
    items: [
      box(CX, 28, W, 12, '#ef4444'), box(CX, 40, W, 12, '#f97316'), box(CX, 52, W, 12, '#facc15'),
      box(CX, 64, W, 12, '#22c55e'), box(CX, 76, W, 12, '#3b82f6'), box(CX, 88, W, 12, '#8b5cf6'),
      box(CX, H - 28, W, 12, '#ef4444'), box(CX, H - 40, W, 12, '#f97316'), box(CX, H - 52, W, 12, '#facc15'),
      box(CX, H - 64, W, 12, '#22c55e'), box(CX, H - 76, W, 12, '#3b82f6'), box(CX, H - 88, W, 12, '#8b5cf6'),
      dot(140, 195, 80, '#fde047'),
      dot(980, 200, 60, '#bae6fd'), dot(1020, 212, 48, '#bae6fd'), dot(945, 216, 44, '#bae6fd'),
      t('WELL DONE!', CX, 208, 700, 56, { font: 'Pacifico', fill: '#f43f5e' }),
      t('CERTIFICATE OF ACHIEVEMENT', CX, 266, 720, 16, { weight: '700', fill: '#3b82f6', spacing: 220 }),
      ...body({ y: 328, nameColor: '#f43f5e', nameFont: 'Dancing Script, cursive', accent: '#22c55e', ink: '#64748b', text: 'For trying your best, helping others and\nmaking every day brighter!', presented: 'This certificate is awarded to' }),
      ...signature([{ name: 'Mr. Omar Hassan', role: 'PRINCIPAL' }], '#334155', 640),
    ],
  },

  // ===================== LEADERSHIP =====================
  {
    ...base, id: 'cf-lead-platinum', grp: 'Leadership', name: 'Executive Platinum', accent: '#cbd5e1', bg: '#16181d',
    tags: 'certificate leadership executive platinum silver dark luxury corporate landscape',
    items: [
      ...border('#9ca3af', 2, 28, true, 9),
      ...corner2('tl', '#20242c', platinum), ...corner2('br', '#20242c', platinum),
      seal(CX, 108, 84, '#cbd5e1', '#16181d'),
      ...titleBlock('Leadership', '#e5e7eb', 'Playfair Display', 192),
      ...body({ y: 302, nameColor: '#e5e7eb', accent: '#9ca3af', ink: '#9aa3b2', text: 'For inspiring vision, decisive judgment and the\ncourage to lead from the front.', presented: 'Presented with highest regard to' }),
      ...signature([{ name: 'Katherine Moore', role: 'CHAIRWOMAN' }], '#d1d5db'),
    ],
  },
  {
    ...base, id: 'cf-lead-summit', grp: 'Leadership', name: 'Summit Ridge', accent: '#0369a1', bg: '#f8fafc',
    tags: 'certificate leadership summit mountain blue inspiring achievement landscape',
    items: [
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 0, y: H }, { x: 0, y: H - 150 }, { x: 200, y: H - 235 }, { x: 400, y: H - 140 }, { x: 560, y: H - 215 }, { x: 760, y: H - 120 }, { x: 950, y: H - 200 }, { x: W, y: H - 130 }, { x: W, y: H }], fill: '#bae6fd' },
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 0, y: H }, { x: 0, y: H - 90 }, { x: 230, y: H - 180 }, { x: 480, y: H - 80 }, { x: 700, y: H - 165 }, { x: 920, y: H - 70 }, { x: W, y: H - 140 }, { x: W, y: H }], fill: '#0369a1' },
      dot(950, 120, 70, '#fcd34d'),
      ...border('#0369a1', 1.6, 30),
      ...titleBlock('Leadership', '#0c4a6e', 'Playfair Display', 160),
      ...body({ y: 280, nameColor: '#0369a1', accent: '#0369a1', ink: '#475569', text: 'For guiding the team to new heights and leading\nevery climb with confidence.', presented: 'This is to certify that' }),
      ...signature([{ name: 'Nathan Brooks', role: 'MANAGING DIRECTOR' }], '#0c4a6e', 590),
    ],
  },

  // ===================== SOCIAL MEDIA =====================
  {
    id: 'sm-post-congrats', grp: 'Social Media', name: 'Congrats Post', cat: 'social', accent: '#f472b6', bg: '#312e81', w: 1080, h: 1080,
    tags: 'social media instagram post congratulations celebration gradient square',
    items: [
      box(540, 540, 1080, 1080, '', { stops: [{ offset: 0, color: '#4f46e5' }, { offset: 0.5, color: '#7c3aed' }, { offset: 1, color: '#db2777' }], dir: 'diag' }),
      dot(140, 160, 22, '#fde047', 0.9), dot(920, 140, 16, '#a7f3d0', 0.9), dot(180, 900, 18, '#fca5a5', 0.85),
      dot(940, 920, 24, '#93c5fd', 0.85), dot(540, 110, 12, '#fdba74', 0.9),
      box(260, 300, 18, 18, '#fde047', { angle: 35 }), box(830, 320, 16, 16, '#a7f3d0', { angle: 20 }),
      { kind: 'triangle', x: 120, y: 540, w: 26, h: 24, fill: '#fdba74', angle: 15 },
      { kind: 'triangle', x: 960, y: 560, w: 26, h: 24, fill: '#fde047', angle: -20 },
      t('CONGRATULATIONS', 540, 420, 980, 76, { font: 'Playfair Display', weight: '700', fill: '#ffffff', spacing: 60 }),
      ln(540, 484, 260, '#fde047', 3),
      f('name', 540, 570, 900, 88, { font: 'Great Vibes, cursive', fill: '#fde047' }),
      t('You did it! We are so proud of this\nincredible milestone.', 540, 710, 860, 30, { fill: '#e9d5ff', lh: 1.5 }),
      t('@yourbrand', 540, 980, 600, 24, { fill: '#c7d2fe', spacing: 60 }),
    ],
  },
  {
    id: 'sm-story-announce', grp: 'Social Media', name: 'Story Announcement', cat: 'social', accent: '#34d399', bg: '#042f2e', w: 1080, h: 1920,
    tags: 'social media instagram story announcement vertical teal modern',
    items: [
      box(540, 960, 1080, 1920, '', { stops: [{ offset: 0, color: '#042f2e' }, { offset: 1, color: '#065f46' }], dir: 'v' }),
      dot(1000, 180, 340, '#10b981', 0.25), dot(80, 1750, 420, '#34d399', 0.18),
      { kind: 'circle', x: 540, y: 260, w: 140, fill: '', stroke: '#6ee7b7', strokeWidth: 3 },
      t('{{company}}', 540, 380, 700, 34, { fill: '#a7f3d0', spacing: 80, weight: '600' }),
      t('BIG', 540, 700, 900, 150, { weight: '800', fill: '#ffffff', spacing: 40 }),
      t('ANNOUNCEMENT', 540, 840, 1000, 68, { weight: '800', fill: '#6ee7b7', spacing: 60 }),
      ln(540, 930, 200, '#fde047', 4),
      f('headline', 540, 1060, 880, 44, { weight: '600', fill: '#ecfdf5' }),
      t('Stay tuned — details dropping soon.', 540, 1210, 800, 30, { fill: '#a7f3d0' }),
      { kind: 'triangle', x: 540, y: 1650, w: 46, h: 36, fill: '#fde047', angle: 180 },
      t('SWIPE UP', 540, 1720, 500, 26, { fill: '#fde047', spacing: 160, weight: '700' }),
    ],
  },
  {
    id: 'sm-linkedin-cover', grp: 'Social Media', name: 'LinkedIn Cover', cat: 'social', accent: '#0891b2', bg: '#ffffff', w: 1584, h: 396,
    tags: 'social media linkedin banner cover header professional wide',
    items: [
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 1584, y: 0 }, { x: 1150, y: 0 }, { x: 1584, y: 300 }], fill: '#0e7490', opacity: 0.12 },
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 1584, y: 0 }, { x: 1270, y: 0 }, { x: 1584, y: 240 }], fill: '#0891b2' },
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 1584, y: 396 }, { x: 1584, y: 150 }, { x: 1350, y: 396 }], fill: '#164e63' },
      dot(1220, 300, 14, '#0891b2'), dot(1120, 90, 10, '#164e63', 0.6),
      box(128, 80, 76, 6, '#0891b2'),
      f('name', 440, 155, 700, 56, { align: 'left', font: 'Playfair Display', weight: '700', fill: '#0f172a' }),
      f('role', 440, 226, 700, 26, { align: 'left', weight: '600', fill: '#0e7490' }),
      t('{{website}}   ·   {{email}}', 440, 295, 700, 20, { align: 'left', fill: '#64748b' }),
    ],
  },
  {
    id: 'sm-youtube-thumb', grp: 'Social Media', name: 'YouTube Thumbnail', cat: 'social', accent: '#ef4444', bg: '#0f172a', w: 1280, h: 720,
    tags: 'social media youtube thumbnail video bold dark wide',
    items: [
      box(640, 360, 1280, 720, '', { stops: [{ offset: 0, color: '#0f172a' }, { offset: 1, color: '#1e293b' }], dir: 'diag' }),
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 0, y: 720 }, { x: 0, y: 470 }, { x: 320, y: 720 }], fill: '#ef4444' },
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 1280, y: 0 }, { x: 1000, y: 0 }, { x: 1280, y: 260 }], fill: '#f59e0b' },
      box(120, 180, 80, 8, '#ef4444'),
      f('title', 600, 320, 1040, 84, { align: 'left', weight: '800', fill: '#ffffff' }),
      t('EPISODE {{episode}}', 600, 470, 1040, 30, { align: 'left', fill: '#fbbf24', spacing: 100, weight: '700' }),
      dot(1120, 580, 170, '#ef4444'),
      t('NEW', 1120, 580, 160, 40, { weight: '800', fill: '#ffffff', spacing: 40 }),
    ],
  },

  // ===================== BUSINESS =====================
  {
    id: 'bz-card-modern', grp: 'Business', name: 'Modern Business Card', cat: 'business', accent: '#4f46e5', bg: '#ffffff', w: 1050, h: 600,
    tags: 'business card contact modern indigo professional',
    items: [
      box(175, 300, 350, 600, '', { stops: [{ offset: 0, color: '#312e81' }, { offset: 1, color: '#4f46e5' }], dir: 'v' }),
      { kind: 'circle', x: 175, y: 235, w: 120, fill: '', stroke: '#c7d2fe', strokeWidth: 3 },
      t('{{initials}}', 175, 235, 120, 40, { weight: '700', fill: '#e0e7ff' }),
      t('{{company}}', 175, 340, 300, 22, { weight: '600', fill: '#e0e7ff', spacing: 60 }),
      f('name', 700, 180, 560, 44, { align: 'left', font: 'Playfair Display', weight: '700', fill: '#0f172a' }),
      f('role', 700, 242, 560, 20, { align: 'left', weight: '600', fill: '#4f46e5' }),
      box(480, 292, 120, 4, '#4f46e5'),
      t('{{phone}}', 700, 360, 560, 18, { align: 'left', fill: '#475569' }),
      t('{{email}}', 700, 410, 560, 18, { align: 'left', fill: '#475569' }),
      t('{{website}}', 700, 460, 560, 18, { align: 'left', fill: '#475569' }),
    ],
  },
  {
    id: 'bz-card-onyx', grp: 'Business', name: 'Onyx Business Card', cat: 'business', accent: '#c9a227', bg: '#0a0a0a',
    w: 1050, h: 600,
    tags: 'business card luxury black gold elegant premium',
    items: [
      box(525, 300, 990, 540, '', { stroke: '#c9a227', sw: 1.5 }),
      box(90, 90, 10, 10, '#c9a227', { angle: 45 }), box(960, 90, 10, 10, '#c9a227', { angle: 45 }),
      box(90, 510, 10, 10, '#c9a227', { angle: 45 }), box(960, 510, 10, 10, '#c9a227', { angle: 45 }),
      f('name', 525, 230, 800, 46, { font: 'Playfair Display', weight: '700', fill: '#f5e6b8' }),
      ln(525, 288, 220, '#c9a227', 1.5),
      f('role', 525, 335, 700, 19, { fill: '#d4c58a', spacing: 120 }),
      t('{{phone}}   ·   {{email}}   ·   {{website}}', 525, 470, 900, 16, { fill: '#a8a29e', spacing: 20 }),
    ],
  },
  {
    id: 'bz-badge-event', grp: 'Business', name: 'Event Badge', cat: 'business', accent: '#0ea5e9', bg: '#ffffff', w: 638, h: 1004,
    tags: 'business event badge pass conference lanyard id attendee',
    items: [
      box(319, 130, 638, 260, '', { stops: [{ offset: 0, color: '#0ea5e9' }, { offset: 1, color: '#6366f1' }], dir: 'h' }),
      t('{{event}}', 319, 88, 560, 30, { weight: '700', fill: '#ffffff', spacing: 60 }),
      t('OFFICIAL PASS', 319, 138, 500, 14, { fill: '#e0f2fe', spacing: 200 }),
      dot(319, 300, 190, '#ffffff'), dot(319, 300, 174, '#f1f5f9'),
      t('PHOTO', 319, 300, 200, 16, { fill: '#94a3b8', spacing: 100 }),
      f('name', 319, 480, 540, 44, { font: 'Playfair Display', weight: '700', fill: '#0f172a' }),
      f('role', 319, 545, 500, 20, { weight: '600', fill: '#6366f1', spacing: 60 }),
      ln(319, 600, 140, '#0ea5e9', 3),
      t('{{company}}', 319, 650, 500, 18, { fill: '#475569' }),
      box(319, 790, 150, 150, '', { stroke: '#cbd5e1', sw: 2, rx: 12 }),
      box(285, 756, 30, 30, '#0f172a'), box(353, 756, 30, 30, '#0f172a'),
      box(285, 824, 30, 30, '#0f172a'), box(340, 812, 16, 16, '#0f172a'),
      box(319, 972, 638, 64, '#0f172a'),
      t('ATTENDEE', 319, 972, 500, 20, { weight: '700', fill: '#ffffff', spacing: 300 }),
    ],
  },

  // ===================== CARDS & INVITES =====================
  {
    id: 'cd-wedding', grp: 'Cards & Invites', name: 'Elegant Wedding', cat: 'cards', accent: '#c9a227', bg: '#fffcf5', w: 750, h: 1050,
    tags: 'card invitation wedding elegant gold script formal portrait',
    items: [
      box(375, 525, 690, 990, '', { stroke: '#c9a227', sw: 1.5 }),
      box(375, 525, 666, 966, '', { stroke: '#c9a227', sw: 0.8 }),
      ln(375, 120, 180, '#c9a227', 1), dot(375, 120, 8, '#c9a227'),
      t('TOGETHER WITH THEIR FAMILIES', 375, 190, 600, 14, { fill: '#8a6d1f', spacing: 200 }),
      f('name1', 375, 310, 640, 54, { font: 'Great Vibes, cursive', fill: '#8a6d1f' }),
      t('&', 375, 390, 200, 40, { font: 'Great Vibes, cursive', fill: '#c9a227' }),
      f('name2', 375, 470, 640, 54, { font: 'Great Vibes, cursive', fill: '#8a6d1f' }),
      t('INVITE YOU TO CELEBRATE THEIR WEDDING', 375, 570, 620, 14, { fill: '#57534e', spacing: 160 }),
      t('{{date}}', 375, 650, 500, 22, { font: 'Playfair Display', weight: '600', fill: '#1c1917' }),
      t('{{venue}}', 375, 700, 560, 16, { fill: '#57534e' }),
      t('AT {{time}}', 375, 745, 400, 13, { fill: '#8a6d1f', spacing: 120 }),
      ln(375, 900, 180, '#c9a227', 1), dot(375, 900, 8, '#c9a227'),
      t('RECEPTION TO FOLLOW', 375, 950, 500, 12, { fill: '#a8a29e', spacing: 200 }),
    ],
  },
  {
    id: 'cd-gala', grp: 'Cards & Invites', name: 'Gala Night', cat: 'cards', accent: '#c9a227', bg: '#0c0f1d', w: 750, h: 1050,
    tags: 'card invitation gala event night black gold art deco formal portrait',
    items: [
      { kind: 'circle', x: 375, y: -60, w: 300, fill: '', stroke: '#c9a227', strokeWidth: 1.5 },
      { kind: 'circle', x: 375, y: -60, w: 420, fill: '', stroke: '#c9a227', strokeWidth: 1 },
      { kind: 'circle', x: 375, y: -60, w: 540, fill: '', stroke: '#c9a227', strokeWidth: 0.8 },
      box(375, 525, 686, 986, '', { stroke: '#c9a227', sw: 1.2 }),
      box(70, 980, 10, 10, '#c9a227', { angle: 45 }), box(680, 980, 10, 10, '#c9a227', { angle: 45 }),
      t('YOU ARE CORDIALLY INVITED', 375, 262, 620, 15, { fill: '#e7c873', spacing: 260 }),
      t('GALA', 375, 384, 700, 110, { font: 'Playfair Display', weight: '700', fill: '#f5e6b8', spacing: 200 }),
      t('NIGHT', 375, 486, 620, 42, { font: 'Playfair Display', fill: '#c9a227', spacing: 420 }),
      ln(375, 556, 160, '#c9a227', 1.5),
      t('{{date}}   ·   {{time}}', 375, 622, 560, 18, { fill: '#e5e0cd' }),
      t('{{venue}}', 375, 668, 560, 15, { fill: '#b3ac93' }),
      t('BLACK TIE', 375, 780, 400, 13, { fill: '#c9a227', spacing: 300 }),
      t('RSVP  {{email}}', 375, 920, 500, 13, { fill: '#8b8468', spacing: 60 }),
    ],
  },
  {
    id: 'cd-birthday', grp: 'Cards & Invites', name: 'Birthday Pop', cat: 'cards', accent: '#ec4899', bg: '#fff7ed', w: 750, h: 1050,
    tags: 'card invitation birthday party balloons fun colorful celebration portrait',
    items: [
      dot(150, 200, 90, '#f472b6'), box(150, 285, 2.5, 80, '#9ca3af'),
      dot(600, 160, 80, '#38bdf8'), box(600, 235, 2.5, 70, '#9ca3af'),
      dot(520, 262, 60, '#fbbf24'), box(520, 322, 2.5, 55, '#9ca3af'),
      dot(90, 480, 12, '#a78bfa'), dot(670, 430, 14, '#34d399'), dot(120, 760, 12, '#fb923c'),
      dot(650, 800, 14, '#f472b6'), box(320, 130, 14, 14, '#34d399', { angle: 30 }),
      t('HAPPY', 375, 420, 640, 64, { font: 'Pacifico', fill: '#f97316' }),
      t('BIRTHDAY!', 375, 512, 680, 72, { font: 'Pacifico', fill: '#ec4899' }),
      f('name', 375, 640, 620, 56, { font: 'Dancing Script, cursive', fill: '#8b5cf6' }),
      t('Join us to celebrate on {{date}} at {{time}}', 375, 745, 600, 18, { fill: '#57534e' }),
      t('{{venue}}', 375, 790, 560, 16, { fill: '#78716c' }),
      box(375, 1020, 750, 60, '', { stops: [{ offset: 0, color: '#ec4899' }, { offset: 1, color: '#f97316' }], dir: 'h' }),
      t("LET'S PARTY!", 375, 1020, 500, 18, { weight: '700', fill: '#ffffff', spacing: 200 }),
    ],
  },
  {
    id: 'cd-thanks', grp: 'Cards & Invites', name: 'Thank You Card', cat: 'cards', accent: '#be185d', bg: '#fdf2f8', w: 1050, h: 750,
    tags: 'card thank you gratitude soft blush script landscape',
    items: [
      dot(950, 120, 220, '#fbcfe8', 0.6), dot(90, 660, 260, '#f9a8d4', 0.4), dot(140, 120, 90, '#fce7f3', 0.9),
      t('Thank You', 525, 320, 800, 110, { font: 'Great Vibes, cursive', fill: '#be185d' }),
      ln(525, 415, 220, '#f472b6', 2),
      t('for your kindness and generosity —\nit means the world to us.', 525, 500, 700, 20, { fill: '#831843', lh: 1.6 }),
      t('With love, {{sender}}', 525, 620, 600, 24, { font: 'Dancing Script, cursive', fill: '#be185d' }),
    ],
  },

  // ===================== SIGNAGE =====================
  {
    id: 'sg-poster-event', grp: 'Signage', name: 'Event Poster', cat: 'signage', accent: '#4338ca', bg: '#ffffff', w: 794, h: 1123,
    tags: 'signage poster event announcement gradient modern portrait',
    items: [
      box(397, 240, 794, 480, '', { stops: [{ offset: 0, color: '#4338ca' }, { offset: 1, color: '#06b6d4' }], dir: 'diag' }),
      dot(680, 120, 220, '#ffffff', 0.12), dot(90, 400, 180, '#ffffff', 0.1),
      t('UPCOMING EVENT', 397, 118, 600, 16, { fill: '#c7d2fe', spacing: 300 }),
      f('event', 397, 230, 680, 64, { font: 'Playfair Display', weight: '700', fill: '#ffffff' }),
      t('{{tagline}}', 397, 335, 640, 20, { fill: '#e0e7ff' }),
      t('{{date}}   ·   {{time}}', 397, 580, 640, 24, { weight: '600', fill: '#0f172a' }),
      t('{{venue}}', 397, 640, 640, 20, { fill: '#475569' }),
      ln(397, 715, 200, '#06b6d4', 3),
      t('Free admission — everyone is welcome.\nRegister at {{website}}', 397, 800, 620, 17, { fill: '#475569', lh: 1.6 }),
      box(397, 1090, 794, 66, '#0f172a'),
      t('{{company}}', 397, 1090, 600, 16, { fill: '#e2e8f0', spacing: 100 }),
    ],
  },
  {
    id: 'sg-webinar', grp: 'Signage', name: 'Webinar Poster', cat: 'signage', accent: '#22d3ee', bg: '#0b1120', w: 794, h: 1123,
    tags: 'signage poster webinar online tech dark neon speaker portrait',
    items: [
      dot(700, 150, 240, '#22d3ee', 0.12), dot(100, 1000, 280, '#a855f7', 0.12),
      box(397, 561, 730, 1060, '', { stroke: '#22d3ee', sw: 1.5 }),
      t('LIVE WEBINAR', 397, 148, 560, 18, { fill: '#22d3ee', spacing: 300, weight: '600' }),
      f('title', 397, 300, 640, 54, { weight: '800', fill: '#f8fafc' }),
      ln(397, 405, 140, '#a855f7', 3),
      { kind: 'circle', x: 397, y: 560, w: 190, fill: '#131c33', stroke: '#22d3ee', strokeWidth: 2 },
      t('SPEAKER', 397, 560, 200, 13, { fill: '#64748b', spacing: 150 }),
      f('speaker', 397, 705, 560, 30, { weight: '600', fill: '#e2e8f0' }),
      t('{{speakerTitle}}', 397, 750, 560, 16, { fill: '#94a3b8' }),
      t('{{date}}   ·   {{time}}', 397, 845, 560, 22, { weight: '600', fill: '#22d3ee' }),
      t('REGISTER AT {{website}}', 397, 950, 560, 15, { fill: '#cbd5e1', spacing: 100 }),
      box(397, 1082, 794, 8, '', { stops: [{ offset: 0, color: '#22d3ee' }, { offset: 1, color: '#a855f7' }], dir: 'h' }),
    ],
  },
  {
    id: 'sg-welcome', grp: 'Signage', name: 'Welcome Sign', cat: 'signage', accent: '#c9a227', bg: '#fbf8f1', w: W, h: H,
    tags: 'signage welcome sign event entrance elegant gold landscape',
    items: [
      ...corner2('tl', '#0f172a'), ...corner2('br', '#0f172a'),
      ...border('#c9a227', 2.5, 30, true, 9),
      t('WELCOME', CX, 300, 1000, 120, { font: 'Playfair Display', weight: '700', fill: '#1f2937', spacing: 100 }),
      ln(CX, 400, 300, '#c9a227', 2),
      t('TO THE', CX, 452, 500, 18, { fill: '#8a6d1f', spacing: 400 }),
      f('event', CX, 530, 800, 46, { font: 'Great Vibes, cursive', fill: '#b8902f' }),
      t('{{date}}', CX, 630, 500, 18, { fill: '#64748b', spacing: 60 }),
    ],
  },

  // ===================== MENUS =====================
  {
    id: 'mn-elegant', grp: 'Menus', name: 'Elegant Menu', cat: 'menu', accent: '#8a6d1f', bg: '#fffdf7', w: 794, h: 1123,
    tags: 'menu restaurant elegant fine dining gold classic portrait',
    items: [
      box(397, 561, 714, 1043, '', { stroke: '#c9a227', sw: 1 }),
      t('MENU', 397, 118, 600, 56, { font: 'Playfair Display', weight: '700', fill: '#1c1917', spacing: 420 }),
      ln(397, 172, 120, '#c9a227', 2),
      t('{{restaurant}}', 397, 214, 560, 15, { fill: '#8a6d1f', spacing: 200 }),
      t('STARTERS', 397, 300, 560, 20, { font: 'Playfair Display', weight: '600', fill: '#8a6d1f', spacing: 150 }),
      ...menuRow('Garden Salad', '$8', 352, 110, 574, '#1c1917', '#8a6d1f', 'Fresh greens, cherry tomatoes, house dressing'),
      ...menuRow('Tomato Basil Soup', '$7', 424, 110, 574, '#1c1917', '#8a6d1f', 'Slow-simmered with fresh basil and cream'),
      t('MAINS', 397, 520, 560, 20, { font: 'Playfair Display', weight: '600', fill: '#8a6d1f', spacing: 150 }),
      ...menuRow('Grilled Salmon', '$24', 572, 110, 574, '#1c1917', '#8a6d1f', 'Lemon butter, seasonal vegetables'),
      ...menuRow('Ribeye Steak', '$29', 644, 110, 574, '#1c1917', '#8a6d1f', 'Char-grilled, rosemary jus, truffle mash'),
      ...menuRow('Truffle Pasta', '$19', 716, 110, 574, '#1c1917', '#8a6d1f', 'Fresh tagliatelle, parmesan, black truffle'),
      t('DESSERTS', 397, 812, 560, 20, { font: 'Playfair Display', weight: '600', fill: '#8a6d1f', spacing: 150 }),
      ...menuRow('Crème Brûlée', '$9', 864, 110, 574, '#1c1917', '#8a6d1f', 'Vanilla bean custard, caramelized sugar'),
      ...menuRow('Chocolate Fondant', '$10', 936, 110, 574, '#1c1917', '#8a6d1f', 'Molten centre, vanilla ice cream'),
      ln(397, 1022, 120, '#c9a227', 1.5),
      t('{{phone}}   ·   {{website}}', 397, 1058, 560, 12.5, { fill: '#a8a29e', spacing: 40 }),
    ],
  },
  {
    id: 'mn-cafe', grp: 'Menus', name: 'Café Board', cat: 'menu', accent: '#fbbf24', bg: '#1f2421', w: 794, h: 1123,
    tags: 'menu cafe coffee chalkboard price list casual dark portrait',
    items: [
      box(397, 561, 730, 1060, '', { stroke: '#a8a29e', sw: 1.5 }),
      box(397, 561, 706, 1036, '', { stroke: '#57534e', sw: 1 }),
      dot(180, 120, 10, '#d6bcab'), dot(620, 150, 8, '#d6bcab'),
      t('Café Menu', 397, 148, 600, 64, { font: 'Pacifico', fill: '#f5f5f4' }),
      t('COFFEE', 397, 268, 560, 22, { weight: '700', fill: '#fbbf24', spacing: 300 }),
      ...menuRow('Espresso', '$3', 328, 130, 534, '#e7e5e4', '#fbbf24'),
      ...menuRow('Cappuccino', '$4.5', 380, 130, 534, '#e7e5e4', '#fbbf24'),
      ...menuRow('Latte', '$5', 432, 130, 534, '#e7e5e4', '#fbbf24'),
      ...menuRow('Mocha', '$5.5', 484, 130, 534, '#e7e5e4', '#fbbf24'),
      t('PASTRIES', 397, 580, 560, 22, { weight: '700', fill: '#fbbf24', spacing: 300 }),
      ...menuRow('Croissant', '$3.5', 640, 130, 534, '#e7e5e4', '#fbbf24'),
      ...menuRow('Banana Bread', '$4', 692, 130, 534, '#e7e5e4', '#fbbf24'),
      ...menuRow('Cinnamon Roll', '$4.5', 744, 130, 534, '#e7e5e4', '#fbbf24'),
      ln(397, 850, 160, '#fbbf24', 2),
      t('FREE WIFI   ·   OPEN 7AM – 9PM', 397, 906, 560, 15, { fill: '#d6d3d1', spacing: 100 }),
      t('{{company}}', 397, 1000, 500, 24, { font: 'Dancing Script, cursive', fill: '#fbbf24' }),
    ],
  },
];

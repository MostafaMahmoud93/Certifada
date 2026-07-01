/**
 * Built-in professional CERTIFICATE templates, organized by award type.
 *
 * Each template is a vector spec (see {@link TemplateItem}) so it renders live,
 * stays fully editable, and adopts the user's brand kit. Small composition
 * helpers below keep the 20 designs consistent (typography, borders, seals,
 * signature blocks) while each gets a distinct palette + decorative treatment.
 *
 * The `grp` field drives the "section per type" grouping in the Templates tab.
 */
import type { TemplateItem } from './fabric-canvas.service';

export interface CertTemplate {
  id: string; name: string; cat: string; tags: string;
  w: number; h: number; bg?: string; accent: string; grp?: string; lang?: 'en' | 'ar';
  items: TemplateItem[];
}

type Pt = { x: number; y: number };
type Stop = { offset: number; color: string };

export const W = 1123, H = 794, CX = 562;

/** Metallic-gold gradient sheen (dark → bright → dark). */
export const gold = (a = '#9c7726', b = '#f7e7a1', c = '#b58c2c'): Stop[] =>
  [{ offset: 0, color: a }, { offset: 0.5, color: b }, { offset: 1, color: c }];

// --------------------------------------------------------------------------
// Decoration helpers
// --------------------------------------------------------------------------
export function border(color: string, weight = 2.5, inset = 30, dbl = false, gap = 9): TemplateItem[] {
  const o: TemplateItem[] = [{ kind: 'rect', x: CX, y: H / 2, w: W - inset * 2, h: H - inset * 2, fill: '', stroke: color, strokeWidth: weight }];
  if (dbl) o.push({ kind: 'rect', x: CX, y: H / 2, w: W - (inset + gap) * 2, h: H - (inset + gap) * 2, fill: '', stroke: color, strokeWidth: Math.max(1, weight * 0.45) });
  return o;
}

export function wedge(corner: 'tl' | 'tr' | 'bl' | 'br', sx: number, sy: number, fill?: string, stops?: Stop[], opacity?: number): TemplateItem {
  const p: Pt[] =
    corner === 'tl' ? [{ x: 0, y: 0 }, { x: sx, y: 0 }, { x: 0, y: sy }] :
    corner === 'tr' ? [{ x: W, y: 0 }, { x: W - sx, y: 0 }, { x: W, y: sy }] :
    corner === 'bl' ? [{ x: 0, y: H }, { x: sx, y: H }, { x: 0, y: H - sy }] :
                      [{ x: W, y: H }, { x: W - sx, y: H }, { x: W, y: H - sy }];
  return { kind: 'polygon', x: 0, y: 0, points: p, fill, stops, opacity };
}

/** Layered gold-on-dark corner accent (the classic certificate swoosh feel). */
export function corner2(corner: 'tl' | 'tr' | 'bl' | 'br', dark: string, g: Stop[] = gold()): TemplateItem[] {
  return [wedge(corner, 410, 340, dark), wedge(corner, 318, 250, undefined, g)];
}

/** Nested multi-colour corner (modern look). */
export function nested(corner: 'tl' | 'tr' | 'bl' | 'br', colors: string[]): TemplateItem[] {
  return colors.map((c, i) => wedge(corner, 430 - i * 92, 360 - i * 78, c));
}

export function seal(x: number, y: number, size: number, g = '#c9a227', dark = '#10182b'): TemplateItem {
  return { kind: 'seal', x, y, w: size, fill: g, stroke: dark };
}

/** Award seal with two ribbon tails hanging below. */
export function ribbon(x: number, y: number, size: number, g: string, dark: string): TemplateItem[] {
  const hw = size * 0.3, top = y + size * 0.2, bot = y + size * 0.95;
  return [
    { kind: 'polygon', x: 0, y: 0, points: [{ x: x - hw, y: top }, { x: x - hw, y: bot }, { x: x, y: bot - size * 0.24 }, { x: x + hw, y: bot }, { x: x + hw, y: top }], fill: dark },
    seal(x, y, size, g, dark),
  ];
}

// --------------------------------------------------------------------------
// Text blocks
// --------------------------------------------------------------------------
export function titleBlock(type: string, color = '#1f2937', font = 'Playfair Display', y = 150): TemplateItem[] {
  return [
    { kind: 'text', text: 'CERTIFICATE', x: CX, y, w: 960, fontSize: 58, fontFamily: font, fontWeight: '700', fill: color, charSpacing: 130 },
    { kind: 'text', text: 'OF ' + type.toUpperCase(), x: CX, y: y + 50, w: 780, fontSize: 21, fontFamily: 'Inter', fontWeight: '600', fill: color, charSpacing: 300, opacity: 0.9 },
  ];
}

interface BodyOpts { presented?: string; nameColor?: string; nameFont?: string; text?: string; ink?: string; accent?: string; y?: number; }
export function body(o: BodyOpts = {}): TemplateItem[] {
  const y = o.y ?? 268, ink = o.ink ?? '#475569';
  return [
    { kind: 'text', text: o.presented ?? 'This is proudly presented to', x: CX, y, w: 740, fontSize: 16.5, fontFamily: 'Inter', fill: ink, charSpacing: 30 },
    { kind: 'field', key: 'name', x: CX, y: y + 60, w: 860, fontSize: 62, fontFamily: o.nameFont ?? 'Great Vibes, Segoe Script, cursive', fill: o.nameColor ?? '#c9a227' },
    { kind: 'line', x: CX, y: y + 108, w: 520, stroke: o.accent ?? '#c9a227', strokeWidth: 1.5 },
    { kind: 'text', text: o.text ?? 'In recognition of outstanding achievement, dedication\nand commitment to excellence.', x: CX, y: y + 162, w: 760, fontSize: 16, fontFamily: 'Inter', fill: ink, lineHeight: 1.5 },
  ];
}

export function signature(list: { name: string; role: string }[], ink = '#1f2937', y = 660): TemplateItem[] {
  const xs = list.length === 1 ? [CX] : [CX - 235, CX + 235];
  const out: TemplateItem[] = [];
  list.forEach((s, i) => {
    const x = xs[i];
    out.push(
      { kind: 'field', key: 'signature' + (i + 1), x, y: y - 44, w: 200 },
      { kind: 'line', x, y, w: 215, stroke: ink, strokeWidth: 1.2 },
      { kind: 'text', text: s.name, x, y: y + 17, w: 260, fontSize: 15.5, fontFamily: 'Inter', fontWeight: '700', fill: ink },
      { kind: 'text', text: s.role, x, y: y + 38, w: 260, fontSize: 12, fontFamily: 'Inter', fill: '#64748b', charSpacing: 20 },
    );
  });
  return out;
}

export const TXT = {
  achievement: 'For outstanding achievement and dedication to\nexcellence in every endeavor.',
  participation: 'For active participation and valuable contribution\nthroughout the program.',
  appreciation: 'In sincere appreciation of your exceptional\ncontribution and continued support.',
  completion: 'has successfully completed all requirements of\nthe program with distinction.',
  recognition: 'In recognition of remarkable performance and\nvaluable contribution to the team.',
  excellence: 'For achieving outstanding results and\nconsistently exceeding expectations.',
  honor: 'In honor of remarkable dedication, commitment\nand outstanding achievements.',
};

export const base = { cat: 'certificate', w: W, h: H } as const;

// --------------------------------------------------------------------------
// Templates
// --------------------------------------------------------------------------
export const CERT_TEMPLATES: CertTemplate[] = [
  // ===== ACHIEVEMENT =====
  {
    ...base, id: 'cf-ach-gold', grp: 'Achievement', name: 'Golden Achievement', accent: '#c9a227', bg: '#fbf8f1',
    tags: 'certificate achievement gold black luxury seal landscape elegant',
    items: [
      ...corner2('tl', '#0f172a'), ...corner2('br', '#0f172a'),
      ...border('#c9a227', 2.5, 26),
      ...titleBlock('Achievement', '#1f2937'),
      seal(190, 250, 118),
      ...body({ nameColor: '#b8902f', accent: '#c9a227', text: TXT.achievement, presented: 'This certificate is proudly presented to' }),
      ...signature([{ name: 'Richard Miles', role: 'DIRECTOR' }]),
    ],
  },
  {
    ...base, id: 'cf-ach-crimson', grp: 'Achievement', name: 'Crimson Achievement', accent: '#a51d2d', bg: '#ffffff',
    tags: 'certificate achievement red gold modern seal landscape',
    items: [
      wedge('tl', 430, 360, '#7f1d1d'), wedge('tl', 320, 260, '#a51d2d'), wedge('tl', 210, 165, undefined, gold()),
      wedge('br', 360, 300, '#a51d2d'), wedge('br', 250, 200, undefined, gold()),
      ...border('#c9a227', 2, 28),
      ...titleBlock('Achievement', '#1f2937'),
      seal(940, 250, 120, '#c9a227', '#7f1d1d'),
      ...body({ nameColor: '#a51d2d', accent: '#a51d2d', text: TXT.achievement, presented: 'Proudly presented to' }),
      ...signature([{ name: 'Sophia Martinez', role: 'SALES MANAGER' }]),
    ],
  },
  {
    ...base, id: 'cf-ach-laurel', grp: 'Achievement', name: 'Royal Laurel', accent: '#1e3a8a', bg: '#ffffff',
    tags: 'certificate achievement blue navy classic laurel formal landscape',
    items: [
      ...border('#1e3a8a', 2, 30, true, 8),
      seal(CX, 104, 86, '#1e3a8a', '#dbb84a'),
      ...titleBlock('Achievement', '#1e3a8a', 'Playfair Display', 188),
      ...body({ y: 300, nameColor: '#1e3a8a', accent: '#1e3a8a', nameFont: 'Great Vibes, cursive', text: TXT.achievement, presented: 'This is to certify that', ink: '#475569' }),
      ...signature([{ name: 'Jonathan Reed', role: 'OPERATIONS MANAGER' }]),
    ],
  },
  {
    ...base, id: 'cf-ach-onyx', grp: 'Achievement', name: 'Onyx & Gold', accent: '#e7c873', bg: '#0b1020',
    tags: 'certificate achievement black gold dark luxury ornate landscape',
    items: [
      ...border('#c9a227', 2.5, 28, true, 9),
      ...corner2('tl', '#1a2240'), ...corner2('br', '#1a2240'),
      seal(CX, 110, 88),
      ...titleBlock('Achievement', '#e7c873', 'Playfair Display', 196),
      ...body({ y: 306, nameColor: '#f0d98a', accent: '#c9a227', ink: '#aab3c5', text: TXT.achievement, presented: 'Proudly presented to' }),
      ...signature([{ name: 'Laura King', role: 'CHIEF EXECUTIVE' }], '#e2e8f0'),
    ],
  },

  // ===== PARTICIPATION =====
  {
    ...base, id: 'cf-par-navy', grp: 'Participation', name: 'Navy Participation', accent: '#16264d', bg: '#fbf8f1',
    tags: 'certificate participation navy gold seal landscape elegant',
    items: [
      ...corner2('tr', '#16264d'), ...corner2('bl', '#16264d'),
      ...border('#c9a227', 2.2, 28),
      seal(190, 250, 116, '#c9a227', '#16264d'),
      ...titleBlock('Participation', '#16264d'),
      ...body({ nameColor: '#b8902f', accent: '#c9a227', text: TXT.participation, presented: 'This certificate is presented to' }),
      ...signature([{ name: 'Marceline Anderson', role: 'CEO' }]),
    ],
  },
  {
    ...base, id: 'cf-par-teal', grp: 'Participation', name: 'Teal Crest', accent: '#0e7c86', bg: '#ffffff',
    tags: 'certificate participation teal octagon modern seal landscape',
    items: [
      wedge('tl', 360, 300, '#0e7c86'), wedge('tl', 250, 200, undefined, gold()),
      wedge('br', 360, 300, '#0e7c86'), wedge('br', 250, 200, undefined, gold()),
      ...border('#0e7c86', 1.6, 30),
      seal(CX, 108, 84, '#c9a227', '#0e7c86'),
      ...titleBlock('Participation', '#0e7c86', 'Playfair Display', 192),
      ...body({ y: 302, nameColor: '#0e7c86', accent: '#0e7c86', text: TXT.participation, presented: 'This is to certify that', ink: '#475569' }),
      ...signature([{ name: 'Daniel Lewis', role: 'CO-FOUNDER' }], '#155e63'),
    ],
  },
  {
    ...base, id: 'cf-par-coral', grp: 'Participation', name: 'Coral Geometric', accent: '#e0567a', bg: '#ffffff',
    tags: 'certificate participation pink coral geometric modern landscape',
    items: [
      wedge('tr', 300, 260, '#f7b8c8'), wedge('tr', 210, 175, '#e0567a'),
      wedge('bl', 300, 260, '#f7b8c8'), wedge('bl', 210, 175, '#e0567a'),
      ...border('#e0567a', 1.6, 30),
      seal(CX, 108, 82, '#e0567a', '#7a2740'),
      ...titleBlock('Participation', '#9d3551', 'Playfair Display', 192),
      ...body({ y: 302, nameColor: '#e0567a', accent: '#e0567a', text: TXT.participation, presented: 'Presented to', ink: '#64748b' }),
      ...signature([{ name: 'Amelia White', role: 'CREATIVE DIRECTOR' }], '#9d3551'),
    ],
  },
  {
    ...base, id: 'cf-par-azure', grp: 'Participation', name: 'Azure Wave', accent: '#2563eb', bg: '#ffffff',
    tags: 'certificate participation blue wave modern seal landscape',
    items: [
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 0, y: H }, { x: 0, y: H - 150 }, { x: W, y: H - 70 }, { x: W, y: H }], fill: '#bfdbfe' },
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 0, y: H }, { x: 0, y: H - 95 }, { x: W, y: H - 40 }, { x: W, y: H }], fill: '#2563eb' },
      ...border('#2563eb', 1.6, 30),
      seal(CX, 108, 84, '#2563eb', '#1e3a8a'),
      ...titleBlock('Participation', '#1e3a8a', 'Playfair Display', 192),
      ...body({ y: 296, nameColor: '#2563eb', accent: '#2563eb', text: TXT.participation, presented: 'This is to certify that', ink: '#475569' }),
      ...signature([{ name: 'Christopher Lee', role: 'CONFERENCE CHAIR' }], '#1e3a8a', 632),
    ],
  },
  {
    ...base, id: 'cf-par-sapphire', grp: 'Participation', name: 'Sapphire Edge', accent: '#1e40af', bg: '#ffffff',
    tags: 'certificate participation blue gold geometric corporate landscape',
    items: [
      wedge('bl', 470, 360, '#1e40af'), wedge('bl', 340, 250, undefined, gold()),
      wedge('tr', 320, 250, '#1e40af'), wedge('tr', 220, 165, undefined, gold()),
      ...border('#c9a227', 2, 30),
      seal(CX, 108, 84, '#c9a227', '#1e40af'),
      ...titleBlock('Participation', '#1e40af', 'Playfair Display', 192),
      ...body({ y: 300, nameColor: '#b8902f', accent: '#1e40af', text: TXT.participation, presented: 'Proudly presented to' }),
      ...signature([{ name: 'Steven Mitchell', role: 'TRAINER' }], '#1e3a8a'),
    ],
  },

  // ===== APPRECIATION =====
  {
    ...base, id: 'cf-app-emerald', grp: 'Appreciation', name: 'Emerald Appreciation', accent: '#15803d', bg: '#ffffff',
    tags: 'certificate appreciation green gold seal elegant landscape',
    items: [
      ...corner2('tl', '#14532d', gold('#7a5e1c', '#f2dd8c', '#9c7b25')), ...corner2('br', '#14532d', gold('#7a5e1c', '#f2dd8c', '#9c7b25')),
      ...border('#c9a227', 2.2, 28),
      seal(190, 250, 116, '#c9a227', '#14532d'),
      ...titleBlock('Appreciation', '#14532d'),
      ...body({ nameColor: '#15803d', accent: '#15803d', text: TXT.appreciation, presented: 'This certificate is proudly presented to' }),
      ...signature([{ name: 'Hannah Scott', role: 'TEAM LEAD' }], '#14532d'),
    ],
  },
  {
    ...base, id: 'cf-app-teal', grp: 'Appreciation', name: 'Teal & Gold', accent: '#0f766e', bg: '#ffffff',
    tags: 'certificate appreciation teal gold modern seal landscape',
    items: [
      wedge('tl', 420, 350, '#0f766e'), wedge('tl', 300, 240, undefined, gold()),
      { kind: 'rect', x: CX, y: H / 2, w: W - 56, h: H - 56, fill: '', stroke: '#0f766e', strokeWidth: 1.6 },
      seal(945, 250, 118, '#c9a227', '#0f766e'),
      ...titleBlock('Appreciation', '#0f766e'),
      ...body({ nameColor: '#0f766e', accent: '#0f766e', text: TXT.appreciation, presented: 'Proudly presented to' }),
      ...signature([{ name: 'Juliana Silva', role: 'MANAGER' }], '#115e59'),
    ],
  },
  {
    ...base, id: 'cf-app-ornate', grp: 'Appreciation', name: 'Ornate Gold', accent: '#b8902f', bg: '#fcf9f0',
    tags: 'certificate appreciation gold ornate border classic elegant landscape',
    items: [
      ...border('#c9a227', 3, 24, true, 12),
      { kind: 'rect', x: CX, y: H / 2, w: W - 110, h: H - 110, fill: '', stroke: '#c9a227', strokeWidth: 0.8 },
      seal(940, 600, 120),
      ...titleBlock('Appreciation', '#7a5e1c'),
      ...body({ nameColor: '#b8902f', accent: '#c9a227', text: TXT.appreciation, presented: 'This certificate is awarded to' }),
      ...signature([{ name: 'Grace Taylor', role: 'MANAGER' }], '#7a5e1c'),
    ],
  },

  // ===== COMPLETION =====
  {
    ...base, id: 'cf-com-classic', grp: 'Completion', name: 'Classic Blue', accent: '#1d3a8a', bg: '#ffffff',
    tags: 'certificate completion blue navy classic border formal landscape',
    items: [
      ...border('#1d3a8a', 1.4, 26, true, 7),
      seal(CX, 106, 84, '#1d3a8a', '#c9a227'),
      ...titleBlock('Completion', '#1d3a8a', 'Playfair Display', 190),
      ...body({ y: 300, nameColor: '#1d3a8a', accent: '#1d3a8a', nameFont: 'Great Vibes, cursive', text: TXT.completion.replace('has successfully', 'who has successfully'), presented: 'This is to certify that', ink: '#475569' }),
      ...signature([{ name: 'David Peterson', role: 'HEAD OF TRAINING' }], '#1d3a8a'),
    ],
  },
  {
    ...base, id: 'cf-com-minimal', grp: 'Completion', name: 'Minimal Gold', accent: '#b8902f', bg: '#fcfbf7',
    tags: 'certificate completion minimal gold clean simple landscape',
    items: [
      { kind: 'line', x: CX, y: 78, w: 120, stroke: '#c9a227', strokeWidth: 3 },
      ...titleBlock('Completion', '#1f2937', 'Playfair Display', 150),
      seal(CX, 250, 92),
      ...body({ y: 352, nameColor: '#b8902f', accent: '#c9a227', text: TXT.completion, presented: 'This is to certify that', ink: '#64748b' }),
      { kind: 'line', x: CX, y: 716, w: 120, stroke: '#c9a227', strokeWidth: 3 },
      ...signature([{ name: 'Michael Brown', role: 'INSTRUCTOR' }], '#1f2937', 640),
    ],
  },
  {
    ...base, id: 'cf-com-spectrum', grp: 'Completion', name: 'Spectrum', accent: '#6366f1', bg: '#ffffff',
    tags: 'certificate completion colorful modern spectrum gradient landscape',
    items: [
      ...nested('tl', ['#8b5cf6', '#3b82f6', '#06b6d4']),
      ...nested('br', ['#8b5cf6', '#3b82f6', '#06b6d4']),
      ...border('#6366f1', 1.6, 30),
      seal(CX, 108, 84, '#6366f1', '#3730a3'),
      ...titleBlock('Completion', '#3730a3', 'Playfair Display', 192),
      ...body({ y: 302, nameColor: '#4f46e5', accent: '#6366f1', text: TXT.completion, presented: 'This is to certify that', ink: '#475569' }),
      ...signature([{ name: 'Andrew Hall', role: 'COURSE INSTRUCTOR' }], '#3730a3'),
    ],
  },

  // ===== RECOGNITION =====
  {
    ...base, id: 'cf-rec-violet', grp: 'Recognition', name: 'Violet Recognition', accent: '#6b21a8', bg: '#ffffff',
    tags: 'certificate recognition purple violet gold seal landscape',
    items: [
      wedge('tl', 430, 360, '#4c1d6b'), wedge('tl', 320, 260, '#6b21a8'), wedge('tl', 210, 165, undefined, gold()),
      wedge('br', 320, 260, '#6b21a8'), wedge('br', 210, 165, undefined, gold()),
      ...border('#c9a227', 2, 28),
      seal(945, 250, 118, '#c9a227', '#4c1d6b'),
      ...titleBlock('Recognition', '#6b21a8'),
      ...body({ nameColor: '#6b21a8', accent: '#6b21a8', text: TXT.recognition, presented: 'This certificate is awarded to' }),
      ...signature([{ name: 'Olivia Bennett', role: 'HR DIRECTOR' }], '#4c1d6b'),
    ],
  },
  {
    ...base, id: 'cf-rec-midnight', grp: 'Recognition', name: 'Midnight Gold', accent: '#11203f', bg: '#ffffff',
    tags: 'certificate recognition navy dark gold corporate seal landscape',
    items: [
      ...corner2('tl', '#11203f'), ...corner2('br', '#11203f'),
      ...border('#11203f', 1.8, 28),
      seal(CX, 108, 84, '#c9a227', '#11203f'),
      ...titleBlock('Recognition', '#11203f', 'Playfair Display', 192),
      ...body({ y: 302, nameColor: '#b8902f', accent: '#c9a227', text: TXT.recognition, presented: 'Proudly presented to' }),
      ...signature([{ name: 'Victoria Adams', role: 'CEO' }], '#11203f'),
    ],
  },

  // ===== EXCELLENCE =====
  {
    ...base, id: 'cf-exc-ribbon', grp: 'Excellence', name: 'Gold Ribbon Excellence', accent: '#1e293b', bg: '#fcfaf4',
    tags: 'certificate excellence gold ribbon medallion award landscape',
    items: [
      ...border('#c9a227', 3, 26, true, 11),
      ...ribbon(945, 235, 120, '#c9a227', '#1e293b'),
      ...titleBlock('Excellence', '#1f2937'),
      ...body({ nameColor: '#b8902f', accent: '#c9a227', text: TXT.excellence, presented: 'This certificate is awarded to' }),
      ...signature([{ name: 'James Carter', role: 'EXECUTIVE DIRECTOR' }]),
    ],
  },
  {
    ...base, id: 'cf-exc-forest', grp: 'Excellence', name: 'Forest & Gold', accent: '#d8b24a', bg: '#0c2e22',
    tags: 'certificate excellence green dark gold luxury seal landscape',
    items: [
      ...border('#c9a227', 2.5, 28, true, 9),
      ...corner2('tr', '#0a3a2b'), ...corner2('bl', '#0a3a2b'),
      seal(190, 250, 118, '#d8b24a', '#0a3a2b'),
      ...titleBlock('Excellence', '#e7d28a'),
      ...body({ nameColor: '#e7d28a', accent: '#d8b24a', ink: '#a9c4b6', text: TXT.excellence, presented: 'Proudly awarded to' }),
      ...signature([{ name: 'Robert Wilson', role: 'DIRECTOR' }], '#e2e8f0'),
    ],
  },

  // ===== HONOR =====
  {
    ...base, id: 'cf-hon-black', grp: 'Honor', name: 'Black Gold Honor', accent: '#e7c873', bg: '#0a0a0a',
    tags: 'certificate honor black gold luxury ornate prestige landscape',
    items: [
      ...border('#c9a227', 3, 26, true, 11),
      { kind: 'rect', x: CX, y: H / 2, w: W - 96, h: H - 96, fill: '', stroke: '#7a5e1c', strokeWidth: 0.8 },
      ...corner2('tl', '#1c1c1c'), ...corner2('tr', '#1c1c1c'), ...corner2('bl', '#1c1c1c'), ...corner2('br', '#1c1c1c'),
      seal(CX, 116, 92),
      ...titleBlock('Honor', '#e7c873', 'Playfair Display', 206),
      ...body({ y: 312, nameColor: '#f0d98a', accent: '#c9a227', ink: '#b9b2a0', text: TXT.honor, presented: 'This honor is proudly awarded to' }),
      ...signature([{ name: 'Benjamin Clark', role: 'PRESIDENT' }], '#ece6d6'),
    ],
  },
];

/**
 * Arabic (RTL) creative templates — mirrors the modern creative set:
 * innovative certificates (زجاجي، نيون، تخرج، رياضة، أطفال، قيادة…) plus
 * Arabic designs for social media, business cards/badges, invitations,
 * signage and menus.
 *
 * Notes:
 *  - All Arabic text uses `dir: 'rtl'` and NO letter-spacing (spacing breaks
 *    the connected Arabic script).
 *  - Display fonts: Aref Ruqaa, Rakkas, Marhey, Reem Kufi, El Messiri,
 *    DecoType Thuluth. Body: Cairo / Tajawal / Almarai. Names: Amiri.
 */
import type { TemplateItem } from './fabric-canvas.service';
import { CertTemplate, W, H, CX, gold, border, wedge, corner2, seal, ribbon } from './certificate-templates.data';
import { TextOpts, t, f, dot, box, ln } from './creative-templates.data';

const cbase = { cat: 'certificate', w: W, h: H, lang: 'ar' as const };

/** RTL text / field wrappers (never pass `spacing` for Arabic). */
const rt = (text: string, x: number, y: number, w: number, fontSize: number, o: TextOpts = {}): TemplateItem =>
  ({ ...t(text, x, y, w, fontSize, o), dir: 'rtl' });
const rf = (key: string, x: number, y: number, w: number, fontSize: number, o: TextOpts = {}): TemplateItem =>
  ({ ...f(key, x, y, w, fontSize, o), dir: 'rtl' });

/** Arabic signature block(s). */
const sigA = (list: { name: string; role: string }[], ink = '#1f2937', y = 664): TemplateItem[] => {
  const xs = list.length === 1 ? [CX] : [CX - 235, CX + 235];
  const out: TemplateItem[] = [];
  list.forEach((s, i) => {
    const x = xs[i];
    out.push(
      { kind: 'field', key: 'signature' + (i + 1), x, y: y - 44, w: 200 },
      ln(x, y, 215, ink, 1.2),
      rt(s.name, x, y + 18, 270, 16, { font: 'Cairo', weight: '700', fill: ink }),
      rt(s.role, x, y + 40, 270, 12.5, { font: 'Cairo', fill: '#64748b' }),
    );
  });
  return out;
};

/** RTL menu row: dish (right) + price (left), optional description. */
const arMenuRow = (name: string, price: string, y: number, left: number, w: number, ink: string, priceInk: string, desc?: string, descInk = '#78716c'): TemplateItem[] => {
  const cx = left + w / 2;
  const out: TemplateItem[] = [
    rt(name, cx, y, w, 16.5, { align: 'right', fill: ink, weight: '600', font: 'Cairo' }),
    rt(price, cx, y, w, 16, { align: 'left', fill: priceInk, weight: '700', font: 'Cairo' }),
  ];
  if (desc) out.push(rt(desc, cx, y + 26, w, 12.5, { align: 'right', fill: descInk, font: 'Cairo' }));
  return out;
};

const platinum = [{ offset: 0, color: '#6b7280' }, { offset: 0.5, color: '#e5e7eb' }, { offset: 1, color: '#9ca3af' }];

export const AR_CREATIVE_TEMPLATES: CertTemplate[] = [
  // ===================== شهادات عصرية وإبداعية =====================
  {
    ...cbase, id: 'ar-mod-glass', grp: 'عصرية وإبداعية', name: 'زجاج الشفق', accent: '#6366f1', bg: '#e0e7ff',
    tags: 'arabic certificate شهادة عصرية زجاجي تدرج حديث rtl modern glass',
    items: [
      box(CX, H / 2, W, H, '', { stops: [{ offset: 0, color: '#c7d2fe' }, { offset: 0.55, color: '#bae6fd' }, { offset: 1, color: '#a7f3d0' }], dir: 'diag' }),
      dot(150, 110, 240, '#ffffff', 0.35), dot(1010, 700, 300, '#ffffff', 0.28),
      dot(1035, 120, 150, '#818cf8', 0.3), dot(90, 690, 190, '#22d3ee', 0.25),
      box(CX, H / 2, W - 180, H - 140, '#ffffff', { rx: 30, stroke: '#ffffff', sw: 2, opacity: 0.78 }),
      rt('شهادة إنجاز', CX, 200, 900, 60, { font: 'El Messiri', weight: '700', fill: '#312e81' }),
      rt('تُمنح هذه الشهادة بكل فخر إلى', CX, 300, 800, 18, { font: 'Cairo', fill: '#475569' }),
      rf('name', CX, 368, 880, 56, { font: 'Amiri', weight: '700', fill: '#4f46e5' }),
      ln(CX, 420, 520, '#6366f1', 1.5),
      rt('تقديرًا لتميّزه والتزامه وروحه الإبداعية\nفي كل عمل يقوم به.', CX, 486, 800, 17, { font: 'Cairo', fill: '#475569', lh: 1.8 }),
      ...sigA([{ name: 'نورة أحمد', role: 'مديرة البرنامج' }], '#312e81', 652),
    ],
  },
  {
    ...cbase, id: 'ar-mod-swiss', grp: 'عصرية وإبداعية', name: 'بساطة عصرية', accent: '#ef4444', bg: '#ffffff',
    tags: 'arabic certificate شهادة بسيطة عصرية حديثة rtl minimal modern',
    items: [
      box(W - 116, H / 2, 6, H - 200, '#ef4444'),
      rt('شــهــادة', 633, 176, 720, 74, { align: 'right', font: 'Reem Kufi', weight: '700', fill: '#0f172a' }),
      rt('التميّز والإبداع', 633, 244, 720, 24, { align: 'right', font: 'Cairo', weight: '700', fill: '#ef4444' }),
      rt('تشهد الإدارة بأن', 633, 336, 720, 17, { align: 'right', font: 'Cairo', fill: '#64748b' }),
      rf('name', 633, 402, 720, 52, { align: 'right', font: 'Amiri', weight: '700', fill: '#0f172a' }),
      ln(813, 454, 360, '#0f172a', 2),
      rt('قد حقّق نتائج متميّزة وتجاوز التوقّعات\nبأداء استثنائي يستحق الإشادة والتقدير.', 633, 510, 720, 16, { align: 'right', font: 'Cairo', fill: '#475569', lh: 1.8 }),
      { kind: 'field', key: 'signature1', x: 823, y: 612, w: 200 },
      ln(823, 660, 260, '#0f172a', 1.5),
      rt('سارة خالد', 823, 678, 260, 15, { font: 'Cairo', weight: '700', fill: '#0f172a' }),
      rt('المدير العام', 823, 700, 260, 12, { font: 'Cairo', fill: '#94a3b8' }),
      rf('date', 323, 632, 220, 16, { font: 'Cairo', weight: '600', fill: '#0f172a' }),
      ln(323, 660, 260, '#0f172a', 1.5),
      rt('التاريخ', 323, 678, 260, 12, { font: 'Cairo', fill: '#94a3b8' }),
    ],
  },

  // ===================== تقنية وابتكار =====================
  {
    ...cbase, id: 'ar-tech-neon', grp: 'تقنية وابتكار', name: 'دائرة النيون', accent: '#22d3ee', bg: '#060b18',
    tags: 'arabic certificate شهادة ابتكار تقنية نيون برمجة rtl tech neon',
    items: [
      ...border('#22d3ee', 2, 28),
      box(CX, H / 2, W - 92, H - 92, '', { stroke: '#a855f7', sw: 1 }),
      box(140, 70, 130, 4, '', { stops: [{ offset: 0, color: '#22d3ee' }, { offset: 1, color: '#a855f7' }], dir: 'h' }),
      box(72, 118, 4, 90, '#22d3ee'), dot(72, 70, 10, '#22d3ee'),
      box(W - 140, H - 70, 130, 4, '', { stops: [{ offset: 0, color: '#a855f7' }, { offset: 1, color: '#22d3ee' }], dir: 'h' }),
      box(W - 72, H - 118, 4, 90, '#a855f7'), dot(W - 72, H - 70, 10, '#a855f7'),
      seal(178, 250, 112, '#22d3ee', '#0b1226'),
      rt('شهادة ابتكار', CX, 196, 900, 62, { font: 'Reem Kufi', weight: '700', fill: '#f1f5f9' }),
      rt('تُمنح هذه الشهادة إلى', CX, 300, 800, 18, { font: 'Cairo', fill: '#8fa3c0' }),
      rf('name', CX, 368, 880, 54, { font: 'Cairo', weight: '700', fill: '#22d3ee' }),
      ln(CX, 420, 520, '#a855f7', 1.5),
      rt('لأفكاره الريادية وقدرته على تحويل\nالمستحيل إلى واقع ملموس.', CX, 486, 800, 17, { font: 'Cairo', fill: '#8fa3c0', lh: 1.8 }),
      ...sigA([{ name: 'آدم وليد', role: 'المدير التقني' }], '#e2e8f0'),
    ],
  },

  // ===================== تخرج =====================
  {
    ...cbase, id: 'ar-grad-diploma', grp: 'تخرج', name: 'شهادة تخرج كلاسيكية', accent: '#8a6d1f', bg: '#fdf8ec',
    tags: 'arabic certificate شهادة تخرج دبلوم جامعة كلاسيكي rtl graduation diploma',
    items: [
      ...border('#8a6d1f', 3, 24, true, 10),
      box(CX, H / 2, W - 110, H - 110, '', { stroke: '#c9a227', sw: 0.8 }),
      seal(CX, 112, 90, '#c9a227', '#3f2d09'),
      rt('شهادة تخرج', CX, 212, 900, 62, { font: 'Aref Ruqaa', weight: '700', fill: '#3f2d09' }),
      rt('تشهد إدارة الجامعة بأن', CX, 318, 820, 18, { font: 'Cairo', fill: '#5d5343' }),
      rf('name', CX, 386, 880, 56, { font: 'Amiri', weight: '700', fill: '#8a6d1f' }),
      ln(CX, 438, 520, '#c9a227', 1.5),
      rt('قد أتمّ بنجاح جميع المتطلبات الأكاديمية، وتُمنح له هذه\nالشهادة مع كامل الحقوق والامتيازات المرتبطة بها.', CX, 502, 840, 16.5, { font: 'Cairo', fill: '#5d5343', lh: 1.8 }),
      ...sigA([{ name: 'د. أمل الراشد', role: 'عميدة الكلية' }, { name: 'أ.د. علي الوهيبي', role: 'رئيس الجامعة' }], '#3f2d09'),
    ],
  },
  {
    ...cbase, id: 'ar-grad-night', grp: 'تخرج', name: 'ليلة التخرج', accent: '#fbbf24', bg: '#141034',
    tags: 'arabic certificate شهادة تخرج ليلي نجوم ذهبي احتفال rtl graduation night',
    items: [
      ...border('#fbbf24', 2.2, 28, true, 9),
      dot(180, 120, 6, '#fde68a', 0.8), dot(940, 100, 4, '#e0e7ff', 0.7), dot(1000, 170, 5, '#fde68a', 0.6),
      dot(120, 200, 4, '#e0e7ff', 0.6), dot(870, 650, 5, '#fde68a', 0.5), dot(220, 660, 4, '#e0e7ff', 0.5),
      { kind: 'polygon', x: 0, y: 0, points: [{ x: CX - 78, y: 120 }, { x: CX, y: 92 }, { x: CX + 78, y: 120 }, { x: CX, y: 148 }], fill: '#fbbf24' },
      box(CX, 158, 64, 24, '#f59e0b', { rx: 5 }),
      box(CX - 78, 145, 3, 46, '#fde68a'), dot(CX - 78, 172, 11, '#fde68a'),
      rt('مبارك التخرج', CX, 240, 900, 72, { font: 'Rakkas', fill: '#fde68a' }),
      rt('تحتفي الدفعة الليلة بـ', CX, 348, 800, 18, { font: 'Cairo', fill: '#b7b3d9' }),
      rf('name', CX, 414, 880, 54, { font: 'Amiri', weight: '700', fill: '#fbbf24' }),
      ln(CX, 466, 520, '#fbbf24', 1.5),
      rt('نحتفل الليلة بجهودك ونموّك ومستقبلك\nالمشرق بإذن الله. ألف مبروك!', CX, 530, 800, 16.5, { font: 'Cairo', fill: '#b7b3d9', lh: 1.8 }),
      ...sigA([{ name: 'دفعة ٢٠٢٦', role: 'لجنة التخرج' }], '#e0e7ff'),
    ],
  },

  // ===================== رياضة =====================
  {
    ...cbase, id: 'ar-spt-champion', grp: 'رياضة', name: 'شهادة بطولة', accent: '#d97706', bg: '#ffffff',
    tags: 'arabic certificate شهادة بطولة رياضة كأس بطل rtl sports champion',
    items: [
      box(150, H - 70, 560, 46, '#0f172a', { angle: -32 }),
      box(210, H - 120, 520, 34, '', { stops: gold(), angle: -32 }),
      box(260, H - 160, 420, 14, '#dc2626', { angle: -32 }),
      box(W - 150, 70, 560, 46, '#0f172a', { angle: -32 }),
      box(W - 210, 120, 520, 34, '', { stops: gold(), angle: -32 }),
      box(W - 260, 160, 420, 14, '#dc2626', { angle: -32 }),
      ...border('#0f172a', 1.8, 30),
      ...ribbon(933, 240, 118, '#c9a227', '#0f172a'),
      rt('شهادة بطولة', CX, 200, 900, 62, { font: 'Changa', weight: '700', fill: '#0f172a' }),
      rt('يُمنح لقب البطولة إلى', CX, 302, 800, 18, { font: 'Cairo', fill: '#475569' }),
      rf('name', CX, 370, 880, 54, { font: 'Cairo', weight: '700', fill: '#d97706' }),
      ln(CX, 422, 520, '#d97706', 1.5),
      rt('لأدائه الرياضي الاستثنائي وروحه\nالتنافسية التي لا تُقهر.', CX, 486, 800, 17, { font: 'Cairo', fill: '#475569', lh: 1.8 }),
      ...sigA([{ name: 'كابتن فهد السالم', role: 'المدرب الرئيسي' }], '#0f172a'),
    ],
  },

  // ===================== أطفال ومدارس =====================
  {
    ...cbase, id: 'ar-kid-stars', grp: 'أطفال ومدارس', name: 'النجم المتألق', accent: '#f472b6', bg: '#fffdf5',
    tags: 'arabic certificate شهادة أطفال مدرسة نجوم مرح ملون rtl kids school',
    items: [
      box(CX, H / 2, W - 70, H - 70, '', { stroke: '#f472b6', sw: 4, rx: 36 }),
      box(CX, H / 2, W - 100, H - 100, '', { stroke: '#38bdf8', sw: 2, rx: 30 }),
      dot(150, 140, 18, '#fbbf24'), dot(985, 150, 14, '#34d399'), dot(180, 640, 14, '#38bdf8'),
      dot(950, 630, 18, '#f472b6'), dot(260, 110, 10, '#a78bfa'), dot(880, 690, 10, '#fb923c'),
      box(320, 660, 16, 16, '#fbbf24', { angle: 30 }), box(820, 120, 14, 14, '#f472b6', { angle: 45 }),
      { kind: 'triangle', x: 100, y: 400, w: 22, h: 20, fill: '#34d399', angle: 20 },
      { kind: 'triangle', x: 1020, y: 410, w: 22, h: 20, fill: '#a78bfa', angle: -15 },
      seal(CX, 118, 86, '#fbbf24', '#f472b6'),
      rt('النجم المتألق', CX, 222, 800, 58, { font: 'Marhey', weight: '600', fill: '#f472b6' }),
      rt('شهادة التميّز والإبداع', CX, 282, 700, 20, { font: 'Tajawal', weight: '700', fill: '#38bdf8' }),
      rt('تُمنح جائزة النجم المتألق إلى', CX, 348, 760, 17, { font: 'Cairo', fill: '#64748b' }),
      rf('name', CX, 414, 860, 52, { font: 'Marhey', weight: '600', fill: '#8b5cf6' }),
      ln(CX, 466, 480, '#fbbf24', 2),
      rt('لأنك لطيف وفضولي ورائع\nفي كل يوم!', CX, 528, 760, 16.5, { font: 'Cairo', fill: '#64748b', lh: 1.8 }),
      ...sigA([{ name: 'أ. ليلى إبراهيم', role: 'معلمة الصف' }], '#475569', 652),
    ],
  },
  {
    ...cbase, id: 'ar-kid-rainbow', grp: 'أطفال ومدارس', name: 'يوم قوس قزح', accent: '#f43f5e', bg: '#ffffff',
    tags: 'arabic certificate شهادة أطفال قوس قزح مدرسة روضة rtl kids rainbow',
    items: [
      box(CX, 28, W, 12, '#ef4444'), box(CX, 40, W, 12, '#f97316'), box(CX, 52, W, 12, '#facc15'),
      box(CX, 64, W, 12, '#22c55e'), box(CX, 76, W, 12, '#3b82f6'), box(CX, 88, W, 12, '#8b5cf6'),
      box(CX, H - 28, W, 12, '#ef4444'), box(CX, H - 40, W, 12, '#f97316'), box(CX, H - 52, W, 12, '#facc15'),
      box(CX, H - 64, W, 12, '#22c55e'), box(CX, H - 76, W, 12, '#3b82f6'), box(CX, H - 88, W, 12, '#8b5cf6'),
      dot(140, 195, 80, '#fde047'),
      dot(980, 200, 60, '#bae6fd'), dot(1020, 212, 48, '#bae6fd'), dot(945, 216, 44, '#bae6fd'),
      rt('أحسنت!', CX, 212, 700, 66, { font: 'Marhey', weight: '600', fill: '#f43f5e' }),
      rt('شهادة إنجاز', CX, 280, 700, 20, { font: 'Tajawal', weight: '700', fill: '#3b82f6' }),
      rt('تُمنح هذه الشهادة إلى', CX, 346, 760, 17, { font: 'Cairo', fill: '#64748b' }),
      rf('name', CX, 412, 860, 52, { font: 'Marhey', weight: '600', fill: '#f43f5e' }),
      ln(CX, 464, 480, '#22c55e', 2),
      rt('لأنك تبذل قصارى جهدك وتساعد الآخرين\nوتجعل كل يوم أجمل!', CX, 526, 760, 16.5, { font: 'Cairo', fill: '#64748b', lh: 1.8 }),
      ...sigA([{ name: 'أ. عمر حسن', role: 'مدير المدرسة' }], '#334155', 648),
    ],
  },

  // ===================== قيادة =====================
  {
    ...cbase, id: 'ar-lead-platinum', grp: 'قيادة', name: 'القيادة البلاتينية', accent: '#cbd5e1', bg: '#16181d',
    tags: 'arabic certificate شهادة قيادة بلاتيني فضي فاخر تنفيذي rtl leadership',
    items: [
      ...border('#9ca3af', 2, 28, true, 9),
      ...corner2('tl', '#20242c', platinum), ...corner2('br', '#20242c', platinum),
      seal(CX, 108, 84, '#cbd5e1', '#16181d'),
      rt('شهادة قيادة', CX, 204, 900, 60, { font: 'Amiri', weight: '700', fill: '#e5e7eb' }),
      rt('تُقدَّم بأسمى آيات التقدير إلى', CX, 306, 800, 18, { font: 'Cairo', fill: '#9aa3b2' }),
      rf('name', CX, 374, 880, 54, { font: 'Amiri', weight: '700', fill: '#e5e7eb' }),
      ln(CX, 426, 520, '#9ca3af', 1.5),
      rt('لرؤيته الملهمة وحكمته في اتخاذ القرار\nوشجاعته في قيادة الفريق نحو النجاح.', CX, 490, 800, 17, { font: 'Cairo', fill: '#9aa3b2', lh: 1.8 }),
      ...sigA([{ name: 'خديجة المنصور', role: 'رئيسة مجلس الإدارة' }], '#d1d5db'),
    ],
  },
  {
    ...cbase, id: 'ar-lead-summit', grp: 'قيادة', name: 'قمة الريادة', accent: '#0369a1', bg: '#f8fafc',
    tags: 'arabic certificate شهادة ريادة قيادة جبال قمة أزرق rtl leadership summit',
    items: [
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 0, y: H }, { x: 0, y: H - 150 }, { x: 200, y: H - 235 }, { x: 400, y: H - 140 }, { x: 560, y: H - 215 }, { x: 760, y: H - 120 }, { x: 950, y: H - 200 }, { x: W, y: H - 130 }, { x: W, y: H }], fill: '#bae6fd' },
      { kind: 'polygon', x: 0, y: 0, points: [{ x: 0, y: H }, { x: 0, y: H - 90 }, { x: 230, y: H - 180 }, { x: 480, y: H - 80 }, { x: 700, y: H - 165 }, { x: 920, y: H - 70 }, { x: W, y: H - 140 }, { x: W, y: H }], fill: '#0369a1' },
      dot(950, 120, 70, '#fcd34d'),
      ...border('#0369a1', 1.6, 30),
      rt('شهادة ريادة', CX, 172, 900, 58, { font: 'El Messiri', weight: '700', fill: '#0c4a6e' }),
      rt('تشهد الإدارة بأن', CX, 272, 800, 17, { font: 'Cairo', fill: '#475569' }),
      rf('name', CX, 338, 860, 52, { font: 'Amiri', weight: '700', fill: '#0369a1' }),
      ln(CX, 390, 500, '#0369a1', 1.5),
      rt('قاد الفريق نحو آفاق جديدة وتسلّق\nالقمم بكل ثقة واقتدار.', CX, 452, 780, 16.5, { font: 'Cairo', fill: '#475569', lh: 1.8 }),
      ...sigA([{ name: 'ناصر البراهيم', role: 'العضو المنتدب' }], '#0c4a6e', 590),
    ],
  },

  // ===================== وسائل التواصل =====================
  {
    cat: 'social', lang: 'ar', id: 'ar-post-congrats', grp: 'منشورات', name: 'منشور تهنئة', accent: '#f472b6', bg: '#312e81', w: 1080, h: 1080,
    tags: 'arabic social instagram تهنئة مبروك احتفال منشور rtl congrats post',
    items: [
      box(540, 540, 1080, 1080, '', { stops: [{ offset: 0, color: '#4f46e5' }, { offset: 0.5, color: '#7c3aed' }, { offset: 1, color: '#db2777' }], dir: 'diag' }),
      dot(140, 160, 22, '#fde047', 0.9), dot(920, 140, 16, '#a7f3d0', 0.9), dot(180, 900, 18, '#fca5a5', 0.85),
      dot(940, 920, 24, '#93c5fd', 0.85), dot(540, 110, 12, '#fdba74', 0.9),
      box(260, 300, 18, 18, '#fde047', { angle: 35 }), box(830, 320, 16, 16, '#a7f3d0', { angle: 20 }),
      { kind: 'triangle', x: 120, y: 540, w: 26, h: 24, fill: '#fdba74', angle: 15 },
      { kind: 'triangle', x: 960, y: 560, w: 26, h: 24, fill: '#fde047', angle: -20 },
      rt('ألف مبروك', 540, 400, 980, 110, { font: 'Rakkas', fill: '#ffffff' }),
      ln(540, 500, 260, '#fde047', 3),
      rf('name', 540, 590, 900, 76, { font: 'Amiri', weight: '700', fill: '#fde047' }),
      rt('فخورون بك وبإنجازك الرائع!\nنحو المزيد من النجاحات.', 540, 740, 860, 32, { font: 'Cairo', fill: '#e9d5ff', lh: 1.6 }),
      t('@yourbrand', 540, 980, 600, 24, { fill: '#c7d2fe', spacing: 60 }),
    ],
  },
  {
    cat: 'social', lang: 'ar', id: 'ar-story-announce', grp: 'منشورات', name: 'إعلان ستوري', accent: '#34d399', bg: '#042f2e', w: 1080, h: 1920,
    tags: 'arabic social instagram story ستوري إعلان ترقبوا rtl announcement',
    items: [
      box(540, 960, 1080, 1920, '', { stops: [{ offset: 0, color: '#042f2e' }, { offset: 1, color: '#065f46' }], dir: 'v' }),
      dot(1000, 180, 340, '#10b981', 0.25), dot(80, 1750, 420, '#34d399', 0.18),
      { kind: 'circle', x: 540, y: 260, w: 140, fill: '', stroke: '#6ee7b7', strokeWidth: 3 },
      rt('{{company}}', 540, 380, 700, 34, { font: 'Cairo', weight: '600', fill: '#a7f3d0' }),
      rt('ترقّبوا', 540, 700, 900, 140, { font: 'Rakkas', fill: '#ffffff' }),
      rt('شيء مميّز في الطريق إليكم', 540, 860, 950, 46, { font: 'Cairo', weight: '700', fill: '#6ee7b7' }),
      ln(540, 950, 200, '#fde047', 4),
      rf('headline', 540, 1080, 880, 42, { font: 'Cairo', weight: '600', fill: '#ecfdf5' }),
      rt('تابعونا لمعرفة التفاصيل قريبًا', 540, 1230, 800, 30, { font: 'Cairo', fill: '#a7f3d0' }),
      { kind: 'triangle', x: 540, y: 1650, w: 46, h: 36, fill: '#fde047', angle: 180 },
      rt('اسحب للأعلى', 540, 1720, 500, 28, { font: 'Cairo', weight: '700', fill: '#fde047' }),
    ],
  },

  // ===================== بطاقات الأعمال =====================
  {
    cat: 'business', lang: 'ar', id: 'ar-card-lux', grp: 'بطاقات', name: 'بطاقة فاخرة', accent: '#c9a227', bg: '#0a0a0a', w: 1050, h: 600,
    tags: 'arabic business card بطاقة عمل فاخرة أسود ذهبي rtl luxury',
    items: [
      box(525, 300, 990, 540, '', { stroke: '#c9a227', sw: 1.5 }),
      box(90, 90, 10, 10, '#c9a227', { angle: 45 }), box(960, 90, 10, 10, '#c9a227', { angle: 45 }),
      box(90, 510, 10, 10, '#c9a227', { angle: 45 }), box(960, 510, 10, 10, '#c9a227', { angle: 45 }),
      rf('name', 525, 225, 800, 46, { font: 'Amiri', weight: '700', fill: '#f5e6b8' }),
      ln(525, 285, 220, '#c9a227', 1.5),
      rf('role', 525, 332, 700, 20, { font: 'Cairo', fill: '#d4c58a' }),
      rt('{{phone}}   ·   {{email}}   ·   {{website}}', 525, 470, 900, 16, { font: 'Cairo', fill: '#a8a29e' }),
    ],
  },
  {
    cat: 'business', lang: 'ar', id: 'ar-badge-event', grp: 'بطاقات', name: 'بطاقة فعالية', accent: '#0ea5e9', bg: '#ffffff', w: 638, h: 1004,
    tags: 'arabic business badge بطاقة فعالية مؤتمر تصريح rtl event pass',
    items: [
      box(319, 130, 638, 260, '', { stops: [{ offset: 0, color: '#0ea5e9' }, { offset: 1, color: '#6366f1' }], dir: 'h' }),
      rt('{{event}}', 319, 84, 560, 30, { font: 'Cairo', weight: '700', fill: '#ffffff' }),
      rt('تصريح دخول رسمي', 319, 136, 500, 15, { font: 'Cairo', fill: '#e0f2fe' }),
      dot(319, 300, 190, '#ffffff'), dot(319, 300, 174, '#f1f5f9'),
      rt('الصورة', 319, 300, 200, 16, { font: 'Cairo', fill: '#94a3b8' }),
      rf('name', 319, 480, 540, 42, { font: 'Cairo', weight: '700', fill: '#0f172a' }),
      rf('role', 319, 545, 500, 20, { font: 'Cairo', weight: '600', fill: '#6366f1' }),
      ln(319, 600, 140, '#0ea5e9', 3),
      rt('{{company}}', 319, 650, 500, 18, { font: 'Cairo', fill: '#475569' }),
      box(319, 790, 150, 150, '', { stroke: '#cbd5e1', sw: 2, rx: 12 }),
      box(285, 756, 30, 30, '#0f172a'), box(353, 756, 30, 30, '#0f172a'),
      box(285, 824, 30, 30, '#0f172a'), box(340, 812, 16, 16, '#0f172a'),
      box(319, 972, 638, 64, '#0f172a'),
      rt('زائر', 319, 970, 500, 22, { font: 'Cairo', weight: '700', fill: '#ffffff' }),
    ],
  },

  // ===================== البطاقات والدعوات =====================
  {
    cat: 'cards', lang: 'ar', id: 'ar-wedding', grp: 'دعوات وبطاقات', name: 'دعوة زفاف', accent: '#c9a227', bg: '#fffcf5', w: 750, h: 1050,
    tags: 'arabic invitation دعوة زفاف عرس ذهبي أنيق rtl wedding',
    items: [
      box(375, 525, 690, 990, '', { stroke: '#c9a227', sw: 1.5 }),
      box(375, 525, 666, 966, '', { stroke: '#c9a227', sw: 0.8 }),
      ln(375, 120, 180, '#c9a227', 1), dot(375, 120, 8, '#c9a227'),
      rt('بعون الله وتوفيقه', 375, 182, 600, 17, { font: 'Cairo', fill: '#8a6d1f' }),
      rt('دعوة زفاف', 375, 268, 640, 56, { font: 'Aref Ruqaa', weight: '700', fill: '#7a5e1c' }),
      rf('name1', 375, 395, 640, 48, { font: 'Amiri', weight: '700', fill: '#8a6d1f' }),
      rt('و', 375, 462, 200, 38, { font: 'Aref Ruqaa', fill: '#c9a227' }),
      rf('name2', 375, 532, 640, 48, { font: 'Amiri', weight: '700', fill: '#8a6d1f' }),
      rt('يتشرّفان بدعوتكم لحضور حفل زفافهما', 375, 622, 620, 16.5, { font: 'Cairo', fill: '#57534e' }),
      rt('{{date}}', 375, 692, 500, 22, { font: 'Cairo', weight: '700', fill: '#1c1917' }),
      rt('{{venue}}', 375, 742, 560, 16, { font: 'Cairo', fill: '#57534e' }),
      rt('في تمام الساعة {{time}}', 375, 786, 460, 14, { font: 'Cairo', fill: '#8a6d1f' }),
      ln(375, 900, 180, '#c9a227', 1), dot(375, 900, 8, '#c9a227'),
      rt('نسعد بحضوركم ومشاركتنا فرحتنا', 375, 950, 560, 13, { font: 'Cairo', fill: '#a8a29e' }),
    ],
  },
  {
    cat: 'cards', lang: 'ar', id: 'ar-eid', grp: 'دعوات وبطاقات', name: 'تهنئة عيد', accent: '#fbbf24', bg: '#064e3b', w: 750, h: 1050,
    tags: 'arabic card عيد مبارك تهنئة رمضان هلال rtl eid greeting',
    items: [
      dot(375, 220, 170, '#fbbf24'), dot(412, 185, 158, '#064e3b'),
      dot(180, 130, 6, '#fde68a', 0.9), dot(560, 110, 5, '#fde68a', 0.8), dot(620, 300, 7, '#fde68a', 0.7),
      dot(120, 340, 5, '#fde68a', 0.7), dot(660, 180, 4, '#e0e7ff', 0.6), dot(90, 210, 4, '#e0e7ff', 0.6),
      rt('عيد مبارك', 375, 490, 660, 92, { font: 'DecoType Thuluth', fill: '#fde68a' }),
      ln(375, 590, 220, '#fbbf24', 1.5),
      rt('كل عام وأنتم بخير\nأعاده الله عليكم بالخير واليُمن والبركات', 375, 680, 620, 22, { font: 'Cairo', fill: '#a7f3d0', lh: 1.8 }),
      rt('مع أطيب التمنيات', 375, 830, 500, 18, { font: 'Cairo', fill: '#6ee7b7' }),
      rf('company', 375, 890, 560, 30, { font: 'Amiri', weight: '700', fill: '#fde68a' }),
    ],
  },
  {
    cat: 'cards', lang: 'ar', id: 'ar-thanks', grp: 'دعوات وبطاقات', name: 'بطاقة شكر', accent: '#be185d', bg: '#fdf2f8', w: 1050, h: 750,
    tags: 'arabic card شكر تقدير امتنان rtl thank you',
    items: [
      dot(950, 120, 220, '#fbcfe8', 0.6), dot(90, 660, 260, '#f9a8d4', 0.4), dot(140, 120, 90, '#fce7f3', 0.9),
      rt('شكرًا جزيلًا', 525, 300, 800, 84, { font: 'Aref Ruqaa', weight: '700', fill: '#be185d' }),
      ln(525, 400, 220, '#f472b6', 2),
      rt('على لطفكم وكرمكم —\nنقدّر لكم ذلك من القلب.', 525, 490, 700, 22, { font: 'Cairo', fill: '#831843', lh: 1.7 }),
      rt('مع خالص الحب، {{sender}}', 525, 620, 600, 24, { font: 'Amiri', weight: '700', fill: '#be185d' }),
    ],
  },

  // ===================== اللافتات =====================
  {
    cat: 'signage', lang: 'ar', id: 'ar-welcome', grp: 'لافتات', name: 'لوحة ترحيب', accent: '#c9a227', bg: '#fbf8f1', w: W, h: H,
    tags: 'arabic signage لافتة ترحيب أهلا وسهلا فعالية rtl welcome sign',
    items: [
      ...corner2('tl', '#0f172a'), ...corner2('br', '#0f172a'),
      ...border('#c9a227', 2.5, 30, true, 9),
      rt('أهلًا وسهلًا', CX, 290, 1000, 104, { font: 'Aref Ruqaa', weight: '700', fill: '#1f2937' }),
      ln(CX, 402, 300, '#c9a227', 2),
      rt('يسعدنا انضمامكم إلى', CX, 456, 600, 20, { font: 'Cairo', fill: '#8a6d1f' }),
      rf('event', CX, 530, 800, 44, { font: 'Amiri', weight: '700', fill: '#b8902f' }),
      rt('{{date}}', CX, 626, 500, 18, { font: 'Cairo', fill: '#64748b' }),
    ],
  },
  {
    cat: 'signage', lang: 'ar', id: 'ar-poster-event', grp: 'لافتات', name: 'ملصق فعالية', accent: '#4338ca', bg: '#ffffff', w: 794, h: 1123,
    tags: 'arabic signage poster ملصق فعالية إعلان حدث rtl event',
    items: [
      box(397, 240, 794, 480, '', { stops: [{ offset: 0, color: '#4338ca' }, { offset: 1, color: '#06b6d4' }], dir: 'diag' }),
      dot(680, 120, 220, '#ffffff', 0.12), dot(90, 400, 180, '#ffffff', 0.1),
      rt('فعالية قادمة', 397, 116, 600, 20, { font: 'Cairo', weight: '600', fill: '#c7d2fe' }),
      rf('event', 397, 226, 680, 56, { font: 'El Messiri', weight: '700', fill: '#ffffff' }),
      rt('{{tagline}}', 397, 332, 640, 20, { font: 'Cairo', fill: '#e0e7ff' }),
      rt('{{date}}   ·   {{time}}', 397, 580, 640, 24, { font: 'Cairo', weight: '600', fill: '#0f172a' }),
      rt('{{venue}}', 397, 640, 640, 20, { font: 'Cairo', fill: '#475569' }),
      ln(397, 715, 200, '#06b6d4', 3),
      rt('الدخول مجاني — الجميع مدعوّون\nسجّلوا عبر {{website}}', 397, 800, 620, 17, { font: 'Cairo', fill: '#475569', lh: 1.8 }),
      box(397, 1090, 794, 66, '#0f172a'),
      rt('{{company}}', 397, 1088, 600, 16, { font: 'Cairo', fill: '#e2e8f0' }),
    ],
  },

  // ===================== القوائم =====================
  {
    cat: 'menu', lang: 'ar', id: 'ar-menu-elegant', grp: 'قوائم', name: 'قائمة طعام', accent: '#8a6d1f', bg: '#fffdf7', w: 794, h: 1123,
    tags: 'arabic menu قائمة طعام مطعم فاخر rtl restaurant',
    items: [
      box(397, 561, 714, 1043, '', { stroke: '#c9a227', sw: 1 }),
      rt('قائمة الطعام', 397, 118, 600, 48, { font: 'Aref Ruqaa', weight: '700', fill: '#1c1917' }),
      ln(397, 176, 120, '#c9a227', 2),
      rt('{{restaurant}}', 397, 216, 560, 16, { font: 'Cairo', fill: '#8a6d1f' }),
      rt('المقبلات', 397, 300, 560, 24, { font: 'Amiri', weight: '700', fill: '#8a6d1f' }),
      ...arMenuRow('شوربة العدس', '٢٠ ر.س', 354, 110, 574, '#1c1917', '#8a6d1f', 'عدس مطهو ببطء مع الليمون والكمّون'),
      ...arMenuRow('سلطة فتوش', '٢٥ ر.س', 428, 110, 574, '#1c1917', '#8a6d1f', 'خضروات طازجة مع الخبز المحمّص ودبس الرمان'),
      rt('الأطباق الرئيسية', 397, 526, 560, 24, { font: 'Amiri', weight: '700', fill: '#8a6d1f' }),
      ...arMenuRow('مشاوي مشكّلة', '٨٥ ر.س', 580, 110, 574, '#1c1917', '#8a6d1f', 'تشكيلة من أجود اللحوم المشوية على الفحم'),
      ...arMenuRow('سمك مشوي', '٧٥ ر.س', 654, 110, 574, '#1c1917', '#8a6d1f', 'سمك طازج متبّل بالأعشاب والليمون'),
      ...arMenuRow('كبسة لحم', '٦٥ ر.س', 728, 110, 574, '#1c1917', '#8a6d1f', 'أرز بسمتي مع لحم الضأن والبهارات الخاصة'),
      rt('الحلويات', 397, 824, 560, 24, { font: 'Amiri', weight: '700', fill: '#8a6d1f' }),
      ...arMenuRow('كنافة بالجبن', '٢٥ ر.س', 878, 110, 574, '#1c1917', '#8a6d1f', 'كنافة ساخنة بالقطر والفستق الحلبي'),
      ...arMenuRow('أم علي', '٢٠ ر.س', 952, 110, 574, '#1c1917', '#8a6d1f', 'بالمكسّرات والزبيب وكريمة الحليب'),
      ln(397, 1030, 120, '#c9a227', 1.5),
      rt('{{phone}}   ·   {{website}}', 397, 1062, 560, 12.5, { font: 'Cairo', fill: '#a8a29e' }),
    ],
  },
  {
    cat: 'menu', lang: 'ar', id: 'ar-menu-cafe', grp: 'قوائم', name: 'قائمة مقهى', accent: '#fbbf24', bg: '#1f2421', w: 794, h: 1123,
    tags: 'arabic menu قائمة مقهى قهوة أسعار rtl cafe coffee',
    items: [
      box(397, 561, 730, 1060, '', { stroke: '#a8a29e', sw: 1.5 }),
      box(397, 561, 706, 1036, '', { stroke: '#57534e', sw: 1 }),
      dot(180, 120, 10, '#d6bcab'), dot(620, 150, 8, '#d6bcab'),
      rt('قائمة المقهى', 397, 150, 600, 58, { font: 'Rakkas', fill: '#f5f5f4' }),
      rt('القهوة', 397, 272, 560, 26, { font: 'Changa', weight: '700', fill: '#fbbf24' }),
      ...arMenuRow('إسبريسو', '١٢ ر.س', 334, 130, 534, '#e7e5e4', '#fbbf24'),
      ...arMenuRow('كابتشينو', '١٨ ر.س', 388, 130, 534, '#e7e5e4', '#fbbf24'),
      ...arMenuRow('لاتيه', '٢٠ ر.س', 442, 130, 534, '#e7e5e4', '#fbbf24'),
      ...arMenuRow('موكا', '٢٢ ر.س', 496, 130, 534, '#e7e5e4', '#fbbf24'),
      rt('الحلى', 397, 592, 560, 26, { font: 'Changa', weight: '700', fill: '#fbbf24' }),
      ...arMenuRow('كرواسون', '١٤ ر.س', 654, 130, 534, '#e7e5e4', '#fbbf24'),
      ...arMenuRow('كيك التمر', '١٦ ر.س', 708, 130, 534, '#e7e5e4', '#fbbf24'),
      ...arMenuRow('سينابون', '١٨ ر.س', 762, 130, 534, '#e7e5e4', '#fbbf24'),
      ln(397, 856, 160, '#fbbf24', 2),
      rt('واي فاي مجاني   ·   نفتح يوميًا من ٧ صباحًا حتى ٩ مساءً', 397, 910, 620, 15, { font: 'Cairo', fill: '#d6d3d1' }),
      rf('company', 397, 1000, 500, 28, { font: 'Amiri', weight: '700', fill: '#fbbf24' }),
    ],
  },
];

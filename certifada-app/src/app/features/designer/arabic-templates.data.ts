/**
 * Arabic (RTL) built-in templates — certificates, social posts, a business
 * card, an invitation and a letterhead. Text uses `dir: 'rtl'` with Arabic web
 * fonts (Amiri for display, Cairo for body) already loaded in index.html.
 * Certificates reuse the landscape decoration builders; the rest are authored
 * inline. All carry `lang: 'ar'` so the Templates tab can show them under the
 * Arabic language toggle.
 */
import type { TemplateItem } from './fabric-canvas.service';
import { CertTemplate, W, H, CX, gold, border, corner2, wedge, seal, ribbon } from './certificate-templates.data';

const cbase = { cat: 'certificate', w: W, h: H, lang: 'ar' as const };

// ---- Arabic certificate text blocks (RTL) --------------------------------
function titleAr(type: string, color = '#1f2937', y = 156, font = 'Amiri'): TemplateItem[] {
  return [{ kind: 'text', text: 'شهادة ' + type, x: CX, y, w: 980, fontSize: 64, fontFamily: font, fontWeight: '700', fill: color, dir: 'rtl' }];
}
interface ArBody { presented?: string; nameColor?: string; text?: string; ink?: string; accent?: string; y?: number; nameFont?: string; }
function bodyAr(o: ArBody = {}): TemplateItem[] {
  const y = o.y ?? 286, ink = o.ink ?? '#475569';
  return [
    { kind: 'text', text: o.presented ?? 'تُمنح هذه الشهادة بكل فخر إلى', x: CX, y, w: 820, fontSize: 18, fontFamily: 'Cairo', fill: ink, dir: 'rtl' },
    { kind: 'field', key: 'name', x: CX, y: y + 66, w: 880, fontSize: 60, fontFamily: o.nameFont ?? 'Amiri', fontWeight: '700', fill: o.nameColor ?? '#c9a227', dir: 'rtl' },
    { kind: 'line', x: CX, y: y + 116, w: 520, stroke: o.accent ?? '#c9a227', strokeWidth: 1.5 },
    { kind: 'text', text: o.text ?? 'تقديرًا لما أبداه من تميّز والتزام وتفانٍ في الأداء.', x: CX, y: y + 174, w: 820, fontSize: 17, fontFamily: 'Cairo', fill: ink, dir: 'rtl', lineHeight: 1.8 },
  ];
}
function sigAr(list: { name: string; role: string }[], ink = '#1f2937', y = 664): TemplateItem[] {
  const xs = list.length === 1 ? [CX] : [CX - 235, CX + 235];
  const out: TemplateItem[] = [];
  list.forEach((s, i) => {
    const x = xs[i];
    out.push(
      { kind: 'field', key: 'signature' + (i + 1), x, y: y - 44, w: 200 },
      { kind: 'line', x, y, w: 215, stroke: ink, strokeWidth: 1.2 },
      { kind: 'text', text: s.name, x, y: y + 18, w: 270, fontSize: 16, fontFamily: 'Cairo', fontWeight: '700', fill: ink, dir: 'rtl' },
      { kind: 'text', text: s.role, x, y: y + 40, w: 270, fontSize: 12.5, fontFamily: 'Cairo', fill: '#64748b', dir: 'rtl' },
    );
  });
  return out;
}

// square / portrait references
const SQ = 1080, SCX = 540;

export const AR_TEMPLATES: CertTemplate[] = [
  // ===================== CERTIFICATES (Arabic) =====================
  {
    ...cbase, id: 'ar-cert-taqdir', grp: 'تقدير', name: 'شهادة تقدير', accent: '#c9a227', bg: '#fbf8f1',
    tags: 'arabic certificate تقدير شهادة ذهبي فاخر rtl',
    items: [
      ...corner2('tl', '#0f172a'), ...corner2('br', '#0f172a'),
      ...border('#c9a227', 2.5, 26),
      seal(190, 250, 118),
      ...titleAr('تقدير', '#1f2937'),
      ...bodyAr({ nameColor: '#b8902f', accent: '#c9a227', text: 'تقديرًا لإسهاماته المميّزة ودعمه المتواصل\nوتفانيه الدائم في العمل.', presented: 'تُمنح هذه الشهادة بكل فخر إلى' }),
      ...sigAr([{ name: 'محمد أحمد', role: 'المدير العام' }]),
    ],
  },
  {
    ...cbase, id: 'ar-cert-injaz', grp: 'إنجاز', name: 'شهادة إنجاز', accent: '#16264d', bg: '#fbf8f1',
    tags: 'arabic certificate إنجاز شهادة كحلي ذهبي rtl',
    items: [
      ...corner2('tr', '#16264d'), ...corner2('bl', '#16264d'),
      ...border('#c9a227', 2.2, 28),
      seal(CX, 110, 86, '#c9a227', '#16264d'),
      ...titleAr('إنجاز', '#16264d', 214),
      ...bodyAr({ y: 318, nameColor: '#b8902f', accent: '#16264d', text: 'تقديرًا لما حقّقه من إنجاز متميّز والتزام\nراسخ بالتميّز والتطوّر المستمر.', presented: 'تشهد الإدارة بأن' }),
      ...sigAr([{ name: 'سارة خالد', role: 'الرئيس التنفيذي' }], '#16264d'),
    ],
  },
  {
    ...cbase, id: 'ar-cert-musharaka', grp: 'مشاركة', name: 'شهادة مشاركة', accent: '#0e7c86', bg: '#ffffff',
    tags: 'arabic certificate مشاركة شهادة تركواز حديث rtl',
    items: [
      wedge('tl', 360, 300, '#0e7c86'), wedge('tl', 250, 200, undefined, gold()),
      wedge('br', 360, 300, '#0e7c86'), wedge('br', 250, 200, undefined, gold()),
      ...border('#0e7c86', 1.6, 30),
      seal(CX, 110, 84, '#c9a227', '#0e7c86'),
      ...titleAr('مشاركة', '#0e7c86', 214),
      ...bodyAr({ y: 318, nameColor: '#0e7c86', accent: '#0e7c86', text: 'نظير مشاركته الفاعلة وإسهامه القيّم\nطوال فترة البرنامج.', presented: 'تشهد الإدارة بأن', ink: '#475569' }),
      ...sigAr([{ name: 'عبدالله العتيبي', role: 'مدير البرنامج' }], '#155e63'),
    ],
  },
  {
    ...cbase, id: 'ar-cert-tamayuz', grp: 'تميّز', name: 'شهادة تميّز', accent: '#d8b24a', bg: '#0c2e22',
    tags: 'arabic certificate تميز شهادة أخضر ذهبي فاخر rtl',
    items: [
      ...border('#c9a227', 2.5, 28, true, 9),
      ...corner2('tr', '#0a3a2b'), ...corner2('bl', '#0a3a2b'),
      seal(190, 250, 118, '#d8b24a', '#0a3a2b'),
      ...titleAr('تميّز', '#e7d28a'),
      ...bodyAr({ nameColor: '#e7d28a', accent: '#d8b24a', ink: '#a9c4b6', text: 'لتحقيقه نتائج متميّزة وتجاوزه\nالتوقّعات باستمرار.', presented: 'تُمنح هذه الشهادة تقديرًا لـ' }),
      ...sigAr([{ name: 'فاطمة الزهراء', role: 'مدير الموارد البشرية' }], '#ece6d6'),
    ],
  },
  {
    ...cbase, id: 'ar-cert-itmam', grp: 'إتمام', name: 'شهادة إتمام', accent: '#1d3a8a', bg: '#ffffff',
    tags: 'arabic certificate إتمام شهادة أزرق كلاسيكي rtl',
    items: [
      ...border('#1d3a8a', 1.4, 26, true, 7),
      seal(CX, 108, 84, '#1d3a8a', '#c9a227'),
      ...titleAr('إتمام', '#1d3a8a', 210),
      ...bodyAr({ y: 314, nameColor: '#1d3a8a', accent: '#1d3a8a', text: 'لإتمامه بنجاح جميع متطلبات\nالبرنامج التدريبي بتفوّق.', presented: 'تشهد الإدارة بأن', ink: '#475569' }),
      ...sigAr([{ name: 'خالد منصور', role: 'مدير التدريب' }], '#1d3a8a'),
    ],
  },

  // ===================== SOCIAL MEDIA (Arabic) =====================
  {
    cat: 'social', lang: 'ar', id: 'ar-soc-quote', name: 'منشور اقتباس', accent: '#f59e0b', bg: '#0f172a', w: SQ, h: SQ,
    tags: 'arabic social instagram اقتباس منشور rtl quote post',
    items: [
      { kind: 'text', text: '”', x: SCX, y: 250, w: 400, fontSize: 220, fontFamily: 'Playfair Display', fill: '#1e293b' },
      { kind: 'text', text: 'النجاحُ ليس نهايةَ المطاف،\nوالفشلُ ليس قاتلًا،\nالشجاعةُ على الاستمرار هي ما يهمّ.', x: SCX, y: 520, w: 900, fontSize: 46, fontFamily: 'Cairo', fontWeight: '700', fill: '#f8fafc', dir: 'rtl', lineHeight: 1.6 },
      { kind: 'line', x: SCX, y: 768, w: 90, stroke: '#f59e0b', strokeWidth: 3 },
      { kind: 'text', text: 'ونستون تشرشل', x: SCX, y: 812, w: 600, fontSize: 26, fontFamily: 'Cairo', fill: '#f59e0b', dir: 'rtl' },
    ],
  },
  {
    cat: 'social', lang: 'ar', id: 'ar-soc-promo', name: 'عرض ترويجي', accent: '#4f46e5', bg: '#4f46e5', w: SQ, h: SQ,
    tags: 'arabic social instagram عرض خصم تخفيض ترويج rtl promo sale',
    items: [
      { kind: 'rect', x: SCX, y: SCX, w: SQ, h: SQ, fill: '', stops: [{ offset: 0, color: '#4f46e5' }, { offset: 1, color: '#7c3aed' }], gradDir: 'diag' },
      { kind: 'text', text: 'عرض خاص لفترة محدودة', x: SCX, y: 250, w: 760, fontSize: 32, fontFamily: 'Cairo', fontWeight: '700', fill: '#c7d2fe', dir: 'rtl' },
      { kind: 'text', text: 'خصم ٥٠٪', x: SCX, y: 470, w: 940, fontSize: 170, fontFamily: 'Cairo', fontWeight: '700', fill: '#ffffff', dir: 'rtl' },
      { kind: 'text', text: 'على جميع المنتجات', x: SCX, y: 640, w: 800, fontSize: 36, fontFamily: 'Cairo', fill: '#e0e7ff', dir: 'rtl' },
      { kind: 'rect', x: SCX, y: 800, w: 380, h: 90, rx: 45, fill: '#f59e0b' },
      { kind: 'text', text: 'تسوّق الآن', x: SCX, y: 800, w: 380, fontSize: 34, fontFamily: 'Cairo', fontWeight: '700', fill: '#1f2937', dir: 'rtl' },
    ],
  },

  // ===================== BUSINESS (Arabic) =====================
  {
    cat: 'business', lang: 'ar', id: 'ar-biz-card', name: 'بطاقة عمل', accent: '#0f172a', bg: '#ffffff', w: 1050, h: 600,
    tags: 'arabic business card بطاقة عمل rtl',
    items: [
      { kind: 'rect', x: 165, y: 300, w: 330, h: 600, fill: '', stops: [{ offset: 0, color: '#0f172a' }, { offset: 1, color: '#1e293b' }], gradDir: 'v' },
      { kind: 'circle', x: 165, y: 300, w: 120, fill: '', stroke: '#f59e0b', strokeWidth: 2 },
      { kind: 'text', text: 'ش', x: 165, y: 300, w: 120, fontSize: 58, fontFamily: 'Amiri', fontWeight: '700', fill: '#f59e0b', dir: 'rtl' },
      { kind: 'field', key: 'name', x: 700, y: 220, w: 560, fontSize: 44, fontFamily: 'Amiri', fontWeight: '700', fill: '#0f172a', align: 'right', dir: 'rtl' },
      { kind: 'text', text: 'المدير التنفيذي', x: 700, y: 282, w: 560, fontSize: 22, fontFamily: 'Cairo', fill: '#b8902f', align: 'right', dir: 'rtl' },
      { kind: 'line', x: 700, y: 330, w: 560, stroke: '#e2e8f0', strokeWidth: 1.5 },
      { kind: 'text', text: '٠٥٠ ١٢٣ ٤٥٦٧', x: 700, y: 380, w: 560, fontSize: 18, fontFamily: 'Cairo', fill: '#334155', align: 'right', dir: 'rtl' },
      { kind: 'text', text: 'info@company.com', x: 700, y: 416, w: 560, fontSize: 18, fontFamily: 'Cairo', fill: '#334155', align: 'right', dir: 'rtl' },
      { kind: 'text', text: 'الرياض، المملكة العربية السعودية', x: 700, y: 452, w: 560, fontSize: 18, fontFamily: 'Cairo', fill: '#334155', align: 'right', dir: 'rtl' },
    ],
  },

  // ===================== CARDS (Arabic) =====================
  {
    cat: 'cards', lang: 'ar', id: 'ar-card-invite', name: 'دعوة لحضور', accent: '#9a7b3f', bg: '#faf6ec', w: 794, h: 1123,
    tags: 'arabic invitation دعوة مناسبة حفل rtl',
    items: [
      { kind: 'rect', x: 397, y: 561, w: 794 - 70, h: 1123 - 70, fill: '', stroke: '#c2a25a', strokeWidth: 2 },
      { kind: 'rect', x: 397, y: 561, w: 794 - 96, h: 1123 - 96, fill: '', stroke: '#c2a25a', strokeWidth: 0.8 },
      { kind: 'text', text: '✦', x: 397, y: 150, w: 200, fontSize: 44, fill: '#c2a25a' },
      { kind: 'text', text: 'دعوة', x: 397, y: 250, w: 600, fontSize: 76, fontFamily: 'Amiri', fontWeight: '700', fill: '#7a5e1c', dir: 'rtl' },
      { kind: 'text', text: 'يسرّنا دعوتكم لحضور', x: 397, y: 360, w: 600, fontSize: 22, fontFamily: 'Cairo', fill: '#5b6b52', dir: 'rtl' },
      { kind: 'field', key: 'event', x: 397, y: 430, w: 640, fontSize: 40, fontFamily: 'Amiri', fontWeight: '700', fill: '#3c4a36', dir: 'rtl' },
      { kind: 'text', text: 'بمشيئة الله وكريم لطفه، يشرّفنا حضوركم\nومشاركتنا فرحتنا في هذه المناسبة الكريمة.', x: 397, y: 540, w: 600, fontSize: 17, fontFamily: 'Cairo', fill: '#5b6b52', dir: 'rtl', lineHeight: 1.8 },
      { kind: 'line', x: 397, y: 690, w: 360, stroke: '#c2a25a', strokeWidth: 1 },
      { kind: 'field', key: 'date', x: 397, y: 740, w: 420, fontSize: 22, fontFamily: 'Cairo', fontWeight: '700', fill: '#7a5e1c', dir: 'rtl' },
      { kind: 'field', key: 'venue', x: 397, y: 790, w: 560, fontSize: 18, fontFamily: 'Cairo', fill: '#5b6b52', dir: 'rtl' },
    ],
  },

  // ===================== DOCUMENT (Arabic) =====================
  {
    cat: 'document', lang: 'ar', id: 'ar-doc-letter', name: 'ورقة رسمية', accent: '#1d4ed8', bg: '#ffffff', w: 794, h: 1123,
    tags: 'arabic document letterhead ورقة رسمية خطاب rtl',
    items: [
      { kind: 'rect', x: 397, y: 70, w: 794, h: 132, fill: '', stops: [{ offset: 0, color: '#1d4ed8' }, { offset: 1, color: '#2563eb' }], gradDir: 'h' },
      { kind: 'field', key: 'company', x: 397, y: 52, w: 638, fontSize: 30, fontFamily: 'Amiri', fontWeight: '700', fill: '#ffffff', align: 'right', dir: 'rtl' },
      { kind: 'text', text: 'الشعار التجاري لمؤسستك', x: 397, y: 92, w: 638, fontSize: 14, fontFamily: 'Cairo', fill: '#dbeafe', align: 'right', dir: 'rtl' },
      { kind: 'field', key: 'date', x: 397, y: 250, w: 638, fontSize: 14, fontFamily: 'Cairo', fill: '#64748b', align: 'right', dir: 'rtl' },
      { kind: 'text', text: 'السيد / {{name}} المحترم،', x: 397, y: 304, w: 638, fontSize: 17, fontFamily: 'Cairo', fontWeight: '700', fill: '#1f2937', align: 'right', dir: 'rtl' },
      { kind: 'text', text: 'السلام عليكم ورحمة الله وبركاته، وبعد:\nيسعدنا أن نتواصل معكم عبر هذه الورقة الرسمية. يمكنكم استبدال هذا\nالنص بمحتوى رسالتكم؛ حيث ينساب النص تلقائيًا ويبقى واضحًا ومرتّبًا.', x: 397, y: 392, w: 638, fontSize: 14.5, fontFamily: 'Cairo', fill: '#334155', align: 'right', dir: 'rtl', lineHeight: 1.9 },
      { kind: 'text', text: 'وتفضّلوا بقبول فائق الاحترام والتقدير،', x: 397, y: 560, w: 638, fontSize: 14.5, fontFamily: 'Cairo', fill: '#334155', align: 'right', dir: 'rtl' },
      { kind: 'field', key: 'signature1', x: 616, y: 628, w: 200 },
      { kind: 'text', text: '{{senderName}}', x: 397, y: 690, w: 638, fontSize: 15, fontFamily: 'Cairo', fontWeight: '700', fill: '#1f2937', align: 'right', dir: 'rtl' },
      { kind: 'text', text: '{{senderTitle}}', x: 397, y: 714, w: 638, fontSize: 12.5, fontFamily: 'Cairo', fill: '#64748b', align: 'right', dir: 'rtl' },
      { kind: 'rect', x: 397, y: 1123 - 46, w: 794, h: 60, fill: '#1d4ed8' },
      { kind: 'text', text: 'البريد   ·   الهاتف   ·   الموقع الإلكتروني', x: 397, y: 1123 - 50, w: 640, fontSize: 12, fontFamily: 'Cairo', fill: '#dbeafe', dir: 'rtl' },
    ],
  },
];

/**
 * Bilingual copy for the Canvas / designer Application Tour.
 *
 * Content only — no selectors or behaviour. The designer maps each `id` to a
 * real element selector + an optional panel-opening hook in `startTour()`, so
 * this file stays purely about wording and can be translated freely.
 */
export interface TourCopy {
  id: string;
  icon: string;
  title: string;
  body: string;
}

export interface TourUiStrings {
  start: string;
  next: string;
  back: string;
  skip: string;
  finish: string;
  step: string;
  of: string;
  done: string;
  /** First-run invitation card. */
  autoTitle: string;
  autoBody: string;
  autoYes: string;
  autoNo: string;
}

export const CANVAS_TOUR_UI: { en: TourUiStrings; ar: TourUiStrings } = {
  en: {
    start: 'Take a tour',
    next: 'Next',
    back: 'Back',
    skip: 'Skip',
    finish: 'Finish',
    step: 'Step',
    of: 'of',
    done: 'Tour complete',
    autoTitle: 'New here? Take a quick tour',
    autoBody: 'A 60-second guided walkthrough of the designer — from template to finished certificate. You can skip or restart anytime.',
    autoYes: 'Start tour',
    autoNo: 'Maybe later',
  },
  ar: {
    start: 'جولة تعريفية',
    next: 'التالي',
    back: 'السابق',
    skip: 'تخطّي',
    finish: 'إنهاء',
    step: 'خطوة',
    of: 'من',
    done: 'اكتملت الجولة',
    autoTitle: 'هل أنت جديد هنا؟ خُذ جولة سريعة',
    autoBody: 'جولة إرشادية في 60 ثانية داخل المصمّم — من القالب حتى الشهادة الجاهزة. يمكنك التخطّي أو إعادة البدء في أي وقت.',
    autoYes: 'ابدأ الجولة',
    autoNo: 'ربما لاحقًا',
  },
};

export const CANVAS_TOUR: { en: TourCopy[]; ar: TourCopy[] } = {
  en: [
    {
      id: 'welcome',
      icon: 'auto_awesome',
      title: 'Welcome to the designer',
      body: 'This is where your certificate comes to life. In a few short steps we’ll go from a blank canvas to a personalized, ready-to-issue certificate.',
    },
    {
      id: 'rail',
      icon: 'dashboard_customize',
      title: 'Your toolbox',
      body: 'Everything you add lives on this rail — templates, text, elements, images, backgrounds, variables, QR codes and more. Click an icon to open its panel.',
    },
    {
      id: 'templates',
      icon: 'grid_view',
      title: 'Start from a template',
      body: 'Pick a ready-made design and you’re halfway there. Every template is fully editable — swap colors, text and logos to match your brand.',
    },
    {
      id: 'text',
      icon: 'title',
      title: 'Add & style text',
      body: 'Drop in headings and body text, then control font, size, color, spacing and alignment. This is where the certificate’s wording takes shape.',
    },
    {
      id: 'variables',
      icon: 'data_object',
      title: 'Personalize with variables',
      body: 'Insert tokens like {{name}} or {{course}}. Each recipient’s real details are filled in automatically when you issue — one design, hundreds of certificates.',
    },
    {
      id: 'canvas',
      icon: 'crop_free',
      title: 'Your canvas',
      body: 'Everything you place appears here. Drag to move, use the handles to resize, and arrange your layout exactly how you want it.',
    },
    {
      id: 'size',
      icon: 'aspect_ratio',
      title: 'Set size & format',
      body: 'Choose a page size and orientation — A4, letter, landscape or a custom size — so your certificate prints and exports perfectly.',
    },
    {
      id: 'preview',
      icon: 'visibility',
      title: 'Preview before you send',
      body: 'See exactly how a finished certificate looks with real sample data — including the signature — so there are no surprises.',
    },
    {
      id: 'save',
      icon: 'save',
      title: 'Save, issue & go bulk',
      body: 'Save your design, then issue a single certificate or generate hundreds at once from a recipient list. You’re in full control of delivery.',
    },
    {
      id: 'finish',
      icon: 'celebration',
      title: 'You’re all set! 🎉',
      body: 'That’s the whole flow: template → text → variables → preview → issue. Start creating — and you can replay this tour anytime from “Take a tour”.',
    },
  ],
  ar: [
    {
      id: 'welcome',
      icon: 'auto_awesome',
      title: 'مرحبًا بك في المصمّم',
      body: 'هنا تنبض شهادتك بالحياة. في خطوات قصيرة سننتقل من لوحة فارغة إلى شهادة مخصّصة وجاهزة للإصدار.',
    },
    {
      id: 'rail',
      icon: 'dashboard_customize',
      title: 'صندوق أدواتك',
      body: 'كل ما تضيفه يبدأ من هذا الشريط — القوالب والنصوص والعناصر والصور والخلفيات والمتغيّرات ورموز QR وغيرها. انقر أي أيقونة لفتح لوحتها.',
    },
    {
      id: 'templates',
      icon: 'grid_view',
      title: 'ابدأ من قالب',
      body: 'اختر تصميمًا جاهزًا لتقطع نصف الطريق. كل قالب قابل للتعديل بالكامل — غيّر الألوان والنصوص والشعارات لتلائم هويتك.',
    },
    {
      id: 'text',
      icon: 'title',
      title: 'أضف النص ونسّقه',
      body: 'أضِف العناوين والنصوص، ثم تحكّم في الخط والحجم واللون والتباعد والمحاذاة. هنا تتشكّل صياغة الشهادة.',
    },
    {
      id: 'variables',
      icon: 'data_object',
      title: 'خصّص باستخدام المتغيّرات',
      body: 'أدرِج رموزًا مثل {{name}} أو {{course}}. تُملأ بيانات كل مُستلِم تلقائيًا عند الإصدار — تصميم واحد ومئات الشهادات.',
    },
    {
      id: 'canvas',
      icon: 'crop_free',
      title: 'لوحة التصميم',
      body: 'كل ما تضعه يظهر هنا. اسحب للتحريك، واستخدم المقابض لتغيير الحجم، ورتّب التخطيط كما تريد تمامًا.',
    },
    {
      id: 'size',
      icon: 'aspect_ratio',
      title: 'اضبط المقاس والتنسيق',
      body: 'اختر مقاس الصفحة والاتجاه — A4 أو Letter أو أفقي أو مقاس مخصّص — لتُطبع شهادتك وتُصدّر بشكل مثالي.',
    },
    {
      id: 'preview',
      icon: 'visibility',
      title: 'عاين قبل الإرسال',
      body: 'شاهد شكل الشهادة النهائي ببيانات تجريبية حقيقية — بما في ذلك التوقيع — حتى لا تكون هناك مفاجآت.',
    },
    {
      id: 'save',
      icon: 'save',
      title: 'احفظ وأصدر وأنشئ بالجملة',
      body: 'احفظ تصميمك، ثم أصدر شهادة واحدة أو أنشئ المئات دفعة واحدة من قائمة المستلمين. التحكّم الكامل في التسليم بين يديك.',
    },
    {
      id: 'finish',
      icon: 'celebration',
      title: 'كل شيء جاهز! 🎉',
      body: 'هذا هو المسار كاملًا: قالب ← نص ← متغيّرات ← معاينة ← إصدار. ابدأ الإنشاء — ويمكنك إعادة الجولة في أي وقت من «جولة تعريفية».',
    },
  ],
};

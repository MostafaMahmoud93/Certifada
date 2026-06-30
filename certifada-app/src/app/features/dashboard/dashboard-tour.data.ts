/**
 * Bilingual, ROLE-AWARE copy for the Dashboard Application Tour.
 *
 * The dashboard composes a different step sequence per role (admin / approver /
 * creator / issuer / viewer) and uses these strings for the content. The welcome
 * and finish steps are themselves role-specific so the tour explains *where to
 * start* based on what the signed-in user can actually do.
 */
export type DashRole = 'admin' | 'approver' | 'creator' | 'issuer' | 'viewer';

export interface DashCopy { icon: string; title: string; body: string; }

export interface DashTour {
  welcomeTitle: string;
  welcomeByRole: Record<DashRole, string>;
  finishTitle: string;
  finishByRole: Record<DashRole, string>;
  steps: Record<string, DashCopy>;
}

export interface DashTourUi {
  start: string;
  autoTitle: string;
  autoBody: string;
  autoYes: string;
  autoNo: string;
}

export const DASH_TOUR_UI: { en: DashTourUi; ar: DashTourUi } = {
  en: {
    start: 'Take a tour',
    autoTitle: 'New here? Take a quick tour',
    autoBody: 'A short, personalized walkthrough of your dashboard — tailored to your role, so you know exactly where to start. Skip or restart anytime.',
    autoYes: 'Start tour',
    autoNo: 'Maybe later',
  },
  ar: {
    start: 'جولة تعريفية',
    autoTitle: 'هل أنت جديد هنا؟ خُذ جولة سريعة',
    autoBody: 'جولة قصيرة ومخصّصة في لوحة التحكم — مُهيّأة حسب دورك لتعرف من أين تبدأ بالضبط. يمكنك التخطّي أو إعادة البدء في أي وقت.',
    autoYes: 'ابدأ الجولة',
    autoNo: 'ربما لاحقًا',
  },
};

export const DASH_TOUR: { en: DashTour; ar: DashTour } = {
  en: {
    welcomeTitle: 'Welcome to your dashboard',
    welcomeByRole: {
      admin: 'You’re an administrator. Let’s set up your workspace — your team, roles, branding and settings — and show you where everything lives.',
      approver: 'You’re an approver. Here’s the fast path to reviewing and approving credentials before they go out.',
      creator: 'You’re a creator. Here’s the quickest route from a blank canvas to a sent certificate.',
      issuer: 'Here’s how to send certificates to your recipients in just a few clicks.',
      viewer: 'Here’s a quick look at where to find your stats, activity and issued credentials.',
    },
    finishTitle: 'You’re all set! 🎉',
    finishByRole: {
      admin: 'Best first move: set up your team and branding, then create your first template. Replay this tour anytime from “Take a tour”.',
      approver: 'Best first move: open Approvals and clear your queue. Replay this tour anytime from “Take a tour”.',
      creator: 'Best first move: create a template — everything else follows. Replay this tour anytime from “Take a tour”.',
      issuer: 'Best first move: open Templates and hit Issue to send your first certificate. Replay anytime from “Take a tour”.',
      viewer: 'Explore your KPIs and issued credentials whenever you like. Replay this tour anytime from “Take a tour”.',
    },
    steps: {
      create: { icon: 'add_circle', title: 'Start here — create a design', body: 'This is your launchpad. Open the editor to design a certificate from scratch or from a ready-made template.' },
      issue: { icon: 'send', title: 'Issue to recipients', body: 'Pick a template and send certificates — one by one with a live preview, or in bulk from a spreadsheet.' },
      approvals: { icon: 'fact_check', title: 'Review approvals', body: 'Credentials that need a signature wait here. Approve or reject them before they’re delivered.' },
      branding: { icon: 'palette', title: 'Make it yours', body: 'Set your logo, colors and fonts once — every template can adopt your brand instantly.' },
      team: { icon: 'group', title: 'Manage your team', body: 'Invite teammates and see who’s who. This is where your people live.' },
      roles: { icon: 'admin_panel_settings', title: 'Control access with roles', body: 'Decide what each role can do — issuing, approving, branding, settings and more.' },
      settings: { icon: 'settings', title: 'Workspace settings', body: 'Configure delivery, security and workspace preferences here.' },
      analytics: { icon: 'insights', title: 'Track performance', body: 'Issuance and verification trends, so you can see how your credentials are doing.' },
      credentials: { icon: 'workspace_premium', title: 'All your credentials', body: 'Every issued certificate is tracked here — status, downloads, resend and revoke.' },
      kpis: { icon: 'leaderboard', title: 'Your key numbers', body: 'A live snapshot — certificates issued, total views, delivery success and pending approvals.' },
      quotas: { icon: 'data_usage', title: 'Plan, quotas & storage', body: 'Track your plan’s limits — issuance quota and storage used — so you always know when it’s time to upgrade.' },
    },
  },
  ar: {
    welcomeTitle: 'مرحبًا بك في لوحة التحكم',
    welcomeByRole: {
      admin: 'أنت مسؤول. لنهيّئ مساحة عملك — فريقك والأدوار والهوية والإعدادات — ونوضّح لك مكان كل شيء.',
      approver: 'أنت معتمِد. إليك أسرع طريق لمراجعة الشهادات والموافقة عليها قبل إرسالها.',
      creator: 'أنت منشئ. إليك أسرع مسار من لوحة فارغة إلى شهادة مُرسَلة.',
      issuer: 'إليك كيفية إرسال الشهادات إلى مستلميك بنقرات قليلة.',
      viewer: 'إليك نظرة سريعة على مكان إحصاءاتك ونشاطك وشهاداتك الصادرة.',
    },
    finishTitle: 'كل شيء جاهز! 🎉',
    finishByRole: {
      admin: 'أفضل بداية: هيّئ فريقك وهويتك، ثم أنشئ أول قالب. أعِد الجولة في أي وقت من «جولة تعريفية».',
      approver: 'أفضل بداية: افتح «الموافقات» وأنجز قائمتك. أعِد الجولة في أي وقت من «جولة تعريفية».',
      creator: 'أفضل بداية: أنشئ قالبًا — وكل شيء يتبع ذلك. أعِد الجولة في أي وقت من «جولة تعريفية».',
      issuer: 'أفضل بداية: افتح «القوالب» واضغط «إصدار» لإرسال أول شهادة. أعِد الجولة في أي وقت.',
      viewer: 'استكشف مؤشّراتك وشهاداتك الصادرة وقتما تشاء. أعِد الجولة في أي وقت من «جولة تعريفية».',
    },
    steps: {
      create: { icon: 'add_circle', title: 'ابدأ من هنا — أنشئ تصميمًا', body: 'هذه نقطة انطلاقك. افتح المحرّر لتصميم شهادة من الصفر أو من قالب جاهز.' },
      issue: { icon: 'send', title: 'أصدر للمستلمين', body: 'اختر قالبًا وأرسل الشهادات — فرديًا مع معاينة مباشرة، أو بالجملة من جدول بيانات.' },
      approvals: { icon: 'fact_check', title: 'راجع الموافقات', body: 'الشهادات التي تحتاج توقيعًا تنتظر هنا. وافق عليها أو ارفضها قبل تسليمها.' },
      branding: { icon: 'palette', title: 'اجعلها على هويتك', body: 'اضبط شعارك وألوانك وخطوطك مرة واحدة — وكل قالب يتبنّى هويتك فورًا.' },
      team: { icon: 'group', title: 'أدر فريقك', body: 'ادعُ زملاءك وتعرّف على الجميع. هنا يعيش أعضاء فريقك.' },
      roles: { icon: 'admin_panel_settings', title: 'تحكّم في الوصول عبر الأدوار', body: 'حدّد ما يمكن لكل دور فعله — الإصدار والموافقة والهوية والإعدادات وغيرها.' },
      settings: { icon: 'settings', title: 'إعدادات مساحة العمل', body: 'اضبط التسليم والأمان وتفضيلات مساحة العمل هنا.' },
      analytics: { icon: 'insights', title: 'تتبّع الأداء', body: 'اتجاهات الإصدار والتحقّق لترى كيف تؤدّي شهاداتك.' },
      credentials: { icon: 'workspace_premium', title: 'كل شهاداتك', body: 'تُتتبَّع كل شهادة صادرة هنا — الحالة والتنزيل وإعادة الإرسال والإلغاء.' },
      kpis: { icon: 'leaderboard', title: 'أرقامك الرئيسية', body: 'لقطة حيّة — الشهادات الصادرة وإجمالي المشاهدات ونجاح التسليم والموافقات المعلّقة.' },
      quotas: { icon: 'data_usage', title: 'الباقة والحصص والتخزين', body: 'تابِع حدود باقتك — حصة الإصدار والتخزين المُستخدَم — لتعرف دائمًا متى يحين وقت الترقية.' },
    },
  },
};

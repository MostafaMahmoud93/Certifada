/**
 * Bilingual copy for the Issue page Application Tour.
 *
 * Content only — the component maps each `id` to a real element selector + an
 * optional before-hook (switch tab, reveal preview) in `startIssueTour()`.
 * Generic control labels (Next / Back / Skip / Finish / Step / of) are reused
 * from the shared tour overlay, so only step content + the entry/offer copy
 * live here.
 */
export interface IssueTourCopy {
  id: string;
  icon: string;
  title: string;
  body: string;
}

export interface IssueTourUi {
  start: string;
  autoTitle: string;
  autoBody: string;
  autoYes: string;
  autoNo: string;
}

export const ISSUE_TOUR_UI: { en: IssueTourUi; ar: IssueTourUi } = {
  en: {
    start: 'Take a tour',
    autoTitle: 'First time issuing? Take a quick tour',
    autoBody: 'A 60-second walkthrough of issuing certificates — one by one or in bulk, with live preview and delivery tracking. Skip or restart anytime.',
    autoYes: 'Start tour',
    autoNo: 'Maybe later',
  },
  ar: {
    start: 'جولة تعريفية',
    autoTitle: 'أول مرة تُصدر شهادات؟ خُذ جولة سريعة',
    autoBody: 'جولة في 60 ثانية حول إصدار الشهادات — فرديًا أو بالجملة، مع معاينة مباشرة وتتبّع التسليم. يمكنك التخطّي أو إعادة البدء في أي وقت.',
    autoYes: 'ابدأ الجولة',
    autoNo: 'ربما لاحقًا',
  },
};

export const ISSUE_TOUR: { en: IssueTourCopy[]; ar: IssueTourCopy[] } = {
  en: [
    {
      id: 'welcome',
      icon: 'workspace_premium',
      title: 'Issue your certificates',
      body: 'This is where your design becomes real, personalized credentials sent to recipients. Let’s walk through how — it only takes a moment.',
    },
    {
      id: 'quota',
      icon: 'bolt',
      title: 'Your template & quota',
      body: 'You’re issuing from this template. The meter shows how many credentials you’ve issued this period against your plan’s limit.',
    },
    {
      id: 'stats',
      icon: 'insights',
      title: 'Delivery at a glance',
      body: 'Live totals: how many you’ve issued, how many were successfully delivered, what’s still in progress, and anything that failed.',
    },
    {
      id: 'tabs',
      icon: 'swap_horiz',
      title: 'Two ways to issue',
      body: 'Issue one recipient at a time with a live preview, or switch to Bulk to generate many at once from a spreadsheet.',
    },
    {
      id: 'form',
      icon: 'badge',
      title: 'Fill in the recipient',
      body: 'Enter the recipient’s email and each template field. The little counter tracks your progress so nothing is missed before sending.',
    },
    {
      id: 'preview',
      icon: 'visibility',
      title: 'Preview before you send',
      body: 'Your values are merged into the real design and rendered here — so you see exactly what the recipient will get.',
    },
    {
      id: 'issue',
      icon: 'send',
      title: 'Issue & send',
      body: 'When everything’s ready, send it in one click. If the design needs a signature, it’s routed for approval first — handled automatically.',
    },
    {
      id: 'bulk',
      icon: 'groups',
      title: 'Issue in bulk',
      body: 'Got a whole class? Download the tailored sheet, fill one row per recipient, drop it back, and we’ll validate and issue them all at once.',
    },
    {
      id: 'history',
      icon: 'history',
      title: 'Track every credential',
      body: 'Everything you issue lands here — delivery status, downloads, resend and revoke — so you’re always in control after sending.',
    },
    {
      id: 'finish',
      icon: 'celebration',
      title: 'You’re ready to issue! 🎉',
      body: 'That’s the whole flow: pick a mode, fill in recipients, preview, send, and track. Replay this tour anytime from “Take a tour”.',
    },
  ],
  ar: [
    {
      id: 'welcome',
      icon: 'workspace_premium',
      title: 'أصدر شهاداتك',
      body: 'هنا يتحوّل تصميمك إلى شهادات حقيقية ومخصّصة تُرسَل إلى المستلمين. لنستعرض الطريقة — لن تستغرق سوى لحظات.',
    },
    {
      id: 'quota',
      icon: 'bolt',
      title: 'قالبك وحصّتك',
      body: 'أنت تُصدر من هذا القالب. يوضّح المؤشّر عدد الشهادات التي أصدرتها هذه الفترة مقابل حدّ باقتك.',
    },
    {
      id: 'stats',
      icon: 'insights',
      title: 'التسليم في لمحة',
      body: 'إجماليات مباشرة: كم أصدرت، وكم سُلّم بنجاح، وما زال قيد التنفيذ، وأي شيء فشل.',
    },
    {
      id: 'tabs',
      icon: 'swap_horiz',
      title: 'طريقتان للإصدار',
      body: 'أصدر لمستلم واحد في كل مرة مع معاينة مباشرة، أو انتقل إلى «بالجملة» لإنشاء العديد دفعة واحدة من جدول بيانات.',
    },
    {
      id: 'form',
      icon: 'badge',
      title: 'املأ بيانات المستلم',
      body: 'أدخل بريد المستلم وكل حقل في القالب. يتتبّع العدّاد الصغير تقدّمك حتى لا يفوتك شيء قبل الإرسال.',
    },
    {
      id: 'preview',
      icon: 'visibility',
      title: 'عاين قبل الإرسال',
      body: 'تُدمج قيمك في التصميم الحقيقي وتُعرَض هنا — فترى تمامًا ما سيستلمه الشخص.',
    },
    {
      id: 'issue',
      icon: 'send',
      title: 'أصدر وأرسل',
      body: 'عندما يصبح كل شيء جاهزًا، أرسلها بنقرة واحدة. وإذا احتاج التصميم إلى توقيع، فيُوجَّه للموافقة أولًا — تلقائيًا.',
    },
    {
      id: 'bulk',
      icon: 'groups',
      title: 'الإصدار بالجملة',
      body: 'لديك دفعة كاملة؟ نزّل الجدول المُخصّص، واملأ صفًا لكل مستلم، ثم أعِد رفعه، وسنتحقّق منها ونصدرها جميعًا دفعة واحدة.',
    },
    {
      id: 'history',
      icon: 'history',
      title: 'تتبّع كل شهادة',
      body: 'كل ما تُصدره يظهر هنا — حالة التسليم والتنزيل وإعادة الإرسال والإلغاء — لتبقى متحكّمًا دائمًا بعد الإرسال.',
    },
    {
      id: 'finish',
      icon: 'celebration',
      title: 'أنت جاهز للإصدار! 🎉',
      body: 'هذا هو المسار كاملًا: اختر الوضع، واملأ بيانات المستلمين، وعاين، وأرسل، وتتبّع. أعِد الجولة في أي وقت من «جولة تعريفية».',
    },
  ],
};

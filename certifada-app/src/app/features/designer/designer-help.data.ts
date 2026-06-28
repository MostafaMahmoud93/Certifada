/**
 * Content for the "How it works" help popups shown from each designer rail tab.
 * Data-driven so a single modal in the template renders any tab's guide.
 *   steps : [title, description][]
 *   feats : [material-icon, name, how-to][]
 *   hero  : key selecting the small animated illustration (see styles.scss .tg-hero / .hz-*)
 */
export interface HelpEntry {
  icon: string;
  title: string;
  sub: string;
  hero: string;
  steps: [string, string][];
  feats: [string, string, string][];
  details?: { icon: string; title: string; body: string[] }[];
  gallery?: { viz: string; label: string; note: string }[];
}

export const DESIGNER_HELP: Record<string, HelpEntry> = {
  start: {
    icon: 'auto_awesome', title: 'Create a certificate', sub: "It's easy — the whole flow in a few simple steps.", hero: 'start',
    steps: [
      ['Start from a template', 'Open Templates, pick one, and it loads ready to edit — or start blank and set the size.'],
      ['Edit the text', 'Double-click any text to type; change the font, size and colour.'],
      ['Add variables', 'Insert {{name}}, {{date}}… they auto-fill for each recipient at issue time.'],
      ['Polish it (optional)', 'Add a background, border frame, QR code, logo or signature.'],
      ['Save & issue', 'Save the template, then Issue to send a personalised certificate to everyone.'],
    ],
    feats: [
      ['dashboard_customize', 'Ready templates', 'Dozens of designs — one click to start.'],
      ['edit', 'Easy editing', 'Drag, type and restyle anything on the canvas.'],
      ['data_object', 'Variables', '{{fields}} personalise every certificate automatically.'],
      ['send', 'Issue in bulk', 'Send to one person or a whole spreadsheet at once.'],
    ],
    gallery: [
      { viz: 'gTpl', label: 'Pick a template', note: 'Start in one click' },
      { viz: 'presets', label: 'Edit the text', note: 'Type & restyle' },
      { viz: 'variables', label: 'Add variables', note: 'Auto-fill per person' },
    ],
  },
  design: {
    icon: 'aspect_ratio', title: 'Canvas & size', sub: 'Set the size, orientation and type of your certificate.', hero: 'size',
    steps: [
      ['Pick a preset', 'Choose a ready size — A4, Letter, badge, or a social format.'],
      ['Or go custom', 'Type an exact width × height in pixels for any format.'],
      ['Orientation', 'Flip between landscape and portrait with one tap.'],
      ['Apply', 'The canvas resizes instantly; your design stays in place.'],
    ],
    feats: [
      ['aspect_ratio', 'Size presets', 'Common certificate, paper and social sizes, ready to go.'],
      ['straighten', 'Custom dimensions', 'Enter any width and height in pixels.'],
      ['sync', 'Orientation', 'Switch landscape ↔ portrait in one click.'],
      ['high_quality', 'Print-ready', 'Sizes export at high resolution for crisp printing.'],
    ],
  },
  templates: {
    icon: 'dashboard_customize', title: 'Templates', sub: 'Start from a ready-made design and make it yours.', hero: 'templates',
    steps: [
      ['Browse', 'Scroll the gallery or filter by category.'],
      ['Search', 'Type to find a layout by name.'],
      ['Apply', 'Click a template to load it onto the canvas.'],
      ['Customize', 'Edit text, colours and images freely afterwards.'],
    ],
    feats: [
      ['category', 'Categories', 'Certificates, awards, badges and more.'],
      ['search', 'Search', 'Find a template by keyword.'],
      ['bolt', 'One-click apply', 'Loads instantly and stays fully editable.'],
    ],
  },
  text: {
    icon: 'title', title: 'Text', sub: 'Add and style headings, body copy and fields.', hero: 'text',
    steps: [
      ['Add text', 'Click a heading, subheading or body preset to drop it on the canvas.'],
      ['Type', 'Double-click the text to edit the words.'],
      ['Font & size', 'Pick a font family, size and weight.'],
      ['Style', 'Bold, italic, underline, colour and alignment.'],
      ['Spacing', 'Fine-tune letter spacing and line height.'],
      ['Add variables', 'Insert {{fields}} that fill per recipient at issue time.'],
    ],
    feats: [
      ['title', 'Text presets', 'Heading, subheading and body — pre-sized.'],
      ['font_download', 'Fonts', 'Choose from bundled, Arabic-capable fonts.'],
      ['format_bold', 'Weight & style', 'Bold, italic and underline.'],
      ['format_color_text', 'Colour', 'Set any fill colour for the text.'],
      ['format_align_center', 'Alignment', 'Left, center, right or justify.'],
      ['format_line_spacing', 'Spacing', 'Letter spacing and line height.'],
      ['data_object', 'Variables', 'Insert {{fields}} filled per recipient.'],
    ],
    gallery: [
      { viz: 'presets', label: 'Text presets', note: 'Heading, subheading, body' },
      { viz: 'font', label: 'Fonts', note: 'Pick any family' },
      { viz: 'weight', label: 'Bold · Italic · Underline', note: 'Emphasis & style' },
      { viz: 'color', label: 'Colour', note: 'Any fill colour' },
      { viz: 'align', label: 'Alignment', note: 'Left · center · right' },
      { viz: 'spacing', label: 'Spacing', note: 'Letter & line spacing' },
      { viz: 'variables', label: 'Variables', note: '{{fields}} fill per recipient' },
    ],
  },
  elements: {
    icon: 'category', title: 'Elements', sub: 'Add shapes, lines, icons and frames.', hero: 'elements',
    steps: [
      ['Pick a shape', 'Rectangle, circle, line, triangle, star and more.'],
      ['Place it', 'Click to add, then drag to position.'],
      ['Resize', 'Drag the handles; hold to keep proportions.'],
      ['Style', 'Set fill, stroke colour and width, corner radius and opacity.'],
    ],
    feats: [
      ['category', 'Shapes', 'Rectangles, circles, lines and polygons.'],
      ['star', 'Decorations', 'Stars, badges and frames.'],
      ['palette', 'Fill & stroke', 'Set colours and border width.'],
      ['gradient', 'Gradients', 'Apply multi-stop gradient fills.'],
    ],
  },
  images: {
    icon: 'image', title: 'Images', sub: 'Upload, place and fine-tune images.', hero: 'images',
    steps: [
      ['Upload', 'Drop a file or pick one from your assets.'],
      ['Place & size', 'Drag to position; drag a corner to scale.'],
      ['Adjust', 'Brightness, contrast, saturation and blur with live sliders.'],
      ['Tint & crop', 'Recolour to your brand, then crop and rotate.'],
    ],
    feats: [
      ['upload', 'Upload', 'Add PNG, JPG or SVG from your device.'],
      ['tune', 'Filters', 'Brightness, contrast, saturation, blur.'],
      ['colorize', 'Tint', 'Recolour an image to match your brand.'],
      ['crop', 'Crop & rotate', 'Trim and straighten the image.'],
    ],
  },
  background: {
    icon: 'wallpaper', title: 'Background', sub: 'Set a solid, gradient, pattern or image background.', hero: 'background',
    steps: [
      ['Solid', 'Pick a single fill colour.'],
      ['Gradient', 'Build a 2–3 stop gradient; set the angle or make it radial.'],
      ['Pattern / image', 'Use a tiled pattern or a background image.'],
      ['Add a border frame', 'Open the Border frames tab, pick a style, then tune its colour, thickness, inset and opacity.'],
      ['Save', 'Keep favourite backgrounds in your library to reuse.'],
    ],
    feats: [
      ['format_color_fill', 'Solid', 'Any colour fill.'],
      ['gradient', 'Gradient', '2–3 stops, linear or radial, with angle control.'],
      ['texture', 'Patterns', 'Tiled patterns with adjustable size.'],
      ['bookmark', 'Library', 'Save and reuse backgrounds.'],
    ],
    gallery: [
      { viz: 'bgSolid', label: 'Solid', note: 'One flat colour' },
      { viz: 'bgGrad', label: 'Gradient', note: 'Linear, set the angle' },
      { viz: 'bgRadial', label: 'Radial', note: 'Glow from a point' },
      { viz: 'bgPattern', label: 'Pattern', note: 'Tiled, sized to taste' },
      { viz: 'bgImage', label: 'Image', note: 'Use a photo or artwork' },
      { viz: 'bgLib', label: 'Saved library', note: 'Reuse your favourites' },
      { viz: 'frLine', label: 'Line frame', note: 'Clean inset border' },
      { viz: 'frCorner', label: 'Corner frame', note: 'Corner accents' },
      { viz: 'frDeco', label: 'Decorative frame', note: 'Double / ornate' },
    ],
    details: [
      { icon: 'filter_frames', title: 'Border frames — decorative edges', body: [
        'Open the Border frames tab at the top of the Background panel.',
        'Filter by category — Lines, Corners or Decorative — then tap a style to apply it.',
        'Set the Frame colour, then fine-tune with the Thickness, Inset and Opacity sliders.',
        'Toggle "Place behind content" to tuck the frame under your text and logos.',
        'Frames scale with the page so they stay crisp; use Remove frame to clear it.',
      ] },
    ],
  },
  variables: {
    icon: 'data_object', title: 'Variables', sub: 'Insert {{fields}} that fill in per recipient.', hero: 'variables',
    steps: [
      ['Add a variable', 'Click a field (Name, Date, Course…) or type a custom key.'],
      ['It drops a token', '{{name}} appears as editable text on the canvas.'],
      ['Style it', 'Treat it like any text — font, size, colour, alignment.'],
      ['Load sample data', 'Paste a CSV dataset to preview real values.'],
      ['Step through records', 'Page row-by-row to check each recipient.'],
      ['Fill at issue', 'In Issue / Bulk every {{field}} is replaced per recipient.'],
    ],
    feats: [
      ['data_object', 'Variable library', 'Common fields ready to insert.'],
      ['add_box', 'Custom keys', 'Type any {{key}} you need.'],
      ['table_view', 'Sample dataset', 'Paste CSV to preview real values live.'],
      ['skip_next', 'Record stepper', 'Flip through rows to verify each one.'],
      ['draw', 'Signature', '{{signature}} auto-fills from your saved signature.'],
    ],
    details: [
      { icon: 'table_view', title: 'Sample dataset — preview real values', body: [
        'Paste a CSV or pick a saved dataset — the first row is read as the column headers.',
        'Headers match your variables by name: a "name" column fills {{name}}, "date" fills {{date}}, and so on.',
        'Use the record stepper (the ‹ › arrows) to move through rows — the canvas re-renders for each recipient.',
        'It is a preview only: nothing is sent. The real values are merged when you Issue or Bulk-send.',
      ] },
      { icon: 'draw', title: 'Signature — handled automatically', body: [
        'Insert {{signature}} where the signer mark should appear — you never type into it.',
        'It auto-fills from your saved signature (set it in Settings → Profile → Your signature).',
        'With an approval workflow on, it shows a "Pending approval" stamp until an approver signs.',
        'The signature image is trimmed and fitted to its box, so it never renders as a tiny mark.',
      ] },
    ],
  },
  qr: {
    icon: 'qr_code_2', title: 'QR code', sub: 'Add a scannable QR that verifies the credential.', hero: 'qr',
    steps: [
      ['Add the QR', 'It encodes the verification link by default.'],
      ['Set the data', 'Use the verify URL, or a custom link, text or {{variable}}.'],
      ['Colours', 'Set the foreground, background and module colour.'],
      ['Eyes & shape', 'Customize the three corner eyes and the module style.'],
      ['Frame & caption', 'Add a frame and a “Scan to verify” caption.'],
      ['Margin & export', 'Tune the quiet-zone margin and size; download if needed.'],
    ],
    feats: [
      ['link', 'Data source', 'Verify URL, a custom link, or a {{variable}}.'],
      ['palette', 'Colours', 'Foreground, background and module colour.'],
      ['center_focus_strong', 'Custom eyes', 'Restyle the three corner finders.'],
      ['crop_free', 'Frame & caption', 'Add a border and a scan prompt.'],
      ['space_bar', 'Quiet zone', 'Tune the margin for reliable scanning.'],
      ['download', 'Export', 'Download the QR as an image.'],
    ],
  },
  drawing: {
    icon: 'gesture', title: 'Drawing', sub: 'Free-draw with brushes, then edit your strokes.', hero: 'drawing',
    steps: [
      ['Pick a brush', 'Pen, marker, spray or pattern brush.'],
      ['Set colour & size', 'Choose a stroke colour and thickness.'],
      ['Draw', 'Drag on the canvas to draw freely.'],
      ['Edit', 'Select to move, recolour or delete a stroke.'],
    ],
    feats: [
      ['brush', 'Brushes', 'Pen, marker, spray and pattern.'],
      ['line_weight', 'Size', 'Adjust the stroke width.'],
      ['palette', 'Colour', 'Any stroke colour.'],
      ['gesture', 'Smoothing', 'Natural, smooth strokes.'],
    ],
  },
  addons: {
    icon: 'workspace_premium', title: 'Add-ons', sub: 'Seals, signatures, watermarks and a security fingerprint.', hero: 'addons',
    steps: [
      ['Pick an add-on', 'A stamp/seal, signature line, or watermark.'],
      ['Place it', 'Drag to position and resize.'],
      ['Signature', 'Drop a {{signature}} that fills from your saved signature.'],
      ['Watermark', 'Add a tiled or diagonal watermark for protection.'],
      ['Fingerprint', 'A content-hash fingerprint marks the design as authentic.'],
    ],
    feats: [
      ['verified', 'Stamps & seals', 'Official-looking badges.'],
      ['draw', 'Signature', 'Auto-fills from your saved signature.'],
      ['branding_watermark', 'Watermark', 'Tiled or diagonal protection.'],
      ['fingerprint', 'Fingerprint', 'Content-hash integrity mark.'],
    ],
  },
  assets: {
    icon: 'photo_library', title: 'My assets', sub: 'Your saved images, logos and uploads.', hero: 'assets',
    steps: [
      ['Upload', 'Drop files to add them to your library.'],
      ['Organize', 'They group into folders; search by name.'],
      ['Reuse', 'Click an asset to place it on the canvas.'],
      ['Manage', 'Rename or remove assets you no longer need.'],
    ],
    feats: [
      ['upload', 'Upload', 'Add images once, reuse them everywhere.'],
      ['folder', 'Folders', 'Auto-grouped for tidy browsing.'],
      ['search', 'Search', 'Find an asset by name.'],
      ['add_photo_alternate', 'Place', 'Click to drop onto the canvas.'],
    ],
  },
};


/** Arabic mirror of DESIGNER_HELP — same icons / hero / viz keys, translated text. */
export const DESIGNER_HELP_AR: Record<string, HelpEntry> = {
  start: {
    icon: 'auto_awesome', title: 'أنشئ شهادة', sub: 'الأمر سهل — كل الخطوات في دقائق معدودة.', hero: 'start',
    steps: [
      ['ابدأ من قالب', 'افتح القوالب واختر واحدًا فيُحمَّل جاهزًا للتعديل — أو ابدأ بلوحة فارغة واضبط المقاس.'],
      ['حرّر النص', 'انقر نقرًا مزدوجًا على أي نص لكتابته؛ غيّر الخط والحجم واللون.'],
      ['أضِف متغيّرات', 'أدرِج {{name}} و{{date}}… تُملأ تلقائيًا لكل مستلِم عند الإصدار.'],
      ['نمّقها (اختياري)', 'أضِف خلفية أو إطار حدود أو رمز QR أو شعارًا أو توقيعًا.'],
      ['احفظ وأصدِر', 'احفظ القالب ثم أصدِر لإرسال شهادة مخصّصة للجميع.'],
    ],
    feats: [
      ['dashboard_customize', 'قوالب جاهزة', 'عشرات التصاميم — ابدأ بنقرة واحدة.'],
      ['edit', 'تحرير سهل', 'اسحب واكتب وأعِد تنسيق أي شيء على اللوحة.'],
      ['data_object', 'المتغيّرات', '{{fields}} تُخصّص كل شهادة تلقائيًا.'],
      ['send', 'إصدار بالدُّفعات', 'أرسِل لشخص واحد أو لجدول كامل دفعة واحدة.'],
    ],
    gallery: [
      { viz: 'gTpl', label: 'اختر قالبًا', note: 'ابدأ بنقرة' },
      { viz: 'presets', label: 'حرّر النص', note: 'اكتب وأعِد التنسيق' },
      { viz: 'variables', label: 'أضِف متغيّرات', note: 'تُملأ لكل شخص' },
    ],
  },
  design: {
    icon: 'aspect_ratio', title: 'المقاس واللوحة', sub: 'حدّد مقاس الشهادة واتجاهها ونوعها.', hero: 'size',
    steps: [
      ['اختر مقاسًا جاهزًا', 'اختر مقاسًا جاهزًا — A4 أو Letter أو شارة أو مقاسًا لوسائل التواصل.'],
      ['أو مقاس مخصّص', 'اكتب العرض × الارتفاع بالبكسل لأي تنسيق.'],
      ['الاتجاه', 'بدّل بين الأفقي والعمودي بنقرة واحدة.'],
      ['تطبيق', 'يتغيّر مقاس اللوحة فورًا مع بقاء تصميمك في مكانه.'],
    ],
    feats: [
      ['aspect_ratio', 'مقاسات جاهزة', 'مقاسات شائعة للشهادات والورق ووسائل التواصل.'],
      ['straighten', 'أبعاد مخصّصة', 'أدخِل أي عرض وارتفاع بالبكسل.'],
      ['sync', 'الاتجاه', 'تبديل الأفقي ↔ العمودي بنقرة.'],
      ['high_quality', 'جاهز للطباعة', 'مقاسات تُصدَّر بدقة عالية لطباعة واضحة.'],
    ],
  },
  templates: {
    icon: 'dashboard_customize', title: 'القوالب', sub: 'ابدأ من تصميم جاهز واجعله ملكك.', hero: 'templates',
    steps: [
      ['تصفّح', 'مرّر في المعرض أو رشّح حسب الفئة.'],
      ['ابحث', 'اكتب لإيجاد قالب بالاسم.'],
      ['طبّق', 'انقر قالبًا لتحميله على اللوحة.'],
      ['خصّص', 'عدّل النص والألوان والصور بحرية بعد ذلك.'],
    ],
    feats: [
      ['category', 'الفئات', 'شهادات وجوائز وشارات وغيرها.'],
      ['search', 'بحث', 'إيجاد قالب بكلمة مفتاحية.'],
      ['bolt', 'تطبيق بنقرة', 'يُحمّل فورًا ويبقى قابلاً للتعديل بالكامل.'],
    ],
  },
  text: {
    icon: 'title', title: 'النص', sub: 'أضِف العناوين والنصوص والحقول ونسّقها.', hero: 'text',
    steps: [
      ['أضِف نصًا', 'انقر إعدادًا جاهزًا (عنوان رئيسي أو فرعي أو نص) لإسقاطه على اللوحة.'],
      ['اكتب', 'انقر نقرًا مزدوجًا على النص لتحرير الكلمات.'],
      ['الخط والحجم', 'اختر عائلة الخط وحجمه ووزنه.'],
      ['التنسيق', 'عريض ومائل وتسطير ولون ومحاذاة.'],
      ['التباعد', 'اضبط تباعد الأحرف وارتفاع السطر.'],
      ['أضِف متغيّرات', 'أدرِج {{fields}} تُملأ لكل مستلِم عند الإصدار.'],
    ],
    feats: [
      ['title', 'إعدادات نص جاهزة', 'عنوان رئيسي وفرعي ونص — بأحجام مهيّأة.'],
      ['font_download', 'الخطوط', 'اختر من خطوط مضمّنة تدعم العربية.'],
      ['format_bold', 'الوزن والنمط', 'عريض ومائل وتسطير.'],
      ['format_color_text', 'اللون', 'اضبط أي لون لتعبئة النص.'],
      ['format_align_center', 'المحاذاة', 'يسار أو وسط أو يمين أو ضبط.'],
      ['format_line_spacing', 'التباعد', 'تباعد الأحرف وارتفاع السطر.'],
      ['data_object', 'المتغيّرات', 'أدرِج {{fields}} تُملأ لكل مستلِم.'],
    ],
    gallery: [
      { viz: 'presets', label: 'إعدادات جاهزة', note: 'عنوان رئيسي وفرعي ونص' },
      { viz: 'font', label: 'الخطوط', note: 'اختر أي عائلة' },
      { viz: 'weight', label: 'عريض · مائل · تسطير', note: 'التأكيد والنمط' },
      { viz: 'color', label: 'اللون', note: 'أي لون تعبئة' },
      { viz: 'align', label: 'المحاذاة', note: 'يسار · وسط · يمين' },
      { viz: 'spacing', label: 'التباعد', note: 'تباعد الأحرف والأسطر' },
      { viz: 'variables', label: 'المتغيّرات', note: '{{fields}} تُملأ لكل مستلِم' },
    ],
  },
  elements: {
    icon: 'category', title: 'العناصر', sub: 'أضِف أشكالًا وخطوطًا وأيقونات وإطارات.', hero: 'elements',
    steps: [
      ['اختر شكلًا', 'مستطيل أو دائرة أو خط أو مثلث أو نجمة وغيرها.'],
      ['ضعه', 'انقر للإضافة ثم اسحب لتحديد الموضع.'],
      ['غيّر الحجم', 'اسحب المقابض؛ مع الثبات للحفاظ على النسب.'],
      ['نسّق', 'اضبط التعبئة ولون الحد وعرضه ونصف قطر الزوايا والشفافية.'],
    ],
    feats: [
      ['category', 'الأشكال', 'مستطيلات ودوائر وخطوط ومضلّعات.'],
      ['star', 'الزخارف', 'نجوم وشارات وإطارات.'],
      ['palette', 'التعبئة والحد', 'اضبط الألوان وعرض الحد.'],
      ['gradient', 'التدرّجات', 'طبّق تعبئات تدرّج متعدّدة المحطّات.'],
    ],
  },
  images: {
    icon: 'image', title: 'الصور', sub: 'ارفع الصور وضعها واضبطها.', hero: 'images',
    steps: [
      ['ارفع', 'أفلِت ملفًا أو اختر من أصولك.'],
      ['ضع وحجّم', 'اسحب لتحديد الموضع، واسحب الزاوية لتغيير الحجم.'],
      ['اضبط', 'السطوع والتباين والتشبّع والضبابية بمنزلقات حيّة.'],
      ['تلوين وقص', 'أعِد التلوين لعلامتك ثم قُص ودوّر.'],
    ],
    feats: [
      ['upload', 'رفع', 'أضِف PNG أو JPG أو SVG من جهازك.'],
      ['tune', 'المرشّحات', 'سطوع وتباين وتشبّع وضبابية.'],
      ['colorize', 'تلوين', 'أعِد تلوين الصورة لتطابق علامتك.'],
      ['crop', 'قص ودوران', 'قُص الصورة وقوّمها.'],
    ],
  },
  background: {
    icon: 'wallpaper', title: 'الخلفية', sub: 'اضبط خلفية صلبة أو متدرّجة أو نقشًا أو صورة.', hero: 'background',
    steps: [
      ['لون صلب', 'اختر لون تعبئة واحدًا.'],
      ['تدرّج', 'أنشئ تدرّجًا من 2–3 محطّات؛ اضبط الزاوية أو اجعله دائريًا.'],
      ['نقش / صورة', 'استخدم نقشًا مكرّرًا أو صورة خلفية.'],
      ['أضِف إطار حدود', 'افتح تبويب إطارات الحدود، اختر نمطًا، ثم اضبط لونه وسماكته وإزاحته وشفافيته.'],
      ['احفظ', 'احتفظ بخلفياتك المفضّلة في مكتبتك لإعادة استخدامها.'],
    ],
    feats: [
      ['format_color_fill', 'صلب', 'أي لون تعبئة.'],
      ['gradient', 'تدرّج', '2–3 محطّات، خطي أو دائري، مع التحكّم بالزاوية.'],
      ['texture', 'نقوش', 'نقوش مكرّرة بحجم قابل للضبط.'],
      ['bookmark', 'المكتبة', 'احفظ الخلفيات وأعِد استخدامها.'],
    ],
    gallery: [
      { viz: 'bgSolid', label: 'صلب', note: 'لون واحد ثابت' },
      { viz: 'bgGrad', label: 'تدرّج', note: 'خطي، اضبط الزاوية' },
      { viz: 'bgRadial', label: 'دائري', note: 'توهّج من نقطة' },
      { viz: 'bgPattern', label: 'نقش', note: 'مكرّر، بحجم يناسبك' },
      { viz: 'bgImage', label: 'صورة', note: 'استخدم صورة أو عملًا فنيًا' },
      { viz: 'bgLib', label: 'المكتبة المحفوظة', note: 'أعِد استخدام مفضّلاتك' },
      { viz: 'frLine', label: 'إطار خطّي', note: 'حد داخلي أنيق' },
      { viz: 'frCorner', label: 'إطار زوايا', note: 'لمسات في الزوايا' },
      { viz: 'frDeco', label: 'إطار زخرفي', note: 'مزدوج / مزخرف' },
    ],
    details: [
      { icon: 'filter_frames', title: 'إطارات الحدود — حواف زخرفية', body: [
        'افتح تبويب إطارات الحدود أعلى لوحة الخلفية.',
        'رشّح حسب الفئة — خطوط أو زوايا أو زخرفية — ثم انقر نمطًا لتطبيقه.',
        'اضبط لون الإطار، ثم اضبط السماكة والإزاحة والشفافية بالمنزلقات.',
        'فعّل «وضع خلف المحتوى» لجعل الإطار أسفل النص والشعارات.',
        'الإطارات تتكيّف مع حجم الصفحة فتبقى واضحة؛ استخدم «إزالة الإطار» لمسحها.',
      ] },
    ],
  },
  variables: {
    icon: 'data_object', title: 'المتغيّرات', sub: 'أدرِج {{fields}} تُملأ لكل مستلِم.', hero: 'variables',
    steps: [
      ['أضِف متغيّرًا', 'انقر حقلاً (الاسم، التاريخ، الدورة…) أو اكتب مفتاحًا مخصّصًا.'],
      ['يظهر رمز', 'يظهر {{name}} كنص قابل للتحرير على اللوحة.'],
      ['نسّقه', 'تعامل معه كأي نص — الخط والحجم واللون والمحاذاة.'],
      ['حمّل بيانات تجريبية', 'الصق بيانات CSV لمعاينة القيم الحقيقية.'],
      ['تنقّل بين السجلات', 'انتقل صفًا صفًا للتحقّق من كل مستلِم.'],
      ['الملء عند الإصدار', 'في الإصدار / الدُّفعات يُستبدَل كل {{field}} لكل مستلِم.'],
    ],
    feats: [
      ['data_object', 'مكتبة المتغيّرات', 'حقول شائعة جاهزة للإدراج.'],
      ['add_box', 'مفاتيح مخصّصة', 'اكتب أي {{key}} تحتاجه.'],
      ['table_view', 'بيانات تجريبية', 'الصق CSV لمعاينة القيم الحقيقية مباشرة.'],
      ['skip_next', 'متصفّح السجلات', 'تنقّل بين الصفوف للتحقّق من كل واحد.'],
      ['draw', 'التوقيع', 'يُملأ {{signature}} تلقائيًا من توقيعك المحفوظ.'],
    ],
    details: [
      { icon: 'table_view', title: 'البيانات التجريبية — معاينة القيم الحقيقية', body: [
        'الصق ملف CSV أو اختر مجموعة بيانات محفوظة — يُقرأ الصف الأول كعناوين للأعمدة.',
        'تُطابَق العناوين بأسماء متغيّراتك: عمود «name» يملأ {{name}}، و«date» يملأ {{date}}، وهكذا.',
        'استخدم متصفّح السجلات (سهمَا ‹ ›) للتنقّل بين الصفوف — تُعاد معاينة اللوحة لكل مستلِم.',
        'هذه معاينة فقط: لا يُرسَل شيء. تُدمَج القيم الحقيقية عند الإصدار أو الإرسال بالدُّفعات.',
      ] },
      { icon: 'draw', title: 'التوقيع — يُعالَج تلقائيًا', body: [
        'أدرِج {{signature}} حيث يجب أن يظهر التوقيع — لا تكتب فيه أبدًا.',
        'يُملأ تلقائيًا من توقيعك المحفوظ (اضبطه في الإعدادات ← الملف الشخصي ← توقيعك).',
        'مع تفعيل سير عمل الموافقة، يظهر ختم «بانتظار الموافقة» حتى يوقّع المعتمِد.',
        'تُقتطع صورة التوقيع وتُلائَم لإطارها، فلا تظهر كعلامة صغيرة أبدًا.',
      ] },
    ],
  },
  qr: {
    icon: 'qr_code_2', title: 'رمز QR', sub: 'أضِف رمز QR قابلًا للمسح يتحقّق من الشهادة.', hero: 'qr',
    steps: [
      ['أضِف الرمز', 'يرمّز رابط التحقّق افتراضيًا.'],
      ['حدّد البيانات', 'استخدم رابط التحقّق، أو رابطًا/نصًا مخصّصًا أو {{variable}}.'],
      ['الألوان', 'اضبط لون المقدّمة والخلفية والوحدات.'],
      ['العيون والشكل', 'خصّص العيون الثلاث في الزوايا ونمط الوحدات.'],
      ['الإطار والتسمية', 'أضِف إطارًا وتسمية «امسح للتحقّق».'],
      ['الهامش والتصدير', 'اضبط هامش المنطقة الهادئة والحجم؛ نزّله عند الحاجة.'],
    ],
    feats: [
      ['link', 'مصدر البيانات', 'رابط التحقّق، رابط مخصّص، أو {{variable}}.'],
      ['palette', 'الألوان', 'لون المقدّمة والخلفية والوحدات.'],
      ['center_focus_strong', 'عيون مخصّصة', 'أعِد تنسيق محدّدات الزوايا الثلاث.'],
      ['crop_free', 'الإطار والتسمية', 'أضِف حدًّا وتلميح مسح.'],
      ['space_bar', 'المنطقة الهادئة', 'اضبط الهامش لمسح موثوق.'],
      ['download', 'تصدير', 'نزّل رمز QR كصورة.'],
    ],
  },
  drawing: {
    icon: 'gesture', title: 'الرسم', sub: 'ارسم بحرية بالفُرَش ثم حرّر خطوطك.', hero: 'drawing',
    steps: [
      ['اختر فرشاة', 'قلم أو ماركر أو رذاذ أو فرشاة نقش.'],
      ['اضبط اللون والحجم', 'اختر لون الخط وسماكته.'],
      ['ارسم', 'اسحب على اللوحة للرسم بحرية.'],
      ['حرّر', 'حدّد للتحريك أو إعادة التلوين أو الحذف.'],
    ],
    feats: [
      ['brush', 'الفُرَش', 'قلم وماركر ورذاذ ونقش.'],
      ['line_weight', 'الحجم', 'اضبط عرض الخط.'],
      ['palette', 'اللون', 'أي لون للخط.'],
      ['gesture', 'التنعيم', 'خطوط طبيعية وناعمة.'],
    ],
  },
  addons: {
    icon: 'workspace_premium', title: 'الإضافات', sub: 'أختام وتواقيع وعلامات مائية وبصمة أمان.', hero: 'addons',
    steps: [
      ['اختر إضافة', 'ختمًا أو خط توقيع أو علامة مائية.'],
      ['ضعها', 'اسحب لتحديد الموضع وغيّر الحجم.'],
      ['التوقيع', 'أسقِط {{signature}} يُملأ من توقيعك المحفوظ.'],
      ['العلامة المائية', 'أضِف علامة مائية مكرّرة أو قطرية للحماية.'],
      ['البصمة', 'بصمة تجزئة المحتوى تُوثّق التصميم كأصلي.'],
    ],
    feats: [
      ['verified', 'أختام', 'شارات بمظهر رسمي.'],
      ['draw', 'التوقيع', 'يُملأ تلقائيًا من توقيعك المحفوظ.'],
      ['branding_watermark', 'علامة مائية', 'حماية مكرّرة أو قطرية.'],
      ['fingerprint', 'البصمة', 'علامة سلامة بتجزئة المحتوى.'],
    ],
  },
  assets: {
    icon: 'photo_library', title: 'أصولي', sub: 'صورك وشعاراتك وملفاتك المرفوعة.', hero: 'assets',
    steps: [
      ['ارفع', 'أفلِت الملفات لإضافتها إلى مكتبتك.'],
      ['نظّم', 'تُجمَّع في مجلّدات؛ ابحث بالاسم.'],
      ['أعِد الاستخدام', 'انقر أصلاً لوضعه على اللوحة.'],
      ['أدِر', 'أعِد التسمية أو احذف ما لم تعد بحاجته.'],
    ],
    feats: [
      ['upload', 'رفع', 'أضِف الصور مرة وأعِد استخدامها في كل مكان.'],
      ['folder', 'المجلّدات', 'مجمّعة تلقائيًا لتصفّح مرتّب.'],
      ['search', 'بحث', 'إيجاد أصل بالاسم.'],
      ['add_photo_alternate', 'وضع', 'انقر لإسقاطه على اللوحة.'],
    ],
  },
};

/** Static labels for the help modal (per language). */
export const HELP_UI = {
  en: { how: 'How it works', steps: 'Step by step', feats: 'Every feature', detail: 'In detail', gallery: 'See it in action', close: 'Close', guide: 'Quick guide', tour: 'Guided tour', tourTpl: 'Open Templates', tourText: 'Add text', tourVar: 'Add variable', tourSign: 'Add signature', tourPrev: 'Preview', ctlPrev: 'Previous', ctlNext: 'Next', ctlPlay: 'Play', ctlPause: 'Pause', cap_start: 'template → text → variables → issue',
    cap_size: 'resize & orient', cap_text: 'type · font · style', cap_images: 'filters · tint · crop', cap_background: 'solid · gradient · pattern', cap_qr: 'verify · colours · eyes', cap_drawing: 'brush · colour · size', cap_addons: 'seal · signature · watermark' },
  ar: { how: 'كيف تعمل', steps: 'خطوة بخطوة', feats: 'كل ميزة', detail: 'بالتفصيل', gallery: 'شاهدها أثناء العمل', close: 'إغلاق', guide: 'دليل سريع', tour: 'جولة إرشادية', tourTpl: 'افتح القوالب', tourText: 'أضِف نصًا', tourVar: 'أضِف متغيّرًا', tourSign: 'أضِف توقيعًا', tourPrev: 'معاينة', ctlPrev: 'السابق', ctlNext: 'التالي', ctlPlay: 'تشغيل', ctlPause: 'إيقاف', cap_start: 'قالب ← نص ← متغيّرات ← إصدار',
    cap_size: 'تغيير المقاس والاتجاه', cap_text: 'كتابة · خط · تنسيق', cap_images: 'مرشّحات · تلوين · قص', cap_background: 'صلب · تدرّج · نقش', cap_qr: 'تحقّق · ألوان · عيون', cap_drawing: 'فرشاة · لون · حجم', cap_addons: 'ختم · توقيع · علامة مائية' },
};


/** The (bespoke) Table popup text, per language. */
export interface TableHelp { title: string; sub: string; secSteps: string; secFeats: string; capDyn: string; capPer: string; capAuto: string; steps: [string, string][]; feats: [string, string, string][]; }
export const TABLE_HELP: { en: TableHelp; ar: TableHelp } = {
  en: {
    title: 'How tables work', sub: 'Make transcripts, score sheets & rosters — build it, style it, fill it.',
    secSteps: 'Build a table — step by step', secFeats: 'Every feature — how to use it',
    capDyn: '1 dynamic row', capPer: 'one row per item', capAuto: 'auto-grows',
    steps: [
      ['Pick a size', 'In Insert (hover to size), glide over the grid and click — or type exact Rows and Columns.'],
      ['Name the columns', 'Type titles in Column headers, comma-separated — e.g. Name, Role, Score.'],
      ['Choose what cells hold', 'Variables drop {{placeholders}} that fill per recipient; Empty gives blank cells you type into.'],
      ['Style it', 'Click a Style preset, or open More options for colours, borders, font size and alignment. Preview updates live.'],
      ['Insert it', 'Hit + Insert table. It lands as one group — drag to move, drag a corner to resize.'],
      ['Edit the content', 'Double-click a cell on the canvas, or use the cell grid. Add / remove rows and columns from Edit selected table.'],
      ['Make it dynamic (optional)', 'Turn on Dynamic rows and map each column to a data field. In Bulk, every list item becomes its own row:'],
    ],
    feats: [
      ['grid_on', 'Insert · hover to size', 'Hover the dotted grid; highlighted cells show the size. Click to lock it in.'],
      ['pin', 'Rows / Columns', 'Prefer numbers? Set exact counts here instead of the grid.'],
      ['title', 'Column headers', 'Comma-separated titles for the top row. Leave blank for no header.'],
      ['data_object', 'Cells: Variables vs Empty', 'Variables auto-fill per recipient in Bulk / Issue; Empty are fixed text you type.'],
      ['style', 'Style presets', 'One click applies a matched header fill, zebra and border look.'],
      ['tune', 'More options', 'Toggle header row / column and zebra; set every colour, border width, font size and alignment.'],
      ['visibility', 'Preview', 'A live mini-table that mirrors your style before you insert.'],
      ['bolt', 'Quick tables', 'Pre-built layouts — click one to drop it straight onto the canvas.'],
      ['content_paste', 'Paste data', 'Copy a range from Excel / CSV, paste it, and it becomes a ready table.'],
      ['edit', 'Edit selected table', 'With a table selected: add / remove rows and columns, edit the cell grid, fill rows from a list, or apply the current style.'],
      ['touch_app', 'Edit on canvas', 'Double-click a cell to edit in place. The whole table moves and scales as one object.'],
      ['dynamic_feed', 'Dynamic rows + field mapping', 'Auto-grows from your Bulk list — one row per item. Map each column to the data field whose values should fill it.'],
    ],
  },
  ar: {
    title: 'كيف تعمل الجداول', sub: 'أنشئ كشوف درجات وقوائم ومجموعات — ابنِه، نسّقه، واملأه.',
    secSteps: 'أنشئ جدولاً — خطوة بخطوة', secFeats: 'كل ميزة — كيف تستخدمها',
    capDyn: 'صف ديناميكي واحد', capPer: 'صف لكل عنصر', capAuto: 'يتوسّع تلقائيًا',
    steps: [
      ['اختر مقاسًا', 'في الإدراج (مرّر لتحديد الحجم)، مرّر فوق الشبكة وانقر — أو اكتب عدد الصفوف والأعمدة بدقة.'],
      ['سمِّ الأعمدة', 'اكتب العناوين في حقل عناوين الأعمدة مفصولة بفواصل — مثل: الاسم، الدور، الدرجة.'],
      ['اختر محتوى الخلايا', 'المتغيّرات تُدرِج {{placeholders}} تُملأ لكل مستلِم؛ والفارغة خلايا تكتب فيها بنفسك.'],
      ['نسّقه', 'انقر نمطًا جاهزًا، أو افتح المزيد من الخيارات للألوان والحدود وحجم الخط والمحاذاة. تتحدّث المعاينة مباشرة.'],
      ['أدرِجه', 'اضغط «إدراج جدول». يظهر كمجموعة واحدة — اسحب للتحريك، واسحب الزاوية لتغيير الحجم.'],
      ['حرّر المحتوى', 'انقر نقرًا مزدوجًا على خلية، أو استخدم شبكة الخلايا. أضِف/احذف صفوفًا وأعمدة من «تحرير الجدول المحدّد».'],
      ['اجعله ديناميكيًا (اختياري)', 'فعّل الصفوف الديناميكية واربط كل عمود بحقل بيانات. في الدُّفعات يصبح كل عنصر في قائمتك صفًا مستقلًا:'],
    ],
    feats: [
      ['grid_on', 'الإدراج · مرّر لتحديد الحجم', 'مرّر فوق الشبكة المنقّطة؛ تُظهر الخلايا المميّزة الحجم. انقر لتثبيته.'],
      ['pin', 'الصفوف / الأعمدة', 'تفضّل الأرقام؟ اضبط الأعداد بدقة هنا بدلاً من الشبكة.'],
      ['title', 'عناوين الأعمدة', 'عناوين مفصولة بفواصل للصف العلوي. اتركها فارغة لبلا عناوين.'],
      ['data_object', 'الخلايا: متغيّرات أم فارغة', 'المتغيّرات تُملأ لكل مستلِم في الدُّفعات/الإصدار؛ والفارغة نص ثابت تكتبه.'],
      ['style', 'أنماط جاهزة', 'نقرة واحدة تطبّق تعبئة رأس وتظليلًا متناوبًا وحدودًا متناسقة.'],
      ['tune', 'المزيد من الخيارات', 'بدّل صف/عمود الرأس والتظليل المتناوب؛ واضبط كل لون وعرض الحد وحجم الخط والمحاذاة.'],
      ['visibility', 'المعاينة', 'جدول مصغّر حي يعكس تنسيقك قبل الإدراج.'],
      ['bolt', 'جداول سريعة', 'تخطيطات جاهزة — انقر واحدًا لإسقاطه على اللوحة مباشرة.'],
      ['content_paste', 'لصق البيانات', 'انسخ نطاقًا من Excel / CSV والصقه، فيتحوّل إلى جدول جاهز.'],
      ['edit', 'تحرير الجدول المحدّد', 'مع تحديد جدول: أضِف/احذف صفوفًا وأعمدة، حرّر شبكة الخلايا، املأ الصفوف من قائمة، أو طبّق النمط الحالي.'],
      ['touch_app', 'التحرير على اللوحة', 'انقر نقرًا مزدوجًا على خلية لتحريرها في مكانها. يتحرّك الجدول ويتحجّم كعنصر واحد.'],
      ['dynamic_feed', 'الصفوف الديناميكية + ربط الحقول', 'يتوسّع تلقائيًا من قائمة الدُّفعات — صف لكل عنصر. اربط كل عمود بحقل البيانات الذي يملؤه.'],
    ],
  },
};

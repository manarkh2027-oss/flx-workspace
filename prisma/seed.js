const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // On deploy we only seed an empty database, so redeploys never wipe real data.
  if (process.env.SEED_IF_EMPTY === '1') {
    const existing = await prisma.workspace.count();
    if (existing > 0) {
      console.log('Database already seeded — skipping.');
      return;
    }
  }

  // clean (order matters for FKs)
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();
  await prisma.workspace.deleteMany();

  const workspace = await prisma.workspace.create({
    data: { name: 'FLX Creative Production' },
  });

  const brandJson = JSON.stringify({
    colors: [
      { en: 'An-Najah green', ar: 'أخضر النجاح', hex: '#007A3D', rgb: '0 122 61', cmyk: '100 0 50 52' },
      { en: 'Ink', ar: 'حبري', hex: '#16161A', rgb: '22 22 26', cmyk: '15 15 0 90' },
      { en: 'Olive', ar: 'زيتوني', hex: '#7D8B2F', rgb: '125 139 47', cmyk: '10 0 66 45' },
      { en: 'Sky', ar: 'سماوي', hex: '#2E8FE0', rgb: '46 143 224', cmyk: '79 36 0 12' },
    ],
    fonts: [
      { family: 'Cairo', sample: 'أ ب ت ث', ar: true, note_en: 'Arabic · headings & body', note_ar: 'العربية · العناوين والنصوص' },
      { family: 'Inter', sample: 'Aa Bb Cc', ar: false, note_en: 'English · headings & body', note_ar: 'الإنجليزية · العناوين والنصوص' },
    ],
    voiceOk: ['رحلتك', 'مستقبلك', 'belong', 'ambition', 'discover'],
    voiceNo: ['cheap', 'رقم ١', 'best in the world', 'guaranteed'],
  });

  const client = await prisma.client.create({
    data: {
      workspaceId: workspace.id,
      name: 'An-Najah University',
      nameAr: 'جامعة النجاح الوطنية',
      initials: 'ن',
      brandJson,
    },
  });

  const hash = (p) => bcrypt.hashSync(p, 10);

  const lina = await prisma.user.create({
    data: {
      workspaceId: workspace.id,
      clientId: client.id,
      username: 'lina',
      passwordHash: hash('123456'),
      fullName: 'Lina Abed',
      role: 'client',
      email: 'lina@najah.edu',
    },
  });

  const omar = await prisma.user.create({
    data: { workspaceId: workspace.id, username: 'omar', passwordHash: hash('123456'), fullName: 'Omar Hassan', role: 'editor', email: 'omar@flxcreative.ps' },
  });
  const nour = await prisma.user.create({
    data: { workspaceId: workspace.id, username: 'nour', passwordHash: hash('123456'), fullName: 'Nour Fawzy', role: 'designer', email: 'nour@flxcreative.ps' },
  });
  await prisma.user.create({
    data: { workspaceId: workspace.id, username: 'admin', passwordHash: hash('admin123'), fullName: 'FLX Admin', role: 'super_admin', email: 'admin@flxcreative.ps' },
  });
  // Primary owner admin account.
  await prisma.user.upsert({
    where: { username: 'flx' },
    update: {},
    create: { workspaceId: workspace.id, username: 'flx', passwordHash: hash('khalaf123$'), fullName: 'FLX', role: 'super_admin', email: 'admin@flxcreative.ps' },
  });
  await prisma.user.create({
    data: { workspaceId: workspace.id, username: 'sara', passwordHash: hash('123456'), fullName: 'Sara Khalil', role: 'account_manager', email: 'sara@flxcreative.ps' },
  });

  const admissions = await prisma.campaign.create({
    data: { clientId: client.id, name: 'Admissions 2026', nameAr: 'القبول الجامعي 2026', status: 'active' },
  });
  const ramadan = await prisma.campaign.create({
    data: { clientId: client.id, name: 'Ramadan 2026', nameAr: 'رمضان 2026', status: 'active' },
  });
  const welcome = await prisma.campaign.create({
    data: { clientId: client.id, name: 'New academic year', nameAr: 'العام الدراسي الجديد', status: 'active' },
  });

  const posts = [
    { title: 'Welcome video — new students', titleAr: 'فيديو ترحيب بالطلبة الجدد', type: 'video', platform: 'instagram', status: 'review', dayEn: 'Sun', dayAr: 'الأحد', publishAt: new Date('2026-06-14T09:00:00'), campaignId: welcome.id },
    { title: 'Design — university open day', titleAr: 'تصميم: اليوم المفتوح للجامعة', type: 'design', platform: 'instagram', status: 'review', dayEn: 'Mon', dayAr: 'الإثنين', publishAt: new Date('2026-06-15T10:00:00'), campaignId: admissions.id },
    { title: 'Copy — new academic year greeting', titleAr: 'نص: تهنئة بالعام الدراسي الجديد', type: 'copy', platform: 'x', status: 'approved', dayEn: 'Mon', dayAr: 'الإثنين', publishAt: new Date('2026-06-15T12:00:00'), campaignId: welcome.id, body: 'مرحباً بكم في عام دراسي جديد مليء بالطموح في جامعة النجاح الوطنية.' },
    { title: 'Video — tour of the Nablus campus', titleAr: 'فيديو: جولة في حرم نابلس', type: 'video', platform: 'youtube', status: 'revision', dayEn: 'Tue', dayAr: 'الثلاثاء', publishAt: new Date('2026-06-16T18:00:00'), campaignId: welcome.id },
    { title: 'Photo — Medicine faculty highlights', titleAr: 'صورة: إنجازات كلية الطب', type: 'image', platform: 'facebook', status: 'approved', dayEn: 'Wed', dayAr: 'الأربعاء', publishAt: new Date('2026-06-17T11:00:00'), campaignId: admissions.id },
    { title: 'Copy — first semester registration dates', titleAr: 'نص: مواعيد التسجيل للفصل الأول', type: 'copy', platform: 'x', status: 'review', dayEn: 'Wed', dayAr: 'الأربعاء', publishAt: new Date('2026-06-17T13:00:00'), campaignId: admissions.id, body: 'يبدأ التسجيل للفصل الأول يوم الأحد القادم. لا تفوّت الموعد!' },
    { title: 'Design — academic excellence scholarship', titleAr: 'تصميم: منحة التفوق الأكاديمي', type: 'design', platform: 'instagram', status: 'approved', dayEn: 'Thu', dayAr: 'الخميس', publishAt: new Date('2026-06-18T17:00:00'), campaignId: admissions.id },
    { title: "Video — an An-Najah graduate's story", titleAr: 'فيديو: قصة خريج من جامعة النجاح', type: 'video', platform: 'tiktok', status: 'published', dayEn: 'Thu', dayAr: 'الخميس', publishAt: new Date('2026-06-18T20:00:00'), campaignId: welcome.id },
  ];

  const created = [];
  for (const p of posts) {
    created.push(await prisma.post.create({ data: { clientId: client.id, ...p } }));
  }

  // a small conversation on the first video
  const first = created[0];
  await prisma.comment.create({ data: { postId: first.id, authorId: lina.id, body: 'الشعار يبدو صغيراً قليلاً في المقدمة — هل يمكن تكبيره وإبقاؤه لحظة أطول؟' } });
  await prisma.comment.create({ data: { postId: first.id, authorId: omar.id, body: 'تم — كبّرت الشعار في النسخة الجديدة. أخبريني إن كان التوقيت مناسباً الآن.' } });
  await prisma.comment.create({ data: { postId: created[1].id, authorId: nour.id, body: 'أضفت الشعار العربي للزر — مطابق لدليل الهوية.' } });

  await prisma.notification.createMany({
    data: [
      { userId: lina.id, type: 'approval', bucket: 'today', read: false, titleEn: '<b>Welcome video — new students</b> is waiting for your approval.', titleAr: '<b>فيديو ترحيب بالطلبة الجدد</b> بانتظار موافقتك.' },
      { userId: lina.id, type: 'comment', bucket: 'today', read: false, titleEn: '<b>Omar (Editor)</b> uploaded a new version of <b>Nablus campus tour</b>.', titleAr: '<b>عمر (محرر)</b> رفع نسخة جديدة من <b>جولة حرم نابلس</b>.' },
      { userId: lina.id, type: 'mention', bucket: 'today', read: false, titleEn: '<b>Nour (Designer)</b> mentioned you on <b>Open day</b>.', titleAr: '<b>نور (مصممة)</b> أشارت إليكِ في <b>اليوم المفتوح</b>.' },
      { userId: lina.id, type: 'approval', bucket: 'yesterday', read: true, titleEn: '<b>New academic year greeting</b> was approved and published.', titleAr: 'تم اعتماد <b>تهنئة العام الدراسي</b> ونشرها.' },
      { userId: lina.id, type: 'publish', bucket: 'yesterday', read: false, titleEn: "<b>An-Najah graduate's story</b> was published on TikTok.", titleAr: '<b>قصة خريج من جامعة النجاح</b> نُشرت على تيك توك.' },
      { userId: lina.id, type: 'system', bucket: 'earlier', read: true, titleEn: '<b>Sara (Account mgr)</b> created the campaign <b>Admissions 2026</b>.', titleAr: '<b>سارة (مديرة حساب)</b> أنشأت حملة <b>القبول الجامعي 2026</b>.' },
    ],
  });

  // ---------- Second client: Bank of Palestine (proves data isolation) ----------
  const brandJsonB = JSON.stringify({
    colors: [
      { en: 'BoP blue', ar: 'أزرق البنك', hex: '#0A4A9F', rgb: '10 74 159', cmyk: '94 53 0 38' },
      { en: 'Gold', ar: 'ذهبي', hex: '#C9A227', rgb: '201 162 39', cmyk: '0 19 81 21' },
      { en: 'Ink', ar: 'حبري', hex: '#16161A', rgb: '22 22 26', cmyk: '15 15 0 90' },
    ],
    fonts: [
      { family: 'Cairo', sample: 'أ ب ت ث', ar: true, note_en: 'Arabic · headings & body', note_ar: 'العربية · العناوين والنصوص' },
      { family: 'Inter', sample: 'Aa Bb Cc', ar: false, note_en: 'English · headings & body', note_ar: 'الإنجليزية · العناوين والنصوص' },
    ],
    voiceOk: ['ثقة', 'أمان', 'نموّ', 'معك', 'tomorrow'],
    voiceNo: ['مخاطرة', 'رخيص', 'مضمون 100%'],
  });
  const clientB = await prisma.client.create({
    data: { workspaceId: workspace.id, name: 'Bank of Palestine', nameAr: 'بنك فلسطين', initials: 'بف', brandJson: brandJsonB },
  });
  const sami = await prisma.user.create({
    data: { workspaceId: workspace.id, clientId: clientB.id, username: 'sami', passwordHash: hash('123456'), fullName: 'Sami Darwish', role: 'client', email: 'sami@bankofpalestine.ps' },
  });
  const campB = await prisma.campaign.create({
    data: { clientId: clientB.id, name: 'Summer savings 2026', nameAr: 'توفير الصيف 2026', status: 'active' },
  });
  const postsB = [
    { title: 'Video — youth savings account', titleAr: 'فيديو: حساب توفير الشباب', type: 'video', platform: 'instagram', status: 'review', dayEn: 'Sun', dayAr: 'الأحد', publishAt: new Date('2026-06-14T10:00:00') },
    { title: 'Design — summer cashback', titleAr: 'تصميم: استرداد نقدي للصيف', type: 'design', platform: 'facebook', status: 'approved', dayEn: 'Tue', dayAr: 'الثلاثاء', publishAt: new Date('2026-06-16T12:00:00') },
    { title: 'Copy — new mobile app features', titleAr: 'نص: مزايا التطبيق الجديدة', type: 'copy', platform: 'x', status: 'review', dayEn: 'Wed', dayAr: 'الأربعاء', publishAt: new Date('2026-06-17T09:00:00'), body: 'تطبيق بنك فلسطين الآن أسرع وأكثر أماناً. حمّله اليوم.' },
  ];
  for (const p of postsB) await prisma.post.create({ data: { clientId: clientB.id, campaignId: campB.id, ...p } });
  await prisma.notification.create({
    data: { userId: sami.id, type: 'approval', bucket: 'today', read: false, titleEn: '<b>Youth savings account</b> is waiting for your approval.', titleAr: '<b>حساب توفير الشباب</b> بانتظار موافقتك.' },
  });

  // ---------- Third client: Yafa Enterprise (real videos + brand assets) ----------
  const brandJsonY = JSON.stringify({
    colors: [
      { en: 'Coral', ar: 'مرجاني', hex: '#F2706B', rgb: '242 112 107', cmyk: '0 54 56 5' },
      { en: 'Grape', ar: 'بنفسجي', hex: '#8E44D0', rgb: '142 68 208', cmyk: '32 67 0 18' },
      { en: 'Sunny', ar: 'أصفر مشمس', hex: '#FFC23C', rgb: '255 194 60', cmyk: '0 24 76 0' },
      { en: 'Ink', ar: 'حبري', hex: '#1C1C22', rgb: '28 28 34', cmyk: '18 18 0 87' },
    ],
    fonts: [
      { family: 'Cairo', sample: 'أ ب ت ث', ar: true, note_en: 'Arabic · headings & body', note_ar: 'العربية · العناوين والنصوص' },
      { family: 'Inter', sample: 'Aa Bb Cc', ar: false, note_en: 'English · headings & body', note_ar: 'الإنجليزية · العناوين والنصوص' },
    ],
    voiceOk: ['joy', 'fun', 'colorful', 'delicious', 'مرح', 'لذيذ'],
    voiceNo: ['boring', 'رخيص', 'مضمون 100%'],
    gallery: [
      { url: '/clients/yafa/banner.png', en: 'Lifestyle banner', ar: 'صورة الحملة' },
      { url: '/clients/yafa/products.png', en: 'Product range', ar: 'المنتجات' },
      { url: '/clients/yafa/brand-id.jpg', en: 'Brand identity', ar: 'الهوية البصرية' },
    ],
  });
  const clientY = await prisma.client.create({
    data: {
      workspaceId: workspace.id, name: 'Yafa Enterprise', nameAr: 'يافا', initials: 'Y',
      brandJson: brandJsonY, logoUrl: '/clients/yafa/logo.png', bannerUrl: '/clients/yafa/banner.png',
    },
  });
  const yafa = await prisma.user.create({
    data: { workspaceId: workspace.id, clientId: clientY.id, username: 'yafa', passwordHash: hash('yafa123'), fullName: 'Yafa Enterprise', role: 'client', email: 'hello@yafa.ps' },
  });
  const campY = await prisma.campaign.create({
    data: { clientId: clientY.id, name: 'Summer scoops 2026', nameAr: 'صيف يافا 2026', status: 'active' },
  });
  const postsY = [
    { title: 'Yafa reel — summer flavours', titleAr: 'ريل يافا — نكهات الصيف', type: 'video', platform: 'instagram', status: 'review', dayEn: 'Sun', dayAr: 'الأحد', publishAt: new Date('2026-06-14T11:00:00'), mediaUrl: '/clients/yafa/reel.mp4' },
    { title: 'Camera spot — Pure Joy Delivered', titleAr: 'إعلان الكاميرا — متعة خالصة', type: 'video', platform: 'youtube', status: 'review', dayEn: 'Tue', dayAr: 'الثلاثاء', publishAt: new Date('2026-06-16T19:00:00'), mediaUrl: '/clients/yafa/reel.mp4' },
    { title: 'The Monster — hero film', titleAr: '«الوحش» — الفيلم الرئيسي', type: 'video', platform: 'tiktok', status: 'approved', dayEn: 'Thu', dayAr: 'الخميس', publishAt: new Date('2026-06-18T20:00:00'), mediaUrl: '/clients/yafa/reel.mp4' },
  ];
  for (const p of postsY) await prisma.post.create({ data: { clientId: clientY.id, campaignId: campY.id, ...p } });
  await prisma.notification.create({
    data: { userId: yafa.id, type: 'approval', bucket: 'today', read: false, titleEn: '<b>Yafa reel — summer flavours</b> is waiting for your approval.', titleAr: '<b>ريل يافا — نكهات الصيف</b> بانتظار موافقتك.' },
  });

  console.log('Seed complete:');
  console.log('  client A : An-Najah University — login  lina / 123456');
  console.log('  client B : Bank of Palestine   — login  sami / 123456');
  console.log('  client C : Yafa Enterprise     — login  yafa / yafa123  (real videos)');
  console.log('  agency   : account manager     — login  sara / 123456  (sees all)');
  console.log('  admin    : super admin         — login  admin / admin123');
  console.log('  posts    :', created.length + postsB.length + postsY.length);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

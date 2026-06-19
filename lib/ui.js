// Shared display helpers (status, type) — bilingual labels + classes.

export const STATUS = {
  review:    { badge: 'badge--amber',  en: 'Needs review', ar: 'بانتظار المراجعة' },
  revision:  { badge: 'badge--blue',   en: 'In revision',  ar: 'قيد التعديل' },
  approved:  { badge: 'badge--green',  en: 'Approved',     ar: 'معتمد' },
  published: { badge: 'badge--brand',  en: 'Published',    ar: 'منشور' },
  draft:     { badge: 'badge--gray',   en: 'Draft',        ar: 'مسودة' },
};

export const TYPE = {
  video:  { icon: 'ti-video',      grad: 'grad-video',  en: 'Video',  ar: 'فيديو' },
  image:  { icon: 'ti-photo',      grad: 'grad-image',  en: 'Image',  ar: 'صورة' },
  design: { icon: 'ti-vector',     grad: 'grad-design', en: 'Design', ar: 'تصميم' },
  copy:   { icon: 'ti-typography', grad: 'copy',        en: 'Copy',   ar: 'نص' },
};

export const PLATFORM = {
  instagram: 'ti-brand-instagram',
  x: 'ti-brand-x',
  youtube: 'ti-brand-youtube',
  tiktok: 'ti-brand-tiktok',
  facebook: 'ti-brand-facebook',
  linkedin: 'ti-brand-linkedin',
};

// Ordered list used by the social-platform bars under each material.
export const PLATFORM_LIST = [
  { key: 'facebook', icon: 'ti-brand-facebook', en: 'Facebook', ar: 'فيسبوك' },
  { key: 'instagram', icon: 'ti-brand-instagram', en: 'Instagram', ar: 'إنستغرام' },
  { key: 'x', icon: 'ti-brand-x', en: 'X', ar: 'إكس' },
  { key: 'tiktok', icon: 'ti-brand-tiktok', en: 'TikTok', ar: 'تيك توك' },
  { key: 'youtube', icon: 'ti-brand-youtube', en: 'YouTube', ar: 'يوتيوب' },
  { key: 'linkedin', icon: 'ti-brand-linkedin', en: 'LinkedIn', ar: 'لينكد إن' },
];
export const PLATFORM_AR = Object.fromEntries(PLATFORM_LIST.map((p) => [p.key, p.ar]));

export function initialsOf(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

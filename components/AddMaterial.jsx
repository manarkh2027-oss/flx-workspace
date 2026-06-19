'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { fileToDataUrl, readFileAsDataUrl, imageErrorAr } from '@/lib/image';

const TYPES = [
  { key: 'video', icon: 'ti-video', en: 'Video', ar: 'فيديو' },
  { key: 'image', icon: 'ti-photo', en: 'Image', ar: 'صورة' },
  { key: 'design', icon: 'ti-vector', en: 'Design', ar: 'تصميم' },
  { key: 'copy', icon: 'ti-typography', en: 'Copy', ar: 'نص' },
];
const PLATFORMS = [
  { key: 'instagram', en: 'Instagram', ar: 'إنستغرام' },
  { key: 'facebook', en: 'Facebook', ar: 'فيسبوك' },
  { key: 'x', en: 'X', ar: 'إكس' },
  { key: 'youtube', en: 'YouTube', ar: 'يوتيوب' },
  { key: 'tiktok', en: 'TikTok', ar: 'تيك توك' },
];

export default function AddMaterial({ clientId, defaultDate, label, className, post }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const isEdit = !!post;
  // For an existing video stored as a link (not a data-URL), start in "link" mode.
  const editIsLink = isEdit && post.type === 'video' && post.mediaUrl && !post.mediaUrl.startsWith('data:');

  const [open, setOpen] = useState(false);
  const [type, setType] = useState(post?.type || 'image');
  const [title, setTitle] = useState(post?.title || '');
  const [body, setBody] = useState(post?.body || '');
  const [platform, setPlatform] = useState(post?.platform || 'instagram');
  const [date, setDate] = useState((post?.publishAt ? String(post.publishAt).slice(0, 10) : defaultDate) || '');
  const [media, setMedia] = useState(isEdit && !editIsLink ? (post.mediaUrl || '') : '');     // data-url or link
  const [mediaName, setMediaName] = useState('');
  const [videoMode, setVideoMode] = useState(editIsLink ? 'link' : 'file'); // file | link
  const [link, setLink] = useState(editIsLink ? post.mediaUrl : '');
  const [saving, setSaving] = useState(false);

  function reset() {
    setType(post?.type || 'image'); setTitle(post?.title || ''); setBody(post?.body || '');
    setPlatform(post?.platform || 'instagram');
    setDate((post?.publishAt ? String(post.publishAt).slice(0, 10) : defaultDate) || '');
    setMedia(isEdit && !editIsLink ? (post.mediaUrl || '') : ''); setMediaName('');
    setVideoMode(editIsLink ? 'link' : 'file'); setLink(editIsLink ? post.mediaUrl : '');
  }
  function close() { setOpen(false); reset(); }

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      if (type === 'video') {
        const url = await readFileAsDataUrl(file, { maxBytes: 8 * 1024 * 1024 });
        setMedia(url); setMediaName(file.name);
      } else {
        const url = await fileToDataUrl(file, { maxSize: type === 'design' ? 1400 : 1200 });
        setMedia(url); setMediaName(file.name);
      }
    } catch (err) {
      toast(imageErrorAr(err), 'warn');
    }
  }

  async function submit() {
    if (!title.trim()) { toast('اكتب عنوان المادة', 'warn'); return; }
    let mediaUrl = null;
    if (type === 'video') mediaUrl = videoMode === 'link' ? link.trim() : media;
    else if (type !== 'copy') mediaUrl = media;
    if ((type === 'image' || type === 'design') && !mediaUrl) { toast('ارفع الصورة/التصميم', 'warn'); return; }
    if (type === 'video' && !mediaUrl) { toast('ارفع الفيديو أو ألصق رابطه', 'warn'); return; }

    setSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/posts/${post.id}` : '/api/posts', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, type, title, body, platform, publishAt: date || null, mediaUrl }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || 'failed');
      toast(isEdit ? 'تم تحديث المادة وأُرسلت نسخة جديدة للمراجعة ✓' : 'تم رفع المادة وأُرسلت للمراجعة ✓', 'success');
      close();
      router.refresh();
    } catch (err) {
      toast((isEdit ? 'تعذّر تحديث المادة: ' : 'تعذّر رفع المادة: ') + (err.message || ''), 'warn');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button type="button" className={className || 'btn btn-primary btn-sm'} onClick={() => setOpen(true)}>
        <i className={'ti ' + (isEdit ? 'ti-edit' : 'ti-plus')} /> <span data-ar={label?.ar || (isEdit ? 'تعديل المادة' : 'أضف مادة')}>{label?.en || (isEdit ? 'Edit' : 'Add material')}</span>
      </button>

      {open && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 data-ar={isEdit ? 'تعديل المادة' : 'إضافة مادة جديدة'}>{isEdit ? 'Edit material' : 'Add new material'}</h3>
              <button type="button" className="icon-btn" onClick={close} aria-label="Close"><i className="ti ti-x" /></button>
            </div>

            <div className="modal-body">
              <div className="field">
                <label data-ar="نوع المادة">Material type</label>
                <div className="type-pick">
                  {TYPES.map((t) => (
                    <button key={t.key} type="button" className={'tp' + (type === t.key ? ' active' : '')}
                      onClick={() => { setType(t.key); setMedia(''); setMediaName(''); }}>
                      <i className={'ti ' + t.icon} /> <span data-ar={t.ar}>{t.en}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label data-ar="عنوان المادة">Title</label>
                <input className="input" dir="auto" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: ريل العرض الصيفي" data-ar-ph="مثال: ريل العرض الصيفي" />
              </div>

              <div className="field">
                <label data-ar={type === 'copy' ? 'النص / المحتوى' : 'شرح وتفاصيل المادة'}>{type === 'copy' ? 'Text / content' : 'Description & details'}</label>
                <textarea className="input" style={{ height: 96, paddingTop: 10, resize: 'vertical' }} dir="auto" value={body} onChange={(e) => setBody(e.target.value)}
                  placeholder={type === 'copy' ? 'اكتب نص المنشور هنا…' : 'اكتب شرحاً أو ملاحظات عن المادة…'}
                  data-ar-ph={type === 'copy' ? 'اكتب نص المنشور هنا…' : 'اكتب شرحاً أو ملاحظات عن المادة…'} />
              </div>

              {type !== 'copy' && (
                <div className="field">
                  <label data-ar={type === 'video' ? 'الفيديو' : 'الملف'}>{type === 'video' ? 'Video' : 'File'}</label>
                  {type === 'video' && (
                    <div className="seg2" style={{ marginBottom: 10 }}>
                      <button type="button" className={videoMode === 'file' ? 'active' : ''} onClick={() => setVideoMode('file')} data-ar="رفع ملف">Upload file</button>
                      <button type="button" className={videoMode === 'link' ? 'active' : ''} onClick={() => setVideoMode('link')} data-ar="رابط">Link</button>
                    </div>
                  )}
                  {type === 'video' && videoMode === 'link' ? (
                    <input className="input" dir="ltr" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…/video.mp4" />
                  ) : (
                    <>
                      <input ref={fileRef} type="file" hidden accept={type === 'video' ? 'video/*' : 'image/*'} onChange={onPickFile} />
                      <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
                        <i className="ti ti-upload" /> <span data-ar={media ? 'تغيير الملف' : 'اختر ملفاً من جهازك'}>{media ? 'Change file' : 'Choose a file'}</span>
                      </button>
                      {mediaName && <div className="hint" style={{ fontSize: 12, marginTop: 6 }}>{mediaName}</div>}
                      {media && type !== 'video' && <img src={media} alt="" className="upload-preview" />}
                      {type === 'video' && <div className="hint" style={{ fontSize: 11.5, marginTop: 6 }} data-ar="الحد ٨ ميغابايت — للفيديو الأكبر استخدم رابطاً">Max 8 MB — use a link for bigger videos</div>}
                    </>
                  )}
                </div>
              )}

              <div className="grid2">
                <div className="field">
                  <label data-ar="المنصة">Platform</label>
                  <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                    {PLATFORMS.map((p) => <option key={p.key} value={p.key}>{p.ar}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label data-ar="تاريخ النشر (اختياري)">Publish date (optional)</label>
                  <input className="input" type="date" dir="ltr" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button type="button" className="btn btn-sm" onClick={close} disabled={saving} data-ar="إلغاء">Cancel</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={submit} disabled={saving}>
                <i className={'ti ' + (saving ? 'ti-loader-2' : (isEdit ? 'ti-check' : 'ti-upload'))} /> {saving ? <span data-ar="جارٍ الحفظ…">Saving…</span> : <span data-ar={isEdit ? 'حفظ التعديل' : 'رفع المادة'}>{isEdit ? 'Save' : 'Upload'}</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { fileToDataUrl, imageErrorAr } from '@/lib/image';

// ---- colour maths so the editor only needs a colour + a name ----
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec((hex || '').trim());
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}
function rgbStr(hex) {
  const rgb = hexToRgb(hex);
  return rgb ? rgb.join(' ') : '';
}
function cmykStr(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '';
  const [r, g, b] = rgb.map((v) => v / 255);
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return '0 0 0 100';
  const c = Math.round(((1 - r - k) / (1 - k)) * 100);
  const m = Math.round(((1 - g - k) / (1 - k)) * 100);
  const y = Math.round(((1 - b - k) / (1 - k)) * 100);
  return `${c} ${m} ${y} ${Math.round(k * 100)}`;
}

const blankColor = () => ({ en: 'New colour', ar: 'لون جديد', hex: '#888888', rgb: '136 136 136', cmyk: '0 0 0 47' });
const blankFont = () => ({ family: 'Inter', sample: 'Aa Bb Cc', ar: false, note_en: 'English', note_ar: 'العربية' });

export default function BrandHub({ canEdit, client, brand }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // editable state (deep copy of incoming data)
  const init = () => ({
    name: client.name || '',
    nameAr: client.nameAr || '',
    initials: client.initials || 'ن',
    logoUrl: client.logoUrl || '',
    colors: (brand.colors || []).map((c) => ({ ...c })),
    fonts: (brand.fonts || []).map((f) => ({ ...f })),
    voiceOk: [...(brand.voiceOk || [])],
    voiceNo: [...(brand.voiceNo || [])],
    gallery: (brand.gallery || []).map((g) => ({ ...g })),
  });
  const [d, setD] = useState(init);
  const set = (patch) => setD((p) => ({ ...p, ...patch }));

  const primary = d.colors?.[0]?.hex || '#007A3D';
  const logo = d.logoUrl;

  function startEdit() { setD(init()); setEditing(true); }
  function cancel() { setD(init()); setEditing(false); }

  // Generate a reversed (brand background) or monochrome (white-on-black) PNG
  // of the uploaded logo, client-side, and download it.
  function downloadVariant(kind) {
    if (!logo) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 600;
      canvas.height = img.naturalHeight || 400;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = kind === 'reversed' ? primary : '#16161A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // draw the logo knocked out to white
      ctx.filter = 'brightness(0) invert(1)';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `logo-${kind}.png`;
        a.click();
      } catch { toast('تعذّر إنشاء النسخة', 'warn'); }
    };
    img.onerror = () => toast('تعذّر تحميل الشعار', 'warn');
    img.src = logo;
  }

  async function onPickLogo(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await fileToDataUrl(file, { maxSize: 640 });
      set({ logoUrl: url });
    } catch (err) {
      toast(imageErrorAr(err), 'warn');
    }
  }

  // colour helpers
  function setColor(i, patch) {
    setD((p) => {
      const colors = p.colors.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
      return { ...p, colors };
    });
  }
  function setColorHex(i, hex) {
    setColor(i, { hex, rgb: rgbStr(hex), cmyk: cmykStr(hex) });
  }
  const addColor = () => set({ colors: [...d.colors, blankColor()] });
  const removeColor = (i) => set({ colors: d.colors.filter((_, idx) => idx !== i) });

  // font helpers
  function setFont(i, patch) {
    setD((p) => ({ ...p, fonts: p.fonts.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) }));
  }
  const addFont = () => set({ fonts: [...d.fonts, blankFont()] });
  const removeFont = (i) => set({ fonts: d.fonts.filter((_, idx) => idx !== i) });

  // voice helpers
  const addWord = (key, val) => {
    const w = (val || '').trim();
    if (!w || d[key].includes(w)) return;
    set({ [key]: [...d[key], w] });
  };
  const removeWord = (key, w) => set({ [key]: d[key].filter((x) => x !== w) });

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: d.name, nameAr: d.nameAr, initials: d.initials,
          logoUrl: d.logoUrl || null,
          brand: {
            colors: d.colors, fonts: d.fonts,
            voiceOk: d.voiceOk, voiceNo: d.voiceNo, gallery: d.gallery,
          },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'failed');
      }
      toast('تم حفظ الهوية البصرية ✓', 'success');
      setEditing(false);
      router.refresh();
    } catch (err) {
      toast('تعذّر الحفظ: ' + (err.message || ''), 'warn');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="display" data-ar="الهوية البصرية">Brand Hub</div>
            <div className="muted" data-ar={`المرجع الموحّد لـ${d.nameAr || d.name || ''}`}>{`The single source of truth for ${d.name || ''}`}</div>
          </div>
          {canEdit && !editing && (
            <button className="btn btn-sm" type="button" onClick={startEdit}>
              <i className="ti ti-edit" /> <span data-ar="تعديل الهوية">Edit brand</span>
            </button>
          )}
          {editing && (
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-sm" type="button" onClick={cancel} disabled={saving}>
                <i className="ti ti-x" /> <span data-ar="إلغاء">Cancel</span>
              </button>
              <button className="btn btn-primary btn-sm" type="button" onClick={save} disabled={saving}>
                <i className="ti ti-check" /> {saving ? <span data-ar="جارٍ الحفظ…">Saving…</span> : <span data-ar="حفظ التغييرات">Save changes</span>}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="brand-layout">
        <nav className="brand-nav">
          <a className="active" href="#logos"><i className="ti ti-photo-hexagon" /> <span data-ar="الشعارات">Logos</span></a>
          <a href="#colours"><i className="ti ti-palette" /> <span data-ar="الألوان">Colours</span></a>
          <a href="#type"><i className="ti ti-typography" /> <span data-ar="الخطوط">Typography</span></a>
          <a href="#voice"><i className="ti ti-message-chatbot" /> <span data-ar="نبرة العلامة">Brand voice</span></a>
          {d.gallery?.length > 0 && <a href="#assets"><i className="ti ti-photo" /> <span data-ar="معرض الأصول">Brand assets</span></a>}
        </nav>

        <div>
          {/* ---------------- Logos ---------------- */}
          <section className="bsection" id="logos">
            <div className="bh"><h2><i className="ti ti-photo-hexagon" /> <span data-ar="الشعارات">Logos</span></h2></div>

            {editing && (
              <div className="edit-bar">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickLogo} />
                <button className="btn btn-sm btn-primary" type="button" onClick={() => fileRef.current?.click()}>
                  <i className="ti ti-upload" /> <span data-ar={logo ? 'استبدال الشعار' : 'رفع شعار من جهازك'}>{logo ? 'Replace logo' : 'Upload a logo'}</span>
                </button>
                {logo && (
                  <button className="btn btn-sm" type="button" style={{ color: 'var(--red-ink)' }} onClick={() => set({ logoUrl: '' })}>
                    <i className="ti ti-trash" /> <span data-ar="حذف الشعار">Remove logo</span>
                  </button>
                )}
                <span className="hint" style={{ fontSize: 12 }} data-ar="PNG أو JPG — يُصغَّر تلقائياً للعرض المثالي">PNG or JPG — auto-resized</span>
              </div>
            )}

            <div className="logo-grid">
              <div className="logo-tile">
                <div className="canvas light">
                  {logo ? <img src={logo} alt={d.name} /> : <span className="wm" style={{ color: primary }}>{d.initials || 'ن'}</span>}
                </div>
                <div className="foot">
                  <span className="nm" data-ar="الشعار الأساسي">Primary logo</span>
                  {logo
                    ? <a className="dlbtn" href={logo} download="logo" title="تنزيل"><i className="ti ti-download" /></a>
                    : <button data-soon="ارفع شعاراً أولاً لتتمكن من تنزيله"><i className="ti ti-download" /></button>}
                </div>
              </div>
              <div className="logo-tile">
                <div className="canvas brand" style={{ background: primary }}>
                  {logo ? <img src={logo} alt="" style={{ filter: 'brightness(0) invert(1)' }} /> : <span className="wm" style={{ color: '#fff' }}>{d.initials || 'ن'}</span>}
                </div>
                <div className="foot"><span className="nm" data-ar="معكوس">Reversed</span>
                  {logo
                    ? <button className="dlbtn" type="button" onClick={() => downloadVariant('reversed')} title="تنزيل"><i className="ti ti-download" /></button>
                    : <button data-soon="ارفع شعاراً أولاً"><i className="ti ti-download" /></button>}
                </div>
              </div>
              <div className="logo-tile">
                <div className="canvas dark">
                  {logo ? <img src={logo} alt="" style={{ filter: 'brightness(0) invert(1)' }} /> : <span className="wm" style={{ color: '#fff' }}>{d.initials || 'ن'}</span>}
                </div>
                <div className="foot"><span className="nm" data-ar="أحادي اللون">Monochrome</span>
                  {logo
                    ? <button className="dlbtn" type="button" onClick={() => downloadVariant('mono')} title="تنزيل"><i className="ti ti-download" /></button>
                    : <button data-soon="ارفع شعاراً أولاً"><i className="ti ti-download" /></button>}
                </div>
              </div>
            </div>

            {editing && (
              <div className="grid2" style={{ marginTop: 16 }}>
                <div className="field"><label data-ar="اسم العميل (إنجليزي)">Client name (EN)</label><input className="input" value={d.name} onChange={(e) => set({ name: e.target.value })} /></div>
                <div className="field"><label data-ar="اسم العميل (عربي)">Client name (AR)</label><input className="input" dir="rtl" value={d.nameAr} onChange={(e) => set({ nameAr: e.target.value })} /></div>
                <div className="field"><label data-ar="الأحرف المختصرة (للشعار النائب)">Initials (fallback mark)</label><input className="input" maxLength={4} value={d.initials} onChange={(e) => set({ initials: e.target.value })} /></div>
              </div>
            )}
          </section>

          {/* ---------------- Colours ---------------- */}
          <section className="bsection" id="colours">
            <div className="bh">
              <h2><i className="ti ti-palette" /> <span data-ar="الألوان">Colours</span></h2>
              {editing && <button className="btn btn-sm" type="button" onClick={addColor}><i className="ti ti-plus" /> <span data-ar="إضافة لون">Add colour</span></button>}
            </div>
            <div className="color-grid">
              {d.colors.map((c, i) => (
                <div className="swatch" key={i}>
                  <div className="fill" style={{ background: c.hex }}>
                    {editing && (
                      <>
                        <input type="color" className="color-dot" value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : '#888888'} onChange={(e) => setColorHex(i, e.target.value)} title="اختر اللون" />
                        <button type="button" className="swatch-del" onClick={() => removeColor(i)} title="حذف"><i className="ti ti-x" /></button>
                      </>
                    )}
                  </div>
                  <div className="meta">
                    {editing ? (
                      <div className="col" style={{ gap: 6 }}>
                        <input className="input input-sm" dir="rtl" value={c.ar} placeholder="الاسم بالعربية" onChange={(e) => setColor(i, { ar: e.target.value })} />
                        <input className="input input-sm" value={c.en} placeholder="Name (EN)" onChange={(e) => setColor(i, { en: e.target.value })} />
                        <div className="val"><b>HEX</b> {c.hex}</div>
                      </div>
                    ) : (
                      <>
                        <div className="nm" data-ar={c.ar}>{c.en}</div>
                        <div className="val"><b>HEX</b> {c.hex}<br /><b>RGB</b> {c.rgb}<br /><b>CMYK</b> {c.cmyk}</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ---------------- Typography ---------------- */}
          <section className="bsection" id="type">
            <div className="bh">
              <h2><i className="ti ti-typography" /> <span data-ar="الخطوط">Typography</span></h2>
              {editing && <button className="btn btn-sm" type="button" onClick={addFont}><i className="ti ti-plus" /> <span data-ar="إضافة خط">Add font</span></button>}
            </div>
            <div className="type-grid">
              {d.fonts.map((f, i) => (
                <div className="card type-card" key={i}>
                  {editing ? (
                    <div className="col" style={{ gap: 8 }}>
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <input className="input input-sm" style={{ fontWeight: 600 }} value={f.family} placeholder="Font family" onChange={(e) => setFont(i, { family: e.target.value })} />
                        <button type="button" className="btn btn-sm" style={{ color: 'var(--red-ink)' }} onClick={() => removeFont(i)}><i className="ti ti-trash" /></button>
                      </div>
                      <input className="input input-sm" dir="rtl" value={f.note_ar} placeholder="وصف عربي" onChange={(e) => setFont(i, { note_ar: e.target.value })} />
                      <input className="input input-sm" value={f.note_en} placeholder="Note (EN)" onChange={(e) => setFont(i, { note_en: e.target.value })} />
                      <input className="input input-sm" value={f.sample} placeholder="Aa Bb" onChange={(e) => setFont(i, { sample: e.target.value })} />
                      <label className="row" style={{ gap: 8, fontSize: 13 }}>
                        <input type="checkbox" checked={!!f.ar} onChange={(e) => setFont(i, { ar: e.target.checked })} />
                        <span data-ar="خط عربي (اتجاه RTL)">Arabic font (RTL)</span>
                      </label>
                    </div>
                  ) : (
                    <>
                      <div className="lbl" data-ar={f.note_ar}>{f.note_en}</div>
                      <div className="fam">{f.family}</div>
                      <div className={'spec' + (f.ar ? ' ar' : '')}>{f.sample}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ---------------- Brand voice ---------------- */}
          <section className="bsection" id="voice">
            <div className="bh"><h2><i className="ti ti-message-chatbot" /> <span data-ar="نبرة العلامة">Brand voice</span></h2></div>
            <div className="voice-grid">
              <div className="card card-pad">
                <div className="h3" style={{ marginBottom: 11, color: 'var(--green-ink)' }} data-ar="كلمات معتمدة">Approved keywords</div>
                <div className="word-list">
                  {d.voiceOk.map((w) => (
                    <span className="wtag ok" key={w}>{w}{editing && <i className="ti ti-x tagx" onClick={() => removeWord('voiceOk', w)} />}</span>
                  ))}
                </div>
                {editing && <WordInput placeholder="أضف كلمة + Enter" onAdd={(v) => addWord('voiceOk', v)} />}
              </div>
              <div className="card card-pad">
                <div className="h3" style={{ marginBottom: 11, color: 'var(--red-ink)' }} data-ar="كلمات ممنوعة">Restricted words</div>
                <div className="word-list">
                  {d.voiceNo.map((w) => (
                    <span className="wtag no" key={w}>{w}{editing && <i className="ti ti-x tagx" onClick={() => removeWord('voiceNo', w)} />}</span>
                  ))}
                </div>
                {editing && <WordInput placeholder="أضف كلمة + Enter" onAdd={(v) => addWord('voiceNo', v)} />}
              </div>
            </div>
          </section>

          {/* ---------------- Brand assets ---------------- */}
          {d.gallery?.length > 0 && (
            <section className="bsection" id="assets" style={{ marginBottom: 0 }}>
              <div className="bh"><h2><i className="ti ti-photo" /> <span data-ar="معرض الأصول">Brand assets</span></h2></div>
              <div className="gallery-grid">
                {d.gallery.map((g, i) => (
                  <div className="gallery-item" key={g.url + i}>
                    <div className="img"><img src={g.url} alt="" /></div>
                    <div className="cap" data-ar={g.ar}>{g.en}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// Small controlled input that adds a word on Enter.
function WordInput({ placeholder, onAdd }) {
  const [v, setV] = useState('');
  return (
    <input
      className="input input-sm"
      style={{ marginTop: 10 }}
      dir="rtl"
      value={v}
      placeholder={placeholder}
      onChange={(e) => setV(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); onAdd(v); setV(''); }
      }}
    />
  );
}

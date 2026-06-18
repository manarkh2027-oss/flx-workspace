import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getActiveClientId } from '@/lib/access';

export const dynamic = 'force-dynamic';

export default async function BrandPage() {
  const user = await getCurrentUser();
  const clientId = await getActiveClientId(user);
  const client = clientId ? await prisma.client.findUnique({ where: { id: clientId } }) : null;

  let brand = { colors: [], fonts: [], voiceOk: [], voiceNo: [], gallery: [] };
  try { if (client?.brandJson) brand = JSON.parse(client.brandJson); } catch {}
  const primary = brand.colors?.[0]?.hex || '#007A3D';
  const logo = client?.logoUrl;

  return (
    <div className="page">
      <div className="page-head">
        <div className="display" data-ar="الهوية البصرية">Brand Hub</div>
        <div className="muted" data-ar={`المرجع الموحّد لـ${client?.nameAr || ''}`}>{`The single source of truth for ${client?.name || ''}`}</div>
      </div>

      <div className="brand-layout">
        <nav className="brand-nav">
          <a className="active"><i className="ti ti-photo-hexagon" /> <span data-ar="الشعارات">Logos</span></a>
          <a><i className="ti ti-palette" /> <span data-ar="الألوان">Colours</span></a>
          <a><i className="ti ti-typography" /> <span data-ar="الخطوط">Typography</span></a>
          <a><i className="ti ti-message-chatbot" /> <span data-ar="نبرة العلامة">Brand voice</span></a>
          {brand.gallery?.length > 0 && <a><i className="ti ti-photo" /> <span data-ar="معرض الأصول">Brand assets</span></a>}
        </nav>

        <div>
          <section className="bsection">
            <div className="bh"><h2><i className="ti ti-photo-hexagon" /> <span data-ar="الشعارات">Logos</span></h2></div>
            <div className="logo-grid">
              <div className="logo-tile">
                <div className="canvas light">
                  {logo ? <img src={logo} alt={client?.name} /> : <span className="wm" style={{ color: primary }}>{client?.initials || 'ن'}</span>}
                </div>
                <div className="foot"><span className="nm" data-ar="الشعار الأساسي">Primary logo</span><button data-soon="تنزيل ملفات الهوية قادم قريباً"><i className="ti ti-download" /></button></div>
              </div>
              <div className="logo-tile">
                <div className="canvas brand" style={{ background: primary }}><span className="wm" style={{ color: '#fff' }}>{client?.initials || 'ن'}</span></div>
                <div className="foot"><span className="nm" data-ar="معكوس">Reversed</span><button data-soon="تنزيل ملفات الهوية قادم قريباً"><i className="ti ti-download" /></button></div>
              </div>
              <div className="logo-tile">
                <div className="canvas dark"><span className="wm" style={{ color: '#fff' }}>{client?.initials || 'ن'}</span></div>
                <div className="foot"><span className="nm" data-ar="أحادي اللون">Monochrome</span><button data-soon="تنزيل ملفات الهوية قادم قريباً"><i className="ti ti-download" /></button></div>
              </div>
            </div>
          </section>

          <section className="bsection">
            <div className="bh"><h2><i className="ti ti-palette" /> <span data-ar="الألوان">Colours</span></h2></div>
            <div className="color-grid">
              {brand.colors.map((c) => (
                <div className="swatch" key={c.hex}>
                  <div className="fill" style={{ background: c.hex }} />
                  <div className="meta">
                    <div className="nm" data-ar={c.ar}>{c.en}</div>
                    <div className="val"><b>HEX</b> {c.hex}<br /><b>RGB</b> {c.rgb}<br /><b>CMYK</b> {c.cmyk}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bsection">
            <div className="bh"><h2><i className="ti ti-typography" /> <span data-ar="الخطوط">Typography</span></h2></div>
            <div className="type-grid">
              {brand.fonts.map((f) => (
                <div className="card type-card" key={f.family}>
                  <div className="lbl" data-ar={f.note_ar}>{f.note_en}</div>
                  <div className="fam">{f.family}</div>
                  <div className={'spec' + (f.ar ? ' ar' : '')}>{f.sample}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="bsection">
            <div className="bh"><h2><i className="ti ti-message-chatbot" /> <span data-ar="نبرة العلامة">Brand voice</span></h2></div>
            <div className="voice-grid">
              <div className="card card-pad">
                <div className="h3" style={{ marginBottom: 11, color: 'var(--green-ink)' }} data-ar="كلمات معتمدة">Approved keywords</div>
                <div className="word-list">{brand.voiceOk.map((w) => <span className="wtag ok" key={w}>{w}</span>)}</div>
              </div>
              <div className="card card-pad">
                <div className="h3" style={{ marginBottom: 11, color: 'var(--red-ink)' }} data-ar="كلمات ممنوعة">Restricted words</div>
                <div className="word-list">{brand.voiceNo.map((w) => <span className="wtag no" key={w}>{w}</span>)}</div>
              </div>
            </div>
          </section>

          {brand.gallery?.length > 0 && (
            <section className="bsection" style={{ marginBottom: 0 }}>
              <div className="bh"><h2><i className="ti ti-photo" /> <span data-ar="معرض الأصول">Brand assets</span></h2></div>
              <div className="gallery-grid">
                {brand.gallery.map((g) => (
                  <div className="gallery-item" key={g.url}>
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

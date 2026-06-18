'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('lina');
  const [password, setPassword] = useState('123456');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'تعذّر تسجيل الدخول');
        setLoading(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('تعذّر الاتصال بالخادم');
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <section className="brand-panel">
        <div className="mesh">
          <span className="blob b1" /><span className="blob b2" /><span className="blob b3" /><span className="blob b4" />
        </div>
        <div className="grain" />

        <div className="bp-logo"><img src="/assets/flx-logo.png" alt="FLX" /></div>

        <div className="bp-center">
          <div className="kicker" data-ar="مساحة عمل العملاء">FLX Workspace</div>
          <h1 data-ar={'كل منشورات أسبوعك <span class="fill">في مكان واحد.</span>'}>
            Your week&#39;s posts, <span className="fill">all in one place.</span>
          </h1>
          <p data-ar="شاهد منشورات هذا الأسبوع — فيديو، تصميم، أو نص — وراجِعها واعتمدها من مكان واحد.">
            See this week&#39;s posts — video, design, or copy — then review and approve them in one place.
          </p>
          <div className="bp-feats">
            <div className="bp-feat"><span className="ic"><i className="ti ti-photo-video" /></span> <span data-ar="منشورات أسبوعك أمامك مباشرة">This week&#39;s posts, front and centre</span></div>
            <div className="bp-feat"><span className="ic"><i className="ti ti-circle-check" /></span> <span data-ar="مراجعة واعتماد بضغطة واحدة">Review &amp; approve in one tap</span></div>
            <div className="bp-feat"><span className="ic"><i className="ti ti-lock" /></span> <span data-ar="مساحة خاصة وآمنة لكل عميل">A private, secure space per client</span></div>
          </div>
        </div>

        <div className="bp-foot">
          <span className="tag"><i className="ti ti-sparkles" /> <span data-ar="نملأ ما هو ناقص">We Fill What&#39;s Missing</span></span>
          <span>© 2026 FLX Creative Production</span>
        </div>
      </section>

      <section className="form-panel">
        <div className="form-top">
          <div className="lang-seg">
            <button type="button" data-lang="ar">عربي</button>
            <button type="button" data-lang="en">English</button>
          </div>
        </div>

        <div className="form-card">
          <div className="top">
            <img src="/assets/flx-logo.png" alt="FLX" />
            <h2 data-ar="مرحباً بعودتك">Welcome back</h2>
            <p data-ar="سجّل الدخول إلى مساحتك الخاصة">Sign in to your workspace</p>
          </div>

          <form className="form-fields" onSubmit={onSubmit}>
            {error && <div className="login-error">{error}</div>}
            <div className="field">
              <label data-ar="اسم المستخدم">Username</label>
              <div className="input-wrap">
                <i className="ti ti-user" />
                <input className="input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
              </div>
            </div>
            <div className="field">
              <div className="row-between">
                <label data-ar="كلمة المرور">Password</label>
                <span className="link" data-ar="هل نسيت كلمة المرور؟">Forgot password?</span>
              </div>
              <div className="input-wrap">
                <i className="ti ti-lock" />
                <input className="input" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" className="reveal" aria-label="Show password" onClick={() => setShow((s) => !s)}>
                  <i className={show ? 'ti ti-eye-off' : 'ti ti-eye'} />
                </button>
              </div>
            </div>

            <label className="check" style={{ marginTop: 2 }}>
              <input type="checkbox" defaultChecked /><span className="box"><i className="ti ti-check" /></span>
              <span data-ar="تذكّرني">Remember me</span>
            </label>

            <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <span data-ar="جارٍ الدخول…">Signing in…</span> : <><span data-ar="تسجيل الدخول">Sign in</span> <i className="ti ti-arrow-right" /></>}
            </button>
          </form>

          <div className="form-foot">
            <span data-ar="بيانات تجريبية:">Demo login:</span> <b>lina / 123456</b>
          </div>
        </div>
        <div className="form-meta" data-ar="محمي من FLX · تشفير كامل · English available">Protected by FLX · End-to-end encrypted · العربية متاحة</div>
      </section>
    </div>
  );
}

import { getCurrentUser } from '@/lib/auth';
import { initialsOf } from '@/lib/ui';
import { roleLabel } from '@/lib/permissions';
import { whatsappConfigured } from '@/lib/notify/whatsapp';
import LogoutButton from '@/components/LogoutButton';
import NotificationSettings from '@/components/NotificationSettings';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const whatsappReady = whatsappConfigured();

  const role = roleLabel(user?.role);
  return (
      <div className="page">
        <div className="page-head">
          <div className="display" data-ar="الإعدادات">Settings</div>
          <div className="muted" data-ar="أدِر حسابك وتفضيلاتك">Manage your account and preferences</div>
        </div>

        <div className="set-layout">
          <nav className="set-nav">
            <a className="active"><i className="ti ti-user" /> <span data-ar="الملف الشخصي">Profile</span></a>
            <a><i className="ti ti-lock" /> <span data-ar="كلمة المرور">Password</span></a>
            <a><i className="ti ti-language" /> <span data-ar="اللغة والمظهر">Language</span></a>
            <a><i className="ti ti-bell" /> <span data-ar="الإشعارات">Notifications</span></a>
            <a><i className="ti ti-help" /> <span data-ar="الدعم">Support</span></a>
          </nav>

          <div>
            <div className="card scard">
              <h2 data-ar="الملف الشخصي">Profile</h2>
              <div className="sub" data-ar="معلوماتك الأساسية كما تظهر للفريق">Your basic information as the team sees it</div>
              <div className="prof">
                <span className="avatar a4">{initialsOf(user?.fullName)}</span>
                <div className="col" style={{ gap: 8 }}>
                  <span className="badge badge--brand" style={{ height: 24, width: 'fit-content' }} data-ar={role.ar}>{role.en}</span>
                  <button className="btn btn-sm" data-soon="رفع صورة الملف الشخصي قادم قريباً"><i className="ti ti-upload" /> <span data-ar="تغيير الصورة">Change photo</span></button>
                </div>
              </div>
              <div className="grid2">
                <div className="field"><label data-ar="الاسم الكامل">Full name</label><input className="input" defaultValue={user?.fullName} /></div>
                <div className="field"><label data-ar="اسم المستخدم">Username</label><input className="input" defaultValue={user?.username} readOnly /></div>
              </div>
              <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
                <button className="btn btn-primary btn-sm" data-soon="حفظ الملف الشخصي قادم قريباً — أمّا البريد والهاتف فيُحفظان من قسم الإشعارات"><i className="ti ti-check" /> <span data-ar="حفظ التغييرات">Save changes</span></button>
              </div>
            </div>

            <div className="card scard">
              <h2 data-ar="اللغة والمظهر">Language &amp; theme</h2>
              <div className="sub" data-ar="اختر لغة الواجهة">Choose your interface language</div>
              <div className="frow">
                <div><div className="lab" data-ar="اللغة">Language</div><div className="desc" data-ar="تتبدّل الواجهة فوراً">The interface switches instantly</div></div>
                <div className="lang-seg"><button type="button" data-lang="ar">عربي</button><button type="button" data-lang="en">English</button></div>
              </div>
              <div className="frow">
                <div><div className="lab" data-ar="المظهر">Theme</div><div className="desc" data-ar="فاتح أو داكن أو حسب النظام">Light, dark, or match your system</div></div>
                <div className="seg2">
                  <button type="button" data-theme-set="light"><i className="ti ti-sun" /> <span data-ar="فاتح">Light</span></button>
                  <button type="button" data-theme-set="dark"><i className="ti ti-moon" /> <span data-ar="داكن">Dark</span></button>
                  <button type="button" data-theme-set="system"><i className="ti ti-device-laptop" /> <span data-ar="النظام">System</span></button>
                </div>
              </div>
            </div>

            <NotificationSettings
              initial={{ email: user?.email || '', phone: user?.phone || '', notifyEmail: user?.notifyEmail ?? true, notifyWhatsapp: user?.notifyWhatsapp ?? true }}
              whatsappReady={whatsappReady}
            />

            <div className="card scard" style={{ marginBottom: 0 }}>
              <h2 data-ar="الدعم والحساب">Support &amp; account</h2>
              <div className="sub" data-ar="فريق FLX جاهز لمساعدتك">The FLX team is here to help</div>
              <div className="row" style={{ gap: 10 }}>
                <a className="btn" href="mailto:support@flxcreative.ps?subject=FLX%20Workspace"><i className="ti ti-message-circle" /> <span data-ar="تواصل مع الدعم">Contact support</span></a>
                <LogoutButton style={{ color: 'var(--red-ink)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

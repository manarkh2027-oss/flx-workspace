'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { initialsOf } from '@/lib/ui';
import { roleLabel } from '@/lib/permissions';
import TopSearch from '@/components/TopSearch';
import Toaster from '@/components/Toaster';
import { toast } from '@/lib/toast';

const NAV = [
  { href: '/', icon: 'ti-home', en: 'Home', ar: 'الرئيسية' },
  { href: '/campaigns', icon: 'ti-folders', en: 'Campaigns', ar: 'الحملات' },
  { href: '/calendar', icon: 'ti-calendar-event', en: 'Calendar', ar: 'التقويم' },
  { href: '/brand', icon: 'ti-palette', en: 'Brand Hub', ar: 'الهوية البصرية' },
  { href: '/archive', icon: 'ti-archive', en: 'Archive', ar: 'الأرشيف' },
];
const MANAGE_NAV = [
  { href: '/subscribers', icon: 'ti-users', en: 'Subscribers', ar: 'الزبائن والمشتركين' },
  { href: '/scheduled', icon: 'ti-calendar-clock', en: 'Scheduled', ar: 'منشورات مجدولة للنشر' },
  { href: '/published', icon: 'ti-checkbox', en: 'Published', ar: 'مواد منشورة' },
];
const NAV2 = [
  { href: '/notifications', icon: 'ti-bell', en: 'Notifications', ar: 'الإشعارات' },
  { href: '/settings', icon: 'ti-settings', en: 'Settings', ar: 'الإعدادات' },
];
const CRUMB = {
  '/': { en: 'Home', ar: 'الرئيسية' },
  '/campaigns': { en: 'Campaigns', ar: 'الحملات' },
  '/calendar': { en: 'Calendar', ar: 'التقويم' },
  '/brand': { en: 'Brand Hub', ar: 'الهوية البصرية' },
  '/archive': { en: 'Archive', ar: 'الأرشيف' },
  '/subscribers': { en: 'Subscribers', ar: 'الزبائن والمشتركين' },
  '/scheduled': { en: 'Scheduled', ar: 'منشورات مجدولة للنشر' },
  '/published': { en: 'Published', ar: 'مواد منشورة' },
  '/notifications': { en: 'Notifications', ar: 'الإشعارات' },
  '/settings': { en: 'Settings', ar: 'الإعدادات' },
};

export default function AppShell({ user, clients, activeClient, canSwitch, canManage, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark');
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setNavOpen(false); }, [pathname]);

  // Any button/link marked data-soon gives clear feedback instead of doing nothing.
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest('[data-soon]');
      if (el) {
        e.preventDefault();
        toast(el.getAttribute('data-soon') || 'هذه الميزة قادمة قريباً 🚧', 'warn');
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('flx-theme', next); } catch {}
    setDark(next === 'dark');
    document.querySelectorAll('[data-theme-set]').forEach((b) =>
      b.classList.toggle('active', b.getAttribute('data-theme-set') === next)
    );
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  async function switchClient(clientId) {
    setMenuOpen(false);
    await fetch('/api/active-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    });
    router.refresh();
  }

  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const crumb = pathname.startsWith('/posts') ? { en: 'Content review', ar: 'مراجعة المحتوى' } : (CRUMB[pathname] || { en: '', ar: '' });
  const role = roleLabel(user?.role);

  return (
    <div className="app">
      {navOpen && <div className="nav-overlay" onClick={() => setNavOpen(false)} />}
      <aside className={'sidebar' + (navOpen ? ' open' : '')}>
        <div className="sidebar-head">
          <div className="client-switch-wrap">
            <button className="client-switch" type="button" onClick={() => canSwitch && setMenuOpen((o) => !o)} disabled={!canSwitch}>
              <span className="logo">{activeClient?.initials || 'ن'}</span>
              <span className="meta">
                <span className="n" data-ar={activeClient?.nameAr || undefined}>{activeClient?.name || 'Workspace'}</span>
                <span className="s" data-ar={canSwitch ? 'بدّل بين العملاء' : 'مساحة العميل'}>{canSwitch ? 'Switch client' : 'Client workspace'}</span>
              </span>
              {canSwitch && <i className="ti ti-selector" />}
            </button>
            {menuOpen && canSwitch && (
              <div className="client-menu">
                {clients.map((c) => (
                  <button type="button" key={c.id} onClick={() => switchClient(c.id)}
                    className={'client-menu-item' + (c.id === activeClient?.id ? ' active' : '')}>
                    <span className="logo-sm">{c.initials}</span>
                    <span className="cn" data-ar={c.nameAr || undefined}>{c.name}</span>
                    {c.id === activeClient?.id && <i className="ti ti-check" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <nav className="nav">
          <div className="nav-label" data-ar="مساحة العمل">Workspace</div>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={'nav-item' + (isActive(n.href) ? ' active' : '')}>
              <i className={'ti ' + n.icon} /> <span data-ar={n.ar}>{n.en}</span>
            </Link>
          ))}
          {canManage && MANAGE_NAV.map((n) => (
            <Link key={n.href} href={n.href} className={'nav-item' + (isActive(n.href) ? ' active' : '')}>
              <i className={'ti ' + n.icon} /> <span data-ar={n.ar}>{n.en}</span>
            </Link>
          ))}
          <div className="nav-label" data-ar="خاص بك">For you</div>
          {NAV2.map((n) => (
            <Link key={n.href} href={n.href} className={'nav-item' + (isActive(n.href) ? ' active' : '')}>
              <i className={'ti ' + n.icon} /> <span data-ar={n.ar}>{n.en}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-row">
            {user?.avatarUrl
              ? <img className="avatar a4" src={user.avatarUrl} alt="" style={{ objectFit: 'cover' }} />
              : <span className="avatar a4">{initialsOf(user?.fullName)}</span>}
            <span className="meta">
              <span className="n">{user?.fullName}</span>
              <span className="s" data-ar={role.ar}>{role.en}</span>
            </span>
            <button type="button" onClick={logout} className="icon-btn" aria-label="Sign out" style={{ width: 30, height: 30 }}>
              <i className="ti ti-logout" />
            </button>
          </div>
          <div className="flx-foot"><span data-ar="بدعمٍ من">Powered by</span> <img src="/assets/flx-logo.png" alt="FLX" /></div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn hamburger" onClick={() => setNavOpen((o) => !o)} aria-label="Menu"><i className="ti ti-menu-2" /></button>
          <div className="crumbs"><span className="here" data-ar={crumb.ar}>{crumb.en}</span></div>
          <TopSearch />
          <div className="lang-seg">
            <button type="button" data-lang="ar">عربي</button>
            <button type="button" data-lang="en">English</button>
          </div>
          <button type="button" className="icon-btn" onClick={toggleTheme} aria-label="Theme">
            <i className={'ti ' + (dark ? 'ti-sun' : 'ti-moon')} />
          </button>
          <Link href="/notifications" className="icon-btn"><i className="ti ti-bell" /><span className="ping" /></Link>
        </header>

        {children}
      </div>
      <Toaster />
    </div>
  );
}

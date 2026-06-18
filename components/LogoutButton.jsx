'use client';
import { useRouter } from 'next/navigation';

export default function LogoutButton({ className = 'btn btn-ghost', style }) {
  const router = useRouter();
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }
  return (
    <button type="button" className={className} style={style} onClick={logout}>
      <i className="ti ti-logout" /> <span data-ar="تسجيل الخروج">Sign out</span>
    </button>
  );
}

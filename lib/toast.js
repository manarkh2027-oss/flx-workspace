'use client';

// Tiny toast helper — dispatches an event the <Toaster/> listens for.
export function toast(message, type = 'info') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('flx-toast', { detail: { message, type } }));
}

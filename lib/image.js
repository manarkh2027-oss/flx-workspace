'use client';

// Read a user-picked image file and return a downscaled data-URL.
// We store images as data-URLs in the database (Postgres) because Vercel's
// filesystem is read-only/ephemeral — writing to /public would not persist.
// Downscaling keeps the row small (a few KB-100KB) and avoids huge payloads.
export function fileToDataUrl(file, { maxSize = 640, mime, quality = 0.92 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('no-file'));
    if (!file.type?.startsWith('image/')) return reject(new Error('not-an-image'));

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read-failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decode-failed'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Keep transparency for PNGs (logos); use JPEG for photos to stay small.
        const isPng = file.type === 'image/png';
        const out = mime || (isPng ? 'image/png' : 'image/jpeg');
        try {
          resolve(canvas.toDataURL(out, quality));
        } catch {
          reject(new Error('encode-failed'));
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Read any file as a raw data-URL (no resize) with a size guard.
// Used for short video clips; large files should be pasted as a link instead.
export function readFileAsDataUrl(file, { maxBytes = 8 * 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('no-file'));
    if (file.size > maxBytes) return reject(new Error('too-large'));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read-failed'));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

// Friendly Arabic error text for the common failures above.
export function imageErrorAr(err) {
  if (err?.message === 'too-large') return 'الملف كبير جداً (الحد ٨ ميغابايت) — استخدم رابطاً للفيديو الكبير';
  const m = err?.message || '';
  if (m === 'not-an-image') return 'الرجاء اختيار ملف صورة (PNG أو JPG)';
  if (m === 'no-file') return 'لم يتم اختيار ملف';
  return 'تعذّرت معالجة الصورة، جرّب صورة أخرى';
}

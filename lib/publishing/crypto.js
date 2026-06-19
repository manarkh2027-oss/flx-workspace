import crypto from 'crypto';

// At-rest encryption for OAuth tokens.
//
// Tokens are secrets — never store them in plaintext and never send them to the
// browser. We use AES-256-GCM with a key from PUBLISHING_ENC_KEY (32 bytes, hex
// or base64). In production prefer a managed KMS / secrets manager and rotate keys.
//
// TODO(engineer): move key material to a KMS (AWS KMS, GCP KMS, Vault) and add
// key rotation. The format below is `v1:<iv>:<authTag>:<ciphertext>` (base64 parts).

function getKey() {
  const raw = process.env.PUBLISHING_ENC_KEY;
  if (!raw) return null;
  let buf;
  try {
    buf = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  } catch {
    return null;
  }
  return buf.length === 32 ? buf : null;
}

export function encryptSecret(plain) {
  if (plain == null) return null;
  const key = getKey();
  if (!key) {
    // No key configured yet — refuse to silently store plaintext.
    // The OAuth callback surfaces this as a clear "not configured" error.
    throw new Error('PUBLISHING_ENC_KEY not set — cannot store tokens securely');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

export function decryptSecret(blob) {
  if (!blob) return null;
  const key = getKey();
  if (!key) throw new Error('PUBLISHING_ENC_KEY not set — cannot read tokens');
  const [v, ivB, tagB, dataB] = String(blob).split(':');
  if (v !== 'v1') throw new Error('unsupported token format');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB, 'base64')), decipher.final()]).toString('utf8');
}

export function encryptionReady() {
  return Boolean(getKey());
}

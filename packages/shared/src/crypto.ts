import crypto from 'crypto';

const keyB64 = process.env.ENCRYPTION_KEY_BASE64!;
const key = Buffer.from(keyB64, 'base64');
if (key.length !== 32) throw new Error('ENCRYPTION_KEY_BASE64 must be 32 bytes (base64)');

export function enc(plain: string) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const buf = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  const tag = c.getAuthTag();
  return Buffer.concat([iv, tag, buf]).toString('base64');
}
export function dec(b64: string) {
  const b = Buffer.from(b64, 'base64');
  const iv = b.subarray(0,12), tag = b.subarray(12,28), data = b.subarray(28);
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString('utf8');
}

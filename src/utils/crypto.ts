import { SECURITY_CONFIG } from '../config/security';

export interface EncryptedEnvelope {
  encrypted: true;
  v: 1;
  iv: string;
  data: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function deriveAesKey(passphrase: string): Promise<CryptoKey> {
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(passphrase),
  );
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt']);
}

export async function encryptPayload(payload: unknown): Promise<EncryptedEnvelope> {
  const key = await deriveAesKey(SECURITY_CONFIG.payloadEncryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  return {
    encrypted: true,
    v: 1,
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext)),
  };
}

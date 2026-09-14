import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM com uma chave própria (MFA_ENCRYPTION_KEY) — o segredo TOTP
// tem de poder ser lido de volta (ao contrário de uma password, não dá para
// só guardar um hash), por isso fica cifrado em vez de em texto simples.
function getKey(): Buffer {
  const key = process.env.MFA_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'MFA_ENCRYPTION_KEY não está definida. Gera uma com: openssl rand -hex 32',
    );
  }
  const buf = Buffer.from(key, 'hex');
  if (buf.length !== 32) {
    throw new Error('MFA_ENCRYPTION_KEY tem de ser uma string hex de 32 bytes (64 caracteres).');
  }
  return buf;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((b) => b.toString('hex')).join(':');
}

export function decryptSecret(encrypted: string): string {
  const [ivHex, authTagHex, ciphertextHex] = encrypted.split(':');
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertextHex, 'hex')), decipher.final()]);
  return plaintext.toString('utf8');
}

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

// Cifra das chaves de API guardadas na base de dados (IA, recomendações,
// Sender.net). Nenhuma é guardada em claro. AES-256-GCM, com tag de
// autenticação: uma linha adulterada falha a decifrar em vez de devolver lixo.
//
// A chave de cifra vem de AI_ENCRYPTION_KEY se existir; caso contrário é
// derivada do JWT_SECRET já configurado em produção — assim não obriga a
// mexer nas variáveis de ambiente do Render.
//
// O nome da variável e o sal continuam a dizer "ai" de propósito: mudá-los
// tornaria indecifráveis as chaves já guardadas.
function encryptionKey(): Buffer {
  const secret = process.env.AI_ENCRYPTION_KEY ?? process.env.JWT_SECRET;
  if (!secret) throw new Error('AI_ENCRYPTION_KEY ou JWT_SECRET têm de estar definidos para guardar chaves de API');
  return scryptSync(secret, 'electrochico-ai-v1', 32);
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join('.');
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Chave guardada em formato inválido');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8');
}

// O que o backoffice mostra depois de gravar: nunca a chave completa.
export function maskSecret(plain: string): string {
  if (plain.length <= 8) return '••••••••';
  return `${plain.slice(0, 4)}••••••••${plain.slice(-4)}`;
}

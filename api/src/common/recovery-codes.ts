import { randomBytes } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem O/0/I/1, para evitar confusão ao transcrever

function randomChunk(length: number): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

// Códigos de recuperação de uso único, para quando o admin perde o acesso à
// app de autenticação — sem isto, ativar 2FA na única conta admin seria um
// risco real de ficar trancado de fora da loja.
export function generateRecoveryCodes(count = 8): string[] {
  return Array.from({ length: count }, () => `${randomChunk(4)}-${randomChunk(4)}`);
}

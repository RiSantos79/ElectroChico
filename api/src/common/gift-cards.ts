import { randomInt } from 'node:crypto';

export const GIFT_CARD_CATEGORY_SLUG = 'cartoes-presente';

// Sem 0/O/1/I para evitar confusão a ler o código à mão.
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomBlock(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += CHARSET[randomInt(CHARSET.length)];
  return out;
}

export function generateGiftCardCode(): string {
  return `EC-${randomBlock(4)}-${randomBlock(4)}`;
}

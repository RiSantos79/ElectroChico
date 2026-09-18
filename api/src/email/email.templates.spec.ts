import { describe, expect, it } from 'vitest';
import { abandonedCartHtml, formatEur, orderConfirmationHtml } from './email.templates.js';

const baseOrder = {
  id: 'cmu72pf7l000a1j8bemcj86dy',
  customerName: 'Maria Silva',
  street: 'Rua das Flores',
  streetNumber: '12',
  floor: '3º Esq',
  postalCode: '4000-001',
  city: 'Porto',
  subtotal: 649,
  discountAmount: null,
  couponCode: null,
  total: 649,
  items: [{ productName: 'TV LG OLED 55"', quantity: 2, unitPrice: 324.5 }],
};

describe('orderConfirmationHtml', () => {
  it('mostra o número da encomenda, a morada e o total', () => {
    const html = orderConfirmationHtml(baseOrder);
    expect(html).toContain('cmu72pf7l000a1j8bemcj86dy');
    expect(html).toContain('Rua das Flores 12, 3º Esq');
    expect(html).toContain('4000-001 Porto');
    expect(html).toContain(formatEur(649));
  });

  it('multiplica o preço unitário pela quantidade na linha', () => {
    // 2 × 324,50 = 649,00 — se a linha mostrasse só o preço unitário, o
    // cliente veria um total que não bate com as parcelas.
    expect(orderConfirmationHtml(baseOrder)).toContain(`2 × ${formatEur(324.5)}`);
  });

  it('só mostra a linha de desconto quando existe desconto', () => {
    expect(orderConfirmationHtml(baseOrder)).not.toContain('Desconto');

    const comDesconto = orderConfirmationHtml({
      ...baseOrder,
      discountAmount: 50,
      couponCode: 'VERAO10',
      total: 599,
    });
    expect(comDesconto).toContain('Desconto (VERAO10)');
    expect(comDesconto).toContain(`− ${formatEur(50)}`);
  });

  it('omite o andar quando não foi preenchido', () => {
    const html = orderConfirmationHtml({ ...baseOrder, floor: null });
    expect(html).toContain('Rua das Flores 12<br>');
  });

  it('escapa HTML vindo do cliente', () => {
    // O nome e a morada são texto livre do checkout: sem escape, um cliente
    // podia injetar marcação no email que a loja lhe envia.
    const html = orderConfirmationHtml({
      ...baseOrder,
      customerName: '<script>alert(1)</script>',
      city: 'Porto & Norte',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Porto &amp; Norte');
  });
});

describe('abandonedCartHtml', () => {
  it('lista os artigos deixados no carrinho', () => {
    const html = abandonedCartHtml('João', [{ productName: 'Máquina de lavar', quantity: 1 }]);
    expect(html).toContain('Olá João');
    expect(html).toContain('Máquina de lavar × 1');
  });
});

describe('formatEur', () => {
  it('formata em euros à portuguesa e trata valores em falta', () => {
    // Vírgula decimal, como em pt-PT — o separador antes do símbolo é um
    // espaço não separável, por isso a comparação é feita sobre os dígitos.
    expect(formatEur(5)).toMatch(/^5,00\s€$/u);
    expect(formatEur('12.5')).toMatch(/^12,50\s€$/u);
    expect(formatEur(null)).toMatch(/^0,00\s€$/u);
  });
});

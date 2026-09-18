// HTML dos emails da loja. Vive fora do EmailService para que este continue a
// ser só o transporte — trocar de fornecedor não mexe nos templates, e mudar
// os templates não mexe no envio.
//
// Escrito com tabelas e estilos inline de propósito: os clientes de email
// (sobretudo o Outlook) ignoram <style>, flexbox e grid.

const BRAND = '#2563eb';
const TEXT = '#1f2937';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';

// Mesma formatação que a loja mostra ao cliente (vírgula decimal), para o
// total do email bater com o que ele viu no checkout.
const EUR = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

export function formatEur(value: unknown): string {
  return EUR.format(Number(value ?? 0));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// O rodapé explica ao destinatário porque recebeu o email — varia conforme o
// motivo, e dizer "fez uma compra" num email de recuperação seria falso.
export function emailLayout(
  heading: string,
  bodyHtml: string,
  footer = 'Recebeu este email porque fez uma compra na ElectroChico.',
): string {
  return `
<div style="background:#f3f4f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:${TEXT}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
             style="width:600px;max-width:100%;background:#ffffff;border:1px solid ${BORDER};border-radius:8px">
        <tr><td style="padding:24px 32px;border-bottom:1px solid ${BORDER}">
          <span style="font-size:20px;font-weight:bold;color:${BRAND}">ElectroChico</span>
        </td></tr>
        <tr><td style="padding:32px">
          <h1 style="margin:0 0 16px;font-size:20px;color:${TEXT}">${escapeHtml(heading)}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid ${BORDER};font-size:12px;color:${MUTED}">
          ${escapeHtml(footer)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</div>`.trim();
}

type OrderForEmail = {
  id: string;
  customerName: string;
  street: string;
  streetNumber: string;
  floor: string | null;
  postalCode: string;
  city: string;
  subtotal: unknown;
  discountAmount: unknown;
  couponCode: string | null;
  total: unknown;
  items: { productName: string; quantity: number; unitPrice: unknown }[];
};

function summaryRow(label: string, value: string, bold = false): string {
  const weight = bold ? 'bold' : 'normal';
  return `<tr>
    <td style="padding:6px 0;font-weight:${weight}">${escapeHtml(label)}</td>
    <td align="right" style="padding:6px 0;font-weight:${weight}">${escapeHtml(value)}</td>
  </tr>`;
}

export function orderConfirmationHtml(order: OrderForEmail): string {
  const items = order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid ${BORDER}">
          ${escapeHtml(item.productName)}<br>
          <span style="font-size:12px;color:${MUTED}">${item.quantity} × ${formatEur(item.unitPrice)}</span>
        </td>
        <td align="right" style="padding:8px 0;border-bottom:1px solid ${BORDER};white-space:nowrap">
          ${formatEur(Number(item.unitPrice) * item.quantity)}
        </td>
      </tr>`,
    )
    .join('');

  const discount =
    order.discountAmount && Number(order.discountAmount) > 0
      ? summaryRow(
          order.couponCode ? `Desconto (${order.couponCode})` : 'Desconto',
          `− ${formatEur(order.discountAmount)}`,
        )
      : '';

  const floor = order.floor ? `, ${escapeHtml(order.floor)}` : '';

  return emailLayout(
    'Recebemos a sua encomenda',
    `
    <p style="margin:0 0 8px">Olá ${escapeHtml(order.customerName)},</p>
    <p style="margin:0 0 24px">
      O seu pagamento foi confirmado. A encomenda
      <strong>${escapeHtml(order.id)}</strong> está a ser preparada e avisamos-lhe assim que for expedida.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px">
      ${items}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="font-size:14px;margin-top:16px">
      ${summaryRow('Subtotal', formatEur(order.subtotal))}
      ${discount}
      ${summaryRow('Total', formatEur(order.total), true)}
    </table>

    <h2 style="margin:32px 0 8px;font-size:15px">Morada de entrega</h2>
    <p style="margin:0;font-size:14px;color:${MUTED}">
      ${escapeHtml(order.street)} ${escapeHtml(order.streetNumber)}${floor}<br>
      ${escapeHtml(order.postalCode)} ${escapeHtml(order.city)}
    </p>`,
  );
}

export function abandonedCartHtml(customerName: string, items: { productName: string; quantity: number }[]): string {
  const list = items
    .map((item) => `<li style="margin-bottom:4px">${escapeHtml(item.productName)} × ${item.quantity}</li>`)
    .join('');

  return emailLayout(
    'Ainda tem artigos à sua espera',
    `
    <p style="margin:0 0 8px">Olá ${escapeHtml(customerName)},</p>
    <p style="margin:0 0 16px">Reparámos que deixou estes artigos por finalizar:</p>
    <ul style="margin:0 0 24px;padding-left:20px;font-size:14px">${list}</ul>
    <p style="margin:0">Volte à ElectroChico para concluir a sua compra.</p>`,
  );
}

export function passwordResetHtml(name: string, resetUrl: string): string {
  return emailLayout(
    'Recuperação de palavra-passe',
    `
    <p style="margin:0 0 8px">Olá ${escapeHtml(name)},</p>
    <p style="margin:0 0 24px">
      Recebemos um pedido para definir uma nova palavra-passe na sua conta. O link abaixo é válido durante
      uma hora e só pode ser usado uma vez.
    </p>
    <p style="margin:0 0 24px">
      <a href="${escapeHtml(resetUrl)}"
         style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;
                padding:12px 24px;border-radius:6px;font-weight:bold">Definir nova palavra-passe</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:${MUTED}">
      Se o botão não funcionar, copie este endereço para o navegador:<br>
      <span style="word-break:break-all">${escapeHtml(resetUrl)}</span>
    </p>
    <p style="margin:24px 0 0;font-size:13px;color:${MUTED}">
      Se não foi você que pediu, ignore este email — a palavra-passe atual continua válida.
    </p>`,
    'Recebeu este email porque foi pedida a recuperação da palavra-passe desta conta.',
  );
}

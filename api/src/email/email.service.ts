import { Injectable, Logger } from '@nestjs/common';

export type SendEmailResult = { sent: true } | { sent: false; reason: 'not_configured' | 'provider_error' };

// Integração com a Resend por pedido explícito do escritório do cliente,
// mas a ser validada/contratada antes de entrar em produção — por isso fica
// inativa (não envia nada, só regista nos logs) até existir RESEND_API_KEY.
// Quando essa chave for definida, começa a enviar a sério sem tocar em mais
// nenhum código: só este serviço sabe que o envio está "desligado".
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey = process.env.RESEND_API_KEY;
  private readonly from = process.env.EMAIL_FROM ?? 'ElectroChico <onboarding@resend.dev>';

  async send(params: { to: string; subject: string; html: string }): Promise<SendEmailResult> {
    if (!this.apiKey) {
      this.logger.warn(
        `RESEND_API_KEY não configurada — email não enviado. to=${params.to} subject="${params.subject}"`,
      );
      return { sent: false, reason: 'not_configured' };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: this.from, to: params.to, subject: params.subject, html: params.html }),
      });
      if (!res.ok) {
        this.logger.error(`Falha ao enviar email via Resend (${res.status}): ${await res.text()}`);
        return { sent: false, reason: 'provider_error' };
      }
      return { sent: true };
    } catch (err) {
      this.logger.error(`Erro ao chamar a Resend: ${err instanceof Error ? err.message : String(err)}`);
      return { sent: false, reason: 'provider_error' };
    }
  }
}

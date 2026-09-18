// Único sítio da aplicação que conhece a API do Sender.net. Se um dia se
// trocar de fornecedor, é este ficheiro que se reescreve — o resto fala em
// "contacto" e "grupo", não em endpoints.
//
// Documentação: https://api.sender.net/ (base https://api.sender.net/v2/)

const BASE_URL = 'https://api.sender.net/v2';

export type SenderContact = {
  email: string;
  firstName?: string;
  lastName?: string;
  /** Campos comerciais nossos; vão como campos personalizados do Sender. */
  fields?: Record<string, string | number>;
  groupIds?: string[];
};

export type SenderGroup = { id: string; title: string; activeSubscribers: number };

export type SenderResult<T> = { ok: true; data: T } | { ok: false; error: string };

// O Sender usa {$nome} para campos personalizados. Os campos têm de existir
// primeiro na conta — um nome desconhecido é ignorado em silêncio, não é erro.
function wrapFields(fields: Record<string, string | number>): Record<string, string | number> {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [`{$${key}}`, value]));
}

export class SenderClient {
  constructor(private readonly apiKey: string) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<SenderResult<T>> {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...init.headers,
        },
      });

      const body = await res.text();
      if (!res.ok) {
        // A mensagem do Sender é mais útil ao gestor do que "erro 422".
        return { ok: false, error: `Sender respondeu ${res.status}: ${body.slice(0, 300)}` };
      }
      return { ok: true, data: (body ? JSON.parse(body) : {}) as T };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  /** Serve de teste de ligação: só uma chave válida consegue listar grupos. */
  async listGroups(): Promise<SenderResult<SenderGroup[]>> {
    const res = await this.request<{ data?: unknown[] }>('/groups');
    if (!res.ok) return res;

    const groups = Array.isArray(res.data?.data) ? res.data.data : [];
    return {
      ok: true,
      data: groups.map((g) => {
        const row = g as Record<string, unknown>;
        return {
          id: String(row.id ?? ''),
          title: String(row.title ?? ''),
          activeSubscribers: Number(row.active_subscribers ?? 0),
        };
      }),
    };
  }

  // O Sender não tem upsert: POST cria e falha se já existir, PATCH atualiza
  // e falha se não existir. Tenta-se criar primeiro porque, numa conta nova,
  // é esse o caso comum — e a atualização fica como recurso.
  async upsertContact(contact: SenderContact): Promise<SenderResult<unknown>> {
    const payload = {
      email: contact.email,
      ...(contact.firstName ? { firstname: contact.firstName } : {}),
      ...(contact.lastName ? { lastname: contact.lastName } : {}),
      ...(contact.groupIds?.length ? { groups: contact.groupIds } : {}),
      ...(contact.fields ? { fields: wrapFields(contact.fields) } : {}),
    };

    const created = await this.request('/subscribers', { method: 'POST', body: JSON.stringify(payload) });
    if (created.ok) return created;

    const { email: _email, ...updatable } = payload;
    return this.request(`/subscribers/${encodeURIComponent(contact.email)}`, {
      method: 'PATCH',
      body: JSON.stringify(updatable),
    });
  }

  /** Marca como cancelado em vez de apagar: o Sender precisa do registo para
   *  não voltar a enviar caso o contacto seja re-sincronizado. */
  async unsubscribeContact(email: string): Promise<SenderResult<unknown>> {
    return this.request(`/subscribers/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      body: JSON.stringify({ subscriber_status: 'UNSUBSCRIBED' }),
    });
  }
}

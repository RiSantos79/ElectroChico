import { redirect } from "next/navigation";
import { getAuditActions, getAuditEntities, getAuditLogs } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

export const metadata = { title: "Atividade — Backoffice" };

const actionLabels: Record<string, string> = {
  LOGIN_SUCCESS: "Login bem-sucedido",
  LOGIN_FAILED: "Tentativa de login falhada",
  LOGIN_BLOCKED: "Login bloqueado (conta suspensa/desativada)",
  LOGIN_BLOCKED_LOCKOUT: "Login bloqueado (demasiadas tentativas)",
  MFA_ENABLED: "MFA ativado",
  MFA_DISABLED: "MFA desativado",
  PRODUCT_CREATE: "Produto criado",
  PRODUCT_UPDATE: "Produto editado",
  PRODUCT_DELETE: "Produto apagado",
  PRODUCT_DUPLICATE: "Produto duplicado",
  BANNER_CREATE: "Banner criado",
  BANNER_UPDATE: "Banner editado",
  BANNER_DELETE: "Banner apagado",
  CATEGORY_CREATE: "Categoria criada",
  CATEGORY_UPDATE: "Categoria editada",
  BRAND_CREATE: "Marca criada",
  BRAND_UPDATE: "Marca editada",
  COUPON_CREATE: "Cupão criado",
  COUPON_UPDATE: "Cupão editado",
  COUPON_DELETE: "Cupão apagado",
  CONTENT_PAGE_UPDATE: "Página de conteúdo editada",
  SITE_SETTINGS_UPDATE: "Definições do site editadas",
  NEWSLETTER_CAMPAIGN_CREATE: "Campanha de newsletter criada",
  NEWSLETTER_CAMPAIGN_UPDATE: "Campanha de newsletter editada",
  NEWSLETTER_CAMPAIGN_DELETE: "Campanha de newsletter apagada",
  NEWSLETTER_CAMPAIGN_SENT: "Campanha de newsletter enviada",
  GIFT_CARD_REDEEMED: "Cartão presente resgatado",
  ORDER_PAID: "Encomenda paga",
  ORDER_STATUS_UPDATE: "Estado da encomenda alterado",
  ABANDONED_CART_REMINDER_SENT: "Lembrete de carrinho abandonado enviado",
  STAFF_CREATE: "Funcionário criado",
  STAFF_UPDATE: "Funcionário editado",
  STAFF_DELETE: "Funcionário apagado",
  STAFF_STATUS_ACTIVE: "Funcionário reativado",
  STAFF_STATUS_SUSPENDED: "Funcionário suspenso",
  STAFF_STATUS_DISABLED: "Funcionário desativado",
  ROLE_CHANGED: "Role de funcionário alterada",
  PERMISSIONS_CHANGED: "Permissões alteradas",
  PASSWORD_RESET_FORCED: "Reset de password forçado",
  FORCE_LOGOUT: "Logout forçado",
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ actor?: string; action?: string; entity?: string; from?: string; to?: string }>;
}) {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const filters = await searchParams;
  const [logs, actions, entities] = await Promise.all([
    getAuditLogs(token, {
      actor: filters.actor,
      action: filters.action,
      entity: filters.entity,
      from: filters.from ? `${filters.from}T00:00:00` : undefined,
      to: filters.to ? `${filters.to}T23:59:59` : undefined,
    }).catch(() => null),
    getAuditActions(token).catch(() => []),
    getAuditEntities(token).catch(() => []),
  ]);

  if (logs === null) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <p className="text-sm text-muted">Não tem permissão para aceder à auditoria.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Atividade recente</h1>

      <form className="mb-6 grid gap-3 rounded-xl border border-border bg-surface-raised p-4 sm:grid-cols-5">
        <input
          name="actor"
          defaultValue={filters.actor}
          placeholder="Pesquisar por utilizador..."
          className="input-field sm:col-span-2"
        />
        <select name="action" defaultValue={filters.action ?? ""} className="input-field">
          <option value="">Todas as ações</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {actionLabels[a] ?? a}
            </option>
          ))}
        </select>
        <select name="entity" defaultValue={filters.entity ?? ""} className="input-field">
          <option value="">Todos os objetos</option>
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input type="date" name="from" defaultValue={filters.from} className="input-field" />
          <input type="date" name="to" defaultValue={filters.to} className="input-field" />
        </div>
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 sm:col-span-5 sm:w-fit"
        >
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Ação</th>
              <th className="px-4 py-3 font-medium">Quem</th>
              <th className="px-4 py-3 font-medium">Objeto afetado</th>
              <th className="px-4 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-muted">{new Date(log.createdAt).toLocaleString("pt-PT")}</td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {actionLabels[log.action] ?? log.action}
                </td>
                <td className="px-4 py-3 text-muted">{log.actor ?? "—"}</td>
                <td className="px-4 py-3 text-muted">
                  {log.entity ? `${log.entity} ${log.entityId}` : "—"}
                </td>
                <td className="px-4 py-3 text-muted">{log.ip ?? "—"}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Nenhum registo encontrado para estes filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

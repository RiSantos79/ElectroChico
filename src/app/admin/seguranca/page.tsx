import { redirect } from "next/navigation";
import { getMfaStatus, getMySessions, getSecurityAlerts } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { MfaSettings } from "@/components/admin/mfa-settings";
import { parseUserAgent } from "@/lib/user-agent";
import { revokeMySessionAction, revokeOtherSessionsAction } from "@/lib/admin-actions";
import { SecurityAlertsTable } from "@/components/admin/security-alerts-table";

export const metadata = { title: "Segurança — Backoffice" };

export default async function AdminSecurityPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const [{ enabled }, sessions, alerts] = await Promise.all([
    getMfaStatus(token),
    getMySessions(token),
    getSecurityAlerts(token).catch(() => null),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">Segurança</h1>
      <MfaSettings initiallyEnabled={enabled} />

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Alertas de segurança — últimos 7 dias</h2>
        {alerts === null ? (
          <p className="text-sm text-muted">Não tem permissão para ver os alertas de segurança.</p>
        ) : (
          <SecurityAlertsTable alerts={alerts} />
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Sessões ativas</h2>
          {sessions.length > 1 && (
            <form action={revokeOtherSessionsAction}>
              <button type="submit" className="text-sm font-medium text-danger hover:underline">
                Terminar todas as outras
              </button>
            </form>
          )}
        </div>
        <ul className="divide-y divide-border">
          {sessions.map((s) => {
            const { device, browser, os } = parseUserAgent(s.userAgent);
            return (
              <li key={s.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">
                    {device} · {browser} · {os} {s.current && <span className="text-xs text-success">(esta sessão)</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {s.ip ?? "IP desconhecido"} — último acesso {new Date(s.lastSeenAt).toLocaleString("pt-PT")}
                  </p>
                </div>
                {!s.current && (
                  <form action={revokeMySessionAction.bind(null, s.id)}>
                    <button type="submit" className="text-sm font-medium text-danger hover:underline">
                      Terminar
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

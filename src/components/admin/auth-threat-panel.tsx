import type { AuthThreatReport } from "@/lib/api";

// Cores por nível. O verde não é só decoração: é o estado que o gestor tem de
// conseguir ler de relance sem ter de interpretar números.
const tone = {
  OK: { border: "border-success/40", text: "text-success", label: "OK" },
  // Não há token de aviso no tema; o âmbar vem da paleta base do Tailwind.
  AVISO: { border: "border-amber-500/40", text: "text-amber-400", label: "A VIGIAR" },
  ALERTA: { border: "border-danger/50", text: "text-danger", label: "ALERTA" },
} as const;

export function AuthThreatPanel({ report }: { report: AuthThreatReport }) {
  const { border, text, label } = tone[report.nivel];
  const { sprayFalhas, sprayContas, bruteForceFalhas } = report.limiares;

  return (
    <section className={`mb-8 rounded-xl border ${border} bg-surface-raised p-6`}>
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
        Tentativas de acesso ao backoffice (últimos {report.janelaMinutos} min)
      </h2>

      <p className={`mt-2 text-lg font-bold ${text}`}>{label}</p>

      <p className="mt-1 text-sm font-medium text-foreground">
        {report.totalFalhas} falha{report.totalFalhas === 1 ? "" : "s"} · {report.contasAfetadas} conta
        {report.contasAfetadas === 1 ? "" : "s"} · {report.ipsDistintos} IP
        {report.ipsDistintos === 1 ? "" : "s"}
      </p>

      {report.totalFalhas === 0 ? (
        <p className="mt-2 text-sm text-muted">
          Sem falhas de autenticação em contas de backoffice. Limiares: ≥{sprayFalhas} falhas em ≥{sprayContas}{" "}
          contas (password spraying) ou ≥{bruteForceFalhas} falhas na mesma conta (brute force).
        </p>
      ) : (
        <>
          <ul className="mt-3 space-y-1 text-sm">
            {report.porConta.map((conta) => (
              <li key={conta.email} className="flex items-center justify-between gap-4">
                <span className="text-foreground">
                  {conta.email}
                  {conta.bloqueada && (
                    <span className="ml-2 rounded-full bg-danger/20 px-2 py-0.5 text-xs text-danger">bloqueada</span>
                  )}
                </span>
                <span className="text-muted">
                  {conta.falhas} falha{conta.falhas === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>

          {report.topIps.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              Origem: {report.topIps.map((i) => `${i.ip} (${i.falhas})`).join(", ")}
            </p>
          )}
        </>
      )}

      {report.falhasContaDesconhecida > 0 && (
        <p className="mt-3 text-xs text-muted">
          Mais {report.falhasContaDesconhecida} tentativa{report.falhasContaDesconhecida === 1 ? "" : "s"} contra
          endereços que não existem — típico de quem anda a adivinhar nomes de conta. Não contam para os limiares
          acima por não se conseguirem atribuir ao backoffice.
        </p>
      )}

      {report.nivel === "ALERTA" && (
        <p className="mt-3 text-sm text-danger">
          Padrão compatível com um ataque. Verifique o registo de auditoria e considere suspender as contas
          visadas até confirmar a origem.
        </p>
      )}
    </section>
  );
}

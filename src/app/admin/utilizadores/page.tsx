import Link from "next/link";
import { redirect } from "next/navigation";
import { decodeJwt } from "jose";
import { getStaff, ROLE_LABELS } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { deleteStaffAction, forceStaffLogoutAction, updateStaffStatusAction } from "@/lib/admin-actions";
import { CreateStaffForm } from "@/components/admin/create-staff-form";

export const metadata = { title: "Utilizadores — Backoffice" };

const statusLabel: Record<string, string> = { ACTIVE: "Ativo", SUSPENDED: "Suspenso", DISABLED: "Desativado" };
const statusColor: Record<string, string> = {
  ACTIVE: "text-success",
  SUSPENDED: "text-amber-500",
  DISABLED: "text-danger",
};

export default async function AdminStaffPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const currentUserId = decodeJwt<{ sub: string }>(token).sub;
  const staff = await getStaff(token).catch(() => null);
  if (staff === null) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <p className="text-sm text-muted">Não tem permissão para aceder à gestão de utilizadores.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Utilizadores ({staff.length})</h1>
      <p className="mb-6 text-sm text-muted">
        Contas de funcionários com acesso ao backoffice — cada uma com a sua própria role e permissões.
      </p>

      <section className="mb-8 max-w-2xl rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Novo funcionário</h2>
        <CreateStaffForm />
      </section>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Cargo / Role</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Último login</th>
              <th className="px-4 py-3 font-medium">MFA</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.map((s) => {
              const isSelf = s.id === currentUserId;
              return (
                <tr key={s.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {s.name ?? "—"} {isSelf && <span className="text-xs text-muted">(você)</span>}
                    </p>
                    <p className="text-xs text-muted">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {s.jobTitle && <p>{s.jobTitle}</p>}
                    <p>{ROLE_LABELS[s.role]}</p>
                  </td>
                  <td className={`px-4 py-3 font-medium ${statusColor[s.status]}`}>{statusLabel[s.status]}</td>
                  <td className="px-4 py-3 text-muted">
                    {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString("pt-PT") : "Nunca"}
                    {s.lastLoginIp && <p className="text-xs">{s.lastLoginIp}</p>}
                  </td>
                  <td className={`px-4 py-3 font-medium ${s.mfaEnabled ? "text-success" : "text-muted"}`}>
                    {s.mfaEnabled ? "Ativo" : "Inativo"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-3">
                      <Link href={`/admin/utilizadores/${s.id}`} className="font-medium text-accent hover:underline">
                        Editar
                      </Link>
                      {!isSelf && (
                        <>
                          <form action={updateStaffStatusAction.bind(null, s.id, s.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}>
                            <button type="submit" className="font-medium text-accent hover:underline">
                              {s.status === "ACTIVE" ? "Suspender" : "Reativar"}
                            </button>
                          </form>
                          {s.status !== "DISABLED" && (
                            <form action={updateStaffStatusAction.bind(null, s.id, "DISABLED")}>
                              <button type="submit" className="font-medium text-muted hover:underline">
                                Desativar
                              </button>
                            </form>
                          )}
                          <form action={forceStaffLogoutAction.bind(null, s.id)}>
                            <button type="submit" className="font-medium text-accent hover:underline">
                              Forçar logout
                            </button>
                          </form>
                          <form action={deleteStaffAction.bind(null, s.id)}>
                            <button type="submit" className="font-medium text-danger hover:underline">
                              Apagar
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

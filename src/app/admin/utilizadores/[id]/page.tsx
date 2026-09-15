import { notFound, redirect } from "next/navigation";
import { decodeJwt } from "jose";
import {
  ACTIONS,
  ACTION_LABELS,
  getStaff,
  getStaffSessions,
  MODULES,
  MODULE_LABELS,
  ROLE_LABELS,
  STAFF_ROLES,
} from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { parseUserAgent } from "@/lib/user-agent";
import {
  forceStaffLogoutAction,
  forceStaffPasswordResetAction,
  resetStaffPermissionsAction,
  updateStaffAction,
  updateStaffPermissionsAction,
} from "@/lib/admin-actions";

export const metadata = { title: "Editar funcionário — Backoffice" };

export default async function EditStaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tempPassword?: string }>;
}) {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const { id } = await params;
  const { tempPassword } = await searchParams;
  const currentUserId = decodeJwt<{ sub: string }>(token).sub;
  const staff = await getStaff(token).catch(() => null);
  if (staff === null) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <p className="text-sm text-muted">Não tem permissão para aceder à gestão de utilizadores.</p>
      </div>
    );
  }
  const person = staff.find((s) => s.id === id);
  if (!person) notFound();
  const isSelf = person.id === currentUserId;
  const sessions = await getStaffSessions(person.id, token).catch(() => []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-10">
      <h1 className="mb-1 text-2xl font-bold text-foreground">{person.name ?? person.email}</h1>
      <p className="mb-6 text-sm text-muted">{person.email}</p>

      {tempPassword && (
        <div className="mb-6 rounded-xl border border-accent bg-accent/10 p-4 text-sm">
          <p className="font-semibold text-foreground">Nova palavra-passe temporária gerada</p>
          <p className="mt-1 font-mono text-base">{tempPassword}</p>
          <p className="mt-1 text-muted">
            Comunique-a ao funcionário por um canal seguro — não voltará a ser mostrada.
          </p>
        </div>
      )}

      <section className="mb-8 rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Dados</h2>
        <form action={updateStaffAction.bind(null, person.id)} className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Nome
            <input name="name" required defaultValue={person.name ?? ""} className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Role
            <select name="role" defaultValue={person.role} disabled={isSelf} className="input-field">
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Telemóvel
            <input name="phone" defaultValue={person.phone ?? ""} className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Função/Cargo
            <input name="jobTitle" defaultValue={person.jobTitle ?? ""} className="input-field" />
          </label>
          <button
            type="submit"
            className="self-start rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 sm:col-span-2"
          >
            Guardar
          </button>
        </form>
        {isSelf && <p className="mt-2 text-xs text-muted">Não pode alterar a sua própria role.</p>}
      </section>

      <section className="mb-8 rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Segurança</h2>
        <div className="flex flex-wrap gap-3">
          <form action={forceStaffPasswordResetAction.bind(null, person.id)}>
            <button type="submit" className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent">
              Forçar alteração de password
            </button>
          </form>
          {!isSelf && sessions.length > 0 && (
            <form action={forceStaffLogoutAction.bind(null, person.id)}>
              <button type="submit" className="rounded-full border border-border px-4 py-2 text-sm font-medium text-danger hover:border-danger">
                Forçar logout de todas as sessões
              </button>
            </form>
          )}
        </div>

        {sessions.length > 0 ? (
          <ul className="mt-4 divide-y divide-border">
            {sessions.map((s) => {
              const { device, browser, os } = parseUserAgent(s.userAgent);
              return (
                <li key={s.id} className="py-3 text-sm">
                  <p className="font-medium text-foreground">
                    {device} · {browser} · {os}
                  </p>
                  <p className="text-xs text-muted">
                    {s.ip ?? "IP desconhecido"} — último acesso {new Date(s.lastSeenAt).toLocaleString("pt-PT")}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">Sem sessões ativas.</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface-raised p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Permissões</h2>
          <form action={resetStaffPermissionsAction.bind(null, person.id)}>
            <button type="submit" className="text-sm font-medium text-accent hover:underline">
              Repor permissões da role
            </button>
          </form>
        </div>
        {person.permissionOverrides == null && (
          <p className="mb-4 text-xs text-muted">
            A usar as permissões por omissão de &ldquo;{ROLE_LABELS[person.role]}&rdquo;. Marcar/desmarcar qualquer
            caixa abaixo cria uma personalização só para este funcionário.
          </p>
        )}
        {person.permissionOverrides != null && (
          <p className="mb-4 text-xs text-amber-500">
            Este funcionário tem permissões personalizadas, diferentes da role &ldquo;{ROLE_LABELS[person.role]}
            &rdquo;.
          </p>
        )}
        <form action={updateStaffPermissionsAction.bind(null, person.id)}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted">
                <tr>
                  <th className="px-2 py-2 font-medium">Módulo</th>
                  {ACTIONS.map((action) => (
                    <th key={action} className="px-2 py-2 text-center font-medium">
                      {ACTION_LABELS[action]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MODULES.map((moduleKey) => (
                  <tr key={moduleKey}>
                    <td className="px-2 py-2 font-medium text-foreground">{MODULE_LABELS[moduleKey]}</td>
                    {ACTIONS.map((action) => (
                      <td key={action} className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          name={`perm_${moduleKey}_${action}`}
                          defaultChecked={person.effectivePermissions[moduleKey][action]}
                          className="size-4"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Guardar permissões
          </button>
        </form>
      </section>
    </div>
  );
}

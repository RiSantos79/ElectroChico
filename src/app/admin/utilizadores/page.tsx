import { redirect } from "next/navigation";
import { decodeJwt } from "jose";
import { getAuthThreats, getStaff } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { CreateStaffForm } from "@/components/admin/create-staff-form";
import { StaffTable } from "@/components/admin/staff-table";
import { AuthThreatPanel } from "@/components/admin/auth-threat-panel";

export const metadata = { title: "Utilizadores — Backoffice" };

export default async function AdminStaffPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const currentUserId = decodeJwt<{ sub: string }>(token).sub;
  // A deteção é informativa: se falhar, a gestão de utilizadores continua a
  // funcionar sem ela.
  const [staff, threats] = await Promise.all([
    getStaff(token).catch(() => null),
    getAuthThreats(token).catch(() => null),
  ]);
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

      {threats && <AuthThreatPanel report={threats} />}

      <section className="mb-8 max-w-2xl rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Novo funcionário</h2>
        <CreateStaffForm />
      </section>

      <StaffTable staff={staff} currentUserId={currentUserId} />
    </div>
  );
}

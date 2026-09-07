import Link from "next/link";
import { logoutAction } from "@/lib/auth-actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-3 lg:px-10">
        <Link href="/admin/produtos" className="text-sm font-semibold text-foreground">
          ElectroChico — Backoffice
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-muted hover:text-foreground">
            Sair
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}

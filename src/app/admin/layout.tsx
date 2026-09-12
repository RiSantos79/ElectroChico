import Link from "next/link";
import { logoutAction } from "@/lib/auth-actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-3 lg:px-10">
        <div className="flex items-center gap-6">
          <Link href="/admin/produtos" className="text-sm font-semibold text-foreground">
            ElectroChico — Backoffice
          </Link>
          <Link href="/admin/produtos" className="text-sm text-muted hover:text-foreground">
            Produtos
          </Link>
          <Link href="/admin/encomendas" className="text-sm text-muted hover:text-foreground">
            Encomendas
          </Link>
          <Link href="/admin/atividade" className="text-sm text-muted hover:text-foreground">
            Atividade
          </Link>
          <Link href="/admin/mensagens" className="text-sm text-muted hover:text-foreground">
            Mensagens
          </Link>
        </div>
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

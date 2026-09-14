import Link from "next/link";
import { redirect } from "next/navigation";
import { getContentPagesAdmin } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

export const metadata = { title: "Conteúdos — Backoffice" };

export default async function AdminContentPagesPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const pages = await getContentPagesAdmin(token);

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Conteúdos</h1>
      <p className="mb-6 text-sm text-muted">
        Texto das páginas institucionais do site — editar aqui atualiza a página pública de imediato.
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Página</th>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Atualizado</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pages.map((page) => (
              <tr key={page.id}>
                <td className="px-4 py-3 text-muted">/{page.slug}</td>
                <td className="px-4 py-3 font-medium text-foreground">{page.title}</td>
                <td className="px-4 py-3 text-muted">{new Date(page.updatedAt).toLocaleString("pt-PT")}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/conteudos/${page.slug}`} className="font-medium text-accent hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

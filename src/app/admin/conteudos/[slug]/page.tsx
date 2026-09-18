import { notFound, redirect } from "next/navigation";
import { getAiStatus, getContentPage } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { updateContentPageAction } from "@/lib/admin-actions";

export const metadata = { title: "Editar conteúdo — Backoffice" };

export default async function EditContentPagePage({ params }: { params: Promise<{ slug: string }> }) {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const { slug } = await params;
  const [page, ai] = await Promise.all([
    getContentPage(slug),
    getAiStatus(token).catch(() => ({ enabled: false })),
  ]);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">Editar: /{slug}</h1>
      <form action={updateContentPageAction.bind(null, slug)} className="space-y-6">
        <label className="flex flex-col gap-1 text-sm">
          Título da página
          <input name="title" required defaultValue={page.title} className="input-field" />
        </label>
        <div className="flex flex-col gap-1 text-sm">
          Conteúdo
          <RichTextEditor
            name="body"
            defaultValue={page.body}
            ai={ai.enabled}
            aiActions={[
              {
                feature: "MARKETING_LANDING_PAGE",
                label: "Gerar landing page",
                placeholder: "Tema da página (ex.: campanha de climatização de verão)",
              },
              { feature: "TEXT_IMPROVE", label: "Melhorar", needsText: true },
              { feature: "TEXT_SPELLCHECK", label: "Corrigir ortografia", needsText: true },
            ]}
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90"
        >
          Guardar alterações
        </button>
      </form>
    </div>
  );
}

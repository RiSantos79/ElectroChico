import { redirect } from "next/navigation";
import { getAiStatus, getBannersAdmin } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { AiTopicFillButton } from "@/components/admin/ai-button";
import {
  createBannerAction,
  deleteBannerAction,
  moveBannerAction,
  toggleBannerAction,
  updateBannerAction,
} from "@/lib/admin-actions";

export const metadata = { title: "Banners — Backoffice" };

export default async function AdminBannersPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const [banners, ai] = await Promise.all([
    getBannersAdmin(token),
    getAiStatus(token).catch(() => ({ enabled: false })),
  ]);

  return (
    <div className="px-6 py-8 lg:px-10">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Banners</h1>
      <p className="mb-6 text-sm text-muted">
        Blocos em destaque no topo da página inicial. O primeiro banner ativo aparece em tamanho grande.
      </p>

      <section className="mb-8 max-w-2xl rounded-xl border border-border bg-surface-raised p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Novo banner</h2>
        <form action={createBannerAction} className="grid gap-4 sm:grid-cols-2">
          {ai.enabled && (
            <div className="sm:col-span-2">
              <AiTopicFillButton
                feature="MARKETING_BANNER"
                label="Gerar texto"
                placeholder="Tema do banner (ex.: campanha de arcas congeladoras)"
                fields={{ "Título": "title", "Subtítulo": "description", "Botão": "ctaLabel" }}
              />
            </div>
          )}
          <label className="flex flex-col gap-1 text-sm">
            Tamanho
            <select name="size" defaultValue="LARGE" className="input-field">
              <option value="LARGE">Grande</option>
              <option value="SMALL">Pequeno</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Link de destino
            <input name="linkUrl" required placeholder="/catalogo/eletrodomesticos" className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Texto pequeno (opcional)
            <input name="eyebrow" className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Texto do botão (opcional)
            <input name="ctaLabel" className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Título
            <input name="title" required className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Descrição (opcional)
            <textarea name="description" rows={2} className="input-field" />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Imagem de fundo (opcional)
            <input type="file" name="image" accept="image/*" className="input-field" />
          </label>
          <button
            type="submit"
            className="self-start rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 sm:col-span-2"
          >
            Criar banner
          </button>
        </form>
      </section>

      <div className="flex flex-col gap-4">
        {banners.map((banner, i) => (
          <form
            key={banner.id}
            action={updateBannerAction.bind(null, banner.id)}
            className="grid gap-4 rounded-xl border border-border bg-surface-raised p-4 sm:grid-cols-2"
          >
            <div className="flex items-center gap-2 sm:col-span-2">
              <div className="flex flex-col">
                <button
                  type="submit"
                  formAction={moveBannerAction.bind(null, banner.id, "up")}
                  disabled={i === 0}
                  className="text-muted hover:text-accent disabled:opacity-30"
                  aria-label="Mover para cima"
                >
                  ▲
                </button>
                <button
                  type="submit"
                  formAction={moveBannerAction.bind(null, banner.id, "down")}
                  disabled={i === banners.length - 1}
                  className="text-muted hover:text-accent disabled:opacity-30"
                  aria-label="Mover para baixo"
                >
                  ▼
                </button>
              </div>
              {banner.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- imagem do banner vinda da API
                <img src={banner.imageUrl} alt="" className="h-12 w-20 rounded-lg object-cover" />
              )}
              <span className={`text-sm font-medium ${banner.active ? "text-success" : "text-muted"}`}>
                {banner.active ? "Ativo" : "Inativo"}
              </span>
              <div className="ml-auto flex gap-3">
                <button
                  type="submit"
                  formAction={toggleBannerAction.bind(null, banner.id, !banner.active)}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {banner.active ? "Desativar" : "Ativar"}
                </button>
                <button
                  type="submit"
                  formAction={deleteBannerAction.bind(null, banner.id)}
                  className="text-sm font-medium text-danger hover:underline"
                >
                  Apagar
                </button>
              </div>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              Tamanho
              <select name="size" defaultValue={banner.size} className="input-field">
                <option value="LARGE">Grande</option>
                <option value="SMALL">Pequeno</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Link de destino
              <input name="linkUrl" defaultValue={banner.linkUrl} required className="input-field" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Texto pequeno (opcional)
              <input name="eyebrow" defaultValue={banner.eyebrow ?? ""} className="input-field" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Texto do botão (opcional)
              <input name="ctaLabel" defaultValue={banner.ctaLabel ?? ""} className="input-field" />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Título
              <input name="title" defaultValue={banner.title} required className="input-field" />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Descrição (opcional)
              <textarea name="description" rows={2} defaultValue={banner.description ?? ""} className="input-field" />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Imagem de fundo (substituir, opcional)
              <input type="file" name="image" accept="image/*" className="input-field" />
            </label>
            <button
              type="submit"
              className="self-start text-sm font-medium text-accent hover:underline sm:col-span-2"
            >
              Guardar alterações
            </button>
          </form>
        ))}
        {banners.length === 0 && (
          <p className="rounded-xl border border-border bg-surface-raised p-8 text-center text-sm text-muted">
            Ainda não há banners criados.
          </p>
        )}
      </div>
    </div>
  );
}

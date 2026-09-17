import Link from "next/link";
import { redirect } from "next/navigation";
import { getSiteSettings } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { updateSiteSettingsAction } from "@/lib/admin-actions";

export const metadata = { title: "Definições — Backoffice" };

export default async function AdminSiteSettingsPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-8 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">Definições do site</h1>

      <Link
        href="/admin/definicoes/ia"
        className="flex items-center justify-between rounded-xl border border-border bg-surface-raised p-6 hover:bg-surface"
      >
        <span>
          <span className="block text-lg font-semibold text-foreground">Inteligência Artificial</span>
          <span className="block text-xs text-muted">
            Opcional — ativar geração de textos, SEO e FAQs com uma chave de API própria.
          </span>
        </span>
        <span aria-hidden className="text-accent">
          →
        </span>
      </Link>

      <form action={updateSiteSettingsAction} className="space-y-8">
        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Dados da empresa</h2>
          <p className="mb-4 text-xs text-muted">
            Aparece no rodapé de todo o site — é a informação legal exigida para lojas online em Portugal.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Nome legal da empresa
              <input name="companyName" defaultValue={settings.companyName} className="input-field" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              NIF
              <input name="taxId" defaultValue={settings.taxId} className="input-field" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Telefone
              <input name="phone" defaultValue={settings.phone} className="input-field" />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Morada
              <input name="address" defaultValue={settings.address} className="input-field" />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Email de contacto
              <input name="email" type="email" defaultValue={settings.email} className="input-field" />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Redes sociais</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Facebook (URL)
              <input name="facebookUrl" defaultValue={settings.facebookUrl} className="input-field" />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Instagram (URL)
              <input name="instagramUrl" defaultValue={settings.instagramUrl} className="input-field" />
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Blocos de confiança do rodapé</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="space-y-2 rounded-lg border border-border p-3">
                <label className="flex flex-col gap-1 text-sm">
                  Título {n}
                  <input
                    name={`trustBadge${n}Title`}
                    defaultValue={settings[`trustBadge${n}Title` as keyof typeof settings]}
                    className="input-field"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Descrição {n}
                  <input
                    name={`trustBadge${n}Desc`}
                    defaultValue={settings[`trustBadge${n}Desc` as keyof typeof settings]}
                    className="input-field"
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Rodapé</h2>
          <label className="flex flex-col gap-1 text-sm">
            Texto de copyright
            <input name="copyrightText" defaultValue={settings.copyrightText} className="input-field" />
          </label>
        </section>

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

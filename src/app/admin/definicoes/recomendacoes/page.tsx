import Link from "next/link";
import { redirect } from "next/navigation";
import { getRecommendationSettings } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { RecommendationSettingsForm } from "@/components/admin/recommendation-settings-form";

export const metadata = { title: "Recomendações — Backoffice" };

export default async function RecommendationSettingsPage() {
  const token = await getSessionToken();
  if (!token) redirect("/admin/login");

  const settings = await getRecommendationSettings(token).catch(() => null);

  if (!settings) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Recomendações</h1>
        <p className="text-sm text-muted">Esta configuração está reservada a super administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-8 lg:px-10">
      <div>
        <Link href="/admin/definicoes" className="text-sm font-medium text-accent hover:underline">
          ← Definições
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">Recomendações de produtos</h1>
        <p className="mt-1 text-sm text-muted">
          Controla os blocos &ldquo;Produtos relacionados&rdquo; e &ldquo;Frequentemente comprados em
          conjunto&rdquo; na ficha de produto.
        </p>
      </div>

      <div className="max-w-3xl">
        <RecommendationSettingsForm settings={settings} />
      </div>
    </div>
  );
}

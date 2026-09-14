import { getContentPage } from "@/lib/api";

export const metadata = {
  title: "Entregas",
  description: "Prazos e custos de envio da ElectroChico — entregas em Portugal Continental e Ilhas.",
};

const fallbackBody =
  "<h2>Prazos de entrega</h2><p>Encomendas em stock são expedidas em 24 a 48h úteis em Portugal Continental. Ilhas: 3 a 5 dias úteis.</p>";

export default async function DeliveryPage() {
  const page = await getContentPage("entregas");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">{page?.title ?? "Entregas"}</h1>
      <div
        className="prose-sm mt-8 max-w-none space-y-6 text-sm leading-relaxed text-muted [&_a]:text-accent [&_a]:underline [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: page?.body ?? fallbackBody }}
      />
    </div>
  );
}

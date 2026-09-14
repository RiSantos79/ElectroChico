import { QuoteForm } from "@/components/quote-form";
import { getCategories, getContentPage } from "@/lib/api";

export const metadata = {
  title: "Pedido de orçamento",
  description: "Peça um orçamento à ElectroChico para instalação ou compra em quantidade de eletrodomésticos.",
};

const fallbackBody =
  "<p>Precisa de um orçamento para instalação ou compra em quantidade? Conte-nos o que procura.</p>";

export default async function QuotePage() {
  const [categories, page] = await Promise.all([getCategories(), getContentPage("orcamentos")]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">{page?.title ?? "Pedido de orçamento"}</h1>
      <div
        className="prose-sm mt-2 max-w-none text-sm text-muted [&_a]:text-accent [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: page?.body ?? fallbackBody }}
      />
      <QuoteForm categories={categories} />
    </div>
  );
}

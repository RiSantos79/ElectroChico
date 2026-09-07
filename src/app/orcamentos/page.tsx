import { QuoteForm } from "@/components/quote-form";
import { getCategories } from "@/lib/api";

export default async function QuotePage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">Pedido de orçamento</h1>
      <p className="mt-2 text-sm text-muted">
        Precisa de um orçamento para instalação ou compra em quantidade? Conte-nos o que procura.
      </p>
      <QuoteForm categories={categories} />
    </div>
  );
}

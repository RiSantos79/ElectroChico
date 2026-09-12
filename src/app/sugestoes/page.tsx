import { SuggestionForm } from "@/components/suggestion-form";

export const metadata = { title: "Sugestões — ElectroChico" };

export default function SuggestionsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Sugestões</h1>
      <SuggestionForm />
    </div>
  );
}

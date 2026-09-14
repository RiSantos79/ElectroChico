import { getContentPage } from "@/lib/api";

export const metadata = { title: "Política de Privacidade" };

const fallbackBody =
  "<h2>O que guardamos</h2><p>Consulte a nossa política de privacidade completa em breve.</p>";

export default async function PrivacyPage() {
  const page = await getContentPage("privacidade");

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">{page?.title ?? "Política de Privacidade"}</h1>
      <div
        className="prose-sm mt-8 max-w-none space-y-6 text-sm leading-relaxed text-muted [&_a]:text-accent [&_a]:underline [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: page?.body ?? fallbackBody }}
      />
    </div>
  );
}

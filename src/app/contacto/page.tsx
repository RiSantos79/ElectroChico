import { getContentPage } from "@/lib/api";
import { ContactForm } from "@/components/contact-form";

export const metadata = {
  title: "Contacto",
  description: "Fale com a equipa da ElectroChico — tiramos as suas dúvidas o mais rápido possível.",
};

const fallbackBody =
  "<p>Tem alguma dúvida? Preencha o formulário e a nossa equipa responde o mais rápido possível.</p>";

export default async function ContactPage() {
  const page = await getContentPage("contacto");

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 lg:px-10">
      <h1 className="text-2xl font-bold text-foreground">{page?.title ?? "Contacto"}</h1>
      <div
        className="prose-sm mt-2 max-w-none text-sm text-muted [&_a]:text-accent [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: page?.body ?? fallbackBody }}
      />
      <ContactForm />
    </div>
  );
}

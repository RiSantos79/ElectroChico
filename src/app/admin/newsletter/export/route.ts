import { getNewsletterSubscribers, type NewsletterSubscriber } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import { csvResponse, toCsv } from "@/lib/csv";

export async function GET() {
  const token = await getSessionToken();
  if (!token) return new Response("Não autenticado", { status: 401 });

  const subscribers = await getNewsletterSubscribers(token, true);
  const csv = toCsv<NewsletterSubscriber>(subscribers, [
    { label: "Email", value: (s) => s.email },
    { label: "Nome", value: (s) => s.name ?? "" },
    { label: "Subscrito em", value: (s) => new Date(s.subscribedAt).toLocaleDateString("pt-PT") },
    { label: "Estado", value: (s) => (s.unsubscribedAt ? "Cancelado" : "Ativo") },
  ]);

  return csvResponse(csv, `newsletter-subscritores-${new Date().toISOString().slice(0, 10)}.csv`);
}

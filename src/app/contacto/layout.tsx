import type { Metadata } from "next";

// A página em si é um Client Component (tem estado do formulário) — os
// metadados têm de vir de um layout Server Component neste segmento.
export const metadata: Metadata = {
  title: "Contacto",
  description: "Fale com a equipa da ElectroChico — tiramos as suas dúvidas o mais rápido possível.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// O backoffice tem o seu próprio cabeçalho (AdminLayout) — sem isto, o
// cabeçalho da loja (com a sessão do CLIENTE, "A minha conta", carrinho, etc.)
// aparecia sempre por cima, mesmo dentro do /admin, o que parecia (sem ser)
// estar "com a conta errada" no backoffice.
export function ShopChrome({
  header,
  footer,
  cookieConsent,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  cookieConsent: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      {header}
      {children}
      {footer}
      {cookieConsent}
    </>
  );
}

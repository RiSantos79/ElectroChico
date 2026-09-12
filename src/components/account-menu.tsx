"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { customerLogoutAction } from "@/lib/customer-auth-actions";

const links: { href: string; label: string }[] = [
  { href: "/conta", label: "A minha conta" },
  { href: "/conta/encomendas", label: "As minhas Encomendas" },
  { href: "/catalogo/cartoes-presente", label: "Cartões Presente" },
  { href: "/conta/faturacao", label: "Facturação" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/conta/mensagens", label: "Mensagens" },
  { href: "/conta/password", label: "Modificar Password" },
  { href: "/conta/rma", label: "Pedido Devolução ou RMA" },
  { href: "/sugestoes", label: "Sugestões" },
];

export function AccountMenu({ customerName }: { customerName?: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="A minha conta"
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-full border border-border hover:bg-surface"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4.5">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20c1.6-3.6 4.2-5.4 7-5.4S17.4 16.4 19 20" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-surface-raised py-2 shadow-lg">
          <div className="border-b border-border px-4 pb-2 text-sm font-medium text-foreground">
            {customerName ? `Bem-vindo, ${customerName}` : "Entrar ou criar conta"}
          </div>
          <nav className="flex flex-col py-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm text-muted hover:bg-surface hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {customerName ? (
            <form action={customerLogoutAction} className="border-t border-border pt-1">
              <button
                type="submit"
                className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-surface"
              >
                Sair
              </button>
            </form>
          ) : (
            <div className="border-t border-border pt-1">
              <Link
                href="/conta"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-accent hover:bg-surface"
              >
                Entrar / Criar conta
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth-actions";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "size-5 shrink-0",
};

const NAV_ITEMS: { href: string; label: string; icon: React.ReactNode }[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/produtos",
    label: "Produtos",
    icon: (
      <svg {...iconProps}>
        <path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z" />
        <path d="M3 7.5v9L12 21l9-4.5v-9" />
        <path d="M12 12v9" />
      </svg>
    ),
  },
  {
    href: "/admin/marcas",
    label: "Marcas",
    icon: (
      <svg {...iconProps}>
        <path d="M20.6 12.6 12 21 3 12l8.6-8.6A2 2 0 0 1 13 3H19a2 2 0 0 1 2 2v6a2 2 0 0 1-.4 1.6Z" />
        <circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/admin/categorias",
    label: "Categorias",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3 2 8l10 5 10-5-10-5Z" />
        <path d="M2 13l10 5 10-5" />
      </svg>
    ),
  },
  {
    href: "/admin/encomendas",
    label: "Encomendas",
    icon: (
      <svg {...iconProps}>
        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    ),
  },
  {
    href: "/admin/stock",
    label: "Stock",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="10" width="7" height="7" />
        <rect x="14" y="10" width="7" height="7" />
        <rect x="8.5" y="3" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/admin/cupoes",
    label: "Cupões",
    icon: (
      <svg {...iconProps}>
        <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
        <path d="M9 6v12" strokeDasharray="2 2.5" />
      </svg>
    ),
  },
  {
    href: "/admin/carrinhos-abandonados",
    label: "Carrinhos Abandonados",
    icon: (
      <svg {...iconProps}>
        <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" />
        <circle cx="9.5" cy="20" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="17.5" cy="20" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/admin/seguranca",
    label: "Segurança",
    icon: (
      <svg {...iconProps}>
        <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z" />
      </svg>
    ),
  },
  {
    href: "/admin/newsletter",
    label: "Newsletter",
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="m3 6 9 7 9-7" />
      </svg>
    ),
  },
  {
    href: "/admin/definicoes",
    label: "Definições",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      </svg>
    ),
  },
  {
    href: "/admin/conteudos",
    label: "Conteúdos",
    icon: (
      <svg {...iconProps}>
        <path d="M7 2h8l4 4v16H7Z" />
        <path d="M15 2v4h4" />
        <path d="M9 12h6M9 16h6" />
      </svg>
    ),
  },
  {
    href: "/admin/banners",
    label: "Banners",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <circle cx="8" cy="9" r="1.4" fill="currentColor" stroke="none" />
        <path d="m4 16 5-5 4 4 3-3 4 4" />
      </svg>
    ),
  },
  {
    href: "/admin/utilizadores",
    label: "Utilizadores",
    icon: (
      <svg {...iconProps}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <circle cx="17" cy="8" r="2.3" />
        <path d="M14.7 14.2c2.5.5 4.3 2.8 4.3 5.8" />
      </svg>
    ),
  },
  {
    href: "/admin/clientes",
    label: "Clientes",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
    ),
  },
  {
    href: "/admin/atividade",
    label: "Atividade",
    icon: (
      <svg {...iconProps}>
        <path d="M3 12h4l2-7 4 14 2-7h6" />
      </svg>
    ),
  },
  {
    href: "/admin/mensagens",
    label: "Mensagens",
    icon: (
      <svg {...iconProps}>
        <path d="M4 4h16v11H8l-4 4Z" />
      </svg>
    ),
  },
  {
    href: "/admin/cartoes-presente",
    label: "Cartões Presente",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="8" width="18" height="13" />
        <path d="M3 8h18v4H3Z" />
        <path d="M12 8v13" />
        <path d="M12 8c-1.5-4-6-4-6-1s3 1 6 1Zm0 0c1.5-4 6-4 6-1s-3 1-6 1Z" />
      </svg>
    ),
  },
  {
    href: "/admin/assistente",
    label: "Assistente IA",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9Z" strokeLinejoin="round" />
        <path d="M18 15l.9 2.1 2.1.9-2.1.9L18 21l-.9-2.1-2.1-.9 2.1-.9Z" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  return (
    <nav
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-border bg-surface transition-[width] duration-200 ${
        expanded ? "w-64" : "w-16"
      }`}
    >
      <Link href="/admin" className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
          EC
        </span>
        {expanded && (
          <span className="whitespace-nowrap text-sm font-semibold text-foreground">ElectroChico — Backoffice</span>
        )}
      </Link>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-[1.15rem] py-2.5 text-sm whitespace-nowrap ${
                active ? "bg-accent/10 font-medium text-accent" : "text-muted hover:bg-surface-raised hover:text-foreground"
              }`}
            >
              {item.icon}
              {expanded && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      <form action={logoutAction} className="shrink-0 border-t border-border p-2">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-surface-raised hover:text-foreground"
        >
          <svg {...iconProps}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          {expanded && <span className="whitespace-nowrap">Sair</span>}
        </button>
      </form>
    </nav>
  );
}

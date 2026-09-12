"use client";

import Link from "next/link";
import { useState } from "react";
import { promoLinks, topNavLinks, type Category } from "@/data/catalog";
import { GIFT_CARD_CATEGORY_SLUG } from "@/lib/gift-cards";

export function MegaMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState<string | null>(null);
  // Cartões Presente já tem destaque próprio em promoLinks, ao lado das
  // Ofertas Flash — não faz sentido repetir como categoria de compras normal.
  const shoppableCategories = categories.filter((c) => c.slug !== GIFT_CARD_CATEGORY_SLUG);

  return (
    <nav className="hidden border-t border-border md:block" onMouseLeave={() => setOpen(null)}>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3 text-sm lg:px-10">
        {promoLinks.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="inline-flex items-center gap-1.5 font-semibold text-danger">
              {link.label}
              <span className="rounded bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">HOT</span>
            </Link>
          </li>
        ))}

        {shoppableCategories.map((category) => (
          <li key={category.slug} className="relative shrink-0" onMouseEnter={() => setOpen(category.slug)}>
            <Link
              href={`/catalogo/${category.slug}`}
              className="inline-flex items-center gap-1 font-medium text-foreground/90 hover:text-accent"
            >
              {category.name}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            {open === category.slug && (
              <div className="absolute left-0 top-full z-50 w-[640px] border border-border bg-surface-raised p-4 shadow-lg">
                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                  {category.subcategories.map((sub) => (
                    <Link
                      key={sub}
                      href={`/catalogo/${category.slug}?sub=${encodeURIComponent(sub)}`}
                      className="rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-surface hover:text-accent"
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}

        <li className="ml-auto flex shrink-0 items-center gap-5 border-l border-border pl-5">
          {topNavLinks.map((link) => (
            <Link key={link.href} href={link.href} className="font-medium text-foreground/90 hover:text-accent">
              {link.label}
            </Link>
          ))}
        </li>
      </ul>
    </nav>
  );
}

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { MegaMenu } from "@/components/mega-menu";
import { HeaderIcons } from "@/components/header-icons";
import type { Category } from "@/data/catalog";

export function Header({ categories }: { categories: Category[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex items-center gap-4 px-6 py-3 lg:px-10">
        <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
          Electro<span className="text-accent">Chico</span>
        </Link>

        <div className="mx-auto hidden max-w-xl flex-1 md:block">
          <label className="relative block">
            <span className="sr-only">Pesquisar produtos</span>
            <input
              type="search"
              placeholder="Pesquisar produtos, marcas e categorias..."
              className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <HeaderIcons />
        </div>
      </div>
      <MegaMenu categories={categories} />
    </header>
  );
}

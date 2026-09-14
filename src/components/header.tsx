import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { IvaToggle } from "@/components/iva-toggle";
import { MegaMenu } from "@/components/mega-menu";
import { HeaderIcons } from "@/components/header-icons";
import { HeaderSearch } from "@/components/header-search";
import type { Category } from "@/data/catalog";

export function Header({
  categories,
  customerName,
}: {
  categories: Category[];
  customerName?: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex items-center gap-4 px-6 py-3 lg:px-10">
        <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
          Electro<span className="text-accent">Chico</span>
        </Link>

        <HeaderSearch />

        <div className="ml-auto flex items-center gap-2">
          <IvaToggle />
          <ThemeToggle />
          <HeaderIcons customerName={customerName} />
        </div>
      </div>
      <MegaMenu categories={categories} />
    </header>
  );
}

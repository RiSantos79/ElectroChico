import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartProvider } from "@/lib/cart-context";
import { FavoritesProvider } from "@/lib/favorites-context";
import { getCategories } from "@/lib/api";
import { CookieConsent } from "@/components/cookie-consent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ElectroChico — Eletrodomésticos, TV e Climatização",
  description:
    "Loja online de eletrodomésticos, televisões, climatização e pequenos domésticos com os melhores preços e entrega rápida.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const categories = await getCategories().catch(() => []);

  return (
    <html
      lang="pt"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <FavoritesProvider>
            <CartProvider>
              <Header categories={categories} />
              <main className="flex-1">{children}</main>
              <Footer />
              <CookieConsent />
            </CartProvider>
          </FavoritesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TickerTape } from "@/components/feedback/TickerTape";
import { ItemPreviewProvider } from "@/components/item/ItemPreviewProvider";

export const metadata: Metadata = {
  title: "NeonMarket — Arsenal of Myths",
  description: "Cyberpunk × mythology marketplace, 2185.",
};

const TICKER_ITEMS = [
  "MJOLNIR.exe sold for ⟁ 4.2K",
  "ICE-7 detected sector 9",
  "VATICAN-VAULT-7 listed HOLY-GRAIL at ⟁ 1.5M",
  "NETWORK STABLE · 12 ms",
  "AETHER.pulse-rifle restocked × 10",
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-cp-theme="dark">
      <body className="cp-root cp-grid-bg cp-scanlines">
        <ItemPreviewProvider>
          <Header />
          <TickerTape items={TICKER_ITEMS} />
          <main className="cp-container py-8 min-h-[60vh]">{children}</main>
          <Footer />
        </ItemPreviewProvider>
      </body>
    </html>
  );
}

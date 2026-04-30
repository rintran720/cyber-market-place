import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeonMarket — Arsenal of Myths",
  description: "Cyberpunk × mythology marketplace, 2185.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-cp-theme="dark">
      <body className="cp-root cp-grid-bg cp-scanlines">{children}</body>
    </html>
  );
}

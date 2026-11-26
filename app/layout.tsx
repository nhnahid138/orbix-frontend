import type { Metadata } from "next";
import "./globals.css";
import "./gadget-home.css";
import "./store-footer.css";
import "./store-theme.css";
import { BrandingProvider } from "./store-branding";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Orbix — Gadgets for what’s next",
  description:
    "Shop smartphones, laptops, audio, wearables and everyday gadgets at Orbix.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><Providers><BrandingProvider>{children}</BrandingProvider></Providers></body>
    </html>
  );
}

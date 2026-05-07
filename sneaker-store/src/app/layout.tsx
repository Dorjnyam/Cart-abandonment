import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Space_Grotesk, DM_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Providers from "../components/Providers";
import CaCommerceSync from "../components/CaCommerceSync";

export const metadata: Metadata = {
  title: "KICKLAB",
  description: "Premium sneaker vault experience",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const brand = Space_Grotesk({ subsets: ["latin"], variable: "--font-brand" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

/** Use `||` so empty string falls through (e.g. `NEXT_PUBLIC_OBSERVER_URL=`). */
const OBSERVER_URL =
  process.env.NEXT_PUBLIC_OBSERVER_URL?.trim() ||
  "http://localhost:8001";

/** T1 data-ca clicks require tk_full_*; T2/T3 use tk_smart_* or tk_basic_*. */
const OBSERVER_SNIPPET_KEY =
  process.env.NEXT_PUBLIC_OBSERVER_SNIPPET_KEY?.trim() ||
  "tk_full_demo_mvp";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className={`${inter.variable} ${brand.variable} ${mono.variable} app-shell min-h-screen flex flex-col`}>
        <Script id="observer-config" strategy="beforeInteractive">
          {`window.__OBSERVER_BASE__=${JSON.stringify(OBSERVER_URL)};window.__OBSERVER_API_KEY__=${JSON.stringify(OBSERVER_SNIPPET_KEY)};`}
        </Script>
        <Providers>
          <CaCommerceSync />
          <Navbar />
          <main className="route-fade flex-1">{children}</main>
          <Footer />
          <div className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 gap-2 border-t border-zinc-800 bg-black/80 px-3 py-2 backdrop-blur md:hidden">
            <a href="/" className="btn-secondary py-2 text-center text-xs">Home</a>
            <a href="/search" className="btn-secondary py-2 text-center text-xs">Search</a>
            <a href="/cart" className="btn-secondary py-2 text-center text-xs">Cart</a>
            <a href="/account" className="btn-secondary py-2 text-center text-xs">Profile</a>
          </div>
        </Providers>
        <Script
          src={`${OBSERVER_URL}/static/snippet/track.js?key=${encodeURIComponent(OBSERVER_SNIPPET_KEY)}`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

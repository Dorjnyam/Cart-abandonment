import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/editorial/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cart Analytics — Cart Abandonment Intelligence",
  description: "Refined analytics for cart abandonment, ML risk scoring, and recovery recommendations.",
};

/* Theme-г first paint-ээс өмнө сэргээж flash үүсгэхгүй. Анхны утга нь light. */
const themeScript = `
(function(){
  var stored = localStorage.getItem('cart_analytic_theme');
  var theme = stored === 'light' || stored === 'dark'
    ? stored
    : 'light';
  document.documentElement.classList.remove('light','dark');
  document.documentElement.classList.add(theme);
  document.documentElement.style.colorScheme = theme;
})();
`.trim();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`light ${fraunces.variable} ${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Theme script нь first paint-ээс өмнө ажиллах шаардлагатай. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

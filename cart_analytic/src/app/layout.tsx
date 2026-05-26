import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/editorial/AuthContext";
import { LanguageProvider } from "@/components/editorial/LanguageContext";
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
  title: "Cart Analytics — Сагс орхилтын аналитик",
  description: "Сагс орхилт, ML эрсдэлийн оноо, сэргээх зөвлөмжийн аналитик самбар.",
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
      lang="mn"
      className={`light ${fraunces.variable} ${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Theme script нь first paint-ээс өмнө ажиллах шаардлагатай. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <LanguageProvider>
            <ToastProvider>{children}</ToastProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

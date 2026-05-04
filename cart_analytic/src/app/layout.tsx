import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/editorial/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "CartAnalytics",
  description: "Cart analytics dashboard",
};

/* Restore theme before first paint to avoid flash */
const themeScript = `
(function(){
  var stored = localStorage.getItem('cart_analytic_theme');
  var theme = stored === 'light' || stored === 'dark'
    ? stored
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark');
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
    <html lang="mn" className="dark" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: theme script must run before paint */}
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

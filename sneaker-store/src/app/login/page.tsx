"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import VaultBackdrop from "@/components/layout/VaultBackdrop";

const DEMO_EMAIL = "mjldoko11@gmail.com";
const DEMO_PASSWORD = "Doko0204$";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <VaultBackdrop />
      <header className="relative z-10 flex w-full items-start justify-between px-6 py-6 md:px-10">
        <div>
          <span className="font-headline text-2xl font-black tracking-tighter text-[#d4fe42]">THE_VAULT</span>
          <p className="mt-1 font-headline text-[10px] uppercase tracking-[0.3em] text-[#adaaaa]">Secure customer access</p>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="font-headline text-[10px] uppercase tracking-widest text-[#d4fe42]">System status</p>
            <p className="font-headline text-[10px] uppercase text-[#adaaaa]">Encrypted session</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-[#d4fe42] shadow-[0_0_8px_#d4fe42]" />
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-xl px-6 pb-24 pt-4">
        <div className="space-y-10">
          <div>
            <h1 className="font-headline text-4xl font-bold tracking-tight text-white md:text-5xl">
              <span className="block">VAULT_ACCESS</span>
              <span className="block text-[#adaaaa]/40">SIGN IN TO CONTINUE</span>
            </h1>
            <div className="mt-3 h-px w-24 bg-[#d4fe42]/40" />
          </div>

          <form
            className="space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              const res = await signIn("credentials", { email, password, redirect: false });
              if (res?.error) {
                setError("Invalid credentials.");
                return;
              }
              const session = await getSession();
              const role = (session?.user as { role?: string } | undefined)?.role;
              const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
              const safeCallback = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : null;
              window.location.href = safeCallback ?? (role === "admin" ? "/admin" : "/account");
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="mb-2 ml-1 block font-headline text-[10px] font-bold uppercase tracking-widest text-[#adaaaa]">
                  Email address
                </label>
                <div className="relative flex items-center rounded border border-[#494847]/30 bg-[#131313] px-4 transition-shadow focus-within:shadow-[0_0_15px_rgba(212,254,66,0.1)]">
                  <span className="mr-3 text-sm text-[#adaaaa]" aria-hidden="true">@</span>
                  <input
                    className="w-full border-0 bg-transparent py-4 font-headline text-sm tracking-wider text-[#d4fe42] placeholder:text-[#777575] focus:outline-none"
                    placeholder={DEMO_EMAIL}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 ml-1 block font-headline text-[10px] font-bold uppercase tracking-widest text-[#adaaaa]">
                  Password
                </label>
                <div className="relative flex items-center rounded border border-[#494847]/30 bg-[#131313] px-4 transition-shadow focus-within:shadow-[0_0_15px_rgba(212,254,66,0.1)]">
                  <span className="mr-3 text-xs font-bold text-[#adaaaa]" aria-hidden="true">KEY</span>
                  <input
                    className="w-full border-0 bg-transparent py-4 font-headline text-sm tracking-widest text-[#d4fe42] placeholder:text-[#777575] focus:outline-none"
                    placeholder="••••••••••••"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary w-full px-4 py-3 text-xs"
              onClick={() => {
                setEmail(DEMO_EMAIL);
                setPassword(DEMO_PASSWORD);
                setError(null);
              }}
            >
              Use demo customer
            </button>
            {error && <p className="text-sm text-[#ff7351]">{error}</p>}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 bg-[#d4fe42] py-4 font-headline text-sm font-black uppercase tracking-[0.2em] text-[#4c5f00] shadow-[0_0_25px_rgba(212,254,66,0.2)] transition-transform active:scale-[0.98]"
            >
              Execute authorization
              <span className="text-lg" aria-hidden="true">→</span>
            </button>
            <div className="flex items-center justify-between pt-2">
              <a href="/reset-password" className="font-headline text-[10px] uppercase tracking-widest text-[#adaaaa] hover:text-[#d4fe42]">
                Reset password
              </a>
              <a href="/" className="font-headline text-[10px] uppercase tracking-widest text-[#adaaaa] hover:text-[#d4fe42]">
                Storefront
              </a>
            </div>
          </form>
        </div>
      </main>

      <footer className="relative z-10 flex flex-col items-center justify-between gap-4 px-8 py-8 md:flex-row">
        <div className="flex flex-wrap gap-8 text-[10px]">
          <div>
            <p className="uppercase tracking-tighter text-[#adaaaa]">Node</p>
            <p className="text-white">ZONE_7</p>
          </div>
          <div className="border-l border-[#494847]/30 pl-8">
            <p className="uppercase tracking-tighter text-[#adaaaa]">Encryption</p>
            <p className="text-white">TLS_1.3</p>
          </div>
        </div>
        <p className="font-headline text-[10px] uppercase text-[#d4fe42]">Uptime 99.9%</p>
      </footer>

      <div className="pointer-events-none fixed left-1/2 top-1/2 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d4fe42]/5 blur-[120px]" />
    </div>
  );
}

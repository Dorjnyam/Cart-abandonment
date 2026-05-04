"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(212, 254, 66, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(212, 254, 66, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: "radial-gradient(circle, transparent 20%, #000000 100%)",
        }}
      />
      <header className="relative z-10 flex w-full items-start justify-between px-6 py-6 md:px-10">
        <div>
          <span className="font-headline text-2xl font-black tracking-tighter text-[#d4fe42]">THE_VAULT</span>
          <p className="mt-1 font-headline text-[10px] uppercase tracking-[0.3em] text-[#adaaaa]">Encrypted Terminal</p>
        </div>
        <div className="flex items-center gap-3 text-right">
          <div>
            <p className="font-headline text-[10px] uppercase tracking-widest text-[#d4fe42]">System Status</p>
            <p className="font-headline text-[10px] uppercase text-[#adaaaa]">Secure connection</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-[#d4fe42] shadow-[0_0_8px_#d4fe42]" />
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-xl px-6 pb-24 pt-4">
        <div className="space-y-10">
          <div>
            <h1 className="font-headline text-4xl font-bold tracking-tight text-white md:text-5xl">
              <span className="block">VAULT_ACCESS</span>
              <span className="block text-[#adaaaa]/40">STANDBY FOR AUTHENTICATION</span>
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
              window.location.href = role === "admin" ? "/admin" : "/account";
            }}
          >
            <div className="space-y-4">
              <div>
                <label className="mb-2 ml-1 block font-headline text-[10px] font-bold uppercase tracking-widest text-[#adaaaa]">
                  Admin identity
                </label>
                <div className="relative flex items-center rounded border border-[#494847]/30 bg-[#131313] px-1 transition-shadow focus-within:shadow-[0_0_15px_rgba(212,254,66,0.1)]">
                  <span className="material-symbols-outlined absolute left-3 text-sm text-[#adaaaa]">fingerprint</span>
                  <input
                    className="w-full border-0 bg-transparent py-4 pl-11 pr-3 font-headline text-sm uppercase tracking-widest text-[#d4fe42] placeholder:text-[#777575] focus:ring-0"
                    placeholder="EMAIL"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 ml-1 block font-headline text-[10px] font-bold uppercase tracking-widest text-[#adaaaa]">
                  Encryption key
                </label>
                <div className="relative flex items-center rounded border border-[#494847]/30 bg-[#131313] px-1 transition-shadow focus-within:shadow-[0_0_15px_rgba(212,254,66,0.1)]">
                  <span className="material-symbols-outlined absolute left-3 text-sm text-[#adaaaa]">vpn_key</span>
                  <input
                    className="w-full border-0 bg-transparent py-4 pl-11 pr-3 font-headline text-sm tracking-widest text-[#d4fe42] placeholder:text-[#777575] focus:ring-0"
                    placeholder="••••••••••••••••"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-[#ff7351]">{error}</p>}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 bg-[#d4fe42] py-4 font-headline text-sm font-black uppercase tracking-[0.2em] text-[#4c5f00] shadow-[0_0_25px_rgba(212,254,66,0.2)] transition-transform active:scale-[0.98]"
            >
              Execute authorization
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
            <div className="flex items-center justify-between pt-2">
              <a href="/reset-password" className="font-headline text-[10px] uppercase tracking-widest text-[#adaaaa] hover:text-[#d4fe42]">
                Emergency reset
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

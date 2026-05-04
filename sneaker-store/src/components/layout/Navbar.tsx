"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import CartBadge from "./CartBadge";

const MAIN_NAV = [
  { label: "Men", href: "/products?gender=men" },
  { label: "Women", href: "/products?gender=women" },
  { label: "Kids", href: "/products?gender=kids" },
  { label: "Brands", href: "/products" },
  { label: "Sale", href: "/products?onSale=true" },
  { label: "Drops", href: "/products?sort=newest" },
] as const;

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 glass-nav">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-brand text-2xl font-black italic tracking-widest text-[#c8f135]">
          KICKLAB
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-bold uppercase tracking-tight md:flex">
          {MAIN_NAV.map(({ label, href }) => (
            <Link key={label} href={href} className="text-zinc-400 transition-colors hover:text-[#c8f135]">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/search" className="rounded p-2 text-zinc-200 hover:text-[#c8f135]">Search</Link>
          {session?.user ? (
            <button
              type="button"
              className="rounded p-2 text-zinc-200 hover:text-[#c8f135]"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Logout
            </button>
          ) : (
            <Link href="/login" className="rounded p-2 text-zinc-200 hover:text-[#c8f135]">
              Sign in
            </Link>
          )}
          <Link href="/cart" className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-100 hover:border-[#c8f135]">
            Cart
            <CartBadge />
          </Link>
          <button className="rounded border border-zinc-700 px-2 py-1 md:hidden" onClick={() => setMobileOpen((v) => !v)}>
            Menu
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="surface-low px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-bold uppercase">
            {MAIN_NAV.map(({ label, href }) => (
              <Link key={label} href={href} className="text-zinc-300" onClick={() => setMobileOpen(false)}>
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
            <Link href="/" className="btn-secondary py-2">Home</Link>
            <Link href="/search" className="btn-secondary py-2">Search</Link>
            <Link href="/cart" className="btn-secondary py-2">Cart</Link>
            <Link href="/account" className="btn-secondary py-2">Profile</Link>
          </div>
        </div>
      )}
    </header>
  );
}


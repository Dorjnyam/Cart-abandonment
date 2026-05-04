"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Sneaker Store
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/products" className="hover:underline">
            Shop
          </Link>
          <Link href="/account" className="hover:underline">
            Account
          </Link>
          <Link href="/cart" className="rounded-full border px-3 py-1 hover:bg-zinc-100">
            Cart
          </Link>
        </nav>
      </div>
    </header>
  );
}


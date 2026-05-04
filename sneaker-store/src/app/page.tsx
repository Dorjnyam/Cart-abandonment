import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [newArrivals, onSale, topDrops] = await Promise.all([
    prisma.product.findMany({
      where: { isNew: true, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { brand: true },
    }),
    prisma.product.findMany({
      where: { salePrice: { not: null }, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { brand: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { soldCount: "desc" },
      take: 5,
      include: { brand: true },
    }),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-20 md:py-12">
      <section className="grid min-h-[70vh] items-center gap-8 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">KICKLAB</p>
          <h1 className="mt-3 font-brand text-5xl font-black uppercase tracking-tight md:text-7xl">
            Step Into The Culture
          </h1>
          <p className="mt-4 max-w-md text-zinc-300">Premium drops, limited pairs, and curated sneaker stories.</p>
          <Link href="/products" className="btn-primary mt-6 inline-block px-6 py-3 text-sm">Shop New Drops</Link>
        </div>
        <div className="kick-card relative overflow-hidden p-4">
          <div className="relative aspect-square w-full">
            <Image src={newArrivals[0]?.images?.[0] ?? "/vercel.svg"} alt="hero shoe" fill className="object-cover" />
          </div>
          <div className="absolute left-6 top-6 rounded-full bg-black/60 px-3 py-1 text-xs text-[#c8f135]">★ 4.7</div>
          <div className="absolute bottom-6 right-6 rounded-lg bg-black/60 px-3 py-2">
            <p className="text-xs text-zinc-300">{newArrivals[0]?.brand?.name ?? "Drop"}</p>
            <p className="font-mono text-lg text-[#c8f135]">₮{(newArrivals[0]?.salePrice ?? newArrivals[0]?.price ?? 0).toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="mt-8 overflow-hidden py-3">
        <div className="flex gap-8 whitespace-nowrap text-sm font-bold uppercase tracking-widest text-zinc-400">
          {["Nike", "Adidas", "Jordan", "New Balance", "Puma", "Asics", "Converse", "Vans"].map((b) => (
            <span key={b}>{b}</span>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="kick-card p-6">
          <p className="text-xs uppercase tracking-widest text-zinc-400">Featured Drop</p>
          <p className="mt-2 font-mono text-4xl font-bold text-[#c8f135]">14 : 08 : 52</p>
          <p className="mt-2 text-sm text-zinc-300">Countdown to next release</p>
        </div>
        <div className="kick-card p-6">
          <p className="text-xs uppercase tracking-widest text-zinc-400">Drop Calendar</p>
          <div className="mt-3 space-y-2 text-sm text-zinc-200">
            {topDrops.map((p) => <p key={p.id}>{p.name}</p>)}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-brand text-2xl font-black uppercase">New Arrivals</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {newArrivals.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="kick-card p-3"
              data-product-id={p.id}
            >
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
              </div>
              <p className="mt-2 text-xs uppercase tracking-widest text-zinc-400">{p.brand.name}</p>
              <p className="font-brand font-bold">{p.name}</p>
              <p className="font-mono text-[#c8f135]">₮{(p.salePrice ?? p.price).toLocaleString()}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-brand text-2xl font-black uppercase">Top Brands</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {["Nike", "Adidas", "Jordan", "NB", "Puma", "Asics", "Vans", "Converse"].map((b) => (
            <div key={b} className="kick-card flex h-16 items-center justify-center text-xs font-bold uppercase">{b}</div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {onSale.map((p) => (
          <Link key={p.id} href={`/products/${p.slug}`} className="kick-card p-3" data-product-id={p.id}>
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg">
              <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
            </div>
            <p className="mt-2 text-sm">{p.name}</p>
          </Link>
        ))}
      </section>

      <section className="mt-12 kick-card p-8 text-center">
        <h3 className="font-brand text-3xl font-black uppercase">Join The Vault</h3>
        <p className="mt-2 text-zinc-300">Get notified about exclusive drops</p>
        <div className="mx-auto mt-4 flex max-w-xl gap-2">
          <input className="surface-high w-full rounded-lg px-4 py-3" placeholder="your@email.com" />
          <button className="btn-primary px-6 py-3 text-sm">Subscribe</button>
        </div>
      </section>
      <div className="h-6" />
      <div className="text-center text-xs uppercase tracking-widest text-zinc-500">Instagram feed strip coming soon</div>
      <div className="h-6" />
      <div className="text-center text-xs uppercase tracking-widest text-zinc-500">The Edit lookbook and full drop calendar integrated</div>
      <div className="h-6" />
      <div className="text-center text-xs uppercase tracking-widest text-zinc-500">Mobile and desktop optimized on 8px grid</div>
      <div className="h-6" />
      <div className="text-center text-xs uppercase tracking-widest text-zinc-500">KICKLAB</div>
      <div className="h-6" />
      <div className="text-center text-xs uppercase tracking-widest text-zinc-500">End of homepage</div>
      <div className="h-6" />
      <div className="text-center text-xs uppercase tracking-widest text-zinc-500">Explore products and search next</div>
      <div className="h-2" />
      <div className="text-center">
        <Link href="/search" className="btn-secondary inline-block px-4 py-2 text-xs">Open Search</Link>
      </div>
    </div>
  );
}


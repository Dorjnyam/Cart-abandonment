import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatMnt } from "@/lib/format";
import ProductCard from "@/components/product/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [newArrivals, onSale, topDrops, editProducts] = await Promise.all([
    prisma.product.findMany({
      where: { isNew: true, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        brand: true,
        productColors: { include: { color: true } },
        productSizes: { select: { stock: true } },
      },
    }),
    prisma.product.findMany({
      where: { salePrice: { not: null }, isActive: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        brand: true,
        productColors: { include: { color: true } },
        productSizes: { select: { stock: true } },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { soldCount: "desc" },
      take: 5,
      include: { brand: true },
    }),
    prisma.product.findMany({
      where: { isFeatured: true, isActive: true },
      orderBy: { soldCount: "desc" },
      take: 8,
      include: { brand: true },
    }),
  ]);

  const hero = newArrivals[0] ?? topDrops[0];
  const visualStrip = [...newArrivals, ...onSale, ...editProducts].slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-20 md:py-12">
      <section className="grid min-h-[70vh] items-center gap-8 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">KICKLAB</p>
          <h1 className="mt-3 font-brand text-5xl font-black uppercase tracking-tight md:text-7xl">
            Step Into The Culture
          </h1>
          <p className="mt-4 max-w-md text-zinc-300">Premium drops, limited pairs, and curated sneaker stories.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/products" className="btn-primary inline-block px-6 py-3 text-sm">Shop New Drops</Link>
            <Link href="/products?onSale=true" className="btn-secondary inline-block px-6 py-3 text-sm">Shop Sale</Link>
          </div>
        </div>
        <Link href={hero ? `/products/${hero.slug}` : "/products"} className="kick-card relative overflow-hidden p-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-900">
            {hero?.images?.[0] && <Image src={hero.images[0]} alt={hero.name} fill className="object-cover" priority />}
          </div>
          <div className="absolute left-6 top-6 rounded-full bg-black/60 px-3 py-1 text-xs text-[#c8f135]">★ 4.7</div>
          <div className="absolute bottom-6 right-6 rounded-lg bg-black/70 px-3 py-2">
            <p className="text-xs text-zinc-300">{hero?.brand?.name ?? "Drop"}</p>
            <p className="font-mono text-lg text-[#c8f135]">{formatMnt(hero?.salePrice ?? hero?.price ?? 0)}</p>
          </div>
        </Link>
      </section>

      <section className="mt-8 overflow-hidden py-3">
        <div className="flex gap-8 whitespace-nowrap text-sm font-bold uppercase tracking-widest text-zinc-400">
          {["Nike", "Adidas", "New Balance", "Puma", "Asics", "Converse", "Vans", "Hoka", "On", "Salomon"].map((b) => (
            <Link key={b} href={`/products?brand=${encodeURIComponent(b.toLowerCase().replace(/\s+/g, "-"))}`} className="hover:text-[#c8f135]">
              {b}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="kick-card p-6">
          <p className="text-xs uppercase tracking-widest text-zinc-400">Featured Drop</p>
          <p className="mt-2 font-mono text-4xl font-bold text-[#c8f135]">KICKLAB EDIT 05</p>
          <p className="mt-2 text-sm text-zinc-300">A weekly rotation of running, trail, and lifestyle pairs with full-size stock.</p>
          <Link href="/products?sort=highest_rated" className="btn-secondary mt-4 inline-block px-4 py-2 text-xs">Explore edit</Link>
        </div>
        <div className="kick-card p-6">
          <p className="text-xs uppercase tracking-widest text-zinc-400">Drop Calendar</p>
          <div className="mt-3 space-y-3 text-sm text-zinc-200">
            {topDrops.map((p, index) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-2 last:border-0">
                <span>{p.name}</span>
                <span className="font-mono text-xs text-[#c8f135]">D+{index + 1}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-brand text-2xl font-black uppercase">New Arrivals</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-brand text-2xl font-black uppercase">The Edit</h2>
            <p className="text-sm text-zinc-400">Styled picks for training days, city walks, and weekend drops.</p>
          </div>
          <Link href="/products?sort=best_selling" className="btn-secondary px-4 py-2 text-xs">View all</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {editProducts.slice(0, 4).map((p) => (
            <Link key={p.id} href={`/products/${p.slug}`} className="kick-card overflow-hidden">
              <div className="relative aspect-[4/5] bg-zinc-900">
                <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
              </div>
              <div className="p-3">
                <p className="text-xs uppercase tracking-widest text-zinc-500">{p.brand.name}</p>
                <p className="text-sm font-bold">{p.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-brand text-2xl font-black uppercase">Top Brands</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {["Nike", "Adidas", "NB", "Puma", "Asics", "Vans", "Converse", "Hoka"].map((b) => (
            <Link key={b} href="/products" className="kick-card flex h-16 items-center justify-center text-xs font-bold uppercase">{b}</Link>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-4">
        {onSale.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-brand text-2xl font-black uppercase">From the feed</h2>
          <Link href="/products" className="text-xs uppercase tracking-widest text-[#c8f135]">Shop the grid</Link>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {visualStrip.map((p) => (
            <Link key={p.id} href={`/products/${p.slug}`} className="relative aspect-square overflow-hidden rounded bg-zinc-900">
              <Image src={p.images[0]} alt={p.name} fill className="object-cover transition-transform duration-300 hover:scale-105" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-lg bg-[#101010] p-8 text-center">
        <h3 className="font-brand text-3xl font-black uppercase">Join The Vault</h3>
        <p className="mt-2 text-zinc-300">Get notified about exclusive drops, restocks, and member-only sale windows.</p>
        <div className="mx-auto mt-4 flex max-w-xl gap-2">
          <input className="surface-high w-full rounded-lg px-4 py-3" placeholder="your@email.com" />
          <button className="btn-primary px-6 py-3 text-sm">Subscribe</button>
        </div>
      </section>
    </div>
  );
}

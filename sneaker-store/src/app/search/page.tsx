import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const results = q
    ? await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { brand: { name: { contains: q, mode: "insensitive" } } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 24,
        include: { brand: true },
      })
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-20">
      <form className="relative">
        <input
          name="q"
          defaultValue={q}
          placeholder="SEARCH THE VAULT..."
          className="surface-high w-full rounded-lg border-2 border-[#c8f135] px-5 py-4 text-2xl font-bold uppercase tracking-tight"
        />
      </form>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {["Jordan 4", "Dunks", "Samba", "Yeezy"].map((s) => (
          <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} className="btn-secondary px-3 py-1">
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="surface-low rounded-xl p-4">
          <p className="text-xs uppercase tracking-widest text-zinc-400">Categories</p>
          <div className="mt-3 space-y-2 text-sm text-zinc-200">
            <p>Footwear</p>
            <p>Apparel</p>
            <p>Accessories</p>
          </div>
        </aside>
        <main>
          {!q ? (
            <div className="kick-card p-8 text-center text-zinc-300">Start typing to search sneakers, brands, and drops.</div>
          ) : results.length === 0 ? (
            <div className="kick-card p-8 text-center">
              <p className="font-brand text-2xl font-black uppercase">No results</p>
              <p className="mt-2 text-sm text-zinc-400">Did you mean <b>{q}s</b> ?</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="kick-card p-3" data-product-id={p.id}>
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    <Image src={p.images[0]} alt={p.name} fill className="object-cover" />
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-widest text-zinc-500">{p.brand.name}</p>
                  <p className="font-brand font-bold">{p.name}</p>
                  <p className="font-mono text-[#c8f135]">₮{(p.salePrice ?? p.price).toLocaleString()}</p>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

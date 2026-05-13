import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMnt } from "@/lib/format";
import ProductCard from "@/components/product/ProductCard";
import AddToCartClient from "./AddToCartClient";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { slug: id, isActive: true },
    include: { brand: true },
  });
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} | KICKLAB`,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { slug: id, isActive: true },
    include: {
      brand: true,
      categories: { include: { category: true } },
      productSizes: { include: { shoeSize: true }, orderBy: { shoeSize: { sortOrder: "asc" } } },
      productColors: { include: { color: true } },
    },
  });
  if (!product) notFound();

  const totalStock = product.productSizes.reduce((a, ps) => a + ps.stock, 0);
  const primaryCategory =
    product.categories[0]?.category.slug ??
    product.categories[0]?.category.name ??
    "";

  const pdpProduct = {
    id: product.id,
    name: product.name,
    price: product.price,
    salePrice: product.salePrice,
    primaryCategory,
    images: product.images,
    colors: product.productColors.map((pc) => ({
      id: pc.color.id,
      name: pc.color.name,
      slug: pc.color.slug,
      hex: pc.color.hex,
    })),
    sizes: product.productSizes.map((ps) => ({
      eu: ps.shoeSize.eu,
      usLabel: ps.shoeSize.usLabel,
      stock: ps.stock,
    })),
  };

  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  const related = await prisma.product.findMany({
    where: { id: { not: product.id }, isActive: true },
    orderBy: [{ isFeatured: "desc" }, { soldCount: "desc" }],
    take: 6,
    include: {
      brand: true,
      productColors: { include: { color: true } },
      productSizes: { select: { stock: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-20">
      <div className="mb-5 text-xs uppercase tracking-widest text-zinc-500">Home / Products / {product.brand.name}</div>
      <div className="grid gap-8 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-3">
          <div className="kick-card relative aspect-square overflow-hidden rounded-2xl">
            <Image src={product.images[0]} alt={product.name} fill className="object-cover" priority />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((img, idx) => (
                <div key={`${img}-${idx}`} className="kick-card relative aspect-square overflow-hidden rounded-lg">
                  <Image src={img} alt={`${product.name}-${idx + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
          <button className="btn-secondary w-full px-4 py-2 text-xs">View in 360°</button>
        </div>
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{product.brand.name}</p>
          <h1 className="font-brand text-3xl font-black uppercase tracking-tight">{product.name}</h1>
          <p className="text-sm text-zinc-300">{product.description}</p>
          <div className="flex items-center gap-3">
            <p className="font-mono text-xl text-[#c8f135]">{formatMnt(product.salePrice ?? product.price)}</p>
            {product.salePrice && <p className="font-mono text-sm text-zinc-500 line-through">{formatMnt(product.price)}</p>}
          </div>
          <p className="text-sm text-zinc-300">Rating: 4.7 ★ ({reviews.length} reviews)</p>
          <div className="surface-low grid grid-cols-2 gap-2 rounded-lg p-3 text-xs">
            <p>SKU: <b>{product.sku}</b></p>
            <p>Material: <b>{product.material ?? "n/a"}</b></p>
            <p>Fit: <b>{product.fit ?? "regular"}</b></p>
            <p>Weight: <b>{product.weightGrams ?? 0}g</b></p>
            <p>Care: <b>{product.care ?? "wipe clean"}</b></p>
            <p>Country: <b>{product.country ?? "n/a"}</b></p>
          </div>
          {totalStock <= 3 && totalStock > 0 && (
            <p className="inline-block rounded-full bg-[#ffd16f] px-3 py-1 text-sm font-bold text-black">Only {totalStock} left</p>
          )}
          {totalStock === 0 && (
            <button className="btn-secondary w-full px-4 py-2 text-xs">Notify me</button>
          )}
          <AddToCartClient product={pdpProduct} />
          <div className="surface-low rounded-lg p-3">
            <p className="mb-2 text-sm font-medium">Reviews</p>
            <div className="mb-3 space-y-1 text-xs text-zinc-300">
              <p>5★ ████████</p>
              <p>4★ ██████</p>
              <p>3★ ██</p>
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-zinc-500">No reviews yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {reviews.map((r) => (
                  <div key={r.id} className="surface-high rounded p-2">
                    <p className="font-medium">{"★".repeat(Math.max(1, r.rating))}</p>
                    <p>{r.comment ?? "Great pair of sneakers."}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <section className="mt-12">
        <h2 className="font-brand text-2xl font-black uppercase">You may also like</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.slice(0, 3).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <section className="mt-10">
        <h2 className="font-brand text-xl font-black uppercase">Complete the look</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.slice(3, 6).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { formatMnt } from "@/lib/format";
import WishlistButton from "./WishlistButton";

export type ProductCardItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: string[];
  isNew?: boolean;
  brand: { name: string };
  productColors?: { color: { name: string } }[];
  productSizes?: { stock: number }[];
};

export default function ProductCard({ product }: { product: ProductCardItem }) {
  const stock = product.productSizes?.reduce((sum, row) => sum + row.stock, 0) ?? 0;
  const colorLine = product.productColors?.map((pc) => pc.color.name).join(" · ") ?? "";
  const onSale = product.salePrice != null;

  return (
    <article className="kick-card group relative overflow-hidden p-3" data-product-id={product.id}>
      <WishlistButton
        productId={product.id}
        compact
        className="absolute right-5 top-5 z-10 border-white/20 backdrop-blur"
      />
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-900">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-2 top-2 flex gap-2">
            {product.isNew && <span className="badge-new rounded-full px-2 py-1 text-[10px] font-bold uppercase">new</span>}
            {onSale && <span className="badge-sale rounded-full px-2 py-1 text-[10px] font-bold uppercase">sale</span>}
          </div>
          <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-1 text-[10px]">
            {stock > 0 ? `${stock} in stock` : "sold out"}
          </span>
        </div>
        <p className="mt-3 text-xs uppercase tracking-widest text-zinc-500">{product.brand.name}</p>
        <p className="font-brand font-bold leading-tight">{product.name}</p>
        {colorLine && <p className="mt-1 text-xs text-zinc-400">{colorLine}</p>}
        <div className="mt-2 flex items-center gap-2">
          <p className="font-mono text-[#c8f135]">{formatMnt(product.salePrice ?? product.price)}</p>
          {onSale && <p className="font-mono text-xs text-zinc-500 line-through">{formatMnt(product.price)}</p>}
        </div>
      </Link>
    </article>
  );
}

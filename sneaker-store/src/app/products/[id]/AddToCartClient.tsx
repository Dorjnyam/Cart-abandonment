"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/store/cart";
import { commerceAttrs } from "@/lib/commerce-attrs";

export type PDPProduct = {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  primaryCategory: string;
  images: string[];
  colors: { id: string; name: string; slug: string; hex: string }[];
  sizes: { eu: number; usLabel: string | null; stock: number }[];
};

export default function AddToCartClient({ product }: { product: PDPProduct }) {
  const addItem = useCart((s) => s.addItem);
  const inStockSizes = product.sizes.filter((s) => s.stock > 0);
  const [size, setSize] = useState(inStockSizes[0]?.eu ?? product.sizes[0]?.eu ?? 40);
  const [color, setColor] = useState(product.colors[0]?.name ?? "default");
  const [qty, setQty] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [ok, setOk] = useState(false);

  const stockForSize = product.sizes.find((s) => s.eu === size)?.stock ?? 0;
  const unitPrice = product.salePrice ?? product.price;
  const lineValue = unitPrice * qty;
  const colorSlug =
    product.colors.find((c) => c.name === color)?.slug ??
    (product.colors[0]?.slug ?? "default");
  const variantKey = `${colorSlug}-${size}`;
  const isOnSale = product.salePrice != null;

  const addToCartAttrs = useMemo(
    () =>
      commerceAttrs({
        ca: "cart_add",
        id: product.id,
        price: unitPrice,
        value: lineValue,
        cat: product.primaryCategory || undefined,
        size: String(size),
        qty,
        availability: stockForSize > 0 ? "in_stock" : "out_of_stock",
        variant: variantKey,
        stock: String(stockForSize),
        sale: isOnSale,
      }),
    [
      product.id,
      product.primaryCategory,
      unitPrice,
      lineValue,
      size,
      qty,
      stockForSize,
      variantKey,
      isOnSale,
    ]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-zinc-500">Colorway</p>
        <div className="flex flex-wrap gap-2">
          {(product.colors.length ? product.colors : [{ id: "x", name: "default", slug: "default", hex: "#888" }]).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setColor(c.name)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase ${
                color === c.name ? "border-[#c8f135] bg-[#c8f135] text-black" : "border-zinc-700 text-zinc-200"
              }`}
            >
              <span className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: c.hex }} />
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Size (EU)</p>
          <button
            type="button"
            {...commerceAttrs({ ca: "size_guide_open" })}
            onClick={() => setShowSizeGuide(true)}
            className="text-xs uppercase tracking-widest text-[#c8f135]"
          >
            Find my size
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button
              key={s.eu}
              type="button"
              disabled={s.stock <= 0}
              onClick={() => setSize(s.eu)}
              className={`min-w-10 rounded border px-2 py-1 text-sm ${
                size === s.eu ? "border-[#c8f135] bg-[#c8f135] text-black" : "border-zinc-700 text-zinc-200"
              } ${s.stock <= 0 ? "cursor-not-allowed opacity-40" : ""}`}
              title={s.usLabel ?? undefined}
            >
              {s.eu}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={() => setQty((q) => Math.max(1, q - 1))}>
          -
        </button>
        <p className="font-mono text-sm">{qty}</p>
        <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={() => setQty((q) => q + 1)}>
          +
        </button>
      </div>
      {ok && <p className="text-sm text-green-700">Added to cart.</p>}
      <button
        type="button"
        {...addToCartAttrs}
        disabled={stockForSize <= 0}
        onClick={() => {
          if (qty > stockForSize) return;
          for (let i = 0; i < qty; i += 1) {
            addItem({
              id: product.id,
              name: product.name,
              price: product.salePrice ?? product.price,
              size,
              color,
              qty: 1,
              image: product.images[0] ?? "",
            });
          }
          setOk(true);
          setTimeout(() => setOk(false), 1500);
        }}
        className="btn-primary w-full px-4 py-3 text-sm disabled:opacity-50"
      >
        Add to cart
      </button>
      <button
        type="button"
        {...commerceAttrs({
          ca: "wishlist_add",
          id: product.id,
          price: unitPrice,
          cat: product.primaryCategory || undefined,
          size: String(size),
          variant: variantKey,
          sale: isOnSale,
        })}
        className="btn-secondary w-full px-4 py-3 text-sm"
      >
        Add to wishlist
      </button>
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="surface-low w-full max-w-md rounded-xl p-4">
            <p className="font-brand text-lg font-bold uppercase">Size Guide</p>
            <p className="mt-2 text-sm text-zinc-300">EU 40 = US 7.5 · EU 42 = US 8.5 · EU 44 = US 10</p>
            <button
              type="button"
              className="btn-primary mt-4 w-full px-4 py-2 text-xs"
              onClick={() => setShowSizeGuide(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

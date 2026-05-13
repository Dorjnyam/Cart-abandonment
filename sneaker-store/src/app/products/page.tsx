import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductSort } from "@/lib/types";
import ProductCard from "@/components/product/ProductCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Sneakers | KICKLAB",
  description: "Browse sneakers with filters, sorting, and pagination.",
};
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    brand?: string;
    category?: string;
    gender?: string;
    color?: string;
    size?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    onSale?: string;
    sort?: ProductSort;
    page?: string;
  }>;
}

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price low" },
  { value: "price_desc", label: "Price high" },
  { value: "best_selling", label: "Best selling" },
  { value: "highest_rated", label: "Top rated" },
];

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const where: Record<string, unknown> = { isActive: true };

  if (params.brand) {
    where.brand = {
      OR: [
        { slug: params.brand },
        { name: { equals: params.brand, mode: "insensitive" as const } },
      ],
    };
  }
  if (params.category) {
    where.categories = { some: { category: { slug: params.category } } };
  }
  if (params.gender) {
    where.genders = { some: { gender: { slug: params.gender } } };
  }
  if (params.color) {
    where.productColors = {
      some: {
        color: {
          OR: [
            { slug: params.color },
            { name: { equals: params.color, mode: "insensitive" as const } },
          ],
        },
      },
    };
  }
  if (params.size) {
    const eu = Number(params.size);
    if (Number.isFinite(eu)) {
      where.productSizes = {
        some: { shoeSize: { eu }, stock: { gt: 0 } },
      };
    }
  }
  if (params.inStock === "true") {
    where.productSizes = { some: { stock: { gt: 0 } } };
  }
  if (params.onSale === "true") where.salePrice = { not: null };
  if (params.minPrice || params.maxPrice) {
    where.price = {};
    if (params.minPrice) (where.price as Record<string, number>).gte = Number(params.minPrice);
    if (params.maxPrice) (where.price as Record<string, number>).lte = Number(params.maxPrice);
  }

  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const limit = 15;

  const orderBy =
    params.sort === "price_asc"
      ? { price: "asc" as const }
      : params.sort === "price_desc"
        ? { price: "desc" as const }
        : params.sort === "best_selling"
          ? { soldCount: "desc" as const }
          : params.sort === "highest_rated"
            ? [{ isFeatured: "desc" as const }, { soldCount: "desc" as const }]
            : { createdAt: "desc" as const };

  const [products, total, brandList, categoryList, colorList, sizeList] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: Math.max(0, page - 1) * limit,
      take: limit,
      include: {
        brand: true,
        productColors: { include: { color: true } },
        productSizes: { select: { stock: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.color.findMany({ orderBy: { name: "asc" }, take: 30 }),
    prisma.shoeSize.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function hrefWith(updates: Record<string, string | number | boolean | null | undefined>) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) next.set(key, String(value));
    }
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === undefined || value === "") next.delete(key);
      else next.set(key, String(value));
    }
    if (!Object.prototype.hasOwnProperty.call(updates, "page")) next.delete("page");
    const query = next.toString();
    return `/products${query ? `?${query}` : ""}`;
  }

  type ActiveFilter = { key: string; label: string; remove: Record<string, null> };
  const activeFilters: ActiveFilter[] = [];
  if (params.brand) activeFilters.push({ key: "brand", label: `Brand: ${brandList.find((b) => b.slug === params.brand)?.name ?? params.brand}`, remove: { brand: null } });
  if (params.category) activeFilters.push({ key: "category", label: `Category: ${categoryList.find((c) => c.slug === params.category)?.name ?? params.category}`, remove: { category: null } });
  if (params.gender) activeFilters.push({ key: "gender", label: `Gender: ${params.gender}`, remove: { gender: null } });
  if (params.color) activeFilters.push({ key: "color", label: `Color: ${colorList.find((c) => c.slug === params.color)?.name ?? params.color}`, remove: { color: null } });
  if (params.size) activeFilters.push({ key: "size", label: `EU ${params.size}`, remove: { size: null } });
  if (params.onSale === "true") activeFilters.push({ key: "sale", label: "On sale", remove: { onSale: null } });
  if (params.inStock === "true") activeFilters.push({ key: "stock", label: "In stock", remove: { inStock: null } });
  if (params.minPrice || params.maxPrice) activeFilters.push({ key: "price", label: "Price range", remove: { minPrice: null, maxPrice: null } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-20">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-brand text-4xl font-black uppercase tracking-tight">Collection</h1>
          <p className="text-xs uppercase tracking-widest text-zinc-400">{total} products found</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SORTS.map((sort) => (
            <Link
              key={sort.value}
              href={hrefWith({ sort: sort.value })}
              className={`${params.sort === sort.value || (!params.sort && sort.value === "newest") ? "btn-primary" : "btn-secondary"} px-3 py-2 text-xs`}
            >
              {sort.label}
            </Link>
          ))}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <Link key={filter.key} href={hrefWith(filter.remove)} className="rounded-full border border-[#c8f135]/60 px-3 py-1 text-xs text-[#c8f135]">
              {filter.label} ×
            </Link>
          ))}
          <Link href="/products" className="btn-secondary px-3 py-1 text-xs">Clear all</Link>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <aside className="surface-low h-fit rounded-xl p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-300">Filters</p>
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Brand</p>
              <div className="grid gap-1">
                {brandList.slice(0, 18).map((brand) => (
                  <Link key={brand.id} href={hrefWith({ brand: brand.slug })} className="text-sm text-zinc-300 hover:text-[#c8f135]">
                    {brand.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Category</p>
              <div className="flex flex-wrap gap-2">
                {categoryList.map((category) => (
                  <Link key={category.id} href={hrefWith({ category: category.slug })} className="btn-secondary px-3 py-1 text-xs">
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Gender</p>
              <div className="flex flex-wrap gap-2">
                {["men", "women", "kids", "unisex"].map((gender) => (
                  <Link key={gender} href={hrefWith({ gender })} className="btn-secondary px-3 py-1 text-xs capitalize">
                    {gender}
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Color</p>
              <div className="grid max-h-64 gap-2 overflow-auto pr-1">
                {colorList.map((color) => (
                  <Link key={color.id} href={hrefWith({ color: color.slug })} className="flex items-center gap-2 text-sm text-zinc-300 hover:text-[#c8f135]">
                    <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: color.hex }} />
                    {color.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Size</p>
              <div className="flex flex-wrap gap-2">
                {sizeList.map((size) => (
                  <Link key={size.id} href={hrefWith({ size: size.eu })} className="btn-secondary min-w-10 px-2 py-1 text-center text-xs">
                    {size.eu}
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-zinc-500">Price</p>
              <div className="grid gap-2">
                <Link href={hrefWith({ minPrice: 100000, maxPrice: 200000 })} className="text-sm text-zinc-300 hover:text-[#c8f135]">
                  ₮100k - ₮200k
                </Link>
                <Link href={hrefWith({ minPrice: 200000, maxPrice: 400000 })} className="text-sm text-zinc-300 hover:text-[#c8f135]">
                  ₮200k - ₮400k
                </Link>
                <Link href={hrefWith({ minPrice: 400000, maxPrice: 800000 })} className="text-sm text-zinc-300 hover:text-[#c8f135]">
                  ₮400k - ₮800k
                </Link>
              </div>
            </div>
            <div className="grid gap-2">
              <Link href={hrefWith({ onSale: true })} className="btn-secondary px-3 py-2 text-xs">On sale</Link>
              <Link href={hrefWith({ inStock: true })} className="btn-secondary px-3 py-2 text-xs">In stock</Link>
            </div>
          </div>
        </aside>

        <div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between text-sm">
            <p className="text-zinc-400">
              Page {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Link href={hrefWith({ page: Math.max(1, page - 1) })} className="btn-secondary px-3 py-2 text-xs">
                Prev
              </Link>
              <Link href={hrefWith({ page: Math.min(totalPages, page + 1) })} className="btn-secondary px-3 py-2 text-xs">
                Next
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

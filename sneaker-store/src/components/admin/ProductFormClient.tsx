"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Catalog = {
  brands: { id: string; name: string; slug: string }[];
  categories: { id: string; name: string; slug: string }[];
  genders: { id: string; name: string; slug: string }[];
  colors: { id: string; name: string; slug: string; hex: string }[];
  shoeSizes: { id: string; eu: number; usLabel: string | null; sortOrder: number }[];
};

export type ProductEditPayload = {
  id: string;
  name: string;
  brandId: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  salePrice: number | null;
  images: string[];
  releaseDate: string | null;
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  categoryIds: string[];
  genderIds: string[];
  colorIds: string[];
  sizeStocks: { shoeSizeId: string; stock: number }[];
};

function toggleInSet(set: Set<string>, id: string) {
  const n = new Set(set);
  if (n.has(id)) n.delete(id);
  else n.add(id);
  return n;
}

export default function ProductFormClient({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: ProductEditPayload;
}) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [brandId, setBrandId] = useState(initial?.brandId ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [salePrice, setSalePrice] = useState(
    initial?.salePrice != null ? String(initial.salePrice) : ""
  );
  const [releaseDate, setReleaseDate] = useState(
    initial?.releaseDate ? initial.releaseDate.slice(0, 10) : ""
  );
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [categoryIds, setCategoryIds] = useState(() => new Set(initial?.categoryIds ?? []));
  const [genderIds, setGenderIds] = useState(() => new Set(initial?.genderIds ?? []));
  const [colorIds, setColorIds] = useState(() => new Set(initial?.colorIds ?? []));
  const [sizeStock, setSizeStock] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    if (initial?.sizeStocks) {
      for (const r of initial.sizeStocks) m[r.shoeSizeId] = r.stock;
    }
    return m;
  });
  const [isNew, setIsNew] = useState(initial?.isNew ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const loadCatalog = useCallback(async () => {
    const res = await fetch("/api/admin/catalog-options");
    if (!res.ok) return;
    setCatalog(await res.json());
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!catalog || mode !== "create" || initial) return;
    if (!brandId && catalog.brands[0]) setBrandId(catalog.brands[0].id);
  }, [catalog, mode, initial, brandId]);

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((j as { error?: string }).error ?? "Upload failed");
      return;
    }
    setImages((prev) => [...prev, (j as { url: string }).url]);
    setErr(null);
    e.target.value = "";
  }

  function addImageUrl() {
    const u = imageUrlInput.trim();
    if (!u) return;
    setImages((prev) => [...prev, u]);
    setImageUrlInput("");
  }

  async function publish() {
    setErr(null);
    setMsg(null);
    const priceN = Number(price);
    if (!name.trim() || !brandId || !Number.isFinite(priceN) || priceN < 1) {
      setErr("Name, brand, and valid price are required.");
      return;
    }
    const cat = [...categoryIds];
    const gen = [...genderIds];
    const col = [...colorIds];
    if (cat.length === 0 || gen.length === 0 || col.length === 0) {
      setErr("Select at least one category, gender, and color.");
      return;
    }
    if (!catalog) {
      setErr("Catalog still loading.");
      return;
    }
    const sizeStocks = catalog.shoeSizes
      .map((s) => ({
        shoeSizeId: s.id,
        stock: Math.max(0, Math.floor(sizeStock[s.id] ?? 0)),
      }))
      .filter((r) => r.stock > 0);
    if (sizeStocks.length === 0) {
      setErr("Enter stock for at least one size.");
      return;
    }

    const body: Record<string, unknown> = {
      name: name.trim(),
      brandId,
      categoryIds: cat,
      genderIds: gen,
      colorIds: col,
      sizeStocks,
      images,
      description: description.trim(),
      price: priceN,
      salePrice: salePrice.trim() ? Number(salePrice) : null,
      sku: sku.trim() || undefined,
      slug: slug.trim() || undefined,
      releaseDate: releaseDate ? `${releaseDate}T12:00:00.000Z` : null,
      isNew,
      isFeatured,
      isActive,
    };

    setBusy(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErr(JSON.stringify((j as { error?: unknown }).error ?? j));
          return;
        }
        setMsg("Created.");
        router.push("/admin/products");
        router.refresh();
      } else if (initial) {
        const res = await fetch(`/api/admin/products/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErr(JSON.stringify((j as { error?: unknown }).error ?? j));
          return;
        }
        setMsg("Saved.");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!catalog) {
    return <p className="px-4 py-12 text-sm text-zinc-500">Loading catalog…</p>;
  }

  return (
    <div className="vault-admin-main px-4 py-8 pb-24 lg:px-10">
      <nav className="mb-4 flex items-center gap-2 font-headline text-xs uppercase tracking-widest text-[#adaaaa]">
        <span>Inventory</span>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-[#d4fe42]">{mode === "create" ? "New Drop" : "Edit"}</span>
      </nav>
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="font-headline text-4xl font-black tracking-tighter text-white lg:text-5xl">
            {mode === "create" ? "CREATE_ENTRY" : "EDIT_ENTRY"}
          </h1>
          <p className="mt-2 max-w-md text-sm text-[#adaaaa]">
            Initialize a vault entry with technical specifications and per-size stock allocation.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded bg-[#262626] px-6 py-3 font-headline text-xs font-bold uppercase tracking-widest text-white hover:bg-[#2c2c2c]"
          >
            Discard
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={publish}
            className="rounded bg-[#d4fe42] px-8 py-3 font-headline text-xs font-black uppercase tracking-widest text-[#4c5f00] shadow-[0_0_20px_rgba(212,254,66,0.25)] hover:bg-[#c6ef33] disabled:opacity-50"
          >
            {busy ? "…" : "Publish drop"}
          </button>
        </div>
      </div>

      {msg && <p className="mb-4 text-sm text-[#d4fe42]">{msg}</p>}
      {err && <p className="mb-4 text-sm text-[#ff7351]">{err}</p>}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-5">
          <section className="rounded-lg bg-[#131313] p-6">
            <h3 className="mb-6 flex items-center gap-2 font-headline text-sm font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm text-[#d4fe42]">photo_camera</span>
              Media assets
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative col-span-2 flex min-h-[180px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#494847]/40 bg-[#262626]">
                {images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[0]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
                ) : null}
                <label className="relative z-10 flex cursor-pointer flex-col items-center p-6 text-center">
                  <span className="material-symbols-outlined mb-2 text-3xl text-[#d4fe42]">cloud_upload</span>
                  <span className="text-xs font-headline font-bold uppercase tracking-widest">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onUploadFile} />
                </label>
              </div>
              <div className="flex flex-col gap-2 sm:col-span-2">
                <div className="flex gap-2">
                  <input
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Image URL"
                    className="flex-1 rounded border border-[#494847]/30 bg-[#262626] px-3 py-2 text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="rounded bg-[#262626] px-3 text-xs font-bold uppercase text-[#d4fe42]"
                  >
                    Add URL
                  </button>
                </div>
                <ul className="max-h-24 space-y-1 overflow-auto text-xs text-zinc-500">
                  {images.map((u, i) => (
                    <li key={u + i} className="flex justify-between gap-2">
                      <span className="truncate">{u}</span>
                      <button type="button" className="text-[#ff7351]" onClick={() => setImages((p) => p.filter((_, j) => j !== i))}>
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8 lg:col-span-7">
          <section className="space-y-6 rounded-lg bg-[#131313] p-8">
            <h3 className="mb-2 flex items-center gap-2 font-headline text-sm font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm text-[#d4fe42]">terminal</span>
              Core parameters
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-headline font-bold uppercase tracking-widest text-[#adaaaa]">Brand</label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full rounded border-0 bg-[#262626] px-4 py-3 text-sm text-white focus:ring-2 focus:ring-[#d4fe42]/30"
                >
                  <option value="">Select…</option>
                  {catalog.brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="ml-1 text-[10px] font-headline font-bold uppercase tracking-widest text-[#adaaaa]">
                  Categories (multi)
                </label>
                <div className="flex flex-wrap gap-2">
                  {catalog.categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryIds((s) => toggleInSet(s, c.id))}
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-tight ${
                        categoryIds.has(c.id) ? "bg-[#d4fe42] text-[#4c5f00]" : "bg-[#262626] text-zinc-400"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="ml-1 text-[10px] font-headline font-bold uppercase tracking-widest text-[#adaaaa]">
                  Genders (multi)
                </label>
                <div className="flex flex-wrap gap-2">
                  {catalog.genders.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGenderIds((s) => toggleInSet(s, g.id))}
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-tight ${
                        genderIds.has(g.id) ? "bg-[#d4fe42] text-[#4c5f00]" : "bg-[#262626] text-zinc-400"
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="ml-1 text-[10px] font-headline font-bold uppercase tracking-widest text-[#adaaaa]">
                  Colors (multi)
                </label>
                <div className="flex flex-wrap gap-2">
                  {catalog.colors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColorIds((s) => toggleInSet(s, c.id))}
                      className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase ${
                        colorIds.has(c.id) ? "bg-[#d4fe42] text-[#4c5f00]" : "bg-[#262626] text-zinc-400"
                      }`}
                    >
                      <span className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: c.hex }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-headline font-bold uppercase tracking-widest text-[#adaaaa]">Model name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border-0 bg-[#262626] px-4 py-3 text-sm font-headline font-bold text-white focus:ring-2 focus:ring-[#d4fe42]/30"
                placeholder="e.g. DUNK LOW 'VOLT'"
              />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <label className="ml-1 text-[10px] font-headline font-bold uppercase tracking-widest text-[#adaaaa]">SKU</label>
                <input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full rounded border-0 bg-[#262626] px-4 py-3 font-mono text-sm text-white focus:ring-2 focus:ring-[#d4fe42]/30"
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-headline font-bold uppercase tracking-widest text-[#adaaaa]">Release</label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full rounded border-0 bg-[#262626] px-4 py-3 text-sm text-white [color-scheme:dark]"
                />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-headline font-bold uppercase tracking-widest text-[#adaaaa]">Price (₮)</label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  min={1}
                  className="w-full rounded border-0 bg-[#262626] px-4 py-3 font-mono text-sm text-[#d4fe42] focus:ring-2 focus:ring-[#d4fe42]/30"
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-headline font-bold uppercase tracking-widest text-[#adaaaa]">Sale price</label>
                <input
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  type="number"
                  min={1}
                  className="w-full rounded border-0 bg-[#262626] px-4 py-3 font-mono text-sm text-white focus:ring-2 focus:ring-[#d4fe42]/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="ml-1 text-[10px] font-headline font-bold uppercase tracking-widest text-[#adaaaa]">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full resize-none rounded border-0 bg-[#262626] px-4 py-3 text-sm text-white focus:ring-2 focus:ring-[#d4fe42]/30"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
                New
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                Featured
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active
              </label>
            </div>
            {mode === "edit" && (
              <div className="space-y-2">
                <label className="ml-1 text-[10px] font-headline font-bold uppercase tracking-widest text-[#adaaaa]">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded border-0 bg-[#262626] px-4 py-3 font-mono text-sm text-white"
                />
              </div>
            )}
          </section>

          <section className="rounded-lg bg-[#131313] p-8">
            <h3 className="mb-6 flex items-center gap-2 font-headline text-sm font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm text-[#d4fe42]">grid_view</span>
              Stock by size (EU)
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {catalog.shoeSizes.map((s) => (
                <div key={s.id} className="flex flex-col gap-1">
                  <label className="text-center text-[9px] font-headline font-bold uppercase tracking-tighter text-zinc-500">
                    {s.usLabel || `EU ${s.eu}`}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sizeStock[s.id] ?? ""}
                    placeholder="0"
                    onChange={(e) =>
                      setSizeStock((prev) => ({
                        ...prev,
                        [s.id]: e.target.value === "" ? 0 : Number(e.target.value),
                      }))
                    }
                    className="rounded border border-[#494847]/20 bg-[#000] py-2 text-center font-mono text-sm text-white focus:border-[#d4fe42]/60 focus:ring-0"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

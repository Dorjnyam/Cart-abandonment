"use client";

import { useCallback, useEffect, useState } from "react";

type Catalog = {
  brands: { id: string; name: string; slug: string }[];
  categories: { id: string; name: string; slug: string }[];
  genders: { id: string; name: string; slug: string }[];
  colors: { id: string; name: string; slug: string; hex: string }[];
  shoeSizes: { id: string; eu: number; usLabel: string | null; sortOrder: number }[];
};

type Tab = "brands" | "categories" | "genders" | "colors" | "shoe-sizes";

export default function TaxonomyClient() {
  const [data, setData] = useState<Catalog | null>(null);
  const [tab, setTab] = useState<Tab>("brands");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/admin/catalog-options");
    if (!res.ok) {
      setErr("Failed to load catalog");
      return;
    }
    setData(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(resource: Tab, id: string) {
    if (!confirm("Delete this row? Products may block deletion.")) return;
    setMsg(null);
    const res = await fetch(`/api/admin/taxonomy/${resource}/${id}`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((j as { error?: string }).error ?? "Delete failed");
      return;
    }
    setMsg("Deleted.");
    load();
  }

  async function addBrand(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return;
    const res = await fetch("/api/admin/taxonomy/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((j as { error?: string }).error ?? "Create failed");
      return;
    }
    setMsg("Brand created.");
    (e.target as HTMLFormElement).reset();
    load();
  }

  async function addCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return;
    const res = await fetch("/api/admin/taxonomy/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      setErr("Create failed");
      return;
    }
    setMsg("Category created.");
    (e.target as HTMLFormElement).reset();
    load();
  }

  async function addGender(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return;
    const res = await fetch("/api/admin/taxonomy/genders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      setErr("Create failed");
      return;
    }
    setMsg("Gender created.");
    (e.target as HTMLFormElement).reset();
    load();
  }

  async function addColor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const hex = String(fd.get("hex") ?? "#888888");
    if (!name) return;
    const res = await fetch("/api/admin/taxonomy/colors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, hex }),
    });
    if (!res.ok) {
      setErr("Create failed");
      return;
    }
    setMsg("Color created.");
    (e.target as HTMLFormElement).reset();
    load();
  }

  async function addShoeSize(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const eu = Number(fd.get("eu"));
    const usLabel = String(fd.get("usLabel") ?? "").trim();
    if (!Number.isFinite(eu)) return;
    const res = await fetch("/api/admin/taxonomy/shoe-sizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eu, usLabel: usLabel || undefined }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((j as { error?: string }).error ?? "Create failed");
      return;
    }
    setMsg("Size created.");
    (e.target as HTMLFormElement).reset();
    load();
  }

  if (!data) {
    return <p className="text-sm text-zinc-500">Loading catalog…</p>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "brands", label: "Brands" },
    { id: "categories", label: "Categories" },
    { id: "genders", label: "Genders" },
    { id: "colors", label: "Colors" },
    { id: "shoe-sizes", label: "Sizes" },
  ];

  return (
    <div className="space-y-6">
      {msg && <p className="text-sm text-[#d4fe42]">{msg}</p>}
      {err && <p className="text-sm text-[#ff7351]">{err}</p>}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setErr(null);
            }}
            className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${
              tab === t.id ? "bg-[#d4fe42] text-[#4c5f00]" : "bg-[#262626] text-zinc-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "brands" && (
        <section className="rounded-lg bg-[#131313] p-6">
          <form onSubmit={addBrand} className="mb-6 flex flex-wrap gap-2">
            <input
              name="name"
              placeholder="Brand name"
              className="min-w-[200px] flex-1 rounded border border-[#494847]/30 bg-[#262626] px-3 py-2 text-sm text-white"
            />
            <button type="submit" className="rounded bg-[#d4fe42] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#4c5f00]">
              Add
            </button>
          </form>
          <ul className="space-y-2">
            {data.brands.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded bg-[#0e0e0e] px-3 py-2 text-sm">
                <span>
                  {b.name} <span className="text-zinc-500">({b.slug})</span>
                </span>
                <button type="button" onClick={() => remove("brands", b.id)} className="text-xs text-[#ff7351]">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "categories" && (
        <section className="rounded-lg bg-[#131313] p-6">
          <form onSubmit={addCategory} className="mb-6 flex flex-wrap gap-2">
            <input
              name="name"
              placeholder="Category name"
              className="min-w-[200px] flex-1 rounded border border-[#494847]/30 bg-[#262626] px-3 py-2 text-sm text-white"
            />
            <button type="submit" className="rounded bg-[#d4fe42] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#4c5f00]">
              Add
            </button>
          </form>
          <ul className="space-y-2">
            {data.categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded bg-[#0e0e0e] px-3 py-2 text-sm">
                <span>
                  {c.name} <span className="text-zinc-500">({c.slug})</span>
                </span>
                <button type="button" onClick={() => remove("categories", c.id)} className="text-xs text-[#ff7351]">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "genders" && (
        <section className="rounded-lg bg-[#131313] p-6">
          <form onSubmit={addGender} className="mb-6 flex flex-wrap gap-2">
            <input
              name="name"
              placeholder="Gender label"
              className="min-w-[200px] flex-1 rounded border border-[#494847]/30 bg-[#262626] px-3 py-2 text-sm text-white"
            />
            <button type="submit" className="rounded bg-[#d4fe42] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#4c5f00]">
              Add
            </button>
          </form>
          <ul className="space-y-2">
            {data.genders.map((g) => (
              <li key={g.id} className="flex items-center justify-between rounded bg-[#0e0e0e] px-3 py-2 text-sm">
                <span>
                  {g.name} <span className="text-zinc-500">({g.slug})</span>
                </span>
                <button type="button" onClick={() => remove("genders", g.id)} className="text-xs text-[#ff7351]">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "colors" && (
        <section className="rounded-lg bg-[#131313] p-6">
          <form onSubmit={addColor} className="mb-6 flex flex-wrap items-end gap-2">
            <input
              name="name"
              placeholder="Color name"
              className="min-w-[160px] flex-1 rounded border border-[#494847]/30 bg-[#262626] px-3 py-2 text-sm text-white"
            />
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase text-zinc-500">Hex</label>
              <input name="hex" type="color" defaultValue="#d4fe42" className="h-10 w-14 cursor-pointer rounded border-0 bg-transparent" />
            </div>
            <button type="submit" className="rounded bg-[#d4fe42] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#4c5f00]">
              Add
            </button>
          </form>
          <ul className="space-y-2">
            {data.colors.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded bg-[#0e0e0e] px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
                  {c.name} <span className="text-zinc-500">({c.slug})</span>
                </span>
                <button type="button" onClick={() => remove("colors", c.id)} className="text-xs text-[#ff7351]">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "shoe-sizes" && (
        <section className="rounded-lg bg-[#131313] p-6">
          <form onSubmit={addShoeSize} className="mb-6 flex flex-wrap gap-2">
            <input
              name="eu"
              type="number"
              placeholder="EU size"
              className="w-28 rounded border border-[#494847]/30 bg-[#262626] px-3 py-2 text-sm text-white"
            />
            <input
              name="usLabel"
              placeholder="US label (optional)"
              className="min-w-[160px] flex-1 rounded border border-[#494847]/30 bg-[#262626] px-3 py-2 text-sm text-white"
            />
            <button type="submit" className="rounded bg-[#d4fe42] px-4 py-2 text-xs font-black uppercase tracking-widest text-[#4c5f00]">
              Add
            </button>
          </form>
          <ul className="space-y-2">
            {data.shoeSizes.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded bg-[#0e0e0e] px-3 py-2 text-sm font-mono">
                <span>
                  EU {s.eu} {s.usLabel ? `· ${s.usLabel}` : ""}
                </span>
                <button type="button" onClick={() => remove("shoe-sizes", s.id)} className="text-xs text-[#ff7351]">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

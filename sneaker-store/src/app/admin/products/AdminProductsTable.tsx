"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminProductRow = {
  id: string;
  name: string;
  brandName: string;
  sku: string;
  isActive: boolean;
  totalStock: number;
};

export default function AdminProductsTable({ products }: { products: AdminProductRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function remove(id: string) {
    if (!confirm("Remove this product from the store?")) return;
    setBusy(id);
    setMsg(null);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      deactivated?: boolean;
      message?: string;
    };
    setBusy(null);
    if (!res.ok) {
      setMsg(data.error ?? "Delete failed");
      return;
    }
    setMsg(data.deactivated ? (data.message ?? "Hidden.") : "Deleted.");
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#494847]/20 bg-[#131313]">
      {msg && <p className="border-b border-[#494847]/20 px-4 py-2 text-sm text-[#d4fe42]">{msg}</p>}
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[#494847]/20 text-[10px] font-headline font-black uppercase tracking-widest text-[#adaaaa]">
            <th className="px-4 py-4">Product</th>
            <th className="px-4 py-4">SKU</th>
            <th className="px-4 py-4">Stock</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-4 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-[#494847]/10 text-xs text-white">
              <td className="px-4 py-4">
                <p className="font-headline font-bold">{p.name}</p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">{p.brandName}</p>
              </td>
              <td className="px-4 py-4 font-mono text-[#adaaaa]">{p.sku}</td>
              <td className="px-4 py-4 font-mono text-[#d4fe42]">{p.totalStock}</td>
              <td className="px-4 py-4">
                {!p.isActive ? (
                  <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                    hidden
                  </span>
                ) : (
                  <span className="text-[10px] uppercase text-zinc-500">live</span>
                )}
              </td>
              <td className="px-4 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="rounded border border-[#494847]/40 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#d4fe42]"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() => remove(p.id)}
                    className="rounded border border-[#ff7351]/40 px-2 py-1 text-[10px] font-bold uppercase text-[#ff7351] disabled:opacity-50"
                  >
                    {busy === p.id ? "…" : "Remove"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

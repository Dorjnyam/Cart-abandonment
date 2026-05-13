"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import RoleGuard from "@/components/editorial/RoleGuard";
import { useLanguage } from "@/components/editorial/LanguageContext";
import { fetchTenants } from "@/lib/services/tenants";
import type { Tenant } from "@/types/api";

const STATUS_DOT: Record<string, string> = {
  active: "bg-secondary",
  inactive: "bg-error",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Идэвхтэй",
  inactive: "Идэвхгүй",
};
const PLAN_BADGE: Record<string, string> = {
  full: "bg-secondary/15 text-secondary border border-secondary/20",
  smart: "bg-primary/15 text-primary border border-primary/20",
  basic: "bg-surface-muted text-muted border border-surface-muted",
  pro: "bg-warning/15 text-warning border border-warning/20",
  enterprise: "bg-error/15 text-error border border-error/20",
};

function TenantsContent() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(0);
  const [new30d] = useState(48);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const data = await fetchTenants({ page: p, search: q || undefined });
      setTenants(data.results);
      setTotal(data.summary?.total ?? data.count);
      setActive(data.summary?.active ?? data.results.filter((t) => t.status === "active").length);
      setTotalPages(data.count > 0 ? Math.ceil(data.count / 20) : 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(page, query); }, [load, page, query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Stats хэсэг */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
        {[
          { label: "Нийт дэлгүүр", value: total.toLocaleString(), badge: null },
          { label: "Идэвхтэй", value: active.toLocaleString(), badge: null },
          { label: "Сүүлийн 30 хоног", value: new30d.toLocaleString(), badge: "шинэ бүртгэл" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-surface-muted bg-surface p-6 shadow-sm">
            <p className="text-[0.6875rem] text-muted uppercase tracking-widest font-semibold mb-1">
              {card.label}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-text tracking-tighter">{card.value}</span>
              {card.badge ? (
                <span className="text-xs font-medium text-muted">{card.badge}</span>
              ) : (
                <span className="text-xs font-bold text-secondary inline-flex items-center gap-1 bg-secondary/15 px-2 py-0.5 rounded-md">
                  <TrendingUp className="size-3.5" aria-hidden />
                  12%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Хүснэгт */}
      <div className="bg-surface rounded-xl overflow-hidden border border-surface-muted shadow-card">
        <div className="px-6 py-4 bg-surface-muted flex justify-between items-center gap-4 flex-wrap">
          <form onSubmit={handleSearch} className="flex items-center gap-2 bg-surface border border-surface-muted rounded-lg px-3 py-2">
            <Search className="size-4 text-muted shrink-0" aria-hidden />
            <input
              className="bg-transparent text-sm text-text placeholder:text-muted/50 focus:outline-none w-52"
              placeholder="Хайх..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <span className="text-xs text-muted tabular-nums">
            {loading ? "Ачааллаж байна..." : `Нийт ${total.toLocaleString()} дэлгүүр`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-surface-muted">
                {["Дэлгүүрийн нэр", "Имэйл", "Tier", "Төлөв", "Үүссэн огноо", "Үйлдэл"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-surface-muted">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-5">
                        <div className="h-4 rounded bg-surface-muted animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-muted">
                    Дэлгүүр олдсонгүй.
                  </td>
                </tr>
              ) : (
                tenants.map((t, i) => (
                  <tr key={t.id} className={`border-t border-surface-muted hover:bg-surface-muted/50 transition-colors ${i % 2 === 0 ? "bg-surface" : "bg-surface-muted/20"}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-md bg-primary/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                        <Link href={`/tenants/${t.id}`} className="font-semibold text-text hover:text-primary hover:underline">
                          {t.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted text-xs truncate max-w-[200px]">{t.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter rounded-md ${PLAN_BADGE[t.plan] ?? "bg-surface-muted text-muted"}`}>
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${STATUS_DOT[t.status] ?? "bg-surface-muted-high"}`} aria-hidden />
                        <span className="text-xs font-medium text-text">{STATUS_LABEL[t.status] ?? t.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">
                      {new Date(t.created_at).toLocaleDateString("mn-MN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/tenants/${t.id}`}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Дэлгэрэнгүй
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination хэсэг */}
        <div className="px-6 py-4 bg-surface-muted flex items-center justify-between gap-4">
          <p className="text-xs text-muted font-medium">
            Хуудас {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="size-8 flex items-center justify-center border border-surface-muted rounded hover:bg-surface-muted transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <span className="size-8 flex items-center justify-center border border-primary text-primary rounded bg-primary/10 text-xs font-bold">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="size-8 flex items-center justify-center border border-surface-muted rounded hover:bg-surface-muted transition-colors disabled:opacity-40"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TenantsPage() {
  return (
    <RoleGuard allow={["admin"]}>
      <TenantsInner />
    </RoleGuard>
  );
}

function TenantsInner() {
  const { t } = useLanguage();
  return (
    <EditorialShell activeNav="tenants" title={t.admin.tenants} subtitle={t.admin.subtitle}>
      <TenantsContent />
    </EditorialShell>
  );
}

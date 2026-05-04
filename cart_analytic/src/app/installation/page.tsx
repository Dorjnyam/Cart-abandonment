"use client";

import { useEffect, useState, useCallback } from "react";
import { Ban, BookOpen, Bug, CloudCheck, Copy, Headphones, Loader2, PlusCircle } from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import CodeBlockCard from "@/components/ui/CodeBlockCard";
import PageHeader from "@/components/ui/PageHeader";
import StatusPanel from "@/components/ui/StatusPanel";
import { useToast } from "@/components/ui/Toast";
import { fetchApiKeys, generateApiKey, revokeApiKey } from "@/lib/services/apiKeys";
import type { ApiKey } from "@/types/api";

function buildSnippet(key: string) {
  return `<script>
!(function(c,a,r,t,n,l){
  c.CartAnalytics = c.CartAnalytics || [];
  l = a.createElement(r); n = a.getElementsByTagName(r)[0];
  l.async = 1; l.src = t; n.parentNode.insertBefore(l, n);
})(window, document, 'script', 'https://cdn.cartanalytics.mn/v2.js');

CartAnalytics.init('${key}');
</script>`;
}

export default function InstallationPage() {
  const { showToast } = useToast();
  const [keys, setKeys]           = useState<ApiKey[]>([]);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking]   = useState<number | null>(null);
  const [newKeyPlain, setNewKeyPlain] = useState<string | null>(null);

  const activeKey = keys.find((k) => k.is_active) ?? keys[0] ?? null;
  const displayKey = newKeyPlain ?? activeKey?.key_masked ?? "tk_full_••••••••";
  const snippet = buildSnippet(activeKey?.key_masked ?? "tk_full_••••••••");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApiKeys();
      setKeys(data);
    } catch {
      showToast("API түлхүүр ачааллахад алдаа гарлаа.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    setNewKeyPlain(null);
    try {
      const created = await generateApiKey();
      if (created.key_plain) setNewKeyPlain(created.key_plain);
      await load();
      showToast("Шинэ түлхүүр амжилттай үүсгэгдлээ.", "success");
    } catch {
      showToast("Түлхүүр үүсгэхэд алдаа гарлаа.", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke() {
    if (!activeKey) return;
    setRevoking(activeKey.id);
    try {
      await revokeApiKey(activeKey.id);
      setNewKeyPlain(null);
      await load();
      showToast("Түлхүүр идэвхгүй болгогдлоо.", "success");
    } catch {
      showToast("Түлхүүр идэвхгүй болгоход алдаа гарлаа.", "error");
    } finally {
      setRevoking(null);
    }
  }

  function handleCopy() {
    const text = newKeyPlain ?? activeKey?.key_masked ?? "";
    navigator.clipboard.writeText(text).then(
      () => showToast("Түлхүүр хуулагдлаа.", "success"),
      () => showToast("Хуулахад алдаа гарлаа.", "error"),
    );
  }

  return (
    <EditorialShell activeNav="setup" title="Суулгалт" subtitle="Өгөгдлийн аналитик / API түлхүүр">
      <div className="px-4 sm:px-6 lg:px-8 py-8 pb-16 max-w-6xl mx-auto space-y-10">
        <PageHeader
          title="Суулгалт"
          subtitle="Өгөгдлийн аналитик болон хэрэглэгчийн үйлдлийг хянахын тулд API түлхүүрийг үүсгэж, өөрийн платформдоо тохирох кодыг суулгана уу."
          badges={
            <span className="text-[0.6875rem] font-semibold uppercase tracking-widest text-on-surface-variant border border-outline-variant/15 rounded-full px-3 py-1">
              Тохиргоо / Суулгалт
            </span>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* API Key card */}
          <section className="lg:col-span-5 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-card space-y-6">
            <div>
              <h3 className="text-lg font-bold text-on-surface font-display">API түлхүүр</h3>
              <p className="text-sm text-on-surface-variant mt-1">Сервер хоорондын хүсэлт болон SDK ашиглахад шаардлагатай.</p>
            </div>

            {loading ? (
              <div className="flex h-20 items-center justify-center">
                <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
              </div>
            ) : (
              <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Одоогийн түлхүүр</span>
                  {activeKey ? (
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${activeKey.is_active ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant"}`}>
                      {activeKey.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                    </span>
                  ) : null}
                </div>

                {newKeyPlain ? (
                  <div className="rounded-lg border border-secondary/30 bg-secondary-container/15 px-3 py-2 text-xs text-secondary font-semibold">
                    Энэ түлхүүрийг нэг удаа л харуулна — хадгалаад авна уу!
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/10 bg-surface-container-lowest px-4 py-3 font-mono text-sm text-primary">
                  <span className="truncate">{displayKey}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 rounded-md border border-outline-variant/10 px-2 py-1 text-[0.6875rem] font-semibold text-on-surface hover:bg-surface-alt shrink-0"
                    aria-label="Түлхүүр хуулах"
                  >
                    <Copy className="size-3.5" aria-hidden />
                    Хуулах
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={generating || loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-on-primary shadow-sm hover:opacity-95 transition-opacity disabled:opacity-60"
              >
                {generating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <PlusCircle className="size-5" aria-hidden />}
                {generating ? "Үүсгэж байна..." : "Шинэ түлхүүр үүсгэх"}
              </button>
              <button
                type="button"
                onClick={() => void handleRevoke()}
                disabled={!activeKey || revoking !== null || loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-error/25 py-3 text-sm font-semibold text-error hover:bg-error-container/15 transition-colors disabled:opacity-40"
              >
                {revoking !== null ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Ban className="size-5" aria-hidden />}
                {revoking !== null ? "Идэвхгүй болгож байна..." : "Идэвхгүй болгох"}
              </button>
            </div>
          </section>

          {/* Snippet section */}
          <section className="lg:col-span-7 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-card space-y-5">
            <div>
              <h3 className="text-lg font-bold text-on-surface font-display">Snippet суулгах</h3>
              <p className="text-sm text-on-surface-variant mt-1">Кодыг &lt;head&gt; хэсэгт хуулж тавина уу.</p>
            </div>

            <div className="flex gap-1 rounded-lg border border-outline-variant/15 bg-surface-container-low p-0.5">
              <button type="button" className="flex-1 rounded-md bg-surface-container-lowest py-2 text-sm font-bold text-on-surface shadow-sm border border-outline-variant/10">
                HTML/Vanilla
              </button>
              <button type="button" className="flex-1 rounded-md py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
                Next.js
              </button>
              <button type="button" className="flex-1 rounded-md py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
                Shopify
              </button>
            </div>

            <CodeBlockCard code={snippet} language="html" />

            <div className="flex gap-3 rounded-lg border border-secondary/25 bg-secondary-container/15 px-4 py-3">
              <span className="mt-0.5 text-secondary shrink-0">
                <CloudCheck className="size-5" aria-hidden />
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                <strong className="text-on-surface">Зөвлөмж:</strong> Client-side tracking идэвхжүүлбэл нарийвчлал ~40%-иар сайжина.
              </p>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <StatusPanel uptimePct={99.9} statusText="Өгөгдөл ирж байна…" />
          </div>
          <div className="lg:col-span-7 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                <CloudCheck className="size-7" aria-hidden />
              </div>
              <div>
                <h4 className="text-base font-bold text-on-surface">Холболтын төлөв</h4>
                <p className="text-sm text-on-surface-variant mt-1">Холбогдсон — сүүлийн event 3 минутын өмнө</p>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <div className="font-display text-2xl font-semibold text-primary tabular-nums">1,204</div>
                <div className="text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant">Өнөөдрийн event</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl font-semibold text-primary tabular-nums">99.9%</div>
                <div className="text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { Icon: BookOpen, title: "Баримт бичиг", desc: "SDK суулгах болон тохируулах заавар." },
            { Icon: Headphones, title: "Техник тусламж", desc: "Хөгжүүлэгчидтэй холбогдох, асуудал шийдвэрлэх." },
            { Icon: Bug, title: "Debugger", desc: "Ирж буй өгөгдлийг бодит цагт шалгах." },
          ].map((c) => (
            <div
              key={c.title}
              className="group rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card transition-colors hover:border-primary/15 hover:shadow-md cursor-pointer"
            >
              <div className="mb-3 text-primary transition-transform group-hover:scale-105">
                <c.Icon className="size-8" strokeWidth={1.5} aria-hidden />
              </div>
              <h5 className="font-bold text-on-surface">{c.title}</h5>
              <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </EditorialShell>
  );
}

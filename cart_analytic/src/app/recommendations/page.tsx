"use client";

import { useState, useMemo, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  History,
  Info,
  Loader2,
  RefreshCw,
  Tag,
  TrendingUp,
} from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import { useAuth } from "@/components/editorial/AuthContext";
import Fab from "@/components/ui/Fab";
import FilterToolbar, { FilterSelect } from "@/components/ui/FilterToolbar";
import KanbanCard from "@/components/ui/KanbanCard";
import KanbanColumn from "@/components/ui/KanbanColumn";
import type { Recommendation, RecommendationStatus } from "@/lib/services/recommendations";
import { getRecommendations, updateRecommendationStatus } from "@/lib/services/recommendations";

const severityConfig = {
  urgent: { label: "S1 Яаралтай", riskTone: "high" as const, Icon: AlertTriangle },
  optimization: { label: "Оновчлол", riskTone: "med" as const, Icon: TrendingUp },
  info: { label: "Мэдээлэл", riskTone: "low" as const, Icon: Info },
  deferred: { label: "Хойшлуулсан", riskTone: "low" as const, Icon: History },
};

function riskTagFromSeverity(sev: Recommendation["severity"]) {
  const c = severityConfig[sev] ?? severityConfig.info;
  if (sev === "urgent") return { tag: "Өндөр эрсдэл", tone: "high" as const };
  if (sev === "optimization") return { tag: "Дунд эрсдэл", tone: "med" as const };
  return { tag: c.label, tone: "low" as const };
}

export default function RecommendationsPage() {
  const { role } = useAuth();
  const canAct = role === "owner" || role === "member";

  const [allRecs, setAllRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRecommendations().then(({ results }) => {
      if (!cancelled) {
        setAllRecs(results ?? []);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(
    () => ({
      total: allRecs.length,
      implemented: allRecs.filter((r) => r.status === "implemented").length,
      deferred: allRecs.filter((r) => r.status === "deferred").length,
      new: allRecs.filter((r) => r.status === "new").length,
    }),
    [allRecs],
  );

  const cols = useMemo(() => {
    const n = allRecs.filter((r) => r.status === "new");
    const prog = allRecs.filter((r) => r.status === "deferred");
    const implemented = allRecs.filter((r) => r.status === "implemented");
    const validated = implemented.filter((r) => r.tags.some((t) => t.toLowerCase().includes("top")));
    const doneOnly = implemented.filter((r) => !r.tags.some((t) => t.toLowerCase().includes("top")));
    return {
      new: n,
      progress: prog,
      done: doneOnly,
      validated,
    };
  }, [allRecs]);

  async function handleStatusChange(id: string, status: RecommendationStatus) {
    setActionLoading(id);
    try {
      await updateRecommendationStatus(id, status);
      setAllRecs((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } finally {
      setActionLoading(null);
    }
  }

  function renderCard(rec: Recommendation) {
    const { tag, tone } = riskTagFromSeverity(rec.severity);
    const sev = severityConfig[rec.severity] ?? severityConfig.info;
    const isDeferred = rec.status === "deferred";
    const isActing = actionLoading === rec.id;

    return (
      <KanbanCard
        riskTag={tag}
        riskTone={tone}
        title={rec.title}
        description={rec.description}
        muted={isDeferred && rec.status === "deferred"}
        synthesis={
          <span>
            &ldquo;{rec.title}&rdquo; — checkout урсгалд шууд нөлөөлнө. Үр дүнг KPI-аар хэмжихийг зөвлөж байна.
          </span>
        }
        metrics={
          <div className="flex flex-wrap gap-2 text-on-surface-variant">
            {rec.impactBefore ? (
              <span className="rounded-md border border-error/20 bg-error/5 px-2 py-0.5 font-medium text-error">← {rec.impactBefore}</span>
            ) : null}
            {rec.impactAfter ? (
              <span className="rounded-md border border-secondary/25 bg-secondary-container/40 px-2 py-0.5 font-medium text-on-secondary-container">
                → {rec.impactAfter}
              </span>
            ) : null}
            <span className="rounded-md border border-outline-variant/15 px-2 py-0.5">Хүчин зүйл: {rec.tags.length}</span>
          </div>
        }
        footer={
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {rec.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-md border border-outline-variant/10 bg-surface-alt px-2 py-0.5 text-[0.6875rem] font-medium text-on-surface-variant"
                >
                  <Tag className="size-3" aria-hidden />
                  {t}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[0.625rem] text-on-surface-variant">{rec.createdAt}</span>
              <div className="flex items-center gap-1 text-[0.625rem] font-semibold text-on-surface-variant">
                <sev.Icon className="size-3.5" aria-hidden />
                {sev.label}
              </div>
            </div>
            {rec.status === "implemented" ? (
              <div className="rounded-md border border-primary/20 bg-primary-container/30 px-2 py-1.5 text-[0.6875rem] font-semibold text-on-primary-container">
                Эцсийн синтез: KPI сайжсан — баталгаажуулахад бэлэн.
              </div>
            ) : null}
            {rec.status === "deferred" ? (
              <div className="space-y-1">
                <div className="flex justify-between text-[0.625rem] font-bold uppercase tracking-wide text-on-surface-variant">
                  <span>Хэрэгжилт</span>
                  <span>65%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                  <div className="h-full w-[65%] rounded-full bg-primary" />
                </div>
              </div>
            ) : null}
            {canAct ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {rec.status !== "implemented" ? (
                  <button
                    type="button"
                    disabled={isActing}
                    onClick={() => handleStatusChange(rec.id, "implemented")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary disabled:opacity-50"
                  >
                    {isActing ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <CheckCircle2 className="size-3.5" aria-hidden />}
                    Хэрэгжлээ
                  </button>
                ) : null}
                {rec.status === "deferred" ? (
                  <button
                    type="button"
                    disabled={isActing}
                    onClick={() => handleStatusChange(rec.id, "new")}
                  className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/10 bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-on-surface shadow-card disabled:opacity-50"
                  >
                    Дахин идэвхжүүлэх
                  </button>
                ) : rec.status !== "implemented" ? (
                  <button
                    type="button"
                    disabled={isActing}
                    onClick={() => handleStatusChange(rec.id, "deferred")}
                    className="inline-flex items-center gap-1 rounded-lg border border-outline-variant/10 bg-surface-container-lowest px-3 py-1.5 text-xs font-bold text-on-surface-variant shadow-card disabled:opacity-50"
                  >
                    Хойшлуулах
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="flex items-center gap-2 text-[0.625rem] text-on-surface-variant">
              <span>Тус болсон уу?</span>
              <button type="button" className="rounded border border-outline-variant/10 px-2 py-0.5 font-semibold hover:bg-surface-alt">
                Тийм
              </button>
              <button type="button" className="rounded border border-outline-variant/10 px-2 py-0.5 font-semibold hover:bg-surface-alt">
                Үгүй
              </button>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <EditorialShell activeNav="recommendations" title="Зөвлөмж" subtitle="AI-д суурилсан зөвлөмжүүд">
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-450 mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[1.1rem] font-semibold text-on-surface tracking-tight">Зөвлөмжийн бүртгэл</h1>
            <p className="text-[13px] text-on-surface-variant mt-0.5">CartAnalytics AI-аас үүссэн нарийвчилсан ойлголтууд.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              getRecommendations().then(({ results }) => {
                setAllRecs(results);
                setLoading(false);
              });
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/[0.1] bg-surface-container-lowest px-3 py-2 text-[13px] font-semibold text-on-surface hover:bg-surface-alt transition-colors"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Шинэчлэх
          </button>
        </div>

        {/* KPI bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-[#2563eb]/20 bg-[#2563eb]/6 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#3b82f6]/80">Нийт нөлөө</p>
            <p className="mt-1.5 text-[1.5rem] font-semibold text-[#3b82f6] tabular-nums">+12.4%</p>
          </div>
          <div className="rounded-lg border border-outline-variant/[0.09] bg-surface-container-lowest px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Хүлээгдэж буй</p>
            <p className="mt-1.5 text-[1.5rem] font-semibold text-on-surface tabular-nums">+8.2%</p>
          </div>
          <div className="rounded-lg border border-outline-variant/[0.09] bg-surface-container-lowest px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Нийт зөвлөмж</p>
            <p className="mt-1.5 text-[1.5rem] font-semibold text-on-surface tabular-nums">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-[#10b981]/20 bg-[#10b981]/5 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#10b981]/80">Хэрэгжсэн</p>
            <p className="mt-1.5 text-[1.5rem] font-semibold text-[#10b981] tabular-nums">{stats.implemented}</p>
          </div>
        </div>

        <FilterToolbar>
          <FilterSelect label="Нөлөө">
            <span className="text-on-surface">Ихээс бага</span>
          </FilterSelect>
          <FilterSelect label="Эрсдэл">
            <span className="text-on-surface">Бүх түвшин</span>
          </FilterSelect>
        </FilterToolbar>

        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-70 flex-1 rounded-xl border border-outline-variant/[0.09] bg-surface-container-lowest p-4 animate-pulse h-64" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            <KanbanColumn title="Шинэ" count={cols.new.length} dotClass="bg-primary">
              {cols.new.map((rec) => (
                <div key={rec.id}>{renderCard(rec)}</div>
              ))}
              {cols.new.length === 0 ? (
                <p className="text-xs text-on-surface-variant px-1 py-4 text-center">Хоосон багана.</p>
              ) : null}
            </KanbanColumn>
            <KanbanColumn title="Хийгдэж байна" count={cols.progress.length} dotClass="bg-sky-400">
              {cols.progress.map((rec) => (
                <div key={rec.id}>{renderCard(rec)}</div>
              ))}
              {cols.progress.length === 0 ? (
                <p className="text-xs text-on-surface-variant px-1 py-4 text-center">Хоосон багана.</p>
              ) : null}
            </KanbanColumn>
            <KanbanColumn title="Дууссан" count={cols.done.length} dotClass="bg-slate-400">
              {cols.done.map((rec) => (
                <div key={rec.id}>{renderCard(rec)}</div>
              ))}
              {cols.done.length === 0 ? (
                <p className="text-xs text-on-surface-variant px-1 py-4 text-center">Хоосон багана.</p>
              ) : null}
            </KanbanColumn>
            <KanbanColumn title="Баталгаажсан" count={cols.validated.length} dotClass="bg-emerald-500">
              {cols.validated.map((rec) => (
                <KanbanCard
                  key={`v-${rec.id}`}
                  riskTag="Топ гүйцэтгэл"
                  riskTone="top"
                  title={rec.title}
                  description={rec.description}
                  metrics={<span className="font-display text-lg font-semibold text-primary">+15.8% AOV</span>}
                  synthesis="Бизнес логикоор баталгаажсан — KPI ахин давтагдах боломжтой."
                  footer={
                    <button type="button" className="text-xs font-bold text-primary hover:underline">
                      Дэлгэрэнгүй
                    </button>
                  }
                />
              ))}
              {cols.validated.length === 0 ? (
                <div className="rounded-lg border border-dashed border-outline-variant/10 bg-surface-alt/30 p-6 text-center text-xs text-on-surface-variant">
                  Топ гүйцэтгэлтэй, баталгаажсан зөвлөмж энд харагдана.
                </div>
              ) : null}
            </KanbanColumn>
          </div>
        )}
      </div>
      <Fab />
    </EditorialShell>
  );
}

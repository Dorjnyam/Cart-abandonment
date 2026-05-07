"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import EditorialShell from "@/components/editorial/EditorialShell";
import { getDiagnosisDetail, type DiagnosisEntry } from "@/lib/services/diagnosis";

const SCORE_META: Record<string, { label: string; color: string }> = {
  S1: { label: "Psychological hesitation", color: "bg-error" },
  S2: { label: "Technical friction", color: "bg-error" },
  S3: { label: "Trust issue", color: "bg-tertiary" },
  S4: { label: "Mobile usability issue", color: "bg-tertiary" },
  S5: { label: "Price sensitivity", color: "bg-tertiary" },
  S6: { label: "Indecision/navigation disorder", color: "bg-secondary" },
  S7: { label: "External influence/referral effect", color: "bg-error" },
};

export default function DiagnosisDetailPage() {
  const params = useParams<{ id: string }>();
  const [entry, setEntry] = useState<DiagnosisEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    getDiagnosisDetail(params.id)
      .then(setEntry)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const scores = entry?.scores ?? {};

  return (
    <EditorialShell activeNav="diagnosis" title="Оношлогооны дэлгэрэнгүй" subtitle={`Оношлогоо / ${params.id}`}>
      <div className="px-8 py-6 space-y-4">
        <Link href="/diagnosis" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="size-4" aria-hidden />
          Жагсаалт руу буцах
        </Link>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
          </div>
        ) : !entry ? (
          <div className="rounded-lg border border-outline-variant/20 bg-surface-container-lowest p-8 text-sm text-on-surface-variant">
            No persisted diagnosis exists for this session.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* S1-S7 scores */}
            <section className="lg:col-span-4 bg-surface-container-lowest p-6 rounded-xl">
              <h3 className="font-bold text-on-surface mb-4">S1-S7 оноо</h3>
              {entry ? (
                <div className="mb-3 rounded-lg border border-outline-variant/10 bg-surface-container-low px-4 py-2.5 text-xs text-on-surface-variant space-y-1">
                  <div>Session: <span className="font-mono font-semibold text-on-surface">{entry.sessionId}</span></div>
                  <div>Огноо: <span className="font-semibold text-on-surface">{entry.createdAt}</span></div>
                </div>
              ) : null}
              <div className="space-y-4">
                {(["S1", "S2", "S3", "S4", "S5", "S6", "S7"] as const).map((k) => {
                  const meta = SCORE_META[k]!;
                  const val = scores[k] ?? 0;
                  return (
                    <div key={k} className="bg-surface-container-low p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.6875rem] font-black text-on-surface-variant">{k}</span>
                        <span className="text-lg font-bold text-on-surface">{val.toFixed(2)}</span>
                      </div>
                      <p className="text-sm font-semibold text-on-surface mt-1">{meta.label}</p>
                      <div className="h-2 bg-surface-container mt-3 rounded-full overflow-hidden">
                        <div className={`${meta.color} h-2 rounded-full`} style={{ width: `${val * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Feature values */}
            <section className="lg:col-span-5 bg-surface-container-lowest p-6 rounded-xl">
              <h3 className="font-bold text-on-surface mb-4">Feature утгууд</h3>
              {entry?.scores ? (
                <div className="space-y-2">
                  {Object.entries(entry.scores).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-3 gap-2 bg-surface-container-low p-2 rounded-md">
                      <span className="font-mono text-xs text-on-surface">{k}</span>
                      <span className="text-on-surface text-xs">{v.toFixed(3)}</span>
                      <span className="text-[0.6875rem] font-bold text-primary">{entry.dominantScore}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6 text-sm">
                  <div>
                    <h4 className="font-bold text-on-surface-variant mb-2">Tier 3</h4>
                    <div className="space-y-2">
                      {[["tab_hidden_count", "7", "S1"], ["back_button_count", "3", "S2"], ["copy_count", "2", "S1"]].map(([f, val, s]) => (
                        <div key={f} className="grid grid-cols-3 gap-2 bg-surface-container-low p-2">
                          <span className="font-mono text-xs text-on-surface">{f}</span>
                          <span className="text-on-surface">{val}</span>
                          <span className="text-[0.6875rem] font-bold text-primary">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface-variant mb-2">Tier 2</h4>
                    <div className="space-y-2">
                      {[["visit_count", "5", "S1"], ["checkout_step", "payment", "S2"]].map(([f, val, s]) => (
                        <div key={f} className="grid grid-cols-3 gap-2 bg-surface-container-low p-2">
                          <span className="font-mono text-xs text-on-surface">{f}</span>
                          <span className="text-on-surface">{val}</span>
                          <span className="text-[0.6875rem] font-bold text-primary">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Recommendation */}
            <section className="lg:col-span-3 bg-surface-container-lowest p-6 rounded-xl">
              <h3 className="font-bold text-on-surface mb-4">Зөвлөмж</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Checkout төлбөрийн хэсэг дээр хэрэглэгчийн эргэлзээ өндөр байна. Төлбөрийн алхамын өмнө итгэлцлийн
                micro-copy болон буцаалтын баталгааг тодруулж өгнө үү.
              </p>
              <div className="mt-6 flex gap-2">
                <button className="px-4 py-2 bg-secondary text-on-secondary text-xs font-bold uppercase rounded-md">Хэрэгжлээ</button>
                <button className="px-4 py-2 bg-surface-container text-on-surface text-xs font-bold uppercase rounded-md">Хойшлуулах</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </EditorialShell>
  );
}

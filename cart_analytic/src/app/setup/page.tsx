"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import RoleGuard from "@/components/editorial/RoleGuard";
import CodeBlockCard from "@/components/ui/CodeBlockCard";
import InsightQuote from "@/components/ui/InsightQuote";
import PageHeader from "@/components/ui/PageHeader";
import StatusPanel from "@/components/ui/StatusPanel";

const snippets = {
  html: `<script src="https://cdn.cart.mn/track.js"></script>
<script>CartAnalytics.init("pk_live_...")</script>`,
  next: `import { CartAnalytics } from "@cart/next";

CartAnalytics.init(process.env.NEXT_PUBLIC_CART_KEY!);`,
  shopify: `{% comment %} theme.liquid {% endcomment %}
{% render 'cart-analytics', api_key: 'pk_live_...' %}`,
};

export default function SetupPage() {
  return (
    <RoleGuard allow={["owner", "developer"]}>
      <EditorialShell activeNav="setup" title="Суулгалт" subtitle="SDK / API тохиргоо">
        <SetupContent />
      </EditorialShell>
    </RoleGuard>
  );
}

function SetupContent() {
  const [tab, setTab] = useState<"html" | "next" | "shopify">("html");
  const code = snippets[tab];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-[1400px] mx-auto space-y-8">
      <PageHeader
        title="CartAnalytics SDK суулгалт"
        subtitle="Скрипт эхлүүлэх, эвент илгээхийг шалгах алхмуудыг нэг дор дагана уу."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-8 space-y-5">
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-lg border border-outline-variant/15 bg-surface-container-low p-0.5">
                {(
                  [
                    ["html", "HTML / Vanilla"],
                    ["next", "Next.js"],
                    ["shopify", "Shopify Liquid"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={[
                      "px-3 py-2 text-xs font-bold rounded-md transition-colors",
                      tab === id ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-[0.625rem] font-mono font-semibold text-on-surface-variant border border-outline-variant/15 rounded-md px-2 py-1">
                v4.2.0-stable
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-on-surface mb-2">1. Скрипт эхлүүлэх</h3>
              <CodeBlockCard code={code} language={tab === "html" ? "html" : tab === "next" ? "tsx" : "liquid"} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-on-surface mb-2">2. Эвент илгээлтийг баталгаажуулах</h3>
              <div className="rounded-lg border border-outline-variant/15 bg-surface-container-low px-4 py-3 font-mono text-xs text-on-surface">
                CartAnalytics.track(&quot;checkout_step_completed&quot;, {"{"} step: 2 {"}"});
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-outline-variant/10 bg-surface-container-lowest px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-on-surface hover:bg-surface-alt"
                  onClick={() => {
                    void navigator.clipboard.writeText(`CartAnalytics.track("checkout_step_completed", { step: 2 });`);
                  }}
                >
                  <Copy className="size-3.5" aria-hidden />
                  Хуулах
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-5 shadow-card">
            <h3 className="text-sm font-bold text-on-surface mb-4">Суулгалтын замнал</h3>
            <ol className="space-y-4">
              {[
                { n: "01", title: "API түлхүүр авах", done: true },
                { n: "02", title: "SDK суулгах", done: false, active: true },
                { n: "03", title: "Production шалгалт", done: false },
              ].map((step) => (
                <li key={step.n} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={[
                        "flex size-9 items-center justify-center rounded-full border text-xs font-bold",
                        step.done
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50"
                          : step.active
                            ? "border-primary bg-primary-container text-on-primary-container"
                            : "border-outline-variant/10 text-on-surface-variant",
                      ].join(" ")}
                    >
                      {step.done ? <Check className="size-4" aria-hidden /> : step.n}
                    </span>
                    <span className="w-px flex-1 min-h-[12px] bg-outline-variant/30 mt-1" aria-hidden />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${step.active ? "text-on-surface" : "text-on-surface-variant"}`}>{step.title}</p>
                    {step.active ? <p className="text-xs text-on-surface-variant mt-0.5">Одоо энэ алхам дээр байна.</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-4">
          <StatusPanel />
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 shadow-card space-y-2">
            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant">Суулгалтын зөвлөгөө</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <code className="font-mono text-[0.6875rem] bg-surface-container-low px-1 rounded">payment_intent_created</code> эвентийг
              заавал илгээнэ үү — төлбөрийн орхилтыг нарийвчлан хэмжинэ.
            </p>
          </div>
          <InsightQuote>Өгөгдөл бүртгэгдэх бүрт шийдвэр илүү тодорхой болно.</InsightQuote>
          <div className="rounded-xl bg-primary px-5 py-5 text-on-primary shadow-md space-y-3">
            <p className="text-sm font-semibold leading-snug">Техникийн саад бэрхшээл байна уу?</p>
            <p className="text-xs text-white/85">Интеграцийн аудит — багийн инженертэй 30 минутын уулзалт.</p>
            <button
              type="button"
              className="w-full rounded-lg bg-white py-2.5 text-sm font-bold text-primary hover:bg-sky-50 transition-colors"
            >
              Аудит захиалах
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import RoleGuard from "@/components/editorial/RoleGuard";
import { useLanguage } from "@/components/editorial/LanguageContext";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

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
      <SetupContent />
    </RoleGuard>
  );
}

function SetupContent() {
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState<"html" | "next" | "shopify">("html");
  const code = snippets[tab];

  const labels = {
    title: t.installation.title,
    subtitle:
      lang === "EN"
        ? "Choose your storefront stack and copy the bootstrapping snippet."
        : "Storefront-ын стек сонгоод эхлүүлэх snippet-ийг хуулна уу.",
    bootstrap: lang === "EN" ? "Bootstrap script" : "Скрипт эхлүүлэх",
    verify: lang === "EN" ? "Verify event flow" : "Эвент илгээлтийг баталгаажуулах",
    journey: lang === "EN" ? "Installation journey" : "Суулгалтын замнал",
    journeySteps: [
      { n: "01", title: lang === "EN" ? "Obtain API key" : "API түлхүүр авах", done: true },
      { n: "02", title: lang === "EN" ? "Install SDK" : "SDK суулгах", done: false, active: true },
      {
        n: "03",
        title: lang === "EN" ? "Verify in production" : "Production шалгалт",
        done: false,
      },
    ],
    tip: lang === "EN" ? "Installation tip" : "Суулгалтын зөвлөгөө",
    tipBody:
      lang === "EN" ? (
        <>
          Always emit <code className="font-mono text-[11px] bg-surface-muted px-1 rounded">payment_intent_created</code> — it measures payment-step abandonment precisely.
        </>
      ) : (
        <>
          <code className="font-mono text-[11px] bg-surface-muted px-1 rounded">payment_intent_created</code> эвентийг заавал илгээнэ — төлбөрийн орхилт хэмжигдэнэ.
        </>
      ),
    needHelp: lang === "EN" ? "Technical roadblock?" : "Техникийн саад бэрхшээл байна уу?",
    needHelpDesc:
      lang === "EN"
        ? "Integration audit — 30 minutes with our engineer."
        : "Интеграцийн аудит — багийн инженертэй 30 минутын уулзалт.",
    bookAudit: lang === "EN" ? "Book audit" : "Аудит захиалах",
    copy: t.installation.copy,
  };

  return (
    <EditorialShell activeNav="setup" title={labels.title} subtitle={labels.subtitle}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-8 space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="inline-flex rounded-xl border border-surface-muted bg-bg p-1">
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
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors",
                      tab === id ? "bg-primary text-white shadow-sm" : "text-muted hover:text-text",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-mono font-bold text-muted border border-surface-muted rounded-md px-2 py-1">
                v4.2.0-stable
              </span>
            </div>
            <h3 className="text-sm font-bold text-text mb-2">1. {labels.bootstrap}</h3>
            <pre className="overflow-x-auto bg-[#0E1110] text-[#86D9A7] rounded-xl px-5 py-4 text-[12px] leading-relaxed font-mono mb-6">
              <code>{code}</code>
            </pre>
            <h3 className="text-sm font-bold text-text mb-2">2. {labels.verify}</h3>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-muted bg-bg px-4 py-3 font-mono text-xs text-text">
              <span className="truncate">
                CartAnalytics.track(&quot;checkout_step_completed&quot;, {"{"} step: 2 {"}"});
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-muted text-text text-[11px] font-bold hover:bg-surface-muted/70"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    `CartAnalytics.track("checkout_step_completed", { step: 2 });`,
                  );
                }}
              >
                <Copy className="size-3.5" />
                {labels.copy}
              </button>
            </div>
          </Card>

          <Card title={labels.journey}>
            <ol className="space-y-5">
              {labels.journeySteps.map((step) => (
                <li key={step.n} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex w-10 h-10 items-center justify-center rounded-full border text-xs font-bold",
                        step.done
                          ? "border-success bg-success/10 text-success"
                          : step.active
                            ? "border-primary bg-primary text-white"
                            : "border-surface-muted text-muted",
                      )}
                    >
                      {step.done ? <Check className="size-4" /> : step.n}
                    </span>
                    <span className="w-px flex-1 min-h-3 bg-surface-muted mt-2" />
                  </div>
                  <div>
                    <p className={cn("text-sm font-bold", step.active ? "text-text" : "text-muted")}>
                      {step.title}
                    </p>
                    {step.active ? (
                      <p className="text-xs text-muted mt-0.5">
                        {lang === "EN" ? "Currently on this step." : "Одоо энэ алхам дээр байна."}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </section>

        <aside className="lg:col-span-4 space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{labels.tip}</p>
            </div>
            <p className="text-xs text-muted leading-relaxed">{labels.tipBody}</p>
          </Card>
          <div className="rounded-xl bg-primary px-6 py-6 text-white space-y-3 shadow-md">
            <p className="text-sm font-bold leading-snug">{labels.needHelp}</p>
            <p className="text-xs text-white/85 leading-relaxed">{labels.needHelpDesc}</p>
            <button
              type="button"
              className="w-full rounded-xl bg-white py-2.5 text-sm font-bold text-primary hover:bg-white/90 transition-colors"
            >
              {labels.bookAudit}
            </button>
          </div>
        </aside>
      </div>
    </EditorialShell>
  );
}

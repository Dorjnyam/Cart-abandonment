"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  Check,
  Code2,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import { useAuth } from "@/components/editorial/AuthContext";
import { useLanguage } from "@/components/editorial/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import {
  fetchStoreSettings,
  updateStoreSettings,
  fetchTeamMembers,
  inviteMember,
  removeMember,
  type StoreSettings,
} from "@/lib/services/settings";
import {
  fetchApiKeys,
  generateApiKey,
  revokeApiKey,
  type ApiKeyTier,
  type GeneratedApiKey,
} from "@/lib/services/apiKeys";
import type { ApiKey, ApiKeyEnvironment, TeamMember } from "@/types/api";
import { relativeTimeLabel, roleLabel, serviceStatusLabel } from "@/lib/mn-labels";

type SettingsTab = "profile" | "keys" | "team" | "billing" | "danger";

const TABS: Array<{ id: SettingsTab; label: string; Icon: typeof Building2; description: string }> = [
  { id: "profile", label: "Компанийн профайл", Icon: Building2, description: "Дэлгүүрийн таних мэдээлэл, локал болон tenant metadata." },
  { id: "keys", label: "Хяналт ба API түлхүүр", Icon: KeyRound, description: "Observer нэвтрэх мэдээлэл үүсгэж удирдана." },
  { id: "team", label: "Багийн гишүүд", Icon: Users, description: "Багийн гишүүн урих, эрх удирдах." },
  { id: "billing", label: "Төлбөр / Төлөвлөгөө", Icon: CreditCard, description: "Төлөвлөгөө, лимит болон нэхэмжлэл." },
  { id: "danger", label: "Эрсдэлтэй бүс", Icon: AlertTriangle, description: "Энэ workspace-ийн буцаах боломжгүй үйлдлүүд." },
];

const API_KEY_TIERS: Array<{ value: ApiKeyTier; label: string; description: string }> = [
  { value: "full", label: "Бүрэн", description: "Бүрэн clickstream + худалдааны эвентүүд." },
  { value: "smart", label: "Ухаалаг", description: "Хөнгөн payload-той behavior эвентүүд." },
  { value: "basic", label: "Үндсэн", description: "Зөвхөн хуудас болон сессийн эвентүүд." },
];

const ENVIRONMENTS: Array<{ value: ApiKeyEnvironment; label: string }> = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Хөгжүүлэлт" },
];

const INDUSTRIES = [
  "Жижиглэн худалдаа / Marketplace",
  "Загвар ба хувцас",
  "Электроник",
  "Эрүүл мэнд ба гоо сайхан",
  "Гэр ба цэцэрлэг",
  "Хүнс ба хүнсний бараа",
  "Бусад",
];

const CURRENCIES = ["MNT", "USD", "EUR", "JPY", "KRW", "CNY"];

const TIMEZONES = [
  "Asia/Ulaanbaatar",
  "UTC",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Europe/London",
  "America/New_York",
];

function fallbackCopy(value: string): boolean {
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return value;
  }
}

function formatRelative(value?: string | null) {
  return relativeTimeLabel(value);
}

function StatusPill({
  tone,
  children,
}: {
  tone: "success" | "warn" | "danger" | "neutral";
  children: React.ReactNode;
}) {
  const map = {
    success: { bg: "rgb(31 77 62 / 0.08)", fg: "#1F4D3E" },
    warn:    { bg: "rgb(156 107 20 / 0.10)", fg: "#7C5410" },
    danger:  { bg: "rgb(160 53 33 / 0.08)", fg: "#7E2A1A" },
    neutral: { bg: "rgb(28 25 23 / 0.04)", fg: "rgb(87 83 78)" },
  } as const;
  const tones = map[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ background: tones.bg, color: tones.fg }}
    >
      {children}
    </span>
  );
}

function FieldShell({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-on-surface-variant">{hint}</p> : null}
    </div>
  );
}

function inputClass(disabled = false) {
  return [
    "w-full rounded-md border border-outline-variant/[0.12] bg-surface-container-low px-3 py-2 text-[13px] text-on-surface",
    "focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40",
    disabled ? "opacity-50" : "",
  ].join(" ");
}

function SettingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = (searchParams?.get("tab") as SettingsTab | null) ?? null;
  const initialTab: SettingsTab = TABS.some((t) => t.id === tabParam) ? (tabParam as SettingsTab) : "profile";

  const { role } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const isOwner = role === "owner" || role === "admin";

  const [tab, setTab] = useState<SettingsTab>(initialTab);

  function selectTab(next: SettingsTab) {
    setTab(next);
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", next);
    router.replace(`/settings?${params.toString()}`);
  }

  // Profile болон store
  const [store, setStore] = useState<StoreSettings>({ name: "", domain: "", plan: "", timezone: "" });
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeSaving, setStoreSaving] = useState(false);

  // Team хэсэг
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  // API key хэсэг
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newCredential, setNewCredential] = useState<GeneratedApiKey | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState<"key" | "snippet" | null>(null);
  const [keyName, setKeyName] = useState("Production дэлгүүр");
  const [keyTier, setKeyTier] = useState<ApiKeyTier>("full");
  const [keyEnv, setKeyEnv] = useState<ApiKeyEnvironment>("production");

  const loadStore = useCallback(async () => {
    setStoreLoading(true);
    try {
      setStore(await fetchStoreSettings());
    } catch {
      showToast("Компанийн профайл ачаалж чадсангүй.", "error");
    } finally {
      setStoreLoading(false);
    }
  }, [showToast]);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      setMembers(await fetchTeamMembers());
    } catch {
      showToast("Багийн гишүүдийг ачаалж чадсангүй.", "error");
    } finally {
      setMembersLoading(false);
    }
  }, [showToast]);

  const loadKeys = useCallback(async () => {
    setKeysLoading(true);
    try {
      setApiKeys(await fetchApiKeys());
    } catch {
      showToast("API түлхүүрүүдийг ачаалж чадсангүй.", "error");
    } finally {
      setKeysLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (tab === "profile") void loadStore();
    if (tab === "team") void loadMembers();
    if (tab === "keys") void loadKeys();
  }, [tab, loadStore, loadMembers, loadKeys]);

  // Header-т хэрэгтэй profile-ийн товч мэдээллийг үргэлж ачаална.
  useEffect(() => {
    void loadStore();
  }, [loadStore]);

  async function handleSaveStore(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStoreSaving(true);
    try {
      const updated = await updateStoreSettings(store);
      setStore(updated);
      showToast("Компанийн профайл хадгалагдлаа.", "success");
    } catch {
      showToast("Компанийн профайлыг хадгалж чадсангүй.", "error");
    } finally {
      setStoreSaving(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await inviteMember(inviteEmail.trim(), inviteRole);
      await loadMembers();
      showToast(`${inviteEmail} хаяг руу урилга илгээгдлээ.`, "success");
      setInviteEmail("");
      setInviteOpen(false);
    } catch {
      showToast("Урилга илгээж чадсангүй.", "error");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(id: number) {
    try {
      await removeMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      showToast("Гишүүн хасагдлаа.", "success");
    } catch {
      showToast("Гишүүнийг хасаж чадсангүй.", "error");
    }
  }

  function markCopied(target: "key" | "snippet") {
    setCopiedTarget(target);
    window.setTimeout(() => {
      setCopiedTarget((current) => (current === target ? null : current));
    }, 1800);
  }

  async function copyToClipboard(value: string, target: "key" | "snippet") {
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (!fallbackCopy(value)) {
        throw new Error("Clipboard API unavailable");
      }
      markCopied(target);
      showToast(target === "key" ? "API түлхүүр хуулагдлаа." : "Snippet хуулагдлаа.", "success");
    } catch {
      if (fallbackCopy(value)) {
        markCopied(target);
        showToast("Хуулагдлаа.", "success");
        return;
      }
      showToast("Хуулахад алдаа гарлаа.", "error");
    }
  }

  async function handleGenerateKey(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneratingKey(true);
    setNewCredential(null);
    setShowNewKey(false);
    setCopiedTarget(null);
    try {
      const created = await generateApiKey({ name: keyName, tier: keyTier, environment: keyEnv });
      setNewCredential(created);
      await loadKeys();
      showToast("API түлхүүр үүсгэгдлээ. Хаахаас өмнө нууц түлхүүрийг хуулна уу.", "success");
    } catch {
      showToast("API түлхүүр үүсгэхэд алдаа гарлаа.", "error");
    } finally {
      setGeneratingKey(false);
    }
  }

  async function handleRevokeKey(id: number) {
    try {
      await revokeApiKey(id);
      setNewCredential((c) => (c?.id === id ? null : c));
      await loadKeys();
      showToast("API түлхүүр хүчингүй боллоо.", "success");
    } catch {
      showToast("API түлхүүрийг хүчингүй болгож чадсангүй.", "error");
    }
  }

  const generatedKey = newCredential?.key_plain ?? "";
  const installSnippet = newCredential?.observer_install_snippet ?? "";
  const trackingActive = store.tracking_status === "active";

  const planLabel = useMemo(() => store.plan?.trim() || "—", [store.plan]);

  return (
    <EditorialShell
      activeNav="settings"
      title={t.settings.title}
      subtitle={TABS.find((tabItem) => tabItem.id === tab)?.label}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-surface-muted px-3 py-1.5 text-xs font-bold text-text">
            <Building2 className="w-3.5 h-3.5 text-muted" />
            {store.name || (t.settings.tabs.company)}
          </span>
          <StatusPill tone={trackingActive ? "success" : "warn"}>
            <span
              aria-hidden
              className="size-1.5 rounded-full"
              style={{ background: trackingActive ? "#1F4D3E" : "#9C6B14" }}
            />
            {serviceStatusLabel(store.tracking_status ?? "pending")}
          </StatusPill>
          <span className="text-xs text-muted">· {planLabel}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <nav className="flex overflow-x-auto rounded-md tile p-1 lg:flex-col lg:overflow-visible">
              {TABS.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTab(t.id)}
                    className={[
                      "group relative flex shrink-0 items-center gap-2.5 rounded-md py-1.5 pl-3 pr-2.5 text-left text-[12.5px] transition-colors duration-150",
                      active
                        ? "bg-[rgb(28_25_23/0.06)] text-on-surface font-medium"
                        : "text-on-surface-variant hover:bg-[rgb(28_25_23/0.04)] hover:text-on-surface",
                    ].join(" ")}
                  >
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full"
                        style={{ background: "rgb(var(--primary-rgb))" }}
                      />
                    ) : null}
                    <t.Icon
                      className={`size-[15px] shrink-0 ${active ? "text-primary" : "text-on-surface-variant/70 group-hover:text-on-surface-variant"}`}
                      strokeWidth={1.6}
                      aria-hidden
                    />
                    <span className="truncate tracking-[-0.005em]">{t.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="space-y-4">
            {tab === "profile" ? (
              <ProfilePanel
                store={store}
                setStore={setStore}
                onSave={handleSaveStore}
                loading={storeLoading}
                saving={storeSaving}
                isOwner={isOwner}
              />
            ) : null}

            {tab === "keys" ? (
              <KeysPanel
                apiKeys={apiKeys}
                keysLoading={keysLoading}
                generatingKey={generatingKey}
                newCredential={newCredential}
                showNewKey={showNewKey}
                setShowNewKey={setShowNewKey}
                copiedTarget={copiedTarget}
                copyToClipboard={copyToClipboard}
                onGenerate={handleGenerateKey}
                onRevoke={handleRevokeKey}
                keyName={keyName}
                setKeyName={setKeyName}
                keyTier={keyTier}
                setKeyTier={setKeyTier}
                keyEnv={keyEnv}
                setKeyEnv={setKeyEnv}
                generatedKey={generatedKey}
                installSnippet={installSnippet}
                isOwner={isOwner}
              />
            ) : null}

            {tab === "team" ? (
              <TeamPanel
                members={members}
                loading={membersLoading}
                isOwner={isOwner}
                onInvite={() => setInviteOpen(true)}
                onRemove={(id) => void handleRemoveMember(id)}
              />
            ) : null}

            {tab === "billing" ? <BillingPanel plan={planLabel} memberCount={members.length} /> : null}

            {tab === "danger" ? <DangerPanel storeName={store.name} isOwner={isOwner} /> : null}
          </div>
        </div>
      </div>

      {inviteOpen ? (
        <div className="fixed inset-0 z-100 flex items-end justify-end bg-black/40 sm:items-stretch" onClick={() => setInviteOpen(false)}>
          <div
            className="h-full w-full max-w-md overflow-y-auto border-l border-outline-variant/[0.08] bg-surface-container-lowest p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[14px] font-semibold text-on-surface">Багийн гишүүн урих</h3>
            <p className="mt-1 text-[12px] text-on-surface-variant">Тэд нэвтрэх холбоостой имэйл хүлээн авна.</p>
            <div className="mt-4 space-y-3">
              <FieldShell label="Имэйл">
                <input
                  className={inputClass()}
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </FieldShell>
              <FieldShell label="Эрх">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className={inputClass()}
                >
                  <option value="member">Гишүүн</option>
                  <option value="developer">Хөгжүүлэгч</option>
                  <option value="owner">Эзэмшигч</option>
                </select>
              </FieldShell>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setInviteOpen(false)} className="rounded-md border border-outline-variant/[0.12] bg-surface-container-low px-3 py-1.5 text-[12.5px] font-medium text-on-surface">
                Цуцлах
              </button>
              <button
                type="button"
                onClick={() => void handleInvite()}
                disabled={inviting || !inviteEmail.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-on-primary disabled:opacity-60"
              >
                {inviting ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
                Урилга илгээх
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </EditorialShell>
  );
}

function ProfilePanel({
  store,
  setStore,
  onSave,
  loading,
  saving,
  isOwner,
}: {
  store: StoreSettings;
  setStore: (next: StoreSettings | ((prev: StoreSettings) => StoreSettings)) => void;
  onSave: (e: FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  saving: boolean;
  isOwner: boolean;
}) {
  return (
    <form onSubmit={onSave} className="space-y-4">
      <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
        <header className="flex items-center justify-between border-b border-outline-variant/[0.06] px-5 py-3">
          <div>
            <h2 className="text-[13px] font-semibold text-on-surface">Компанийн профайл</h2>
            <p className="mt-0.5 text-[11.5px] text-on-surface-variant">Энэ ажлын орчны гадна харагдах таних мэдээлэл.</p>
          </div>
        </header>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
          <FieldShell label="Компани / дэлгүүрийн нэр">
            <input
              className={inputClass(loading)}
              value={store.name}
              onChange={(e) => setStore((s) => ({ ...s, name: e.target.value }))}
              placeholder="Central Market"
            />
          </FieldShell>
          <FieldShell label="Веб домэйн">
            <input
              className={inputClass(loading)}
              value={store.domain}
              onChange={(e) => setStore((s) => ({ ...s, domain: e.target.value }))}
              placeholder="central-market.mn"
            />
          </FieldShell>
          <FieldShell label="Салбар">
            <select
              value={store.industry ?? ""}
              onChange={(e) => setStore((s) => ({ ...s, industry: e.target.value }))}
              className={inputClass(loading)}
            >
              <option value="" disabled>Салбар сонгох</option>
              {INDUSTRIES.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
            </select>
          </FieldShell>
          <FieldShell label="Валют">
            <select
              value={store.currency ?? "MNT"}
              onChange={(e) => setStore((s) => ({ ...s, currency: e.target.value }))}
              className={inputClass(loading)}
            >
              {CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
          </FieldShell>
          <FieldShell label="Цагийн бүс">
            <select
              value={store.timezone || "Asia/Ulaanbaatar"}
              onChange={(e) => setStore((s) => ({ ...s, timezone: e.target.value }))}
              className={inputClass(loading)}
            >
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </FieldShell>
          <FieldShell label="Plan">
            <input className={inputClass(true)} value={store.plan || "—"} readOnly />
          </FieldShell>
        </div>
      </section>

      <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
        <header className="border-b border-outline-variant/[0.06] px-5 py-3">
          <h2 className="text-[13px] font-semibold text-on-surface">Дэлгүүрийн metadata</h2>
          <p className="mt-0.5 text-[11.5px] text-on-surface-variant">Тусламж болон интеграцид ашиглах системийн ID-ууд.</p>
        </header>
        <dl className="grid gap-x-6 gap-y-3 px-5 py-5 sm:grid-cols-2">
          <div className="flex flex-col gap-0.5">
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Дэлгүүрийн ID</dt>
            <dd className="font-mono text-[12px] text-on-surface">{store.tenant_id ?? "—"}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Tracking төлөв</dt>
            <dd>
              <StatusPill tone={store.tracking_status === "active" ? "success" : "warn"}>
                <span className={`size-1.5 rounded-full ${store.tracking_status === "active" ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden />
                {serviceStatusLabel(store.tracking_status ?? "pending")}
              </StatusPill>
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Үүссэн</dt>
            <dd className="text-[12.5px] text-on-surface">{formatDate(store.created_at)}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Төлөвлөгөө</dt>
            <dd className="text-[12.5px] text-on-surface">{store.plan || "—"}</dd>
          </div>
        </dl>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || loading || !isOwner}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[12.5px] font-semibold text-on-primary disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
          Профайл хадгалах
        </button>
      </div>
    </form>
  );
}

function KeysPanel({
  apiKeys,
  keysLoading,
  generatingKey,
  newCredential,
  showNewKey,
  setShowNewKey,
  copiedTarget,
  copyToClipboard,
  onGenerate,
  onRevoke,
  keyName,
  setKeyName,
  keyTier,
  setKeyTier,
  keyEnv,
  setKeyEnv,
  generatedKey,
  installSnippet,
  isOwner,
}: {
  apiKeys: ApiKey[];
  keysLoading: boolean;
  generatingKey: boolean;
  newCredential: GeneratedApiKey | null;
  showNewKey: boolean;
  setShowNewKey: (next: boolean | ((prev: boolean) => boolean)) => void;
  copiedTarget: "key" | "snippet" | null;
  copyToClipboard: (value: string, target: "key" | "snippet") => void;
  onGenerate: (e: FormEvent<HTMLFormElement>) => void;
  onRevoke: (id: number) => void;
  keyName: string;
  setKeyName: (next: string) => void;
  keyTier: ApiKeyTier;
  setKeyTier: (next: ApiKeyTier) => void;
  keyEnv: ApiKeyEnvironment;
  setKeyEnv: (next: ApiKeyEnvironment) => void;
  generatedKey: string;
  installSnippet: string;
  isOwner: boolean;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/[0.06] px-5 py-3">
          <div>
            <h2 className="text-[13px] font-semibold text-on-surface">API түлхүүр үүсгэх</h2>
            <p className="mt-0.5 text-[11.5px] text-on-surface-variant">
              Raw secret <strong>нэг удаа</strong> харагдана. Аюулгүй secret manager-т хуулж хадгална уу. Дараа нь дахин харах боломжгүй.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant/[0.12] bg-surface-container-low/60 px-2 py-0.5 text-[11px] font-semibold text-on-surface-variant">
            <ShieldCheck className="size-3.5" aria-hidden />
            Нэг удаагийн secret
          </span>
        </header>

        <form onSubmit={onGenerate} className="grid gap-4 px-5 py-5 lg:grid-cols-[1fr_180px_180px_auto]">
          <FieldShell label="Түлхүүрийн нэр">
            <input
              className={inputClass(generatingKey || !isOwner)}
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              disabled={!isOwner || generatingKey}
              placeholder="Production дэлгүүр"
            />
          </FieldShell>
          <FieldShell label="Tier">
            <select
              value={keyTier}
              onChange={(e) => setKeyTier(e.target.value as ApiKeyTier)}
              disabled={!isOwner || generatingKey}
              className={inputClass(!isOwner || generatingKey)}
            >
              {API_KEY_TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </FieldShell>
          <FieldShell label="Орчин">
            <select
              value={keyEnv}
              onChange={(e) => setKeyEnv(e.target.value as ApiKeyEnvironment)}
              disabled={!isOwner || generatingKey}
              className={inputClass(!isOwner || generatingKey)}
            >
              {ENVIRONMENTS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </FieldShell>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={generatingKey || keysLoading || !isOwner}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-3 text-[12.5px] font-semibold text-on-primary disabled:opacity-60"
            >
              {generatingKey ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <KeyRound className="size-3.5" aria-hidden />}
              Үүсгэх
            </button>
          </div>
          <div className="lg:col-span-4 -mt-2 text-[11px] text-on-surface-variant">
            Tier тайлбар: {API_KEY_TIERS.find((t) => t.value === keyTier)?.description}
          </div>
        </form>
      </section>

      {newCredential ? (
        <section className="rounded-md border border-amber-500/30 bg-amber-500/5">
          <header className="flex items-start gap-3 border-b border-amber-500/20 px-5 py-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300">
              <ShieldCheck className="size-3.5" aria-hidden />
            </span>
            <div>
              <h3 className="text-[13px] font-semibold text-on-surface">Шинэ API түлхүүр үүсгэгдлээ</h3>
              <p className="mt-0.5 text-[12px] text-on-surface-variant">
                Secret-ийг одоо хуулна уу. Энэ хуудсаас гарсны дараа зөвхөн нууцалсан утга үлдэнэ. Алдагдвал түлхүүрийг хүчингүй болгож шинээр үүсгэнэ.
              </p>
            </div>
          </header>

          <div className="space-y-4 px-5 py-5">
            <FieldShell label="Нууц түлхүүр">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  type={showNewKey ? "text" : "password"}
                  value={generatedKey}
                  className="min-w-0 flex-1 rounded-md border border-outline-variant/[0.12] bg-surface-container-lowest px-3 py-2 font-mono text-[12px] text-on-surface focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewKey((v) => !v)}
                  disabled={!generatedKey}
                  aria-label={showNewKey ? "Нууц түлхүүр нуух" : "Нууц түлхүүр харуулах"}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-outline-variant/[0.12] bg-surface-container-lowest px-3 text-[12px] font-medium text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                >
                  {showNewKey ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
                  {showNewKey ? "Нуух" : "Харуулах"}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedKey, "key")}
                  disabled={!generatedKey}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-[12px] font-semibold text-on-primary disabled:opacity-40"
                >
                  {copiedTarget === "key" ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                  Түлхүүр хуулах
                </button>
              </div>
            </FieldShell>

            {installSnippet ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                    <Code2 className="size-3.5" aria-hidden />
                    E-commerce суулгах snippet
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(installSnippet, "snippet")}
                    className="inline-flex items-center gap-1.5 rounded-md border border-outline-variant/[0.12] bg-surface-container-lowest px-2.5 py-1 text-[12px] font-medium text-on-surface hover:bg-surface-container-low"
                  >
                    {copiedTarget === "snippet" ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                    Snippet хуулах
                  </button>
                </div>
                <pre className="max-h-40 overflow-auto rounded-md border border-outline-variant/[0.12] bg-surface-container-lowest p-3 text-[12px] leading-relaxed text-on-surface">
                  <code className="whitespace-pre-wrap break-all">{installSnippet}</code>
                </pre>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
        <header className="flex items-center justify-between border-b border-outline-variant/[0.06] px-5 py-3">
          <div>
            <h2 className="text-[13px] font-semibold text-on-surface">Одоо байгаа түлхүүрүүд</h2>
            <p className="mt-0.5 text-[11.5px] text-on-surface-variant">Зөвхөн нууцалсан prefix хадгалагдана. Түлхүүрийг хүссэн үедээ хүчингүй болгож болно.</p>
          </div>
        </header>

        {keysLoading ? (
          <div className="flex h-32 items-center justify-center"><Loader2 className="size-4 animate-spin text-primary" aria-hidden /></div>
        ) : apiKeys.length === 0 ? (
          <div className="px-5 py-8 text-center text-[12px] text-on-surface-variant">
            API түлхүүр одоогоор алга. E-commerce storefront холбохын тулд нэгийг үүсгэнэ үү.
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_100px_120px_120px_140px_80px] gap-3 bg-surface-container-low/40 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant md:grid">
              <span>Нэр</span>
              <span>Нууцалсан түлхүүр</span>
              <span>Tier</span>
              <span>Env</span>
              <span>Төлөв</span>
              <span>Үүссэн · Ашигласан</span>
              <span className="text-right">Үйлдэл</span>
            </div>
            {apiKeys.map((k) => {
              const status: "active" | "revoked" | "expired" = k.status ?? (k.is_active ? "active" : "revoked");
              return (
                <div
                  key={k.id}
                  className="grid grid-cols-1 gap-2 border-t border-outline-variant/[0.06] px-5 py-3 text-[12.5px] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_100px_120px_120px_140px_80px] md:items-center md:gap-3"
                >
                  <div className="font-semibold text-on-surface">{k.name}</div>
                  <div className="font-mono text-[12px] text-on-surface-variant truncate">{k.key_masked}</div>
                  <div className="text-on-surface-variant">{API_KEY_TIERS.find((t) => t.value === k.tier)?.label ?? k.tier}</div>
                  <div className="text-on-surface-variant">{ENVIRONMENTS.find((e) => e.value === k.environment)?.label ?? k.environment ?? "—"}</div>
                  <div>
                    <StatusPill tone={status === "active" ? "success" : status === "expired" ? "warn" : "neutral"}>
                      <span className={`size-1.5 rounded-full ${status === "active" ? "bg-emerald-500" : status === "expired" ? "bg-amber-500" : "bg-slate-400"}`} aria-hidden />
                      {serviceStatusLabel(status)}
                    </StatusPill>
                  </div>
                  <div className="text-[11.5px] text-on-surface-variant">
                    <div>Үүссэн {formatDate(k.created_at)}</div>
                    <div>Ашигласан {formatRelative(k.last_used_at)}</div>
                  </div>
                  <div className="md:text-right">
                    {status === "active" && isOwner ? (
                      <button
                        type="button"
                        onClick={() => onRevoke(k.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-error/30 px-2 py-0.5 text-[11.5px] font-semibold text-error hover:bg-error/5"
                      >
                        <XCircle className="size-3.5" aria-hidden />
                        Хүчингүй болгох
                      </button>
                    ) : (
                      <span className="text-[11px] text-on-surface-variant">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </section>
    </div>
  );
}

function TeamPanel({
  members,
  loading,
  isOwner,
  onInvite,
  onRemove,
}: {
  members: TeamMember[];
  loading: boolean;
  isOwner: boolean;
  onInvite: () => void;
  onRemove: (id: number) => void;
}) {
  return (
    <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
      <header className="flex items-center justify-between border-b border-outline-variant/[0.06] px-5 py-3">
        <div>
          <h2 className="text-[13px] font-semibold text-on-surface">Багийн гишүүд</h2>
          <p className="mt-0.5 text-[11.5px] text-on-surface-variant">Энэ ажлын орчинд {members.length} гишүүн байна.</p>
        </div>
        <button
          type="button"
          onClick={onInvite}
          disabled={!isOwner}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-on-primary disabled:opacity-50"
        >
          <UserPlus className="size-3.5" aria-hidden />
          Гишүүн урих
        </button>
      </header>

      {loading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="size-4 animate-spin text-primary" aria-hidden /></div>
      ) : members.length === 0 ? (
        <div className="px-5 py-8 text-center text-[12px] text-on-surface-variant">Багийн гишүүн одоогоор алга.</div>
      ) : (
        <>
          <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_120px_120px_80px] gap-3 bg-surface-container-low/40 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant md:grid">
            <span>Нэр</span><span>Имэйл</span><span>Эрх</span><span>Нэгдсэн</span><span className="text-right">Үйлдэл</span>
          </div>
          {members.map((m) => (
            <div key={m.id} className="grid grid-cols-1 gap-2 border-t border-outline-variant/[0.06] px-5 py-3 text-[12.5px] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)_120px_120px_80px] md:items-center md:gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {(m.full_name?.[0] ?? "?").toUpperCase()}
                </span>
                <span className="truncate font-semibold text-on-surface">{m.full_name}</span>
              </div>
              <div className="truncate text-on-surface-variant">{m.email}</div>
              <div>
                <StatusPill tone={m.role === "owner" ? "success" : "neutral"}>{roleLabel(m.role)}</StatusPill>
              </div>
              <div className="text-on-surface-variant">{formatDate(m.joined_at)}</div>
              <div className="md:text-right">
                <button
                  type="button"
                  onClick={() => onRemove(m.id)}
                  disabled={!isOwner || m.role === "owner"}
                  className="text-[11.5px] font-semibold text-error hover:underline disabled:opacity-40"
                >
                  Хасах
                </button>
              </div>
            </div>
          ))}
        </>
      )}
    </section>
  );
}

function BillingPanel({ plan, memberCount }: { plan: string; memberCount: number }) {
  return (
    <div className="space-y-4">
      <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
        <header className="border-b border-outline-variant/[0.06] px-5 py-3">
          <h2 className="text-[13px] font-semibold text-on-surface">Одоогийн төлөвлөгөө</h2>
          <p className="mt-0.5 text-[11.5px] text-on-surface-variant">Идэвхтэй багц болон хэрэглээний лимит.</p>
        </header>
        <div className="grid gap-4 px-5 py-5 sm:grid-cols-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Төлөвлөгөө</p>
            <p className="mt-1 text-[16px] font-semibold text-on-surface">{plan}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Багийн суудал</p>
            <p className="mt-1 text-[16px] font-semibold tabular-nums text-on-surface">{memberCount} / 10</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-high/70">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (memberCount / 10) * 100)}%` }} />
            </div>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Дараагийн сунгалт</p>
            <p className="mt-1 text-[16px] font-semibold text-on-surface">—</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-outline-variant/[0.08] bg-surface-container-lowest">
        <header className="border-b border-outline-variant/[0.06] px-5 py-3">
          <h2 className="text-[13px] font-semibold text-on-surface">Нэхэмжлэл</h2>
          <p className="mt-0.5 text-[11.5px] text-on-surface-variant">Төлбөрийн бүртгэл идэвхжсэний дараа нэхэмжлэл энд харагдана.</p>
        </header>
        <div className="px-5 py-8 text-center text-[12px] text-on-surface-variant">
          Нэхэмжлэл одоогоор алга.
        </div>
      </section>
    </div>
  );
}

function DangerPanel({ storeName, isOwner }: { storeName: string; isOwner: boolean }) {
  return (
    <section className="rounded-md border border-error/25 bg-error/[0.03]">
      <header className="border-b border-error/20 px-5 py-3">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-error">
          <AlertTriangle className="size-3.5" aria-hidden />
          Эрсдэлтэй бүс
        </h2>
        <p className="mt-0.5 text-[11.5px] text-on-surface-variant">Эдгээр үйлдэл буцаах боломжгүй.</p>
      </header>
      <div className="divide-y divide-error/10">
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold text-on-surface">Бүх API түлхүүрийг rotate хийх</p>
            <p className="mt-0.5 text-[11.5px] text-on-surface-variant">{storeName || "энэ ажлын орчин"}-ийн бүх идэвхтэй түлхүүрийг хүчингүй болгоно. Шинэ түлхүүр өгөх хүртэл storefront эвент илгээхгүй.</p>
          </div>
          <button type="button" disabled={!isOwner} className="inline-flex items-center gap-1.5 rounded-md border border-error/30 bg-error/5 px-3 py-1.5 text-[12px] font-semibold text-error hover:bg-error/10 disabled:opacity-40">
            <KeyRound className="size-3.5" aria-hidden />
            Түлхүүр rotate хийх
          </button>
        </div>
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-semibold text-on-surface">Ажлын орчин устгах</p>
            <p className="mt-0.5 text-[11.5px] text-on-surface-variant">{storeName || "энэ ажлын орчин"}, бүх сесс, таамаглал болон төлбөрийн түүхийг бүр мөсөн устгана.</p>
          </div>
          <button type="button" disabled={!isOwner} className="inline-flex items-center gap-1.5 rounded-md bg-error px-3 py-1.5 text-[12px] font-semibold text-on-error hover:opacity-95 disabled:opacity-40">
            <Trash2 className="size-3.5" aria-hidden />
            Ажлын орчин устгах
          </button>
        </div>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsInner />
    </Suspense>
  );
}

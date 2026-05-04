"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, Info, Loader2, UserPlus } from "lucide-react";
import EditorialShell from "@/components/editorial/EditorialShell";
import { useAuth } from "@/components/editorial/AuthContext";
import { useToast } from "@/components/ui/Toast";
import {
  fetchStoreSettings,
  updateStoreSettings,
  fetchTeamMembers,
  inviteMember,
  removeMember,
  type StoreSettings,
} from "@/lib/services/settings";
import { fetchApiKeys, generateApiKey, revokeApiKey } from "@/lib/services/apiKeys";
import type { TeamMember, ApiKey } from "@/types/api";

export default function SettingsPage() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const isOwner = role === "owner" || role === "admin";
  const [tab, setTab] = useState<"store" | "team" | "keys">("team");
  const [inviteOpen, setInviteOpen]   = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole]   = useState("member");
  const [inviting, setInviting]       = useState(false);

  // Team state
  const [members, setMembers]         = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Store state
  const [store, setStore]             = useState<StoreSettings>({ name: "", domain: "", plan: "", timezone: "" });
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeSaving, setStoreSaving] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys]         = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newKeyPlain, setNewKeyPlain] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    try {
      setMembers(await fetchTeamMembers());
    } catch {
      showToast("Багийн мэдээлэл ачааллахад алдаа гарлаа.", "error");
    } finally {
      setMembersLoading(false);
    }
  }, [showToast]);

  const loadStore = useCallback(async () => {
    setStoreLoading(true);
    try {
      setStore(await fetchStoreSettings());
    } catch {
      showToast("Дэлгүүрийн мэдээлэл ачааллахад алдаа гарлаа.", "error");
    } finally {
      setStoreLoading(false);
    }
  }, [showToast]);

  const loadKeys = useCallback(async () => {
    setKeysLoading(true);
    try {
      setApiKeys(await fetchApiKeys());
    } catch {
      showToast("API түлхүүр ачааллахад алдаа гарлаа.", "error");
    } finally {
      setKeysLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (tab === "team")  void loadMembers();
    if (tab === "store") void loadStore();
    if (tab === "keys")  void loadKeys();
  }, [tab, loadMembers, loadStore, loadKeys]);

  async function handleSaveStore(e: React.FormEvent) {
    e.preventDefault();
    setStoreSaving(true);
    try {
      const updated = await updateStoreSettings(store);
      setStore(updated);
      showToast("Дэлгүүрийн мэдээлэл хадгалагдлаа.", "success");
    } catch {
      showToast("Хадгалахад алдаа гарлаа.", "error");
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
      showToast(`${inviteEmail} урилга илгээгдлээ.`, "success");
      setInviteEmail("");
      setInviteOpen(false);
    } catch {
      showToast("Урилга илгээхэд алдаа гарлаа.", "error");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(id: number) {
    try {
      await removeMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      showToast("Гишүүн устгагдлаа.", "success");
    } catch {
      showToast("Гишүүн устгахад алдаа гарлаа.", "error");
    }
  }

  async function handleGenerateKey() {
    setGeneratingKey(true);
    setNewKeyPlain(null);
    try {
      const created = await generateApiKey();
      if (created.key_plain) setNewKeyPlain(created.key_plain);
      await loadKeys();
      showToast("Шинэ API түлхүүр үүсгэгдлээ.", "success");
    } catch {
      showToast("Түлхүүр үүсгэхэд алдаа гарлаа.", "error");
    } finally {
      setGeneratingKey(false);
    }
  }

  async function handleRevokeKey(id: number) {
    try {
      await revokeApiKey(id);
      setNewKeyPlain(null);
      await loadKeys();
      showToast("Түлхүүр идэвхгүй болгогдлоо.", "success");
    } catch {
      showToast("Түлхүүр идэвхгүй болгоход алдаа гарлаа.", "error");
    }
  }

  const roleLabel = (r: string) =>
    r === "owner" ? "Owner" : r === "developer" ? "Developer" : r === "admin" ? "Admin" : "Member";

  return (
    <EditorialShell activeNav="settings" title="Тохиргоо" subtitle="Системийн тохиргоо болон багийн удирдлага">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[1.1rem] font-semibold text-on-surface tracking-tight">Тохиргоо</h1>
            <p className="text-[13px] text-on-surface-variant mt-0.5">Дэлгүүр, баг, API түлхүүрийн ерөнхий удирдлага.</p>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            disabled={!isOwner}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm hover:opacity-95 transition-opacity disabled:opacity-40 shrink-0"
          >
            <UserPlus className="size-4" aria-hidden />
            Гишүүн урих
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-outline-variant/10 pb-1">
          {(
            [
              ["store", "Дэлгүүр"],
              ["team",  "Баг"],
              ["keys",  "API түлхүүр"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={[
                "px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition-colors",
                tab === id
                  ? "border-primary text-on-surface bg-surface-container-lowest"
                  : "border-transparent text-on-surface-variant hover:text-on-surface",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6 lg:gap-8">
          <div className="col-span-12 lg:col-span-9">

            {/* Team Tab */}
            {tab === "team" ? (
              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest shadow-sm overflow-hidden">
                {membersLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-low/90">
                      <tr>
                        {["Нэр", "Имэйл хаяг", "Эрх", "Нэмэгдсэн огноо"].map((h) => (
                          <th key={h} className="px-5 sm:px-6 py-4 text-[0.625rem] font-bold text-on-surface-variant uppercase tracking-[0.12em]">
                            {h}
                          </th>
                        ))}
                        <th className="px-5 sm:px-6 py-4 text-right" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {members.map((m) => (
                        <tr key={m.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-5 sm:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container text-xs font-bold">
                                {(m.full_name[0] ?? "?").toUpperCase()}
                              </div>
                              <span className="text-sm font-semibold text-on-surface">{m.full_name}</span>
                            </div>
                          </td>
                          <td className="px-5 sm:px-6 py-4 text-sm text-on-surface-variant">{m.email}</td>
                          <td className="px-5 sm:px-6 py-4">
                            <span className="inline-flex rounded-md border border-outline-variant/15 bg-surface-container-low px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wide text-on-surface">
                              {roleLabel(m.role)}
                            </span>
                          </td>
                          <td className="px-5 sm:px-6 py-4 text-sm text-on-surface-variant">{m.joined_at}</td>
                          <td className="px-5 sm:px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => void handleRemoveMember(m.id)}
                              disabled={!isOwner || m.role === "owner"}
                              className="text-[0.625rem] font-bold uppercase tracking-wide text-error hover:underline disabled:opacity-30"
                            >
                              Устгах
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : null}

            {/* Store Tab */}
            {tab === "store" ? (
              <form
                onSubmit={(e) => void handleSaveStore(e)}
                className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm space-y-4"
              >
                <h3 className="text-lg font-bold text-on-surface font-display">Дэлгүүрийн мэдээлэл</h3>
                {storeLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Дэлгүүрийн нэр</label>
                      <input
                        value={store.name}
                        onChange={(e) => setStore((s) => ({ ...s, name: e.target.value }))}
                        className="w-full rounded-lg border border-outline-variant/15 bg-surface-container-low px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Дэлгүүрийн нэр"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[0.7rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Домэйн</label>
                      <input
                        value={store.domain}
                        onChange={(e) => setStore((s) => ({ ...s, domain: e.target.value }))}
                        className="w-full rounded-lg border border-outline-variant/15 bg-surface-container-low px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="mystore.mn"
                      />
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={storeSaving || storeLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
                >
                  {storeSaving && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  Хадгалах
                </button>
              </form>
            ) : null}

            {/* API Keys Tab */}
            {tab === "keys" ? (
              <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-on-surface font-display">API түлхүүр</h3>
                {keysLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {newKeyPlain ? (
                      <div className="rounded-lg border border-secondary/30 bg-secondary-container/15 px-4 py-2 text-xs text-secondary font-semibold">
                        Энэ түлхүүрийг нэг удаа л харуулна — хадгалаад авна уу!
                      </div>
                    ) : null}
                    {apiKeys.map((k) => (
                      <div key={k.id} className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/15 bg-surface-container-low px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-on-surface">{k.name}</p>
                          <p className="font-mono text-xs text-on-surface-variant mt-0.5">
                            {k.id === apiKeys[0]?.id && newKeyPlain ? newKeyPlain : k.key_masked}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${k.is_active ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant"}`}>
                            {k.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                          </span>
                          {k.is_active && isOwner ? (
                            <button
                              type="button"
                              onClick={() => void handleRevokeKey(k.id)}
                              className="text-[0.625rem] font-bold uppercase text-error hover:underline"
                            >
                              Хүчингүй болгох
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {apiKeys.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">Идэвхтэй түлхүүр байхгүй.</p>
                    ) : null}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => void handleGenerateKey()}
                  disabled={generatingKey || keysLoading || !isOwner}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-40"
                >
                  {generatingKey && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  Шинэ түлхүүр үүсгэх
                </button>
              </div>
            ) : null}
          </div>

          {/* Sidebar info */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-on-surface">
                <Info className="size-5 text-on-surface-variant shrink-0" aria-hidden />
                <span className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-on-surface-variant">Мэдээлэл</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Танай баг одоогоор {members.length} гишүүнтэй. &quot;Бизнес&quot; багцад нийт 10 хүртэлх гишүүн нэмэх боломжтой.
              </p>
              <div className="space-y-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (members.length / 10) * 100)}%` }} />
                </div>
                <span className="block text-[0.625rem] font-bold text-on-surface-variant uppercase tracking-tight">{members.length} / 10 гишүүн</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-high p-8 min-h-[200px] flex flex-col justify-center">
            <span className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Enterprise</span>
            <h3 className="mt-2 font-display text-2xl font-semibold text-on-surface tracking-tight">Хязгааргүй баг</h3>
            <p className="mt-2 text-sm text-on-surface-variant max-w-xs">Байгууллагын хэрэгцээнд зориулсан тусгай нөхцөлүүд.</p>
            <button type="button" className="mt-4 text-left text-sm font-semibold text-primary hover:underline">
              Холбоо барих
            </button>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 min-h-[200px] flex flex-col justify-center shadow-sm">
            <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl" />
            <span className="text-[0.625rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Тусламж</span>
            <h3 className="mt-2 font-display text-2xl font-semibold text-on-surface tracking-tight">Эрх мэдлийн тохиргоо</h3>
            <p className="mt-2 text-sm text-on-surface-variant max-w-xs">Гишүүдийн үүрэг хариуцлагыг хэрхэн зөв хуваарилах вэ?</p>
            <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary group">
              Заавар үзэх
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
          </div>
        </div>

        {/* Invite modal */}
        {inviteOpen ? (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/40">
            <div className="h-full w-full max-w-md overflow-y-auto bg-surface-container-lowest p-6 shadow-xl border-l border-outline-variant/10">
              <h3 className="font-display text-lg font-semibold text-on-surface">Гишүүн урих</h3>
              <div className="mt-4 space-y-3">
                <input
                  className="w-full rounded-lg border border-outline-variant/15 bg-surface-container-low px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="email@domain.mn"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/15 bg-surface-container-low px-4 py-3 text-sm focus:outline-none"
                >
                  <option value="member">Member</option>
                  <option value="developer">Developer</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setInviteOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold bg-surface-container text-on-surface">
                  Цуцлах
                </button>
                <button
                  type="button"
                  onClick={() => void handleInvite()}
                  disabled={inviting || !inviteEmail.trim()}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-on-primary disabled:opacity-60"
                >
                  {inviting && <Loader2 className="size-4 animate-spin" aria-hidden />}
                  Илгээх
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </EditorialShell>
  );
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translations, type Language, type Translation } from "@/lib/i18n/translations";

type LanguageState = {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: Translation;
};

const STORAGE_KEY = "cart_analytic_lang";

const LanguageContext = createContext<LanguageState | null>(null);

function readStored(): Language {
  if (typeof window === "undefined") return "MN";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "EN" || stored === "MN") return stored;
  } catch {
    // ignore
  }
  return "MN";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("MN");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangState(readStored());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "EN" ? "en" : "mn";
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "EN" ? "MN" : "EN");
  }, [lang, setLang]);

  const value = useMemo<LanguageState>(
    () => ({
      lang,
      setLang,
      toggleLang,
      t: translations[lang],
    }),
    [lang, setLang, toggleLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageState {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: "MN",
      setLang: () => {},
      toggleLang: () => {},
      t: translations.MN,
    };
  }
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { directionForLanguage, localeForLanguage, normalizeLanguage, speechLocaleForLanguage, translate, type Language } from "@/lib/translations";

type LanguageContextValue = {
  language: Language;
  locale: string;
  speechLocale: string;
  dir: "ltr" | "rtl";
  t: (source: string, values?: Record<string, string | number>) => string;
  setLanguage: (language: Language) => void;
  syncLanguageFromProfile: (language: Language) => void;
};

const STORAGE_KEY = "we-care-language";
const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLanguage(): Language | null {
  if (typeof window === "undefined") return null;
  return normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const initialLanguage = readStoredLanguage();
  const [language, setLanguageState] = useState<Language>(initialLanguage ?? "en");
  const [hasLocalPreference, setHasLocalPreference] = useState(Boolean(initialLanguage));

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    setHasLocalPreference(true);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const syncLanguageFromProfile = useCallback((next: Language) => {
    if (!hasLocalPreference) setLanguageState(next);
  }, [hasLocalPreference]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = directionForLanguage(language);
  }, [language]);

  const t = useCallback((source: string, values?: Record<string, string | number>) => translate(language, source, values), [language]);
  const value = useMemo<LanguageContextValue>(() => ({
    language,
    locale: localeForLanguage(language),
    speechLocale: speechLocaleForLanguage(language),
    dir: directionForLanguage(language),
    t,
    setLanguage,
    syncLanguageFromProfile,
  }), [language, t, setLanguage, syncLanguageFromProfile]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider.");
  return context;
}

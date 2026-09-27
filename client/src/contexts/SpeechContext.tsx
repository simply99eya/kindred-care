import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { speechLocaleForLanguage } from "@/lib/translations";

type SpeechContextValue = {
  activeId: string | null;
  supported: boolean;
  speak: (id: string, text: string, rate?: number, language?: string) => boolean;
  stop: () => void;
};

const SpeechContext = createContext<SpeechContextValue | null>(null);

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const { language: appLanguage } = useLanguage();
  const [activeId, setActiveId] = useState<string | null>(null);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setActiveId(null);
  }, []);

  const speak = useCallback((id: string, text: string, rate = 90, language = speechLocaleForLanguage(appLanguage)) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = Math.max(0.7, Math.min(1.2, rate / 100));
    utterance.onend = () => setActiveId((current) => current === id ? null : current);
    utterance.onerror = () => setActiveId((current) => current === id ? null : current);
    setActiveId(id);
    window.speechSynthesis.speak(utterance);
    return true;
  }, [appLanguage]);

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const value = useMemo(() => ({ activeId, supported, speak, stop }), [activeId, supported, speak, stop]);
  return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>;
}

export function useSpeech() {
  const context = useContext(SpeechContext);
  if (!context) throw new Error("useSpeech must be used inside SpeechProvider");
  return context;
}

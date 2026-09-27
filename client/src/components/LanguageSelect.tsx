import { useLanguage } from "@/contexts/LanguageContext";
import { normalizeLanguage, type Language } from "@/lib/translations";

type LanguageSelectProps = {
  className?: string;
  onChange?: (language: Language) => void;
};

export default function LanguageSelect({ className = "language-select", onChange }: LanguageSelectProps) {
  const { language, setLanguage, t } = useLanguage();

  return <select
    className={className}
    value={language}
    aria-label={t("Language")}
    onChange={(event) => {
      const next = normalizeLanguage(event.target.value);
      if (!next) return;
      setLanguage(next);
      onChange?.(next);
    }}
  >
    <option value="en">{t("English")}</option>
    <option value="ar">{t("Arabic")}</option>
  </select>;
}

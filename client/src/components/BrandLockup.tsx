import { useLanguage } from "@/contexts/LanguageContext";

type BrandLockupSize = "landing" | "onboarding" | "sidebar";

const logoSrc = "/manus-storage/we-care-logo_255e4921.jpg";

export default function BrandLockup({ size = "landing" }: { size?: BrandLockupSize }) {
  const { t } = useLanguage();
  return <div className={`brand-lockup brand-lockup--${size}`}>
    <img className="brand-wordmark" src={logoSrc} alt={t("We Care Health & Wellbeing")} />
  </div>;
}

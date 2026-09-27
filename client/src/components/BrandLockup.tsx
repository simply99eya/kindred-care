type BrandLockupSize = "landing" | "onboarding" | "sidebar";

const logoSrc = "/manus-storage/we-care-logo_255e4921.jpg";

export default function BrandLockup({ size = "landing" }: { size?: BrandLockupSize }) {
  return <div className={`brand-lockup brand-lockup--${size}`}>
    <img className="brand-wordmark" src={logoSrc} alt="We Care Health & Wellbeing" />
  </div>;
}

import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import BrandLockup from "@/components/BrandLockup";
import LanguageSelect from "@/components/LanguageSelect";
import { useLanguage } from "@/contexts/LanguageContext";
import { CalendarDays, HeartHandshake, LockKeyhole, MessageCircle, Mic, Sparkles, Users } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function sampleTime(hour: number, minute: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, hour, minute));
}

export default function Home() {
  const { user, loading } = useAuth();
  const { t, locale } = useLanguage();
  const profileQuery = trpc.care.profile.get.useQuery(undefined, { enabled: Boolean(user) && !loading });
  const saveLanguage = trpc.care.profile.setLanguage.useMutation({ onError: () => toast.error(t("Language changed on this device but could not be saved to your care profile.")) });
  const continueToApp = () => user ? window.location.assign("/app") : startLogin();
  const handleLanguageChange = (next: "en" | "ar") => { if (profileQuery.data) saveLanguage.mutate(next); };

  return <div className="landing">
    <header className="landing-header">
      <BrandLockup size="landing" />
      <nav className="landing-nav" aria-label={t("Main navigation")}>
        <LanguageSelect className="language-select landing-language-select" onChange={handleLanguageChange} />
        <a className="text-link" href="#how-it-helps">{t("How it helps")}</a>
        {user ? <Link className="text-link" href="/app">{t("Open my day")}</Link> : <button className="text-link" onClick={startLogin}>{t("Sign in")}</button>}
        <Button onClick={continueToApp} disabled={loading}>{user ? t("Open my care space") : t("Get started")}</Button>
      </nav>
    </header>

    <main className="landing-main">
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="hero-eyebrow"><Sparkles size={15} /> {t("A calmer kind of everyday support")}</div>
          <h1>{t("A little more ease in")} <em>{t("every day.")}</em></h1>
          <p>{t("We Care brings daily plans, gentle reminders and familiar faces together — giving people and the people who care for them one reassuring place to turn.")}</p>
          <div className="hero-actions">
            <Button size="lg" onClick={continueToApp} disabled={loading}>{user ? t("Continue to today") : t("Create your care space")}</Button>
            <a className="text-link" href="#how-it-helps">{t("See how it works")}</a>
          </div>
          <div className="hero-note"><LockKeyhole size={14} style={{ verticalAlign: "-2px", marginInlineEnd: 5 }} /> {t("Personal information stays inside your signed-in space.")}</div>
        </div>
        <div className="hero-art" aria-label={t("A preview of a simple daily plan")}>
          <div className="floating-note note-top"><HeartHandshake size={18} /> {t("A familiar, friendly place")}</div>
          <div className="demo-day-card">
            <div className="demo-day-head"><div><strong>{t("A gentle day")}</strong><small>{t("One thing at a time")}</small></div><span className="day-icon"><CalendarDays size={20} /></span></div>
            <div className="day-divider" />
            <div className="demo-event"><span className="demo-time">{sampleTime(9, 0, locale)}</span><div><strong>{t("Breakfast together")}</strong><small>{t("A comfortable start")}</small></div><span className="event-dot" /></div>
            <div className="demo-event"><span className="demo-time">{sampleTime(11, 30, locale)}</span><div><strong>{t("Time in the garden")}</strong><small>{t("A little fresh air")}</small></div><span className="event-dot" /></div>
            <div className="demo-event"><span className="demo-time">{sampleTime(15, 0, locale)}</span><div><strong>{t("A call with family")}</strong><small>{t("A friendly hello")}</small></div><span className="event-dot" /></div>
          </div>
          <div className="floating-note note-bottom"><MessageCircle size={18} /> “{t("What do I have planned?")}”</div>
        </div>
      </section>

      <section id="how-it-helps" className="landing-features" aria-label={t("How We Care helps")}>
        <article className="feature-tile"><span><CalendarDays size={21} /></span><h3>{t("A day that feels clear")}</h3><p>{t("See activities and appointments in a simple calendar. Earlier days remain available to look back on.")}</p></article>
        <article className="feature-tile"><span><Users size={21} /></span><h3>{t("People who feel familiar")}</h3><p>{t("Caregivers can keep names, relationships and consented photos together in one private place.")}</p></article>
        <article className="feature-tile"><span><MessageCircle size={21} /></span><h3>{t("Helpful, without guessing")}</h3><p>{t("The companion answers from the saved schedule. In this demo, it is clearly marked as a guided sample.")}</p></article>
        <article className="feature-tile"><span><Mic size={21} /></span><h3>{t("Speak instead of type")}</h3><p>{t("On supported browsers, use Speak to dictate names, plans and helpful notes. Typing remains available.")}</p></article>
      </section>

      <footer className="landing-footer"><span>{t("We Care is a supportive companion, not a medical tool or a replacement for professional care.")}</span><span>{t("Health & Wellbeing · Designed with dignity and privacy.")}</span></footer>
    </main>
  </div>;
}

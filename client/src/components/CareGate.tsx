import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import BrandLockup from "@/components/BrandLockup";
import LanguageSelect from "@/components/LanguageSelect";
import SpeechToTextButton from "@/components/SpeechToTextButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { appendTranscription } from "@/lib/speechText";
import { trpc } from "@/lib/trpc";
import { dateKeyInTimezone, localClock, shiftDateKey } from "@/lib/careDates";
import { CalendarDays, Check, ChevronLeft, ChevronRight, HeartHandshake, LoaderCircle, MessageCircle, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function LoadingPanel({ text }: { text: string }) {
  return <div className="care-loading" role="status"><LoaderCircle className="animate-spin" size={24} /><span>{text}</span></div>;
}

export default function CareGate({ children }: { children: React.ReactNode }) {
  const profileQuery = trpc.care.profile.get.useQuery();
  const { user } = useAuth();
  const { t } = useLanguage();
  if (profileQuery.isLoading) return <LoadingPanel text={t("Preparing your care space…")} />;
  if (profileQuery.error) return <div className="care-gate"><h1>{t("We couldn't open your care space")}</h1><p>{t("Your saved information is still safe. Check your connection and try again.")}</p><Button onClick={() => profileQuery.refetch()}>{t("Try again")}</Button></div>;
  const profile = profileQuery.data;
  if (!profile || !profile.onboardingComplete) {
    return <OnboardingWizard key={profile?.updatedAt?.toString() ?? "new"} profile={profile ?? null} accountName={user?.name ?? ""} />;
  }
  return <><ReminderMonitor profile={profile} /><>{children}</></>;
}

function OnboardingWizard({ profile, accountName }: { profile: NonNullable<ReturnType<typeof useProfileType>> | null; accountName: string }) {
  const { language, setLanguage, t } = useLanguage();
  const timezoneDefault = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [step, setStep] = useState(profile?.onboardingStep ?? 0);
  const [role, setRole] = useState<"caregiver" | "supported">(profile?.role ?? "caregiver");
  const [displayName, setDisplayName] = useState(profile?.displayName ?? accountName.split(" ")[0] ?? "");
  const [supportedName, setSupportedName] = useState(profile?.supportedName ?? "");
  const [timezone, setTimezone] = useState(profile?.timezone ?? timezoneDefault);
  const [errorMessage, setErrorMessage] = useState("");
  const utils = trpc.useUtils();
  const save = trpc.care.profile.save.useMutation({ onError: (error) => setErrorMessage(t(error.message)) });

  const values = () => ({
    role,
    displayName: displayName.trim() || (accountName.split(" ")[0] || t("Care partner")),
    supportedName: supportedName.trim(), timezone, language,
    onboardingStep: step, onboardingComplete: false,
    speechRate: profile?.speechRate ?? 90,
    notificationsEnabled: profile?.notificationsEnabled ?? false,
  });
  const persist = async (nextStep: number, complete = false) => {
    setErrorMessage("");
    try {
      await save.mutateAsync({ ...values(), onboardingStep: nextStep, onboardingComplete: complete });
      await utils.care.profile.get.invalidate();
      setStep(nextStep);
    } catch { /* Error is shown inline; the user can retry. */ }
  };
  const finishWithDefaults = async () => persist(3, true);

  return <main className="onboarding-shell">
    <section className="onboarding-card" aria-labelledby="onboarding-title">
      <BrandLockup size="onboarding" />
      <div className="onboarding-progress" aria-label={t("Step {{current}} of {{total}}", { current: Math.min(step + 1, 3), total: 3 })}>
        {[0, 1, 2].map((number) => <span key={number} className={number <= step ? "progress-dot active" : "progress-dot"} />)}
      </div>
      {step === 0 ? <>
        <div className="onboarding-kicker">{t("A little support, at your pace")}</div>
        <h1 id="onboarding-title">{t("Welcome. Let's make this feel like yours.")}</h1>
        <p className="onboarding-lede">{t("We Care brings today's plans, familiar faces and gentle reminders into one calm place.")}</p>
        <div className="dictation-field-heading"><label className="field-label" htmlFor="displayName">{t("What should we call you?")}</label><SpeechToTextButton fieldName="your name" onTranscript={(text) => setDisplayName((current) => appendTranscription(current, text))} /></div>
        <input id="displayName" className="care-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={t("Your first name")} maxLength={120} />
        <p className="field-label">{t("Which best describes you?")}</p>
        <div className="role-options">
          <button type="button" className={`role-card ${role === "caregiver" ? "selected" : ""}`} onClick={() => setRole("caregiver")} aria-pressed={role === "caregiver"}>
            <HeartHandshake size={22} /><strong>{t("I'm supporting someone")}</strong><span>{t("I help organize the day.")}</span>
          </button>
          <button type="button" className={`role-card ${role === "supported" ? "selected" : ""}`} onClick={() => setRole("supported")} aria-pressed={role === "supported"}>
            <Users size={22} /><strong>{t("This is for me")}</strong><span>{t("I want a little help with my day.")}</span>
          </button>
        </div>
        <div className="field-row"><label className="field-grow"><span className="field-label">{t("Language")}</span><LanguageSelect className="care-input" onChange={setLanguage} /><small>{t("Apply immediately and save to your care profile.")}</small></label><label className="field-grow"><span className="field-label">{t("Your time zone")}</span><input className="care-input" value={timezone} onChange={(event) => setTimezone(event.target.value)} aria-label={t("Time zone")} /></label></div>
        {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
        <div className="onboarding-actions"><Button variant="ghost" onClick={finishWithDefaults} disabled={save.isPending}>{t("Set this up later")}</Button><Button onClick={() => persist(1)} disabled={save.isPending || !timezone.trim()}>{save.isPending ? t("Saving…") : t("Continue")}<ChevronRight className="directional-icon" size={18} /></Button></div>
      </> : step === 1 ? <>
        <div className="onboarding-kicker">{t("One more detail")}</div>
        <h1 id="onboarding-title">{t("Who are we supporting together?")}</h1>
        <p className="onboarding-lede">{t("You can add a name now or come back to it later. We only use it to make the day feel more personal.")}</p>
        <div className="dictation-field-heading"><label className="field-label" htmlFor="supportedName">{t("Person's name")} <span className="optional">({t("optional")})</span></label><SpeechToTextButton fieldName="the supported person's name" onTranscript={(text) => setSupportedName((current) => appendTranscription(current, text))} /></div>
        <input id="supportedName" className="care-input" value={supportedName} onChange={(event) => setSupportedName(event.target.value)} placeholder={t("For example, Alex")} maxLength={120} />
        <div className="privacy-note"><Check size={18} /><p>{t("Your information stays within your signed-in care space. You can change it any time.")}</p></div>
        {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
        <div className="onboarding-actions"><Button variant="ghost" onClick={() => setStep(0)}><ChevronLeft className="directional-icon" size={18} />{t("Back")}</Button><Button onClick={() => persist(2)} disabled={save.isPending}>{save.isPending ? t("Saving…") : t("Continue")}<ChevronRight className="directional-icon" size={18} /></Button></div>
      </> : <>
        <div className="onboarding-kicker">{t("Your quick tour")}</div>
        <h1 id="onboarding-title">{t("Everything you need, in one gentle place.")}</h1>
        <div className="tour-list">
          <div className="tour-item"><span><CalendarDays size={21} /></span><div><strong>{t("Today & Calendar")}</strong><p>{t("See what's planned. Past days stay view-only.")}</p></div></div>
          <div className="tour-item"><span><Users size={21} /></span><div><strong>{t("People I Know")}</strong><p>{t("Save familiar people and their photos with permission.")}</p></div></div>
          <div className="tour-item"><span><MessageCircle size={21} /></span><div><strong>{t("We Care Companion")}</strong><p>{t("Ask about saved plans. It won't guess or give medical advice.")}</p></div></div>
        </div>
        <p className="gentle-note">{t("This is a supportive companion, not a medical tool or a replacement for professional care.")}</p>
        {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
        <div className="onboarding-actions"><Button variant="ghost" onClick={() => setStep(1)}><ChevronLeft className="directional-icon" size={18} />{t("Back")}</Button><Button onClick={() => persist(3, true)} disabled={save.isPending}>{save.isPending ? t("Saving…") : t("Go to my day")}<ChevronRight className="directional-icon" size={18} /></Button></div>
      </>}
    </section>
  </main>;
}

function useProfileType() {
  return trpc.care.profile.get.useQuery().data;
}

function ReminderMonitor({ profile }: { profile: NonNullable<ReturnType<typeof useProfileType>> }) {
  const { t } = useLanguage();
  const timezone = profile.timezone || "UTC";
  const today = dateKeyInTimezone(timezone);
  const range = useMemo(() => ({ from: today, to: shiftDateKey(today, 7) }), [today]);
  const activitiesQuery = trpc.care.activities.list.useQuery(range, { refetchInterval: 60_000 });
  const activities = activitiesQuery.data ?? [];
  const firedRef = useRef(new Set<string>());

  useEffect(() => {
    if (!activities.length) return;
    const checkReminders = () => {
      const currentDay = dateKeyInTimezone(timezone);
      const currentTime = localClock(timezone);
      for (const activity of activities) {
        if (activity.dateKey !== currentDay || !activity.reminderTime || activity.reminderTime !== currentTime) continue;
        const key = `kindred-reminder-${profile.userId}-${activity.id}-${activity.dateKey}-${activity.reminderTime}`;
        if (firedRef.current.has(key) || localStorage.getItem(key)) continue;
        firedRef.current.add(key);
        localStorage.setItem(key, "1");
        const body = t("It's time for {{title}}.", { title: activity.title });
        if (profile.notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
          new Notification(t("We Care reminder"), { body });
        } else {
          toast.message(t("A gentle reminder"), { description: body });
        }
      }
    };
    checkReminders();
    const timer = window.setInterval(checkReminders, 15_000);
    return () => window.clearInterval(timer);
  }, [activities, profile.notificationsEnabled, profile.userId, t, timezone]);
  return null;
}

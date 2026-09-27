import { Button } from "@/components/ui/button";
import SpeechToTextButton from "@/components/SpeechToTextButton";
import { dateKeyInTimezone, shiftDateKey } from "@/lib/careDates";
import { appendTranscription } from "@/lib/speechText";
import { trpc } from "@/lib/trpc";
import { Bell, BookOpen, CalendarDays, Check, CircleHelp, HeartHandshake, LockKeyhole, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function HelpPage() {
  const profileQuery = trpc.care.profile.get.useQuery();
  const profile = profileQuery.data;
  const timezoneDefault = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [displayName, setDisplayName] = useState("");
  const [supportedName, setSupportedName] = useState("");
  const [role, setRole] = useState<"caregiver" | "supported">("caregiver");
  const [timezone, setTimezone] = useState(timezoneDefault);
  const [speechRate, setSpeechRate] = useState(90);
  const [language, setLanguage] = useState("en");
  const utils = trpc.useUtils();
  const save = trpc.care.profile.save.useMutation({ onError: (error) => toast.error(error.message) });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const today = dateKeyInTimezone(profile?.timezone || timezoneDefault);
  const range = useMemo(() => ({ from: today, to: shiftDateKey(today, 7) }), [today]);
  const activitiesQuery = trpc.care.activities.list.useQuery(range);
  const demoReset = trpc.care.demo.resetSamples.useMutation({ onSuccess: async () => { await Promise.all([utils.care.activities.list.invalidate(), utils.care.people.list.invalidate()]); toast.success("Demo samples removed. Your own information was kept."); }, onError: (error) => toast.error(error.message) });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setSupportedName(profile.supportedName ?? "");
      setRole(profile.role);
      setTimezone(profile.timezone);
      setSpeechRate(profile.speechRate);
      setLanguage(profile.language);
      setNotificationsEnabled(profile.notificationsEnabled);
    }
  }, [profile]);

  const persist = async (enabled = notificationsEnabled) => {
    if (!profile) return;
    try {
      await save.mutateAsync({ role, displayName: displayName.trim(), supportedName: supportedName.trim(), timezone, language: "en", onboardingStep: 3, onboardingComplete: true, speechRate, notificationsEnabled: enabled });
      setNotificationsEnabled(enabled);
      await utils.care.profile.get.invalidate();
      toast.success("Your preferences have been saved.");
    } catch { /* tRPC shows a friendly error toast */ }
  };

  const enableNotifications = async () => {
    if (!("Notification" in window)) { toast.message("This browser does not support notifications. Reminders can still appear while the app is open."); return; }
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") await persist(true);
      else { setNotificationsEnabled(false); toast.message("Notifications were not enabled. You can still use the calendar and spoken reminders."); }
    } catch { toast.error("We couldn't request notification permission. Please check your browser settings."); }
  };

  const hasSamples = (activitiesQuery.data ?? []).some((item) => item.isDemo);

  return <main className="page-wrap">
    <span className="page-kicker"><CircleHelp size={15} /> Here to help</span><h1 className="page-title">Help & settings</h1><p className="page-subtitle">Simple steps, preferences and a clear picture of what this demo can do.</p>
    <div className="help-grid">
      <section className="panel help-card"><h2><BookOpen size={19} style={{ verticalAlign: "-4px", marginRight: 7 }} />A quick guide</h2><p>Use the menu on the left to move between your day, calendar, familiar people and the companion.</p><ol style={{ color: "#607368", lineHeight: 1.8, paddingLeft: 22 }}><li>Start with <Link href="/app" className="text-link">Today</Link> for a simple overview.</li><li>Use <Link href="/calendar" className="text-link">Calendar</Link> to plan new activities.</li><li>Earlier days are view-only, so history stays in place.</li><li>Use <Link href="/people" className="text-link">People I Know</Link> for familiar names and consented photos.</li><li>The <Link href="/assistant" className="text-link">Companion</Link> answers only from the saved schedule in demo mode.</li></ol></section>
      <section className="panel help-card"><h2><LockKeyhole size={19} style={{ verticalAlign: "-4px", marginRight: 7 }} />Privacy and limits</h2><p>Your care records are separated by signed-in account. Familiar photos are stored in private file storage and served with short-lived signed links.</p><p>This demonstration does not use face recognition or an external AI model. It is not a diagnostic or treatment tool, and it does not replace professional care.</p><p>Voice dictation starts only when you tap Speak. Speech recognition is provided by the browser; its audio-processing and privacy terms depend on your browser and device.</p><p>Browser reminders work only while the app is open. This app does not run background notification jobs.</p></section>

      <section className="panel help-card" style={{ gridColumn: "1 / -1" }}><h2><HeartHandshake size={19} style={{ verticalAlign: "-4px", marginRight: 7 }} />Your preferences</h2>
        {profileQuery.isLoading ? <p>Loading preferences…</p> : !profile ? <p role="alert">Your preferences aren't available yet. Please try reloading this page.</p> : <>
          <div className="field-row"><div className="field-grow"><div className="dictation-field-heading"><label htmlFor="settings-display-name" className="field-label">Your name</label><SpeechToTextButton fieldName="your name" onTranscript={(text) => setDisplayName((current) => appendTranscription(current, text))} /></div><input id="settings-display-name" className="care-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} /></div><div className="field-grow"><div className="dictation-field-heading"><label htmlFor="settings-supported-name" className="field-label">Person receiving support <span className="optional">(optional)</span></label><SpeechToTextButton fieldName="the supported person's name" onTranscript={(text) => setSupportedName((current) => appendTranscription(current, text))} /></div><input id="settings-supported-name" className="care-input" value={supportedName} onChange={(event) => setSupportedName(event.target.value)} maxLength={120} /></div></div>
          <div className="field-row"><label className="field-grow"><span className="field-label">Account view</span><select className="care-input" value={role} onChange={(event) => setRole(event.target.value as "caregiver" | "supported")}><option value="caregiver">Caregiver</option><option value="supported">Person receiving support</option></select><small>Person receiving support can view the plan; caregivers manage schedule and familiar-person details.</small></label><label className="field-grow"><span className="field-label">Time zone</span><input className="care-input" value={timezone} onChange={(event) => setTimezone(event.target.value)} maxLength={80} /></label></div>
          <div className="field-row"><label className="field-grow"><span className="field-label">Language</span><select className="care-input" value={language} onChange={(event) => setLanguage(event.target.value)} disabled><option value="en">English</option></select><small>More languages are not yet available in this demo.</small></label><label className="field-grow"><span className="field-label"><Volume2 size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} />Speech rate: {speechRate}%</span><input className="care-input" type="range" min={70} max={120} step={5} value={speechRate} onChange={(event) => setSpeechRate(Number(event.target.value))} aria-label="Speech rate" /></label></div>
          <div className="settings-row"><div><strong><Bell size={15} style={{ verticalAlign: "-3px", marginRight: 5 }} />Browser reminders</strong><small>{notificationsEnabled ? "Permission granted. Reminders work while this app is open." : "Optional. Permission is requested only when you press Enable."}</small></div><Button variant="outline" onClick={enableNotifications} disabled={notificationsEnabled || save.isPending}>{notificationsEnabled ? <><Check size={16} />Enabled</> : "Enable reminders"}</Button></div>
          <div style={{ marginTop: 17 }}><Button onClick={() => persist()} disabled={save.isPending || !displayName.trim()}>{save.isPending ? "Saving…" : "Save preferences"}</Button></div>
        </>}
      </section>

      <section className="panel help-card"><h2><CalendarDays size={19} style={{ verticalAlign: "-4px", marginRight: 7 }} />A note about reminders</h2><p>Activities can include a reminder time. The app can alert you in this browser while it stays open; notification permission depends on your device and browser. Notifications are not guaranteed and should not be used for urgent or medication-critical care.</p><p>Medication-related events can be recorded by a caregiver if appropriate, but this app does not prescribe routines or doses.</p></section>
      <section className="panel help-card"><h2><RotateCcw size={19} style={{ verticalAlign: "-4px", marginRight: 7 }} />Demo data</h2><p>Sample records are fictional and tagged separately. Reset removes only those tagged examples; your real activities and people remain untouched.</p><Button variant="outline" onClick={() => { if (window.confirm("Remove only the fictional We Care demo samples? Your own information will not be changed.")) demoReset.mutate(); }} disabled={demoReset.isPending || !hasSamples}>{demoReset.isPending ? "Removing…" : "Reset sample records"}</Button>{!hasSamples && <small style={{ display: "block", marginTop: 8, color: "#78857d" }}>No sample activities are loaded right now.</small>}</section>
    </div>
    <div className="chat-warning" style={{ marginTop: 18 }}>If you need urgent help or have a health concern, contact the person's care team or local emergency services.</div>
  </main>;
}

import { Button } from "@/components/ui/button";
import { useSpeech } from "@/contexts/SpeechContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { dateKeyInTimezone, localClock, shiftDateKey } from "@/lib/careDates";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Bell, Check, CircleHelp, Clock3, MessageCircle, Play, RotateCcw, Volume2, VolumeX, Users } from "lucide-react";
import { useMemo } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

function readableDate(dateKey: string, locale: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric" }).format(date);
}

function formatTime(value: string, locale: string) {
  const [hour, minute] = value.split(":").map(Number);
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, hour, minute));
}

function SpeakButton({ id, text, rate }: { id: string; text: string; rate: number }) {
  const speech = useSpeech();
  const { t } = useLanguage();
  const playing = speech.activeId === id;
  const label = playing ? t("Stop reading aloud") : t("Read aloud");
  return <button className="icon-button" aria-label={label} title={label} onClick={() => playing ? speech.stop() : speech.speak(id, text, rate)}>{playing ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>;
}

export default function DashboardPage() {
  const { t, locale } = useLanguage();
  const profileQuery = trpc.care.profile.get.useQuery();
  const profile = profileQuery.data;
  const timezone = profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const today = dateKeyInTimezone(timezone);
  const range = useMemo(() => ({ from: shiftDateKey(today, -2), to: shiftDateKey(today, 21) }), [today]);
  const activitiesQuery = trpc.care.activities.list.useQuery(range);
  const utils = trpc.useUtils();
  const setCompleted = trpc.care.activities.setCompleted.useMutation({ onSuccess: () => utils.care.activities.list.invalidate(), onError: (error) => toast.error(t(error.message)) });
  const loadDemo = trpc.care.demo.loadSamples.useMutation({
    onSuccess: async (result) => {
      await Promise.all([utils.care.activities.list.invalidate(), utils.care.people.list.invalidate()]);
      toast.success(t(result.alreadyLoaded ? "Sample day is already ready." : "Sample day added. Your own information was left untouched."));
    },
    onError: (error) => toast.error(t(error.message)),
  });
  const resetDemo = trpc.care.demo.resetSamples.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.care.activities.list.invalidate(), utils.care.people.list.invalidate()]);
      toast.success(t("Demo samples removed. Your own information was kept."));
    },
    onError: (error) => toast.error(t(error.message)),
  });

  const activities = activitiesQuery.data ?? [];
  const todayItems = activities.filter((item) => item.dateKey === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const completed = todayItems.filter((item) => item.status === "completed").length;
  const formatNumber = (value: number) => new Intl.NumberFormat(locale).format(value);
  const hasSamples = activities.some((item) => item.isDemo);
  const hour = Number(localClock(timezone).split(":")[0]);
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const personName = profile?.supportedName || profile?.displayName || t("friend");
  const next = todayItems.find((item) => item.status !== "completed" && item.startTime >= localClock(timezone));
  const speechRate = profile?.speechRate ?? 90;
  const nextText = next
    ? t("Next, {{title}}, at {{time}}.", { title: next.title, time: formatTime(next.startTime, locale) })
    : t("Here is your day. {{count}} activities are saved.", { count: new Intl.NumberFormat(locale).format(todayItems.length) });

  return <main className="page-wrap">
    <div className="welcome-row">
      <div><span className="date-label">{readableDate(today, locale)}</span><h1 className="page-title">{t(greeting)}, {personName}.</h1><p className="page-subtitle">{t("Let's take today one step at a time.")}</p></div>
      <span className="demo-mode-pill"><span aria-hidden="true">●</span> {t("Private care space")}</span>
    </div>

    <div className="dashboard-grid">
      <section>
        <article className="panel today-card">
          <span className="demo-mode-pill">{t("Your day, at a glance")}</span>
          <h2>{t(next ? "Coming up next" : "Your day is ready")}</h2>
          <p>{next ? `${formatTime(next.startTime, locale)} · ${next.title}${next.notes ? ` — ${next.notes}` : ""}` : t("Add a gentle plan when you're ready, or look through the calendar together.")}</p>
          <div style={{ position: "relative", zIndex: 1, marginTop: 18, display: "flex", flexWrap: "wrap", gap: 9 }}>
            <Link href="/calendar"><Button variant="secondary">{t("Open calendar")} <ArrowRight className="directional-icon" size={16} /></Button></Link>
            <SpeakButton id="dashboard-next" text={nextText} rate={speechRate} />
          </div>
        </article>
        <div className="stat-grid" aria-label={t("Today's progress")}>
          <div className="stat-card"><span className="stat-label">{t("Planned for today")}</span><strong className="stat-value">{formatNumber(todayItems.length)}</strong><small>{t("activities")}</small></div>
          <div className="stat-card"><span className="stat-label">{t("Done so far")}</span><strong className="stat-value">{formatNumber(completed)}<span style={{ color: "#9ca99e", fontSize: "1.1rem" }}> / {formatNumber(todayItems.length)}</span></strong><small>{t("at your own pace")}</small></div>
        </div>
      </section>

      <section className="panel panel-pad">
        <div className="section-head"><div><h2>{t("Quick paths")}</h2><p>{t("Go where you need, simply.")}</p></div></div>
        <div className="quick-links">
          <Link className="quick-link" href="/calendar"><span><Clock3 size={19} /></span><span><strong>{t("Calendar")}</strong><small>{t("Plan a day")}</small></span></Link>
          <Link className="quick-link" href="/people"><span><Users size={19} /></span><span><strong>{t("People I Know")}</strong><small>{t("See familiar faces")}</small></span></Link>
          <Link className="quick-link" href="/assistant"><span><MessageCircle size={19} /></span><span><strong>{t("Companion")}</strong><small>{t("Ask about your plans")}</small></span></Link>
          <Link className="quick-link" href="/help"><span><CircleHelp size={19} /></span><span><strong>{t("Help & settings")}</strong><small>{t("Preferences and help")}</small></span></Link>
        </div>
      </section>

      <section className="panel panel-pad" style={{ gridColumn: "1 / -1" }}>
        <div className="section-head"><div><h2>{t("Today's plan")}</h2><p>{t("A simple list. There is no rush.")}</p></div><Link href="/calendar" className="text-link">{t("View calendar")} <ArrowRight className="directional-icon" size={15} style={{ verticalAlign: "-2px" }} /></Link></div>
        {activitiesQuery.isLoading ? <p className="empty-state">{t("Loading today's activities…")}</p> : activitiesQuery.error ? <div className="empty-state" role="alert">{t("We couldn't load the plan.")} <button className="text-link" onClick={() => activitiesQuery.refetch()}>{t("Try again")}</button></div> : todayItems.length ? <div className="activity-list">
          {todayItems.map((item) => <div className="activity-row" key={item.id}>
            <span className="activity-time">{formatTime(item.startTime, locale)}</span><span className="activity-marker" />
            <span><span className="activity-title">{item.title}</span>{item.notes && <span className="activity-detail">{item.notes}</span>}{item.reminderTime && <span className="activity-detail"><Bell size={12} style={{ verticalAlign: "-2px", marginInlineEnd: 4 }} />{t("Reminder at {{time}}", { time: formatTime(item.reminderTime, locale) })}</span>}</span>
            <span className="activity-actions"><span className={item.status === "completed" ? "status-pill completed" : "status-pill"}>{item.status === "completed" ? <><Check size={12} /> {t("Done")}</> : t("Planned")}</span><SpeakButton id={`activity-${item.id}`} text={`${item.title}. ${item.notes || ""} ${item.reminderTime ? t("Reminder at {{time}}", { time: formatTime(item.reminderTime, locale) }) : ""}`} rate={speechRate} />{item.status !== "completed" && <button className="icon-button" aria-label={t("Mark {{title}} complete", { title: item.title })} title={t("Mark complete")} onClick={() => setCompleted.mutate({ id: item.id, completed: true })} disabled={setCompleted.isPending}><Check size={17} /></button>}</span>
          </div>)}
        </div> : <div className="empty-state"><CalendarDaysIcon /><strong>{t("A blank day is okay.")}</strong><span>{t("Add a plan whenever it feels helpful.")}</span><div style={{ marginTop: 13 }}><Link href="/calendar"><Button variant="outline">{t("Add an activity")}</Button></Link></div></div>}
      </section>

      <section className="panel panel-pad" style={{ gridColumn: "1 / -1" }}>
        <div className="section-head"><div><h2>{t("Demo samples")}</h2><p>{t("Optional fictional examples for a quick walkthrough. Reset affects sample records only.")}</p></div></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Button variant="outline" onClick={() => loadDemo.mutate()} disabled={loadDemo.isPending}><Play size={16} />{loadDemo.isPending ? t("Adding…") : hasSamples ? t("Samples already loaded") : t("Load sample day")}</Button>
          {hasSamples && <Button variant="ghost" onClick={() => { if (window.confirm(t("Remove only the fictional We Care demo samples? Your own activities and people will not be changed."))) resetDemo.mutate(); }} disabled={resetDemo.isPending}><RotateCcw size={16} />{t("Reset demo samples")}</Button>}
        </div>
      </section>
    </div>
  </main>;
}

function CalendarDaysIcon() { return <Clock3 size={25} aria-hidden="true" />; }

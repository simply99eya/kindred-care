import { Button } from "@/components/ui/button";
import { DialogFrame } from "@/components/DialogFrame";
import SpeechToTextButton from "@/components/SpeechToTextButton";
import { useSpeech } from "@/contexts/SpeechContext";
import { dateKeyInTimezone, shiftDateKey } from "@/lib/careDates";
import { appendTranscription } from "@/lib/speechText";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Bell, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, LockKeyhole, Plus, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

type Activity = { id: number; title: string; notes: string | null; category: "routine" | "appointment" | "visit" | "reminder" | "rest" | "other"; dateKey: string; startTime: string; reminderTime: string | null; status: "planned" | "completed"; isDemo: boolean };
const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const pastDayText = "Previous days are available for viewing only. You can plan new activities for today or a future day.";
function keyForDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function dateAtNoon(key: string) { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d, 12); }
function humanDate(key: string, options: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }) { return dateAtNoon(key).toLocaleDateString("en", options); }
function humanTime(value: string) { const [hour, minute] = value.split(":").map(Number); return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, hour, minute)); }

function SpeechControl({ id, text, rate }: { id: string; text: string; rate: number }) {
  const speech = useSpeech();
  const playing = speech.activeId === id;
  return <button className="icon-button" title={playing ? "Stop reading" : "Read aloud"} aria-label={playing ? "Stop reading" : "Read aloud"} onClick={() => playing ? speech.stop() : speech.speak(id, text, rate)}>{playing ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>;
}

export default function CalendarPage() {
  const profileQuery = trpc.care.profile.get.useQuery();
  const profile = profileQuery.data;
  const timezone = profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const today = dateKeyInTimezone(timezone);
  const [selectedDate, setSelectedDate] = useState("");
  const [month, setMonth] = useState(() => new Date());
  const [editing, setEditing] = useState<Activity | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const utils = trpc.useUtils();
  const range = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
    const mondayOffset = (first.getDay() + 6) % 7;
    const gridStart = keyForDate(new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset, 12));
    return { from: gridStart, to: shiftDateKey(gridStart, 41) };
  }, [month]);
  const activitiesQuery = trpc.care.activities.list.useQuery(range);
  const activities = activitiesQuery.data ?? [];
  const completeMutation = trpc.care.activities.setCompleted.useMutation({ onSuccess: () => utils.care.activities.list.invalidate(), onError: (error) => toast.error(error.message) });
  const deleteMutation = trpc.care.activities.remove.useMutation({ onSuccess: () => { void utils.care.activities.list.invalidate(); toast.success("Activity removed."); }, onError: (error) => toast.error(error.message) });

  useEffect(() => {
    if (profile && !selectedDate) {
      const nowDate = dateKeyInTimezone(profile.timezone);
      setSelectedDate(nowDate);
      const [y, m] = nowDate.split("-").map(Number);
      setMonth(new Date(y, m - 1, 1));
    }
  }, [profile, selectedDate]);

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
    const offset = (first.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => keyForDate(new Date(month.getFullYear(), month.getMonth(), 1 - offset + index, 12)));
  }, [month]);
  const selectedActivities = activities.filter((item) => item.dateKey === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const canEditDay = Boolean(selectedDate && selectedDate >= today && profile?.role !== "supported");
  const speechRate = profile?.speechRate ?? 90;
  const monthLabel = month.toLocaleDateString("en", { month: "long", year: "numeric" });

  const moveMonth = (delta: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  const openNewActivity = () => { setEditing(null); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditing(null); };
  const doDelete = (activity: Activity) => {
    if (window.confirm(`Remove “${activity.title}” from the schedule?`)) deleteMutation.mutate({ id: activity.id });
  };

  return <main className="page-wrap">
    <span className="page-kicker"><CalendarDays size={15} /> A steady rhythm</span>
    <h1 className="page-title">Calendar</h1>
    <p className="page-subtitle">Look back at earlier days, or plan something for today and beyond.</p>

    <div className="calendar-layout">
      <section className="panel calendar-panel" aria-label="Monthly calendar">
        <div className="calendar-month-head"><h2>{monthLabel}</h2><div className="calendar-month-actions"><button className="icon-button" aria-label="Previous month" onClick={() => moveMonth(-1)}><ChevronLeft /></button><button className="icon-button" aria-label="Next month" onClick={() => moveMonth(1)}><ChevronRight /></button></div></div>
        <div className="calendar-weekdays">{weekdayNames.map((day) => <span className="calendar-weekday" key={day}>{day}</span>)}</div>
        <div className="calendar-days" role="grid" aria-label={monthLabel}>
          {days.map((key) => {
            const date = dateAtNoon(key);
            const hasItems = activities.some((item) => item.dateKey === key);
            const classes = ["calendar-day", date.getMonth() !== month.getMonth() ? "other-month" : "", key < today ? "past" : "", key === today ? "today" : "", key === selectedDate ? "selected" : ""].filter(Boolean).join(" ");
            return <button type="button" key={key} role="gridcell" aria-label={`${humanDate(key)}${key < today ? ", view only" : ""}${hasItems ? ", has activities" : ""}`} aria-pressed={key === selectedDate} className={classes} onClick={() => { setSelectedDate(key); if (date.getMonth() !== month.getMonth()) setMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }}><span>{date.getDate()}</span>{hasItems && <span className="event-indicator" aria-hidden="true" />}</button>;
          })}
        </div>
        <div className="calendar-legend"><span className="legend-item"><span className="legend-dot" /> Has an activity</span><span className="legend-item"><span style={{ width: 9, height: 9, border: "1px solid #7aa082", borderRadius: "50%" }} /> Today</span><span className="legend-item"><LockKeyhole size={13} /> Past day: view only</span></div>
      </section>

      <section className="panel panel-pad" aria-live="polite">
        <div className="agenda-head"><div><h2>{selectedDate ? humanDate(selectedDate) : "Choose a day"}</h2><p>{selectedDate === today ? "Today · your local time" : selectedDate < today ? "Earlier day · view only" : "A day ahead"}</p></div>
          {canEditDay && <Button onClick={openNewActivity}><Plus size={17} />Add activity</Button>}
        </div>
        {selectedDate && selectedDate < today && <div className="read-only-note"><LockKeyhole size={17} /><span>{pastDayText}</span></div>}
        {profile?.role === "supported" && selectedDate >= today && <div className="read-only-note"><LockKeyhole size={17} /><span>Your caregiver manages schedule changes. You can view the plan and mark activities complete.</span></div>}
        {activitiesQuery.isLoading ? <div className="empty-state">Loading this day…</div> : activitiesQuery.error ? <div className="empty-state" role="alert">We couldn't load this day. <button className="text-link" onClick={() => activitiesQuery.refetch()}>Try again</button></div> : selectedActivities.length ? <div className="activity-list">
          {selectedActivities.map((activity) => <div className="activity-row" key={activity.id}>
            <span className="activity-time">{humanTime(activity.startTime)}</span><span className="activity-marker" />
            <span><span className="activity-title">{activity.title}</span>{activity.notes && <span className="activity-detail">{activity.notes}</span>}{activity.reminderTime && <span className="activity-detail"><Bell size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />Reminder at {humanTime(activity.reminderTime)}</span>}</span>
            <span className="activity-actions"><span className={activity.status === "completed" ? "status-pill completed" : "status-pill"}>{activity.status === "completed" ? <><Check size={12} /> Done</> : "Planned"}</span><SpeechControl id={`calendar-${activity.id}`} text={`${activity.title}. ${activity.notes ?? ""} ${activity.reminderTime ? `Reminder at ${humanTime(activity.reminderTime)}.` : ""}`} rate={speechRate} />{selectedDate >= today && <button className="icon-button" aria-label={activity.status === "completed" ? `Mark ${activity.title} as planned` : `Mark ${activity.title} complete`} title={activity.status === "completed" ? "Mark as planned" : "Mark complete"} onClick={() => completeMutation.mutate({ id: activity.id, completed: activity.status !== "completed" })} disabled={completeMutation.isPending}><Check size={17} /></button>}{canEditDay && <><button className="icon-button" aria-label={`Edit ${activity.title}`} title="Edit" onClick={() => { setEditing(activity); setFormOpen(true); }}><ArrowRight size={17} /></button><button className="icon-button" aria-label={`Delete ${activity.title}`} title="Delete" onClick={() => doDelete(activity)}><span aria-hidden="true">×</span></button></>}</span>
          </div>)}
        </div> : <div className="empty-state"><Clock3 size={25} aria-hidden="true" /><strong>No activities saved for this day.</strong><span>{canEditDay ? "You can add a plan whenever it feels helpful." : "There is nothing to show here yet."}</span></div>}
      </section>
    </div>
    {formOpen && <ActivityForm selectedDate={selectedDate} activity={editing} onClose={closeForm} onSaved={async () => { closeForm(); await utils.care.activities.list.invalidate(); }} />}
  </main>;
}

function ActivityForm({ selectedDate, activity, onClose, onSaved }: { selectedDate: string; activity: Activity | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [title, setTitle] = useState(activity?.title ?? "");
  const [notes, setNotes] = useState(activity?.notes ?? "");
  const [category, setCategory] = useState<Activity["category"]>(activity?.category ?? "routine");
  const [dateKey, setDateKey] = useState(activity?.dateKey ?? selectedDate);
  const [startTime, setStartTime] = useState(activity?.startTime ?? "09:00");
  const [reminderTime, setReminderTime] = useState(activity?.reminderTime ?? "");
  const [error, setError] = useState("");
  const create = trpc.care.activities.create.useMutation();
  const update = trpc.care.activities.update.useMutation();
  const busy = create.isPending || update.isPending;

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    const data = { title: title.trim(), notes, category, dateKey, startTime, reminderTime: reminderTime || null };
    try {
      if (activity) await update.mutateAsync({ id: activity.id, ...data });
      else await create.mutateAsync(data);
      toast.success(activity ? "Activity updated." : "Activity added.");
      await onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "That change could not be saved. Please try again."); }
  };

  return <DialogFrame titleId="activity-form-title" onClose={() => { if (!busy) onClose(); }}>
      <h2 id="activity-form-title">{activity ? "Edit activity" : "Add an activity"}</h2>
      <p>Keep the details short and easy to remember.</p>
      <form onSubmit={submit}>
        <div className="dictation-field-heading"><label className="field-label" htmlFor="activity-title">Activity</label><SpeechToTextButton fieldName="activity title" onTranscript={(text) => setTitle((current) => appendTranscription(current, text))} /></div><input autoFocus required id="activity-title" className="care-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="For example, visit with family" />
        <div className="dictation-field-heading"><label className="field-label" htmlFor="activity-notes">A helpful note <span className="optional">(optional)</span></label><SpeechToTextButton fieldName="activity note" onTranscript={(text) => setNotes((current) => appendTranscription(current, text))} /></div><textarea id="activity-notes" className="care-input" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} placeholder="A short description" />
        <div className="field-row"><label className="field-grow"><span className="field-label">Day</span><input className="care-input" type="date" value={dateKey} onChange={(e) => setDateKey(e.target.value)} required /></label><label className="field-grow"><span className="field-label">Time</span><input className="care-input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /></label></div>
        <div className="field-row"><label className="field-grow"><span className="field-label">Type</span><select className="care-input" value={category} onChange={(e) => setCategory(e.target.value as Activity["category"])}><option value="routine">Routine</option><option value="appointment">Appointment</option><option value="visit">Visit</option><option value="reminder">Reminder</option><option value="rest">Rest</option><option value="other">Other</option></select></label><label className="field-grow"><span className="field-label">Reminder <span className="optional">(optional)</span></span><input className="care-input" type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} /></label></div>
        <p className="gentle-note">Reminders appear while this app is open. This demo does not schedule background notifications.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions"><Button variant="outline" type="button" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy || !title.trim()}>{busy ? "Saving…" : activity ? "Save changes" : "Add activity"}</Button></div>
      </form>
  </DialogFrame>;
}

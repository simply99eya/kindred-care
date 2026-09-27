import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CalendarDays, HeartHandshake, LockKeyhole, MessageCircle, Sparkles, Users } from "lucide-react";
import { Link } from "wouter";
import { startLogin } from "@/const";

export default function Home() {
  const { user, loading } = useAuth();
  const continueToApp = () => user ? window.location.assign("/app") : startLogin();

  return <div className="landing">
    <header className="landing-header">
      <div className="brand-lockup"><span className="brand-mark"><HeartHandshake size={23} /></span><span>Kindred Care</span></div>
      <nav className="landing-nav" aria-label="Main navigation">
        <a className="text-link" href="#how-it-helps">How it helps</a>
        {user ? <Link className="text-link" href="/app">Open my day</Link> : <button className="text-link" onClick={startLogin}>Sign in</button>}
        <Button onClick={continueToApp} disabled={loading}>{user ? "Open my care space" : "Get started"}</Button>
      </nav>
    </header>

    <main className="landing-main">
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="hero-eyebrow"><Sparkles size={15} /> A calmer kind of everyday support</div>
          <h1>A little more ease in <em>every day.</em></h1>
          <p>Kindred Care brings daily plans, gentle reminders and familiar faces together — giving people and the people who care for them one reassuring place to turn.</p>
          <div className="hero-actions">
            <Button size="lg" onClick={continueToApp} disabled={loading}>{user ? "Continue to today" : "Create your care space"}</Button>
            <a className="text-link" href="#how-it-helps">See how it works</a>
          </div>
          <div className="hero-note"><LockKeyhole size={14} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Personal information stays inside your signed-in space.</div>
        </div>
        <div className="hero-art" aria-label="A preview of a simple daily plan">
          <div className="floating-note note-top"><HeartHandshake size={18} /> A familiar, friendly place</div>
          <div className="demo-day-card">
            <div className="demo-day-head"><div><strong>A gentle day</strong><small>One thing at a time</small></div><span className="day-icon"><CalendarDays size={20} /></span></div>
            <div className="day-divider" />
            <div className="demo-event"><span className="demo-time">9:00 AM</span><div><strong>Breakfast together</strong><small>A comfortable start</small></div><span className="event-dot" /></div>
            <div className="demo-event"><span className="demo-time">11:30 AM</span><div><strong>Time in the garden</strong><small>A little fresh air</small></div><span className="event-dot" /></div>
            <div className="demo-event"><span className="demo-time">3:00 PM</span><div><strong>A call with family</strong><small>A friendly hello</small></div><span className="event-dot" /></div>
          </div>
          <div className="floating-note note-bottom"><MessageCircle size={18} /> “What do I have planned?”</div>
        </div>
      </section>

      <section id="how-it-helps" className="landing-features" aria-label="How Kindred Care helps">
        <article className="feature-tile"><span><CalendarDays size={21} /></span><h3>A day that feels clear</h3><p>See activities and appointments in a simple calendar. Earlier days remain available to look back on.</p></article>
        <article className="feature-tile"><span><Users size={21} /></span><h3>People who feel familiar</h3><p>Caregivers can keep names, relationships and consented photos together in one private place.</p></article>
        <article className="feature-tile"><span><MessageCircle size={21} /></span><h3>Helpful, without guessing</h3><p>The companion answers from the saved schedule. In this demo, it is clearly marked as a guided sample.</p></article>
      </section>

      <footer className="landing-footer"><span>Kindred Care is a supportive companion, not a medical tool or a replacement for professional care.</span><span>Designed with dignity, privacy and independence in mind.</span></footer>
    </main>
  </div>;
}

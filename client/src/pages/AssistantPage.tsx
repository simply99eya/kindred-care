import { Button } from "@/components/ui/button";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { useSpeech } from "@/contexts/SpeechContext";
import { dateKeyInTimezone } from "@/lib/careDates";
import { trpc } from "@/lib/trpc";
import { CalendarDays, Mic, MicOff, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type BrowserRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => BrowserRecognition;
    webkitSpeechRecognition?: new () => BrowserRecognition;
  }
}

export default function AssistantPage() {
  const profileQuery = trpc.care.profile.get.useQuery();
  const profile = profileQuery.data;
  const timezone = profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [dateKey, setDateKey] = useState("");
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const speech = useSpeech();
  const ask = trpc.care.assistant.ask.useMutation();

  useEffect(() => {
    if (!dateKey && profile) setDateKey(dateKeyInTimezone(profile.timezone));
  }, [dateKey, profile]);
  useEffect(() => {
    setVoiceAvailable(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);
  useEffect(() => () => recognitionRef.current?.stop(), []);

  const sendQuestion = (question: string) => {
    const clean = question.trim();
    if (!clean || ask.isPending || !dateKey) return;
    setMessages((current) => [...current, { role: "user", content: clean }]);
    ask.mutate({ message: clean, dateKey }, {
      onSuccess: (response) => setMessages((current) => [...current, { role: "assistant", content: response.text }]),
      onError: () => setMessages((current) => [...current, { role: "assistant", content: "I'm sorry, I couldn't read the saved schedule just now. Please try again in a moment." }]),
    });
  };

  const startVoiceInput = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { toast.message("Voice input isn't available in this browser. You can type instead."); return; }
    try {
      const recognition = new Recognition();
      recognitionRef.current = recognition;
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim();
        if (transcript) sendQuestion(transcript);
      };
      recognition.onerror = () => toast.error("We couldn't hear that. Please try again or type your question.");
      recognition.onend = () => { setListening(false); recognitionRef.current = null; };
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
      toast.error("Voice input couldn't start. Please type your question instead.");
    }
  };

  const activeIndex = speech.activeId?.startsWith("assistant-message-") ? Number(speech.activeId.replace("assistant-message-", "")) : null;
  const readMessage = (content: string, index: number) => {
    if (!speech.speak(`assistant-message-${index}`, content, profile?.speechRate ?? 90)) toast.message("Speech isn't available in this browser.");
  };

  return <main className="page-wrap">
    <div className="assistant-intro"><span className="page-kicker"><Sparkles size={15} /> A friendly guide</span><h1 className="page-title">Kindred Companion</h1><p className="page-subtitle">Ask a simple question about the saved plan or how to find something in the app.</p></div>
    <div className="chat-warning"><strong>Demo guide:</strong> This schedule helper reads only the activities saved for the selected day. It is not connected to an external AI model and does not provide medical advice. If something isn't in the calendar, it will say so.</div>
    <div className="assistant-shell">
      <div className="settings-row" style={{ padding: "13px 17px", background: "#f8faf5" }}><div><strong><CalendarDays size={15} style={{ verticalAlign: "-3px", marginRight: 6 }} />Ask about a day</strong><small>Answers use saved activities only.</small></div><input className="care-input settings-control" type="date" aria-label="Choose the day for schedule questions" value={dateKey} onChange={(event) => setDateKey(event.target.value)} /></div>
      <AIChatBox
        className="chat-box"
        messages={messages}
        onSendMessage={sendQuestion}
        isLoading={ask.isPending}
        placeholder="Ask about your saved plans…"
        emptyStateMessage="Hello. I can help with plans saved in your calendar, or show you where to find something."
        suggestedPrompts={["What's on my schedule today?", "What's next today?", "Where can I see familiar people?"]}
        height={470}
        onReadMessage={readMessage}
        readingIndex={activeIndex}
        onStopReading={speech.stop}
      />
    </div>
    <div style={{ width: "min(840px, 100%)", margin: "14px auto", display: "flex", justifyContent: "flex-end" }}><Button variant="outline" onClick={startVoiceInput} disabled={!voiceAvailable || listening || ask.isPending} title={voiceAvailable ? "Speak a question" : "Voice input is not available in this browser"}><Mic size={17} />{listening ? "Listening…" : voiceAvailable ? "Ask by voice" : "Voice input unavailable"}</Button>{listening && <Button variant="ghost" onClick={() => { recognitionRef.current?.stop(); setListening(false); }}><MicOff size={17} />Stop</Button>}</div>
    <div className="chat-warning">For changes to a person's care or medication, please speak with their care team. Kindred Care is a supportive companion, not a medical service.</div>
  </main>;
}

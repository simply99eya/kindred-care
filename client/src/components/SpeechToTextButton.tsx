import { Button } from "@/components/ui/button";
import { getBrowserSpeechRecognition, type BrowserSpeechRecognition } from "@/lib/browserSpeechRecognition";
import { useLanguage } from "@/contexts/LanguageContext";
import { speechLocaleForLanguage } from "@/lib/translations";
import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function SpeechToTextButton({ fieldName, onTranscript, language }: { fieldName: string; onTranscript: (transcript: string) => void; language?: string }) {
  const { language: appLanguage, t } = useLanguage();
  const recognitionLanguage = language ?? speechLocaleForLanguage(appLanguage);
  const translatedFieldName = t(fieldName);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const listeningRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const supported = Boolean(getBrowserSpeechRecognition());

  useEffect(() => () => {
    listeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch { /* The browser may already have ended recognition. */ }
    recognitionRef.current = null;
  }, []);

  const toggleListening = () => {
    if (listeningRef.current) {
      try { recognitionRef.current?.stop(); } catch { /* Recognition may already be stopping. */ }
      listeningRef.current = false;
      setListening(false);
      setStatus(t("Dictation stopped."));
      return;
    }
    const Recognition = getBrowserSpeechRecognition();
    if (!Recognition) {
      setStatus(t("Speech input isn't available in this browser. You can type instead."));
      return;
    }
    try {
      const recognition = new Recognition();
      recognition.lang = recognitionLanguage;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map((result) => result[0]?.transcript ?? "").filter(Boolean).join(" ").trim();
        if (transcript) {
          onTranscriptRef.current(transcript);
          setStatus(t("Speech added to this text field."));
        }
      };
      recognition.onerror = (event) => {
        const message = event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone permission wasn't granted. You can type instead."
          : event.error === "no-speech"
            ? "No speech was heard. Please try again or type instead."
            : event.error === "audio-capture"
              ? "No microphone is available. You can type instead."
              : "Speech input couldn't start. Please try again or type instead.";
        setStatus(t(message));
      };
      recognition.onend = () => {
        listeningRef.current = false;
        recognitionRef.current = null;
        setListening(false);
      };
      recognitionRef.current = recognition;
      listeningRef.current = true;
      setStatus(t("Listening. Speak now, then pause to add the text."));
      setListening(true);
      recognition.start();
    } catch {
      listeningRef.current = false;
      recognitionRef.current = null;
      setListening(false);
      setStatus(t("Speech input couldn't start. Please type instead."));
    }
  };

  return <span className="dictation-control">
    <Button type="button" variant="outline" size="sm" className="dictation-button" onClick={toggleListening} aria-pressed={listening} aria-label={listening ? t("Stop speaking {{field}}", { field: translatedFieldName }) : t("Speak {{field}}", { field: translatedFieldName })} title={supported ? t("Speak {{field}}", { field: translatedFieldName }) : t("Voice input is not available in this browser")}>
      {listening ? <MicOff size={15} /> : <Mic size={15} />}
      {listening ? t("Stop") : supported ? t("Speak") : t("Voice unavailable")}
    </Button>
    {status && <small className="dictation-status" role={status.includes("permission") || status.includes("available") || status.includes("microphone") || status.includes("couldn't") || status.includes("لم") || status.includes("تعذر") || status.includes("غير متاح") ? "alert" : "status"} aria-live="polite">{status}</small>}
  </span>;
}

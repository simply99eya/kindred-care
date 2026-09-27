import { Button } from "@/components/ui/button";
import { DialogFrame } from "@/components/DialogFrame";
import SpeechToTextButton from "@/components/SpeechToTextButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { appendTranscription } from "@/lib/speechText";
import { trpc } from "@/lib/trpc";
import { Camera, Check, ImagePlus, LockKeyhole, Pencil, ScanFace, Trash2, UserRound, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";

type Person = { id: number; name: string; relationship: string; description: string | null; isDemo: boolean; hasPhoto: boolean };
type PersonData = { name: string; relationship: string; description: string; photoDataUrl: string | null; photoConsent: boolean; removePhoto: boolean };

async function imageFileToDataUrl(file: File): Promise<string> {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) throw new Error("Choose a JPEG, PNG, or WebP image.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Please choose a photo smaller than 10 MB.");
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = imageUrl;
    await image.decode();
    const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot prepare the photo.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch (error) {
    throw error instanceof Error ? error : new Error("This photo could not be opened.");
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function PhotoImage({ person, preview }: { person: Pick<Person, "id" | "name" | "hasPhoto">; preview?: string | null }) {
  const { t } = useLanguage();
  const input = useMemo(() => ({ id: person.id }), [person.id]);
  const imageQuery = trpc.care.people.photoUrl.useQuery(input, { enabled: Boolean(person.hasPhoto && preview === undefined), staleTime: 60_000, retry: 1 });
  const src = preview === undefined ? imageQuery.data?.url : preview;
  return <div className="person-photo">{src ? <img src={src} alt={t("Photograph of {{name}}", { name: person.name })} /> : <span className="person-avatar-fallback" aria-label={person.name}>{person.name.trim().charAt(0).toUpperCase() || <UserRound size={34} />}</span>}</div>;
}

function CameraPanel({ onCapture, onClose }: { onCapture: (dataUrl: string) => void; onClose: () => void }) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t("Camera access is not available here. You can choose a photo from your device instead."));
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then((stream) => {
      if (!active) { stream.getTracks().forEach((track) => track.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; setReady(true); }
    }).catch(() => setError(t("We couldn't open the camera. Please check permission or choose a photo from your device.")));
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [t]);
  const capture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) return;
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL("image/jpeg", 0.82));
    onClose();
  };
  return <DialogFrame titleId="camera-title" onClose={onClose}><div className="section-head"><h2 id="camera-title">{t("Take a photo")}</h2><button className="icon-button" aria-label={t("Close camera")} onClick={onClose}><X /></button></div><p>{t("Your browser will ask permission to use the camera. The photo can be reviewed before saving.")}</p><div className="camera-frame"><video ref={videoRef} autoPlay muted playsInline aria-label={t("Camera preview")} /></div>{error && <p className="camera-error" role="alert">{error}</p>}<div className="modal-actions"><Button variant="outline" onClick={onClose}>{t("Cancel")}</Button><Button onClick={capture} disabled={!ready}><Camera size={17} />{t("Use this photo")}</Button></div></DialogFrame>;
}

export default function PeoplePage() {
  const { t } = useLanguage();
  const peopleQuery = trpc.care.people.list.useQuery();
  const profileQuery = trpc.care.profile.get.useQuery();
  const utils = trpc.useUtils();
  const create = trpc.care.people.create.useMutation();
  const update = trpc.care.people.update.useMutation();
  const remove = trpc.care.people.remove.useMutation();
  const people = peopleQuery.data ?? [];
  const canManage = profileQuery.data?.role !== "supported";
  const [editing, setEditing] = useState<Person | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [recognitionOpen, setRecognitionOpen] = useState(false);
  const [operationError, setOperationError] = useState("");

  const savePerson = async (data: PersonData) => {
    setOperationError("");
    try {
      if (editing) await update.mutateAsync({ id: editing.id, name: data.name, relationship: data.relationship, description: data.description, photoDataUrl: data.photoDataUrl, photoConsent: data.photoConsent, removePhoto: data.removePhoto });
      else await create.mutateAsync({ name: data.name, relationship: data.relationship, description: data.description, photoDataUrl: data.photoDataUrl, photoConsent: data.photoConsent });
      await utils.care.people.list.invalidate();
      setFormOpen(false); setEditing(null);
      toast.success(editing ? t("Person updated.") : t("Person saved."));
    } catch (error) {
      setOperationError(error instanceof Error ? t(error.message) : t("The details could not be saved. Please try again."));
      throw error;
    }
  };

  const deletePerson = (person: Person) => {
    if (!window.confirm(t("Remove {{name}} from People I Know?", { name: person.name }))) return;
    remove.mutate({ id: person.id }, { onSuccess: async () => { await utils.care.people.list.invalidate(); toast.success(t("{{name}} was removed.", { name: person.name })); }, onError: (error) => toast.error(t(error.message)) });
  };

  return <main className="page-wrap">
    <span className="page-kicker"><Users size={15} /> {t("People who matter")}</span>
    <h1 className="page-title">{t("People I Know")}</h1>
    <p className="page-subtitle">{t("A simple place for names, relationships and the little details that make someone familiar.")}</p>
    <div className="people-toolbar"><span className="demo-mode-pill"><LockKeyhole size={13} /> {t("Photos are private to your signed-in care space")}</span>{canManage && <Button onClick={() => { setEditing(null); setOperationError(""); setFormOpen(true); }}><ImagePlus size={17} />{t("Add a person")}</Button>}</div>
    {!canManage && <div className="read-only-note" style={{ marginTop: 15 }}><LockKeyhole size={17} />{t("A caregiver manages the people and photos shown here.")}</div>}
    {operationError && <p className="form-error" role="alert" style={{ marginTop: 14 }}>{operationError}</p>}
    {peopleQuery.isLoading ? <div className="empty-state" style={{ marginTop: 18 }}>{t("Loading familiar people…")}</div> : peopleQuery.error ? <div className="empty-state" style={{ marginTop: 18 }} role="alert">{t("We couldn't load these profiles.")} <button className="text-link" onClick={() => peopleQuery.refetch()}>{t("Try again")}</button></div> : people.length ? <div className="people-grid">{people.map((person) => <article className="person-card" key={person.id}>{person.isDemo && <span className="demo-tag">{t("Fictional sample")}</span>}<PhotoImage person={person} /><h3>{person.name}</h3><p className="person-role">{person.relationship}</p><p className="person-description">{person.description || t("A familiar face in your care circle.")}</p>{canManage && <div className="person-actions"><Button variant="outline" size="sm" onClick={() => { setEditing(person); setOperationError(""); setFormOpen(true); }}><Pencil size={14} />{t("Edit")}</Button><Button variant="ghost" size="sm" onClick={() => deletePerson(person)} disabled={remove.isPending}><Trash2 size={14} />{t("Remove")}</Button></div>}</article>)}</div> : <div className="empty-state" style={{ marginTop: 18 }}><Users size={27} /><strong>{t("No familiar people yet.")}</strong><span>{t("A caregiver can add a name and optional photo.")}</span>{canManage && <div style={{ marginTop: 13 }}><Button variant="outline" onClick={() => setFormOpen(true)}><ImagePlus size={16} />{t("Add someone")}</Button></div>}</div>}

    <section className="recognition-panel"><div><h2>{t("Photo recognition")}</h2><p>{t("This demonstration does not connect to a face-recognition service. You can try the capture flow, then browse the familiar-people list manually. No photo is uploaded for recognition.")}</p></div><Button variant="outline" onClick={() => setRecognitionOpen(true)}><ScanFace size={17} />{t("Try photo check")}</Button></section>

    {formOpen && canManage && <PersonForm person={editing} onClose={() => { setFormOpen(false); setEditing(null); }} onSave={savePerson} />}
    {recognitionOpen && <RecognitionModal people={people} onClose={() => setRecognitionOpen(false)} />}
  </main>;
}

function PersonForm({ person, onClose, onSave }: { person: Person | null; onClose: () => void; onSave: (data: PersonData) => Promise<void> }) {
  const { t } = useLanguage();
  const [name, setName] = useState(person?.name ?? "");
  const [relationship, setRelationship] = useState(person?.relationship ?? "");
  const [description, setDescription] = useState(person?.description ?? "");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewPerson = person ?? { id: -1, name, hasPhoto: false };

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    try { setPhotoDataUrl(await imageFileToDataUrl(file)); setRemovePhoto(false); setError(""); }
    catch (cause) { setError(cause instanceof Error ? t(cause.message) : t("This photo could not be opened.")); }
  };
  const capture = (dataUrl: string) => { setPhotoDataUrl(dataUrl); setRemovePhoto(false); setError(""); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (photoDataUrl && !consent) { setError(t("Please confirm that you have permission to use this photo and the person understands why it is stored.")); return; }
    setBusy(true);
    try { await onSave({ name: name.trim(), relationship: relationship.trim(), description: description.trim(), photoDataUrl, photoConsent: consent, removePhoto }); }
    catch (cause) { setError(cause instanceof Error ? t(cause.message) : t("The profile could not be saved. Please try again.")); }
    finally { setBusy(false); }
  };
  const showingSavedPhoto = Boolean(person?.hasPhoto && !photoDataUrl && !removePhoto);

  return <DialogFrame titleId="person-form-title" onClose={() => { if (!busy) onClose(); }}><h2 id="person-form-title">{person ? t("Edit familiar person") : t("Add someone familiar")}</h2><p>{t("Use a name and a few personal details. A photo is optional.")}</p><form onSubmit={submit}>
    <div style={{ maxWidth: 240, margin: "0 auto 16px" }}><PhotoImage person={previewPerson} preview={photoDataUrl || (removePhoto ? null : undefined)} /></div>
    {showingSavedPhoto && <p className="gentle-note" style={{ textAlign: "center" }}>{t("Current photo")}</p>}
    <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}><Button type="button" variant="outline" onClick={() => fileRef.current?.click()}><ImagePlus size={16} />{t("Choose photo")}</Button><Button type="button" variant="outline" onClick={() => setCameraOpen(true)}><Camera size={16} />{t("Use camera")}</Button>{(photoDataUrl || (person?.hasPhoto && !removePhoto)) && <Button type="button" variant="ghost" onClick={() => { setPhotoDataUrl(null); setRemovePhoto(Boolean(person?.hasPhoto)); }}><X size={16} />{t("Remove photo")}</Button>}</div>
    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} hidden aria-label={t("Choose a photo from your device")} />
    <div className="dictation-field-heading"><label className="field-label" htmlFor="person-name">{t("Full name")}</label><SpeechToTextButton fieldName="person's name" onTranscript={(text) => setName((current) => appendTranscription(current, text))} /></div><input id="person-name" className="care-input" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
    <div className="dictation-field-heading"><label className="field-label" htmlFor="person-relationship">{t("Relationship")}</label><SpeechToTextButton fieldName="relationship" onTranscript={(text) => setRelationship((current) => appendTranscription(current, text))} /></div><input id="person-relationship" className="care-input" required maxLength={80} value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder={t("For example, daughter or friend")} />
    <div className="dictation-field-heading"><label className="field-label" htmlFor="person-description">{t("A helpful detail")} <span className="optional">({t("optional")})</span></label><SpeechToTextButton fieldName="helpful detail" onTranscript={(text) => setDescription((current) => appendTranscription(current, text))} /></div><textarea id="person-description" className="care-input" maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("A favorite story, hobby or way you know one another")} />
    {(photoDataUrl || showingSavedPhoto) && <label className="photo-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>{t("I have permission to use this photo, and the person understands why it is stored. Photos are private and are not sent to a recognition service.")}</span></label>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="modal-actions"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>{t("Cancel")}</Button><Button type="submit" disabled={busy || !name.trim() || !relationship.trim()}>{busy ? t("Saving securely…") : person ? t("Save changes") : t("Save person")}</Button></div>
  </form>{cameraOpen && <CameraPanel onCapture={capture} onClose={() => setCameraOpen(false)} />}</DialogFrame>;
}

function RecognitionModal({ people, onClose }: { people: Person[]; onClose: () => void }) {
  const { t } = useLanguage();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const selectedPerson = people.find((person) => String(person.id) === selectedId);
  const chooseImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    try { setCaptured(await imageFileToDataUrl(file)); } catch (cause) { toast.error(cause instanceof Error ? t(cause.message) : t("This photo could not be opened.")); }
  };
  return <DialogFrame titleId="recognition-title" onClose={onClose}><h2 id="recognition-title">{t("Photo check")}</h2><p>{t("This is a demonstration only. No face-recognition model is connected, and this image stays on this screen.")}</p>
    {!captured ? <><div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}><Button onClick={() => setCameraOpen(true)}><Camera size={17} />{t("Take a photo")}</Button><Button variant="outline" onClick={() => fileRef.current?.click()}><ImagePlus size={17} />{t("Choose a photo")}</Button></div><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} hidden />{people.length === 0 && <div className="read-only-note" style={{ marginTop: 15 }}>{t("There are no familiar people to browse yet. A caregiver can add profiles from this page.")}</div>}</> : <>
      <img className="capture-preview" src={captured} alt={t("Photo for a manual familiar-person lookup")} />
      <div className="read-only-note" role="status" style={{ marginTop: 14 }}><ScanFace size={18} /><span>“{t("I'm not sure who this is. Would you like to ask someone for help?")}” {t("No automated match was made.")}</span></div>
      {people.length > 0 && <><label className="field-label" htmlFor="manual-person">{t("Look through familiar people manually")}</label><select id="manual-person" className="care-input" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">{t("Choose a person…")}</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name} — {person.relationship}</option>)}</select>{selectedPerson && <div className="privacy-note" style={{ marginTop: 12 }}><Check size={18} /><p>{t("You selected")} <strong>{selectedPerson.name}</strong> ({selectedPerson.relationship}) {t("manually. This is not an AI identification.")}</p></div>}</>}
      <Button variant="outline" style={{ marginTop: 12 }} onClick={() => { setCaptured(null); setSelectedId(""); }}>{t("Retake or choose another")}</Button>
    </>}
    <div className="modal-actions"><Button variant="outline" onClick={onClose}>{t("Close")}</Button></div>
  {cameraOpen && <CameraPanel onCapture={(dataUrl) => setCaptured(dataUrl)} onClose={() => setCameraOpen(false)} />}</DialogFrame>;
}

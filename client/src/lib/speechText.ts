export function appendTranscription(existing: string, transcript: string): string {
  const spoken = transcript.trim();
  if (!spoken) return existing;
  if (!existing.trim()) return spoken;
  return `${existing}${/\s$/.test(existing) ? "" : " "}${spoken}`;
}

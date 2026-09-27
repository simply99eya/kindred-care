export function dateKeyInTimezone(timezone = Intl.DateTimeFormat().resolvedOptions().timeZone, date = new Date()): string {
  let safeTimezone = timezone;
  try { new Intl.DateTimeFormat("en", { timeZone: safeTimezone }); }
  catch { safeTimezone = "UTC"; }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function shiftDateKey(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function localClock(timezone: string, date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

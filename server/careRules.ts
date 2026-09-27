export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function todayInTimezone(timezone: string, now: Date = new Date()): string {
  let safeTimezone = timezone;
  try {
    new Intl.DateTimeFormat("en", { timeZone: safeTimezone }).format(now);
  } catch {
    safeTimezone = "UTC";
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function isPastDate(dateKey: string, timezone: string, now: Date = new Date()): boolean {
  return isValidDateKey(dateKey) && dateKey < todayInTimezone(timezone, now);
}

export function canEditDate(dateKey: string, timezone: string, now: Date = new Date()): boolean {
  return isValidDateKey(dateKey) && !isPastDate(dateKey, timezone, now);
}

export function shiftDateKey(dateKey: string, days: number): string {
  if (!isValidDateKey(dateKey)) throw new Error("Invalid local date");
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export const PAST_DAY_MESSAGE = "Previous days are available for viewing only. You can plan new activities for today or a future day.";

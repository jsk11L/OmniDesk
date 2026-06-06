/** Helpers for timezone-aware do-not-disturb evaluation. */

export interface DndPrefs {
  timezone: string | null;
  dndStart: string | null; // "HH:MM"
  dndEnd: string | null; // "HH:MM"
  quietDays: number[]; // 0=Sun … 6=Sat
}

const WEEKDAY: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Minutes-since-midnight and weekday (0=Sun) for `now` in the given IANA zone. */
export function localTime(now: Date, timeZone: string | null | undefined): { minutes: number; day: number } {
  const tz = timeZone || 'UTC';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun';
  return { minutes: hour * 60 + minute, day: WEEKDAY[weekday] ?? 0 };
}

export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** True when push should be suppressed for this user at `now` (in-app still queues). */
export function isPushSuppressed(prefs: DndPrefs, now: Date): boolean {
  const { minutes, day } = localTime(now, prefs.timezone);
  if (prefs.quietDays?.includes(day)) return true;
  if (prefs.dndStart && prefs.dndEnd) {
    const start = hhmmToMinutes(prefs.dndStart);
    const end = hhmmToMinutes(prefs.dndEnd);
    if (start === end) return false;
    return start < end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
  }
  return false;
}

/** Local-date helpers (no UTC conversion — fixes the old streak/timezone bugs). */

export function todayLocal(): string {
  return toLocalDateStr(new Date());
}

export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Last n local dates, oldest first. */
export function lastNDays(n: number, from: Date = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() - (n - 1 - i));
    return toLocalDateStr(d);
  });
}

export function addDays(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return toLocalDateStr(dt);
}

export function dayLabel(dateStr: string, locale = 'it-IT'): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, { weekday: 'short' });
}

export function formatDateIt(dateStr: string | null): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Local YYYY-MM-DD + HH:MM → ISO timestamp with local offset (for reminders). */
export function localToIso(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const dt = new Date(y, m - 1, d, hh, mm);
  return dt.toISOString();
}

/** ISO timestamp → local date and HH:MM parts. */
export function isoToLocalParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return { date: toLocalDateStr(d), time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` };
}

/** Strip a trailing timezone/seconds from "HH:MM(:SS)" inputs. */
export function normalizeTime(t: string): string {
  return t.slice(0, 5);
}

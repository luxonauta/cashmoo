export function formatISODate(d: Date): string;
export function formatISODate(y: number, m: number, day: number): string;
export function formatISODate(y: number, m: number, day: number, _utc: boolean): string;
export function formatISODate(arg1: Date | number, arg2?: number, arg3?: number): string {
  if (typeof arg1 === "number") {
    const y = arg1;
    const m = typeof arg2 === "number" ? arg2 : 1;
    const d = typeof arg3 === "number" ? arg3 : 1;
    const dd = new Date(y, m - 1, d);
    const yy = dd.getFullYear();
    const mm = String(dd.getMonth() + 1).padStart(2, "0");
    const ddp = String(dd.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${ddp}`;
  }
  const dt = arg1;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(s: string): Date {
  const parts = s.split("-");
  if (parts.length !== 3) return new Date(NaN);
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function lastOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function sameOrBefore(a: Date, b: Date): boolean {
  return a.getTime() <= b.getTime();
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

export function clampDayInMonth(y: number, m: number, d: number): number {
  const dim = daysInMonth(y, m);
  if (d < 1) return 1;
  if (d > dim) return dim;
  return d;
}

export function nextFromRecurrence(
  start: Date,
  recurrence: "none" | "weekly" | "biweekly" | "monthly" | "yearly"
): Date {
  if (recurrence === "none") return start;
  if (recurrence === "weekly") return addDays(start, 7);
  if (recurrence === "biweekly") return addDays(start, 14);
  if (recurrence === "monthly") return new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
  return new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
}

export function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(s: string): Date {
  const parts = s.split("-");

  if (parts.length !== 3) return new Date(NaN);

  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);

  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
    return new Date(NaN);

  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
}

export function sameOrBefore(a: Date, b: Date): boolean {
  return a.getTime() <= b.getTime();
}

export function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function lastOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function nextFromRecurrence(
  start: Date,
  recurrence: "none" | "weekly" | "monthly" | "yearly"
): Date {
  if (recurrence === "none") return start;
  if (recurrence === "weekly") return addDays(start, 7);
  if (recurrence === "monthly")
    return new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
  return new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
}

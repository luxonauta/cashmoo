import { queryAll, queryGet, queryRun } from "./db";
import { formatISODate, parseISODate, lastOfMonth } from "./time";

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sameOrBefore(a: Date, b: Date): boolean {
  return a.getTime() <= b.getTime();
}

async function ensureUserProfile(): Promise<void> {
  const row = await queryGet<{ c: number }>(
    "SELECT COUNT(1) as c FROM user_profile"
  );
  if (!row || row.c === 0) {
    await queryRun("INSERT INTO user_profile(id,name) VALUES(1,'User')", []);
  }
}

async function findOpenInvoice(
  cardId: number,
  year: number,
  month: number
): Promise<{ id: number } | undefined> {
  const row = await queryGet<{ id: number }>(
    "SELECT id FROM invoices WHERE card_id=? AND year=? AND month=?",
    [cardId, year, month]
  );
  return row;
}

async function createInvoice(
  cardId: number,
  year: number,
  month: number
): Promise<void> {
  await queryRun(
    "INSERT INTO invoices(card_id,year,month,total,paid,paid_at) VALUES(?,?,?,?,0,NULL)",
    [cardId, year, month, 0]
  );
}

async function refreshInvoiceTotal(
  cardId: number,
  year: number,
  month: number
): Promise<void> {
  const totalRow = await queryGet<{ t: number }>(
    "SELECT IFNULL(SUM(amount),0) as t FROM expenses WHERE is_card=1 AND card_id=?",
    [cardId]
  );
  const t = totalRow ? totalRow.t : 0;
  await queryRun(
    "UPDATE invoices SET total=? WHERE card_id=? AND year=? AND month=?",
    [t, cardId, year, month]
  );
}

export async function runScheduler(): Promise<void> {
  await ensureUserProfile();
  const cards = await queryAll<{
    id: number;
    closingDay: number;
    dueDay: number;
  }>("SELECT id,closing_day as closingDay,due_day as dueDay FROM cards");
  const now = new Date();
  const periodStart = firstOfMonth(now);
  const periodEnd = lastOfMonth(now);
  for (const c of cards) {
    const exists = await findOpenInvoice(
      c.id,
      periodStart.getFullYear(),
      periodStart.getMonth() + 1
    );
    if (!exists) {
      await createInvoice(
        c.id,
        periodStart.getFullYear(),
        periodStart.getMonth() + 1
      );
    }
    if (sameOrBefore(periodStart, periodEnd)) {
      await refreshInvoiceTotal(
        c.id,
        periodStart.getFullYear(),
        periodStart.getMonth() + 1
      );
    }
  }
}

export async function runOnStartup(): Promise<void> {
  await runScheduler();
}

export async function scheduleTick(): Promise<void> {
  await runScheduler();
}

export function formatRange(
  startISO: string,
  endISO: string
): { start: string; end: string } {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  return { start: formatISODate(start), end: formatISODate(end) };
}

import { Notification } from "electron";
import { queryAll, queryRun } from "./db";
import {
  addDays,
  formatISODate,
  firstOfMonth,
  parseISODate,
  sameOrBefore
} from "./time";

export async function scheduleTick(): Promise<void> {
  await autoCloseInvoices();
  await refreshInvoiceTotals();
  await queueUpcomingNotifications();
  await autoSettleNonRecurring();
  await flushNotifications();
}

async function autoCloseInvoices(): Promise<void> {
  const cards = await queryAll<{ id: number; closing_day: number }>(
    "SELECT id, closing_day FROM cards"
  );
  const now = new Date();
  for (const c of cards) {
    const closing = new Date(now.getFullYear(), now.getMonth(), c.closing_day);
    const year = closing.getFullYear();
    const month = closing.getMonth();
    await queryRun(
      "INSERT OR IGNORE INTO invoices(card_id,year,month,closing_date,due_date,total_amount,paid) VALUES(?,?,?,?,?,0,0)",
      [
        c.id,
        year,
        month,
        formatISODate(closing),
        formatISODate(new Date(year, month, c.closing_day + 10))
      ]
    );
  }
}

async function refreshInvoiceTotals(): Promise<void> {
  const invoices = await queryAll<{
    id: number;
    card_id: number;
    year: number;
    month: number;
    closing_date: string;
  }>("SELECT id, card_id, year, month, closing_date FROM invoices");
  for (const inv of invoices) {
    const start = firstOfMonth(new Date(inv.year, inv.month, 1));
    const end = parseISODate(inv.closing_date);
    const rows = await queryAll<{ sum: number }>(
      "SELECT COALESCE(SUM(amount),0) as sum FROM expenses WHERE is_card=1 AND card_id=? AND active=1 AND next_date IS NOT NULL AND date(next_date) BETWEEN date(?) AND date(?)",
      inv.card_id,
      formatISODate(start),
      formatISODate(end)
    );
    const total = rows[0]?.sum ?? 0;
    await queryRun("UPDATE invoices SET total_amount=? WHERE id=?", [
      total,
      inv.id
    ]);
  }
}

async function queueUpcomingNotifications(): Promise<void> {
  const now = new Date();
  const limit = addDays(now, 3);
  const expenses = await queryAll<{
    id: number;
    name: string;
    next_date: string;
  }>(
    "SELECT id,name,next_date FROM expenses WHERE active=1 AND next_date IS NOT NULL AND date(next_date) BETWEEN date(?) AND date(?)",
    formatISODate(now),
    formatISODate(limit)
  );
  for (const e of expenses) {
    await queryRun(
      "INSERT INTO notifications(kind,ref_id,title,due_date,created_at,read) SELECT 'expense',?,?,?,datetime('now'),0 WHERE NOT EXISTS(SELECT 1 FROM notifications WHERE kind='expense' AND ref_id=? AND due_date=?)",
      [e.id, e.name, e.next_date, e.id, e.next_date]
    );
  }
  const invoices = await queryAll<{
    id: number;
    card_id: number;
    due_date: string;
  }>(
    "SELECT id,card_id,due_date FROM invoices WHERE paid=0 AND date(due_date) BETWEEN date(?) AND date(?)",
    formatISODate(now),
    formatISODate(limit)
  );
  for (const i of invoices) {
    await queryRun(
      "INSERT INTO notifications(kind,ref_id,title,due_date,created_at,read) SELECT 'invoice',?,?,?,datetime('now'),0 WHERE NOT EXISTS(SELECT 1 FROM notifications WHERE kind='invoice' AND ref_id=? AND due_date=?)",
      [i.id, "Card invoice", i.due_date, i.id, i.due_date]
    );
  }
}

async function autoSettleNonRecurring(): Promise<void> {
  const now = new Date();
  const rows = await queryAll<{
    id: number;
    recurrence: string;
    next_date: string | null;
    paid_at: string | null;
  }>("SELECT id,recurrence,next_date,paid_at FROM expenses WHERE active=1");
  for (const r of rows) {
    if (r.recurrence === "none" && r.next_date && !r.paid_at) {
      const due = new Date(r.next_date);
      if (sameOrBefore(due, now)) {
        await queryRun(
          "UPDATE expenses SET paid_at=datetime('now'), active=0 WHERE id=?",
          [r.id]
        );
      }
    }
  }
}

async function flushNotifications(): Promise<void> {
  const items = await queryAll<{ id: number; title: string; due_date: string }>(
    "SELECT id,title,due_date FROM notifications WHERE read=0 ORDER BY created_at DESC LIMIT 10"
  );
  for (const n of items) {
    new Notification({ title: n.title, body: "Due " + n.due_date }).show();
    await queryRun("UPDATE notifications SET read=1 WHERE id=?", [n.id]);
  }
}

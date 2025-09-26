import { ipcMain } from "electron";
import { queryAll, queryGet, queryRun } from "./db";
import { formatISODate, nextFromRecurrence, parseISODate } from "./time";

export function registerIpc(): void {
  ipcMain.handle("get-user", async () => {
    const row = await queryGet<{ id: number; name: string }>(
      "SELECT id,name FROM user_profile WHERE id=1"
    );
    return row;
  });

  ipcMain.handle("set-user-name", async (_e, name: string) => {
    await queryRun("UPDATE user_profile SET name=? WHERE id=1", [name]);
    const row = await queryGet<{ id: number; name: string }>(
      "SELECT id,name FROM user_profile WHERE id=1"
    );
    return row;
  });

  ipcMain.handle("list-incomes", async () => {
    const rows = await queryAll(
      "SELECT id,name,company,amount,recurrence,start_date as startDate,end_date as endDate,next_date as nextDate,active FROM incomes ORDER BY id DESC"
    );
    return rows;
  });

  ipcMain.handle(
    "create-income",
    async (
      _e,
      payload: {
        name: string;
        company: string | null;
        amount: number;
        recurrence: string;
        startDate: string;
        endDate: string | null;
      }
    ) => {
      const next = formatISODate(
        nextFromRecurrence(
          parseISODate(payload.startDate),
          payload.recurrence as any
        )
      );
      const res = await queryRun(
        "INSERT INTO incomes(name,company,amount,recurrence,start_date,end_date,next_date,active) VALUES(?,?,?,?,?,?,?,1)",
        [
          payload.name,
          payload.company,
          payload.amount,
          payload.recurrence,
          payload.startDate,
          payload.endDate,
          next
        ]
      );
      const row = await queryGet(
        "SELECT id,name,company,amount,recurrence,start_date as startDate,end_date as endDate,next_date as nextDate,active FROM incomes WHERE id=?",
        [res.lastID]
      );
      return row;
    }
  );

  ipcMain.handle("list-expenses", async () => {
    const rows = await queryAll(
      "SELECT id,name,description,amount,recurrence,auto_debit as autoDebit,due_day as dueDay,is_card as isCard,card_id as cardId,next_date as nextDate,active,paid_at as paidAt FROM expenses ORDER BY id DESC"
    );
    return rows;
  });

  ipcMain.handle(
    "create-expense",
    async (
      _e,
      payload: {
        name: string;
        description: string;
        amount: number;
        recurrence: string;
        autoDebit: number;
        dueDay: number;
        isCard: number;
        cardId: number | null;
        firstDueDate: string;
      }
    ) => {
      const next = payload.firstDueDate || null;
      const res = await queryRun(
        "INSERT INTO expenses(name,description,amount,recurrence,auto_debit,due_day,is_card,card_id,next_date,active) VALUES(?,?,?,?,?,?,?,?,?,1)",
        [
          payload.name,
          payload.description,
          payload.amount,
          payload.recurrence,
          payload.autoDebit,
          payload.dueDay,
          payload.isCard,
          payload.cardId,
          next
        ]
      );
      const row = await queryGet(
        "SELECT id,name,description,amount,recurrence,auto_debit as autoDebit,due_day as dueDay,is_card as isCard,card_id as cardId,next_date as nextDate,active,paid_at as paidAt FROM expenses WHERE id=?",
        [res.lastID]
      );
      return row;
    }
  );

  ipcMain.handle("list-cards", async () => {
    const rows = await queryAll(
      "SELECT id,name,closing_day as closingDay,due_day as dueDay,limit_amount as limitAmount FROM cards ORDER BY id DESC"
    );
    return rows;
  });

  ipcMain.handle(
    "create-card",
    async (
      _e,
      payload: { name: string; closingDay: number; dueDay: number; limitAmount: number }
    ) => {
      const res = await queryRun(
        "INSERT INTO cards(name,closing_day,due_day,limit_amount) VALUES(?,?,?,?)",
        [payload.name, payload.closingDay, payload.dueDay, payload.limitAmount]
      );
      const row = await queryGet(
        "SELECT id,name,closing_day as closingDay,due_day as dueDay,limit_amount as limitAmount FROM cards WHERE id=?",
        [res.lastID]
      );
      return row;
    }
  );

  ipcMain.handle("mark-expense-paid", async (_e, payload: { expenseId: number; paidAt: string }) => {
    await queryRun("UPDATE expenses SET paid_at=? WHERE id=?", [payload.paidAt, payload.expenseId]);
    const row = await queryGet(
      "SELECT id,name,description,amount,recurrence,auto_debit as autoDebit,due_day as dueDay,is_card as isCard,card_id as cardId,next_date as nextDate,active,paid_at as paidAt FROM expenses WHERE id=?",
      [payload.expenseId]
    );
    return row;
  });

  ipcMain.handle("list-invoices", async (_e, payload: { cardId?: number }) => {
    if (payload && payload.cardId) {
      const rows = await queryAll(
        "SELECT id,card_id as cardId,year,month,total,paid,paid_at as paidAt FROM invoices WHERE card_id=? ORDER BY year DESC, month DESC",
        [payload.cardId]
      );
      return rows;
    }
    const rows = await queryAll(
      "SELECT id,card_id as cardId,year,month,total,paid,paid_at as paidAt FROM invoices ORDER BY year DESC, month DESC"
    );
    return rows;
  });

  ipcMain.handle("pay-invoice", async (_e, payload: { invoiceId: number }) => {
    const paidAt = formatISODate(new Date());
    await queryRun("UPDATE invoices SET paid=1, paid_at=? WHERE id=?", [paidAt, payload.invoiceId]);
    const row = await queryGet(
      "SELECT id,card_id as cardId,year,month,total,paid,paid_at as paidAt FROM invoices WHERE id=?",
      [payload.invoiceId]
    );
    return row;
  });

  ipcMain.handle("dashboard", async () => {
    const totals = await queryGet<{ totalIncomes: number; totalExpenses: number; totalCardOpen: number }>(
      "SELECT " +
        "(SELECT IFNULL(SUM(amount),0) FROM incomes) as totalIncomes," +
        "(SELECT IFNULL(SUM(amount),0) FROM expenses) as totalExpenses," +
        "(SELECT IFNULL(SUM(total),0) FROM invoices WHERE paid=0) as totalCardOpen"
    );
    return { ...totals, balance: totals.totalIncomes - totals.totalExpenses };
  });

  ipcMain.handle("notifications", async () => {
    const rows = await queryAll(
      "SELECT id,kind,ref_id as refId,title,due_date as dueDate,created_at as createdAt,read FROM notifications ORDER BY created_at DESC"
    );
    return rows;
  });

  ipcMain.handle("clear-all", async () => {
    await queryRun("DELETE FROM notifications", []);
    await queryRun("DELETE FROM invoices", []);
    await queryRun("DELETE FROM expenses", []);
    await queryRun("DELETE FROM cards", []);
    await queryRun("DELETE FROM incomes", []);
    await queryRun("UPDATE user_profile SET name='User' WHERE id=1", []);
    return true;
  });
}

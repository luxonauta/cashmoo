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
        res.lastID
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
          payload.firstDueDate
        ]
      );
      const row = await queryGet(
        "SELECT id,name,description,amount,recurrence,auto_debit as autoDebit,due_day as dueDay,is_card as isCard,card_id as cardId,next_date as nextDate,active,paid_at as paidAt FROM expenses WHERE id=?",
        res.lastID
      );
      return row;
    }
  );

  ipcMain.handle("pay-invoice", async (_e, payload: { invoiceId: number }) => {
    await queryRun(
      "UPDATE invoices SET paid=1, paid_at=datetime('now') WHERE id=?",
      [payload.invoiceId]
    );
    const row = await queryGet(
      "SELECT id,card_id as cardId,year,month,closing_date as closingDate,due_date as dueDate,total_amount as totalAmount,paid,paid_at as paidAt FROM invoices WHERE id=?",
      payload.invoiceId
    );
    return row;
  });

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
      payload: {
        name: string;
        closingDay: number;
        dueDay: number;
        limitAmount: number;
      }
    ) => {
      const res = await queryRun(
        "INSERT INTO cards(name,closing_day,due_day,limit_amount) VALUES(?,?,?,?)",
        [payload.name, payload.closingDay, payload.dueDay, payload.limitAmount]
      );
      const row = await queryGet(
        "SELECT id,name,closing_day as closingDay,due_day as dueDay,limit_amount as limitAmount FROM cards WHERE id=?",
        res.lastID
      );
      return row;
    }
  );

  ipcMain.handle(
    "list-invoices",
    async (
      _e,
      payload: {
        cardId: number | null;
        year: number | null;
        month: number | null;
      }
    ) => {
      let sql =
        "SELECT id,card_id as cardId,year,month,closing_date as closingDate,due_date as dueDate,total_amount as totalAmount,paid,paid_at as paidAt FROM invoices WHERE 1=1";
      const args: Array<string | number> = [];
      if (payload.cardId !== null) {
        sql += " AND card_id=?";
        args.push(payload.cardId);
      }
      if (payload.year !== null) {
        sql += " AND year=?";
        args.push(payload.year);
      }
      if (payload.month !== null) {
        sql += " AND month=?";
        args.push(payload.month);
      }
      sql += " ORDER BY year DESC, month DESC";
      const rows = await queryAll(sql, ...args);
      return rows;
    }
  );

  ipcMain.handle(
    "mark-expense-paid",
    async (_e, payload: { expenseId: number; paidAt: string }) => {
      await queryRun(
        "UPDATE expenses SET paid_at=?, active=CASE WHEN recurrence='none' THEN 0 ELSE 1 END WHERE id=?",
        [payload.paidAt, payload.expenseId]
      );
      const row = await queryGet(
        "SELECT id,name,description,amount,recurrence,auto_debit as autoDebit,due_day as dueDay,is_card as isCard,card_id as cardId,next_date as nextDate,active,paid_at as paidAt FROM expenses WHERE id=?",
        payload.expenseId
      );
      return row;
    }
  );

  ipcMain.handle("dashboard", async () => {
    const incomeRows = await queryGet<{ total: number }>(
      "SELECT COALESCE(SUM(amount),0) as total FROM incomes WHERE active=1"
    );
    const expenseRows = await queryGet<{ total: number }>(
      "SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE active=1 AND is_card=0"
    );
    const cardRows = await queryGet<{ total: number }>(
      "SELECT COALESCE(SUM(total_amount),0) as total FROM invoices WHERE paid=0"
    );
    return {
      totalIncome: incomeRows.total,
      totalExpenses: expenseRows.total,
      totalCardOpen: cardRows.total,
      balance: incomeRows.total - expenseRows.total - cardRows.total
    };
  });

  ipcMain.handle("notifications", async () => {
    const rows = await queryAll(
      "SELECT id,kind,ref_id as refId,title,due_date as dueDate,created_at as createdAt,read FROM notifications ORDER BY created_at DESC LIMIT 50"
    );
    return rows;
  });
}

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

  ipcMain.handle(
    "mark-expense-paid",
    async (_e, payload: { expenseId: number; paidAt: string }) => {
      await queryRun("UPDATE expenses SET paid_at=? WHERE id=?", [
        payload.paidAt,
        payload.expenseId
      ]);
      const row = await queryGet(
        "SELECT id,name,description,amount,recurrence,auto_debit as autoDebit,due_day as dueDay,is_card as isCard,card_id as cardId,next_date as nextDate,active,paid_at as paidAt FROM expenses WHERE id=?",
        [payload.expenseId]
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
        [res.lastID]
      );
      return row;
    }
  );

  ipcMain.handle("list-invoices", async (_e, payload: { cardId?: number }) => {
    const where = payload.cardId ? "WHERE card_id=?" : "";
    const args = payload.cardId ? [payload.cardId] : [];
    const rows = await queryAll(
      `SELECT id,card_id as cardId,year,month,total_amount as total,paid,paid_at as paidAt FROM invoices ${where} ORDER BY year DESC,month DESC`,
      args
    );
    return rows;
  });

  ipcMain.handle("pay-invoice", async (_e, payload: { invoiceId: number }) => {
    const now = new Date().toISOString().slice(0, 10);
    await queryRun("UPDATE invoices SET paid=1,paid_at=? WHERE id=?", [
      now,
      payload.invoiceId
    ]);
    const row = await queryGet(
      "SELECT id,card_id as cardId,year,month,total_amount as total,paid,paid_at as paidAt FROM invoices WHERE id=?",
      [payload.invoiceId]
    );
    return row;
  });

  ipcMain.handle(
    "update-income",
    async (
      _e,
      payload: {
        id: number;
        name: string;
        company: string | null;
        amount: number;
        recurrence: string;
        endDate: string | null;
      }
    ) => {
      const startRow = await queryGet<{ start_date: string }>(
        "SELECT start_date FROM incomes WHERE id=?",
        [payload.id]
      );
      let next = null;
      if (payload.recurrence !== "none" && startRow && startRow.start_date) {
        next = formatISODate(
          nextFromRecurrence(
            parseISODate(startRow.start_date),
            payload.recurrence as any
          )
        );
      }
      await queryRun(
        "UPDATE incomes SET name=?,company=?,amount=?,recurrence=?,end_date=?,next_date=? WHERE id=?",
        [
          payload.name,
          payload.company,
          payload.amount,
          payload.recurrence,
          payload.endDate,
          next,
          payload.id
        ]
      );
      const row = await queryGet(
        "SELECT id,name,company,amount,recurrence,start_date as startDate,end_date as endDate,next_date as nextDate,active FROM incomes WHERE id=?",
        [payload.id]
      );
      return row;
    }
  );

  ipcMain.handle("delete-income", async (_e, payload: { id: number }) => {
    await queryRun(
      "DELETE FROM notifications WHERE kind='income' AND ref_id=?",
      [payload.id]
    );
    await queryRun("DELETE FROM incomes WHERE id=?", [payload.id]);
    return true;
  });

  ipcMain.handle(
    "update-expense",
    async (
      _e,
      payload: {
        id: number;
        name: string;
        description: string;
        amount: number;
        recurrence: string;
        autoDebit: number;
        dueDay: number;
        isCard: number;
        cardId: number | null;
        firstDueDate?: string | null;
      }
    ) => {
      const next = payload.firstDueDate || null;
      await queryRun(
        "UPDATE expenses SET name=?,description=?,amount=?,recurrence=?,auto_debit=?,due_day=?,is_card=?,card_id=?,next_date=? WHERE id=?",
        [
          payload.name,
          payload.description,
          payload.amount,
          payload.recurrence,
          payload.autoDebit,
          payload.dueDay,
          payload.isCard,
          payload.cardId,
          next,
          payload.id
        ]
      );
      const row = await queryGet(
        "SELECT id,name,description,amount,recurrence,auto_debit as autoDebit,due_day as dueDay,is_card as isCard,card_id as cardId,next_date as nextDate,active,paid_at as paidAt FROM expenses WHERE id=?",
        [payload.id]
      );
      return row;
    }
  );

  ipcMain.handle("delete-expense", async (_e, payload: { id: number }) => {
    await queryRun(
      "DELETE FROM notifications WHERE kind='expense' AND ref_id=?",
      [payload.id]
    );
    await queryRun("DELETE FROM expenses WHERE id=?", [payload.id]);
    return true;
  });

  ipcMain.handle(
    "update-card",
    async (
      _e,
      payload: {
        id: number;
        name: string;
        closingDay: number;
        dueDay: number;
        limitAmount: number;
      }
    ) => {
      await queryRun(
        "UPDATE cards SET name=?,closing_day=?,due_day=?,limit_amount=? WHERE id=?",
        [
          payload.name,
          payload.closingDay,
          payload.dueDay,
          payload.limitAmount,
          payload.id
        ]
      );
      const row = await queryGet(
        "SELECT id,name,closing_day as closingDay,due_day as dueDay,limit_amount as limitAmount FROM cards WHERE id=?",
        [payload.id]
      );
      return row;
    }
  );

  ipcMain.handle("delete-card", async (_e, payload: { id: number }) => {
    const invIds = await queryAll<{ id: number }>(
      "SELECT id FROM invoices WHERE card_id=?",
      [payload.id]
    );
    for (const inv of invIds) {
      await queryRun(
        "DELETE FROM notifications WHERE kind='invoice' AND ref_id=?",
        [inv.id]
      );
    }
    await queryRun("DELETE FROM invoices WHERE card_id=?", [payload.id]);
    await queryRun(
      "UPDATE expenses SET is_card=0, card_id=NULL WHERE card_id=?",
      [payload.id]
    );
    await queryRun("DELETE FROM cards WHERE id=?", [payload.id]);
    return true;
  });

  ipcMain.handle("dashboard", async () => {
    const totalIncomes = await queryGet<{ total: number }>(
      "SELECT IFNULL(SUM(amount),0) as total FROM incomes WHERE active=1"
    );
    const totalExpenses = await queryGet<{ total: number }>(
      "SELECT IFNULL(SUM(amount),0) as total FROM expenses WHERE active=1"
    );
    const totalCardOpen = await queryGet<{ total: number }>(
      "SELECT IFNULL(SUM(total_amount),0) as total FROM invoices WHERE paid=0"
    );
    const balance =
      (totalIncomes?.total || 0) -
      (totalExpenses?.total || 0) -
      (totalCardOpen?.total || 0);
    return {
      totalIncomes: totalIncomes?.total || 0,
      totalExpenses: totalExpenses?.total || 0,
      totalCardOpen: totalCardOpen?.total || 0,
      balance
    };
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

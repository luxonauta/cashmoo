import { useEffect, useState } from "react";
import GreetingBanner from "../components/greeting-banner";
import {
  apiCreateExpense,
  apiListCards,
  apiListExpenses,
  apiMarkExpensePaid,
  apiUpdateExpense,
  apiDeleteExpense
} from "../api";
import { CardRow, ExpenseRow, Recurrence } from "../types";

export default function ExpensesView({
  onFirstCreated
}: {
  onFirstCreated?: () => void;
}): JSX.Element {
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [autoDebit, setAutoDebit] = useState<boolean>(false);
  const [dueDay, setDueDay] = useState<string>("1");
  const [isCard, setIsCard] = useState<boolean>(false);
  const [cardId, setCardId] = useState<string>("");
  const [firstDueDate, setFirstDueDate] = useState<string>("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [eName, setEName] = useState<string>("");
  const [eDescription, setEDescription] = useState<string>("");
  const [eAmount, setEAmount] = useState<string>("");
  const [eRecurrence, setERecurrence] = useState<Recurrence>("none");
  const [eAutoDebit, setEAutoDebit] = useState<boolean>(false);
  const [eDueDay, setEDueDay] = useState<string>("1");
  const [eIsCard, setEIsCard] = useState<boolean>(false);
  const [eCardId, setECardId] = useState<string>("");
  const [eFirstDueDate, setEFirstDueDate] = useState<string>("");

  useEffect(() => {
    apiListExpenses().then(setRows);
    apiListCards().then(setCards);
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const payload = {
      name,
      description: description || "",
      amount: Number(amount),
      recurrence,
      autoDebit: autoDebit ? 1 : 0,
      dueDay: Number(dueDay),
      isCard: isCard ? 1 : 0,
      cardId: isCard && cardId ? Number(cardId) : null,
      firstDueDate: firstDueDate || ""
    };
    apiCreateExpense(payload).then((row) => {
      const before = rows.length;
      setRows([row, ...rows]);
      if (before === 0 && onFirstCreated) onFirstCreated();
      setName("");
      setDescription("");
      setAmount("");
      setRecurrence("none");
      setAutoDebit(false);
      setDueDay("1");
      setIsCard(false);
      setCardId("");
      setFirstDueDate("");
    });
  }

  function onEditStart(row: ExpenseRow): void {
    setEditingId(row.id);
    setEName(row.name);
    setEDescription(
      (row as unknown as { description?: string }).description || ""
    );
    setEAmount(String(row.amount));
    setERecurrence(row.recurrence as Recurrence);
    setEAutoDebit(
      Number((row as unknown as { autoDebit?: number }).autoDebit) === 1
    );
    setEDueDay(String((row as unknown as { dueDay?: number }).dueDay || "1"));
    setEIsCard(Number((row as unknown as { isCard?: number }).isCard) === 1);
    setECardId(
      ((row as unknown as { cardId?: number | null }).cardId ??
        "") as unknown as string
    );
    setEFirstDueDate(
      ((row as unknown as { firstDueDate?: string }).firstDueDate ||
        "") as string
    );
  }

  function onEditSave(id: number): void {
    apiUpdateExpense({
      id,
      name: eName,
      description: eDescription || "",
      amount: Number(eAmount),
      recurrence: eRecurrence,
      autoDebit: eAutoDebit ? 1 : 0,
      dueDay: Number(eDueDay),
      isCard: eIsCard ? 1 : 0,
      cardId: eIsCard && eCardId ? Number(eCardId) : null,
      firstDueDate: eFirstDueDate || ""
    }).then((row) => {
      setRows(rows.map((r) => (r.id === id ? row : r)));
      setEditingId(null);
    });
  }

  function onDelete(id: number): void {
    apiDeleteExpense(id).then(() => {
      setRows(rows.filter((r) => r.id !== id));
    });
  }

  function onPay(id: number): void {
    apiMarkExpensePaid({
      expenseId: id,
      paidAt: new Date().toISOString()
    }).then((row) => {
      setRows(rows.map((r) => (r.id === id ? row : r)));
    });
  }

  return (
    <section>
      <GreetingBanner page="expenses" />
      <h2>Expenses</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="ename">Name</label>
        <input
          id="ename"
          placeholder="e.g., Groceries"
          title="Expense name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label htmlFor="edesc">Description</label>
        <input
          id="edesc"
          placeholder="Optional description"
          title="Additional context"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label htmlFor="eamount">Amount</label>
        <input
          id="eamount"
          inputMode="decimal"
          placeholder="e.g., 250.00"
          title="Expense amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />

        <label htmlFor="erecurrence">Recurrence</label>
        <select
          id="erecurrence"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as Recurrence)}
          title="How often does this expense repeat?"
        >
          <option value="none">single payment</option>
          <option value="weekly">weekly</option>
          <option value="biweekly">biweekly</option>
          <option value="monthly">monthly</option>
          <option value="yearly">yearly</option>
        </select>

        <label htmlFor="edueday">Due day</label>
        <input
          id="edueday"
          inputMode="numeric"
          placeholder="1 to 31"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
        />

        <label htmlFor="eiscard">Is card</label>
        <input
          id="eiscard"
          type="checkbox"
          checked={isCard}
          onChange={(e) => setIsCard(e.target.checked)}
        />

        <label htmlFor="ecard">Card</label>
        <select
          id="ecard"
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          title="Which card will be charged?"
          disabled={!isCard}
        >
          <option value="">select a card</option>
          {cards.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>

        <label htmlFor="edue">First due date</label>
        <input
          id="edue"
          placeholder="YYYY-MM-DD"
          title="Due date"
          value={firstDueDate}
          onChange={(e) => setFirstDueDate(e.target.value)}
        />

        <label htmlFor="eautodebit">Auto debit</label>
        <input
          id="eautodebit"
          type="checkbox"
          checked={autoDebit}
          onChange={(e) => setAutoDebit(e.target.checked)}
        />

        <button type="submit" title="Add a new expense">
          Create expense
        </button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Amount</th>
            <th>Recurrence</th>
            <th>Auto debit</th>
            <th>Due day</th>
            <th>Card</th>
            <th>Paid at</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                {editingId === r.id ? (
                  <input
                    value={eName}
                    onChange={(e) => setEName(e.target.value)}
                  />
                ) : (
                  r.name
                )}
              </td>
              <td>
                {editingId === r.id ? (
                  <input
                    inputMode="decimal"
                    value={eAmount}
                    onChange={(e) => setEAmount(e.target.value)}
                  />
                ) : (
                  r.amount
                )}
              </td>
              <td>
                {editingId === r.id ? (
                  <select
                    value={eRecurrence}
                    onChange={(e) =>
                      setERecurrence(e.target.value as Recurrence)
                    }
                  >
                    <option value="none">single payment</option>
                    <option value="weekly">weekly</option>
                    <option value="biweekly">biweekly</option>
                    <option value="monthly">monthly</option>
                    <option value="yearly">yearly</option>
                  </select>
                ) : (
                  r.recurrence
                )}
              </td>
              <td>
                {Number((r as unknown as { autoDebit?: number }).autoDebit) ===
                1
                  ? "yes"
                  : "no"}
              </td>
              <td>{(r as unknown as { dueDay?: number }).dueDay ?? "-"}</td>
              <td>
                {(r as unknown as { cardId?: number | null }).cardId ?? "-"}
              </td>
              <td>
                {(r as unknown as { paidAt?: string | null }).paidAt || "-"}
              </td>
              <td>
                {editingId === r.id ? (
                  <>
                    <button
                      onClick={() => onEditSave(r.id)}
                      title="Save changes"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      title="Cancel editing"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {(r as unknown as { paidAt?: string | null }).paidAt ? (
                      <span>paid</span>
                    ) : (
                      <button
                        onClick={() => onPay(r.id)}
                        title="Mark this expense as paid"
                      >
                        Mark paid
                      </button>
                    )}
                    <button onClick={() => onEditStart(r)} title="Edit">
                      ✏️
                    </button>
                    <button onClick={() => onDelete(r.id)} title="Delete">
                      🗑️
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

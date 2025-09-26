import { useEffect, useState } from "react";
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
      description,
      amount: Number(amount),
      recurrence,
      autoDebit: autoDebit ? 1 : 0,
      dueDay: Number(dueDay),
      isCard: isCard ? 1 : 0,
      cardId: cardId ? Number(cardId) : null,
      firstDueDate: firstDueDate
    };
    apiCreateExpense(payload).then((row) => {
      const before = rows.length;
      setRows([row, ...rows]);
      if (before === 0 && onFirstCreated) onFirstCreated();
    });
  }

  function onPay(id: number): void {
    apiMarkExpensePaid({
      expenseId: id,
      paidAt: new Date().toISOString().slice(0, 10)
    }).then((row) => {
      setRows(rows.map((r) => (r.id === row.id ? row : r)));
    });
  }

  function onEditStart(row: ExpenseRow): void {
    setEditingId(row.id);
    setEName(row.name);
    setEDescription(row.description);
    setEAmount(String(row.amount));
    setERecurrence(row.recurrence);
    setEAutoDebit(Boolean(row.autoDebit));
    setEDueDay(String(row.dueDay));
    setEIsCard(Boolean(row.isCard));
    setECardId(row.cardId ? String(row.cardId) : "");
    setEFirstDueDate(row.nextDate || "");
  }

  function onEditSave(id: number): void {
    apiUpdateExpense({
      id,
      name: eName,
      description: eDescription,
      amount: Number(eAmount),
      recurrence: eRecurrence,
      autoDebit: eAutoDebit ? 1 : 0,
      dueDay: Number(eDueDay),
      isCard: eIsCard ? 1 : 0,
      cardId: eCardId ? Number(eCardId) : null,
      firstDueDate: eFirstDueDate || null
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

  function onEditCancel(): void {
    setEditingId(null);
  }

  return (
    <section>
      <h2>Expenses</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="ename">Name</label>
        <input
          id="ename"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label htmlFor="edesc">Description</label>
        <input
          id="edesc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label htmlFor="eamount">Amount</label>
        <input
          id="eamount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          step="0.01"
        />

        <label htmlFor="erec">Recurrence</label>
        <select
          id="erec"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as Recurrence)}
        >
          <option value="none">non recurring</option>
          <option value="weekly">weekly</option>
          <option value="monthly">monthly</option>
          <option value="yearly">yearly</option>
        </select>

        <label htmlFor="edue">Due day</label>
        <input
          id="edue"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
          type="number"
        />

        <label htmlFor="eautodebit">Auto debit</label>
        <input
          id="eautodebit"
          checked={autoDebit}
          onChange={(e) => setAutoDebit(e.target.checked)}
          type="checkbox"
        />

        <label htmlFor="eiscard">Is card</label>
        <input
          id="eiscard"
          checked={isCard}
          onChange={(e) => setIsCard(e.target.checked)}
          type="checkbox"
        />

        <label htmlFor="ecard">Card</label>
        <select
          id="ecard"
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          disabled={!isCard}
        >
          <option value="">none</option>
          {cards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label htmlFor="efirstdue">First due</label>
        <input
          id="efirstdue"
          value={firstDueDate}
          onChange={(e) => setFirstDueDate(e.target.value)}
          type="date"
        />

        <button type="submit">Add</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Recurrence</th>
            <th>Next</th>
            <th>Paid</th>
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
                    value={eDescription}
                    onChange={(e) => setEDescription(e.target.value)}
                  />
                ) : (
                  r.description
                )}
              </td>
              <td>
                {editingId === r.id ? (
                  <input
                    value={eAmount}
                    onChange={(e) => setEAmount(e.target.value)}
                    type="number"
                    step="0.01"
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
                    <option value="none">non recurring</option>
                    <option value="weekly">weekly</option>
                    <option value="monthly">monthly</option>
                    <option value="yearly">yearly</option>
                  </select>
                ) : (
                  r.recurrence
                )}
              </td>
              <td>
                {editingId === r.id ? (
                  <input
                    value={eFirstDueDate}
                    onChange={(e) => setEFirstDueDate(e.target.value)}
                    type="date"
                  />
                ) : (
                  r.nextDate
                )}
              </td>
              <td>{r.paidAt ? "yes" : "no"}</td>
              <td>
                {editingId === r.id ? (
                  <>
                    <button onClick={() => onEditSave(r.id)}>Save</button>
                    <button onClick={onEditCancel}>Cancel</button>
                  </>
                ) : (
                  <>
                    {!r.paidAt && (
                      <button onClick={() => onPay(r.id)}>Mark paid</button>
                    )}
                    <button onClick={() => onEditStart(r)}>✏️</button>
                    <button onClick={() => onDelete(r.id)}>🗑️</button>
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

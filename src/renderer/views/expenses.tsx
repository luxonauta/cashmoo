import { useEffect, useState } from "react";
import {
  apiCreateExpense,
  apiListCards,
  apiListExpenses,
  apiMarkExpensePaid
} from "../api";
import { CardRow, ExpenseRow, Recurrence } from "../types";

export default function ExpensesView({ onFirstCreated }: { onFirstCreated?: () => void }): JSX.Element {
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
      cardId: isCard && cardId ? Number(cardId) : null,
      firstDueDate
    };
    apiCreateExpense(payload).then((row) => { const before = rows.length; setRows([row, ...rows]); if (before === 0 && onFirstCreated) onFirstCreated(); });
  }

  function onPay(expenseId: number): void {
    const paidAt = new Date().toISOString().slice(0, 10);
    apiMarkExpensePaid(expenseId, paidAt).then((row) => {
      setRows(rows.map((r) => (r.id === row.id ? row : r)));
    });
  }

  return (
    <section>
      <h2>Expenses</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="ename">Name</label>
        <input id="ename" value={name} onChange={(e) => setName(e.target.value)} />

        <label htmlFor="edesc">Description</label>
        <input id="edesc" value={description} onChange={(e) => setDescription(e.target.value)} />

        <label htmlFor="eamount">Amount</label>
        <input id="eamount" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" />

        <label htmlFor="erec">Recurrence</label>
        <select id="erec" value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
          <option value="none">non recurring</option>
          <option value="weekly">weekly</option>
          <option value="monthly">monthly</option>
          <option value="yearly">yearly</option>
        </select>

        <label htmlFor="edue">Due day</label>
        <input id="edue" value={dueDay} onChange={(e) => setDueDay(e.target.value)} type="number" />

        <label htmlFor="eautodebit">Auto debit</label>
        <input id="eautodebit" checked={autoDebit} onChange={(e) => setAutoDebit(e.target.checked)} type="checkbox" />

        <label htmlFor="eiscard">Is card</label>
        <input id="eiscard" checked={isCard} onChange={(e) => setIsCard(e.target.checked)} type="checkbox" />

        <label htmlFor="ecard">Card</label>
        <select id="ecard" value={cardId} onChange={(e) => setCardId(e.target.value)} disabled={!isCard}>
          <option value="">select</option>
          {cards.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <label htmlFor="efirstdate">First due date</label>
        <input id="efirstdate" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} type="date" />

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
              <td>{r.name}</td>
              <td>{r.description}</td>
              <td>{r.amount}</td>
              <td>{r.recurrence}</td>
              <td>{r.nextDate}</td>
              <td>{r.paidAt ? "yes" : "no"}</td>
              <td>
                {!r.paidAt && <button onClick={() => onPay(r.id)}>Mark paid</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

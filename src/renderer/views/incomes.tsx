import { useEffect, useState } from "react";
import {
  apiCreateIncome,
  apiListIncomes,
  apiUpdateIncome,
  apiDeleteIncome
} from "../api";
import { IncomeRow, Recurrence } from "../types";

export default function IncomesView({
  onFirstCreated
}: {
  onFirstCreated?: () => void;
}): JSX.Element {
  const [rows, setRows] = useState<IncomeRow[]>([]);
  const [name, setName] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [eName, setEName] = useState<string>("");
  const [eCompany, setECompany] = useState<string>("");
  const [eAmount, setEAmount] = useState<string>("");
  const [eRecurrence, setERecurrence] = useState<Recurrence>("none");
  const [eEndDate, setEEndDate] = useState<string>("");

  useEffect(() => {
    apiListIncomes().then(setRows);
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const start = startDate
      ? `${startDate}-01-01`
      : new Date().toISOString().slice(0, 10);
    const payload = {
      name,
      company: company ? company : null,
      amount: Number(amount),
      recurrence,
      startDate: start,
      endDate: endDate ? endDate : null
    };
    apiCreateIncome(payload).then((row) => {
      const before = rows.length;
      setRows([row, ...rows]);
      if (before === 0 && onFirstCreated) onFirstCreated();
    });
  }

  function onEditStart(row: IncomeRow): void {
    setEditingId(row.id);
    setEName(row.name);
    setECompany(row.company || "");
    setEAmount(String(row.amount));
    setERecurrence(row.recurrence);
    setEEndDate(row.endDate || "");
  }

  function onEditSave(id: number): void {
    apiUpdateIncome({
      id,
      name: eName,
      company: eCompany ? eCompany : null,
      amount: Number(eAmount),
      recurrence: eRecurrence,
      endDate: eEndDate ? eEndDate : null
    }).then((row) => {
      setRows(rows.map((r) => (r.id === id ? row : r)));
      setEditingId(null);
    });
  }

  function onDelete(id: number): void {
    apiDeleteIncome(id).then(() => {
      setRows(rows.filter((r) => r.id !== id));
    });
  }

  function onEditCancel(): void {
    setEditingId(null);
  }

  return (
    <section>
      <h2>Incomes</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="iname">Name</label>
        <input
          id="iname"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label htmlFor="icompany">Company</label>
        <input
          id="icompany"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />

        <label htmlFor="iamount">Amount</label>
        <input
          id="iamount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          step="0.01"
        />

        <label htmlFor="irec">Recurrence</label>
        <select
          id="irec"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as Recurrence)}
        >
          <option value="none">single payment</option>
          <option value="weekly">weekly</option>
          <option value="biweekly">biweekly</option>
          <option value="monthly">monthly</option>
          <option value="yearly">yearly</option>
        </select>

        <label htmlFor="istart">Start year</label>
        <input
          id="istart"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          type="number"
          min="1900"
          max="2100"
        />

        <label htmlFor="iend">End date</label>
        <input
          id="iend"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          type="date"
        />

        <button type="submit">Add</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Company</th>
            <th>Amount</th>
            <th>Recurrence</th>
            <th>Next</th>
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
                    value={eCompany}
                    onChange={(e) => setECompany(e.target.value)}
                  />
                ) : (
                  r.company
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
              <td>{r.nextDate}</td>
              <td>
                {editingId === r.id ? (
                  <>
                    <button onClick={() => onEditSave(r.id)}>Save</button>
                    <button onClick={onEditCancel}>Cancel</button>
                  </>
                ) : (
                  <>
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

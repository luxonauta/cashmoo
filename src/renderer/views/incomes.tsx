import { useEffect, useState } from "react";
import { apiCreateIncome, apiListIncomes } from "../api";
import { IncomeRow, Recurrence } from "../types";

export default function IncomesView({ onFirstCreated }: { onFirstCreated?: () => void }): JSX.Element {
  const [rows, setRows] = useState<IncomeRow[]>([]);
  const [name, setName] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    apiListIncomes().then(setRows);
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const start = startDate ? `${startDate}-01-01` : new Date().toISOString().slice(0, 10);
    const payload = {
      name,
      company: company ? company : null,
      amount: Number(amount),
      recurrence,
      startDate: start,
      endDate: endDate ? endDate : null
    };
    apiCreateIncome(payload).then((row) => { const before = rows.length; setRows([row, ...rows]); if (before === 0 && onFirstCreated) onFirstCreated(); });
  }

  return (
    <section>
      <h2>Incomes</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="iname">Name</label>
        <input id="iname" value={name} onChange={(e) => setName(e.target.value)} />

        <label htmlFor="icompany">Company</label>
        <input id="icompany" value={company} onChange={(e) => setCompany(e.target.value)} />

        <label htmlFor="iamount">Amount</label>
        <input id="iamount" value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" />

        <label htmlFor="irec">Recurrence</label>
        <select id="irec" value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
          <option value="none">single payment</option>
          <option value="weekly">weekly</option>
          <option value="biweekly">biweekly</option>
          <option value="monthly">monthly</option>
          <option value="yearly">yearly</option>
        </select>

        <label htmlFor="istart">Start year</label>
        <input id="istart" value={startDate} onChange={(e) => setStartDate(e.target.value)} type="number" min="1900" max="2100" />

        <label htmlFor="iend">End date</label>
        <input id="iend" value={endDate} onChange={(e) => setEndDate(e.target.value)} type="date" />

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
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.company}</td>
              <td>{r.amount}</td>
              <td>{r.recurrence}</td>
              <td>{r.nextDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

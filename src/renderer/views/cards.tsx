import { useEffect, useState } from "react";
import { apiCreateCard, apiListCards } from "../api";
import { CardRow } from "../types";

export default function CardsView({ onFirstCreated }: { onFirstCreated?: () => void }): JSX.Element {
  const [rows, setRows] = useState<CardRow[]>([]);
  const [name, setName] = useState<string>("");
  const [closingDay, setClosingDay] = useState<string>("1");
  const [dueDay, setDueDay] = useState<string>("");
  const [limitAmount, setLimitAmount] = useState<string>("0");

  useEffect(() => {
    apiListCards().then(setRows);
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const computedDue = dueDay.trim().length ? Number(dueDay) : Math.max(1, Math.min(31, (Number(closingDay) + 10) > 31 ? (Number(closingDay) + 10 - 31) : (Number(closingDay) + 10)));
    apiCreateCard({
      name,
      closingDay: Number(closingDay),
      dueDay: Number(computedDue),
      limitAmount: Number(limitAmount)
    }).then((row) => { const before = rows.length; setRows([row, ...rows]); if (before === 0 && onFirstCreated) onFirstCreated(); });
  }

  return (
    <section>
      <h2>Cards</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="cname">Name</label>
        <input id="cname" value={name} onChange={(e) => setName(e.target.value)} />

        <label htmlFor="cclosing">Closing day</label>
        <input id="cclosing" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} type="number" />

        <label htmlFor="cdue">Due day</label>
        <input id="cdue" value={dueDay} onChange={(e) => setDueDay(e.target.value)} type="number" />

        <label htmlFor="climit">Limit</label>
        <input id="climit" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} type="number" step="0.01" />

        <button type="submit">Add</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Closing</th>
            <th>Due</th>
            <th>Limit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.closingDay}</td>
              <td>{r.dueDay}</td>
              <td>{r.limitAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

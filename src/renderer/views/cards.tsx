import { useEffect, useState } from "react";
import {
  apiCreateCard,
  apiListCards,
  apiUpdateCard,
  apiDeleteCard
} from "../api";
import { CardRow } from "../types";

export default function CardsView({
  onFirstCreated
}: {
  onFirstCreated?: () => void;
}): JSX.Element {
  const [rows, setRows] = useState<CardRow[]>([]);
  const [name, setName] = useState<string>("");
  const [closingDay, setClosingDay] = useState<string>("1");
  const [dueDay, setDueDay] = useState<string>("");
  const [limitAmount, setLimitAmount] = useState<string>("0");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [eName, setEName] = useState<string>("");
  const [eClosingDay, setEClosingDay] = useState<string>("1");
  const [eDueDay, setEDueDay] = useState<string>("1");
  const [eLimitAmount, setELimitAmount] = useState<string>("0");

  useEffect(() => {
    apiListCards().then(setRows);
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const computedDue = dueDay.trim().length
      ? Number(dueDay)
      : Number(closingDay) + 10 > 31
        ? Number(closingDay) + 10 - 31
        : Number(closingDay) + 10;
    apiCreateCard({
      name,
      closingDay: Number(closingDay),
      dueDay: Number(computedDue),
      limitAmount: Number(limitAmount)
    }).then((row) => {
      const before = rows.length;
      setRows([row, ...rows]);
      if (before === 0 && onFirstCreated) onFirstCreated();
    });
  }

  function onEditStart(row: CardRow): void {
    setEditingId(row.id);
    setEName(row.name);
    setEClosingDay(String(row.closingDay));
    setEDueDay(String(row.dueDay));
    setELimitAmount(String(row.limitAmount));
  }

  function onEditSave(id: number): void {
    apiUpdateCard({
      id,
      name: eName,
      closingDay: Number(eClosingDay),
      dueDay: Number(eDueDay),
      limitAmount: Number(eLimitAmount)
    }).then((row) => {
      setRows(rows.map((r) => (r.id === id ? row : r)));
      setEditingId(null);
    });
  }

  function onDelete(id: number): void {
    apiDeleteCard(id).then(() => {
      setRows(rows.filter((r) => r.id !== id));
    });
  }

  function onEditCancel(): void {
    setEditingId(null);
  }

  return (
    <section>
      <h2>Cards</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="cname">Name</label>
        <input
          id="cname"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label htmlFor="cclosing">Closing day</label>
        <input
          id="cclosing"
          value={closingDay}
          onChange={(e) => setClosingDay(e.target.value)}
          type="number"
        />

        <label htmlFor="cdue">Due day</label>
        <input
          id="cdue"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
          type="number"
        />

        <label htmlFor="climit">Limit</label>
        <input
          id="climit"
          value={limitAmount}
          onChange={(e) => setLimitAmount(e.target.value)}
          type="number"
          step="0.01"
        />

        <button type="submit">Add</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Closing</th>
            <th>Due</th>
            <th>Limit</th>
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
                    value={eClosingDay}
                    onChange={(e) => setEClosingDay(e.target.value)}
                    type="number"
                  />
                ) : (
                  r.closingDay
                )}
              </td>
              <td>
                {editingId === r.id ? (
                  <input
                    value={eDueDay}
                    onChange={(e) => setEDueDay(e.target.value)}
                    type="number"
                  />
                ) : (
                  r.dueDay
                )}
              </td>
              <td>
                {editingId === r.id ? (
                  <input
                    value={eLimitAmount}
                    onChange={(e) => setELimitAmount(e.target.value)}
                    type="number"
                    step="0.01"
                  />
                ) : (
                  r.limitAmount
                )}
              </td>
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

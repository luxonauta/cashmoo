import { useEffect, useState } from "react";
import GreetingBanner from "../components/greeting-banner";
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
  const [dueDay, setDueDay] = useState<string>("1");
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
      setName("");
      setClosingDay("1");
      setDueDay("1");
      setLimitAmount("0");
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

  return (
    <section>
      <GreetingBanner page="cards" />
      <h2>Cards</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="cname">Name</label>
        <input
          id="cname"
          placeholder="e.g., Visa Gold"
          title="Card label"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label htmlFor="cclosing">Closing day</label>
        <input
          id="cclosing"
          inputMode="numeric"
          placeholder="1 to 31"
          value={closingDay}
          onChange={(e) => setClosingDay(e.target.value)}
        />

        <label htmlFor="cdue">Due day</label>
        <input
          id="cdue"
          inputMode="numeric"
          placeholder="auto if blank"
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
        />

        <label htmlFor="climit">Limit amount</label>
        <input
          id="climit"
          inputMode="decimal"
          placeholder="e.g., 5000"
          title="Credit limit"
          value={limitAmount}
          onChange={(e) => setLimitAmount(e.target.value)}
          required
        />

        <button type="submit" title="Add a new card">
          Create card
        </button>
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
                    inputMode="numeric"
                    value={eClosingDay}
                    onChange={(e) => setEClosingDay(e.target.value)}
                  />
                ) : (
                  r.closingDay
                )}
              </td>
              <td>
                {editingId === r.id ? (
                  <input
                    inputMode="numeric"
                    value={eDueDay}
                    onChange={(e) => setEDueDay(e.target.value)}
                  />
                ) : (
                  r.dueDay
                )}
              </td>
              <td>
                {editingId === r.id ? (
                  <input
                    inputMode="decimal"
                    value={eLimitAmount}
                    onChange={(e) => setELimitAmount(e.target.value)}
                  />
                ) : (
                  r.limitAmount
                )}
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

import { useEffect, useState } from "react";
import { apiListCards, apiListInvoices, apiPayInvoice } from "../api";
import { CardRow, InvoiceRow } from "../types";

export default function InvoicesView(): JSX.Element {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [cardId, setCardId] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  useEffect(() => {
    apiListCards().then(setCards);
    load();
  }, []);
  function load(): void {
    apiListInvoices({
      cardId: cardId ? Number(cardId) : null,
      year: year ? Number(year) : null,
      month: month ? Number(month) : null
    }).then(setRows);
  }
  function onFilter(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    load();
  }
  function onPay(id: number): void {
    apiPayInvoice(id).then((row) => {
      setRows(rows.map((r) => (r.id === row.id ? row : r)));
    });
  }
  return (
    <section>
      <h2>Invoices</h2>
      <form onSubmit={onFilter}>
        <label htmlFor="icard">Card</label>
        <select
          id="icard"
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
        >
          <option value="">all</option>
          {cards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label htmlFor="iyear">Year</label>
        <input
          id="iyear"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          type="number"
        />
        <label htmlFor="imonth">Month</label>
        <input
          id="imonth"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          type="number"
        />
        <button type="submit">Apply</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>Card</th>
            <th>Year</th>
            <th>Month</th>
            <th>Closing</th>
            <th>Due</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.cardId}</td>
              <td>{r.year}</td>
              <td>{r.month}</td>
              <td>{r.closingDate}</td>
              <td>{r.dueDate}</td>
              <td>{r.totalAmount}</td>
              <td>{r.paid ? "yes" : "no"}</td>
              <td>
                <button onClick={() => onPay(r.id)} disabled={!!r.paid}>
                  Pay
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

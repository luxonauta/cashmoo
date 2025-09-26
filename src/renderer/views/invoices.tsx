import { useEffect, useState } from "react";
import { apiListCards, apiListInvoices, apiPayInvoice } from "../api";
import { CardRow, InvoiceRow } from "../types";

export default function InvoicesView(): JSX.Element {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [cardId, setCardId] = useState<string>("");

  useEffect(() => {
    apiListCards().then(setCards);
  }, []);

  useEffect(() => {
    apiListInvoices(cardId ? Number(cardId) : undefined).then(setInvoices);
  }, [cardId]);

  function onPay(id: number): void {
    apiPayInvoice(id).then((row: InvoiceRow) => {
      setInvoices(invoices.map((r) => (r.id === row.id ? row : r)));
    });
  }

  return (
    <section>
      <h2>Invoices</h2>

      <form>
        <label htmlFor="card">Card</label>
        <select id="card" value={cardId} onChange={(e) => setCardId(e.target.value)}>
          <option value="">all</option>
          {cards.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
      </form>

      <table>
        <thead>
          <tr>
            <th>Card</th>
            <th>Year</th>
            <th>Month</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Paid at</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((r) => (
            <tr key={r.id}>
              <td>{r.cardId}</td>
              <td>{r.year}</td>
              <td>{r.month}</td>
              <td>{r.total}</td>
              <td>{r.paid ? "yes" : "no"}</td>
              <td>{r.paidAt || ""}</td>
              <td>
                {!r.paid && <button onClick={() => onPay(r.id)}>Mark paid</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

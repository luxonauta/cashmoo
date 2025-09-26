import { useEffect, useState } from "react";
import { apiListInvoices } from "../api";
import { InvoiceRow } from "../types";

export default function InvoicesView(): JSX.Element {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [cardId, setCardId] = useState<string>("");

  useEffect(() => {
    const payload = cardId ? { cardId: Number(cardId) } : {};
    apiListInvoices(payload).then(setInvoices);
  }, [cardId]);

  return (
    <section>
      <h2>Invoices</h2>

      <div>
        <label htmlFor="card-filter">Filter by card</label>
        <input
          id="card-filter"
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          placeholder="Card ID"
          type="number"
          min={1}
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Card</th>
            <th>Year</th>
            <th>Month</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Paid at</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td>{inv.id}</td>
              <td>{inv.cardId}</td>
              <td>{inv.year}</td>
              <td>{inv.month}</td>
              <td>{inv.total}</td>
              <td>{inv.paid ? "yes" : "no"}</td>
              <td>{inv.paidAt || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

import { useEffect, useState } from "react";
import GreetingBanner from "../components/greeting-banner";
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
      <GreetingBanner page="invoices" />
      <h2>Invoices</h2>

      <label htmlFor="ifilter">Filter by card</label>
      <input
        id="ifilter"
        inputMode="numeric"
        placeholder="Card id (optional)"
        value={cardId}
        onChange={(e) => setCardId(e.target.value)}
      />

      <table>
        <thead>
          <tr>
            <th>Invoice</th>
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

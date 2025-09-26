import { useState } from "react";
import DashboardView from "./views/dashboard";
import SettingsView from "./views/settings";
import IncomesView from "./views/incomes";
import ExpensesView from "./views/expenses";
import CardsView from "./views/cards";
import InvoicesView from "./views/invoices";
import NotificationsView from "./views/notifications";

type Tab =
  | "dashboard"
  | "settings"
  | "incomes"
  | "expenses"
  | "cards"
  | "invoices"
  | "notifications";

export default function App(): JSX.Element {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <main>
      <header>
        <nav>
          <button onClick={() => setTab("dashboard")}>Dashboard</button>
          <button onClick={() => setTab("settings")}>Settings</button>
          <button onClick={() => setTab("incomes")}>Incomes</button>
          <button onClick={() => setTab("expenses")}>Expenses</button>
          <button onClick={() => setTab("cards")}>Cards</button>
          <button onClick={() => setTab("invoices")}>Invoices</button>
          <button onClick={() => setTab("notifications")}>Notifications</button>
        </nav>
      </header>
      {tab === "dashboard" && <DashboardView />}
      {tab === "settings" && <SettingsView />}
      {tab === "incomes" && <IncomesView />}
      {tab === "expenses" && <ExpensesView />}
      {tab === "cards" && <CardsView />}
      {tab === "invoices" && <InvoicesView />}
      {tab === "notifications" && <NotificationsView />}
    </main>
  );
}

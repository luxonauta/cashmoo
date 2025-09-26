import { useEffect, useState } from "react";
import DashboardView from "./views/dashboard";
import SettingsView from "./views/settings";
import IncomesView from "./views/incomes";
import ExpensesView from "./views/expenses";
import CardsView from "./views/cards";
import InvoicesView from "./views/invoices";
import NotificationsView from "./views/notifications";
import { apiGetUser, apiListIncomes, apiListCards, apiListExpenses, apiSetUserName } from "./api";
import { UserProfile } from "./types";

type Tab =
  | "start"
  | "dashboard"
  | "settings"
  | "incomes"
  | "expenses"
  | "cards"
  | "invoices"
  | "notifications";

function StartView({ onSave }: { onSave: (name: string) => void }): JSX.Element {
  const [name, setName] = useState<string>("");
  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    onSave(name.trim());
  }
  return (
    <section>
      <h2>Welcome</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="uname">Your name</label>
        <input id="uname" value={name} onChange={(e) => setName(e.target.value)} />
        <button type="submit">Continue</button>
      </form>
    </section>
  );
}

export default function App(): JSX.Element {
  const [tab, setTab] = useState<Tab>("start");
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function init(): Promise<void> {
      const u = await apiGetUser();
      setUser(u);
      const incomes = await apiListIncomes();
      const cards = await apiListCards();
      const expenses = await apiListExpenses();
      if (!u.name || u.name === "User") {
        setTab("start");
        return;
      }
      if (incomes.length === 0) {
        setTab("incomes");
        return;
      }
      if (cards.length === 0) {
        setTab("cards");
        return;
      }
      if (expenses.length === 0) {
        setTab("expenses");
        return;
      }
      setTab("dashboard");
    }
    init();
  }, []);

  function handleStartSave(name: string): void {
    const n = name.length ? name : "User";
    apiSetUserName(n).then((u) => {
      setUser(u);
      setTab("incomes");
    });
  }

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
      {tab === "start" && <StartView onSave={handleStartSave} />}
      {tab === "dashboard" && <DashboardView />}
      {tab === "settings" && <SettingsView />}
      {tab === "incomes" && <IncomesView onFirstCreated={() => setTab("cards")} />}
      {tab === "cards" && <CardsView onFirstCreated={() => setTab("expenses")} />}
      {tab === "expenses" && <ExpensesView onFirstCreated={() => setTab("dashboard")} />}
      {tab === "invoices" && <InvoicesView />}
      {tab === "notifications" && <NotificationsView />}
    </main>
  );
}

import { useEffect, useState } from "react";
import DashboardView from "./views/dashboard";
import SettingsView from "./views/settings";
import IncomesView from "./views/incomes";
import ExpensesView from "./views/expenses";
import CardsView from "./views/cards";
import InvoicesView from "./views/invoices";
import NotificationsView from "./views/notifications";
import SetupInitialView from "./views/setup-initial";
import {
  apiGetUser,
  apiListIncomes,
  apiListCards,
  apiListExpenses,
  apiSetUserName
} from "./api";
import { UserProfile } from "./types";

type Tab =
  | "start"
  | "setup"
  | "dashboard"
  | "settings"
  | "incomes"
  | "cards"
  | "expenses"
  | "invoices"
  | "notifications";

function StartView({
  onSave
}: {
  onSave: (name: string) => void;
}): JSX.Element {
  const [name, setName] = useState<string>("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!name.trim()) return;
    void apiSetUserName(name.trim()).then(() => {
      onSave(name.trim());
    });
  }

  return (
    <section aria-labelledby="welcome-title">
      <h2 id="welcome-title">Welcome</h2>
      <form onSubmit={onSubmit}>
        <label htmlFor="uname">Your name</label>
        <input
          id="uname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-required="true"
        />
        <button type="submit">Continue</button>
      </form>
    </section>
  );
}

export default function App(): JSX.Element {
  const [tab, setTab] = useState<Tab>("start");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [hasData, setHasData] = useState<boolean>(false);

  useEffect(() => {
    void apiGetUser().then((u) => {
      setUser(u);
    });
    Promise.all([apiListIncomes(), apiListCards(), apiListExpenses()]).then(
      ([incomes, cards, expenses]) => {
        const anyData = incomes.length + cards.length + expenses.length > 0;
        setHasData(anyData);
      }
    );
  }, []);

  useEffect(() => {
    if (!user) return;
    const named = Boolean(
      user.name && user.name.trim() && user.name.trim().toLowerCase() !== "user"
    );
    if (named) {
      setTab("dashboard");
    } else {
      setTab("start");
    }
  }, [user]);

  function handleStartSave(): void {
    setTab("setup");
  }

  return (
    <main>
      <header>
        <h1>Cashmoo</h1>
        <nav aria-label="Primary">
          <button onClick={() => setTab("dashboard")}>Dashboard</button>
          <button onClick={() => setTab("incomes")}>Incomes</button>
          <button onClick={() => setTab("cards")}>Cards</button>
          <button onClick={() => setTab("expenses")}>Expenses</button>
          <button onClick={() => setTab("invoices")}>Invoices</button>
          <button onClick={() => setTab("settings")}>Settings</button>
          <button onClick={() => setTab("notifications")}>Notifications</button>
        </nav>
      </header>
      {tab === "start" && <StartView onSave={handleStartSave} />}
      {tab === "setup" && (
        <SetupInitialView
          onContinue={() => {
            if (hasData) {
              setTab("dashboard");
            } else {
              setTab("dashboard");
            }
          }}
        />
      )}
      {tab === "dashboard" && <DashboardView />}
      {tab === "settings" && <SettingsView />}
      {tab === "incomes" && (
        <IncomesView onFirstCreated={() => setTab("cards")} />
      )}
      {tab === "cards" && (
        <CardsView onFirstCreated={() => setTab("expenses")} />
      )}
      {tab === "expenses" && (
        <ExpensesView onFirstCreated={() => setTab("dashboard")} />
      )}
      {tab === "invoices" && <InvoicesView />}
      {tab === "notifications" && <NotificationsView />}
    </main>
  );
}

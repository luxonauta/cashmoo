import { useEffect, useState } from "react";
import IncomesView from "./incomes";
import CardsView from "./cards";
import ExpensesView from "./expenses";
import { apiListIncomes, apiListCards, apiListExpenses } from "../api";

export default function SetupInitialView({ onContinue }: { onContinue: () => void }): JSX.Element {
  const [incomeCount, setIncomeCount] = useState<number>(0);
  const [cardCount, setCardCount] = useState<number>(0);
  const [expenseCount, setExpenseCount] = useState<number>(0);

  useEffect(() => {
    void apiListIncomes().then((rows) => setIncomeCount(rows.length));
    void apiListCards().then((rows) => setCardCount(rows.length));
    void apiListExpenses().then((rows) => setExpenseCount(rows.length));
  }, []);

  const hasAtLeastOne = incomeCount + cardCount + expenseCount > 0;

  return (
    <section aria-labelledby="setup-title">
      <header>
        <h2 id="setup-title">Initial Setup</h2>
        <p>Register at least one item before continuing. You can add as many as you like.</p>
      </header>

      <IncomesView
          onFirstCreated={() => {
            setIncomeCount((v) => (v === 0 ? 1 : v + 1));
          }}
        />

      <CardsView
          onFirstCreated={() => {
            setCardCount((v) => (v === 0 ? 1 : v + 1));
          }}
        />

      <ExpensesView
          onFirstCreated={() => {
            setExpenseCount((v) => (v === 0 ? 1 : v + 1));
          }}
        />

      <footer>
        {hasAtLeastOne ? (
          <button onClick={onContinue} aria-label="Continue to dashboard">Continuar</button>
        ) : null}
      </footer>
    </section>
  );
}
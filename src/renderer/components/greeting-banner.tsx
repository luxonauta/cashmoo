import { useEffect, useState } from "react";
import { apiGetUser } from "../api";
import { UserProfile } from "../types";

type PageKind =
  | "dashboard"
  | "expenses"
  | "incomes"
  | "cards"
  | "settings"
  | "invoices"
  | "notifications"
  | "setup";

const messages: Record<PageKind, (name: string) => string> = {
  dashboard: (n) => `Mooo-rning ${n}! Ready to milk your profits?`,
  expenses: (n) => `Hey ${n}, where did you spend your hay today?`,
  incomes: (n) => `Udderly amazing, ${n}! Time to fill the piggy bank!`,
  cards: (n) => `Your cards are here, ${n}! No bull with your spending!`,
  settings: (n) => `Farm settings, ${n}! Let's get everything just right!`,
  invoices: (n) => `Invoice time, ${n}! Keep the herd in line!`,
  notifications: (n) => `Fresh from the barn, ${n}! New alerts for you!`,
  setup: (n) => `Welcome to the farm, ${n}! Let's set things up!`
};

export default function GreetingBanner({
  page
}: {
  page: PageKind;
}): JSX.Element {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    apiGetUser().then(setUser);
  }, []);

  const name = user ? user.name : "Friend";
  const text = messages[page](name);

  return (
    <header aria-live="polite">
      <h1>
        <span aria-hidden="true" role="img">
          🐮
        </span>{" "}
        {text}
      </h1>
    </header>
  );
}

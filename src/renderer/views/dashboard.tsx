import { useEffect, useState } from "react";
import GreetingBanner from "../components/greeting-banner";
import { apiDashboard } from "../api";
import { DashboardData } from "../types";

export default function DashboardView(): JSX.Element {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    apiDashboard().then(setData);
  }, []);

  return (
    <section>
      <GreetingBanner page="dashboard" />
      <h2>Dashboard</h2>
      <div>Total incomes: {data ? data.totalIncomes : 0}</div>
      <div>Total expenses: {data ? data.totalExpenses : 0}</div>
      <div>Total cards open: {data ? data.totalCardOpen : 0}</div>
      <div>Balance: {data ? data.balance : 0}</div>
    </section>
  );
}

import { useDashboard, useUser } from "../state";

export default function DashboardView(): JSX.Element {
  const [user] = useUser();
  const data = useDashboard();
  return (
    <section>
      <h2>Dashboard</h2>
      <div>{user ? "Welcome, " + user.name : ""}</div>
      <div>Total income: {data ? data.totalIncome : 0}</div>
      <div>Total expenses: {data ? data.totalExpenses : 0}</div>
      <div>Open card invoices: {data ? data.totalCardOpen : 0}</div>
      <div>Balance: {data ? data.balance : 0}</div>
    </section>
  );
}

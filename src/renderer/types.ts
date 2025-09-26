export type Recurrence = "none" | "weekly" | "monthly" | "yearly";

export interface UserProfile {
  id: number;
  name: string;
}

export interface IncomeRow {
  id: number;
  name: string;
  company: string | null;
  amount: number;
  recurrence: Recurrence;
  startDate: string;
  endDate: string | null;
  nextDate: string | null;
  active: number;
}

export interface ExpenseRow {
  id: number;
  name: string;
  description: string;
  amount: number;
  recurrence: Recurrence;
  autoDebit: number;
  dueDay: number;
  isCard: number;
  cardId: number | null;
  nextDate: string | null;
  active: number;
  paidAt: string | null;
}

export interface CardRow {
  id: number;
  name: string;
  closingDay: number;
  dueDay: number;
  limitAmount: number;
}

export interface InvoiceRow {
  id: number;
  cardId: number;
  year: number;
  month: number;
  closingDate: string;
  dueDate: string;
  totalAmount: number;
  paid: number;
  paidAt: string | null;
}

export interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  totalCardOpen: number;
  balance: number;
}

export interface NotificationRow {
  id: number;
  kind: "income" | "expense" | "invoice";
  refId: number;
  title: string;
  dueDate: string;
  createdAt: string;
  read: number;
}

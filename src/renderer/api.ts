import {
  CardRow,
  DashboardData,
  ExpenseRow,
  IncomeRow,
  InvoiceRow,
  NotificationRow,
  UserProfile
} from "./types";

export function apiGetUser(): Promise<UserProfile> {
  return window.financeApi.getUser();
}

export function apiSetUserName(name: string): Promise<UserProfile> {
  return window.financeApi.setUserName(name);
}

export function apiListIncomes(): Promise<IncomeRow[]> {
  return window.financeApi.listIncomes();
}

export function apiCreateIncome(payload: {
  name: string;
  company: string | null;
  amount: number;
  recurrence: string;
  startDate: string;
  endDate: string | null;
}): Promise<IncomeRow> {
  return window.financeApi.createIncome(payload);
}

export function apiListExpenses(): Promise<ExpenseRow[]> {
  return window.financeApi.listExpenses();
}

export function apiCreateExpense(payload: {
  name: string;
  description: string;
  amount: number;
  recurrence: string;
  autoDebit: number;
  dueDay: number;
  isCard: number;
  cardId: number | null;
  firstDueDate: string;
}): Promise<ExpenseRow> {
  return window.financeApi.createExpense(payload);
}

export function apiListCards(): Promise<CardRow[]> {
  return window.financeApi.listCards();
}

export function apiCreateCard(payload: {
  name: string;
  closingDay: number;
  dueDay: number;
  limitAmount: number;
}): Promise<CardRow> {
  return window.financeApi.createCard(payload);
}

export function apiListInvoices(filters: {
  cardId: number | null;
  year: number | null;
  month: number | null;
}): Promise<InvoiceRow[]> {
  return window.financeApi.listInvoices(filters);
}

export function apiPayInvoice(invoiceId: number): Promise<InvoiceRow> {
  return window.financeApi.payInvoice({ invoiceId });
}

export function apiMarkExpensePaid(
  expenseId: number,
  paidAt: string
): Promise<ExpenseRow> {
  return window.financeApi.markExpensePaid({ expenseId, paidAt });
}

export function apiDashboard(): Promise<DashboardData> {
  return window.financeApi.dashboard();
}

export function apiNotifications(): Promise<NotificationRow[]> {
  return window.financeApi.notifications();
}

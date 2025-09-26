import {
  CardRow,
  DashboardData,
  ExpenseRow,
  IncomeRow,
  InvoiceRow,
  NotificationRow,
  UserProfile
} from "./types";

type FinanceApi = {
  getUser: () => Promise<UserProfile>;
  setUserName: (name: string) => Promise<UserProfile>;
  listIncomes: () => Promise<IncomeRow[]>;
  createIncome: (payload: {
    name: string;
    company: string | null;
    amount: number;
    recurrence: string;
    startDate: string;
    endDate: string | null;
  }) => Promise<IncomeRow>;
  listExpenses: () => Promise<ExpenseRow[]>;
  createExpense: (payload: {
    name: string;
    description: string;
    amount: number;
    recurrence: string;
    autoDebit: number;
    dueDay: number;
    isCard: number;
    cardId: number | null;
    firstDueDate: string;
  }) => Promise<ExpenseRow>;
  markExpensePaid: (payload: {
    expenseId: number;
    paidAt: string;
  }) => Promise<ExpenseRow>;
  listCards: () => Promise<CardRow[]>;
  createCard: (payload: {
    name: string;
    closingDay: number;
    dueDay: number;
    limitAmount: number;
  }) => Promise<CardRow>;
  listInvoices: (payload: { cardId?: number }) => Promise<InvoiceRow[]>;
  payInvoice: (payload: { invoiceId: number }) => Promise<InvoiceRow>;
  dashboard: () => Promise<DashboardData>;
  notifications: () => Promise<NotificationRow[]>;
  clearAll: () => Promise<boolean>;
  updateIncome: (payload: {
    id: number;
    name: string;
    company: string | null;
    amount: number;
    recurrence: string;
    endDate: string | null;
  }) => Promise<IncomeRow>;
  deleteIncome: (payload: { id: number }) => Promise<boolean>;
  updateExpense: (payload: {
    id: number;
    name: string;
    description: string;
    amount: number;
    recurrence: string;
    autoDebit: number;
    dueDay: number;
    isCard: number;
    cardId: number | null;
    firstDueDate?: string | null;
  }) => Promise<ExpenseRow>;
  deleteExpense: (payload: { id: number }) => Promise<boolean>;
  updateCard: (payload: {
    id: number;
    name: string;
    closingDay: number;
    dueDay: number;
    limitAmount: number;
  }) => Promise<CardRow>;
  deleteCard: (payload: { id: number }) => Promise<boolean>;
};

declare global {
  interface Window {
    financeApi: FinanceApi;
  }
}

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

export function apiMarkExpensePaid(payload: {
  expenseId: number;
  paidAt: string;
}): Promise<ExpenseRow> {
  return window.financeApi.markExpensePaid(payload);
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

export function apiListInvoices(payload: {
  cardId?: number;
}): Promise<InvoiceRow[]> {
  return window.financeApi.listInvoices(payload);
}

export function apiPayInvoice(invoiceId: number): Promise<InvoiceRow> {
  return window.financeApi.payInvoice({ invoiceId });
}

export function apiDashboard(): Promise<DashboardData> {
  return window.financeApi.dashboard();
}

export function apiNotifications(): Promise<NotificationRow[]> {
  return window.financeApi.notifications();
}

export function apiClearAll(): Promise<boolean> {
  return window.financeApi.clearAll();
}

export function apiUpdateIncome(payload: {
  id: number;
  name: string;
  company: string | null;
  amount: number;
  recurrence: string;
  endDate: string | null;
}): Promise<IncomeRow> {
  return window.financeApi.updateIncome(payload);
}

export function apiDeleteIncome(id: number): Promise<boolean> {
  return window.financeApi.deleteIncome({ id });
}

export function apiUpdateExpense(payload: {
  id: number;
  name: string;
  description: string;
  amount: number;
  recurrence: string;
  autoDebit: number;
  dueDay: number;
  isCard: number;
  cardId: number | null;
  firstDueDate?: string | null;
}): Promise<ExpenseRow> {
  return window.financeApi.updateExpense(payload);
}

export function apiDeleteExpense(id: number): Promise<boolean> {
  return window.financeApi.deleteExpense({ id });
}

export function apiUpdateCard(payload: {
  id: number;
  name: string;
  closingDay: number;
  dueDay: number;
  limitAmount: number;
}): Promise<CardRow> {
  return window.financeApi.updateCard(payload);
}

export function apiDeleteCard(id: number): Promise<boolean> {
  return window.financeApi.deleteCard({ id });
}

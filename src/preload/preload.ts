import { ipcRenderer } from "electron";

const api = {
  getUser: () => ipcRenderer.invoke("get-user"),
  setUserName: (name: string) => ipcRenderer.invoke("set-user-name", name),
  listIncomes: () => ipcRenderer.invoke("list-incomes"),
  createIncome: (payload: {
    name: string;
    company: string | null;
    amount: number;
    recurrence: string;
    startDate: string;
    endDate: string | null;
  }) => ipcRenderer.invoke("create-income", payload),
  listExpenses: () => ipcRenderer.invoke("list-expenses"),
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
  }) => ipcRenderer.invoke("create-expense", payload),
  markExpensePaid: (payload: { expenseId: number; paidAt: string }) =>
    ipcRenderer.invoke("mark-expense-paid", payload),
  listCards: () => ipcRenderer.invoke("list-cards"),
  createCard: (payload: {
    name: string;
    closingDay: number;
    dueDay: number;
    limitAmount: number;
  }) => ipcRenderer.invoke("create-card", payload),
  listInvoices: (payload: { cardId?: number }) =>
    ipcRenderer.invoke("list-invoices", payload),
  payInvoice: (payload: { invoiceId: number }) =>
    ipcRenderer.invoke("pay-invoice", payload),
  dashboard: () => ipcRenderer.invoke("dashboard"),
  notifications: () => ipcRenderer.invoke("notifications"),
  clearAll: () => ipcRenderer.invoke("clear-all"),
  updateIncome: (payload: {
    id: number;
    name: string;
    company: string | null;
    amount: number;
    recurrence: string;
    endDate: string | null;
  }) => ipcRenderer.invoke("update-income", payload),
  deleteIncome: (payload: { id: number }) =>
    ipcRenderer.invoke("delete-income", payload),
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
  }) => ipcRenderer.invoke("update-expense", payload),
  deleteExpense: (payload: { id: number }) =>
    ipcRenderer.invoke("delete-expense", payload),
  updateCard: (payload: {
    id: number;
    name: string;
    closingDay: number;
    dueDay: number;
    limitAmount: number;
  }) => ipcRenderer.invoke("update-card", payload),
  deleteCard: (payload: { id: number }) =>
    ipcRenderer.invoke("delete-card", payload)
};

(globalThis as unknown as { financeApi: typeof api }).financeApi = api;

document.addEventListener("DOMContentLoaded", () => {
  const React = require("react");
  const client = require("react-dom/client");
  const App = require("../renderer/app").default;
  const el = document.getElementById("root");
  if (el) {
    const root = client.createRoot(el);
    root.render(React.createElement(App));
  }
});

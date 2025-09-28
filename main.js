import { app, BrowserWindow, ipcMain, dialog, Notification } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { ensureDataFiles, readData, writeData, exportData as exportDataFile, importData as importDataFile, resetData, tryRecoverFromBackup, ensureWeeklyBackup } from "./app/helpers/storage.js";
import { validateExpense, validateIncome, validateCard, validateSetup, validateGoal, validateNotificationSettings, parseMoney, validateCardClosingPayment } from "./app/helpers/validation.js";
import { nowIso, toUserFormat, nextDueDateForExpense, projectMonthly, isWithinDaysFromToday } from "./app/helpers/date.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let notificationTimer = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    title: "CashMoo"
  });
  const data = readData();
  if (!data.setup.completed) {
    mainWindow.loadFile(path.join(__dirname, "app/renderer/setup.html"));
  } else {
    mainWindow.loadFile(path.join(__dirname, "app/renderer/index.html"));
  }
};

const init = () => {
  ensureDataFiles();
  const ok = tryRecoverFromBackup();
  if (!ok) dialog.showErrorBox("Data Error", "Data could not be recovered. A fresh file has been created.");
  ensureWeeklyBackup();
  startNotificationLoop();
};

const startNotificationLoop = () => {
  if (notificationTimer) clearInterval(notificationTimer);
  notificationTimer = setInterval(
    () => {
      const data = readData();
      if (!data.settings.notifications.enabled) return;
      const aheadDays = 7;
      const expenses = data.expenses.filter((e) => e.status !== "paid");
      if (data.settings.notifications.alertsDue) {
        expenses.forEach((e) => {
          const due = nextDueDateForExpense(e);
          if (!due) return;
          if (isWithinDaysFromToday(due, aheadDays)) {
            showBasicNotification("Upcoming bill", `${e.name} due on ${toUserFormat(due, data.settings.dateFormat)}`);
          }
        });
      }
    },
    60 * 60 * 1000
  );
};

const showBasicNotification = (title, body) => {
  new Notification({ title, body }).show();
};

app.whenReady().then(() => {
  init();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("setup:save", (payload) => {
  const v = validateSetup(payload);
  if (!v.valid) return { ok: false, error: v.error };
  const data = readData();
  data.setup.completed = true;
  data.settings.userName = payload.userName;
  data.settings.currency = payload.currency;
  data.settings.dateFormat = payload.dateFormat;
  data.settings.notifications.enabled = payload.notificationsEnabled;
  data.settings.notifications.alertDays = [7];
  writeData(data);
  return { ok: true };
});

ipcMain.handle("nav:ready", () => {
  const data = readData();
  return { ok: true, data };
});

ipcMain.handle("dashboard:summary", () => {
  const data = readData();
  const incomes = data.incomes.filter((i) => i.status === "confirmed").reduce((a, b) => a + parseMoney(b.amount), 0);
  const expensesPaid = data.expenses.filter((e) => e.status === "paid").reduce((a, b) => a + parseMoney(b.amount), 0);
  const balance = incomes - expensesPaid;
  const monthlyProjection = projectMonthly(data);
  const distribution = spendDistribution(data);
  const health = healthIndicators(balance, data);
  const suggestions = basicSuggestions(health);
  const cardsUsage = buildCardsUsage(data);
  return {
    ok: true,
    balance,
    monthlyProjection,
    distribution,
    health,
    suggestions,
    empty: isEmptyData(data),
    cardsUsage
  };
});

const isEmptyData = (data) => {
  return data.expenses.length === 0 && data.incomes.length === 0 && data.cards.length === 0 && data.goals.length === 0;
};

const spendDistribution = (data) => {
  const map = {};
  data.expenses.forEach((e) => {
    const key = e.recurrence.type;
    const val = parseMoney(e.amount);
    map[key] = (map[key] || 0) + val;
  });
  return Object.keys(map).map((k) => ({ type: k, amount: map[k] }));
};

const healthIndicators = (balance, data) => {
  const totalIncome = data.incomes.reduce((a, b) => a + parseMoney(b.amount), 0);
  const totalExpense = data.expenses.reduce((a, b) => a + parseMoney(b.amount), 0);
  const savingRate = totalIncome > 0 ? Math.max(0, Math.min(100, Math.floor(((totalIncome - totalExpense) / totalIncome) * 100))) : 0;
  const creditLimits = data.cards.reduce((a, b) => a + parseMoney(b.limit), 0);
  const cardUnpaid = data.expenses.filter((e) => e.paymentMethod === "card" && e.status !== "paid").reduce((a, b) => a + parseMoney(b.amount), 0);
  const creditUse = creditLimits > 0 ? Math.min(100, Math.floor((cardUnpaid / creditLimits) * 100)) : 0;
  return { savingRate, creditUse, netBalance: balance };
};

const basicSuggestions = (health) => {
  const s = [];
  if (health.savingRate < 20) s.push("Increase your saving rate above 20%");
  if (health.creditUse > 50) s.push("Reduce card usage below 50% of the limit");
  if (health.netBalance < 0) s.push("Avoid new expenses until you reach a positive balance");
  if (s.length === 0) s.push("Keep your current strategy");
  return s;
};

const buildCardsUsage = (data) => {
  return data.cards.map((c) => {
    const used = data.expenses.filter((e) => e.paymentMethod === "card" && e.cardId === c.id && e.status !== "paid").reduce((a, b) => a + parseMoney(b.amount), 0);
    const limit = parseMoney(c.limit);
    const available = Math.max(0, limit - used);
    return { id: c.id, name: c.name, limit, used, available };
  });
};

ipcMain.handle("expenses:list", () => {
  const data = readData();
  return { ok: true, items: data.expenses };
});

ipcMain.handle("expenses:add", (payload) => {
  const v = validateExpense(payload);
  if (!v.valid) return { ok: false, error: v.error };
  const data = readData();
  const id = `exp_${Date.now()}`;
  data.expenses.push({ id, ...payload, status: "unpaid", createdAt: nowIso() });
  writeData(data);
  return { ok: true, id };
});

ipcMain.handle("expenses:update", (payload) => {
  const data = readData();
  const idx = data.expenses.findIndex((x) => x.id === payload.id);
  if (idx < 0) return { ok: false, error: "Expense not found" };
  const next = { ...data.expenses[idx], ...payload.update };
  const v = validateExpense(next);
  if (!v.valid) return { ok: false, error: v.error };
  data.expenses[idx] = next;
  writeData(data);
  return { ok: true };
});

ipcMain.handle("expenses:remove", (payload) => {
  const data = readData();
  const idx = data.expenses.findIndex((x) => x.id === payload.id);
  if (idx < 0) return { ok: false, error: "Expense not found" };
  data.expenses.splice(idx, 1);
  writeData(data);
  return { ok: true };
});

ipcMain.handle("expenses:update-status", (payload) => {
  const data = readData();
  const idx = data.expenses.findIndex((x) => x.id === payload.id);
  if (idx < 0) return { ok: false, error: "Expense not found" };
  if (!["unpaid", "paid"].includes(payload.status)) return { ok: false, error: "Invalid status" };
  data.expenses[idx].status = payload.status;
  writeData(data);
  return { ok: true };
});

ipcMain.handle("incomes:list", () => {
  const data = readData();
  return { ok: true, items: data.incomes };
});

ipcMain.handle("incomes:add", (payload) => {
  const v = validateIncome(payload);
  if (!v.valid) return { ok: false, error: v.error };
  const data = readData();
  const id = `inc_${Date.now()}`;
  data.incomes.push({ id, ...payload, status: "pending", createdAt: nowIso() });
  writeData(data);
  return { ok: true, id };
});

ipcMain.handle("incomes:update", (payload) => {
  const data = readData();
  const idx = data.incomes.findIndex((x) => x.id === payload.id);
  if (idx < 0) return { ok: false, error: "Income not found" };
  const next = { ...data.incomes[idx], ...payload.update };
  const v = validateIncome(next);
  if (!v.valid) return { ok: false, error: v.error };
  data.incomes[idx] = next;
  writeData(data);
  return { ok: true };
});

ipcMain.handle("incomes:remove", (payload) => {
  const data = readData();
  const idx = data.incomes.findIndex((x) => x.id === payload.id);
  if (idx < 0) return { ok: false, error: "Income not found" };
  data.incomes.splice(idx, 1);
  writeData(data);
  return { ok: true };
});

ipcMain.handle("incomes:update-status", (payload) => {
  const data = readData();
  const idx = data.incomes.findIndex((x) => x.id === payload.id);
  if (idx < 0) return { ok: false, error: "Income not found" };
  if (!["pending", "confirmed"].includes(payload.status)) return { ok: false, error: "Invalid status" };
  data.incomes[idx].status = payload.status;
  writeData(data);
  return { ok: true };
});

ipcMain.handle("cards:list", () => {
  const data = readData();
  return { ok: true, items: data.cards };
});

ipcMain.handle("cards:add", (payload) => {
  const v = validateCard(payload);
  if (!v.valid) return { ok: false, error: v.error };
  const data = readData();
  if (data.cards.some((c) => c.name.toLowerCase() === payload.name.toLowerCase())) return { ok: false, error: "Card name must be unique" };
  if (!validateCardClosingPayment(payload.closingDay, payload.paymentDay)) return { ok: false, error: "Payment day must be after closing day" };
  const id = `card_${Date.now()}`;
  data.cards.push({ id, ...payload, createdAt: nowIso() });
  writeData(data);
  return { ok: true, id };
});

ipcMain.handle("cards:update", (payload) => {
  const data = readData();
  const idx = data.cards.findIndex((x) => x.id === payload.id);
  if (idx < 0) return { ok: false, error: "Card not found" };
  const next = { ...data.cards[idx], ...payload.update };
  const v = validateCard(next);
  if (!v.valid) return { ok: false, error: v.error };
  if (!validateCardClosingPayment(next.closingDay, next.paymentDay)) return { ok: false, error: "Payment day must be after closing day" };
  if (data.cards.some((c) => c.id !== payload.id && c.name.toLowerCase() === next.name.toLowerCase())) return { ok: false, error: "Card name must be unique" };
  data.cards[idx] = next;
  writeData(data);
  return { ok: true };
});

ipcMain.handle("cards:remove", (payload) => {
  const data = readData();
  const idx = data.cards.findIndex((x) => x.id === payload.id);
  if (idx < 0) return { ok: false, error: "Card not found" };
  const linked = data.expenses.some((e) => e.paymentMethod === "card" && e.cardId === payload.id);
  if (linked) return { ok: false, error: "Card has linked expenses" };
  data.cards.splice(idx, 1);
  writeData(data);
  return { ok: true };
});

ipcMain.handle("goals:list", () => {
  const data = readData();
  return { ok: true, items: data.goals };
});

ipcMain.handle("goals:add", (payload) => {
  const v = validateGoal(payload);
  if (!v.valid) return { ok: false, error: v.error };
  const data = readData();
  const id = `goal_${Date.now()}`;
  data.goals.push({ id, ...payload, createdAt: nowIso() });
  writeData(data);
  return { ok: true, id };
});

ipcMain.handle("goals:remove", (payload) => {
  const data = readData();
  const idx = data.goals.findIndex((g) => g.id === payload.id);
  if (idx < 0) return { ok: false, error: "Goal not found" };
  data.goals.splice(idx, 1);
  writeData(data);
  return { ok: true };
});

ipcMain.handle("notifications:get", () => {
  const data = readData();
  data.settings.notifications.alertDays = [7];
  writeData(data);
  return { ok: true, settings: data.settings.notifications };
});

ipcMain.handle("notifications:update", (payload) => {
  const v = validateNotificationSettings(payload);
  if (!v.valid) return { ok: false, error: v.error };
  const data = readData();
  data.settings.notifications = {
    ...data.settings.notifications,
    enabled: typeof payload.enabled === "boolean" ? payload.enabled : data.settings.notifications.enabled,
    alertsDue: typeof payload.alertsDue === "boolean" ? payload.alertsDue : data.settings.notifications.alertsDue,
    alertsGoals: typeof payload.alertsGoals === "boolean" ? payload.alertsGoals : data.settings.notifications.alertsGoals,
    alertDays: [7]
  };
  writeData(data);
  return { ok: true };
});

ipcMain.handle("settings:get", () => {
  const data = readData();
  return {
    ok: true,
    settings: {
      userName: data.settings.userName,
      currency: data.settings.currency,
      dateFormat: data.settings.dateFormat
    }
  };
});

ipcMain.handle("settings:update", (payload) => {
  const data = readData();
  if (!payload.userName || payload.userName.length > 30) return { ok: false, error: "Invalid user name" };
  if (!["BRL", "USD", "EUR"].includes(payload.currency)) return { ok: false, error: "Invalid currency" };
  if (!["DD/MM/YYYY", "MM/DD/YYYY"].includes(payload.dateFormat)) return { ok: false, error: "Invalid date format" };
  data.settings.userName = payload.userName;
  data.settings.currency = payload.currency;
  data.settings.dateFormat = payload.dateFormat;
  writeData(data);
  return { ok: true };
});

ipcMain.handle("data:export", async () => {
  const out = await exportDataFile();
  if (!out) return { ok: false, error: "Export canceled" };
  return { ok: true, path: out };
});

ipcMain.handle("data:import", async () => {
  const ok = await importDataFile();
  if (!ok) return { ok: false, error: "Invalid JSON file" };
  return { ok: true };
});

ipcMain.handle("data:reset", () => {
  resetData();
  return { ok: true };
});

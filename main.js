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

/**
 * Creates the main application window
 */
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 768,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    title: "CashMoo"
  });

  const data = readData();
  const htmlFile = data.setup.completed ? path.join(__dirname, "app/renderer/index.html") : path.join(__dirname, "app/renderer/setup.html");

  mainWindow.loadFile(htmlFile);
};

/**
 * Initializes the application data and services
 */
const init = () => {
  ensureDataFiles();
  const recoverySuccess = tryRecoverFromBackup();

  if (!recoverySuccess) {
    dialog.showErrorBox("Data Error", "Data could not be recovered. A fresh file has been created.");
  }

  ensureWeeklyBackup();
  startNotificationLoop();
};

/**
 * Starts the notification monitoring loop
 */
const startNotificationLoop = () => {
  if (notificationTimer) clearInterval(notificationTimer);

  notificationTimer = setInterval(
    () => {
      const data = readData();

      if (!data.settings.notifications.enabled) return;

      const aheadDays = 7;
      const unpaidExpenses = data.expenses.filter((expense) => expense.status !== "paid");

      if (data.settings.notifications.alertsDue) {
        unpaidExpenses.forEach((expense) => {
          const dueDate = nextDueDateForExpense(expense);

          if (!dueDate) return;

          if (isWithinDaysFromToday(dueDate, aheadDays)) {
            const formattedDate = toUserFormat(dueDate, data.settings.dateFormat);
            showBasicNotification("Upcoming bill", `${expense.name} due on ${formattedDate}`);
          }
        });
      }
    },
    60 * 60 * 1000
  );
};

/**
 * Shows a basic system notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 */
const showBasicNotification = (title, body) => {
  new Notification({ title, body }).show();
};

/**
 * Checks if the data structure is empty
 * @param {Object} data - Application data
 * @returns {boolean} True if data is empty
 */
const isEmptyData = (data) => {
  return data.expenses.length === 0 && data.incomes.length === 0 && data.cards.length === 0 && data.goals.length === 0;
};

/**
 * Calculates spending distribution by recurrence type
 * @param {Object} data - Application data
 * @returns {Array} Array of spending distribution objects
 */
const spendDistribution = (data) => {
  const distributionMap = {};

  data.expenses.forEach((expense) => {
    const recurrenceType = expense.recurrence.type;
    const amount = parseMoney(expense.amount);
    distributionMap[recurrenceType] = (distributionMap[recurrenceType] || 0) + amount;
  });

  return Object.keys(distributionMap).map((type) => ({
    type,
    amount: distributionMap[type]
  }));
};

/**
 * Calculates financial health indicators
 * @param {number} balance - Current balance
 * @param {Object} data - Application data
 * @returns {Object} Health indicators object
 */
const healthIndicators = (balance, data) => {
  const totalIncome = data.incomes.reduce((acc, income) => acc + parseMoney(income.amount), 0);
  const totalExpense = data.expenses.reduce((acc, expense) => acc + parseMoney(expense.amount), 0);

  const savingRate = totalIncome > 0 ? Math.max(0, Math.min(100, Math.floor(((totalIncome - totalExpense) / totalIncome) * 100))) : 0;

  const creditLimits = data.cards.reduce((acc, card) => acc + parseMoney(card.limit), 0);
  const cardUnpaid = data.expenses.filter((expense) => expense.paymentMethod === "card" && expense.status !== "paid").reduce((acc, expense) => acc + parseMoney(expense.amount), 0);

  const creditUse = creditLimits > 0 ? Math.min(100, Math.floor((cardUnpaid / creditLimits) * 100)) : 0;

  return {
    savingRate,
    creditUse,
    netBalance: balance
  };
};

/**
 * Generates basic financial suggestions based on health indicators
 * @param {Object} health - Health indicators
 * @returns {Array} Array of suggestion strings
 */
const basicSuggestions = (health) => {
  const suggestions = [];

  if (health.savingRate < 20) {
    suggestions.push("Increase your saving rate above 20%");
  }

  if (health.creditUse > 50) {
    suggestions.push("Reduce card usage below 50% of the limit");
  }

  if (health.netBalance < 0) {
    suggestions.push("Avoid new expenses until you reach a positive balance");
  }

  return suggestions.length === 0 ? ["Keep your current strategy"] : suggestions;
};

/**
 * Builds card usage information
 * @param {Object} data - Application data
 * @returns {Array} Array of card usage objects
 */
const buildCardsUsage = (data) => {
  return data.cards.map((card) => {
    const usedAmount = data.expenses
      .filter((expense) => expense.paymentMethod === "card" && expense.cardId === card.id && expense.status !== "paid")
      .reduce((acc, expense) => acc + parseMoney(expense.amount), 0);

    const limit = parseMoney(card.limit);
    const available = Math.max(0, limit - usedAmount);

    return {
      id: card.id,
      name: card.name,
      limit,
      used: usedAmount,
      available
    };
  });
};

/**
 * Finds an item by ID in a collection
 * @param {Array} collection - Collection to search
 * @param {string} id - ID to find
 * @returns {number} Index of found item, -1 if not found
 */
const findItemIndex = (collection, id) => {
  return collection.findIndex((item) => item.id === id);
};

/**
 * Validates and updates an item in a collection
 * @param {Array} collection - Collection containing the item
 * @param {number} index - Index of item to update
 * @param {Object} update - Update data
 * @param {Function} validator - Validation function
 * @returns {Object} Validation result
 */
const updateItem = (collection, index, update, validator) => {
  const updatedItem = { ...collection[index], ...update };
  const validation = validator(updatedItem);

  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  collection[index] = updatedItem;
  return { ok: true };
};

app.whenReady().then(() => {
  init();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("setup:save", (payload) => {
  const validation = validateSetup(payload);

  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

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

  const confirmedIncomes = data.incomes.filter((income) => income.status === "confirmed").reduce((acc, income) => acc + parseMoney(income.amount), 0);

  const paidExpenses = data.expenses.filter((expense) => expense.status === "paid").reduce((acc, expense) => acc + parseMoney(expense.amount), 0);

  const balance = confirmedIncomes - paidExpenses;
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

ipcMain.handle("expenses:list", () => {
  const data = readData();
  return { ok: true, items: data.expenses };
});

ipcMain.handle("expenses:add", (payload) => {
  const validation = validateExpense(payload);

  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const data = readData();
  const id = `exp_${Date.now()}`;

  data.expenses.push({
    id,
    ...payload,
    status: "unpaid",
    createdAt: nowIso()
  });

  writeData(data);
  return { ok: true, id };
});

ipcMain.handle("expenses:update", (payload) => {
  const data = readData();
  const itemIndex = findItemIndex(data.expenses, payload.id);

  if (itemIndex < 0) {
    return { ok: false, error: "Expense not found" };
  }

  const updateResult = updateItem(data.expenses, itemIndex, payload.update, validateExpense);
  if (!updateResult.ok) {
    return updateResult;
  }

  writeData(data);
  return { ok: true };
});

ipcMain.handle("expenses:remove", (payload) => {
  const data = readData();
  const itemIndex = findItemIndex(data.expenses, payload.id);

  if (itemIndex < 0) {
    return { ok: false, error: "Expense not found" };
  }

  data.expenses.splice(itemIndex, 1);
  writeData(data);
  return { ok: true };
});

ipcMain.handle("expenses:update-status", (payload) => {
  const data = readData();
  const itemIndex = findItemIndex(data.expenses, payload.id);

  if (itemIndex < 0) {
    return { ok: false, error: "Expense not found" };
  }

  if (!["unpaid", "paid"].includes(payload.status)) {
    return { ok: false, error: "Invalid status" };
  }

  data.expenses[itemIndex].status = payload.status;
  writeData(data);
  return { ok: true };
});

ipcMain.handle("incomes:list", () => {
  const data = readData();
  return { ok: true, items: data.incomes };
});

ipcMain.handle("incomes:add", (payload) => {
  const validation = validateIncome(payload);

  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const data = readData();
  const id = `inc_${Date.now()}`;

  data.incomes.push({
    id,
    ...payload,
    status: "pending",
    createdAt: nowIso()
  });

  writeData(data);
  return { ok: true, id };
});

ipcMain.handle("incomes:update", (payload) => {
  const data = readData();
  const itemIndex = findItemIndex(data.incomes, payload.id);

  if (itemIndex < 0) {
    return { ok: false, error: "Income not found" };
  }

  const updateResult = updateItem(data.incomes, itemIndex, payload.update, validateIncome);
  if (!updateResult.ok) {
    return updateResult;
  }

  writeData(data);
  return { ok: true };
});

ipcMain.handle("incomes:remove", (payload) => {
  const data = readData();
  const itemIndex = findItemIndex(data.incomes, payload.id);

  if (itemIndex < 0) {
    return { ok: false, error: "Income not found" };
  }

  data.incomes.splice(itemIndex, 1);
  writeData(data);
  return { ok: true };
});

ipcMain.handle("incomes:update-status", (payload) => {
  const data = readData();
  const itemIndex = findItemIndex(data.incomes, payload.id);

  if (itemIndex < 0) {
    return { ok: false, error: "Income not found" };
  }

  if (!["pending", "confirmed"].includes(payload.status)) {
    return { ok: false, error: "Invalid status" };
  }

  data.incomes[itemIndex].status = payload.status;
  writeData(data);
  return { ok: true };
});

ipcMain.handle("cards:list", () => {
  const data = readData();
  return { ok: true, items: data.cards };
});

ipcMain.handle("cards:add", (payload) => {
  const validation = validateCard(payload);

  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const data = readData();
  const nameExists = data.cards.some((card) => card.name.toLowerCase() === payload.name.toLowerCase());

  if (nameExists) {
    return { ok: false, error: "Card name must be unique" };
  }

  if (!validateCardClosingPayment(payload.closingDay, payload.paymentDay)) {
    return { ok: false, error: "Payment day must be after closing day" };
  }

  const id = `card_${Date.now()}`;
  data.cards.push({
    id,
    ...payload,
    createdAt: nowIso()
  });

  writeData(data);
  return { ok: true, id };
});

ipcMain.handle("cards:update", (payload) => {
  const data = readData();
  const itemIndex = findItemIndex(data.cards, payload.id);

  if (itemIndex < 0) {
    return { ok: false, error: "Card not found" };
  }

  const updatedCard = { ...data.cards[itemIndex], ...payload.update };
  const validation = validateCard(updatedCard);

  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  if (!validateCardClosingPayment(updatedCard.closingDay, updatedCard.paymentDay)) {
    return { ok: false, error: "Payment day must be after closing day" };
  }

  const nameConflict = data.cards.some((card) => card.id !== payload.id && card.name.toLowerCase() === updatedCard.name.toLowerCase());

  if (nameConflict) {
    return { ok: false, error: "Card name must be unique" };
  }

  data.cards[itemIndex] = updatedCard;
  writeData(data);
  return { ok: true };
});

ipcMain.handle("cards:remove", (payload) => {
  const data = readData();
  const itemIndex = findItemIndex(data.cards, payload.id);

  if (itemIndex < 0) {
    return { ok: false, error: "Card not found" };
  }

  const hasLinkedExpenses = data.expenses.some((expense) => expense.paymentMethod === "card" && expense.cardId === payload.id);

  if (hasLinkedExpenses) {
    return { ok: false, error: "Card has linked expenses" };
  }

  data.cards.splice(itemIndex, 1);
  writeData(data);
  return { ok: true };
});

ipcMain.handle("goals:list", () => {
  const data = readData();
  return { ok: true, items: data.goals };
});

ipcMain.handle("goals:add", (payload) => {
  const validation = validateGoal(payload);

  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const data = readData();
  const id = `goal_${Date.now()}`;

  data.goals.push({
    id,
    ...payload,
    createdAt: nowIso()
  });

  writeData(data);
  return { ok: true, id };
});

ipcMain.handle("goals:remove", (payload) => {
  const data = readData();
  const itemIndex = findItemIndex(data.goals, payload.id);

  if (itemIndex < 0) {
    return { ok: false, error: "Goal not found" };
  }

  data.goals.splice(itemIndex, 1);
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
  const validation = validateNotificationSettings(payload);

  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const data = readData();
  const currentNotifications = data.settings.notifications;

  data.settings.notifications = {
    ...currentNotifications,
    enabled: typeof payload.enabled === "boolean" ? payload.enabled : currentNotifications.enabled,
    alertsDue: typeof payload.alertsDue === "boolean" ? payload.alertsDue : currentNotifications.alertsDue,
    alertsGoals: typeof payload.alertsGoals === "boolean" ? payload.alertsGoals : currentNotifications.alertsGoals,
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

  if (!payload.userName || payload.userName.length > 30) {
    return { ok: false, error: "Invalid user name" };
  }

  if (!["BRL", "USD", "EUR"].includes(payload.currency)) {
    return { ok: false, error: "Invalid currency" };
  }

  if (!["DD/MM/YYYY", "MM/DD/YYYY"].includes(payload.dateFormat)) {
    return { ok: false, error: "Invalid date format" };
  }

  data.settings.userName = payload.userName;
  data.settings.currency = payload.currency;
  data.settings.dateFormat = payload.dateFormat;

  writeData(data);
  return { ok: true };
});

ipcMain.handle("data:export", async () => {
  const exportPath = await exportDataFile();

  if (!exportPath) {
    return { ok: false, error: "Export canceled" };
  }

  return { ok: true, path: exportPath };
});

ipcMain.handle("data:import", async () => {
  const importSuccess = await importDataFile();

  if (!importSuccess) {
    return { ok: false, error: "Invalid JSON file" };
  }

  return { ok: true };
});

ipcMain.handle("data:reset", () => {
  resetData();
  return { ok: true };
});

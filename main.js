import { app, BrowserWindow, ipcMain, dialog, Notification } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { ensureDataFiles, readData, writeData, exportData as exportDataFile, importData as importDataFile, resetData, tryRecoverFromBackup, ensureWeeklyBackup } from "./app/helpers/storage.js";
import { validateExpense, validateIncome, validateCard, validateSetup, validateGoal, validateNotificationSettings, parseMoney, validateCardClosingPayment } from "./app/helpers/validation.js";
import { nowIso, toUserFormat, nextDueDateForExpense, projectMonthly, isWithinDaysFromToday } from "./app/helpers/date.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let notificationTimer = null;

/**
 * Gets the appropriate icon path for the current platform
 * @returns {string|null} Path to the platform-specific icon file, or null if not found
 */
const getIconPath = () => {
  const assetsDir = path.join(__dirname, "assets");

  // Use PNG for all platforms to avoid .icns issues
  const iconPath = path.join(assetsDir, "icon.png");

  // Check if icon file exists
  try {
    if (fs.existsSync(iconPath)) {
      return iconPath;
    } else {
      console.warn(`Icon file not found: ${iconPath}`);
      return null;
    }
  } catch (error) {
    console.warn(`Error checking icon file: ${error.message}`);
    return null;
  }
};

/**
 * Creates the main application window with platform-specific configurations
 */
const createWindow = () => {
  const iconPath = getIconPath();

  const windowConfig = {
    width: 768,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    title: "CashMoo",
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default"
  };

  // Add icon if file exists (now using PNG for all platforms)
  if (iconPath) {
    windowConfig.icon = iconPath;
    console.log(`Using icon: ${iconPath}`);
  } else {
    console.log("No icon file found, proceeding without icon");
  }

  mainWindow = new BrowserWindow(windowConfig);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    // Set dock icon for macOS if icon exists
    if (process.platform === "darwin" && iconPath && app.dock) {
      try {
        app.dock.setIcon(iconPath);
        console.log("Dock icon set successfully");
      } catch (error) {
        console.warn(`Failed to set dock icon: ${error.message}`);
      }
    }
  });

  mainWindow.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    console.error("Failed to load:", errorCode, errorDescription);
  });

  const data = readData();
  const htmlFile = data.setup.completed ? path.join(__dirname, "app/renderer/index.html") : path.join(__dirname, "app/renderer/setup.html");

  mainWindow.loadFile(htmlFile);
};

/**
 * Initializes the application data and services with error handling
 */
const init = () => {
  try {
    ensureDataFiles();
    const recoverySuccess = tryRecoverFromBackup();

    if (!recoverySuccess) {
      if (mainWindow) {
        dialog.showMessageBox(mainWindow, {
          type: "error",
          title: "Data Error",
          message: "Data could not be recovered. A fresh file has been created."
        });
      }
    }

    ensureWeeklyBackup();
    startNotificationLoop();
  } catch (error) {
    console.error("Initialization error:", error);
  }
};

/**
 * Starts the notification monitoring loop with error handling
 */
const startNotificationLoop = () => {
  if (notificationTimer) clearInterval(notificationTimer);

  notificationTimer = setInterval(
    () => {
      try {
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
      } catch (error) {
        console.error("Notification loop error:", error);
      }
    },
    60 * 60 * 1000
  );
};

/**
 * Shows a basic system notification with platform compatibility check
 * @param {string} title - Notification title
 * @param {string} body - Notification body text
 */
const showBasicNotification = (title, body) => {
  try {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  } catch (error) {
    console.error("Notification error:", error);
  }
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

/**
 * App lifecycle and event handlers
 */
app.whenReady().then(() => {
  // Set application name for macOS menu bar and dock
  if (process.platform === "darwin") {
    app.setName("CashMoo");
  }

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

app.on("certificate-error", (event, _webContents, url, _error, _certificate, callback) => {
  if (url.startsWith("file://")) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

/**
 * IPC Main Handlers - Setup
 */

ipcMain.handle("setup:save", (_event, payload) => {
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

/**
 * IPC Main Handlers - Navigation
 */

ipcMain.handle("nav:ready", () => {
  const data = readData();
  return { ok: true, data };
});

/**
 * IPC Main Handlers - Dashboard
 */

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

/**
 * IPC Main Handlers - Expenses
 */

ipcMain.handle("expenses:list", () => {
  const data = readData();
  return { ok: true, items: data.expenses };
});

ipcMain.handle("expenses:add", (_event, payload) => {
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

ipcMain.handle("expenses:update", (_event, payload) => {
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

ipcMain.handle("expenses:remove", (_event, payload) => {
  const data = readData();
  const itemIndex = findItemIndex(data.expenses, payload.id);

  if (itemIndex < 0) {
    return { ok: false, error: "Expense not found" };
  }

  data.expenses.splice(itemIndex, 1);
  writeData(data);
  return { ok: true };
});

ipcMain.handle("expenses:update-status", (_event, payload) => {
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

/**
 * IPC Main Handlers - Incomes
 */

ipcMain.handle("incomes:list", () => {
  const data = readData();
  return { ok: true, items: data.incomes };
});

ipcMain.handle("incomes:add", (_event, payload) => {
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

ipcMain.handle("incomes:update", (_event, payload) => {
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

ipcMain.handle("incomes:remove", (_event, payload) => {
  const data = readData();
  const itemIndex = findItemIndex(data.incomes, payload.id);

  if (itemIndex < 0) {
    return { ok: false, error: "Income not found" };
  }

  data.incomes.splice(itemIndex, 1);
  writeData(data);
  return { ok: true };
});

ipcMain.handle("incomes:update-status", (_event, payload) => {
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

/**
 * IPC Main Handlers - Cards
 */

ipcMain.handle("cards:list", () => {
  const data = readData();
  return { ok: true, items: data.cards };
});

ipcMain.handle("cards:add", (_event, payload) => {
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

ipcMain.handle("cards:update", (_event, payload) => {
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

ipcMain.handle("cards:remove", (_event, payload) => {
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

/**
 * IPC Main Handlers - Goals
 */

ipcMain.handle("goals:list", () => {
  const data = readData();
  return { ok: true, items: data.goals };
});

ipcMain.handle("goals:add", (_event, payload) => {
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

ipcMain.handle("goals:remove", (_event, payload) => {
  const data = readData();
  const itemIndex = findItemIndex(data.goals, payload.id);

  if (itemIndex < 0) {
    return { ok: false, error: "Goal not found" };
  }

  data.goals.splice(itemIndex, 1);
  writeData(data);
  return { ok: true };
});

/**
 * IPC Main Handlers - Notifications
 */

ipcMain.handle("notifications:get", () => {
  const data = readData();
  data.settings.notifications.alertDays = [7];
  writeData(data);
  return { ok: true, settings: data.settings.notifications };
});

ipcMain.handle("notifications:update", (_event, payload) => {
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

/**
 * IPC Main Handlers - Settings
 */

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

ipcMain.handle("settings:update", (_event, payload) => {
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

/**
 * IPC Main Handlers - Data Management
 */

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

const { contextBridge, ipcRenderer } = require("electron");

/**
 * Setup API methods
 */
const setupApi = {
  /**
   * Saves initial setup configuration
   * @param {Object} payload - Setup configuration data
   * @param {string} payload.userName - User's name
   * @param {string} payload.currency - Selected currency (BRL, USD, EUR)
   * @param {string} payload.dateFormat - Date format preference
   * @param {boolean} payload.notificationsEnabled - Whether notifications are enabled
   * @returns {Promise<Object>} Setup save result
   */
  save: (payload) => ipcRenderer.invoke("setup:save", payload)
};

/**
 * Navigation API methods
 */
const navigationApi = {
  /**
   * Gets application data when navigation is ready
   * @returns {Promise<Object>} Application data and status
   */
  ready: () => ipcRenderer.invoke("nav:ready")
};

/**
 * Dashboard API methods
 */
const dashboardApi = {
  /**
   * Gets dashboard summary with financial overview
   * @returns {Promise<Object>} Dashboard summary including balance, projections, and health indicators
   */
  summary: () => ipcRenderer.invoke("dashboard:summary")
};

/**
 * Expense management API methods
 */
const expenseApi = {
  /**
   * Retrieves all expenses
   * @returns {Promise<Object>} List of expenses
   */
  list: () => ipcRenderer.invoke("expenses:list"),

  /**
   * Adds a new expense
   * @param {Object} payload - Expense data
   * @param {string} payload.name - Expense name
   * @param {string} payload.amount - Expense amount
   * @param {string} payload.paymentMethod - Payment method (cash, card, etc.)
   * @param {Object} payload.recurrence - Recurrence configuration
   * @returns {Promise<Object>} Add operation result with generated ID
   */
  add: (payload) => ipcRenderer.invoke("expenses:add", payload),

  /**
   * Updates an existing expense
   * @param {Object} payload - Update data
   * @param {string} payload.id - Expense ID to update
   * @param {Object} payload.update - Fields to update
   * @returns {Promise<Object>} Update operation result
   */
  update: (payload) => ipcRenderer.invoke("expenses:update", payload),

  /**
   * Removes an expense
   * @param {Object} payload - Remove data
   * @param {string} payload.id - Expense ID to remove
   * @returns {Promise<Object>} Remove operation result
   */
  remove: (payload) => ipcRenderer.invoke("expenses:remove", payload),

  /**
   * Updates expense payment status
   * @param {Object} payload - Status update data
   * @param {string} payload.id - Expense ID
   * @param {string} payload.status - New status (paid, unpaid)
   * @returns {Promise<Object>} Status update result
   */
  updateStatus: (payload) => ipcRenderer.invoke("expenses:update-status", payload)
};

/**
 * Income management API methods
 */
const incomeApi = {
  /**
   * Retrieves all incomes
   * @returns {Promise<Object>} List of incomes
   */
  list: () => ipcRenderer.invoke("incomes:list"),

  /**
   * Adds a new income
   * @param {Object} payload - Income data
   * @param {string} payload.name - Income source name
   * @param {string} payload.amount - Income amount
   * @param {Object} payload.recurrence - Recurrence configuration
   * @returns {Promise<Object>} Add operation result with generated ID
   */
  add: (payload) => ipcRenderer.invoke("incomes:add", payload),

  /**
   * Updates an existing income
   * @param {Object} payload - Update data
   * @param {string} payload.id - Income ID to update
   * @param {Object} payload.update - Fields to update
   * @returns {Promise<Object>} Update operation result
   */
  update: (payload) => ipcRenderer.invoke("incomes:update", payload),

  /**
   * Removes an income
   * @param {Object} payload - Remove data
   * @param {string} payload.id - Income ID to remove
   * @returns {Promise<Object>} Remove operation result
   */
  remove: (payload) => ipcRenderer.invoke("incomes:remove", payload),

  /**
   * Updates income confirmation status
   * @param {Object} payload - Status update data
   * @param {string} payload.id - Income ID
   * @param {string} payload.status - New status (pending, confirmed)
   * @returns {Promise<Object>} Status update result
   */
  updateStatus: (payload) => ipcRenderer.invoke("incomes:update-status", payload)
};

/**
 * Credit card management API methods
 */
const cardApi = {
  /**
   * Retrieves all credit cards
   * @returns {Promise<Object>} List of credit cards
   */
  list: () => ipcRenderer.invoke("cards:list"),

  /**
   * Adds a new credit card
   * @param {Object} payload - Card data
   * @param {string} payload.name - Card name
   * @param {string} payload.limit - Credit limit
   * @param {number} payload.closingDay - Monthly closing day
   * @param {number} payload.paymentDay - Monthly payment day
   * @returns {Promise<Object>} Add operation result with generated ID
   */
  add: (payload) => ipcRenderer.invoke("cards:add", payload),

  /**
   * Updates an existing credit card
   * @param {Object} payload - Update data
   * @param {string} payload.id - Card ID to update
   * @param {Object} payload.update - Fields to update
   * @returns {Promise<Object>} Update operation result
   */
  update: (payload) => ipcRenderer.invoke("cards:update", payload),

  /**
   * Removes a credit card
   * @param {Object} payload - Remove data
   * @param {string} payload.id - Card ID to remove
   * @returns {Promise<Object>} Remove operation result
   */
  remove: (payload) => ipcRenderer.invoke("cards:remove", payload)
};

/**
 * Financial goals management API methods
 */
const goalApi = {
  /**
   * Retrieves all financial goals
   * @returns {Promise<Object>} List of financial goals
   */
  list: () => ipcRenderer.invoke("goals:list"),

  /**
   * Adds a new financial goal
   * @param {Object} payload - Goal data
   * @param {string} payload.name - Goal name
   * @param {string} payload.targetAmount - Target amount to achieve
   * @param {string} payload.deadline - Goal deadline
   * @returns {Promise<Object>} Add operation result with generated ID
   */
  add: (payload) => ipcRenderer.invoke("goals:add", payload),

  /**
   * Removes a financial goal
   * @param {Object} payload - Remove data
   * @param {string} payload.id - Goal ID to remove
   * @returns {Promise<Object>} Remove operation result
   */
  remove: (payload) => ipcRenderer.invoke("goals:remove", payload)
};

/**
 * Notification settings API methods
 */
const notificationApi = {
  /**
   * Gets current notification settings
   * @returns {Promise<Object>} Current notification configuration
   */
  get: () => ipcRenderer.invoke("notifications:get"),

  /**
   * Updates notification settings
   * @param {Object} payload - Notification settings
   * @param {boolean} payload.enabled - Whether notifications are enabled
   * @param {boolean} payload.alertsDue - Whether to show due date alerts
   * @param {boolean} payload.alertsGoals - Whether to show goal alerts
   * @returns {Promise<Object>} Update operation result
   */
  update: (payload) => ipcRenderer.invoke("notifications:update", payload)
};

/**
 * Application settings API methods
 */
const settingsApi = {
  /**
   * Gets current application settings
   * @returns {Promise<Object>} Current application settings
   */
  get: () => ipcRenderer.invoke("settings:get"),

  /**
   * Updates application settings
   * @param {Object} payload - Settings data
   * @param {string} payload.userName - User's name
   * @param {string} payload.currency - Currency preference
   * @param {string} payload.dateFormat - Date format preference
   * @returns {Promise<Object>} Update operation result
   */
  update: (payload) => ipcRenderer.invoke("settings:update", payload)
};

/**
 * Data management API methods
 */
const dataApi = {
  /**
   * Exports application data to file
   * @returns {Promise<Object>} Export operation result with file path
   */
  export: () => ipcRenderer.invoke("data:export"),

  /**
   * Imports application data from file
   * @returns {Promise<Object>} Import operation result
   */
  import: () => ipcRenderer.invoke("data:import"),

  /**
   * Resets all application data
   * @returns {Promise<Object>} Reset operation result
   */
  reset: () => ipcRenderer.invoke("data:reset")
};

/**
 * CashMoo API exposed to renderer process
 */
const cashmooApi = {
  setup: setupApi,
  navigation: navigationApi,
  dashboard: dashboardApi,
  expenses: expenseApi,
  incomes: incomeApi,
  cards: cardApi,
  goals: goalApi,
  notifications: notificationApi,
  settings: settingsApi,
  data: dataApi,

  // Legacy flat API for backward compatibility
  setupSave: setupApi.save,
  navReady: navigationApi.ready,
  dashboardSummary: dashboardApi.summary,
  listExpenses: expenseApi.list,
  addExpense: expenseApi.add,
  updateExpense: expenseApi.update,
  removeExpense: expenseApi.remove,
  setExpenseStatus: expenseApi.updateStatus,
  listIncomes: incomeApi.list,
  addIncome: incomeApi.add,
  updateIncome: incomeApi.update,
  removeIncome: incomeApi.remove,
  setIncomeStatus: incomeApi.updateStatus,
  listCards: cardApi.list,
  addCard: cardApi.add,
  updateCard: cardApi.update,
  removeCard: cardApi.remove,
  listGoals: goalApi.list,
  addGoal: goalApi.add,
  removeGoal: goalApi.remove,
  getNotifications: notificationApi.get,
  updateNotifications: notificationApi.update,
  getSettings: settingsApi.get,
  updateSettings: settingsApi.update,
  exportData: dataApi.export,
  importData: dataApi.import,
  resetApp: dataApi.reset
};

contextBridge.exposeInMainWorld("cashmoo", cashmooApi);

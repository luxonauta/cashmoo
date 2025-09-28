/**
 * Main renderer script for CashMoo application
 * Handles all UI interactions and form management
 */

/**
 * Utility functions
 */

/**
 * Quick selector function
 * @param {string} selector - CSS selector string
 * @returns {Element|null} Selected DOM element
 */
const q = (selector) => document.querySelector(selector);

/**
 * Shows error message in specified element
 * @param {Element} node - DOM element to display error in
 * @param {string} text - Error message text
 */
const showError = (node, text) => {
  node.textContent = text || "";
};

/**
 * Fills a select element with options
 * @param {Element} element - Select element to populate
 * @param {Array} optionsList - Array of option objects with value and label
 */
const fillSelect = (element, optionsList) => {
  element.innerHTML = "";
  optionsList.forEach((option) => {
    const optElement = document.createElement("option");
    optElement.value = option.value;
    optElement.textContent = option.label;
    element.appendChild(optElement);
  });
};

/**
 * Creates a table cell with text content
 * @param {string} text - Text content for the cell
 * @returns {Element} Table cell element
 */
const createTableCell = (text) => {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
};

/**
 * Creates a button element with text and click handler
 * @param {string} text - Button text
 * @param {Function} clickHandler - Click event handler
 * @returns {Element} Button element
 */
const createButton = (text, clickHandler) => {
  const button = document.createElement("button");
  button.textContent = text;
  button.addEventListener("click", clickHandler);
  return button;
};

/**
 * Configuration constants
 */
const OPTIONS = {
  recurrence: [
    { value: "single", label: "Single" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "annual", label: "Annual" }
  ],
  weekdays: [
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
    { value: 7, label: "Sun" }
  ],
  months: [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ],
  currencies: [
    { value: "BRL", label: "BRL" },
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" }
  ],
  dateFormats: [
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY" }
  ]
};

/**
 * Global state for editing operations
 */
const editingState = {
  expenseId: null,
  incomeId: null,
  cardId: null
};

/**
 * Recurrence helper functions
 */

/**
 * Builds recurrence object based on type and parameters
 * @param {string} type - Recurrence type
 * @param {Object} params - Recurrence parameters
 * @param {number} params.weekday - Weekday for weekly recurrence
 * @param {number} params.day - Day for monthly recurrence
 * @param {number} params.month - Month for annual recurrence
 * @param {number} params.dayAnnual - Day for annual recurrence
 * @returns {Object} Recurrence configuration object
 */
const buildRecurrence = (type, { weekday, day, month, dayAnnual }) => {
  switch (type) {
    case "weekly":
      return { type, weekday };
    case "monthly":
      return { type, day };
    case "annual":
      return { type, month, day: dayAnnual };
    default:
      return { type: "single" };
  }
};

/**
 * Toggles visibility of recurrence-specific form fields
 * @param {string} prefix - Form field prefix (expense/income)
 */
const toggleRecurrenceFields = (prefix) => {
  const recurrenceType = q(`#${prefix}Recurrence`).value;

  const fieldMappings = {
    single: `#${prefix}DueDateWrap, #${prefix}ReceiveDateWrap`,
    weekly: `#${prefix}WeeklyWrap`,
    monthly: `#${prefix}MonthlyWrap`,
    annual: `#${prefix}AnnualWrap`
  };

  Object.entries(fieldMappings).forEach(([type, selector]) => {
    const elements = selector
      .split(", ")
      .map((s) => q(s))
      .filter(Boolean);
    elements.forEach((element) => {
      element.style.display = type === recurrenceType ? "block" : "none";
    });
  });
};

/**
 * Dashboard functions
 */

/**
 * Loads and displays dashboard data
 */
const loadDashboard = async () => {
  const response = await window.cashmoo.dashboardSummary();

  if (!response.ok) return;

  if (response.empty) {
    showEmptyDashboard();
    return;
  }

  showPopulatedDashboard(response);
};

/**
 * Shows empty dashboard with tutorial
 */
const showEmptyDashboard = () => {
  q("#tutorial").style.display = "block";
  q("#dashboard").style.display = "none";
};

/**
 * Shows populated dashboard with data
 * @param {Object} data - Dashboard data
 */
const showPopulatedDashboard = (data) => {
  q("#tutorial").style.display = "none";
  q("#dashboard").style.display = "block";

  updateFinancialSummary(data);
  updateDistributionTable(data.distribution);
  updateHealthIndicators(data.health);
  updateSuggestionsList(data.suggestions);
  updateCardsUsageTable(data.cardsUsage);
};

/**
 * Updates financial summary section
 * @param {Object} data - Dashboard data
 */
const updateFinancialSummary = (data) => {
  q("#dashboardBalance").textContent = data.balance.toFixed(2);
  q("#dashboardProjection").textContent = data.monthlyProjection.toFixed(2);
};

/**
 * Updates distribution table
 * @param {Array} distribution - Distribution data
 */
const updateDistributionTable = (distribution) => {
  const tableBody = q("#dashboardDistributionBody");
  tableBody.innerHTML = "";

  distribution.forEach((item) => {
    const row = document.createElement("tr");
    row.appendChild(createTableCell(item.type));
    row.appendChild(createTableCell(item.amount.toFixed(2)));
    tableBody.appendChild(row);
  });
};

/**
 * Updates health indicators section
 * @param {Object} health - Health indicators data
 */
const updateHealthIndicators = (health) => {
  q("#healthSavingRate").textContent = `${health.savingRate}%`;
  q("#healthCreditUse").textContent = `${health.creditUse}%`;
  q("#healthNetBalance").textContent = health.netBalance.toFixed(2);
};

/**
 * Updates suggestions list
 * @param {Array} suggestions - Array of suggestion strings
 */
const updateSuggestionsList = (suggestions) => {
  const suggestionsList = q("#suggestionsList");
  suggestionsList.innerHTML = "";

  suggestions.forEach((suggestion) => {
    const listItem = document.createElement("li");
    listItem.textContent = suggestion;
    suggestionsList.appendChild(listItem);
  });
};

/**
 * Updates cards usage table
 * @param {Array} cardsUsage - Cards usage data
 */
const updateCardsUsageTable = (cardsUsage) => {
  const tableBody = q("#cardsUsageBody");
  if (!tableBody) return;

  tableBody.innerHTML = "";
  cardsUsage.forEach((card) => {
    const row = document.createElement("tr");
    row.appendChild(createTableCell(card.name));
    row.appendChild(createTableCell(card.limit.toFixed(2)));
    row.appendChild(createTableCell(card.used.toFixed(2)));
    row.appendChild(createTableCell(card.available.toFixed(2)));
    tableBody.appendChild(row);
  });
};

/**
 * Setup functions
 */

/**
 * Initializes setup form
 */
const initSetup = () => {
  fillSelect(q("#setupCurrency"), OPTIONS.currencies);
  fillSelect(q("#setupDateFormat"), OPTIONS.dateFormats);

  q("#setupForm").addEventListener("submit", handleSetupSubmit);
};

/**
 * Handles setup form submission
 * @param {Event} event - Form submit event
 */
const handleSetupSubmit = async (event) => {
  event.preventDefault();

  const payload = {
    userName: q("#setupUserName").value.trim(),
    currency: q("#setupCurrency").value,
    dateFormat: q("#setupDateFormat").value,
    notificationsEnabled: q("#setupNotifications").checked
  };

  const response = await window.cashmoo.setupSave(payload);

  if (!response.ok) {
    showError(q("#setupError"), response.error);
    return;
  }

  location.href = "index.html";
};

/**
 * Expense management functions
 */

/**
 * Initializes expense management
 */
const initExpenses = async () => {
  setupExpenseForm();
  await fillExpensesTable();

  q("#expenseForm").addEventListener("submit", handleExpenseSubmit);
};

/**
 * Sets up expense form fields and event listeners
 */
const setupExpenseForm = () => {
  fillSelect(q("#expenseRecurrence"), OPTIONS.recurrence);
  fillSelect(q("#expenseWeekday"), OPTIONS.weekdays);
  fillSelect(q("#expenseMonth"), OPTIONS.months);

  fillExpenseCardsSelect();
  toggleExpenseRecurrenceFields();
  toggleExpensePaymentFields();

  q("#expenseRecurrence").addEventListener("change", toggleExpenseRecurrenceFields);
  q("#expensePayment").addEventListener("change", toggleExpensePaymentFields);
};

/**
 * Toggles expense recurrence fields visibility
 */
const toggleExpenseRecurrenceFields = () => {
  toggleRecurrenceFields("expense");
};

/**
 * Toggles expense payment method fields visibility
 */
const toggleExpensePaymentFields = () => {
  const paymentMethod = q("#expensePayment").value;
  q("#expenseCardWrap").style.display = paymentMethod === "card" ? "block" : "none";
};

/**
 * Fills expense cards select dropdown
 */
const fillExpenseCardsSelect = async () => {
  const response = await window.cashmoo.listCards();
  const selectElement = q("#expenseCard");
  selectElement.innerHTML = "";

  response.items.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.id;
    option.textContent = card.name;
    selectElement.appendChild(option);
  });
};

/**
 * Handles expense form submission
 * @param {Event} event - Form submit event
 */
const handleExpenseSubmit = async (event) => {
  event.preventDefault();

  const formData = collectExpenseFormData();
  const response = editingState.expenseId ? await window.cashmoo.updateExpense({ id: editingState.expenseId, update: formData }) : await window.cashmoo.addExpense(formData);

  if (!response.ok) {
    showError(q("#expenseError"), response.error);
    return;
  }

  resetExpenseForm();
  await fillExpensesTable();
};

/**
 * Collects expense form data
 * @returns {Object} Expense form data
 */
const collectExpenseFormData = () => {
  const recurrenceType = q("#expenseRecurrence").value;
  const recurrence = buildRecurrence(recurrenceType, {
    weekday: parseInt(q("#expenseWeekday").value, 10),
    day: parseInt(q("#expenseDay").value, 10),
    month: parseInt(q("#expenseMonth").value, 10),
    dayAnnual: parseInt(q("#expenseDayAnnual").value, 10)
  });

  return {
    name: q("#expenseName").value.trim(),
    description: q("#expenseDescription").value.trim(),
    amount: q("#expenseAmount").value.trim(),
    recurrence,
    paymentMethod: q("#expensePayment").value,
    dueDate: recurrenceType === "single" ? q("#expenseDueDate").value : undefined,
    cardId: q("#expensePayment").value === "card" ? q("#expenseCard").value : undefined
  };
};

/**
 * Resets expense form to initial state
 */
const resetExpenseForm = () => {
  editingState.expenseId = null;
  q("#expenseSubmit").textContent = "Add expense";
  q("#expenseForm").reset();
  setupExpenseForm();
};

/**
 * Fills expenses table with data
 */
const fillExpensesTable = async () => {
  const response = await window.cashmoo.listExpenses();
  const tableBody = q("#expensesBody");
  tableBody.innerHTML = "";

  response.items.forEach((expense) => {
    const row = createExpenseTableRow(expense);
    tableBody.appendChild(row);
  });
};

/**
 * Creates a table row for an expense
 * @param {Object} expense - Expense data
 * @returns {Element} Table row element
 */
const createExpenseTableRow = (expense) => {
  const row = document.createElement("tr");

  row.appendChild(createTableCell(expense.name));
  row.appendChild(createTableCell(expense.amount));
  row.appendChild(createTableCell(expense.recurrence.type));
  row.appendChild(createTableCell(expense.paymentMethod));
  row.appendChild(createTableCell(expense.recurrence.type === "single" ? expense.dueDate : "-"));
  row.appendChild(createTableCell(expense.paymentMethod === "card" ? expense.cardId : "-"));

  const actionsCell = createExpenseActionButtons(expense);
  row.appendChild(actionsCell);

  return row;
};

/**
 * Creates action buttons for expense row
 * @param {Object} expense - Expense data
 * @returns {Element} Table cell with action buttons
 */
const createExpenseActionButtons = (expense) => {
  const cell = document.createElement("td");

  const statusButton = createButton(expense.status === "paid" ? "Mark unpaid" : "Mark paid", async () => {
    const newStatus = expense.status === "paid" ? "unpaid" : "paid";
    await window.cashmoo.setExpenseStatus({ id: expense.id, status: newStatus });
    fillExpensesTable();
  });

  const editButton = createButton("Edit", () => editExpense(expense));

  const deleteButton = createButton("Delete", async () => {
    const response = await window.cashmoo.removeExpense({ id: expense.id });
    if (!response.ok) {
      showError(q("#expenseError"), response.error);
    }
    fillExpensesTable();
  });

  cell.appendChild(statusButton);
  cell.appendChild(editButton);
  cell.appendChild(deleteButton);

  return cell;
};

/**
 * Populates form for editing an expense
 * @param {Object} expense - Expense data to edit
 */
const editExpense = (expense) => {
  editingState.expenseId = expense.id;

  q("#expenseName").value = expense.name || "";
  q("#expenseDescription").value = expense.description || "";
  q("#expenseAmount").value = expense.amount || "";
  q("#expenseRecurrence").value = expense.recurrence.type;

  toggleExpenseRecurrenceFields();
  populateExpenseRecurrenceFields(expense);

  q("#expensePayment").value = expense.paymentMethod;
  toggleExpensePaymentFields();

  if (expense.paymentMethod === "card") {
    q("#expenseCard").value = expense.cardId || "";
  }

  q("#expenseSubmit").textContent = "Save changes";
};

/**
 * Populates expense recurrence fields based on type
 * @param {Object} expense - Expense data
 */
const populateExpenseRecurrenceFields = (expense) => {
  const { recurrence } = expense;

  switch (recurrence.type) {
    case "single":
      q("#expenseDueDate").value = expense.dueDate || "";
      break;
    case "weekly":
      q("#expenseWeekday").value = recurrence.weekday;
      break;
    case "monthly":
      q("#expenseDay").value = recurrence.day;
      break;
    case "annual":
      q("#expenseMonth").value = recurrence.month;
      q("#expenseDayAnnual").value = recurrence.day;
      break;
  }
};

/**
 * Income management functions
 */

/**
 * Initializes income management
 */
const initIncomes = async () => {
  setupIncomeForm();
  await fillIncomesTable();

  q("#incomeForm").addEventListener("submit", handleIncomeSubmit);
};

/**
 * Sets up income form fields and event listeners
 */
const setupIncomeForm = () => {
  fillSelect(q("#incomeRecurrence"), OPTIONS.recurrence);
  fillSelect(q("#incomeWeekday"), OPTIONS.weekdays);
  fillSelect(q("#incomeMonth"), OPTIONS.months);

  toggleIncomeRecurrenceFields();
  q("#incomeRecurrence").addEventListener("change", toggleIncomeRecurrenceFields);
};

/**
 * Toggles income recurrence fields visibility
 */
const toggleIncomeRecurrenceFields = () => {
  toggleRecurrenceFields("income");
};

/**
 * Handles income form submission
 * @param {Event} event - Form submit event
 */
const handleIncomeSubmit = async (event) => {
  event.preventDefault();

  const formData = collectIncomeFormData();
  const response = editingState.incomeId ? await window.cashmoo.updateIncome({ id: editingState.incomeId, update: formData }) : await window.cashmoo.addIncome(formData);

  if (!response.ok) {
    showError(q("#incomeError"), response.error);
    return;
  }

  resetIncomeForm();
  await fillIncomesTable();
};

/**
 * Collects income form data
 * @returns {Object} Income form data
 */
const collectIncomeFormData = () => {
  const recurrenceType = q("#incomeRecurrence").value;
  const recurrence = buildRecurrence(recurrenceType, {
    weekday: parseInt(q("#incomeWeekday").value, 10),
    day: parseInt(q("#incomeDay").value, 10),
    month: parseInt(q("#incomeMonth").value, 10),
    dayAnnual: parseInt(q("#incomeDayAnnual").value, 10)
  });

  return {
    name: q("#incomeName").value.trim(),
    description: q("#incomeDescription").value.trim(),
    company: q("#incomeCompany").value.trim(),
    amount: q("#incomeAmount").value.trim(),
    recurrence,
    receiveDate: recurrenceType === "single" ? q("#incomeReceiveDate").value : undefined
  };
};

/**
 * Resets income form to initial state
 */
const resetIncomeForm = () => {
  editingState.incomeId = null;
  q("#incomeSubmit").textContent = "Add income";
  q("#incomeForm").reset();
  setupIncomeForm();
};

/**
 * Fills incomes table with data
 */
const fillIncomesTable = async () => {
  const response = await window.cashmoo.listIncomes();
  const tableBody = q("#incomesBody");
  tableBody.innerHTML = "";

  response.items.forEach((income) => {
    const row = createIncomeTableRow(income);
    tableBody.appendChild(row);
  });
};

/**
 * Creates a table row for an income
 * @param {Object} income - Income data
 * @returns {Element} Table row element
 */
const createIncomeTableRow = (income) => {
  const row = document.createElement("tr");

  row.appendChild(createTableCell(income.name));
  row.appendChild(createTableCell(income.amount));
  row.appendChild(createTableCell(income.recurrence.type));
  row.appendChild(createTableCell(formatIncomeSchedule(income)));

  const actionsCell = createIncomeActionButtons(income);
  row.appendChild(actionsCell);

  return row;
};

/**
 * Formats income schedule display text
 * @param {Object} income - Income data
 * @returns {string} Formatted schedule text
 */
const formatIncomeSchedule = (income) => {
  const { recurrence } = income;

  switch (recurrence.type) {
    case "single":
      return income.receiveDate || "-";
    case "weekly":
      return `D${recurrence.weekday}`;
    case "monthly":
      return `${recurrence.day}`;
    case "annual":
      return `${recurrence.day}/${recurrence.month}`;
    default:
      return "-";
  }
};

/**
 * Creates action buttons for income row
 * @param {Object} income - Income data
 * @returns {Element} Table cell with action buttons
 */
const createIncomeActionButtons = (income) => {
  const cell = document.createElement("td");

  const statusButton = createButton(income.status === "confirmed" ? "Mark pending" : "Mark confirmed", async () => {
    const newStatus = income.status === "confirmed" ? "pending" : "confirmed";
    await window.cashmoo.setIncomeStatus({ id: income.id, status: newStatus });
    fillIncomesTable();
  });

  const editButton = createButton("Edit", () => editIncome(income));

  const deleteButton = createButton("Delete", async () => {
    const response = await window.cashmoo.removeIncome({ id: income.id });
    if (!response.ok) {
      showError(q("#incomeError"), response.error);
    }
    fillIncomesTable();
  });

  cell.appendChild(statusButton);
  cell.appendChild(editButton);
  cell.appendChild(deleteButton);

  return cell;
};

/**
 * Populates form for editing an income
 * @param {Object} income - Income data to edit
 */
const editIncome = (income) => {
  editingState.incomeId = income.id;

  q("#incomeName").value = income.name || "";
  q("#incomeDescription").value = income.description || "";
  q("#incomeCompany").value = income.company || "";
  q("#incomeAmount").value = income.amount || "";
  q("#incomeRecurrence").value = income.recurrence.type;

  toggleIncomeRecurrenceFields();
  populateIncomeRecurrenceFields(income);

  q("#incomeSubmit").textContent = "Save changes";
};

/**
 * Populates income recurrence fields based on type
 * @param {Object} income - Income data
 */
const populateIncomeRecurrenceFields = (income) => {
  const { recurrence } = income;

  switch (recurrence.type) {
    case "single":
      q("#incomeReceiveDate").value = income.receiveDate || "";
      break;
    case "weekly":
      q("#incomeWeekday").value = recurrence.weekday;
      break;
    case "monthly":
      q("#incomeDay").value = recurrence.day;
      break;
    case "annual":
      q("#incomeMonth").value = recurrence.month;
      q("#incomeDayAnnual").value = recurrence.day;
      break;
  }
};

/**
 * Card management functions
 */

/**
 * Initializes card management
 */
const initCards = async () => {
  await fillCardsTable();
  q("#cardForm").addEventListener("submit", handleCardSubmit);
};

/**
 * Handles card form submission
 * @param {Event} event - Form submit event
 */
const handleCardSubmit = async (event) => {
  event.preventDefault();

  const formData = collectCardFormData();
  const response = editingState.cardId ? await window.cashmoo.updateCard({ id: editingState.cardId, update: formData }) : await window.cashmoo.addCard(formData);

  if (!response.ok) {
    showError(q("#cardError"), response.error);
    return;
  }

  resetCardForm();
  await fillCardsTable();
};

/**
 * Collects card form data
 * @returns {Object} Card form data
 */
const collectCardFormData = () => ({
  name: q("#cardName").value.trim(),
  description: q("#cardDescription").value.trim(),
  limit: q("#cardLimit").value.trim(),
  closingDay: parseInt(q("#cardClosingDay").value, 10),
  paymentDay: parseInt(q("#cardPaymentDay").value, 10)
});

/**
 * Resets card form to initial state
 */
const resetCardForm = () => {
  editingState.cardId = null;
  q("#cardSubmit").textContent = "Add card";
  q("#cardForm").reset();
};

/**
 * Fills cards table with data
 */
const fillCardsTable = async () => {
  const response = await window.cashmoo.listCards();
  const tableBody = q("#cardsBody");
  tableBody.innerHTML = "";

  response.items.forEach((card) => {
    const row = createCardTableRow(card);
    tableBody.appendChild(row);
  });
};

/**
 * Creates a table row for a card
 * @param {Object} card - Card data
 * @returns {Element} Table row element
 */
const createCardTableRow = (card) => {
  const row = document.createElement("tr");

  row.appendChild(createTableCell(card.name));
  row.appendChild(createTableCell(card.limit));
  row.appendChild(createTableCell(card.closingDay));
  row.appendChild(createTableCell(card.paymentDay));

  const actionsCell = createCardActionButtons(card);
  row.appendChild(actionsCell);

  return row;
};

/**
 * Creates action buttons for card row
 * @param {Object} card - Card data
 * @returns {Element} Table cell with action buttons
 */
const createCardActionButtons = (card) => {
  const cell = document.createElement("td");

  const editButton = createButton("Edit", () => editCard(card));

  const deleteButton = createButton("Delete", async () => {
    const response = await window.cashmoo.removeCard({ id: card.id });
    if (!response.ok) {
      showError(q("#cardError"), response.error);
    }
    fillCardsTable();
  });

  cell.appendChild(editButton);
  cell.appendChild(deleteButton);

  return cell;
};

/**
 * Populates form for editing a card
 * @param {Object} card - Card data to edit
 */
const editCard = (card) => {
  editingState.cardId = card.id;

  q("#cardName").value = card.name || "";
  q("#cardDescription").value = card.description || "";
  q("#cardLimit").value = card.limit || "";
  q("#cardClosingDay").value = card.closingDay || "";
  q("#cardPaymentDay").value = card.paymentDay || "";

  q("#cardSubmit").textContent = "Save changes";
};

/**
 * Goal management functions
 */

/**
 * Initializes goal management
 */
const initGoals = async () => {
  await fillGoalsTable();
  q("#goalForm").addEventListener("submit", handleGoalSubmit);
};

/**
 * Handles goal form submission
 * @param {Event} event - Form submit event
 */
const handleGoalSubmit = async (event) => {
  event.preventDefault();

  const formData = collectGoalFormData();
  const response = await window.cashmoo.addGoal(formData);

  if (!response.ok) {
    showError(q("#goalError"), response.error);
    return;
  }

  q("#goalForm").reset();
  await fillGoalsTable();
};

/**
 * Collects goal form data
 * @returns {Object} Goal form data
 */
const collectGoalFormData = () => ({
  title: q("#goalTitle").value.trim(),
  target: q("#goalTarget").value.trim(),
  period: q("#goalPeriod").value
});

/**
 * Fills goals table with data
 */
const fillGoalsTable = async () => {
  const response = await window.cashmoo.listGoals();
  const tableBody = q("#goalsBody");
  tableBody.innerHTML = "";

  response.items.forEach((goal) => {
    const row = createGoalTableRow(goal);
    tableBody.appendChild(row);
  });
};

/**
 * Creates a table row for a goal
 * @param {Object} goal - Goal data
 * @returns {Element} Table row element
 */
const createGoalTableRow = (goal) => {
  const row = document.createElement("tr");

  row.appendChild(createTableCell(goal.title));
  row.appendChild(createTableCell(goal.target));
  row.appendChild(createTableCell(goal.period));

  const actionsCell = document.createElement("td");
  const deleteButton = createButton("Delete", async () => {
    await window.cashmoo.removeGoal({ id: goal.id });
    fillGoalsTable();
  });

  actionsCell.appendChild(deleteButton);
  row.appendChild(actionsCell);

  return row;
};

/**
 * Notification settings functions
 */

/**
 * Initializes notification settings
 */
const initNotifications = async () => {
  await loadNotificationSettings();
  q("#notificationsForm").addEventListener("submit", handleNotificationSubmit);
};

/**
 * Loads current notification settings
 */
const loadNotificationSettings = async () => {
  const response = await window.cashmoo.getNotifications();
  if (!response?.ok || !response.settings) return;

  q("#notificationsEnabled").checked = !!response.settings.enabled;
  q("#alertsDue").checked = !!response.settings.alertsDue;
  q("#alertsGoals").checked = !!response.settings.alertsGoals;
};

/**
 * Handles notification form submission
 * @param {Event} event - Form submit event
 */
const handleNotificationSubmit = async (event) => {
  event.preventDefault();

  const formData = collectNotificationFormData();
  const response = await window.cashmoo.updateNotifications(formData);

  if (!response.ok) {
    showError(q("#notificationsError"), response.error);
  }
};

/**
 * Collects notification form data
 * @returns {Object} Notification form data
 */
const collectNotificationFormData = () => ({
  enabled: q("#notificationsEnabled").checked,
  alertsDue: q("#alertsDue").checked,
  alertsGoals: q("#alertsGoals").checked
});

/**
 * Settings functions
 */

/**
 * Initializes application settings
 */
const initSettings = async () => {
  await loadApplicationSettings();
  setupSettingsEventListeners();
  q("#settingsForm").addEventListener("submit", handleSettingsSubmit);
};

/**
 * Loads current application settings
 */
const loadApplicationSettings = async () => {
  const response = await window.cashmoo.getSettings();
  if (!response.ok) return;

  q("#settingsUserName").value = response.settings.userName;
  q("#settingsCurrency").value = response.settings.currency;
  q("#settingsDateFormat").value = response.settings.dateFormat;
};

/**
 * Sets up settings page event listeners
 */
const setupSettingsEventListeners = () => {
  q("#exportBtn").addEventListener("click", handleDataExport);
  q("#importBtn").addEventListener("click", handleDataImport);
  q("#resetBtn").addEventListener("click", handleDataReset);
};

/**
 * Handles data export operation
 */
const handleDataExport = async () => {
  await window.cashmoo.exportData();
};

/**
 * Handles data import operation
 */
const handleDataImport = async () => {
  const response = await window.cashmoo.importData();
  if (!response.ok) {
    showError(q("#settingsError"), response.error);
    return;
  }
  location.reload();
};

/**
 * Handles data reset operation
 */
const handleDataReset = async () => {
  await window.cashmoo.resetApp();
};

/**
 * Handles settings form submission
 * @param {Event} event - Form submit event
 */
const handleSettingsSubmit = async (event) => {
  event.preventDefault();

  const formData = collectSettingsFormData();
  const response = await window.cashmoo.updateSettings(formData);

  if (!response.ok) {
    showError(q("#settingsError"), response.error);
  }
};

/**
 * Collects settings form data
 * @returns {Object} Settings form data
 */
const collectSettingsFormData = () => ({
  userName: q("#settingsUserName").value.trim(),
  currency: q("#settingsCurrency").value,
  dateFormat: q("#settingsDateFormat").value
});

/**
 * Main initialization function
 * Determines which page components to initialize based on DOM elements
 */
window.addEventListener("DOMContentLoaded", async () => {
  const pageInitializers = [
    { selector: "#dashboardBalance", initializer: loadDashboard },
    { selector: "#setupUserName", initializer: initSetup },
    { selector: "#expenseForm", initializer: initExpenses },
    { selector: "#incomeForm", initializer: initIncomes },
    { selector: "#cardForm", initializer: initCards },
    { selector: "#goalForm", initializer: initGoals },
    { selector: "#notificationsForm", initializer: initNotifications },
    { selector: "#settingsForm", initializer: initSettings }
  ];

  for (const { selector, initializer } of pageInitializers) {
    if (q(selector)) {
      await initializer();
    }
  }
});

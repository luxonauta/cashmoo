/**
 * Main renderer script for CashMoo application
 * Handles all UI interactions and form management
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
  if (node) node.textContent = text || "";
};

/**
 * Fills a select element with options
 * @param {Element} element - Select element to populate
 * @param {Array<{value: string, label: string}>} optionsList - Array of option objects
 */
const fillSelect = (element, optionsList) => {
  if (!element) return;
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
 * @returns {HTMLTableCellElement} Table cell element
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
 * @returns {HTMLButtonElement} Button element
 */
const createButton = (text, clickHandler) => {
  const button = document.createElement("button");
  button.textContent = text;
  button.type = "button";
  button.className = "button-secondary";
  button.addEventListener("click", clickHandler);
  return button;
};

/**
 * Configuration constants for form options
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
 * Builds recurrence object based on type and parameters
 * @param {string} type - Recurrence type (single, weekly, monthly, annual)
 * @param {Object} params - Recurrence parameters
 * @param {number} params.weekday - Weekday for weekly recurrence (1-7)
 * @param {number} params.day - Day for monthly recurrence (1-30)
 * @param {number} params.month - Month for annual recurrence (1-12)
 * @param {number} params.dayAnnual - Day for annual recurrence (1-30)
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
  const recurrenceType = q(`#${prefix}-recurrence`)?.value;
  if (!recurrenceType) return;

  const fieldMappings = {
    single: `#${prefix}-due-date-wrap, #${prefix}-receive-date-wrap`,
    weekly: `#${prefix}-weekly-wrap`,
    monthly: `#${prefix}-monthly-wrap`,
    annual: `#${prefix}-annual-wrap`
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
 * Dashboard Functions
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
  const tutorial = q("#tutorial");
  const dashboard = q("#dashboard");
  if (tutorial) tutorial.style.display = "block";
  if (dashboard) dashboard.style.display = "none";
};

/**
 * Shows populated dashboard with data
 * @param {Object} data - Dashboard data
 */
const showPopulatedDashboard = (data) => {
  const tutorial = q("#tutorial");
  const dashboard = q("#dashboard");
  if (tutorial) tutorial.style.display = "none";
  if (dashboard) dashboard.style.display = "block";

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
  const balance = q("#dashboard-balance");
  const projection = q("#dashboard-projection");
  if (balance) balance.textContent = data.balance.toFixed(2);
  if (projection) projection.textContent = data.monthlyProjection.toFixed(2);
};

/**
 * Updates distribution table
 * @param {Array<{type: string, amount: number}>} distribution - Distribution data
 */
const updateDistributionTable = (distribution) => {
  const tableBody = q("#dashboard-distribution-body");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  distribution.forEach((item) => {
    const listItem = document.createElement("div");
    listItem.className = "list-item";

    const content = document.createElement("div");
    content.className = "list-item-content";

    const title = document.createElement("div");
    title.className = "list-item-title";
    title.textContent = item.type;

    const accessory = document.createElement("div");
    accessory.className = "list-item-accessory";
    accessory.textContent = item.amount.toFixed(2);

    content.appendChild(title);
    listItem.appendChild(content);
    listItem.appendChild(accessory);
    tableBody.appendChild(listItem);
  });
};

/**
 * Updates health indicators section
 * @param {Object} health - Health indicators data
 * @param {number} health.savingRate - Saving rate percentage
 * @param {number} health.creditUse - Credit usage percentage
 * @param {number} health.netBalance - Net balance amount
 */
const updateHealthIndicators = (health) => {
  const savingRate = q("#health-saving-rate");
  const creditUse = q("#health-credit-use");
  const netBalance = q("#health-net-balance");

  if (savingRate) savingRate.textContent = `${health.savingRate}%`;
  if (creditUse) creditUse.textContent = `${health.creditUse}%`;
  if (netBalance) netBalance.textContent = health.netBalance.toFixed(2);
};

/**
 * Updates suggestions list
 * @param {Array<string>} suggestions - Array of suggestion strings
 */
const updateSuggestionsList = (suggestions) => {
  const suggestionsList = q("#suggestions-list");
  if (!suggestionsList) return;

  suggestionsList.innerHTML = "";

  suggestions.forEach((suggestion) => {
    const listItem = document.createElement("div");
    listItem.className = "list-item";

    const content = document.createElement("div");
    content.className = "list-item-content";

    const title = document.createElement("div");
    title.className = "list-item-title";
    title.textContent = suggestion;

    content.appendChild(title);
    listItem.appendChild(content);
    suggestionsList.appendChild(listItem);
  });
};

/**
 * Updates cards usage table
 * @param {Array<Object>} cardsUsage - Cards usage data
 */
const updateCardsUsageTable = (cardsUsage) => {
  const tableBody = q("#cards-usage-body");
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
 * Setup Functions
 */

/**
 * Initializes setup form
 */
const initSetup = () => {
  fillSelect(q("#setup-currency"), OPTIONS.currencies);
  fillSelect(q("#setup-date-format"), OPTIONS.dateFormats);

  const form = q("#setup-form");
  if (form) {
    form.addEventListener("submit", handleSetupSubmit);
  }
};

/**
 * Handles setup form submission
 * @param {Event} event - Form submit event
 */
const handleSetupSubmit = async (event) => {
  event.preventDefault();

  const payload = {
    userName: q("#setup-user-name")?.value.trim(),
    currency: q("#setup-currency")?.value,
    dateFormat: q("#setup-date-format")?.value,
    notificationsEnabled: q("#setup-notifications")?.checked
  };

  const response = await window.cashmoo.setupSave(payload);

  if (!response.ok) {
    showError(q("#setup-error"), response.error);
    return;
  }

  location.href = "index.html";
};

/**
 * Expense Management Functions
 */

/**
 * Initializes expense management
 */
const initExpenses = async () => {
  setupExpenseForm();
  await fillExpensesTable();

  const form = q("#expense-form");
  if (form) {
    form.addEventListener("submit", handleExpenseSubmit);
  }
};

/**
 * Sets up expense form fields and event listeners
 */
const setupExpenseForm = () => {
  fillSelect(q("#expense-recurrence"), OPTIONS.recurrence);
  fillSelect(q("#expense-weekday"), OPTIONS.weekdays);
  fillSelect(q("#expense-month"), OPTIONS.months);

  fillExpenseCardsSelect();
  toggleExpenseRecurrenceFields();
  toggleExpensePaymentFields();

  const recurrence = q("#expense-recurrence");
  const payment = q("#expense-payment");

  if (recurrence) recurrence.addEventListener("change", toggleExpenseRecurrenceFields);
  if (payment) payment.addEventListener("change", toggleExpensePaymentFields);
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
  const paymentMethod = q("#expense-payment")?.value;
  const cardWrap = q("#expense-card-wrap");
  if (cardWrap) {
    cardWrap.style.display = paymentMethod === "card" ? "block" : "none";
  }
};

/**
 * Fills expense cards select dropdown
 */
const fillExpenseCardsSelect = async () => {
  const response = await window.cashmoo.listCards();
  const selectElement = q("#expense-card");
  if (!selectElement) return;

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
    showError(q("#expense-error"), response.error);
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
  const recurrenceType = q("#expense-recurrence")?.value;
  const recurrence = buildRecurrence(recurrenceType, {
    weekday: parseInt(q("#expense-weekday")?.value, 10),
    day: parseInt(q("#expense-day")?.value, 10),
    month: parseInt(q("#expense-month")?.value, 10),
    dayAnnual: parseInt(q("#expense-day-annual")?.value, 10)
  });

  return {
    name: q("#expense-name")?.value.trim(),
    description: q("#expense-description")?.value.trim(),
    amount: q("#expense-amount")?.value.trim(),
    recurrence,
    paymentMethod: q("#expense-payment")?.value,
    dueDate: recurrenceType === "single" ? q("#expense-due-date")?.value : undefined,
    cardId: q("#expense-payment")?.value === "card" ? q("#expense-card")?.value : undefined
  };
};

/**
 * Resets expense form to initial state
 */
const resetExpenseForm = () => {
  editingState.expenseId = null;
  const submit = q("#expense-submit");
  if (submit) submit.textContent = "Add Expense";

  const form = q("#expense-form");
  if (form) form.reset();

  setupExpenseForm();
};

/**
 * Fills expenses table with data
 */
const fillExpensesTable = async () => {
  const response = await window.cashmoo.listExpenses();
  const tableBody = q("#expenses-body");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  response.items.forEach((expense) => {
    const row = createExpenseTableRow(expense);
    tableBody.appendChild(row);
  });
};

/**
 * Creates a table row for an expense
 * @param {Object} expense - Expense data
 * @returns {HTMLTableRowElement} Table row element
 */
const createExpenseTableRow = (expense) => {
  const row = document.createElement("tr");

  row.appendChild(createTableCell(expense.name));
  row.appendChild(createTableCell(expense.amount));
  row.appendChild(createTableCell(expense.recurrence.type));
  row.appendChild(createTableCell(expense.paymentMethod));
  row.appendChild(createTableCell(expense.recurrence.type === "single" ? expense.dueDate : "-"));

  const actionsCell = createExpenseActionButtons(expense);
  row.appendChild(actionsCell);

  return row;
};

/**
 * Creates action buttons for expense row
 * @param {Object} expense - Expense data
 * @returns {HTMLTableCellElement} Table cell with action buttons
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
      showError(q("#expense-error"), response.error);
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

  const nameEl = q("#expense-name");
  const descEl = q("#expense-description");
  const amountEl = q("#expense-amount");
  const recurrenceEl = q("#expense-recurrence");
  const paymentEl = q("#expense-payment");
  const submitEl = q("#expense-submit");

  if (nameEl) nameEl.value = expense.name || "";
  if (descEl) descEl.value = expense.description || "";
  if (amountEl) amountEl.value = expense.amount || "";
  if (recurrenceEl) recurrenceEl.value = expense.recurrence.type;

  toggleExpenseRecurrenceFields();
  populateExpenseRecurrenceFields(expense);

  if (paymentEl) paymentEl.value = expense.paymentMethod;
  toggleExpensePaymentFields();

  if (expense.paymentMethod === "card") {
    const cardEl = q("#expense-card");
    if (cardEl) cardEl.value = expense.cardId || "";
  }

  if (submitEl) submitEl.textContent = "Save changes";
};

/**
 * Populates expense recurrence fields based on type
 * @param {Object} expense - Expense data
 */
const populateExpenseRecurrenceFields = (expense) => {
  const { recurrence } = expense;

  switch (recurrence.type) {
    case "single": {
      const dueDateEl = q("#expense-due-date");
      if (dueDateEl) dueDateEl.value = expense.dueDate || "";
      break;
    }
    case "weekly": {
      const weekdayEl = q("#expense-weekday");
      if (weekdayEl) weekdayEl.value = recurrence.weekday;
      break;
    }
    case "monthly": {
      const dayEl = q("#expense-day");
      if (dayEl) dayEl.value = recurrence.day;
      break;
    }
    case "annual": {
      const monthEl = q("#expense-month");
      const dayAnnualEl = q("#expense-day-annual");
      if (monthEl) monthEl.value = recurrence.month;
      if (dayAnnualEl) dayAnnualEl.value = recurrence.day;
      break;
    }
  }
};

/**
 * Income Management Functions
 */

/**
 * Initializes income management
 */
const initIncomes = async () => {
  setupIncomeForm();
  await fillIncomesTable();

  const form = q("#income-form");
  if (form) {
    form.addEventListener("submit", handleIncomeSubmit);
  }
};

/**
 * Sets up income form fields and event listeners
 */
const setupIncomeForm = () => {
  fillSelect(q("#income-recurrence"), OPTIONS.recurrence);
  fillSelect(q("#income-weekday"), OPTIONS.weekdays);
  fillSelect(q("#income-month"), OPTIONS.months);

  toggleIncomeRecurrenceFields();

  const recurrence = q("#income-recurrence");
  if (recurrence) {
    recurrence.addEventListener("change", toggleIncomeRecurrenceFields);
  }
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
    showError(q("#income-error"), response.error);
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
  const recurrenceType = q("#income-recurrence")?.value;
  const recurrence = buildRecurrence(recurrenceType, {
    weekday: parseInt(q("#income-weekday")?.value, 10),
    day: parseInt(q("#income-day")?.value, 10),
    month: parseInt(q("#income-month")?.value, 10),
    dayAnnual: parseInt(q("#income-day-annual")?.value, 10)
  });

  return {
    name: q("#income-name")?.value.trim(),
    description: q("#income-description")?.value.trim(),
    company: q("#income-company")?.value.trim(),
    amount: q("#income-amount")?.value.trim(),
    recurrence,
    receiveDate: recurrenceType === "single" ? q("#income-receive-date")?.value : undefined
  };
};

/**
 * Resets income form to initial state
 */
const resetIncomeForm = () => {
  editingState.incomeId = null;
  const submit = q("#income-submit");
  if (submit) submit.textContent = "Add income";

  const form = q("#income-form");
  if (form) form.reset();

  setupIncomeForm();
};

/**
 * Fills incomes table with data
 */
const fillIncomesTable = async () => {
  const response = await window.cashmoo.listIncomes();
  const tableBody = q("#incomes-body");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  response.items.forEach((income) => {
    const row = createIncomeTableRow(income);
    tableBody.appendChild(row);
  });
};

/**
 * Creates a table row for an income
 * @param {Object} income - Income data
 * @returns {HTMLTableRowElement} Table row element
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
 * @returns {HTMLTableCellElement} Table cell with action buttons
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
      showError(q("#income-error"), response.error);
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

  const nameEl = q("#income-name");
  const descEl = q("#income-description");
  const companyEl = q("#income-company");
  const amountEl = q("#income-amount");
  const recurrenceEl = q("#income-recurrence");
  const submitEl = q("#income-submit");

  if (nameEl) nameEl.value = income.name || "";
  if (descEl) descEl.value = income.description || "";
  if (companyEl) companyEl.value = income.company || "";
  if (amountEl) amountEl.value = income.amount || "";
  if (recurrenceEl) recurrenceEl.value = income.recurrence.type;

  toggleIncomeRecurrenceFields();
  populateIncomeRecurrenceFields(income);

  if (submitEl) submitEl.textContent = "Save changes";
};

/**
 * Populates income recurrence fields based on type
 * @param {Object} income - Income data
 */
const populateIncomeRecurrenceFields = (income) => {
  const { recurrence } = income;

  switch (recurrence.type) {
    case "single": {
      const receiveDateEl = q("#income-receive-date");
      if (receiveDateEl) receiveDateEl.value = income.receiveDate || "";
      break;
    }
    case "weekly": {
      const weekdayEl = q("#income-weekday");
      if (weekdayEl) weekdayEl.value = recurrence.weekday;
      break;
    }
    case "monthly": {
      const dayEl = q("#income-day");
      if (dayEl) dayEl.value = recurrence.day;
      break;
    }
    case "annual": {
      const monthEl = q("#income-month");
      const dayAnnualEl = q("#income-day-annual");
      if (monthEl) monthEl.value = recurrence.month;
      if (dayAnnualEl) dayAnnualEl.value = recurrence.day;
      break;
    }
  }
};

/**
 * Card Management Functions
 */

/**
 * Initializes card management
 */
const initCards = async () => {
  await fillCardsTable();

  const form = q("#card-form");
  if (form) {
    form.addEventListener("submit", handleCardSubmit);
  }
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
    showError(q("#card-error"), response.error);
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
  name: q("#card-name")?.value.trim(),
  description: q("#card-description")?.value.trim(),
  limit: q("#card-limit")?.value.trim(),
  closingDay: parseInt(q("#card-closing-day")?.value, 10),
  paymentDay: parseInt(q("#card-payment-day")?.value, 10)
});

/**
 * Resets card form to initial state
 */
const resetCardForm = () => {
  editingState.cardId = null;
  const submit = q("#card-submit");
  if (submit) submit.textContent = "Add card";

  const form = q("#card-form");
  if (form) form.reset();
};

/**
 * Fills cards table with data
 */
const fillCardsTable = async () => {
  const response = await window.cashmoo.listCards();
  const tableBody = q("#cards-body");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  response.items.forEach((card) => {
    const row = createCardTableRow(card);
    tableBody.appendChild(row);
  });
};

/**
 * Creates a table row for a card
 * @param {Object} card - Card data
 * @returns {HTMLTableRowElement} Table row element
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
 * @returns {HTMLTableCellElement} Table cell with action buttons
 */
const createCardActionButtons = (card) => {
  const cell = document.createElement("td");

  const editButton = createButton("Edit", () => editCard(card));

  const deleteButton = createButton("Delete", async () => {
    const response = await window.cashmoo.removeCard({ id: card.id });
    if (!response.ok) {
      showError(q("#card-error"), response.error);
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

  const nameEl = q("#card-name");
  const descEl = q("#card-description");
  const limitEl = q("#card-limit");
  const closingEl = q("#card-closing-day");
  const paymentEl = q("#card-payment-day");
  const submitEl = q("#card-submit");

  if (nameEl) nameEl.value = card.name || "";
  if (descEl) descEl.value = card.description || "";
  if (limitEl) limitEl.value = card.limit || "";
  if (closingEl) closingEl.value = card.closingDay || "";
  if (paymentEl) paymentEl.value = card.paymentDay || "";

  if (submitEl) submitEl.textContent = "Save changes";
};

/**
 * Goal Management Functions
 */

/**
 * Initializes goal management
 */
const initGoals = async () => {
  await fillGoalsTable();

  const form = q("#goal-form");
  if (form) {
    form.addEventListener("submit", handleGoalSubmit);
  }
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
    showError(q("#goal-error"), response.error);
    return;
  }

  const form = q("#goal-form");
  if (form) form.reset();

  await fillGoalsTable();
};

/**
 * Collects goal form data
 * @returns {Object} Goal form data
 */
const collectGoalFormData = () => ({
  title: q("#goal-title")?.value.trim(),
  target: q("#goal-target")?.value.trim(),
  period: q("#goal-period")?.value
});

/**
 * Fills goals table with data
 */
const fillGoalsTable = async () => {
  const response = await window.cashmoo.listGoals();
  const tableBody = q("#goals-body");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  response.items.forEach((goal) => {
    const row = createGoalTableRow(goal);
    tableBody.appendChild(row);
  });
};

/**
 * Creates a table row for a goal
 * @param {Object} goal - Goal data
 * @returns {HTMLTableRowElement} Table row element
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
 * Notification Settings Functions
 */

/**
 * Initializes notification settings
 */
const initNotifications = async () => {
  await loadNotificationSettings();

  const form = q("#notifications-form");
  if (form) {
    form.addEventListener("submit", handleNotificationSubmit);
  }
};

/**
 * Loads current notification settings
 */
const loadNotificationSettings = async () => {
  const response = await window.cashmoo.getNotifications();
  if (!response?.ok || !response.settings) return;

  const enabledEl = q("#notifications-enabled");
  const dueEl = q("#alerts-due");
  const goalsEl = q("#alerts-goals");

  if (enabledEl) enabledEl.checked = !!response.settings.enabled;
  if (dueEl) dueEl.checked = !!response.settings.alertsDue;
  if (goalsEl) goalsEl.checked = !!response.settings.alertsGoals;
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
    showError(q("#notifications-error"), response.error);
  }
};

/**
 * Collects notification form data
 * @returns {Object} Notification form data
 */
const collectNotificationFormData = () => ({
  enabled: q("#notifications-enabled")?.checked,
  alertsDue: q("#alerts-due")?.checked,
  alertsGoals: q("#alerts-goals")?.checked
});

/**
 * Settings Functions
 */

/**
 * Initializes application settings
 */
const initSettings = async () => {
  await loadApplicationSettings();
  setupSettingsEventListeners();

  const form = q("#settings-form");
  if (form) {
    form.addEventListener("submit", handleSettingsSubmit);
  }
};

/**
 * Loads current application settings
 */
const loadApplicationSettings = async () => {
  const response = await window.cashmoo.getSettings();
  if (!response.ok) return;

  const nameEl = q("#settings-user-name");
  const currencyEl = q("#settings-currency");
  const dateEl = q("#settings-date-format");

  if (nameEl) nameEl.value = response.settings.userName;
  if (currencyEl) currencyEl.value = response.settings.currency;
  if (dateEl) dateEl.value = response.settings.dateFormat;
};

/**
 * Sets up settings page event listeners
 */
const setupSettingsEventListeners = () => {
  const exportBtn = q("#export-btn");
  const importBtn = q("#import-btn");
  const resetBtn = q("#reset-btn");

  if (exportBtn) exportBtn.addEventListener("click", handleDataExport);
  if (importBtn) importBtn.addEventListener("click", handleDataImport);
  if (resetBtn) resetBtn.addEventListener("click", handleDataReset);
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
    showError(q("#settings-error"), response.error);
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
    showError(q("#settings-error"), response.error);
  }
};

/**
 * Collects settings form data
 * @returns {Object} Settings form data
 */
const collectSettingsFormData = () => ({
  userName: q("#settings-user-name")?.value.trim(),
  currency: q("#settings-currency")?.value,
  dateFormat: q("#settings-date-format")?.value
});

/**
 * Main initialization function
 * Determines which page components to initialize based on DOM elements
 */
window.addEventListener("DOMContentLoaded", async () => {
  const pageInitializers = [
    { selector: "#dashboard-balance", initializer: loadDashboard },
    { selector: "#setup-user-name", initializer: initSetup },
    { selector: "#expense-form", initializer: initExpenses },
    { selector: "#income-form", initializer: initIncomes },
    { selector: "#card-form", initializer: initCards },
    { selector: "#goal-form", initializer: initGoals },
    { selector: "#notifications-form", initializer: initNotifications },
    { selector: "#settings-form", initializer: initSettings }
  ];

  for (const { selector, initializer } of pageInitializers) {
    if (q(selector)) {
      await initializer();
    }
  }
});

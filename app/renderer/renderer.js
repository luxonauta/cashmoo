const q = (s) => document.querySelector(s);

let editingExpenseId = null;
let editingIncomeId = null;
let editingCardId = null;

const showError = (node, text) => {
  node.textContent = text || "";
};

const fillSelect = (el, list) => {
  el.innerHTML = "";
  list.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v.value;
    opt.textContent = v.label;
    el.appendChild(opt);
  });
};

const recurrenceOptions = [
  { value: "single", label: "Single" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" }
];

const weekdayOptions = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" }
];

const monthOptions = [
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
];

const currencyOptions = [
  { value: "BRL", label: "BRL" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" }
];

const dateFormatOptions = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" }
];

window.addEventListener("DOMContentLoaded", async () => {
  if (q("#dashboardBalance")) await loadDashboard();
  if (q("#setupUserName")) initSetup();
  if (q("#expenseForm")) initExpenses();
  if (q("#incomeForm")) initIncomes();
  if (q("#cardForm")) initCards();
  if (q("#goalForm")) initGoals();
  if (q("#notificationsForm")) initNotifications();
  if (q("#settingsForm")) initSettings();
});

const loadDashboard = async () => {
  const res = await window.cashmoo.dashboardSummary();
  if (!res.ok) return;
  if (res.empty) {
    q("#tutorial").style.display = "block";
    q("#dashboard").style.display = "none";
    return;
  }
  q("#tutorial").style.display = "none";
  q("#dashboard").style.display = "block";
  q("#dashboardBalance").textContent = res.balance.toFixed(2);
  q("#dashboardProjection").textContent = res.monthlyProjection.toFixed(2);
  const dist = q("#dashboardDistributionBody");
  dist.innerHTML = "";
  res.distribution.forEach((d) => {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    td1.textContent = d.type;
    const td2 = document.createElement("td");
    td2.textContent = d.amount.toFixed(2);
    tr.appendChild(td1);
    tr.appendChild(td2);
    dist.appendChild(tr);
  });
  q("#healthSavingRate").textContent = res.health.savingRate + "%";
  q("#healthCreditUse").textContent = res.health.creditUse + "%";
  q("#healthNetBalance").textContent = res.health.netBalance.toFixed(2);
  const sug = q("#suggestionsList");
  sug.innerHTML = "";
  res.suggestions.forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s;
    sug.appendChild(li);
  });
  const body = q("#cardsUsageBody");
  if (body) {
    body.innerHTML = "";
    res.cardsUsage.forEach((c) => {
      const tr = document.createElement("tr");
      const td1 = document.createElement("td");
      td1.textContent = c.name;
      const td2 = document.createElement("td");
      td2.textContent = c.limit.toFixed(2);
      const td3 = document.createElement("td");
      td3.textContent = c.used.toFixed(2);
      const td4 = document.createElement("td");
      td4.textContent = c.available.toFixed(2);
      tr.appendChild(td1);
      tr.appendChild(td2);
      tr.appendChild(td3);
      tr.appendChild(td4);
      body.appendChild(tr);
    });
  }
};

const initSetup = () => {
  fillSelect(q("#setupCurrency"), currencyOptions);
  fillSelect(q("#setupDateFormat"), dateFormatOptions);
  q("#setupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      userName: q("#setupUserName").value.trim(),
      currency: q("#setupCurrency").value,
      dateFormat: q("#setupDateFormat").value,
      notificationsEnabled: q("#setupNotifications").checked
    };
    const res = await window.cashmoo.setupSave(payload);
    if (!res.ok) {
      showError(q("#setupError"), res.error);
      return;
    }
    location.href = "index.html";
  });
};

const initExpenses = async () => {
  fillSelect(q("#expenseRecurrence"), recurrenceOptions);
  fillSelect(q("#expenseWeekday"), weekdayOptions);
  fillSelect(q("#expenseMonth"), monthOptions);
  fillExpenseCardsSelect();
  toggleExpenseRecurrenceFields();
  toggleExpensePaymentFields();
  q("#expenseRecurrence").addEventListener("change", toggleExpenseRecurrenceFields);
  q("#expensePayment").addEventListener("change", toggleExpensePaymentFields);
  fillExpensesTable();
  q("#expenseForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const recurrenceType = q("#expenseRecurrence").value;
    const recurrence = buildRecurrence(recurrenceType, {
      weekday: parseInt(q("#expenseWeekday").value, 10),
      day: parseInt(q("#expenseDay").value, 10),
      month: parseInt(q("#expenseMonth").value, 10),
      dayAnnual: parseInt(q("#expenseDayAnnual").value, 10)
    });
    const payload = {
      name: q("#expenseName").value.trim(),
      description: q("#expenseDescription").value.trim(),
      amount: q("#expenseAmount").value.trim(),
      recurrence,
      paymentMethod: q("#expensePayment").value,
      dueDate: recurrenceType === "single" ? q("#expenseDueDate").value : undefined,
      cardId: q("#expensePayment").value === "card" ? q("#expenseCard").value : undefined
    };
    let res;
    if (editingExpenseId) {
      res = await window.cashmoo.updateExpense({
        id: editingExpenseId,
        update: payload
      });
    } else {
      res = await window.cashmoo.addExpense(payload);
    }
    if (!res.ok) {
      showError(q("#expenseError"), res.error);
      return;
    }
    editingExpenseId = null;
    q("#expenseSubmit").textContent = "Add expense";
    q("#expenseForm").reset();
    fillSelect(q("#expenseRecurrence"), recurrenceOptions);
    fillSelect(q("#expenseWeekday"), weekdayOptions);
    fillSelect(q("#expenseMonth"), monthOptions);
    fillExpenseCardsSelect();
    toggleExpenseRecurrenceFields();
    toggleExpensePaymentFields();
    fillExpensesTable();
  });
};

const buildRecurrence = (type, { weekday, day, month, dayAnnual }) => {
  if (type === "weekly") return { type, weekday };
  if (type === "monthly") return { type, day };
  if (type === "annual") return { type, month, day: dayAnnual };
  return { type: "single" };
};

const toggleExpenseRecurrenceFields = () => {
  const t = q("#expenseRecurrence").value;
  q("#expenseDueDateWrap").style.display = t === "single" ? "block" : "none";
  q("#expenseWeeklyWrap").style.display = t === "weekly" ? "block" : "none";
  q("#expenseMonthlyWrap").style.display = t === "monthly" ? "block" : "none";
  q("#expenseAnnualWrap").style.display = t === "annual" ? "block" : "none";
};

const toggleExpensePaymentFields = () => {
  const m = q("#expensePayment").value;
  q("#expenseCardWrap").style.display = m === "card" ? "block" : "none";
};

const fillExpenseCardsSelect = async () => {
  const res = await window.cashmoo.listCards();
  const sel = q("#expenseCard");
  sel.innerHTML = "";
  res.items.forEach((i) => {
    const opt = document.createElement("option");
    opt.value = i.id;
    opt.textContent = i.name;
    sel.appendChild(opt);
  });
};

const fillExpensesTable = async () => {
  const res = await window.cashmoo.listExpenses();
  const body = q("#expensesBody");
  body.innerHTML = "";
  res.items.forEach((i) => {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    td1.textContent = i.name;
    const td2 = document.createElement("td");
    td2.textContent = i.amount;
    const td3 = document.createElement("td");
    td3.textContent = i.recurrence.type;
    const td4 = document.createElement("td");
    td4.textContent = i.paymentMethod;
    const td5 = document.createElement("td");
    td5.textContent = i.recurrence.type === "single" ? i.dueDate : "-";
    const td6 = document.createElement("td");
    td6.textContent = i.paymentMethod === "card" ? i.cardId : "-";
    const td7 = document.createElement("td");
    const btnStatus = document.createElement("button");
    btnStatus.textContent = i.status === "paid" ? "Mark unpaid" : "Mark paid";
    btnStatus.addEventListener("click", async () => {
      const status = i.status === "paid" ? "unpaid" : "paid";
      await window.cashmoo.setExpenseStatus({ id: i.id, status });
      fillExpensesTable();
    });
    const btnEdit = document.createElement("button");
    btnEdit.textContent = "Edit";
    btnEdit.addEventListener("click", () => {
      editingExpenseId = i.id;
      q("#expenseName").value = i.name || "";
      q("#expenseDescription").value = i.description || "";
      q("#expenseAmount").value = i.amount || "";
      q("#expenseRecurrence").value = i.recurrence.type;
      toggleExpenseRecurrenceFields();
      if (i.recurrence.type === "single") q("#expenseDueDate").value = i.dueDate || "";
      if (i.recurrence.type === "weekly") q("#expenseWeekday").value = i.recurrence.weekday;
      if (i.recurrence.type === "monthly") q("#expenseDay").value = i.recurrence.day;
      if (i.recurrence.type === "annual") {
        q("#expenseMonth").value = i.recurrence.month;
        q("#expenseDayAnnual").value = i.recurrence.day;
      }
      q("#expensePayment").value = i.paymentMethod;
      toggleExpensePaymentFields();
      if (i.paymentMethod === "card") q("#expenseCard").value = i.cardId || "";
      q("#expenseSubmit").textContent = "Save changes";
    });
    const btnDel = document.createElement("button");
    btnDel.textContent = "Delete";
    btnDel.addEventListener("click", async () => {
      const out = await window.cashmoo.removeExpense({ id: i.id });
      if (!out.ok) showError(q("#expenseError"), out.error);
      fillExpensesTable();
    });
    td7.appendChild(btnStatus);
    td7.appendChild(btnEdit);
    td7.appendChild(btnDel);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tr.appendChild(td4);
    tr.appendChild(td5);
    tr.appendChild(td6);
    tr.appendChild(td7);
    body.appendChild(tr);
  });
};

const initIncomes = async () => {
  fillSelect(q("#incomeRecurrence"), recurrenceOptions);
  fillSelect(q("#incomeWeekday"), weekdayOptions);
  fillSelect(q("#incomeMonth"), monthOptions);
  toggleIncomeRecurrenceFields();
  fillIncomesTable();
  q("#incomeRecurrence").addEventListener("change", toggleIncomeRecurrenceFields);
  q("#incomeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const recurrenceType = q("#incomeRecurrence").value;
    const recurrence = buildRecurrence(recurrenceType, {
      weekday: parseInt(q("#incomeWeekday").value, 10),
      day: parseInt(q("#incomeDay").value, 10),
      month: parseInt(q("#incomeMonth").value, 10),
      dayAnnual: parseInt(q("#incomeDayAnnual").value, 10)
    });
    const payload = {
      name: q("#incomeName").value.trim(),
      description: q("#incomeDescription").value.trim(),
      company: q("#incomeCompany").value.trim(),
      amount: q("#incomeAmount").value.trim(),
      recurrence,
      receiveDate: recurrenceType === "single" ? q("#incomeReceiveDate").value : undefined
    };
    let res;
    if (editingIncomeId) {
      res = await window.cashmoo.updateIncome({
        id: editingIncomeId,
        update: payload
      });
    } else {
      res = await window.cashmoo.addIncome(payload);
    }
    if (!res.ok) {
      showError(q("#incomeError"), res.error);
      return;
    }
    editingIncomeId = null;
    q("#incomeSubmit").textContent = "Add income";
    q("#incomeForm").reset();
    fillSelect(q("#incomeRecurrence"), recurrenceOptions);
    fillSelect(q("#incomeWeekday"), weekdayOptions);
    fillSelect(q("#incomeMonth"), monthOptions);
    toggleIncomeRecurrenceFields();
    fillIncomesTable();
  });
};

const toggleIncomeRecurrenceFields = () => {
  const t = q("#incomeRecurrence").value;
  q("#incomeReceiveDateWrap").style.display = t === "single" ? "block" : "none";
  q("#incomeWeeklyWrap").style.display = t === "weekly" ? "block" : "none";
  q("#incomeMonthlyWrap").style.display = t === "monthly" ? "block" : "none";
  q("#incomeAnnualWrap").style.display = t === "annual" ? "block" : "none";
};

const fillIncomesTable = async () => {
  const res = await window.cashmoo.listIncomes();
  const body = q("#incomesBody");
  body.innerHTML = "";
  res.items.forEach((i) => {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    td1.textContent = i.name;
    const td2 = document.createElement("td");
    td2.textContent = i.amount;
    const td3 = document.createElement("td");
    td3.textContent = i.recurrence.type;
    const td4 = document.createElement("td");
    td4.textContent =
      i.recurrence.type === "single"
        ? i.receiveDate || "-"
        : i.recurrence.type === "weekly"
          ? `D${i.recurrence.weekday}`
          : i.recurrence.type === "monthly"
            ? `${i.recurrence.day}`
            : `${i.recurrence.day}/${i.recurrence.month}`;
    const td5 = document.createElement("td");
    const btnStatus = document.createElement("button");
    btnStatus.textContent = i.status === "confirmed" ? "Mark pending" : "Mark confirmed";
    btnStatus.addEventListener("click", async () => {
      const status = i.status === "confirmed" ? "pending" : "confirmed";
      await window.cashmoo.setIncomeStatus({ id: i.id, status });
      fillIncomesTable();
    });
    const btnEdit = document.createElement("button");
    btnEdit.textContent = "Edit";
    btnEdit.addEventListener("click", () => {
      editingIncomeId = i.id;
      q("#incomeName").value = i.name || "";
      q("#incomeDescription").value = i.description || "";
      q("#incomeCompany").value = i.company || "";
      q("#incomeAmount").value = i.amount || "";
      q("#incomeRecurrence").value = i.recurrence.type;
      toggleIncomeRecurrenceFields();
      if (i.recurrence.type === "single") q("#incomeReceiveDate").value = i.receiveDate || "";
      if (i.recurrence.type === "weekly") q("#incomeWeekday").value = i.recurrence.weekday;
      if (i.recurrence.type === "monthly") q("#incomeDay").value = i.recurrence.day;
      if (i.recurrence.type === "annual") {
        q("#incomeMonth").value = i.recurrence.month;
        q("#incomeDayAnnual").value = i.recurrence.day;
      }
      q("#incomeSubmit").textContent = "Save changes";
    });
    const btnDel = document.createElement("button");
    btnDel.textContent = "Delete";
    btnDel.addEventListener("click", async () => {
      const out = await window.cashmoo.removeIncome({ id: i.id });
      if (!out.ok) showError(q("#incomeError"), out.error);
      fillIncomesTable();
    });
    td5.appendChild(btnStatus);
    td5.appendChild(btnEdit);
    td5.appendChild(btnDel);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tr.appendChild(td4);
    tr.appendChild(td5);
    body.appendChild(tr);
  });
};

const initCards = async () => {
  fillCardsTable();
  q("#cardForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: q("#cardName").value.trim(),
      description: q("#cardDescription").value.trim(),
      limit: q("#cardLimit").value.trim(),
      closingDay: parseInt(q("#cardClosingDay").value, 10),
      paymentDay: parseInt(q("#cardPaymentDay").value, 10)
    };
    let res;
    if (editingCardId) {
      res = await window.cashmoo.updateCard({
        id: editingCardId,
        update: payload
      });
    } else {
      res = await window.cashmoo.addCard(payload);
    }
    if (!res.ok) {
      showError(q("#cardError"), res.error);
      return;
    }
    editingCardId = null;
    q("#cardSubmit").textContent = "Add card";
    q("#cardForm").reset();
    fillCardsTable();
  });
};

const fillCardsTable = async () => {
  const res = await window.cashmoo.listCards();
  const body = q("#cardsBody");
  body.innerHTML = "";
  res.items.forEach((i) => {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    td1.textContent = i.name;
    const td2 = document.createElement("td");
    td2.textContent = i.limit;
    const td3 = document.createElement("td");
    td3.textContent = i.closingDay;
    const td4 = document.createElement("td");
    td4.textContent = i.paymentDay;
    const td5 = document.createElement("td");
    const btnEdit = document.createElement("button");
    btnEdit.textContent = "Edit";
    btnEdit.addEventListener("click", () => {
      editingCardId = i.id;
      q("#cardName").value = i.name || "";
      q("#cardDescription").value = i.description || "";
      q("#cardLimit").value = i.limit || "";
      q("#cardClosingDay").value = i.closingDay || "";
      q("#cardPaymentDay").value = i.paymentDay || "";
      q("#cardSubmit").textContent = "Save changes";
    });
    const btnDel = document.createElement("button");
    btnDel.textContent = "Delete";
    btnDel.addEventListener("click", async () => {
      const out = await window.cashmoo.removeCard({ id: i.id });
      if (!out.ok) showError(q("#cardError"), out.error);
      fillCardsTable();
    });
    td5.appendChild(btnEdit);
    td5.appendChild(btnDel);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tr.appendChild(td4);
    tr.appendChild(td5);
    body.appendChild(tr);
  });
};

const initGoals = async () => {
  fillGoalsTable();
  q("#goalForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      title: q("#goalTitle").value.trim(),
      target: q("#goalTarget").value.trim(),
      period: q("#goalPeriod").value
    };
    const res = await window.cashmoo.addGoal(payload);
    if (!res.ok) {
      showError(q("#goalError"), res.error);
      return;
    }
    q("#goalForm").reset();
    fillGoalsTable();
  });
};

const fillGoalsTable = async () => {
  const res = await window.cashmoo.listGoals();
  const body = q("#goalsBody");
  body.innerHTML = "";
  res.items.forEach((i) => {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    td1.textContent = i.title;
    const td2 = document.createElement("td");
    td2.textContent = i.target;
    const td3 = document.createElement("td");
    td3.textContent = i.period;
    const td4 = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "Delete";
    btn.addEventListener("click", async () => {
      await window.cashmoo.removeGoal({ id: i.id });
      fillGoalsTable();
    });
    td4.appendChild(btn);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    body.appendChild(tr);
  });
};

const initNotifications = async () => {
  const res = await window.cashmoo.getNotifications();
  if (res && res.ok && res.settings) {
    q("#notificationsEnabled").checked = !!res.settings.enabled;
    q("#alertsDue").checked = !!res.settings.alertsDue;
    q("#alertsGoals").checked = !!res.settings.alertsGoals;
  }
  q("#notificationsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      enabled: q("#notificationsEnabled").checked,
      alertsDue: q("#alertsDue").checked,
      alertsGoals: q("#alertsGoals").checked
    };
    const out = await window.cashmoo.updateNotifications(payload);
    if (!out.ok) showError(q("#notificationsError"), out.error);
  });
};

const initSettings = async () => {
  const res = await window.cashmoo.getSettings();
  if (!res.ok) return;
  q("#settingsUserName").value = res.settings.userName;
  q("#settingsCurrency").value = res.settings.currency;
  q("#settingsDateFormat").value = res.settings.dateFormat;
  q("#exportBtn").addEventListener("click", async () => {
    await window.cashmoo.exportData();
  });
  q("#importBtn").addEventListener("click", async () => {
    const ok = await window.cashmoo.importData();
    if (!ok.ok) {
      showError(q("#settingsError"), ok.error);
      return;
    }
    location.reload();
  });
  q("#resetBtn").addEventListener("click", async () => {
    await window.cashmoo.resetApp();
  });
  q("#settingsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      userName: q("#settingsUserName").value.trim(),
      currency: q("#settingsCurrency").value,
      dateFormat: q("#settingsDateFormat").value
    };
    const out = await window.cashmoo.updateSettings(payload);
    if (!out.ok) {
      showError(q("#settingsError"), out.error);
      return;
    }
  });
};

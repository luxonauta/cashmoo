export const isString = (v) => typeof v === "string";
export const isNumberString = (v) => typeof v === "string" && /^[0-9]+(\.[0-9]{1,2})?$/.test(v) && parseFloat(v) > 0;
export const parseMoney = (v) => parseFloat(v || "0") || 0;
export const isDateIso = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export const validateSetup = (p) => {
  if (!isString(p.userName) || p.userName.trim().length < 1 || p.userName.length > 30) return { valid: false, error: "Invalid user name" };
  if (!["BRL", "USD", "EUR"].includes(p.currency)) return { valid: false, error: "Invalid currency" };
  if (!["DD/MM/YYYY", "MM/DD/YYYY"].includes(p.dateFormat)) return { valid: false, error: "Invalid date format" };
  if (typeof p.notificationsEnabled !== "boolean") return { valid: false, error: "Invalid notifications setting" };
  return { valid: true };
};

export const validateRecurrence = (r) => {
  if (!r || !r.type) return false;
  if (!["single", "weekly", "monthly", "annual"].includes(r.type)) return false;
  if (r.type === "weekly") {
    if (typeof r.weekday !== "number" || r.weekday < 1 || r.weekday > 7) return false;
  }
  if (r.type === "monthly") {
    if (typeof r.day !== "number" || r.day < 1 || r.day > 30) return false;
  }
  if (r.type === "annual") {
    if (typeof r.day !== "number" || r.day < 1 || r.day > 30) return false;
    if (typeof r.month !== "number" || r.month < 1 || r.month > 12) return false;
  }
  return true;
};

export const validateDayOfMonth = (d) => typeof d === "number" && d >= 1 && d <= 31;

export const validateExpense = (p) => {
  if (!isString(p.name) || p.name.trim().length < 1 || p.name.length > 50) return { valid: false, error: "Invalid name" };
  if (p.description && (!isString(p.description) || p.description.length > 200)) return { valid: false, error: "Invalid description" };
  if (!isNumberString(p.amount)) return { valid: false, error: "Invalid amount" };
  if (!validateRecurrence(p.recurrence)) return { valid: false, error: "Invalid recurrence" };
  if (!["auto-debit", "manual", "card"].includes(p.paymentMethod)) return { valid: false, error: "Invalid payment method" };
  if (p.recurrence.type === "single") {
    if (!isDateIso(p.dueDate)) return { valid: false, error: "Invalid due date" };
  }
  if (p.paymentMethod === "card") {
    if (!p.cardId || !isString(p.cardId)) return { valid: false, error: "Card is required" };
  }
  return { valid: true };
};

export const validateIncome = (p) => {
  if (!isString(p.name) || p.name.trim().length < 1 || p.name.length > 50) return { valid: false, error: "Invalid name" };
  if (p.description && (!isString(p.description) || p.description.length > 200)) return { valid: false, error: "Invalid description" };
  if (p.company && (!isString(p.company) || p.company.length > 50)) return { valid: false, error: "Invalid company" };
  if (!isNumberString(p.amount)) return { valid: false, error: "Invalid amount" };
  if (!validateRecurrence(p.recurrence)) return { valid: false, error: "Invalid recurrence" };
  if (p.recurrence.type === "single") {
    if (!isDateIso(p.receiveDate)) return { valid: false, error: "Invalid receive date" };
  }
  if (p.recurrence.type === "weekly") {
    if (typeof p.recurrence.weekday !== "number" || p.recurrence.weekday < 1 || p.recurrence.weekday > 7) return { valid: false, error: "Invalid weekday" };
  }
  if (p.recurrence.type === "monthly") {
    if (typeof p.recurrence.day !== "number" || p.recurrence.day < 1 || p.recurrence.day > 30) return { valid: false, error: "Invalid receive day" };
  }
  if (p.recurrence.type === "annual") {
    if (typeof p.recurrence.day !== "number" || p.recurrence.day < 1 || p.recurrence.day > 30) return { valid: false, error: "Invalid receive day" };
    if (typeof p.recurrence.month !== "number" || p.recurrence.month < 1 || p.recurrence.month > 12) return { valid: false, error: "Invalid receive month" };
  }
  return { valid: true };
};

export const validateCard = (p) => {
  if (!isString(p.name) || p.name.trim().length < 1 || p.name.length > 30) return { valid: false, error: "Invalid name" };
  if (p.description && (!isString(p.description) || p.description.length > 100)) return { valid: false, error: "Invalid description" };
  if (!isNumberString(p.limit)) return { valid: false, error: "Invalid limit" };
  if (!validateDayOfMonth(p.closingDay)) return { valid: false, error: "Invalid closing day" };
  if (!validateDayOfMonth(p.paymentDay)) return { valid: false, error: "Invalid payment day" };
  return { valid: true };
};

export const validateCardClosingPayment = (closingDay, paymentDay) => {
  return paymentDay > closingDay;
};

export const validateGoal = (p) => {
  if (!isString(p.title) || p.title.trim().length < 1 || p.title.length > 50) return { valid: false, error: "Invalid title" };
  if (!isNumberString(p.target)) return { valid: false, error: "Invalid target" };
  if (!["monthly", "annual"].includes(p.period)) return { valid: false, error: "Invalid period" };
  return { valid: true };
};

export const validateNotificationSettings = (p) => {
  if (typeof p.enabled !== "undefined" && typeof p.enabled !== "boolean") return { valid: false, error: "Invalid enabled flag" };
  if (typeof p.alertsDue !== "undefined" && typeof p.alertsDue !== "boolean") return { valid: false, error: "Invalid alertsDue flag" };
  if (typeof p.alertsGoals !== "undefined" && typeof p.alertsGoals !== "boolean") return { valid: false, error: "Invalid alertsGoals flag" };
  return { valid: true };
};

/**
 * Date utility functions.
 */

/**
 * Gets current date in ISO format (YYYY-MM-DD).
 * @returns {string} Current date in ISO format.
 */
export const nowIso = () => new Date().toISOString().slice(0, 10);

/**
 * Converts ISO date string to user-friendly format.
 * @param {string} iso - Date in ISO format (YYYY-MM-DD).
 * @param {string} fmt - Format type ("DD/MM/YYYY" or "MM/DD/YYYY").
 * @returns {string} Formatted date string.
 */
export const toUserFormat = (iso, fmt) => {
  const [year, month, day] = iso.split("-");

  if (fmt === "MM/DD/YYYY") {
    return `${month}/${day}/${year}`;
  }

  return `${day}/${month}/${year}`;
};

/**
 * Adjusts day to fit within the given month's valid range.
 * @param {number} year - Target year.
 * @param {number} month - Target month (1-12).
 * @param {number} day - Desired day.
 * @returns {number} Valid day for the given month.
 */
export const adjustDayForMonth = (year, month, day) => {
  const maxDaysInMonth = new Date(year, month, 0).getDate();
  return Math.min(day, maxDaysInMonth);
};

/**
 * Calculates next occurrence of a specific weekday.
 * @param {number} weekday - Target weekday (1=Monday, 7=Sunday).
 * @returns {string} Next occurrence date in ISO format.
 */
export const nextWeekly = (weekday) => {
  const today = new Date();
  const currentWeekday = today.getDay() === 0 ? 7 : today.getDay();

  let daysUntilTarget = weekday - currentWeekday;

  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }

  const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysUntilTarget);
  return targetDate.toISOString().slice(0, 10);
};

/**
 * Calculates next monthly occurrence of a specific day.
 * @param {number} day - Target day of month (1-31).
 * @returns {string} Next occurrence date in ISO format.
 */
export const nextMonthly = (day) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const adjustedDay = adjustDayForMonth(currentYear, currentMonth, day);
  const candidateDate = new Date(currentYear, currentMonth - 1, adjustedDay);
  const todayDate = new Date(currentYear, currentMonth - 1, today.getDate());

  if (candidateDate.getTime() > todayDate.getTime()) {
    return candidateDate.toISOString().slice(0, 10);
  }

  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
  const nextAdjustedDay = adjustDayForMonth(nextYear, nextMonth, day);

  const nextMonthDate = new Date(nextYear, nextMonth - 1, nextAdjustedDay);
  return nextMonthDate.toISOString().slice(0, 10);
};

/**
 * Calculates next annual occurrence of a specific date.
 * @param {number} month - Target month (1-12).
 * @param {number} day - Target day of month (1-31).
 * @returns {string} Next occurrence date in ISO format.
 */
export const nextAnnual = (month, day) => {
  const today = new Date();
  const currentYear = today.getFullYear();

  const adjustedDay = adjustDayForMonth(currentYear, month, day);
  const candidateDate = new Date(currentYear, month - 1, adjustedDay);
  const todayDate = new Date(currentYear, today.getMonth(), today.getDate());

  if (candidateDate.getTime() > todayDate.getTime()) {
    return candidateDate.toISOString().slice(0, 10);
  }

  const nextYear = currentYear + 1;
  const nextYearAdjustedDay = adjustDayForMonth(nextYear, month, day);
  const nextYearDate = new Date(nextYear, month - 1, nextYearAdjustedDay);

  return nextYearDate.toISOString().slice(0, 10);
};

/**
 * Checks if a date falls within specified days from today.
 * @param {string} iso - Target date in ISO format.
 * @param {number[]} daysList - Array of day offsets to check against.
 * @returns {boolean} True if date is within any of the specified day ranges.
 */
export const isWithinDaysFromToday = (iso, daysList) => {
  const targetTime = new Date(iso).getTime();
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const toleranceHours = 12 * 60 * 60 * 1000;

  return daysList.some((dayOffset) => {
    const referenceTime = todayMidnight + dayOffset * millisecondsPerDay;
    return Math.abs(targetTime - referenceTime) < toleranceHours;
  });
};

/**
 * Calculates monthly financial projection based on income and expenses.
 * @param {Object} data - Application data containing incomes and expenses.
 * @param {Array} data.incomes - Array of income objects.
 * @param {Array} data.expenses - Array of expense objects.
 * @returns {number} Monthly projection (income - expenses).
 */
export const projectMonthly = (data) => {
  const totalIncomes = data.incomes.reduce((accumulator, income) => {
    return accumulator + parseFloat(income.amount || "0");
  }, 0);

  const totalExpenses = data.expenses.reduce((accumulator, expense) => {
    return accumulator + parseFloat(expense.amount || "0");
  }, 0);

  return totalIncomes - totalExpenses;
};

/**
 * Calculates the next due date for an expense based on its recurrence pattern.
 * @param {Object} expense - Expense object.
 * @param {string} expense.dueDate - Due date for single expenses.
 * @param {Object} expense.recurrence - Recurrence configuration.
 * @param {string} expense.recurrence.type - Type of recurrence (single, weekly, monthly, annual).
 * @param {number} expense.recurrence.weekday - Weekday for weekly recurrence (1-7).
 * @param {number} expense.recurrence.day - Day for monthly recurrence (1-31).
 * @param {number} expense.recurrence.month - Month for annual recurrence (1-12).
 * @returns {string|null} Next due date in ISO format, or null if invalid recurrence.
 */
export const nextDueDateForExpense = (expense) => {
  const { recurrence } = expense;

  switch (recurrence.type) {
    case "single":
      return expense.dueDate;
    case "weekly":
      return nextWeekly(recurrence.weekday);
    case "monthly":
      return nextMonthly(recurrence.day);
    case "annual":
      return nextAnnual(recurrence.month, recurrence.day);
    default:
      return null;
  }
};

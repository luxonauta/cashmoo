export const nowIso = () => new Date().toISOString().slice(0, 10);

export const toUserFormat = (iso, fmt) => {
  const [y, m, d] = iso.split("-");
  if (fmt === "MM/DD/YYYY") return `${m}/${d}/${y}`;
  return `${d}/${m}/${y}`;
};

export const adjustDayForMonth = (year, month, day) => {
  const max = new Date(year, month, 0).getDate();
  return Math.min(day, max);
};

export const nextWeekly = (weekday) => {
  const today = new Date();
  const current = today.getDay() === 0 ? 7 : today.getDay();
  let diff = weekday - current;
  if (diff <= 0) diff += 7;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diff);
  return t.toISOString().slice(0, 10);
};

export const nextMonthly = (day) => {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const d = adjustDayForMonth(y, m, day);
  const candidate = new Date(y, m - 1, d);
  if (candidate.getTime() > new Date(y, m - 1, today.getDate()).getTime()) return candidate.toISOString().slice(0, 10);
  const y2 = m === 12 ? y + 1 : y;
  const m2 = m === 12 ? 1 : m + 1;
  const d2 = adjustDayForMonth(y2, m2, day);
  return new Date(y2, m2 - 1, d2).toISOString().slice(0, 10);
};

export const nextAnnual = (month, day) => {
  const today = new Date();
  const y = today.getFullYear();
  const d = adjustDayForMonth(y, month, day);
  const candidate = new Date(y, month - 1, d);
  if (candidate.getTime() > new Date(y, today.getMonth(), today.getDate()).getTime()) return candidate.toISOString().slice(0, 10);
  const y2 = y + 1;
  const d2 = adjustDayForMonth(y2, month, day);
  return new Date(y2, month - 1, d2).toISOString().slice(0, 10);
};

export const isWithinDaysFromToday = (iso, daysList) => {
  const target = new Date(iso).getTime();
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return daysList.some((d) => {
    const ref = todayMid + d * 24 * 60 * 60 * 1000;
    return Math.abs(target - ref) < 12 * 60 * 60 * 1000;
  });
};

export const projectMonthly = (data) => {
  const incomes = data.incomes.reduce((a, b) => a + parseFloat(b.amount || "0"), 0);
  const expenses = data.expenses.reduce((a, b) => a + parseFloat(b.amount || "0"), 0);
  return incomes - expenses;
};

export const nextDueDateForExpense = (expense) => {
  if (expense.recurrence.type === "single") return expense.dueDate;
  if (expense.recurrence.type === "weekly") return nextWeekly(expense.recurrence.weekday);
  if (expense.recurrence.type === "monthly") return nextMonthly(expense.recurrence.day);
  if (expense.recurrence.type === "annual") return nextAnnual(expense.recurrence.month, expense.recurrence.day);
  return null;
};

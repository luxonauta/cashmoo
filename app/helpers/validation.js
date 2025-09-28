/**
 * Validation utility functions for CashMoo application
 */

/**
 * Validation constants
 */
const VALIDATION_CONSTANTS = {
  currencies: ["BRL", "USD", "EUR"],
  dateFormats: ["DD/MM/YYYY", "MM/DD/YYYY"],
  recurrenceTypes: ["single", "weekly", "monthly", "annual"],
  paymentMethods: ["auto-debit", "manual", "card"],
  goalPeriods: ["monthly", "annual"],
  maxLengths: {
    userName: 30,
    name: 50,
    description: 200,
    cardDescription: 100,
    cardName: 30,
    company: 50,
    goalTitle: 50
  },
  weekdayRange: { min: 1, max: 7 },
  dayRange: { min: 1, max: 30 },
  monthRange: { min: 1, max: 12 },
  dayOfMonthRange: { min: 1, max: 31 }
};

/**
 * Basic type validation functions
 */

/**
 * Checks if value is a non-empty string
 * @param {any} value - Value to check
 * @returns {boolean} True if value is a string
 */
export const isString = (value) => typeof value === "string";

/**
 * Validates if string represents a positive number with up to 2 decimal places
 * @param {any} value - Value to validate
 * @returns {boolean} True if valid number string
 */
export const isNumberString = (value) => {
  return typeof value === "string" && /^[0-9]+(\.[0-9]{1,2})?$/.test(value) && parseFloat(value) > 0;
};

/**
 * Parses money string to float, defaulting to 0 for invalid values
 * @param {string} value - Money string to parse
 * @returns {number} Parsed money value
 */
export const parseMoney = (value) => parseFloat(value || "0") || 0;

/**
 * Validates if string is in ISO date format (YYYY-MM-DD)
 * @param {any} value - Value to validate
 * @returns {boolean} True if valid ISO date format
 */
export const isDateIso = (value) => {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
};

/**
 * Validates if value is a valid day of month (1-31)
 * @param {any} day - Day value to validate
 * @returns {boolean} True if valid day of month
 */
export const validateDayOfMonth = (day) => {
  return typeof day === "number" && day >= VALIDATION_CONSTANTS.dayOfMonthRange.min && day <= VALIDATION_CONSTANTS.dayOfMonthRange.max;
};

/**
 * String validation helpers
 */

/**
 * Validates string length and content
 * @param {any} value - Value to validate
 * @param {number} minLength - Minimum length (after trim)
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if valid string
 */
const validateStringLength = (value, minLength, maxLength) => {
  return isString(value) && value.trim().length >= minLength && value.length <= maxLength;
};

/**
 * Validates optional string field
 * @param {any} value - Value to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if valid or undefined
 */
const validateOptionalString = (value, maxLength) => {
  return !value || (isString(value) && value.length <= maxLength);
};

/**
 * Validates if value is in allowed list
 * @param {any} value - Value to check
 * @param {Array} allowedValues - Array of allowed values
 * @returns {boolean} True if value is in allowed list
 */
const validateAllowedValue = (value, allowedValues) => {
  return allowedValues.includes(value);
};

/**
 * Validates numeric range
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if valid number in range
 */
const validateNumberRange = (value, min, max) => {
  return typeof value === "number" && value >= min && value <= max;
};

/**
 * Recurrence validation functions
 */

/**
 * Validates weekly recurrence configuration
 * @param {Object} recurrence - Recurrence object
 * @returns {boolean} True if valid weekly recurrence
 */
const validateWeeklyRecurrence = (recurrence) => {
  return validateNumberRange(recurrence.weekday, VALIDATION_CONSTANTS.weekdayRange.min, VALIDATION_CONSTANTS.weekdayRange.max);
};

/**
 * Validates monthly recurrence configuration
 * @param {Object} recurrence - Recurrence object
 * @returns {boolean} True if valid monthly recurrence
 */
const validateMonthlyRecurrence = (recurrence) => {
  return validateNumberRange(recurrence.day, VALIDATION_CONSTANTS.dayRange.min, VALIDATION_CONSTANTS.dayRange.max);
};

/**
 * Validates annual recurrence configuration
 * @param {Object} recurrence - Recurrence object
 * @returns {boolean} True if valid annual recurrence
 */
const validateAnnualRecurrence = (recurrence) => {
  const validDay = validateNumberRange(recurrence.day, VALIDATION_CONSTANTS.dayRange.min, VALIDATION_CONSTANTS.dayRange.max);

  const validMonth = validateNumberRange(recurrence.month, VALIDATION_CONSTANTS.monthRange.min, VALIDATION_CONSTANTS.monthRange.max);

  return validDay && validMonth;
};

/**
 * Validates recurrence configuration based on type
 * @param {Object} recurrence - Recurrence configuration object
 * @param {string} recurrence.type - Recurrence type
 * @returns {boolean} True if valid recurrence
 */
export const validateRecurrence = (recurrence) => {
  if (!recurrence || !recurrence.type) {
    return false;
  }

  if (!validateAllowedValue(recurrence.type, VALIDATION_CONSTANTS.recurrenceTypes)) {
    return false;
  }

  switch (recurrence.type) {
    case "weekly":
      return validateWeeklyRecurrence(recurrence);
    case "monthly":
      return validateMonthlyRecurrence(recurrence);
    case "annual":
      return validateAnnualRecurrence(recurrence);
    case "single":
      return true;
    default:
      return false;
  }
};

/**
 * Main validation functions
 */

/**
 * Validates setup configuration
 * @param {Object} payload - Setup configuration
 * @param {string} payload.userName - User's name
 * @param {string} payload.currency - Selected currency
 * @param {string} payload.dateFormat - Date format preference
 * @param {boolean} payload.notificationsEnabled - Notifications enabled flag
 * @returns {Object} Validation result with valid flag and error message
 */
export const validateSetup = (payload) => {
  if (!validateStringLength(payload.userName, 1, VALIDATION_CONSTANTS.maxLengths.userName)) {
    return { valid: false, error: "Invalid user name" };
  }

  if (!validateAllowedValue(payload.currency, VALIDATION_CONSTANTS.currencies)) {
    return { valid: false, error: "Invalid currency" };
  }

  if (!validateAllowedValue(payload.dateFormat, VALIDATION_CONSTANTS.dateFormats)) {
    return { valid: false, error: "Invalid date format" };
  }

  if (typeof payload.notificationsEnabled !== "boolean") {
    return { valid: false, error: "Invalid notifications setting" };
  }

  return { valid: true };
};

/**
 * Validates expense data
 * @param {Object} payload - Expense data
 * @param {string} payload.name - Expense name
 * @param {string} payload.description - Optional description
 * @param {string} payload.amount - Expense amount
 * @param {Object} payload.recurrence - Recurrence configuration
 * @param {string} payload.paymentMethod - Payment method
 * @param {string} payload.dueDate - Due date for single expenses
 * @param {string} payload.cardId - Card ID for card payments
 * @returns {Object} Validation result with valid flag and error message
 */
export const validateExpense = (payload) => {
  if (!validateStringLength(payload.name, 1, VALIDATION_CONSTANTS.maxLengths.name)) {
    return { valid: false, error: "Invalid name" };
  }

  if (!validateOptionalString(payload.description, VALIDATION_CONSTANTS.maxLengths.description)) {
    return { valid: false, error: "Invalid description" };
  }

  if (!isNumberString(payload.amount)) {
    return { valid: false, error: "Invalid amount" };
  }

  if (!validateRecurrence(payload.recurrence)) {
    return { valid: false, error: "Invalid recurrence" };
  }

  if (!validateAllowedValue(payload.paymentMethod, VALIDATION_CONSTANTS.paymentMethods)) {
    return { valid: false, error: "Invalid payment method" };
  }

  if (payload.recurrence.type === "single" && !isDateIso(payload.dueDate)) {
    return { valid: false, error: "Invalid due date" };
  }

  if (payload.paymentMethod === "card" && (!payload.cardId || !isString(payload.cardId))) {
    return { valid: false, error: "Card is required" };
  }

  return { valid: true };
};

/**
 * Validates income data
 * @param {Object} payload - Income data
 * @param {string} payload.name - Income name
 * @param {string} payload.description - Optional description
 * @param {string} payload.company - Optional company name
 * @param {string} payload.amount - Income amount
 * @param {Object} payload.recurrence - Recurrence configuration
 * @param {string} payload.receiveDate - Receive date for single incomes
 * @returns {Object} Validation result with valid flag and error message
 */
export const validateIncome = (payload) => {
  if (!validateStringLength(payload.name, 1, VALIDATION_CONSTANTS.maxLengths.name)) {
    return { valid: false, error: "Invalid name" };
  }

  if (!validateOptionalString(payload.description, VALIDATION_CONSTANTS.maxLengths.description)) {
    return { valid: false, error: "Invalid description" };
  }

  if (!validateOptionalString(payload.company, VALIDATION_CONSTANTS.maxLengths.company)) {
    return { valid: false, error: "Invalid company" };
  }

  if (!isNumberString(payload.amount)) {
    return { valid: false, error: "Invalid amount" };
  }

  if (!validateRecurrence(payload.recurrence)) {
    return { valid: false, error: "Invalid recurrence" };
  }

  if (payload.recurrence.type === "single" && !isDateIso(payload.receiveDate)) {
    return { valid: false, error: "Invalid receive date" };
  }

  const recurrenceValidationResult = validateIncomeRecurrenceDetails(payload.recurrence);
  if (!recurrenceValidationResult.valid) {
    return recurrenceValidationResult;
  }

  return { valid: true };
};

/**
 * Validates income recurrence specific details
 * @param {Object} recurrence - Recurrence configuration
 * @returns {Object} Validation result
 */
const validateIncomeRecurrenceDetails = (recurrence) => {
  switch (recurrence.type) {
    case "weekly":
      if (!validateWeeklyRecurrence(recurrence)) {
        return { valid: false, error: "Invalid weekday" };
      }
      break;
    case "monthly":
      if (!validateMonthlyRecurrence(recurrence)) {
        return { valid: false, error: "Invalid receive day" };
      }
      break;
    case "annual":
      if (!validateAnnualRecurrence(recurrence)) {
        return { valid: false, error: "Invalid receive day or month" };
      }
      break;
  }

  return { valid: true };
};

/**
 * Validates credit card data
 * @param {Object} payload - Card data
 * @param {string} payload.name - Card name
 * @param {string} payload.description - Optional description
 * @param {string} payload.limit - Credit limit
 * @param {number} payload.closingDay - Monthly closing day
 * @param {number} payload.paymentDay - Monthly payment day
 * @returns {Object} Validation result with valid flag and error message
 */
export const validateCard = (payload) => {
  if (!validateStringLength(payload.name, 1, VALIDATION_CONSTANTS.maxLengths.cardName)) {
    return { valid: false, error: "Invalid name" };
  }

  if (!validateOptionalString(payload.description, VALIDATION_CONSTANTS.maxLengths.cardDescription)) {
    return { valid: false, error: "Invalid description" };
  }

  if (!isNumberString(payload.limit)) {
    return { valid: false, error: "Invalid limit" };
  }

  if (!validateDayOfMonth(payload.closingDay)) {
    return { valid: false, error: "Invalid closing day" };
  }

  if (!validateDayOfMonth(payload.paymentDay)) {
    return { valid: false, error: "Invalid payment day" };
  }

  return { valid: true };
};

/**
 * Validates card closing and payment day relationship
 * @param {number} closingDay - Card closing day
 * @param {number} paymentDay - Card payment day
 * @returns {boolean} True if payment day is after closing day
 */
export const validateCardClosingPayment = (closingDay, paymentDay) => {
  return paymentDay > closingDay;
};

/**
 * Validates financial goal data
 * @param {Object} payload - Goal data
 * @param {string} payload.title - Goal title
 * @param {string} payload.target - Target amount
 * @param {string} payload.period - Goal period (monthly/annual)
 * @returns {Object} Validation result with valid flag and error message
 */
export const validateGoal = (payload) => {
  if (!validateStringLength(payload.title, 1, VALIDATION_CONSTANTS.maxLengths.goalTitle)) {
    return { valid: false, error: "Invalid title" };
  }

  if (!isNumberString(payload.target)) {
    return { valid: false, error: "Invalid target" };
  }

  if (!validateAllowedValue(payload.period, VALIDATION_CONSTANTS.goalPeriods)) {
    return { valid: false, error: "Invalid period" };
  }

  return { valid: true };
};

/**
 * Validates notification settings
 * @param {Object} payload - Notification settings
 * @param {boolean} payload.enabled - Optional enabled flag
 * @param {boolean} payload.alertsDue - Optional due alerts flag
 * @param {boolean} payload.alertsGoals - Optional goal alerts flag
 * @returns {Object} Validation result with valid flag and error message
 */
export const validateNotificationSettings = (payload) => {
  if (typeof payload.enabled !== "undefined" && typeof payload.enabled !== "boolean") {
    return { valid: false, error: "Invalid enabled flag" };
  }

  if (typeof payload.alertsDue !== "undefined" && typeof payload.alertsDue !== "boolean") {
    return { valid: false, error: "Invalid alertsDue flag" };
  }

  if (typeof payload.alertsGoals !== "undefined" && typeof payload.alertsGoals !== "boolean") {
    return { valid: false, error: "Invalid alertsGoals flag" };
  }

  return { valid: true };
};

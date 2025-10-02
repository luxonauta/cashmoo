import fs from "fs";
import path from "path";
import { app, dialog } from "electron";

/**
 * Storage utility functions with Windows compatibility.
 */

const MILLISECONDS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Normalizes file paths for cross-platform compatibility.
 * @param {string} filepath - File path to normalize.
 * @returns {string} Normalized file path.
 */
const normalizePath = (filepath) => {
  return path.normalize(filepath);
};

/**
 * Ensures that a directory exists, creating it if necessary.
 * @param {string} dirPath - Directory path to ensure.
 * @returns {boolean} True if directory exists or was created successfully.
 */
const ensureDirectoryExists = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    return true;
  } catch (error) {
    console.error("Error creating directory:", error);
    return false;
  }
};

/**
 * Gets the base application directory path with Windows fallback.
 * @returns {string} Base directory path.
 */
const getBaseDir = () => {
  try {
    const userDataPath = app.getPath("userData");
    const baseDir = path.join(userDataPath, "cashmoo");
    return normalizePath(baseDir);
  } catch (error) {
    console.error("Error getting base directory:", error);
    const fallbackPath = path.join(process.env.APPDATA || process.env.USERPROFILE || ".", "cashmoo");
    return normalizePath(fallbackPath);
  }
};

/**
 * Gets the data directory path.
 * @returns {string} Data directory path.
 */
const getDataDir = () => normalizePath(path.join(getBaseDir(), "data"));

/**
 * Gets the main data file path.
 * @returns {string} Data file path.
 */
export const getDataFilePath = () => normalizePath(path.join(getDataDir(), "data.json"));

/**
 * Gets the backups directory path.
 * @returns {string} Backups directory path.
 */
const getBackupsDir = () => normalizePath(path.join(getDataDir(), "backups"));

/**
 * Creates the default application data structure.
 * @returns {Object} Default data object.
 */
const createDefaultData = () => ({
  setup: {
    completed: false
  },
  settings: {
    userName: "",
    currency: "BRL",
    dateFormat: "DD/MM/YYYY",
    notifications: {
      enabled: true,
      alertsDue: true,
      alertsGoals: true,
      alertDays: [7]
    }
  },
  expenses: [],
  incomes: [],
  cards: [],
  goals: [],
  meta: {
    lastBackupAt: null,
    createdAt: new Date().toISOString()
  }
});

/**
 * Ensures the default notification settings are present.
 * @returns {Object} Default notification settings.
 */
const getDefaultNotificationSettings = () => ({
  enabled: true,
  alertsDue: true,
  alertsGoals: true,
  alertDays: [7]
});

/**
 * Validates and normalizes application data structure.
 * @param {Object} data - Raw data object to validate.
 * @returns {Object} Validated and normalized data.
 */
const validateAndNormalizeData = (data) => {
  if (!data.settings || !data.meta) {
    throw new Error("Invalid data structure.");
  }

  if (!data.settings.notifications) {
    data.settings.notifications = getDefaultNotificationSettings();
  }

  if (!Array.isArray(data.expenses)) data.expenses = [];
  if (!Array.isArray(data.incomes)) data.incomes = [];
  if (!Array.isArray(data.cards)) data.cards = [];
  if (!Array.isArray(data.goals)) data.goals = [];

  const { alertDays } = data.settings.notifications;

  if (!Array.isArray(alertDays) || alertDays.length === 0) {
    data.settings.notifications.alertDays = [7];
  } else {
    data.settings.notifications.alertDays = [7];
  }

  return data;
};

/**
 * Creates necessary directories for the application.
 */
const createDirectories = () => {
  const directories = [getBaseDir(), getDataDir(), getBackupsDir()];

  directories.forEach((dir) => {
    if (!ensureDirectoryExists(dir)) {
      throw new Error(`Failed to create directory: ${dir}`);
    }
  });
};

/**
 * Creates the main data file if it doesn't exist.
 */
const createDataFileIfNeeded = () => {
  const dataFilePath = getDataFilePath();

  try {
    if (!fs.existsSync(dataFilePath)) {
      const defaultData = createDefaultData();
      const jsonData = JSON.stringify(defaultData, null, 2);
      fs.writeFileSync(dataFilePath, jsonData, "utf-8");
    }
  } catch (error) {
    console.error("Error creating data file:", error);
    throw error;
  }
};

/**
 * Ensures all required data files and directories exist.
 */
export const ensureDataFiles = () => {
  try {
    createDirectories();
    createDataFileIfNeeded();
  } catch (error) {
    console.error("Error ensuring data files:", error);
    throw error;
  }
};

/**
 * Reads and validates application data from file.
 * @returns {Object} Application data object.
 */
export const readData = () => {
  try {
    const dataFilePath = getDataFilePath();

    if (!fs.existsSync(dataFilePath)) {
      console.log("Data file does not exist, creating default data.");
      return createDefaultData();
    }

    const rawData = fs.readFileSync(dataFilePath, "utf-8");
    const parsedData = JSON.parse(rawData);

    return validateAndNormalizeData(parsedData);
  } catch (error) {
    console.error("Error reading data:", error);
    return createDefaultData();
  }
};

/**
 * Writes application data to file.
 * @param {Object} data - Data object to write.
 * @returns {boolean} True if successful, false otherwise.
 */
export const writeData = (data) => {
  try {
    const dataFilePath = getDataFilePath();
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(dataFilePath, jsonData, "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing data:", error);
    return false;
  }
};

/**
 * Checks if a weekly backup is needed and creates one.
 */
export const ensureWeeklyBackup = () => {
  try {
    const data = readData();
    const lastBackupTime = data.meta.lastBackupAt ? new Date(data.meta.lastBackupAt).getTime() : 0;

    const currentTime = Date.now();
    const weeksSinceLastBackup = currentTime - lastBackupTime;

    if (weeksSinceLastBackup >= MILLISECONDS_PER_WEEK) {
      createBackup();
      updateLastBackupTime(data);
    }
  } catch (error) {
    console.error("Error ensuring weekly backup:", error);
  }
};

/**
 * Creates a backup of the current data file.
 */
const createBackup = () => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `backup_${timestamp}.json`;
    const backupFilePath = normalizePath(path.join(getBackupsDir(), backupFileName));

    fs.copyFileSync(getDataFilePath(), backupFilePath);
  } catch (error) {
    console.error("Error creating backup:", error);
  }
};

/**
 * Updates the last backup timestamp in data.
 * @param {Object} data - Application data object.
 */
const updateLastBackupTime = (data) => {
  try {
    data.meta.lastBackupAt = new Date().toISOString();
    writeData(data);
  } catch (error) {
    console.error("Error updating backup time:", error);
  }
};

/**
 * Attempts to recover data from the most recent backup.
 * @returns {boolean} True if recovery successful, false if new file created.
 */
export const tryRecoverFromBackup = () => {
  try {
    if (isDataFileValid()) {
      return true;
    }

    const latestBackup = findLatestBackup();

    if (!latestBackup) {
      createFreshDataFile();
      return false;
    }

    restoreFromBackup(latestBackup);
    return true;
  } catch (error) {
    console.error("Error recovering from backup:", error);
    createFreshDataFile();
    return false;
  }
};

/**
 * Checks if the current data file is valid.
 * @returns {boolean} True if valid, false otherwise.
 */
const isDataFileValid = () => {
  try {
    const rawData = fs.readFileSync(getDataFilePath(), "utf-8");
    JSON.parse(rawData);
    return true;
  } catch {
    return false;
  }
};

/**
 * Finds the most recent backup file.
 * @returns {string|null} Path to latest backup or null if none found.
 */
const findLatestBackup = () => {
  try {
    const backupsDir = getBackupsDir();

    if (!fs.existsSync(backupsDir)) {
      return null;
    }

    const backupFiles = fs
      .readdirSync(backupsDir)
      .filter((fileName) => fileName.endsWith(".json"))
      .sort()
      .reverse();

    return backupFiles.length > 0 ? normalizePath(path.join(backupsDir, backupFiles[0])) : null;
  } catch (error) {
    console.error("Error finding latest backup:", error);
    return null;
  }
};

/**
 * Creates a fresh data file with default data.
 */
const createFreshDataFile = () => {
  try {
    const defaultData = createDefaultData();
    const jsonData = JSON.stringify(defaultData, null, 2);
    fs.writeFileSync(getDataFilePath(), jsonData, "utf-8");
  } catch (error) {
    console.error("Error creating fresh data file:", error);
  }
};

/**
 * Restores data from a backup file.
 * @param {string} backupPath - Path to backup file.
 */
const restoreFromBackup = (backupPath) => {
  try {
    fs.copyFileSync(backupPath, getDataFilePath());
  } catch (error) {
    console.error("Error restoring from backup:", error);
  }
};

/**
 * Exports application data to a user-selected file.
 * @returns {Promise<string|null>} Path to exported file or null if cancelled.
 */
export const exportData = async () => {
  try {
    const currentDate = new Date().toISOString().slice(0, 10);
    const defaultFileName = `cashmoo_export_${currentDate}.json`;

    const dialogResult = await dialog.showSaveDialog({
      title: "Export to JSON",
      defaultPath: defaultFileName,
      filters: [{ name: "JSON", extensions: ["json"] }]
    });

    if (dialogResult.canceled || !dialogResult.filePath) {
      return null;
    }

    const exportPath = normalizePath(dialogResult.filePath);
    fs.copyFileSync(getDataFilePath(), exportPath);

    return exportPath;
  } catch (error) {
    console.error("Error exporting data:", error);
    return null;
  }
};

/**
 * Imports application data from a user-selected file.
 * @returns {Promise<boolean>} True if import successful, false otherwise.
 */
export const importData = async () => {
  try {
    const dialogResult = await dialog.showOpenDialog({
      title: "Import JSON",
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }]
    });

    if (dialogResult.canceled || !dialogResult.filePaths || dialogResult.filePaths.length === 0) {
      return false;
    }

    const importPath = normalizePath(dialogResult.filePaths[0]);
    return processImportedFile(importPath);
  } catch (error) {
    console.error("Error importing data:", error);
    return false;
  }
};

/**
 * Processes and validates an imported data file.
 * @param {string} filePath - Path to file to import.
 * @returns {boolean} True if import successful, false otherwise.
 */
const processImportedFile = (filePath) => {
  try {
    const rawData = fs.readFileSync(filePath, "utf-8");
    const importedData = JSON.parse(rawData);

    if (!importedData.settings || !importedData.meta) {
      return false;
    }

    const normalizedData = normalizeImportedData(importedData);
    const jsonData = JSON.stringify(normalizedData, null, 2);
    fs.writeFileSync(getDataFilePath(), jsonData, "utf-8");

    return true;
  } catch (error) {
    console.error("Error processing imported file:", error);
    return false;
  }
};

/**
 * Normalizes imported data to ensure compatibility.
 * @param {Object} data - Imported data object.
 * @returns {Object} Normalized data object.
 */
const normalizeImportedData = (data) => {
  if (!data.settings.notifications) {
    data.settings.notifications = getDefaultNotificationSettings();
  }

  data.settings.notifications.alertDays = [7];
  return data;
};

/**
 * Resets all application data to default values.
 */
export const resetData = () => {
  try {
    const defaultData = createDefaultData();
    const jsonData = JSON.stringify(defaultData, null, 2);
    fs.writeFileSync(getDataFilePath(), jsonData, "utf-8");
  } catch (error) {
    console.error("Error resetting data:", error);
  }
};

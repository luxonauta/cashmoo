import fs from "fs";
import path from "path";
import { app, dialog } from "electron";

const getBaseDir = () => path.join(app.getPath("userData"), "cashmoo");
const getDataDir = () => path.join(getBaseDir(), "data");
export const getDataFilePath = () => path.join(getDataDir(), "data.json");
const getBackupsDir = () => path.join(getDataDir(), "backups");

const defaultData = () => ({
  setup: { completed: false },
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
  meta: { lastBackupAt: null, createdAt: new Date().toISOString() }
});

export const ensureDataFiles = () => {
  if (!fs.existsSync(getBaseDir())) fs.mkdirSync(getBaseDir(), { recursive: true });
  if (!fs.existsSync(getDataDir())) fs.mkdirSync(getDataDir(), { recursive: true });
  if (!fs.existsSync(getBackupsDir())) fs.mkdirSync(getBackupsDir(), { recursive: true });
  if (!fs.existsSync(getDataFilePath())) fs.writeFileSync(getDataFilePath(), JSON.stringify(defaultData(), null, 2), "utf-8");
};

export const readData = () => {
  try {
    const raw = fs.readFileSync(getDataFilePath(), "utf-8");
    const data = JSON.parse(raw);
    if (!data.settings || !data.meta) throw new Error("invalid");
    if (!data.settings.notifications)
      data.settings.notifications = {
        enabled: true,
        alertsDue: true,
        alertsGoals: true,
        alertDays: [7]
      };
    if (!Array.isArray(data.expenses)) data.expenses = [];
    if (!Array.isArray(data.incomes)) data.incomes = [];
    if (!Array.isArray(data.cards)) data.cards = [];
    if (!Array.isArray(data.goals)) data.goals = [];
    if (!Array.isArray(data.settings.notifications.alertDays) || data.settings.notifications.alertDays.length === 0) data.settings.notifications.alertDays = [7];
    else data.settings.notifications.alertDays = [7];
    return data;
  } catch {
    return defaultData();
  }
};

export const writeData = (data) => {
  try {
    fs.writeFileSync(getDataFilePath(), JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
};

export const ensureWeeklyBackup = () => {
  const data = readData();
  const last = data.meta.lastBackupAt ? new Date(data.meta.lastBackupAt).getTime() : 0;
  const now = Date.now();
  if (now - last >= 7 * 24 * 60 * 60 * 1000) {
    const file = path.join(getBackupsDir(), `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    fs.copyFileSync(getDataFilePath(), file);
    data.meta.lastBackupAt = new Date().toISOString();
    writeData(data);
  }
};

export const tryRecoverFromBackup = () => {
  try {
    const raw = fs.readFileSync(getDataFilePath(), "utf-8");
    JSON.parse(raw);
    return true;
  } catch {
    const files = fs
      .readdirSync(getBackupsDir())
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
    if (files.length === 0) {
      fs.writeFileSync(getDataFilePath(), JSON.stringify(defaultData(), null, 2), "utf-8");
      return false;
    }
    const latest = path.join(getBackupsDir(), files[0]);
    fs.copyFileSync(latest, getDataFilePath());
    return true;
  }
};

export const exportData = async () => {
  const res = await dialog.showSaveDialog({
    title: "Export to JSON",
    defaultPath: `cashmoo_export_${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  if (res.canceled || !res.filePath) return null;
  fs.copyFileSync(getDataFilePath(), res.filePath);
  return res.filePath;
};

export const importData = async () => {
  const res = await dialog.showOpenDialog({
    title: "Import JSON",
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  if (res.canceled || !res.filePaths || res.filePaths.length === 0) return false;
  try {
    const raw = fs.readFileSync(res.filePaths[0], "utf-8");
    const data = JSON.parse(raw);
    if (!data.settings || !data.meta) return false;
    if (!data.settings.notifications)
      data.settings.notifications = {
        enabled: true,
        alertsDue: true,
        alertsGoals: true,
        alertDays: [7]
      };
    data.settings.notifications.alertDays = [7];
    fs.writeFileSync(getDataFilePath(), JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
};

export const resetData = () => {
  fs.writeFileSync(getDataFilePath(), JSON.stringify(defaultData(), null, 2), "utf-8");
};

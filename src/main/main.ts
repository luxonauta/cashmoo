import { app, BrowserWindow } from "electron";
import * as path from "node:path";
import { runMigrations } from "./db";
import { registerIpc } from "./ipc";
import { scheduleTick } from "./scheduler";

let win: BrowserWindow | null = null;
let intervalId: NodeJS.Timeout | null = null;

function createWindow(): void {
  win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false
    }
  });
  const indexPath = app.isPackaged
    ? path.join(process.resourcesPath, "src", "renderer", "index.html")
    : path.join(process.cwd(), "src", "renderer", "index.html");
  win.loadFile(indexPath);
}

async function bootstrap(): Promise<void> {
  await runMigrations();
  registerIpc();
}

app.whenReady().then(async () => {
  await bootstrap();
  createWindow();
  intervalId = setInterval(scheduleTick, 30000);
});

app.on("window-all-closed", () => {
  if (intervalId) clearInterval(intervalId);
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

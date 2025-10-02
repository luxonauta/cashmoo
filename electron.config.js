/**
 * Electron configuration utilities for Windows compatibility.
 */
import path from "path";
import { app } from "electron";

/**
 * Gets Windows-specific configuration for the application.
 * @returns {Object} Configuration object with Windows-specific settings.
 */
export const getWindowsConfig = () => {
  const isWindows = process.platform === "win32";

  return {
    /**
     * Window configuration optimized for Windows.
     */
    windowConfig: {
      width: 768,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false
      },
      title: "CashMoo",
      show: false,
      autoHideMenuBar: true,
      icon: isWindows ? path.join(__dirname, "assets", "icon.ico") : undefined,
      frame: true,
      titleBarStyle: isWindows ? "default" : "hiddenInset",
      transparent: false,
      backgroundColor: "#ffffff"
    },

    /**
     * Application configuration for Windows.
     */
    appConfig: {
      userAgent: isWindows ? "CashMoo-Windows" : "CashMoo",

      security: {
        allowRunningInsecureContent: false,
        allowDisplayingInsecureContent: false
      }
    },

    /**
     * Path configuration with Windows-specific handling.
     */
    pathConfig: {
      /**
       * Gets user data path with Windows fallback.
       * @returns {string} User data directory path.
       */
      getUserDataPath: () => {
        if (isWindows) {
          return path.join(process.env.APPDATA || process.env.USERPROFILE || ".", "CashMoo");
        }
        return app.getPath("userData");
      },

      /**
       * Normalizes file paths for Windows compatibility.
       * @param {string} filepath - File path to normalize.
       * @returns {string} Normalized file path.
       */
      normalizePath: (filepath) => {
        return path.normalize(filepath.replace(/\//g, path.sep));
      }
    }
  };
};

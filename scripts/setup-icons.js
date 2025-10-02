/**
 * Icon setup utility for CashMoo application
 * Ensures required icon files exist before application startup
 */
import { existsSync, copyFileSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * Ensures assets directory and icon files exist
 * Creates directory if missing and copies default icon if no custom icon exists
 */
const ensureIconAssets = () => {
  const assetsDir = join(process.cwd(), "assets");
  const defaultIconPath = join(process.cwd(), "scripts", "default-icon.png");
  const targetIconPath = join(assetsDir, "icon.png");

  // Create assets directory if it doesn't exist
  if (!existsSync(assetsDir)) {
    mkdirSync(assetsDir, { recursive: true });
    console.log("✓ Created assets directory");
  }

  // Check if custom icon exists
  if (!existsSync(targetIconPath)) {
    if (existsSync(defaultIconPath)) {
      try {
        copyFileSync(defaultIconPath, targetIconPath);
        console.log("✓ Default icon copied to assets/icon.png");
      } catch (error) {
        console.warn("⚠ Could not copy default icon:", error.message);
      }
    } else {
      console.log("ℹ️ Place your custom icon at assets/icon.png (PNG, 512x512px or larger)");
    }
  } else {
    console.log("✓ Custom icon found at assets/icon.png");
  }
};

// Execute icon setup
ensureIconAssets();

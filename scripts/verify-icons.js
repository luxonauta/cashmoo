import { existsSync, statSync } from "fs";
import { join } from "path";
import { platform } from "os";

const assetsDir = join(process.cwd(), "assets");
const requiredIcons = {
  "icon.ico": { platforms: ["win32"], minSize: 1024 },
  "icon.png": { platforms: ["linux"], minSize: 512 },
  "icon.icns": { platforms: ["darwin"], minSize: 1024 }
};

console.log("Verifying icon files...");
console.log("");

let allValid = true;
let platformSpecificValid = true;

for (const [filename, config] of Object.entries(requiredIcons)) {
  const filePath = join(assetsDir, filename);
  const exists = existsSync(filePath);
  const isPlatformRequired = config.platforms.includes(platform());

  if (!exists) {
    if (isPlatformRequired) {
      console.log(`✗ ${filename} - MISSING (required for ${platform()})`);
      platformSpecificValid = false;
    } else {
      console.log(`⚠ ${filename} - MISSING (optional for ${platform()})`);
    }
    allValid = false;
    continue;
  }

  const stats = statSync(filePath);
  const sizeKB = Math.round(stats.size / 1024);

  if (stats.size < config.minSize) {
    console.log(`✗ ${filename} - TOO SMALL (${sizeKB}KB, minimum ${Math.round(config.minSize / 1024)}KB)`);
    if (isPlatformRequired) {
      platformSpecificValid = false;
    }
    allValid = false;
  } else {
    console.log(`✓ ${filename} - OK (${sizeKB}KB)`);
  }
}

console.log("");
console.log("==========================================");

if (allValid) {
  console.log("✓ All icon files are valid!");
  console.log("==========================================");
  process.exit(0);
} else if (platformSpecificValid) {
  console.log("⚠ Platform-specific icons are valid");
  console.log("  Some optional icons are missing");
  console.log("==========================================");
  console.log("");
  console.log("To generate all icons:");
  console.log("  npm run icons:generate");
  process.exit(0);
} else {
  console.log("✗ Required icon files are missing or invalid!");
  console.log("==========================================");
  console.log("");
  console.log("To generate icons:");
  console.log("  1. Place a source-icon.png (1024x1024px) in project root");
  console.log("  2. Run: npm run icons:generate");
  process.exit(1);
}

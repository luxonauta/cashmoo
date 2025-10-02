import { existsSync, copyFileSync, mkdirSync, readdirSync, renameSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Ensures required icon assets exist for Windows, macOS, and Linux builds.
 * Generates .ico, .icns, and PNG sizes from assets/icon.png when necessary.
 * Renames PNGs to the NxN.png pattern expected by Electron Builder.
 */
const ensureIconAssets = () => {
  console.log("Starting icon setup process...\n");

  const projectRoot = join(__dirname, "..");
  const assetsDir = join(projectRoot, "assets");
  const iconsDir = join(assetsDir, "icons");
  const pngDir = join(iconsDir, "png");
  const winDir = join(iconsDir, "win");
  const macDir = join(iconsDir, "mac");
  const sourceIcon = join(assetsDir, "icon.png");

  if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });
  if (!existsSync(sourceIcon)) {
    console.log("No icon.png found in assets/. Please add a 512x512px PNG icon.");
    return;
  }

  console.log("Source PNG icon found at assets/icon.png.");
  if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
  if (!existsSync(pngDir)) mkdirSync(pngDir, { recursive: true });
  if (!existsSync(winDir)) mkdirSync(winDir, { recursive: true });
  if (!existsSync(macDir)) mkdirSync(macDir, { recursive: true });

  const winIco = join(winDir, "icon.ico");
  const macIcns = join(macDir, "icon.icns");

  const needGenerate = !existsSync(winIco) || !existsSync(macIcns) || readdirSync(pngDir).filter((f) => f.endsWith(".png")).length === 0;

  if (needGenerate) {
    try {
      execSync(`npx --yes electron-icon-maker --input="${sourceIcon}" --output="${assetsDir}"`, { stdio: "inherit" });
      console.log("ICO and ICNS generated successfully.\n");
    } catch {
      console.log("Failed to generate icons from PNG.\n");
    }
  }

  const requiredSizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
  const pngFiles = existsSync(pngDir) ? readdirSync(pngDir) : [];
  const existingSizes = pngFiles
    .filter((f) => f.endsWith(".png"))
    .map((f) => {
      const m = f.match(/(\d+)x?\d*\.png/);
      return m ? parseInt(m[1]) : 0;
    })
    .filter((s) => s > 0);

  const missing = requiredSizes.filter((s) => !existingSizes.includes(s));
  if (missing.length > 0) {
    pngFiles
      .filter((f) => f.match(/^\d+x\d+\.png$/))
      .forEach((file) => {
        try {
          unlinkSync(join(pngDir, file));
        } catch {}
      });
    try {
      execSync(`npx --yes electron-icon-maker --input="${sourceIcon}" --output="${assetsDir}"`, { stdio: "inherit" });
    } catch {}
  }

  if (existsSync(pngDir)) {
    const files = readdirSync(pngDir);
    const needsRename = files.some((f) => f.match(/^\d+\.png$/));
    if (needsRename) {
      console.log("\nRenaming PNGs to Electron Format");
      files.forEach((file) => {
        if (file.match(/^\d+\.png$/)) {
          const size = file.replace(".png", "");
          const newName = `${size}x${size}.png`;
          try {
            renameSync(join(pngDir, file), join(pngDir, newName));
            console.log(`Renamed ${file} to ${newName}`);
          } catch {}
        }
      });
    }
  }

  const rootIco = join(assetsDir, "icon.ico");
  if (!existsSync(rootIco) && existsSync(winIco)) {
    try {
      copyFileSync(winIco, rootIco);
    } catch {}
  }

  console.log("\nIcon setup completed successfully.");
  console.log("All required icon formats are ready for build.\n");
};

ensureIconAssets();

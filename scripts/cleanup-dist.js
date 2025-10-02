import { rmSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * Cleans the dist folder to keep only installer files.
 * Removes unpacked folders, debug files, update metadata, and blockmaps.
 */
const cleanDist = () => {
  const dist = join(process.cwd(), "dist");
  const keepExts = [".dmg", ".exe", ".AppImage"];

  const shouldRemoveByName = (name) =>
    name.endsWith("-unpacked") ||
    name === "mac" ||
    name === "mac-arm64" ||
    name.startsWith(".icon-") ||
    name.endsWith(".blockmap") ||
    name.startsWith("latest") ||
    name.endsWith(".yml") ||
    name === "builder-debug.yml" ||
    name === "builder-effective-config.yaml";

  const entries = readdirSync(dist);
  entries.forEach((name) => {
    const p = join(dist, name);
    const isDir = statSync(p).isDirectory();

    if (isDir) {
      if (shouldRemoveByName(name)) rmSync(p, { recursive: true, force: true });
      return;
    }

    const isInstaller = keepExts.some((ext) => name.endsWith(ext));
    if (!isInstaller || shouldRemoveByName(name)) rmSync(p, { force: true });
  });
};

cleanDist();

import { spawn } from "child_process";
import { existsSync } from "fs";
import { platform } from "os";
import { join } from "path";

const isWindows = platform() === "win32";

const scriptPath = isWindows ? join(process.cwd(), "scripts", "generate-icons.bat") : join(process.cwd(), "scripts", "generate-icons.sh");

if (!existsSync(scriptPath)) {
  console.error(`Error: Script not found at ${scriptPath}`);
  console.error("Please ensure the generate-icons script exists in the scripts/ directory.");
  process.exit(1);
}

console.log(`Running icon generation for ${platform()}...`);
console.log("");

const scriptProcess = spawn(isWindows ? scriptPath : "bash", isWindows ? [] : [scriptPath], {
  stdio: "inherit",
  shell: true
});

scriptProcess.on("error", (error) => {
  console.error("Failed to start icon generation:", error.message);
  process.exit(1);
});

scriptProcess.on("close", (code) => {
  if (code !== 0) {
    console.error(`Icon generation failed with code ${code}`);
    process.exit(code);
  }
  console.log("Icon generation completed successfully!");
});

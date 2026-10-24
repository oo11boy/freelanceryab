// scripts/kill-ports.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORTS = [3000, 3001];
let killed = 0;

// -------------------------------------------------
// ۱. آزادسازی پورت‌ها
// -------------------------------------------------
PORTS.forEach((port) => {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    });

    const pids = new Set();
    output
      .trim()
      .split("\n")
      .forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== "0" && !isNaN(pid)) pids.add(pid);
      });

    pids.forEach((pid) => {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`✅ Port ${port} freed (PID ${pid} killed)`);
        killed++;
      } catch (e) {}
    });
  } catch (e) {}
});

// -------------------------------------------------
// ۲. حذف کامل پوشه .next (کامل، نه فقط dev)
// -------------------------------------------------
const nextDir = path.join(process.cwd(), ".next");
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log(`🧹 Removed: .next (full)`);
    killed++;
  } catch (e) {
    console.log(`⚠️ Could not remove .next: ${e.message}`);
  }
}

if (killed === 0) {
  console.log("✅ Everything is clean");
} else {
  console.log(`✅ Cleanup done (${killed} items)`);
}
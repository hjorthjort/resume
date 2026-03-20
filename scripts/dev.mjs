import browserSync from "browser-sync";
import chokidar from "chokidar";
import { spawn } from "node:child_process";
import path from "node:path";

const rootDir = process.cwd();
const browser = browserSync.create();
const watchedRoots = ["."];
const relevantPrefixes = [
  "resume.md",
  "src/",
  "scripts/"
];
const ignoredPrefixes = [
  ".git/",
  "node_modules/",
  "dist/",
  "tmp/",
  "LICENSES/"
];

let isBuilding = false;
let buildQueued = false;
let browserStarted = false;

function log(message) {
  console.log(`[preview] ${message}`);
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function isIgnored(filePath) {
  const normalized = normalizePath(filePath);

  if (
    normalized === ".DS_Store" ||
    normalized.endsWith(".swp") ||
    normalized === "README.md" ||
    normalized === "package-lock.json" ||
    normalized === "package.json" ||
    normalized === "THIRD_PARTY_NOTICES.md"
  ) {
    return true;
  }

  return ignoredPrefixes.some((prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix));
}

function isRelevant(filePath) {
  const normalized = normalizePath(filePath);
  return relevantPrefixes.some((prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix));
}

function runBuild() {
  return new Promise((resolve, reject) => {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    const child = spawn(npmCommand, ["run", "build"], {
      cwd: rootDir,
      stdio: "inherit",
      env: process.env
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Build failed with exit code ${code ?? "unknown"}`));
    });
  });
}

async function ensureBuild(trigger) {
  if (isBuilding) {
    buildQueued = true;
    log(`queued rebuild after ${trigger}`);
    return;
  }

  isBuilding = true;

  try {
    log(`building (${trigger})`);
    await runBuild();

    if (!browserStarted) {
      browser.init({
        server: path.join(rootDir, "dist"),
        files: [],
        port: 4173,
        ui: {
          port: 4174
        },
        open: false,
        notify: false,
        ghostMode: false
      });
      browserStarted = true;
      log("browser preview ready");
    } else {
      browser.reload();
      log("reloaded browser");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[preview] ${message}`);
  } finally {
    isBuilding = false;

    if (buildQueued) {
      buildQueued = false;
      await ensureBuild("queued change");
    }
  }
}

const watcher = chokidar.watch(watchedRoots, {
  cwd: rootDir,
  ignored: isIgnored,
  ignoreInitial: true,
  usePolling: true,
  interval: 150,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 50
  }
});

watcher.on("all", async (event, changedPath) => {
  if (!isRelevant(changedPath)) {
    return;
  }

  await ensureBuild(`${event}:${changedPath}`);
});

watcher.on("error", (error) => {
  console.error(`[preview] watcher error: ${error.message}`);
});

const shutdown = async () => {
  await watcher.close();
  browser.exit();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await ensureBuild("startup");
log(`watching ${relevantPrefixes.join(", ")}`);

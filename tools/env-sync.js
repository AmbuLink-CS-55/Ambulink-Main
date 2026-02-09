const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const ROOT_ENV_PATH = path.join(ROOT_DIR, ".env");

const REQUIRED_KEYS = [
  "API_SERVER_URL",
  "WS_SERVER_URL",
  "DISPATCHER_ID",
  "PATIENT_ID",
  "DRIVER_ID",
  "EMT_ID",
  "APP_STAGE",
  "DATABASE_URL",
];

function parseEnvFile(contents) {
  const result = {};
  const lines = contents.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function requireKeys(env, keys) {
  const missing = keys.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required root .env keys: ${missing.join(", ")}`);
  }
}

function formatEnvFile(entries) {
  return entries.map(([key, value]) => `${key}=${value}`).join("\n") + "\n";
}

function writeEnvFile(relativePath, entries) {
  const filePath = path.join(ROOT_DIR, relativePath);
  fs.writeFileSync(filePath, formatEnvFile(entries), "utf8");
  console.log(`[env-sync] wrote ${relativePath}`);
}

function main() {
  if (!fs.existsSync(ROOT_ENV_PATH)) {
    throw new Error("Root .env not found. Create one at repo root.");
  }

  const raw = fs.readFileSync(ROOT_ENV_PATH, "utf8");
  const rootEnv = parseEnvFile(raw);

  requireKeys(rootEnv, REQUIRED_KEYS);

  writeEnvFile("./apps/client-dashboard/.env", [
    ["VITE_API_SERVER_URL", rootEnv.API_SERVER_URL],
    ["VITE_WS_SERVER_URL", rootEnv.WS_SERVER_URL],
    ["VITE_DISPATCHER_ID", rootEnv.DISPATCHER_ID],
  ]);

  writeEnvFile("./apps/mobile/.env", [
    ["EXPO_PUBLIC_API_SERVER_URL", rootEnv.API_SERVER_URL],
    ["EXPO_PUBLIC_WS_SERVER_URL", rootEnv.WS_SERVER_URL],
    ["EXPO_PUBLIC_PATIENT_ID", rootEnv.PATIENT_ID],
    ["EXPO_PUBLIC_DRIVER_ID", rootEnv.DRIVER_ID],
    ["EXPO_PUBLIC_EMT_ID", rootEnv.EMT_ID],
    ["EXPO_PUBLIC_APP_STAGE", rootEnv.APP_STAGE],
  ]);

  writeEnvFile("./apps/backend/.env", [
    ["DATABASE_URL", rootEnv.DATABASE_URL],
    ["PATIENT_ID", rootEnv.PATIENT_ID],
    ["DRIVER_ID", rootEnv.DRIVER_ID],
    ["EMT_ID", rootEnv.EMT_ID],
    ["DISPATCHER_ID", rootEnv.DISPATCHER_ID],
    ["APP_STAGE", rootEnv.APP_STAGE],
  ]);
}

try {
  main();
} catch (error) {
  console.error(`[env-sync] ${error.message}`);
  process.exit(1);
}

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

function readEnvironmentFile(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .map((line) => {
          const index = line.indexOf("=");
          return [line.slice(0, index), line.slice(index + 1).trim()];
        })
    );
  } catch {
    return {};
  }
}

const local = { ...readEnvironmentFile(".env.local"), ...process.env };
const nodeMajor = Number(process.versions.node.split(".")[0]);
const agentSource = readFileSync("agent/agent.ts", "utf8");
const usesCodexLogin = agentSource.includes("chatgpt()");
const hasDatabaseUrl = Boolean(local.DATABASE_URL?.trim());
const requestedBackend = local.EVE_MEMORY_BACKEND?.trim() || "auto";
const backendIsValid = ["auto", "pglite", "postgres"].includes(requestedBackend);
const selectedBackend =
  requestedBackend === "postgres" || (requestedBackend === "auto" && hasDatabaseUrl)
    ? "PostgreSQL"
    : "embedded PGlite";
const databaseIsReady =
  backendIsValid && (selectedBackend !== "PostgreSQL" || hasDatabaseUrl);
const codex = spawnSync("codex", ["login", "status"], { stdio: "ignore", shell: false });

console.log("Eve local readiness");
console.log(`- Node.js 24+: ${nodeMajor >= 24 ? "ready" : `needs upgrade (found ${process.versions.node})`}`);
console.log(`- Model: ${usesCodexLogin ? "Codex login" : "hosted/gateway configuration"}`);
console.log(`- Codex login: ${usesCodexLogin ? (codex.status === 0 ? "ready" : "run codex login") : "not required by this model configuration"}`);
console.log(
  `- Memory: ${
    !backendIsValid
      ? `invalid EVE_MEMORY_BACKEND (${requestedBackend})`
      : databaseIsReady
        ? selectedBackend
        : "PostgreSQL selected; set DATABASE_URL"
  }`
);
console.log(`- Local data: ${local.EVE_MEMORY_DATA_DIR || ".eve-data/memory"}`);
console.log(
  `- Production: ${
    databaseIsReady && selectedBackend === "PostgreSQL"
      ? "database configured"
      : "not configured; local mode only"
  }`
);

if (nodeMajor >= 24 && databaseIsReady && (!usesCodexLogin || codex.status === 0)) {
  console.log("\nLocal setup is ready. Start Eve with: pnpm dev");
} else {
  console.log("\nComplete the item above, then run pnpm run doctor again.");
  process.exitCode = 1;
}

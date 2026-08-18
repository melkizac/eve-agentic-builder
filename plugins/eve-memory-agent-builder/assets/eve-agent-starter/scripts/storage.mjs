import { lstat, readdir, rm } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

const projectRoot = resolve(process.cwd());

const targets = [
  {
    path: "node_modules",
    label: "Project dependency links",
    note: "Package contents live in pnpm's shared global stores. Link targets are not counted."
  },
  {
    path: ".output",
    label: "Rebuildable production output",
    note: "Safe to clean. Run pnpm build before pnpm start."
  },
  {
    path: ".eve/dev-runtime/snapshots",
    label: "Eve-managed development snapshots",
    note: "Eve prunes these automatically. They are not removed by this script."
  },
  {
    path: ".eve/.workflow-data",
    label: "Protected Eve session state",
    note: "Never removed by this script."
  },
  {
    path: ".eve-data",
    label: "Protected operational memory",
    note: "Never removed by this script."
  }
];

function insideProject(path) {
  const local = relative(projectRoot, path);
  return local !== "" && local !== ".." && !local.startsWith(`..${sep}`) && !isAbsolute(local);
}

async function measure(path) {
  let files = 0;
  let links = 0;
  let bytes = 0;

  async function visit(current) {
    let stat;
    try {
      stat = await lstat(current);
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }

    if (stat.isSymbolicLink()) {
      links += 1;
      return;
    }
    if (stat.isFile()) {
      files += 1;
      bytes += stat.size;
      return;
    }
    if (!stat.isDirectory()) return;

    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) await visit(resolve(current, entry.name));
  }

  await visit(path);
  return { bytes, files, links };
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
}

async function report() {
  const rows = [];
  for (const target of targets) {
    const usage = await measure(resolve(projectRoot, target.path));
    rows.push({ ...target, ...usage });
  }

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ projectRoot, rows }, null, 2));
    return;
  }

  console.log("Eve project storage");
  console.log("Shared package and junction targets are intentionally not followed.\n");
  for (const row of rows) {
    console.log(`- ${row.label}: ${formatBytes(row.bytes)} (${row.files} files, ${row.links} links)`);
    console.log(`  ${row.path} — ${row.note}`);
  }
}

async function clean() {
  const output = resolve(projectRoot, ".output");
  if (!insideProject(output)) throw new Error("Refusing to clean outside the project.");
  const before = await measure(output);
  await rm(output, { force: true, recursive: true });
  console.log(`Removed ${formatBytes(before.bytes)} of rebuildable .output data.`);
  console.log("Sessions, operational memory, source files, and shared dependencies were preserved.");
  console.log("Run this command only while eve start is stopped.");
  console.log("Run pnpm build before pnpm start. pnpm dev does not need .output.");
}

const command = process.argv[2] ?? "report";
if (command === "report") await report();
else if (command === "clean") await clean();
else {
  console.error("Usage: node scripts/storage.mjs [report|clean] [--json]");
  process.exitCode = 1;
}

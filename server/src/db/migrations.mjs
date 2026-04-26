import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultRemoteConfig } from "./memoryStore.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));

export async function listMigrations() {
  const dir = path.join(here, "migrations");
  const files = await fs.readdir(dir);
  return files.filter((file) => file.endsWith(".sql")).sort().map((file) => path.join(dir, file));
}

export async function renderMigrationPlan() {
  const migrations = await listMigrations();
  return migrations.map((file) => ({ file, sql: fs.readFile(file, "utf8") }));
}

export async function seedPayload() {
  return {
    config: defaultRemoteConfig(),
    seededAt: new Date().toISOString()
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2] || "plan";
  if (command === "seed") {
    console.log(JSON.stringify(await seedPayload(), null, 2));
  } else {
    const migrations = await listMigrations();
    console.log(JSON.stringify({ mode: "plan", migrations }, null, 2));
  }
}

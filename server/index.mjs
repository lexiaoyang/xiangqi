import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const dataDir = path.join(__dirname, "data");
const runsFile = path.join(dataDir, "runs.jsonl");

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(runsFile)) fs.writeFileSync(runsFile, "", "utf8");
}

function readAllRuns() {
  ensureDataFile();
  const raw = fs.readFileSync(runsFile, "utf8").trim();
  if (!raw) return [];
  const lines = raw.split("\n");
  const out = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      /* skip bad line */
    }
  }
  return out;
}

function appendRun(record) {
  ensureDataFile();
  fs.appendFileSync(runsFile, `${JSON.stringify(record)}\n`, "utf8");
}

function buildLeaderboard(rows, query) {
  const sceneId = query.get("sceneId") || "";
  const difficulty = query.get("difficulty") || "";
  const mode = query.get("mode") || "ranked";
  const sort = query.get("sort") === "steps" ? "steps" : "durationMs";
  const limit = Math.min(100, Math.max(1, Number(query.get("limit") || 20)));

  const filtered = rows.filter(
    (r) =>
      r &&
      r.won === true &&
      r.mode === mode &&
      r.sceneId === sceneId &&
      r.difficulty === difficulty
  );

  const byPlayer = new Map();
  for (const r of filtered) {
    const pid = String(r.clientPlayerId || "anon");
    const cur = byPlayer.get(pid);
    if (!cur) {
      byPlayer.set(pid, r);
      continue;
    }
    const better =
      sort === "steps"
        ? r.steps < cur.steps || (r.steps === cur.steps && r.durationMs < cur.durationMs)
        : r.durationMs < cur.durationMs || (r.durationMs === cur.durationMs && r.steps < cur.steps);
    if (better) byPlayer.set(pid, r);
  }

  const list = [...byPlayer.values()];
  list.sort((a, b) => {
    if (sort === "steps") {
      if (a.steps !== b.steps) return a.steps - b.steps;
      return a.durationMs - b.durationMs;
    }
    if (a.durationMs !== b.durationMs) return a.durationMs - b.durationMs;
    return a.steps - b.steps;
  });

  return list.slice(0, limit).map((r, i) => ({
    rank: i + 1,
    durationMs: r.durationMs,
    steps: r.steps,
    sceneId: r.sceneId,
    difficulty: r.difficulty,
    mode: r.mode,
    playedAt: r.playedAt,
    clientPlayerId: r.clientPlayerId
  }));
}

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(json);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/leaderboard") {
    const rows = readAllRuns();
    const rowsOut = buildLeaderboard(rows, url.searchParams);
    sendJson(res, 200, { rows: rowsOut });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/runs") {
    try {
      const raw = await readBody(req);
      const record = JSON.parse(raw);
      appendRun(record);
      sendJson(res, 201, { ok: true });
    } catch {
      sendJson(res, 400, { ok: false, error: "invalid_json" });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }

  sendJson(res, 404, { ok: false, error: "not_found" });
});

server.listen(PORT, () => {
  ensureDataFile();
  console.log(`maze history server http://127.0.0.1:${PORT}`);
});

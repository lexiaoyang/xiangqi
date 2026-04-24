import type { LeaderboardRow, LeaderboardSort, RunRecordV1 } from "./types";

const LOCAL_KEY = "maze:runs:v1";
const PLAYER_KEY = "maze:playerId:v1";

function randomId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function newClientRunId(): string {
  return randomId();
}

export function getOrCreatePlayerId(): string {
  try {
    const existing = localStorage.getItem(PLAYER_KEY);
    if (existing) return existing;
    const id = randomId();
    localStorage.setItem(PLAYER_KEY, id);
    return id;
  } catch {
    return randomId();
  }
}

export function appendLocalRun(record: RunRecordV1): void {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const list: RunRecordV1[] = raw ? (JSON.parse(raw) as RunRecordV1[]) : [];
    list.unshift(record);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    /* ignore */
  }
}

export function readLocalRuns(limit = 30): RunRecordV1[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const list: RunRecordV1[] = raw ? (JSON.parse(raw) as RunRecordV1[]) : [];
    return list.slice(0, limit);
  } catch {
    return [];
  }
}

function apiPrefix(): string {
  const v = import.meta.env.VITE_API_BASE as string | undefined;
  if (v) return v.replace(/\/$/, "");
  return "";
}

export async function postRunRemote(record: RunRecordV1): Promise<boolean> {
  const prefix = apiPrefix();
  const url = prefix ? `${prefix}/api/runs` : "/api/runs";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchLeaderboard(params: {
  sceneId: string;
  difficulty: string;
  mode: string;
  sort?: LeaderboardSort;
  limit?: number;
}): Promise<LeaderboardRow[]> {
  const prefix = apiPrefix();
  const q = new URLSearchParams({
    sceneId: params.sceneId,
    difficulty: params.difficulty,
    mode: params.mode,
    sort: params.sort ?? "durationMs",
    limit: String(params.limit ?? 20)
  });
  const url = prefix ? `${prefix}/api/leaderboard?${q}` : `/api/leaderboard?${q}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as { rows?: LeaderboardRow[] };
    return data.rows ?? [];
  } catch {
    return [];
  }
}

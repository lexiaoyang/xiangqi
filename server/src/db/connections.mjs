import { createMemoryStore } from "./memoryStore.mjs";

export function createDbClients(env) {
  const memoryStore = createMemoryStore();
  return {
    mode: env.mode,
    memoryStore,
    async query(sql, params = []) {
      if (env.mode === "memory") return { rows: [], rowCount: 0, sql, params };
      throw new Error("PostgreSQL driver is not installed in this lightweight repo; use migrations SQL with your deployment driver.");
    },
    redis: createRedisLike(env)
  };
}

export function createRedisLike() {
  const values = new Map();
  return {
    async get(key) {
      const item = values.get(key);
      if (!item) return null;
      if (item.expiresAt && item.expiresAt <= Date.now()) {
        values.delete(key);
        return null;
      }
      return item.value;
    },
    async set(key, value, options = {}) {
      values.set(key, { value, expiresAt: options.ttlMs ? Date.now() + options.ttlMs : undefined });
      return "OK";
    },
    async incr(key, ttlMs) {
      const current = Number((await this.get(key)) || 0) + 1;
      await this.set(key, String(current), { ttlMs });
      return current;
    }
  };
}

export async function healthCheck(clients) {
  await clients.redis.set("health", "ok", { ttlMs: 1000 });
  return {
    ok: true,
    mode: clients.mode,
    redis: (await clients.redis.get("health")) === "ok" ? "ok" : "degraded",
    database: clients.mode === "memory" ? "memory" : "configured"
  };
}

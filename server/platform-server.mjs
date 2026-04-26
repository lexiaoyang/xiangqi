import http from "node:http";
import { loadBackendEnv } from "./src/config/env.mjs";
import { createPlatformApi, readJsonBody, sendJson } from "./src/http/platformApi.mjs";

const env = loadBackendEnv();
const api = createPlatformApi();

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return sendJson(res, 204, {}, env.corsOrigin);
  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
  try {
    const body = ["POST", "PUT", "PATCH"].includes(req.method || "") ? await readJsonBody(req) : {};
    const result = await api.handle({ method: req.method || "GET", pathname: url.pathname, query: url.searchParams, body });
    sendJson(res, result.status, result.body, env.corsOrigin);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: "internal_error", message: error.message }, env.corsOrigin);
  }
});

server.listen(env.port, () => {
  console.log(`Platform backend listening on http://127.0.0.1:${env.port} (${env.mode})`);
});

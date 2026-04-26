export function loadBackendEnv(source = process.env) {
  return {
    mode: source.PLATFORM_BACKEND_MODE || "memory",
    port: Number(source.PORT || 8787),
    databaseUrl: source.DATABASE_URL || "postgres://xiangqi:xiangqi@127.0.0.1:54329/xiangqi",
    redisUrl: source.REDIS_URL || "redis://127.0.0.1:63799",
    jwtSecret: source.JWT_SECRET || "dev-only-change-me",
    sessionSecret: source.SESSION_SECRET || "dev-session-secret",
    corsOrigin: source.CORS_ORIGIN || "*",
    paymentSandboxSecret: source.PAYMENT_SANDBOX_SECRET || "sandbox-payment-secret",
    adSandboxSecret: source.AD_SANDBOX_SECRET || "sandbox-ad-secret"
  };
}

export function assertProductionSecrets(env) {
  if (env.mode !== "production") return;
  for (const key of ["jwtSecret", "sessionSecret", "paymentSandboxSecret", "adSandboxSecret"]) {
    if (String(env[key] || "").includes("dev") || String(env[key] || "").includes("sandbox")) {
      throw new Error(`Unsafe production secret: ${key}`);
    }
  }
}

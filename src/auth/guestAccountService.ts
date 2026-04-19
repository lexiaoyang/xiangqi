import { logEvent } from "../telemetry/logger";
import type { BindPayload, ProviderType, SessionSnapshot } from "./types";
import { AuthError } from "./types";

const SESSION_KEY = "xiangqi.session.v1";
const DEVICE_KEY = "xiangqi.device.id.v1";
const BIND_ATTEMPT_KEY = "xiangqi.bind.attempts.v1";
const CONFLICT_MAP_KEY = "xiangqi.bind.conflicts.v1";

const ACCESS_TOKEN_TTL_MS = 10 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const REFRESH_THRESHOLD_MS = 2 * 60 * 1000;

const now = () => Date.now();

const randomId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getOrCreateDeviceId = (): string => {
  const cached = localStorage.getItem(DEVICE_KEY);
  if (cached) return cached;
  const next = randomId("dev");
  localStorage.setItem(DEVICE_KEY, next);
  return next;
};

const issueTokens = () => ({
  accessToken: randomId("atk"),
  refreshToken: randomId("rtk"),
  accessExpiresAt: now() + ACCESS_TOKEN_TTL_MS,
  refreshExpiresAt: now() + REFRESH_TOKEN_TTL_MS
});

const hydrateOrCreate = (): SessionSnapshot => {
  const existing = readJson<SessionSnapshot | null>(SESSION_KEY, null);
  if (existing) return existing;
  const created = createGuestSession(getOrCreateDeviceId());
  persistSession(created);
  return created;
};

export const createGuestSession = (deviceId: string): SessionSnapshot => {
  const guestId = randomId("guest");
  const userId = randomId("user");
  return {
    profile: {
      userId,
      guestId,
      nickname: `游客${guestId.slice(-4)}`,
      deviceId,
      bindingState: "guest"
    },
    token: issueTokens(),
    assetsVersion: 1,
    progressVersion: 1,
    updatedAt: new Date().toISOString()
  };
};

export const persistSession = (session: SessionSnapshot): SessionSnapshot => {
  const next = { ...session, updatedAt: new Date().toISOString() };
  writeJson(SESSION_KEY, next);
  return next;
};

export const getSession = (): SessionSnapshot | null => readJson<SessionSnapshot | null>(SESSION_KEY, null);

export const ensureSession = (): SessionSnapshot => {
  const session = hydrateOrCreate();
  if (session.token.refreshExpiresAt <= now()) {
    const renewed = createGuestSession(getOrCreateDeviceId());
    logEvent({ name: "auth_refresh_expired_recreate", level: "warn", data: { oldGuestId: session.profile.guestId } });
    return persistSession(renewed);
  }
  return session;
};

export const refreshTokenIfNeeded = (session: SessionSnapshot): SessionSnapshot => {
  const remaining = session.token.accessExpiresAt - now();
  if (remaining > REFRESH_THRESHOLD_MS) return session;
  if (session.token.refreshExpiresAt <= now()) {
    throw new AuthError("TOKEN_EXPIRED", "登录已过期，请重新进入。");
  }
  const refreshed: SessionSnapshot = {
    ...session,
    token: issueTokens()
  };
  logEvent({ name: "auth_refresh_token", data: { guestId: session.profile.guestId } });
  return persistSession(refreshed);
};

const registerAttempt = (): number => {
  const attempts = readJson<number[]>(BIND_ATTEMPT_KEY, []);
  const thresholdStart = now() - 10 * 60 * 1000;
  const filtered = attempts.filter((t) => t >= thresholdStart);
  filtered.push(now());
  writeJson(BIND_ATTEMPT_KEY, filtered);
  return filtered.length;
};

const getOrCreateProviderUid = (provider: ProviderType, identifier: string): string | null => {
  const key = `${provider}:${identifier}`;
  const map = readJson<Record<string, string>>(CONFLICT_MAP_KEY, {});
  if (!map[key]) {
    if (identifier.toLowerCase().includes("taken")) {
      map[key] = randomId("existing");
      writeJson(CONFLICT_MAP_KEY, map);
    } else {
      return null;
    }
  }
  return map[key];
};

const validateVerifyCode = (provider: ProviderType, code: string) => {
  if (provider === "phone" && !/^\d{6}$/.test(code)) {
    throw new AuthError("INVALID_VERIFY_CODE", "验证码格式错误，应为 6 位数字。");
  }
  if (provider === "wechat" && code.trim().length < 4) {
    throw new AuthError("INVALID_VERIFY_CODE", "第三方授权校验码无效。");
  }
};

export const bindGuestAccount = (session: SessionSnapshot, payload: BindPayload): { session: SessionSnapshot; rollback: SessionSnapshot } => {
  const attemptCount = registerAttempt();
  if (attemptCount > 5) {
    throw new AuthError("RATE_LIMITED", "绑定尝试过于频繁，请稍后再试。", false, { attemptCount });
  }
  validateVerifyCode(payload.provider, payload.verifyCode);

  const rollback = { ...session, profile: { ...session.profile }, token: { ...session.token } };
  const conflictUid = getOrCreateProviderUid(payload.provider, payload.identifier);
  if (conflictUid && !payload.mergeConfirmed) {
    throw new AuthError("BIND_CONFLICT", "该凭据已绑定其他账号，需要确认合并。", false, { conflictUid });
  }

  if (payload.verifyCode === "000000") {
    throw new AuthError("TRANSIENT_FAILURE", "绑定网关暂时不可用，请重试。", true);
  }

  const bound: SessionSnapshot = {
    ...session,
    profile: {
      ...session.profile,
      bindingState: "bound",
      provider: payload.provider,
      providerUid: payload.identifier,
      boundAt: new Date().toISOString(),
      nickname: payload.provider === "phone" ? `用户${payload.identifier.slice(-4)}` : "微信用户"
    }
  };

  logEvent({
    name: "auth_bind_success",
    data: {
      guestId: session.profile.guestId,
      userId: session.profile.userId,
      provider: payload.provider,
      idempotencyKey: payload.idempotencyKey,
      mergeConfirmed: payload.mergeConfirmed
    }
  });

  return { session: persistSession(bound), rollback };
};

export const rollbackBind = (snapshot: SessionSnapshot): SessionSnapshot => {
  logEvent({ name: "auth_bind_rollback", level: "warn", data: { guestId: snapshot.profile.guestId } });
  return persistSession(snapshot);
};

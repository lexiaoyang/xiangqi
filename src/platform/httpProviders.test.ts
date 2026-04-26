import { afterEach, describe, expect, it, vi } from "vitest";
import { createHttpPlatformProviders } from "./httpProviders";

describe("httpPlatformProviders", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("bootstraps and caches a backend guest session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            ok: true,
            session: {
              profile: { userId: "user_http", guestId: "guest_http", nickname: "游客玩家", bindingState: "guest", provider: "guest", createdAt: "2026-01-01T00:00:00.000Z" },
              token: { accessToken: "atk", refreshToken: "rtk", accessExpiresAt: Date.now() + 1000, refreshExpiresAt: Date.now() + 10000 },
              device: { deviceId: "dev_http", platform: "web", appVersion: "0.1.0", firstSeenAt: "2026-01-01T00:00:00.000Z", lastSeenAt: "2026-01-01T00:00:00.000Z" },
              wallet: {
                userId: "user_http",
                balances: { coins: 120, stamina: 24, hint: 0, undo: 0, ticket: 0, premium: 0 },
                ledgerCursor: "0",
                syncState: "online",
                reconciliation: { state: "clean", issueCount: 0 },
                updatedAt: "2026-01-01T00:00:00.000Z"
              },
              updatedAt: "2026-01-01T00:00:00.000Z"
            }
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );

    const providers = createHttpPlatformProviders("/api/platform");
    const result = await providers.auth.ensureGuestSession();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.profile.userId).toBe("user_http");
    expect(localStorage.getItem("platform:user:v1")).toContain("user_http");
  });

  it("falls back to cached wallet when backend is unavailable", async () => {
    localStorage.setItem(
      "platform:wallet:v1",
      JSON.stringify({
        userId: "user_http",
        balances: { coins: 5, stamina: 1, hint: 0, undo: 0, ticket: 0, premium: 0 },
        ledgerCursor: "9",
        syncState: "online",
        reconciliation: { state: "clean", issueCount: 0 },
        updatedAt: "2026-01-01T00:00:00.000Z"
      })
    );
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));

    const providers = createHttpPlatformProviders("/api/platform");
    const result = await providers.wallet.getWallet({
      profile: { userId: "user_http", guestId: "guest_http", nickname: "游客玩家", bindingState: "guest", createdAt: "2026-01-01T00:00:00.000Z" },
      token: { accessToken: "atk", refreshToken: "rtk", accessExpiresAt: Date.now() + 1000, refreshExpiresAt: Date.now() + 10000 },
      device: { deviceId: "dev_http", platform: "web", appVersion: "0.1.0", firstSeenAt: "2026-01-01T00:00:00.000Z", lastSeenAt: "2026-01-01T00:00:00.000Z" },
      wallet: JSON.parse(localStorage.getItem("platform:wallet:v1") || "{}"),
      updatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.syncState).toBe("cached");
  });
});

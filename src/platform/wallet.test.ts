import { describe, expect, it } from "vitest";
import { createRequestId } from "./api";
import { createMockPlatformProviders } from "./mockProviders";
import { canAfford, cachedWalletForSession, projectWallet, walletUiState } from "./wallet";

describe("platform wallet ledger", () => {
  it("projects balances and UI states", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;

    const wallet = await providers.wallet.getWallet(session.data);
    expect(wallet.ok).toBe(true);
    if (!wallet.ok) return;

    const projected = projectWallet(wallet.data, [{ kind: "coins", amount: 10 }]);
    expect(projected.balances.coins).toBe(wallet.data.balances.coins + 10);
    expect(walletUiState(projected).canMutate).toBe(true);
    expect(canAfford(projected, [{ kind: "coins", amount: 1 }])).toBe(true);
  });

  it("deduplicates wallet mutations by idempotency key", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;

    const idempotencyKey = createRequestId("idem");
    const first = await providers.wallet.grant(
      session.data,
      { source: "daily_sign_in", sourceId: "daily", deltas: [{ kind: "coins", amount: 50 }] },
      { idempotencyKey }
    );
    const second = await providers.wallet.grant(
      session.data,
      { source: "daily_sign_in", sourceId: "daily", deltas: [{ kind: "coins", amount: 50 }] },
      { idempotencyKey }
    );

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.data.balances.coins).toBe(first.data.balances.coins);
  });

  it("reads cached wallet for offline display", async () => {
    const providers = createMockPlatformProviders();
    const session = await providers.auth.ensureGuestSession();
    expect(session.ok).toBe(true);
    if (!session.ok) return;
    await providers.wallet.getWallet(session.data);
    expect(cachedWalletForSession(session.data).ok).toBe(true);
    expect(walletUiState(null).canMutate).toBe(false);
  });
});

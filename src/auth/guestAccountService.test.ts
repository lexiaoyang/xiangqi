import { beforeEach, describe, expect, it } from "vitest";
import { bindGuestAccount, createGuestSession, ensureSession, getOrCreateDeviceId, refreshTokenIfNeeded, rollbackBind } from "./guestAccountService";
import { AuthError } from "./types";

describe("guest account service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("首次可创建游客会话", () => {
    const session = ensureSession();
    expect(session.profile.bindingState).toBe("guest");
    expect(session.profile.guestId).toMatch(/^guest_/);
  });

  it("令牌接近过期时自动续期", () => {
    const base = createGuestSession(getOrCreateDeviceId());
    base.token.accessExpiresAt = Date.now() + 1000;
    const refreshed = refreshTokenIfNeeded(base);
    expect(refreshed.token.accessToken).not.toBe(base.token.accessToken);
  });

  it("绑定成功后变为已绑定状态", () => {
    const base = ensureSession();
    const result = bindGuestAccount(base, {
      provider: "phone",
      identifier: "13800138000",
      verifyCode: "123456",
      idempotencyKey: "idem_1",
      mergeConfirmed: false
    });
    expect(result.session.profile.bindingState).toBe("bound");
    expect(result.session.profile.provider).toBe("phone");
  });

  it("冲突未确认时返回 BIND_CONFLICT，回滚可恢复", () => {
    const base = ensureSession();
    try {
      bindGuestAccount(base, {
        provider: "phone",
        identifier: "taken-user",
        verifyCode: "123456",
        idempotencyKey: "idem_2",
        mergeConfirmed: false
      });
    } catch (error) {
      expect(error).toBeInstanceOf(AuthError);
      expect((error as AuthError).code).toBe("BIND_CONFLICT");
      const rolled = rollbackBind(base);
      expect(rolled.profile.bindingState).toBe("guest");
      return;
    }
    throw new Error("should throw conflict");
  });
});

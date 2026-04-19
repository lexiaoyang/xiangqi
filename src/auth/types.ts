export type BindingState = "guest" | "bound";
export type ProviderType = "phone" | "wechat";

export interface AccountProfile {
  userId: string;
  guestId: string;
  nickname: string;
  deviceId: string;
  bindingState: BindingState;
  provider?: ProviderType;
  providerUid?: string;
  boundAt?: string;
}

export interface SessionToken {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
}

export interface SessionSnapshot {
  profile: AccountProfile;
  token: SessionToken;
  assetsVersion: number;
  progressVersion: number;
  updatedAt: string;
}

export interface BindPayload {
  provider: ProviderType;
  identifier: string;
  verifyCode: string;
  idempotencyKey: string;
  mergeConfirmed: boolean;
}

export type AuthErrorCode =
  | "RATE_LIMITED"
  | "INVALID_VERIFY_CODE"
  | "BIND_CONFLICT"
  | "TOKEN_EXPIRED"
  | "TRANSIENT_FAILURE";

export class AuthError extends Error {
  code: AuthErrorCode;
  retryable: boolean;
  context?: Record<string, unknown>;

  constructor(code: AuthErrorCode, message: string, retryable = false, context?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.context = context;
  }
}

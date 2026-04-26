export type PlatformErrorCode =
  | "NETWORK_UNAVAILABLE"
  | "UNAUTHORIZED"
  | "SESSION_EXPIRED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "IDEMPOTENCY_CONFLICT"
  | "PROVIDER_UNAVAILABLE"
  | "COMPLIANCE_RESTRICTED"
  | "FEATURE_DISABLED"
  | "ALREADY_CLAIMED"
  | "INSUFFICIENT_BALANCE"
  | "UNKNOWN";

export type PlatformError = {
  code: PlatformErrorCode;
  message: string;
  retryable: boolean;
  requestId: string;
  details?: Record<string, unknown>;
};

export type ApiResult<T> = { ok: true; data: T; requestId: string } | { ok: false; error: PlatformError };

export type RequestMeta = {
  requestId?: string;
  idempotencyKey?: string;
  userId?: string;
  deviceId?: string;
};

export const createRequestId = (prefix = "req"): string => `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;

export function ok<T>(data: T, requestId = createRequestId()): ApiResult<T> {
  return { ok: true, data, requestId };
}

export function err(code: PlatformErrorCode, message: string, retryable = false, details?: Record<string, unknown>, requestId = createRequestId()): ApiResult<never> {
  return {
    ok: false,
    error: {
      code,
      message,
      retryable,
      details,
      requestId
    }
  };
}

export function unwrap<T>(result: ApiResult<T>): T {
  if (result.ok) return result.data;
  throw Object.assign(new Error(result.error.message), { platformError: result.error });
}

# 游客绑定 API 契约（实现口径）

## 1. 创建游客会话

- **接口**：`POST /auth/guest/session`
- **入参**：
  - `device_id: string`
- **出参**：
  - `guest_id: string`
  - `user_id: string`
  - `access_token: string`
  - `refresh_token: string`
  - `access_expires_at: number`
  - `refresh_expires_at: number`

## 2. 续期会话

- **接口**：`POST /auth/token/refresh`
- **入参**：
  - `refresh_token: string`
- **出参**：
  - 新的 `access_token` 与过期时间
- **错误码**：
  - `TOKEN_EXPIRED`

## 3. 游客绑定

- **接口**：`POST /auth/guest/bind`
- **入参**：
  - `provider: "phone" | "wechat"`
  - `identifier: string`
  - `verify_code: string`
  - `idempotency_key: string`
  - `merge_confirmed: boolean`
- **出参**：
  - `binding_state: "bound"`
  - `provider_uid: string`
  - `bound_at: string`

## 错误码与幂等

- `RATE_LIMITED`：10 分钟内尝试超过阈值。
- `INVALID_VERIFY_CODE`：验证码不合法。
- `BIND_CONFLICT`：凭据已绑定其他账号，需显式确认合并。
- `TOKEN_EXPIRED`：会话不可续期。
- `TRANSIENT_FAILURE`：可重试异常（客户端应指数退避重试）。

幂等规则：
- `idempotency_key` 相同请求不得重复发起绑定副作用。

# 游客绑定现状缺口与字段接口对照

## 现状缺口

- 缺少统一 `guest_id` 会话生命周期管理。
- 缺少绑定冲突确认与回滚机制。
- 缺少幂等键与重试策略说明。
- 缺少高频绑定风控阈值和异常告警口径。

## 字段对照表

| 领域 | 关键字段 | 现状 | 本次补齐 |
|---|---|---|---|
| 身份 | `guest_id` `user_id` `binding_state` | 部分无统一 | 统一建模并持久化 |
| 会话 | `access_token` `refresh_token` `expires_at` | 无续期策略 | 增加续期阈值与失效重建 |
| 绑定 | `provider` `provider_uid` `bound_at` | 无冲突口径 | 增加冲突检测与确认 |
| 幂等 | `idempotency_key` | 未定义 | 接口强制入参 |

## 接口对照表

| 接口 | 目标能力 | 本次状态 |
|---|---|---|
| `POST /auth/guest/session` | 创建游客会话 | 已模拟实现（客户端服务层） |
| `POST /auth/token/refresh` | access token 续期 | 已模拟实现 |
| `POST /auth/guest/bind` | 游客绑定正式凭据 | 已模拟实现（含冲突、重试、回滚） |

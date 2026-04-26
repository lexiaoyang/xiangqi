## Context

当前项目的“服务端”是 `server/index.mjs`，主要用于本地开发：

- 业务代码集中在一个文件。
- 数据保存在 `server/data/platform.json` 和 `runs.jsonl`。
- 用户、钱包、订单、广告奖励、奖励中心、活动进度、弹窗记录等只是 mock 状态。
- 前端大量逻辑仍通过 `mockPlatformProviders` 和 `localStorage` 完成，服务端不是权威来源。

这适合演示，不适合真实用户。真正上线需要服务端拥有用户身份、资产、订单、奖励、活动和审计的最终解释权。

## Goals / Non-Goals

**Goals:**

- 建立真实后端平台，服务端成为身份、存档、资产、订单、广告奖励和活动进度的权威数据源。
- 使用数据库持久化用户数据，支持多用户、多设备、并发请求、幂等、事务和审计。
- 将前端 `localStorage` 从权威存储降级为离线缓存/启动缓存。
- 保留现有 mock provider 作为本地 fixture/sandbox，新增真实 HTTP provider。
- 设计足够接入真实支付、广告 SDK、运营后台和数据分析平台。
- 提供数据库迁移、种子数据、测试和运维 runbook。

**Non-Goals:**

- 不在首期实现完整管理后台 UI。
- 不在首期接入真实微信/Apple/Google/Stripe/广告 SDK 生产账号。
- 不把所有历史 localStorage 数据无损迁移到云端；只做可控的首次同步和冲突处理。
- 不替换当前前端游戏玩法逻辑。

## Decisions

### Decision 1: PostgreSQL 作为权威数据源

正式后端使用 PostgreSQL 存储用户、设备、会话、云存档、钱包、账本、订单、广告 token、奖励、活动、弹窗记录、远程配置、审计和风控。

理由：

- 钱包账本、支付订单、奖励领取需要事务、一致性、唯一约束和可审计历史。
- JSON 文件无法处理并发、索引、迁移、回滚和备份。
- PostgreSQL 适合 append-only ledger、订单状态机和复杂查询。

替代方案：继续 JSON 文件或 SQLite。实现快，但不适合多用户生产环境，不采用。

### Decision 2: Redis 用于短期状态

Redis 用于 access token/session cache、限流、广告冷却、弹窗短期频控、短期幂等锁和防刷计数。所有权威资产仍落 PostgreSQL。

理由：

- 冷却、限流和短期重复请求需要高频读写。
- 避免把所有 transient 状态都压到数据库。
- 即使 Redis 丢失，也不应丢失资产和订单。

### Decision 3: 服务端权威 ledger

所有资产变动走 `ledger_entries` append-only 表，并在同一事务内更新 `wallet_balances` 投影。每次 grant/spend 必须带 `idempotency_key`，数据库唯一约束保证重复请求不会重复发奖。

理由：

- 付费、广告奖励、活动奖励都不能由前端直接加资产。
- 幂等和审计是商业化系统底线。
- 投影余额用于快速读取，账本用于对账和追溯。

### Decision 4: API/Service/Repository 分层

后端从单文件拆成：

- `server/src/http`：路由、请求解析、鉴权、错误响应。
- `server/src/services`：身份、钱包、支付、广告、奖励、活动、配置、合规、分析业务逻辑。
- `server/src/repositories`：数据库读写和事务封装。
- `server/src/db`：连接池、迁移、schema、种子数据。
- `server/src/integrations`：支付、广告、分析、短信/社交登录适配器。

理由：

- 业务会快速变大，单文件无法维护。
- Service 层能复用到测试、后台任务和未来管理后台。
- Repository 层便于从 mock 切到 PostgreSQL。

### Decision 5: 前端 provider 双模式

保留 `mockPlatformProviders`，新增 `httpPlatformProviders`：

- 开发默认可选 mock。
- 真实模式通过 `VITE_PLATFORM_API_BASE` 指向后端。
- 前端启动时从服务端拉取 session/config/wallet/rewards/events。
- `localStorage` 只缓存最后一次成功响应，用于启动骨架和离线提示。

理由：

- 不破坏当前本地开发速度。
- 可以渐进式迁移，不一次性重写所有前端逻辑。

### Decision 6: 支付和广告先做可验证 mock adapter

首期仍可使用 mock provider，但接口按真实生产语义设计：

- 支付：订单创建、支付开始、回调/收据校验、发货、退款、恢复购买。
- 广告：show token、provider callback、完成验证、奖励发放、pending retry。

理由：

- 真实 SDK 接入前也能把服务端状态机和账本打牢。
- 后续替换 adapter，不改核心订单/账本逻辑。

### Decision 7: 审计和合规内建

所有高价值动作写审计：登录、绑定、删除、支付状态变化、广告奖励、奖励领取、活动奖励、手动发放、风控限制、隐私同意变更。分析事件做隐私过滤后入库或转发。

理由：

- 商业化系统必须能解释资产为什么变化。
- 删除账号、导出数据、未成年限制和隐私同意不能后补。

## Data Model Sketch

核心表：

- `users(id, guest_id, nickname, binding_state, provider, provider_uid_hash, created_at, bound_at, deletion_requested_at)`
- `devices(id, user_id, platform, app_version, first_seen_at, last_seen_at, revoked_at)`
- `sessions(id, user_id, device_id, refresh_token_hash, access_expires_at, refresh_expires_at, revoked_at)`
- `cloud_saves(user_id, version, max_unlocked_level, per_level_stars_json, settings_json, updated_at)`
- `wallet_balances(user_id, coins, stamina, hint, undo, ticket, premium, ledger_cursor, updated_at)`
- `ledger_entries(id, user_id, idempotency_key, source, source_id, deltas_json, balance_after_json, audit_id, created_at)`
- `catalog_skus(id, version, title, price_label, currency, amount, provider, contents_json, enabled, tags_json, limits_json)`
- `orders(id, user_id, sku_id, amount, currency, provider, status, idempotency_key, provider_transaction_id, receipt_hash, fulfillment_ledger_id, created_at, updated_at)`
- `ad_show_tokens(token_hash, user_id, placement_id, reward_id, expires_at, completed_at, consumed_at, provider_show_id)`
- `reward_definitions(id, kind, title, description, rewards_json, schedule_json, enabled)`
- `reward_claims(id, user_id, reward_id, idempotency_key, ledger_id, claimed_at)`
- `event_progress(user_id, event_id, task_id, progress, state, updated_at)`
- `popup_records(user_id, popup_id, day, impressions, suppressed_today, last_shown_at)`
- `remote_configs(version, config_json, active, created_at, created_by)`
- `analytics_events(id, user_id, device_id, name, data_json, created_at)`
- `audit_events(id, user_id, device_id, type, request_id, payload_json, created_at)`
- `fraud_signals(id, user_id, kind, severity, payload_json, created_at)`

## API Shape

建议保留 `/api/platform/*` 前缀，但切换为真实响应格式：

- `POST /api/platform/identity/guest`
- `POST /api/platform/identity/bind`
- `POST /api/platform/session/refresh`
- `GET /api/platform/me`
- `GET /api/platform/cloud-save`
- `PUT /api/platform/cloud-save`
- `GET /api/platform/wallet`
- `POST /api/platform/wallet/spend`
- `GET /api/platform/catalog`
- `POST /api/platform/orders`
- `POST /api/platform/orders/verify`
- `POST /api/platform/orders/provider-callback`
- `POST /api/platform/orders/fulfill`
- `GET /api/platform/orders/restore`
- `GET /api/platform/ads/placements`
- `POST /api/platform/ads/show-token`
- `POST /api/platform/ads/complete`
- `GET /api/platform/rewards`
- `POST /api/platform/rewards/claim`
- `GET /api/platform/events`
- `POST /api/platform/events/progress`
- `POST /api/platform/events/claim`
- `POST /api/platform/popups/impression`
- `POST /api/platform/popups/suppress`
- `GET /api/platform/config`
- `POST /api/platform/analytics`
- `GET /api/platform/privacy/export`
- `POST /api/platform/privacy/delete`

## Risks / Trade-offs

- [Risk] 一次性迁移范围大 → Mitigation：分阶段实现，先身份/钱包/云存档，再支付/广告/奖励/活动。
- [Risk] 新增数据库和 Redis 提高本地开发门槛 → Mitigation：提供 Docker Compose、迁移脚本、种子数据和 mock fallback。
- [Risk] 前端状态与服务端状态冲突 → Mitigation：引入 save version、server timestamp、首次云同步确认和冲突合并策略。
- [Risk] 幂等实现不严格导致重复发奖 → Mitigation：数据库唯一约束、事务和测试覆盖并发重复请求。
- [Risk] 支付/广告 provider 回调伪造 → Mitigation：签名校验、receipt hash、callback replay 防护和审计。
- [Risk] 隐私数据误入分析事件 → Mitigation：服务端 payload sanitizer、字段 allowlist 和审计测试。

## Migration Plan

1. 搭建后端目录结构、配置、数据库连接、迁移工具和 Docker Compose。
2. 建立 PostgreSQL schema、Redis 连接和种子配置。
3. 实现身份/session/device/cloud-save。
4. 实现钱包 ledger 和资产读写，前端资源条切服务端权威。
5. 实现 SKU/订单/发货/退款/恢复购买状态机。
6. 实现广告 show token、完成验证、奖励发放和频控。
7. 实现奖励中心、活动进度、活动奖励、弹窗频控。
8. 实现远程配置、分析、审计、合规和风控。
9. 新增 `httpPlatformProviders`，前端按环境变量切换。
10. README 增加部署、迁移、备份、回滚和本地开发说明。

Rollback：

- 前端保留 mock provider，可通过环境变量回退。
- 数据库迁移必须可回滚或向前修复。
- 资产类错误只允许补偿账本，不允许删除历史账本。

## Open Questions

- 首期数据库 ORM/迁移工具选型：Drizzle、Prisma、Kysely，还是手写 SQL？
- 后端是否继续使用 Node 原生 HTTP，还是切到 Fastify/Hono/Express？
- 真实登录优先接手机号、微信，还是继续游客 + 绑定 mock？
- 部署目标是单机 Docker、Vercel/Serverless，还是云服务器/Kubernetes？

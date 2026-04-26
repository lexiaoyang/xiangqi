## Why

当前 `server/index.mjs` 只是本地 mock：单文件、JSON 持久化、无真实鉴权、无事务、无并发控制，前端核心数据仍主要存在 `localStorage`。这无法支撑真实用户、跨设备存档、钱包资产、支付订单、广告奖励、活动进度和运营审计，必须升级为服务端权威的持久化平台。

## What Changes

- 新增真实后端平台服务，替代单文件 mock server 作为用户、钱包、订单、奖励和活动数据的权威来源。
- 引入数据库持久化模型：用户、设备、会话、云存档、钱包余额、账本流水、订单、广告 show token、奖励中心、活动进度、弹窗频控、远程配置、分析事件、审计日志和风控记录。
- 引入服务端权威资产账本：金币、体力、提示、撤销、票券、会员等资产只能通过服务端幂等 ledger 变更。
- 建立支付订单状态机和广告奖励验证链路，避免前端伪造发奖。
- 建立云存档与跨设备同步，前端 `localStorage` 降级为缓存，不再作为权威数据。
- 建立后台配置/运营数据接口：远程配置、活动、弹窗、广告 offer、奖励中心均可由服务端返回并审计。
- 保留本地开发 mock 模式，但其定位降级为 fixture/sandbox，不再代表正式架构。

## Capabilities

### New Capabilities

- `backend-identity-and-session`: 服务端游客身份、账号绑定、设备、会话、token、删除账号和跨设备识别。
- `backend-cloud-save-sync`: 服务端云存档、版本冲突、合并策略、本地缓存恢复和跨设备同步。
- `backend-wallet-ledger`: 服务端权威钱包、append-only 账本、幂等键、余额投影、对账和资产风控。
- `backend-payment-orders`: SKU 目录、订单创建、支付回调/收据校验、发货、退款、恢复购买和订单审计。
- `backend-ad-reward-verification`: 广告位、show token、广告完成验证、冷却/频控、奖励发放和 pending reward retry。
- `backend-rewards-and-events`: 奖励中心、签到/任务/活动进度、活动奖励领取、弹窗频控和运营配置持久化。
- `backend-observability-compliance`: 分析事件、审计日志、隐私同意、未成年限制、限流、风控、数据导出和删除。
- `frontend-backend-provider-integration`: 前端 provider 从本地 mock/localStorage 切换到真实 API，保留离线缓存和本地开发模式。

### Modified Capabilities

无。

## Impact

- 后端：新增服务端模块结构、数据库 schema/migrations、repository/service 层、API 路由、认证中间件、错误模型和测试。
- 数据：新增正式持久化数据库；建议 PostgreSQL 为权威数据源，Redis 用于 session、限流、短期频控和幂等锁。
- 前端：新增 HTTP platform providers，`localStorage` 改为缓存；用户、钱包、奖励、订单、广告和活动读取服务端权威数据。
- 运维：新增环境变量、迁移命令、种子数据、备份/回滚、审计和监控指标。
- 安全：禁止前端直接决定资产发放；支付、广告、奖励、活动领取必须服务端验证并写审计。
- 测试：需要覆盖数据库事务、幂等、并发重复请求、跨设备同步、支付/广告回调、隐私合规和前端集成。

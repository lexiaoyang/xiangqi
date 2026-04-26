## Context

当前项目是 React/Vite 单页应用，已有 `trackEvent` 与 platform analytics provider，但默认 mock provider 只写本地存储；后端 `server/index.mjs` 已有 `/api/platform/analytics` 写入入口，但缺少读取统计与更明确的数据契约。本次以当前仓库可运行闭环为目标，优先覆盖页面事件采集、HTTP 上报、后端校验持久化和统计查询。

## Goals / Non-Goals

**Goals:**
- 页面浏览、点击、输入变化、曝光和关键业务动作均可形成统一 analytics 事件。
- 前端失败事件进入本地队列，后续 flush 可重试上报，避免网络抖动直接丢失。
- 后端支持单条和批量接收，校验基本字段并输出统计信息。
- 统计信息至少包含总事件数、事件名分布、页面分布、最近样本和接收时间窗口。

**Non-Goals:**
- 不接入第三方 CDP、消息队列或数仓。
- 不做用户画像、归因建模、漏斗图可视化后台。
- 不改变已有商业/奖励/广告业务状态机。

## Decisions

- 业务事件继续通过 `trackEvent` 进入统一入口；通用 DOM 事件由页面级 hook 捕获并上报。
- 事件名采用 snake_case，匹配现有 `trackEvent("level_complete")` 等调用，避免一次性迁移成本。
- Payload 包含 `name`、`source`、`userId`、`sessionId`、`page`、`createdAt`、`properties` 等字段；后端追加 `receivedAt`。
- 后端 `/api/platform/analytics` 同时接受单个事件对象和 `{ events: [...] }` 批量格式。
- 新增 `GET /api/platform/analytics/stats`，按现有 `platform.json` 中的 analytics 数组聚合，不引入数据库。
- 发送失败时 provider 先写入 `PLATFORM_STORAGE_KEYS.analyticsQueue`，成功 flush 后清空已发送项。

## Risks / Trade-offs

- [全局点击埋点过多] → 只采集可识别目标、文本截断，并限制 properties 体量。
- [本地开发未启动后端] → provider 保留本地队列，不阻塞玩家操作。
- [隐私字段误传] → 通用 DOM 采集不记录输入值，只记录控件类型、名称、页面与选择状态。
- [统计接口性能随文件增长下降] → 当前用内存 JSON 文件满足本地/轻量运营场景，后续可替换数据库聚合。

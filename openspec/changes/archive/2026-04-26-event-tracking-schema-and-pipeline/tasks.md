## 1. 需求澄清与基线梳理

- [x] 1.1 对齐页面全事件埋点、后端接收与统计查询的业务范围。
- [x] 1.2 梳理现有 `trackEvent`、analytics provider 与 `/api/platform/analytics` 缺口。

## 2. 数据与接口设计

- [x] 2.1 完成 analytics 事件字段、客户端队列字段与服务端统计结构设计。
- [x] 2.2 定义 `POST /api/platform/analytics` 与 `GET /api/platform/analytics/stats` 契约。

## 3. 核心能力实现

- [x] 3.1 实现后端接收校验、批量写入、服务端时间补全与统计聚合。
- [x] 3.2 打通前端 analytics HTTP 上报、失败缓冲、flush 重试与页面事件采集。

## 4. 稳定性与可观测性

- [x] 4.1 为关键页面、玩法、广告、奖励、商店动作补充业务埋点。
- [x] 4.2 限制 DOM 自动采集敏感/高噪声字段，并保证后端不可用时不影响体验。

## 5. 测试与发布准备

- [x] 5.1 编写 provider、页面采集、后端统计聚合测试并覆盖核心 Scenario。
- [x] 5.2 运行测试/构建，记录联调方式与运营验收清单。

联调方式：同时运行 `npm run dev:server` 与 `npm run dev`，前端事件会通过 Vite 代理写入 `/api/platform/analytics`；运营统计可请求 `GET /api/platform/analytics/stats?limit=20` 验收事件总量、页面分布、事件名分布与最近样本。

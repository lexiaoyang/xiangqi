## Why

当前页面点击、导航、广告、奖励、商店等事件没有形成稳定的端到端链路，客户端多处仍停留在本地队列或控制台日志，后端虽然已有 analytics 写入入口但缺少统一校验、统计查询与前端接入。需要补齐页面全事件埋点与服务端接收统计闭环，支撑运营复盘和产品调优。

## What Changes

- 定义浏览器页面事件的统一 payload、公共字段、命名规范与来源分类。
- 打通前端 analytics provider 到 `/api/platform/analytics` 的上报链路，并保留本地失败缓冲。
- 后端接收单条/批量埋点数据，执行基础字段校验、补充服务端时间并持久化。
- 新增统计查询接口，返回事件总量、事件名分布、页面分布与最近事件样本。
- 对页面访问、点击、表单变化、曝光、关键玩法/商业动作补充埋点。

## Capabilities

### New Capabilities
- `event-tracking-pipeline`: 页面埋点采集、后端接收、失败缓冲与统计查询能力。

### Modified Capabilities
- `liveops-and-analytics-platform`: 复用现有 analytics provider 与平台存储，补齐真实 HTTP 上报。

## Impact

- 前端页面交互会产生 analytics 请求；发送失败时写入本地队列并在后续 flush 重试。
- `server/index.mjs` 会持久化 analytics 原始事件并提供统计读取接口。
- 测试需覆盖 provider 上报、后端统计聚合与关键页面埋点入口。

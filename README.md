# 迷宫大冒险（H5）

Vite + React。默认进入**战役大厅**（闯关、体力、金币、用户账号、商店、活动中心、首页活动弹窗、广告奖励、奖励中心、背景音乐/音效）。旧版单页迷宫可通过环境变量恢复。

## 开发

```bash
npm install
npm run dev
```

可选：Mock 服务端（排行榜 + 商业化平台 API）

```bash
npm run dev:server   # 另开终端，监听 8787
npm run dev          # Vite 将 /api 代理到 8787
```

## 商业化平台

本仓库包含一套本地 mock 平台，用于开发用户、支付、广告、奖励中心、远程配置、分析和合规流程。

核心模块：

- `src/platform/types.ts`：用户、钱包、账本、SKU、订单、广告位、奖励、配置、同意、审计等领域类型。
- `src/platform/providers.ts`：Auth / Wallet / Payment / Ads / Rewards / Config / Compliance / Analytics provider 接口。
- `src/platform/mockProviders.ts`：本地 mock provider，实现游客账号、钱包账本、订单、广告奖励、奖励中心和配置。
- `src/platform/commerce.ts`：目录、购买、订单恢复、退款/对账、支付风控辅助。
- `src/platform/ads.ts`：广告位、show token、频控/冷却、激励广告奖励。
- `src/platform/adOffers.ts`：看广告领体力/得提示等 offer、奖励预览、频控状态和 pending retry。
- `src/platform/audio.ts`：BGM/SFX、首次交互解锁、静音、音量、合成 fallback 音源。
- `src/platform/events.ts`：活动中心、活动任务进度、活动奖励账本领取。
- `src/platform/popups.ts`：首页活动弹窗优先级、展示频控、今日不再提示。
- `src/platform/rewards.ts`：奖励中心、任务进度、统一领取。
- `src/platform/liveops.ts`：远程配置、实验、分层、活动时间窗、隐私安全埋点。
- `src/platform/compliance.ts`：隐私同意、未成年限制、合规 gate、审计、风控、限流、数据导出。

## Mock API

`npm run dev:server` 会启用 `/api/platform/*`：

- `POST /api/platform/identity/guest`
- `GET /api/platform/wallet?userId=...`
- `POST /api/platform/wallet/ledger?userId=...`
- `GET /api/platform/config`
- `GET /api/platform/catalog`
- `POST /api/platform/orders`
- `POST /api/platform/orders/verify`
- `POST /api/platform/orders/fulfill`
- `GET /api/platform/orders/restore?userId=...`
- `GET /api/platform/ads/placements`
- `POST /api/platform/ads/show-token`
- `POST /api/platform/ads/complete`
- `GET /api/platform/ad-offers`
- `GET /api/platform/ad-offers/pending?userId=...`
- `GET /api/platform/rewards?userId=...`
- `POST /api/platform/rewards/claim?userId=...`
- `GET /api/platform/events?userId=...`
- `POST /api/platform/events/progress?userId=...`
- `POST /api/platform/events/claim?userId=...`
- `POST /api/platform/popups/impression?userId=...`
- `POST /api/platform/popups/suppress?userId=...`
- `POST /api/platform/analytics`
- `POST /api/platform/consent?userId=...`
- `GET /api/platform/audit`

Mock 数据持久化在 `server/data/platform.json`，该目录不应提交真实用户数据或密钥。

## 幂等与账本

- 会发资产的操作必须带 `idempotencyKey`。
- 钱包以 append-only ledger 为准，余额是账本投影。
- 订单发货、广告奖励、奖励中心领取都会用固定幂等键防重复发放。
- 退款/撤单通过补偿账本表达，不直接篡改历史流水。

## 运营 Runbook

- 关闭支付：远程配置 `killSwitches.payments=true`。
- 关闭广告：远程配置 `killSwitches.ads=true`。
- 关闭奖励中心：远程配置 `killSwitches.rewards=true`。
- 回滚配置：恢复上一份有效 `RemoteConfig.version`。
- 恢复订单：调用 restore purchases 流程，查询 `paid` / `fulfilled` 订单并补发未完成订单。
- 广告异常：关闭对应 placement 或提高 cooldown / cap。
- 关闭音频：远程配置 `killSwitches.audio=true` 或 `audio.enabled=false`。
- 关闭活动中心：远程配置 `killSwitches.events=true`。
- 关闭首页弹窗：远程配置 `killSwitches.homePopups=true`，或将 popup `enabled=false`。
- 关闭单个广告 offer：远程配置将 `rewardedAdOffers[].enabled=false`，保留 placement 可给其他场景使用。

## 音频、活动与广告 Offer

- 音频首期使用 Web Audio 合成 fallback，避免引入未授权素材；真实音频资源接入时只需替换 `RemoteConfig.audio.bgm/sfx` 的 track/cue 映射。
- 浏览器禁止自动播放时，`AudioManager` 会在首次用户手势后解锁；静音用户不影响闯关、广告或奖励领取。
- 活动配置包含 `events[].tasks/rewards/cta`，任务支持闯关、星数、广告、奖励领取、商店访问、购买和登录。
- 首页弹窗由 `homePopups` 按优先级和频控展示，支持“今日不再提示”，广告弹窗必须展示“看广告”和准确奖励。
- 广告 offer 由 `rewardedAdOffers` 驱动，首页固定露出“看广告领体力”和“看广告得提示”，体力/提示不足时也会打开确认面板。

## 一线小游戏验收线

新增 `.cursor/skills/tier-one-mini-game-standard/SKILL.md`。任何玩家可见页面至少要满足：主 CTA 3 秒内可识别、广告/付费/免费奖励状态清楚、无白卡片/裸文字占位、移动端安全区可用、加载/空/失败/禁用态完整、关键奖励有视觉和音效反馈。

## 合规清单

- 初始化非必要 SDK 前必须有隐私同意。
- 支付 SKU 必须展示价格、币种、内容和取消入口。
- 广告入口必须标明“看广告”和奖励内容。
- 未成年人或年龄未知时默认限制支付、广告和非必要分析。
- 分析事件不得携带手机号、邮箱、原始收据、支付凭证和广告 ID。
- 账号删除后必须禁用支付、广告奖励和奖励领取。

## Rollout

1. Internal mock：使用 `mockProviders` 和 `/api/platform/*` 本地验证。
2. Internal visual QA：按一线小游戏验收线检查首页、弹窗、活动中心、广告 offer、奖励中心和结算页。
3. Sandbox QA：接支付/广告 sandbox provider，验证订单、广告奖励、失败重试、退款和补单。
4. Event gray release：先灰度 `events/homePopups/rewardedAdOffers` 配置，观察曝光、点击、完成、领取漏斗。
5. Commercial launch：开启真实 SKU、广告位、奖励活动、音频资源和分析看板。
6. Post-launch monitoring：监控支付成功率、广告填充/完成率、活动参与、奖励领取率、资产异常和关卡健康。

## 战役开关

- 默认启用战役 UI（`CampaignShell`）。
- 恢复旧版：`.env` 中设置 `VITE_CAMPAIGN_ENABLED=false`。

## 存档

- 战役：`localStorage` 键 `campaign:save:v1`
- 旧自由/挑战战绩：`maze:runs:v1` 等，与战役共存
- 平台：`platform:user:v1`、`platform:wallet:v1`、`platform:config:v1`、`platform:reward-center:v1` 等

## 关卡版本

常量见 `src/campaign/constants.ts` 中 `CAMPAIGN_PACK_VERSION`。升级后程序化关卡参数可能变化。

## 测试

```bash
npm test
npm run build
```

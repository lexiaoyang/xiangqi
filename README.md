# 迷宫大冒险（H5）

Vite + React。默认进入**战役大厅**（闯关、体力、金币、商店占位）。旧版单页迷宫可通过环境变量恢复。

## 开发

```bash
npm install
npm run dev
```

可选：排行榜 API（与旧迷宫战绩共用代理）

```bash
npm run dev:server   # 另开终端，监听 8787
npm run dev          # Vite 将 /api 代理到 8787
```

## 战役开关

- 默认启用战役 UI（`CampaignShell`）。
- 恢复旧版：`.env` 中设置 `VITE_CAMPAIGN_ENABLED=false`。

## 存档

- 战役：`localStorage` 键 `campaign:save:v1`
- 旧自由/挑战战绩：`maze:runs:v1` 等，与战役共存

## 关卡版本

常量见 `src/campaign/constants.ts` 中 `CAMPAIGN_PACK_VERSION`。升级后程序化关卡参数可能变化。

## 测试

```bash
npm test
npm run build
```

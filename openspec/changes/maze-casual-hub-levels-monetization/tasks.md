## 1. 壳层与导航

- [x] 1.1 引入 Hub / Play 顶层视图状态（或路由），默认进入 Hub
- [x] 1.2 Play 视图：全屏/伪全屏布局与安全区内边距验证（iOS Safari / Android Chrome）
- [x] 1.3 Hub：开始关卡、关卡列表/地图、统计摘要、设置入口布局落地
- [x] 1.4 结算后返回 Hub 并刷新摘要数据

## 2. 关卡战役（1000 关）

- [x] 2.1 定义 `levelId` 1…1000 与持久化键（`maxUnlockedLevel`、每关 stars/cleared）
- [x] 2.2 实现 `levelId → 迷宫参数` 确定性函数与 `campaignPackVersion` 常量
- [x] 2.3 难度曲线分段实现与可调参数表（章节阈值、尺寸钳制）
- [x] 2.4 关卡选择 UI：锁定态、解锁提示、当前推荐关
- [x] 2.5 星级规则实现并与 `maze-casual-monetization-ui` 结算卡对接

## 3. 阻碍与工具解锁

- [x] 3.1 `ObstacleKind` / `ToolKind` 注册表与关卡参数 `mask` 接线
- [x] 3.2 解锁矩阵：`unlocked` 与 `maxUnlockedLevel`/章节/任务钩子
- [x] 3.3 Play HUD 道具栏：可用次数、点击消耗、无库存提示
- [x] 3.4 至少 2 种阻碍与 2 种工具 MVP（与现有机电制区分或叠加规则在设计中落地）

## 4. 商业化向 UI

- [x] 4.1 设计令牌：颜色/圆角/阴影/字体阶写入样式或主题文件
- [x] 4.2 Hub 顶栏：软货币 + 体力（或等价）占位与数据绑定
- [x] 4.3 胜利/失败全屏结算卡：星数、CTA（下一关/重试/回大厅）
- [x] 4.4 商店页占位 SKU 与二次确认弹窗 Mock
- [x] 4.5 `prefers-reduced-motion` 下关闭/减弱装饰动效

## 5. 数据、测试与文档

- [x] 5.1 本地存档迁移：`campaign:*` 命名空间与旧 `maze:*` 共存策略
- [x] 5.2 单元测试：`levelId` 复现性、解锁边界、星级边界
- [x] 5.3 E2E 冒烟：Hub → Play → 胜利 → 下一关 / 回 Hub
- [x] 5.4 更新 README：双终端 dev、战役开关、关卡版本说明

## 6. 可选服务端 / 运营

- [ ] 6.1 关卡参数 JSON 或 CDN 拉取与版本校验（可选）
- [ ] 6.2 与 `cloud-save-and-cross-device-sync` 变更对齐进度同步字段（可选）

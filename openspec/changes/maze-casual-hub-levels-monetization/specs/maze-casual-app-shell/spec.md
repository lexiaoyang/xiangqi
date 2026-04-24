## ADDED Requirements

### Requirement: Hub 与全屏 Play 两阶段界面

系统 SHALL 将用户界面划分为 **Hub（大厅）** 与 **Play（对局）** 两种互斥顶层视图。Hub SHALL 展示进入战役/关卡、数据总览、设置等入口。用户从 Hub 选择开始关卡并确认后，系统 SHALL 切换到 Play 视图；Play 视图 SHALL 以对局画布与 HUD 为主，SHALL NOT 在默认状态下展示 Hub 级完整导航栏。

#### Scenario: 从大厅进入全屏对局

- **WHEN** 用户在 Hub 选择某一已解锁关卡并确认开始
- **THEN** 系统进入 Play 视图，对局区域占据可视区主体，并应用移动端安全区内边距策略

#### Scenario: 对局结束返回大厅

- **WHEN** 用户在 Play 视图完成结算（胜利或失败）并选择返回大厅
- **THEN** 系统切换回 Hub 视图，并刷新 Hub 所需的数据摘要（如最高关卡、货币数）

### Requirement: 移动端安全区与视口

系统 SHALL 在 Hub 与 Play 中均尊重 `env(safe-area-inset-*)`。Play 视图 SHALL 使用至少 `100dvh` 或等价逻辑高度以覆盖常见移动浏览器动态工具栏。

#### Scenario: 竖屏手机底部安全区

- **WHEN** 用户在带底部 Home 指示条的 iPhone 上以竖屏使用 Play 视图
- **THEN** 主要触控控件（方向键、道具栏）不得被系统指示条永久遮挡

### Requirement: Hub 功能入口最小集合

Hub SHALL 提供以下入口或等价聚合页：**开始关卡/继续关卡**、**关卡地图或列表**、**个人进度与统计摘要**、**设置**（音效、振动、隐私链接占位）。入口 SHALL 使用可触控目标最小尺寸 44×44 CSS 像素（或平台等价无障碍规范）。

#### Scenario: 新用户首次打开

- **WHEN** 无本地进度的新用户打开应用并处于 Hub
- **THEN** Hub 显示默认引导入口以开始第 1 关，且主要按钮在首屏可见区域内可触达

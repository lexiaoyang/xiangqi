## ADDED Requirements

### Requirement: 休闲商业化视觉层级

Hub 与 Play SHALL 采用统一的「休闲变现向」视觉层级：**顶栏资源条**（至少包含软货币与体力或等价资源占位）、**主内容卡片化**、**高对比主 CTA**。系统 SHALL 使用设计令牌（颜色、圆角、阴影、字体阶）文档化，避免组件间随意硬编码。

#### Scenario: Play 顶栏资源可见

- **WHEN** 用户处于 Play 视图且对局进行中
- **THEN** 顶栏 SHALL 显示当前软货币与体力（或占位图标与数值），且不得遮挡对局核心区域超过设计文档声明的最大高度比例

### Requirement: 关卡星级与结算展示

每一已通关关卡 SHALL 支持 0–3 星展示（具体算法由关卡战役规范引用）。胜利结算卡 SHALL 展示获得星数、步数/用时摘要，并提供「下一关」「重试」「回大厅」主操作。

#### Scenario: 三星通关

- **WHEN** 用户达成三星条件
- **THEN** 结算界面 SHALL 显示三颗星为点亮态，并持久化该关 `stars = 3`

### Requirement: 商店与付费入口占位

Hub SHALL 提供「商店」或等价入口，展示工具/体力/货币包占位 SKU（首版可无真实支付）。任何付费点 MUST 二次确认弹窗占位（文案与流程可 Mock），且 MUST 符合后续接入 IAP 的区域说明占位（非实现）。

#### Scenario: 打开商店

- **WHEN** 用户从 Hub 进入商店
- **THEN** 系统 SHALL 展示至少一类可购占位项与货币余额，且不崩溃

### Requirement: 动效与 reduced-motion

装饰性动效（如奖励飞入、按钮脉冲）SHALL 可通过 `prefers-reduced-motion: reduce` 关闭或减弱为静态反馈。核心玩法反馈（撞墙、通关）MUST 在无动画情况下仍可感知（图标/文案/振动占位）。

#### Scenario: 系统开启减少动态效果

- **WHEN** 用户系统设置偏好减少动态效果
- **THEN** 应用 SHALL 不播放高强度循环装饰动画

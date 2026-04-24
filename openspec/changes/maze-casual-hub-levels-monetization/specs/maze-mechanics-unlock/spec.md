## ADDED Requirements

### Requirement: 阻碍模式注册与关卡启用

系统 SHALL 维护 **阻碍模式（Obstacle）** 的注册表，每项具有稳定 `obstacleId`、人类可读名称、与对局规则的绑定说明。每一关卡参数 MUST 指定本关启用的 `obstacleId` 子集；未列出的阻碍 MUST NOT 在对局中生效。

#### Scenario: 关卡未启用某阻碍

- **WHEN** 关卡参数未包含 `fog`（迷雾）阻碍
- **THEN** 对局中 SHALL NOT 出现迷雾规则或相关 UI

### Requirement: 工具注册与对局内使用

系统 SHALL 维护 **工具（Tool）** 注册表，每项具有 `toolId`、效果描述、每关可用次数或消耗规则。玩家在 Play 视图 SHALL 仅能使用已解锁且本关允许的工具；每次使用 MUST 扣减对应库存或本关配额并记录。

#### Scenario: 无库存时使用工具

- **WHEN** 用户点击某工具但库存为 0 且本关无免费次数
- **THEN** 系统 SHALL NOT 执行工具效果，并 SHALL 提示获取途径（占位文案可接受）

### Requirement: 阻碍与工具的渐进解锁

系统 SHALL 定义解锁函数：对每一 `obstacleId` / `toolId` 存在 `unlocked` 布尔状态，其由 `maxUnlockedLevel`、章节、任务或软货币条件之一或组合决定（具体公式在实现中固定版本化）。未解锁项在 Hub 商店或图鉴中 MAY 展示为灰色预览，但 MUST NOT 在对局中生效。

#### Scenario: 新章节解锁新阻碍

- **WHEN** 玩家 `maxUnlockedLevel` 首次达到某章节阈值
- **THEN** 系统 SHALL 将至少一种新 `obstacleId` 标记为已解锁，并持久化

#### Scenario: 工具首次解锁

- **WHEN** 玩家达成某解锁条件（如通关第 20 关）
- **THEN** 系统 SHALL 将对应 `toolId` 标记为已解锁，并在 Hub 与 Play 的道具栏中可见

### Requirement: 扩展点与版本

新增 `obstacleId` 或 `toolId` SHALL NOT 破坏旧 `levelId` 的可玩性：旧关卡参数若未引用新 ID，则行为 MUST 与升级前一致。系统 SHALL 暴露 `mechanicsPackVersion` 或等价整数供客户端与可选服务端对齐。

#### Scenario: 升级机制包后旧关

- **WHEN** 客户端 `mechanicsPackVersion` 升级且用户重玩旧 `levelId`
- **THEN** 若该关参数未引用新机制，对局规则 SHALL 与升级前一致

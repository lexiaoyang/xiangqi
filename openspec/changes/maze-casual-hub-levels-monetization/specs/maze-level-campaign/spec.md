## ADDED Requirements

### Requirement: 关卡编号与可寻址进度

系统 SHALL 支持关卡编号 `levelId` 自 **1** 起至 **1000** 止的整数。系统 SHALL 持久化 `maxUnlockedLevel`（已解锁的最高关卡号）与每关可选的 `stars`（0–3）及 `cleared` 状态。

#### Scenario: 通关解锁下一关

- **WHEN** 用户在关卡 `N`（1 ≤ N < 1000）达成「通关」判定
- **THEN** 系统 SHALL 将 `maxUnlockedLevel` 更新为至少 `N+1`，并持久化该值

#### Scenario: 第 1000 关边界

- **WHEN** 用户通关关卡 1000
- **THEN** 系统 SHALL 标记该关为已通关，且 SHALL NOT 要求存在关卡 1001

### Requirement: 关卡与迷宫参数的可复现绑定

每一 `levelId` SHALL 映射到一组确定性参数，包括但不限于：迷宫尺寸或生成规格、随机种子、允许的机制/阻碍掩码、星级阈值输入。同一 `levelId` 在未更改战役版本号的前提下 SHALL 生成等价可玩迷宫（允许仅非功能性渲染差异）。

#### Scenario: 重玩同一关

- **WHEN** 用户两次选择同一 `levelId` 开始（未升级战役版本）
- **THEN** 迷宫拓扑与阻碍布局 SHALL 一致（与随机种子及参数函数一致）

### Requirement: 难度随关卡总体上升

系统 SHALL 定义单调或非递减的难度曲线：随 `levelId` 增大，迷宫复杂度指标（如最小路径长度期望、尺寸上限、启用阻碍数量上限）SHALL 不得系统性低于更低关卡（允许局部小幅波动但 MUST 在文档化窗口内）。

#### Scenario: 高关卡尺寸下界

- **WHEN** `levelId` ≥ 800
- **THEN** 迷宫生成规格 SHALL 使用不低于设计文档中为「高章」声明的最小行/列阈值

### Requirement: 关卡选择与不可玩关卡的提示

用户 SHALL 能从 Hub 打开关卡列表或地图，并仅能开始 `levelId ≤ maxUnlockedLevel` 的关卡。对未解锁关卡，系统 SHALL 展示锁定态与解锁条件摘要（例如「通关上一关」）。

#### Scenario: 点击未解锁关

- **WHEN** 用户尝试开始 `levelId > maxUnlockedLevel`
- **THEN** 系统 SHALL NOT 进入 Play，并 SHALL 展示锁定提示

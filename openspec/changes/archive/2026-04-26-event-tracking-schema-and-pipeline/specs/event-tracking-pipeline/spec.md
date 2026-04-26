## ADDED Requirements

### Requirement: 页面事件统一采集
系统 MUST 在玩家进入页面、切换核心界面、点击可交互控件、触发关键玩法/商业动作时生成统一 analytics 事件，并通过同一客户端入口发送。

#### Scenario: 玩家点击商店按钮
- **WHEN** 玩家点击页面中的商店入口或商品操作按钮
- **THEN** 客户端上报包含事件名、页面、目标标识、用户标识、会话标识和时间戳的 analytics 事件

#### Scenario: 自动采集输入控件变化
- **WHEN** 玩家切换复选框、选择项或其他表单控件
- **THEN** 客户端只上报控件类型、名称、页面和状态，不得上报原始输入文本

### Requirement: 后端接收与校验
系统 MUST 提供 analytics 接收接口，支持单条和批量事件提交，校验事件名与来源，补充服务端接收时间并持久化。

#### Scenario: 批量事件成功写入
- **WHEN** 客户端向 `POST /api/platform/analytics` 提交 `{ events: [...] }`
- **THEN** 服务端校验所有合法事件，写入 analytics 存储，并返回接收数量

#### Scenario: 非法事件被拒绝
- **WHEN** 客户端提交缺少事件名或事件来源的 analytics 事件
- **THEN** 服务端返回 400 错误，且不得写入该事件

### Requirement: 统计信息查询
系统 SHALL 提供 analytics 统计查询接口，返回事件总数、事件名分布、页面分布、最近事件样本和接收时间范围。

#### Scenario: 运营查询事件统计
- **WHEN** 运营请求 `GET /api/platform/analytics/stats`
- **THEN** 服务端返回基于已接收 analytics 事件聚合的统计信息

### Requirement: 失败缓冲与重试
系统 SHALL 在 analytics 上报失败时将事件保存在本地队列，并在后续 flush 时重试，不得阻塞页面操作。

#### Scenario: 后端暂不可用
- **WHEN** 玩家触发事件但 analytics 接口请求失败
- **THEN** 客户端将事件加入本地 analytics 队列，玩家操作继续完成

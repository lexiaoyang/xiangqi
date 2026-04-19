## Why

现有支付流程缺少统一状态机，重复回调和异常中断容易造成订单状态错乱。需要建立严格的订单状态机来保证支付一致性与可追踪性。

## What Changes

- 定义订单状态、合法迁移路径与事件驱动处理规则。
- 新增幂等回调处理、防重放校验与超时关单任务。
- 新增对账补偿流程与异常订单人工处理入口。
- 完善订单审计日志与状态变更订阅。

## Capabilities

### New Capabilities
- `payment-order-lifecycle`: 支付订单状态机相关能力定义与交付标准。

### Modified Capabilities
- 无。

## Impact

- 支付服务需新增状态机引擎与迁移约束。
- 订单表需扩展 state, state_version, last_event_id 字段。
- 财务对账任务需订阅新的订单状态主题。

## ADDED Requirements

### Requirement: 订单状态迁移约束
系统 MUST 仅允许订单在预定义状态图内迁移，非法迁移请求必须被拒绝并记录审计日志。

#### Scenario: 拒绝非法状态迁移
- **WHEN** 订单已处于 PAID 状态仍收到 CREATED 事件
- **THEN** 状态机拒绝迁移并记录非法事件告警

### Requirement: 支付回调幂等处理
系统 SHALL 对重复或重放的支付回调执行幂等处理，确保订单与发货结果不重复。

#### Scenario: 重复回调不重复发货
- **WHEN** 支付渠道连续发送两次相同 provider_event_id 回调
- **THEN** 系统只处理首次回调并将后续回调标记为幂等命中

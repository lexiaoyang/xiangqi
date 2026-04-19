## ADDED Requirements

### Requirement: 权益发放与快照更新
系统 MUST 在支付确认后原子化写入权益账本并刷新用户权益快照。

#### Scenario: 支付成功后发放权益
- **WHEN** 订单状态迁移为 PAID 并通过风控校验
- **THEN** 系统写入 entitlement_ledger 并返回最新权益快照给客户端

### Requirement: 订阅续期与回收
系统 SHALL 支持订阅自动续期与退款回收，确保权益状态与支付状态一致。

#### Scenario: 退款后回收权益
- **WHEN** 支付渠道发送订阅退款事件
- **THEN** 系统将权益状态更新为 REVOKED 并记录回收原因

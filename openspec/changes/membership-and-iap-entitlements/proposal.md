## Why

当前内购仅发放单次道具，缺少统一权益模型，难以支撑会员订阅与权益核销。需要构建会员与 IAP 权益体系，保证发放准确、查询清晰。

## What Changes

- 新增统一 entitlement 模型，覆盖订阅、一次性商品与礼包。
- 新增购买成功后的权益发放、续期、过期与撤销流程。
- 新增权益查询接口与客户端缓存策略。
- 补充退款回收、风控拦截与审计日志。

## Capabilities

### New Capabilities
- `membership-iap-entitlements`: 会员与内购权益体系相关能力定义与交付标准。

### Modified Capabilities
- 无。

## Impact

- 商品中心、支付回调、背包系统需接入统一 entitlement 服务。
- 数据库需新增 entitlement_ledger 与 entitlement_snapshot。
- 客服后台需展示权益流水与状态。

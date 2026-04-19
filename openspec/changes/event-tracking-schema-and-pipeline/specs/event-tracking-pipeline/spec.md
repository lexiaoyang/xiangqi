## ADDED Requirements

### Requirement: 统一事件 Schema 校验
系统 MUST 对接入事件执行统一 schema 校验，未通过校验的事件不得进入主题数据表。

#### Scenario: 非法字段事件进入死信流
- **WHEN** 客户端上报事件缺少必填 user_id
- **THEN** 网关拒绝写入主流并将事件及错误原因写入死信队列

### Requirement: 事件管道可观测与补偿
系统 SHALL 提供事件处理链路的延迟、失败率指标，并支持按时间窗口重放失败事件。

#### Scenario: 按窗口重放失败事件
- **WHEN** 运营同学发起指定时间段的事件补偿任务
- **THEN** 系统重放该窗口内失败事件并输出补偿结果报告

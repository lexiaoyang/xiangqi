# guest-account-binding Specification

## Purpose
TBD - created by archiving change account-guest-login-and-binding. Update Purpose after archive.
## Requirements
### Requirement: 游客身份创建与续期
系统 MUST 在首次启动且无有效账号时创建游客身份，并在令牌接近过期时自动续期。

#### Scenario: 首次启动创建游客账号
- **WHEN** 客户端启动后检测不到有效会话
- **THEN** 账号服务返回 guest_id、access_token 与 refresh_token，客户端进入游客态游戏首页

### Requirement: 游客账号绑定正式凭据
系统 SHALL 支持将游客账号绑定到手机号或第三方身份，并在绑定后保留原有游戏资产与进度。

#### Scenario: 绑定成功后资产保持一致
- **WHEN** 用户在设置页提交有效验证码并确认绑定
- **THEN** 系统完成凭据绑定，资产与进度校验通过且绑定状态更新为已绑定


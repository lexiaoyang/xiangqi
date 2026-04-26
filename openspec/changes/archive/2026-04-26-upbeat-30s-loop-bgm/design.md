## Context

当前 `AudioManager` 已支持 Web Audio、首次交互解锁、静音、音量和场景切换，但用户反馈音乐仍不好听。现有 30 秒电子感较强，lead、鼓和噪声层容易显得刺耳，不适合长时间停留在首页。需要重新设计为 1 分钟更顺耳的欢快循环，并给首页增加独立的 1 分钟循环音效氛围层。

约束：

- 不引入未经授权的真实音乐素材。
- 不新增 npm 依赖。
- H5 自动播放仍需首次用户手势解锁。
- BGM 不能阻塞游戏加载，也不能和 SFX 混成一团。
- 后续应保留替换真实音频文件的空间。

## Goals / Non-Goals

**Goals:**

- 生成一段约 1 分钟、可循环、欢快、顺耳、激情但不刺耳、适合休闲小游戏的背景音乐。
- 生成一段约 1 分钟首页专属循环音效层，包含轻量 sparkle、远景庆典/能量流动、柔和 UI 氛围，不替代主 BGM。
- 使用完整音乐结构：intro、build、hook、lift、loop tail，而不是单音、蜂鸣或短音定时器。
- 增加节奏推进感：鼓点/拍手/低频 pulse/明亮 lead/chord stab，但通过 PCM buffer 一次性渲染为连续音乐段落。
- 背景音乐与 SFX 分离：BGM 播放期间不再通过 `setInterval` 触发短音；SFX 只响应用户操作或奖励反馈。
- 保留音量、静音、首次解锁、场景切换和安全销毁能力。

**Non-Goals:**

- 不接入真实音乐版权库。
- 不做多轨混音编辑器。
- 不实现用户自选曲库。
- 不改变活动、广告、支付、奖励逻辑。

## Decisions

### Decision 1: 用 PCM buffer 渲染 1 分钟完整音乐段

`AudioManager` 在首次播放对应场景 BGM 时生成 `AudioBuffer`，长度固定 60 秒，`AudioBufferSourceNode.loop = true` 循环播放。渲染内容改为更柔和的主流休闲小游戏音乐语言：暖 pad、圆润 bass、轻鼓组、木琴/铃音式 hook、短 build、可循环尾部。

理由：

- 一次性生成完整音乐段，避免 `setInterval` 单音触发带来的“嘟嘟嘟”听感。
- Web Audio 原生能力即可完成，不引入依赖。
- Buffer 可缓存，场景切换时复用。

替代方案：继续用 oscillator 实时调度音符。实现灵活，但当前反馈已证明听感容易像测试音，不采用。

### Decision 2: 使用“欢快卡通电子流行”音乐语言

首期采用 112-122 BPM 的欢快卡通电子流行结构：大调/五声音阶、圆润低频、轻 kick、soft clap、shaker、marimba/pluck hook、暖 pad。不同场景共享主音乐内核，通过根音、和弦、音色和能量微调。

理由：

- 休闲小游戏更需要明确节奏和正向情绪，而不是纯 ambient。
- 用户诉求是“欢快、激情、刺激用户玩游戏”，需要更接近音乐而不是背景噪声。

替代方案：纯环境音。更柔和，但无法提供激情和行动刺激，不采用。

### Decision 3: BGM 只负责背景音乐，交互短音继续由 SFX 管

BGM buffer 内可以有节奏与旋律，但不会再在播放过程中触发额外短音。按钮、奖励、广告完成等声音仍走 `playSfx()`。

理由：

- 防止背景播放和交互反馈互相污染。
- 用户听到短音时可以判断来自操作反馈，而不是背景音乐异常。

### Decision 4: 首页增加独立 home ambience/effects loop

在 `lobby` 上下文播放主 BGM 的同时，启动单独的首页音效层 `homeLoopSource`。该层也是 60 秒 loop buffer，低音量，内容为柔和 sparkle、能量流、远景庆典质感和轻微 UI 生命感。离开首页时停止，不进入玩法、商店、活动、奖励和设置页。

理由：

- 用户明确要求首页也有 1 分钟音效循环。
- 首页音效层应增强大厅运营氛围，但不能影响玩法页听感。

### Decision 5: 留出真实素材替换路径

保留 `RemoteConfig.audio.bgm` 的 track id。后续若有真实授权音乐，可新增加载音频文件路径；本次代码生成作为 fallback 和本地开发默认实现。

理由：

- 代码生成音乐可以快速验证体验方向。
- 一线产品最终应使用专业音乐素材或定制音频。

## Risks / Trade-offs

- [Risk] 代码生成音乐仍不如真实素材自然 → Mitigation：明确作为 fallback，README 记录真实素材替换路径。
- [Risk] 30 秒 buffer 生成有 CPU 开销 → Mitigation：首次播放生成并缓存，单声道 30 秒 buffer 体量可控。
- [Risk] 循环接缝明显 → Mitigation：音乐结构按 8 小节对齐，尾部和开头共享和弦关系并做短淡入淡出。
- [Risk] 过强节奏打扰玩家 → Mitigation：默认音量受 `audio.defaultVolume` 控制，保留静音/音量设置。

## Migration Plan

1. 新增 60 秒 BGM 生成器，替换当前 30 秒电子感版本。
2. 新增 60 秒 home loop 生成器和 `AudioManager` 首页音效层播放/停止逻辑。
3. 增加测试覆盖：BGM 和首页音效层时长约 60 秒、loop 开启、SFX 与 BGM 分离。
4. 更新 README，说明当前为代码生成音乐 fallback，真实上线建议替换授权音乐素材。
5. 若体验仍不达标，下一步接入真实音频 asset，而不是继续靠提示音式 oscillator 调参。

## Open Questions

- 真实上线音乐风格是否更偏国风、电子、卡通，还是混合？
- 后续是否需要为玩法内、活动中心、商店分别定制完整曲目，而不是共享同一音乐内核？

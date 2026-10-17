# Escape Arrow editor plugin

消费 `editor/templates/escape-arrow/game-manifest.json`；关卡选择、预览、导出和打包不直接引用 `template-core` 源码。

- `levelId`：第一段原版关卡编号，1–100。
- `secondPlayable.levelId`：第二段原版关卡编号，1–100；与现有流程一致，必须启用并提供片尾视频。
- `gameplay.lives` / `gameplay.hints`：每局生命、提示次数，`"unlimited"` 或 1–99 的整数；最后一颗心耗尽或最后一次有效提示立即触发 CTA。双关分别重新计数。
- `gameplay.allowReplay`：仅允许最后一个 playable 通关后，在“All clear!”中重玩当前关卡，默认 true。点击先跳转 CTA 再重置当前关卡；切回来已是新一局，前面关卡与视频不重播。单 playable 末尾仍有片尾视频时禁用，避免倒退到已结束的旧段。失败不提供重玩。设置只使 pack 过期。
- `playableCta` / `secondPlayable.cta`：完成后转化或成功逃出 N 根箭头时转化，通关时兜底。失败点击、移动棋盘和缩放不计入步骤。
- `secondPlayable.background.source`：`video-first`、`video-last`、`upload` 或 `auto`。
- 其余片头、片尾、HUD、背景、下载卡和遮罩开关沿用公共 editor 契约。

关卡 JSON 在构建时校验路径与可解性，插件按 manifest 的 SHA-256 校验数据。关卡数量、选择范围、缩略图和棋盘信息由 manifest 提供。工作台提供前 100 关试玩总览入口。

共享事件桥的结果报告通过 `__novvyReplayable=true` 显式启用；最后一个可重玩的 playable 通关时以 `result:'win',continue_playing:true` 保留当前段，其余正常结算。Play again 先发独立 CTA 请求，再调用 `onReplay()` 并重置 CTA 窗口及本轮进度，始终保持当前段号。重玩按钮从全局触压转化监听中排除，避免一次点击重复请求；可重玩的末关保留游戏自己的 All clear，CTA 遮罩不覆盖重玩按钮。其他模版默认行为不受影响。playable 内部使用英文；editor 编辑控件、配置说明与试玩总览外层界面使用中文，默认游戏标题和 CTA 文案值保持英文。

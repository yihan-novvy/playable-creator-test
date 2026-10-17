# Escape Arrow editor plugin

消费 `editor/templates/escape-arrow/game-manifest.json`；关卡选择、预览、导出和打包不直接引用 `template-core` 源码。

- `levelId`：第一段原版关卡编号，1–100。
- `secondPlayable.levelId`：第二段原版关卡编号，1–100；与现有流程一致，必须启用并提供片尾视频。
- `playableCta` / `secondPlayable.cta`：完成后转化或成功逃出 N 根箭头时转化，通关时兜底。失败点击、移动棋盘和缩放不计入步骤。
- `secondPlayable.background.source`：`video-first`、`video-last`、`upload` 或 `auto`。
- 其余片头、片尾、HUD、背景、下载卡和遮罩开关沿用公共 editor 契约。

关卡 JSON 在构建时校验路径与可解性，插件按 manifest 的 SHA-256 校验数据。关卡数量、选择范围、缩略图和棋盘信息由 manifest 提供。工作台提供前 100 关试玩总览入口。

共享事件桥的失败重玩通过 `__novvyReplayable=true` 显式启用；失败以 `continue_playing:true` 结算，重试调用 `onReplay()`，最终胜利正常结束当前段。其他模版不受该开关影响。

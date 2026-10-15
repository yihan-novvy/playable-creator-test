# Colorever New 广告模板

本目录是 `template-core/colorever-new` 的构建产物。不要手改 game/；在源码目录运行 `npm run build` 更新。

`game/game.js` 是纯引擎（不含图案数据与装饰代码）；图案关卡在 `game/patterns/*.json`，装饰片段在 `game/decorators/*.js`，导出/预览时按所选图案注入 index.html。全部为构建产物，不要手改。

图案数据沿用已有契约。简易模式保持原有规则；适中模式采用全局打乱和连通区域搬运，旧零散配置兼容为全局模式。正式速度固定为基础速度，测试调速不进入广告配置。广告配置由 `editor/plugins/colorever-new/` 提供，七步制作流程、音乐、视频、HUD、背景、第二关和 CTA 沿用原版。

原版与本模板的源码、插件、构建目录分别独立。已有任务仍使用原版；新建任务选择 Colorever New（立体宝石）。

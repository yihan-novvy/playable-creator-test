# FreeCell Origin

保留 MobilityWare FreeCell 关联 playable 的原版 PixiJS 纸牌、52 张牌开局、引导、暂存格、收牌与重玩。
来源和原始 SHA-256 见 `source/provenance.json`；来源页面与载荷商店 ID 一致，不据此断言素材作者。

`npm run build -w template-core/freecell-origin` 从冻结 HTML 抽取本地 runtime/assets，关闭原版第 15 次抬手锁输入和计时跳店，移除外部广告网络启动/统计依赖。`src/boot.js` 负责本地启动、视口、音频与插件衔接。

`npm test -w template-core/freecell-origin` 验证源哈希、确定性构建、52 张牌守恒和原生收牌规则。游戏源和 `editor/templates/freecell-origin` 生成物应一起更新。

`src/layout.js` 在完整画布内为 HUD 和底部下载卡预留空间，按牌区边界缩放和居中，保留原生拖牌坐标与引导。原生下载按钮隐藏，声音默认开启并在首次交互后解锁；隐藏或不可见时静音。统一下载卡内嵌 App Store 图标和正式名称，来源与图片校验值见 `source/app-store.json`。

# Block Out Origin

原版 PixiJS playable：2 块教学关 → 37 块挑战关。两关数据、物理、动画、音效及素材沿用下载载荷。

- 原始素材：[Insightrackr 7ffa03d5](https://data.insightrackr.com/creative/preplay/detail/7ffa03d526a4b106c4f1f82c8ab1afae)
- 商店：[Block Out - Color Sort Puzzle](https://apps.apple.com/us/app/block-out-color-sort-puzzle/id6752672568)
- `source/original.html` 是从 AppLovin loader 解出的冻结 HTML，校验值及研究来源见 `source/provenance.json`。
- `npm run build -w template-core/block-out-origin` 解出参数、资源和 Brotli 核心，生成自包含 `editor/templates/block-out-origin/game/`。
- `npm test -w template-core/block-out-origin` 验证冻结源、确定性构建、棋盘覆盖与颜色出口。没有新增依赖。

构建只在两个唯一锚点加适配接口：启动前安装 `__BLOCK_OUT_ADAPTER__`，商店请求交由它处理。未提供适配器时基础包仍可独立运行。原始冻结文件不改写；锚点失配会拒绝构建。

参数层关闭原版的次数、时间、出门及结算自动跳转，改用本地 Web bridge；保留签名资源与原商店链接。广告插件接管 CTA，不依赖 AppLovin loader 或 `mraid.js`。`assets.js` 和 `core.js` 跨任务一致，视频、文案与事件适配放在广告壳中。

HUD 叠加在完整画布内，棋盘视口按顶部标题和底部下载卡预留空间；开启 HUD 后关闭重复的原生标题和标志。沿用原版音效并默认开启，浏览器首次交互后解锁声音；隐藏或不可见时静音。底部统一下载卡使用 App Store 正式名称和内嵌图标，来源及图片校验值见 `source/app-store.json`。

不把平台展示量估算视为实际转化表现。当前只支持这份冻结的原版两关；替换上游载荷需重新核验锚点、资源和交互。

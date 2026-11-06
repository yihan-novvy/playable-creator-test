# Travel Town 重玩 CTA 决定

日期：2026-11-06。作用范围：项目组装壳 `src/host.js`、`src/index.html`。独立 game.js 不新增 CTA。

用户原文：

> 失败的try again 和成功的retry 都参考 Tasty Travels 这种有弹窗的，而不是底部的这个按钮。都会触发cta ，回来之后才会继续。

按这次要求复用 Tasty Travels 的重玩转化行为。该参考实现的重玩点击分类是 `forced_click_to_appstore`，场景是 `playable-replay`；这里沿用这两个值，不把 Retry 文案分类成下载按钮。

| 稳定位置 ID | 位置 / 可用时机 | click_source | 行为 |
| --- | --- | --- | --- |
| failure-retry | 失败弹窗 Try again，允许重玩时 | forced_click_to_appstore | 一次点击触发一次 CTA，等待离开后返回，再重建本局 |
| success-retry | 成功弹窗 Retry，允许重玩时 | forced_click_to_appstore | 同上 |

保留既有标准壳底部下载卡 `cta_click`，以及显式启用的自动策略 `forced_click_to_appstore`。自动跳转的开关不控制用户主动点击重玩。弹窗背景不跳转。加载失败的恢复重试不产生新的商店访问。

同日用户补充：

> replay 是可以的，为什么需要continue ? 这个就不合理了，去掉continue 这个

依此移除 Continue 按钮与其结束本段的点击处理，仅保留上述 Retry / Try again 入口；重玩 CTA 和返回后重开保持不变。

无广告 SDK 的编辑器预览记录预览调用并直接重开；有 SDK 时必须收到实际离开/返回的生命周期信号，不用定时器假定已返回。此处记录的是实现决定，不是官方平台事件验收证据。

2026-11-07 用户补充：

> 这边的话，“自动跳转”这个应该使用的是 参考“tasty travels" 的转化时机这一套和文案，然后跳转时机改为 “通关时”

工作台改用参考模板的转化时机文案与条件展开；新建任务默认启用 `complete`，当前 `travel-town` 任务也使用该设置。完成粉刷与清理后沿用既有 `forced_click_to_appstore` / `playable-complete` 通关策略，单项修复、失败不自动转化。已有显式关闭设置继续有效，重玩 CTA 流程保持不变。

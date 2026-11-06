# CTA 决定 · 2026-11-06

原问题：请确认两处原版点击的分类：① 1 亿版底部 Play Free 按钮（游戏中可点），建议 cta_click；② 9200 万版结束后点击任意位置，建议 forced_click_to_appstore。原版定时自动跳商店会移除。

用户原文：**两处都按建议接入**

| placement ID | 原版位置 | click_source |
|---|---|---|
| 100m-play-free | MainPanel / PlayBtn 的 TZ_Script.ButtonOnClick | cta_click |
| 92m-ended-tap | LunaManager.Update，isGameOver 后的真实按下 | forced_click_to_appstore |

初始版本：GameOver/胜败协程中的自动商店调用不转发；当时项目组装壳重玩不附带商店跳转。后续明确授权如下，取代原来的重玩策略。


## 1.2.0 完整棋盘与重玩 CTA · 2026-11-06

用户原文：

> 针对这个模版我希望再改动一下，就是说我发现现在填正确五个单词就会出现 无法继续完成游戏的情况，并出现 Play again按钮。我觉得这个很不好，我希望的是全部填完了才有这个，并且允许重玩。然后可以参考 tasty-travels 这种的做20步进行跳转，然后10 、8、6、4 跳转的逻辑。当全部填词完成后，也有一个完成的弹窗，然后告知可以play again 。无论玩失败也好还是玩通关的play again 和 try again 点击后均是先触发cta 的force_xxxxx 然后才是重玩游戏。

| placement ID | 位置/时机 | click_source |
|---|---|---|
| 92m-step-policy | 项目组装壳，第 20 个正确词，然后间隔 10、8、6、4（末项重复）；每局重置 | forced_click_to_appstore |
| 92m-result-replay | 完成/失败弹窗 Play again / Try again，真实点击先 CTA 后重置 | forced_click_to_appstore |

用户明确要求的 force_xxxxx 对应当前协议 `forced_click_to_appstore`。两处共用现有一秒 CTA 防重复；冷却期间重玩按钮暂时禁用，到时只恢复按钮，不自动触发跳转。原版定时跳转仍停用。加载错误的 Retry loading 不属于玩法重玩，不附带 CTA。

92m 的原始规则没有生命值或失败条件；不新增失败判定。项目壳的失败结果处理接入相同的 CTA-before-replay 顺序，以兼容真实 fail 回调。当前英文盘面 21 个词，每局自然只能走到第 20 步首跳，后续间隔按策略实现，不伪称当前盘面能达到 30 步。

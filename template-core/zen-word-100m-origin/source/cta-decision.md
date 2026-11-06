# CTA 决定 · 2026-11-06

原问题：请确认两处原版点击的分类：① 1 亿版底部 Play Free 按钮（游戏中可点），建议 cta_click；② 9200 万版结束后点击任意位置，建议 forced_click_to_appstore。原版定时自动跳商店会移除。

用户原文：**两处都按建议接入**

| placement ID | 原版位置 | click_source |
|---|---|---|
| 100m-play-free | MainPanel / PlayBtn 的 TZ_Script.ButtonOnClick | cta_click |
| 92m-ended-tap | LunaManager.Update，isGameOver 后的真实按下 | forced_click_to_appstore |

GameOver/胜败协程中的自动商店调用不转发。重玩是项目组装壳的操作，不附带商店跳转。

## 1 亿版布局修改（同日后续）

用户原文：

> 1.playable 没有全屏
> 2.HUD TITLE 位置被灵动岛遮住了。
> 3.cta-card 也丢失了，去掉 play free 这个按钮
>
> 你可以把原本的游戏内部的一些东西的位置调整一下，我也是允许的。

底部主动下载位置由原版 Play Free 替换为项目共享 CTA card，沿用已经确认的 `cta_click`。原版 PlayBtn 隐藏且回调停用。独立 game.js 不再含下载入口；项目组装壳的卡片在试玩阶段可点击。稳定位置 ID 为 `100m-bottom-download-card`，仅真实点击触发，1 秒内重复点击被抑制。

## 全盘通关与步数策略（2026-11-06 后续）

用户要求：全部单词填完才显示 Great! You beat 99.99% players，并允许重玩；参考 tasty-travels，20 步首跳，随后间隔 10、8、6、4。

确认问题原文：新增的步数跳转将发生在第 20、30、38、44、48、52…次有效操作（与 tasty-travels 一致，最后每 4 步重复）。是否按 forced_click_to_appstore 接入？底部下载卡继续使用已确认的 cta_click。

用户回答原文：**按 forced_click_to_appstore 接入（推荐）**

位置 ID `100m-successful-word-steps`：项目组装壳在成功填入新单词、达到本局阈值时触发；错误和重复单词不记步。33 词棋盘本局可到达第 20、30 步，重玩后首跳重新从 20 步计算。重玩按钮仅重开，不新增跳转；与下载卡共用 1 秒去重。

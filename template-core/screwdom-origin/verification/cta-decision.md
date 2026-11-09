# Screwdom CTA 分类原始决定

日期：2026-11-06。本对话中的用户答复，适用于项目组装壳。

提交给用户的入口表：

| 入口 | 触发时机 | 建议分类 |
|---|---|---|
| 底部下载卡 | 点击按钮或卡片 | cta_click |
| 自动跳转策略 | 达到配置的有效步数／完成条件 | forced_click_to_appstore |

用户原文答复：

> 两项按建议分类接入

映射：`bottom-card` → `cta_click`；`auto-policy` → `forced_click_to_appstore`。
重玩和 Continue 不是跳店入口。独立 game.js 包不包含这些壳层控件和策略，其 CTA 位置列表为空。

## 2026-11-09 重玩入口变更

本次用户在确认 Screwdom 原先重玩不跳店后，要求：

> 你可以参考pixel-flow-origin，我要求添加retry 的时候，也有挑战cta逻辑，不过你需要注意，不要代码提交先。

按该请求沿用 `pixel-flow-origin/src/host.js` 的重玩行为和分类：开启「允许重玩」后，玩家点击失败弹窗的 Try again 或成功弹窗的 Play again，请求一次 `forced_click_to_appstore`，场景为 `playable-replay`，随后立即重建；商店返回信号只控制新局启动/暂停。此处「挑战cta」结合上下文按「跳转 CTA」理解。

映射新增：`result-replay` → `forced_click_to_appstore`。底部卡片、自动策略的原决定不变；加载失败恢复不触发 CTA；独立 game.js 仍无 CTA 入口。以上覆盖旧记录中「重玩不是跳店入口」的行为，保留旧记录用于溯源。本次代码仅本地修改，不提交。

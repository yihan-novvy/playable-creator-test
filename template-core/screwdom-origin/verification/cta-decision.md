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

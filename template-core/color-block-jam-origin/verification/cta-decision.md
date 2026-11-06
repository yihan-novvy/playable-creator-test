Original user decision, 2026-11-06

Question: ①试玩底部下载卡（替换原生 DOWNLOAD 区域）：cta_click；②原生结算页下载按钮（通关后）：cta_click；③组装层自动跳转（达到有效步数或最终通关时）：forced_click_to_appstore。是否采用这些分类？

User answer: 全部采用建议分类


新增结算重玩入口的原始确认，2026-11-06

用户请求：失败的try again 和成功的retry 都参考 Tasty Travels 这种有弹窗的，而不是底部的这个按钮。都会触发cta ，回来之后才会继续。

Question: 新增弹窗入口建议沿用 Tasty Travels 的分类：失败弹窗「Try Again」→ forced_click_to_appstore；成功弹窗「Retry」→ forced_click_to_appstore。两者都在点击后跳店，检测到返回试玩才重开，是否采用？

User answer: 两者均采用 forced_click_to_appstore（与 Tasty Travels 一致）

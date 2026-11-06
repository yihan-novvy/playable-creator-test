# 验证记录 · 2026-11-06

**开发与本地验证通过；官方事件验收未完成。**

## 通过的检查

- 确定性构建、冻结原始载荷 SHA-256、生成文件哈希与 JS 语法；本模板开发阶段注册表校验通过、0 警告。
- 内存 fixture 执行真实原版 `handleTap`、`setColor`、`handleDown`、`addColor`、`nextLevel`：未开始/暂停不计步，相同色与重复上妆不计步，选色 0%、上妆 100%，原生终点只调用一次 `end`，无伪造 win/fail。暂停输入、幂等销毁与遮挡撤除后的布局恢复通过。
- 组装壳 fixture：SDK 可见性暂停/恢复、不可见时拒绝计步、视频明确静音选择保留到游戏与 resize、演示结束不转成胜利。
- 编辑器 HTTP 回归：新模板 25 项，任务创建 15 项，模板展示 69 项，Origin 编辑器 243 项。最终声音/可见性修改后再次运行新模板 25 项通过。
- 真实浏览器直接试玩最终产品页面：选择粉底、点击脸部、上妆动画结束；两轮重玩后仍可选色和上妆。上妆后出现原版口红推荐画面，并出现项目重玩/继续按钮。
- 390×844、320×568、844×390 布局；根容器与 shadow DOM 中 canvas 尺寸一致。横屏选色和脸部命中通过，标题未遮挡操作区。编辑器灵动岛遮挡预览中，标题位于遮挡下方。
- 真实工作台键盘修改标题并刷新读回；重玩开关保存，旧打包状态失效，重新打包和试玩成功。
- 六秒测试视频自然结束自动进入原版试玩，没有 GO 二次点击。该临时测试任务与视频已清理，示例任务不含测试视频。
- 预览与 pack 共用组装函数；视频前置条件、转码/海报、关闭视频后清除旧媒体、导出接口、ZIP 根目录清单与体积通过。
- 最后加载成品后没有新增浏览器错误日志。

## 交付物

示例任务 ID：`project-makeover`，开启标题与重玩以便复查；模板新任务默认关闭这两项。当前独立验证服务：`http://127.0.0.1:8093/task.html?id=project-makeover`，原 8088 服务未被本任务重启。

- `output/project-makeover-delivery/project-makeover-assembly.zip`：460393 bytes，只有根 `index.html`、`game.js`。
- `output/project-makeover-delivery/project-makeover-game.zip`：456533 bytes，只有根 `game.js`。
- `output/project-makeover-delivery/preview.png`：最终打包结果的实际 390×844 截图。
- `output/project-makeover-delivery/acceptance.json`：最终 ZIP 哈希、范围和未完成项。
- `output/project-makeover-research-20261106/editor-tests.log`、`final-template-test.log`：本地回归日志。

## 最后一次全仓检查

最终归档后执行 `npm run validate` 时，工作区同时新增了未跟踪的 `editor/plugins/screwdom-origin/` 和 `template-core/screwdom-origin/`，但尚无 `editor/templates/screwdom-origin/game-manifest.json`，因此全仓注册表检查返回 1 个错误。该目录不由本次 Project Makeover 工作创建，未改动它。此前全仓注册表检查通过；不能将最后一次结果写成全绿。Project Makeover 的生成文件、交付包及专属测试通过。

## 仍未完成

1. CTA 位置分类尚未收到用户决定。底部下载卡、原版结束后整屏跳店均未启用，未将建议或沉默当作确认。
2. 官方平台“试玩日志调试”没有实际会话、received/dropped 消息和对应真实 shell 上报请求。丢弃数、请求数未知，不记作 0，也未用本地 fixture 代替验收。
3. iOS / Android 广告 WebView、真实安全区、商店跳转及设备音频尚未验证。
4. `file://` 打开被浏览器 URL 安全策略禁止，没有绕过；localhost 成功不作为本地文件验证成功。

当前事件文档于 **2026-11-06 10:57:07 UTC** 从 `https://developer.novvy.ai/eventLogs.md` 读取，页面更新日期 2026-11-05，SHA-256 `d8e11c14e3fc42db79a652c83e318f32f2342eb0e3b03db458ba93e1ef7e4b39`。采用 `NovvyGame` / `shell` 合约。已安装事件 skill 的检查器针对较早的 postMessage 协议，不能用其结果认证当前入口；未声称该旧检查器或官方最终事件门禁通过。

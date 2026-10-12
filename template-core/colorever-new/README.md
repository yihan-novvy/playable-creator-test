# Colorever New · 立体宝石

从当前 colorever 完整复制的独立模板。只升级珠子、目标色底板、光照及珠子表面的反馈；图案、配色、专属装饰、开局生成、求解、缓存容量、移动与归位规则保持兼容。

## 视觉

- 珠子采用凸起的菱形顶面与四个倾斜切面，沿用实例化渲染。
- 珠子宽度约占格子宽度的 82%；周围露出固定目标颜色，错珠未拿走时也能辨认归位目标。
- 槽位保留浅色边沿，底色不受灯光变暗影响。
- 错珠边框贴近珠子，保留底色可见区域；点击范围仍按完整格子处理。
- 棋盘坐标、背景配置、HUD、缓存布局和容量沿用原版，兼容已有装饰。

## GPU 兼容

Playable 在所有设备上关闭实时阴影贴图，并移除地面投影接收层、棋盘珠子底部的接触阴影贴图，以及托盘内珠子的接触阴影层和对应状态维护。珠子材质、环境光、抗锯齿、槽位明暗及游戏规则保留。

Pixel 10 Pro XL 的无视频对照测试中，同一关在开启实时阴影时丢失上下文，关闭后可流畅交互。本模板统一使用无投影和无接触阴影的方式，不再按 GPU 型号分支。修改后需重新打包；完整 SDK 广告包仍需在实机验证。

## 开发与构建

在仓库根目录运行：

```bash
npm run dev -w template-core/colorever-new -- --host 127.0.0.1 --port 5175
npm run build -w template-core/colorever-new
npm test -w template-core/colorever-new
node editor/test/run-all.mjs colorever-new
```

图案画室使用本目录的 `npm run editor`，端口 5175。玩法源码和图案数据保存在本目录；构建只输出到 `editor/templates/colorever-new/`。不写入原版 colorever。

## Editor 兼容性

在 editor 新建任务时选择 **Colorever New（立体宝石）**，ID 为 `colorever-new`。原版配置可以原样用于新任务，所有图案 ID 与数据字段保持不变。

七步流程与原版相同：片头 → 片尾 → HUD → 第一关背景 → 第二关背景 → 关卡 → 打包。支持任务音乐、开局模式与种子、第二 playable、CTA 时机和 ZIP 导出。

保留 `__COLOREVER_*` 运行时数据注入、`novvy:*` 事件和 SDK 接口。旧任务继续使用 `colorever`，不会自动迁移。图案编辑与构建仍然是单向流程；广告任务只选择已构建图案，不反写玩法源码。

回归检查将全部图案数据与开局引擎和原版逐字节比较，并比较每个图案在三种模式下的开局和求解结果。

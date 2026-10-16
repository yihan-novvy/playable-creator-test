# 导出与集成

只有任务需要离线文件或广告包时才读取本页。以下命令从仓库根目录执行。

## 离线 HTML 和 ZIP

目前没有适用于所有图案的统一单图导出命令，历史 `scripts/package-<id>.mjs` 及其 `docs/<id>-playable.html/.zip` 产物已于 2026-10-16 删除。需要离线交付时，复用 `editor/plugins/colorever-new/lib.mjs` 导出的 `coloreverLevel` 和 `coloreverHtml` 组装能力。仅为当前导出读取这些函数及必要调用示例，不批量阅读其他图案的脚本。没有统一接口时，不将“已能预览”描述为“已完成离线打包”；按任务需要实现导出，避免逐图复制整套工具。

## 广告编辑器

先构建并运行 `check-pattern.mjs <id> --built`，再由广告编辑器选择已构建的图案、开局参数和媒体。广告任务保存于本地 `project/`，不反写图案源码。

需要回归编辑器接入时使用：

```sh
node editor/test/run-all.mjs colorever-new
```

涉及 SDK、视频、CTA、第二关或广告 ZIP 时，再按所需功能读取插件文档与相关实现。纯图案的数据与视觉修改无需先阅读这些部分。

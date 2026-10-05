# templates（构建产物区，禁止手改）

本目录各 `<id>/` 是 `template-core/<id>/` 的构建产物（game/ + game-manifest.json），
随仓库提交以保证克隆即用。任何修改一律回到 template-core 源项目后重新
`npm run build`；`npm run validate` 会比对 template-core 的 package.json
version 与 game-manifest.json version，不一致即警告。

历史遗留：`<id>/template.json` 与部分模板的 README 仍是编辑契约的过渡载体，
插件化（editor/plugins/<id>/plugin.json）接管后仅剩游戏侧常量被脚本消费
（如 image-to-pattern.py 的 --template-json 调色板）。

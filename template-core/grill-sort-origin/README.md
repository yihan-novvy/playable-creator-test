# Grill Sort Origin

原版 Cocos 3.8.5 烧烤分类试玩，12 个烤盘、120 串、180 秒倒计时。冻结 HTML、来源指纹及 SHA-256 见 `source/`。Insightrackr 发行方和载荷 iOS ID 对应目标应用，素材作者未独立确认。

构建确定性解开两份 Brotli JSON，保留原 Cocos 引擎、资源、匹配规则、关卡与本地资源加载器。仅替换广告网络启动桥，通过命名 SystemJS 模块的独立适配器接入事件；不修改原玩法核心。

`npm run build -w template-core/grill-sort-origin`；`npm test -w template-core/grill-sort-origin`。原生三串匹配、120 串守恒及确定性生成有测试。原版隐藏盘随机补货仍按原规则运行。

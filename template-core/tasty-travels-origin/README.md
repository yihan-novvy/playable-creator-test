# Tasty Travels Origin

Cocos Creator 2.4.10 原版投放饮品、碰撞合成试玩。冻结 HTML、素材指纹、商店 ID、发行方和 SHA-256 见 `source/provenance.json`；未独立确认素材作者。

构建读取原 HTML 的内嵌 ZIP 与资源字典，保留引擎、物理碰撞、原关卡、音效与资源加载器。原核心仅在模块加载末尾添加独立适配器入口；广告平台启动与下载替换为项目桥。ZIP 只解析至内存，不按归档路径写磁盘，无新增依赖。

画布保持全屏，双摄像机在场景内给顶部 HUD 和底部 CTA 卡留白，背景边缘使用原素材延展。物理节点不变，触摸坐标经摄像机逆变换后交回原玩法。移除游戏声音开关及横竖屏原下载按钮，音乐默认开启；浏览器限制自动播放时由首次触摸解锁。CTA 使用共享卡片与原素材中的 Logo，预览和打包一致。

`npm run build -w template-core/tasty-travels-origin`；`npm test -w template-core/tasty-travels-origin`。测试覆盖原生同类碰撞规则、最高级限制、碰撞去重、源哈希与确定性构建。

# Google Compute Engine 部署（仅 8088）

部署现有 `editor/server.mjs`，不启动 Vite 或图案画室，不修改 playable 模板。
使用单个 Debian 12 x86_64 实例；Node 仅监听 `127.0.0.1:8088`，Caddy 提供公开 HTTPS 和 IP 加 8088 端口的 HTTP 入口，无网页密码。
这是用户选择的公开编辑器：当前应用没有访客角色，访问者都可新建、修改、删除任务。网页访问不授予服务器部署权限。
当前仅允许新建 Tasty Travels 任务，任务列表和模板探索遵循同一限制；已有其他模板任务仍可打开和编辑。
实例应使用持久化磁盘、禁止自动删除磁盘，并开启实例删除保护。

本次部署使用 Google Cloud 项目 `novvy-dev`，实例 `playable-creator-vm`，可用区 `us-central1-a`（美国爱荷华州）。
规格为 `e2-standard-2`（2 vCPU / 8 GB），50 GB 持久化磁盘，静态公网 IP `34.172.35.160`。
IP 加端口访问：<http://34.172.35.160:8088/>。
HTTPS 访问：<https://playable-creator.34-172-35-160.sslip.io>。
该地址使用 sslip.io 的公共 DNS；以后可以将自有域名解析到同一静态 IP，并修改 Caddy 域名配置。

## 打包与安装

```sh
python3 deploy/gce/package-runtime.py output/gcloud/runtime.tar.gz
bash -n deploy/gce/install.sh
```

部署包只包含 Git 跟踪的 editor 运行文件和模板版本信息，不包含测试素材、现有任务、`.env`、Git 历史或本机凭据。
运行时使用已提交的模板产物，不在服务器重建游戏，不需要安装 npm workspace 依赖。

将 `runtime.tar.gz`、`runtime.tar.gz.sha256` 和 `install.sh` 上传到新实例，然后执行：

```sh
sudo bash install.sh runtime.tar.gz <HTTPS域名>
```

需要 IP 加端口访问时，第三个参数传实例的内网 IPv4 地址，本实例为 `10.43.0.2`：

```sh
sudo bash install.sh runtime.tar.gz playable-creator.34-172-35-160.sslip.io 10.43.0.2
```

Caddy 在内网网卡的 8088 上接收公网 NAT 流量，再转发给回环地址的同一编辑器，两种入口共享任务数据。
后续跨区迁移时，需要更新 `/etc/playable-creator/caddy.env` 中的 `PLAYABLE_DOMAIN` 和 `PLAYABLE_HTTP_BIND`，使后者匹配新实例的内网 IP。

安装脚本会安装 Node 22、Python/Pillow、FFmpeg、zip/unzip 和 Caddy。
仅在专用新实例上使用：脚本管理 `/etc/caddy/Caddyfile`。
公网防火墙开放 TCP 80/443/8088；8088 由 `playable-creator-editor-http` 规则放行，不开放 5175。
支持 IAP 管理（源地址范围 `35.235.240.0/20`），但账号需要该实例的 IAP 隧道权限。
本次经用户授权，仅临时放行部署电脑的公网 IP `/32` 进行 SSH 密钥登录，验收完成后删除临时规则。

## 数据与运维

- 程序版本：`/opt/playable-creator/releases/`，`current` 指向当前版本。
- 持久化任务与成品：`/var/lib/playable-creator/project/` 和 `result/`；版本更新不会覆盖这些目录。
- 可选 AI 配置：`/etc/playable-creator/editor.env`，使用 `ANTHROPIC_*` 环境变量。默认不迁移本机密钥。
- 日志：`sudo journalctl -u playable-creator -u caddy`。
- 重启：`sudo systemctl restart playable-creator`。
- 暂停计算：停止 GCE 实例；磁盘和保留的外部 IP 仍可能收费。

```sh
node deploy/gce/smoke.mjs https://<HTTPS域名>
node deploy/gce/smoke.mjs http://34.172.35.160:8088/
```

验收覆盖公开访问、环境自检、仅 Tasty Travels 可创建、视频上传与 Range、片头与打包两个步骤、预览和 ZIP 下载。
检查只创建独立的 `deployment-check-*` 临时任务，并在完成后删除。
关机重启后还应验证已有任务保留。后续更新复用实例和数据盘，并先备份数据目录。

2026-11-04 迁移后的云端验收：无密码 HTTPS 访问、视频上传、7 个处理步骤、预览、ZIP 下载均通过。
新实例从完整磁盘快照恢复，编辑器自动启动；两个 systemd 单元均已启用，清理测试任务后任务列表为 0。
可选 AI 生成功能尚未配置云端密钥，不在上述验收范围内。
同日新增的 IP 加 8088 入口也通过上述完整验收，HTTPS 入口环境检查正常。

保留迁移前快照 `playable-creator-migrate-us-20261104`，存储位置为 `us-central1`，用于恢复迁移前的运行环境与数据。
经用户确认，`asia-east1-b` 的旧实例与磁盘、`asia-east1` 的旧公网 IP 和旧子网均已清理；临时 SSH 入口已关闭。

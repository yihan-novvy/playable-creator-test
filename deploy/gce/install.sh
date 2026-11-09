#!/usr/bin/env bash
# Run as root on a dedicated Debian 12 VM; deploy only the 8088 editor.
set -euo pipefail
umask 027

if [[ $EUID -ne 0 || $# -lt 2 || $# -gt 3 ]]; then
  echo 'Usage: sudo bash install.sh runtime.tar.gz public-hostname [private-ip-for-http-8088]' >&2
  exit 1
fi
archive=$(readlink -f "$1")
domain=$2
http_bind=${3:-}
if [[ -z "$http_bind" && -f /etc/playable-creator/caddy.env ]]; then
  http_bind=$(sed -n 's/^PLAYABLE_HTTP_BIND=//p' /etc/playable-creator/caddy.env)
fi
if [[ -n "$http_bind" ]]; then
  [[ "$http_bind" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ && "$http_bind" != 127.* && "$http_bind" != 0.0.0.0 ]] || { echo 'Expected a specific non-loopback IPv4 address' >&2; exit 1; }
fi
[[ "$domain" =~ ^[a-z0-9][a-z0-9.-]+[a-z0-9]$ ]] || { echo 'Invalid hostname' >&2; exit 1; }
[[ -s "$archive" && -s "$archive.sha256" ]]
cd "$(dirname "$archive")"
sha256sum -c "$(basename "$archive").sha256"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y --no-install-recommends ca-certificates curl gnupg debian-keyring debian-archive-keyring \
  python3 python3-pil ffmpeg zip unzip xz-utils

# Install Node 22 from the official distribution and verify its checksum.
if [[ ! -x /opt/node22/bin/node ]]; then
  node_tmp=$(mktemp -d)
  curl --fail --silent --show-error --retry 3 https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt -o "$node_tmp/SHASUMS256.txt"
  node_release=$(awk '$2 ~ /^node-v22\.[0-9]+\.[0-9]+-linux-x64\.tar\.xz$/ {print $2}' "$node_tmp/SHASUMS256.txt")
  [[ -n "$node_release" && "$node_release" != *$'\n'* ]]
  curl --fail --silent --show-error --retry 3 "https://nodejs.org/dist/latest-v22.x/$node_release" -o "$node_tmp/$node_release"
  (cd "$node_tmp"; awk -v file="$node_release" '$2 == file' SHASUMS256.txt | sha256sum -c -)
  mkdir -p /opt/node22
  tar -xJf "$node_tmp/$node_release" --strip-components=1 -C /opt/node22
  rm -rf "$node_tmp"
fi
chown -R root:root /opt/node22
chmod -R a+rX /opt/node22
ln -sfn /opt/node22/bin/node /usr/local/bin/node

if ! command -v caddy >/dev/null; then
  curl --fail --silent --show-error --retry 3 https://dl.cloudsmith.io/public/caddy/stable/gpg.key \
    | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl --fail --silent --show-error --retry 3 https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt \
    -o /etc/apt/sources.list.d/caddy-stable.list
  chmod 644 /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y caddy
fi

id playable >/dev/null 2>&1 || useradd --system --home-dir /var/lib/playable-creator --shell /usr/sbin/nologin playable
install -d -m 750 -o playable -g playable /var/lib/playable-creator /var/lib/playable-creator/project /var/lib/playable-creator/result
install -d -m 755 /opt/playable-creator/releases
install -d -m 750 -o root -g playable /etc/playable-creator
touch /etc/playable-creator/editor.env
chmod 640 /etc/playable-creator/editor.env
chown root:playable /etc/playable-creator/editor.env

release_id=$(date -u +%Y%m%dT%H%M%SZ)-$(sha256sum "$archive" | cut -c1-12)
release=/opt/playable-creator/releases/$release_id
install -d -m 755 "$release"
tar -xzf "$archive" --no-same-owner -C "$release"
find "$release" -type d -exec chmod 755 {} +
find "$release" -type f -exec chmod 644 {} +
# Install the pinned runtime helpers for this Linux architecture. Local workspace
# dependencies are intentionally not copied into the release archive.
/opt/node22/bin/npm ci --prefix "$release" --omit=dev --no-audit --no-fund --cache /var/cache/playable-creator/npm
chmod -R a+rX "$release/node_modules"
ln -s /var/lib/playable-creator/project "$release/project"
ln -s /var/lib/playable-creator/result "$release/result"
(
  # Child processes need an accessible working directory; the private upload
  # directory belongs to the deploy account and is not accessible to playable.
  cd "$release"
  node "$release/editor/tools/validate-registry.mjs"
  runuser -u playable -- /opt/node22/bin/node "$release/deploy/gce/verify-runtime.mjs"
  runuser -u playable -- /opt/node22/bin/node --input-type=module -e "const {environment}=await import('file://$release/editor/core/lib/exec.mjs');const env=await environment();console.log(env);if(!env.ok)process.exit(1)"
)

cat > /etc/systemd/system/playable-creator.service <<'UNIT'
[Unit]
Description=Playable Creator editor (8088 only)
After=network.target
RequiresMountsFor=/var/lib/playable-creator

[Service]
Type=simple
User=playable
Group=playable
WorkingDirectory=/opt/playable-creator/current
Environment=NODE_ENV=production
Environment=PATH=/opt/node22/bin:/usr/local/bin:/usr/bin:/bin
EnvironmentFile=/etc/playable-creator/editor.env
# Relative entrypoint resolves from the real working directory; the editor's
# direct-entry guard compares its module URL with argv[1].
ExecStart=/opt/node22/bin/node editor/server.mjs --port 8088
Restart=on-failure
RestartSec=3
TimeoutStopSec=30
KillMode=control-group
UMask=0027
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/lib/playable-creator

[Install]
WantedBy=multi-user.target
UNIT

printf 'PLAYABLE_DOMAIN=%s\nPLAYABLE_HTTP_BIND=%s\n' "$domain" "$http_bind" > /etc/playable-creator/caddy.env
chmod 600 /etc/playable-creator/caddy.env
install -d /etc/systemd/system/caddy.service.d
cat > /etc/systemd/system/caddy.service.d/playable.conf <<'UNIT'
[Service]
EnvironmentFile=/etc/playable-creator/caddy.env
ExecStart=
ExecStart=/usr/bin/caddy run --config /etc/caddy/Caddyfile
UNIT
cat > /etc/caddy/Caddyfile <<'CADDY'
{$PLAYABLE_DOMAIN} {
  reverse_proxy 127.0.0.1:8088 {
    header_up -Authorization
  }
  log
}
CADDY
if [[ -n "$http_bind" ]]; then
  # GCE forwards the external IP to this NIC. A specific bind avoids the
  # editor's existing loopback listener on the same port.
  cat >> /etc/caddy/Caddyfile <<'CADDY'

http://:8088 {
  bind {$PLAYABLE_HTTP_BIND}
  reverse_proxy 127.0.0.1:8088 {
    header_up -Authorization
  }
  log
}
CADDY
fi
PLAYABLE_DOMAIN="$domain" PLAYABLE_HTTP_BIND="$http_bind" caddy validate --config /etc/caddy/Caddyfile

previous=''
if [[ -L /opt/playable-creator/current && -d /opt/playable-creator/current ]]; then
  previous=$(readlink -f /opt/playable-creator/current)
fi
ln -sfn "$release" /opt/playable-creator/current.next
mv -Tf /opt/playable-creator/current.next /opt/playable-creator/current
systemctl daemon-reload
systemctl enable playable-creator
systemctl restart playable-creator
healthy=false
for attempt in {1..20}; do
  if curl --fail --silent http://127.0.0.1:8088/api/env | python3 -c 'import json,sys;sys.exit(0 if json.load(sys.stdin).get("ok") else 1)' 2>/dev/null; then
    healthy=true
    break
  fi
  sleep 1
done
if [[ "$healthy" != true ]]; then
  if [[ -n "$previous" && "$previous" != "$release" ]]; then
    ln -sfn "$previous" /opt/playable-creator/current
    systemctl restart playable-creator
  else
    systemctl stop playable-creator
  fi
  journalctl -u playable-creator -n 30 --no-pager
  exit 1
fi
systemctl enable caddy
systemctl restart caddy
echo "Editor ready on 127.0.0.1:8088; HTTPS endpoint: https://$domain"
echo "Runtime data: /var/lib/playable-creator/{project,result}"

#!/usr/bin/env python3
"""Package the tracked 8088 runtime without local tasks, credentials or dev servers."""
import argparse
import hashlib
from pathlib import Path
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument("output", type=Path)
args = parser.parse_args()
output = args.output.resolve()
output.parent.mkdir(parents=True, exist_ok=True)
tracked = subprocess.check_output(
    ["git", "ls-files", "-z", "--", "editor", "template-core"], cwd=ROOT
).decode().split("\0")
files = sorted(name for name in tracked if name and (
    (name.startswith("editor/") and not name.startswith("editor/test/"))
    or (name.startswith("template-core/") and name.count("/") == 2 and name.endswith("/package.json"))
))
# Standalone previews/configured exports use these source helpers at runtime.
# Do not ship whole source workspaces or local node_modules (macOS binaries).
runtime_helpers = [
    "template-core/shared/standalone/build.mjs",
    "template-core/shared/standalone/runtime.js",
    "template-core/shared/standalone/package.json",
    "template-core/water-sort/src/game.js",
    "template-core/block-out-origin/src/standalone-result.html",
    "deploy/gce/verify-runtime.mjs",
]
files = sorted(set(files + runtime_helpers))
with tarfile.open(output, "w:gz") as archive:
    for name in files:
        source = ROOT / name
        if source.is_symlink() or not source.is_file():
            raise SystemExit(f"Expected a regular runtime file: {name}")
        archive.add(source, arcname=name, recursive=False)
    for source, target in [
        ("deploy/gce/runtime-package.json", "package.json"),
        ("deploy/gce/runtime-package-lock.json", "package-lock.json"),
    ]:
        archive.add(ROOT / source, arcname=target, recursive=False)
digest = hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix(output.suffix + ".sha256").write_text(f"{digest}  {output.name}\n")
print(f"Packaged {len(files)} files, {output.stat().st_size} bytes: {output}")
print(f"SHA256 {digest}")

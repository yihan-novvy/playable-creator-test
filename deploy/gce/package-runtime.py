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
with tarfile.open(output, "w:gz") as archive:
    for name in files:
        source = ROOT / name
        if source.is_symlink() or not source.is_file():
            raise SystemExit(f"Expected a regular runtime file: {name}")
        archive.add(source, arcname=name, recursive=False)
digest = hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix(output.suffix + ".sha256").write_text(f"{digest}  {output.name}\n")
print(f"Packaged {len(files)} files, {output.stat().st_size} bytes: {output}")
print(f"SHA256 {digest}")

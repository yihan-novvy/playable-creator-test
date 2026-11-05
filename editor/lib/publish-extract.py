"""Extract a service-produced archive into an isolated preview directory."""
import pathlib
import stat
import sys
import zipfile

archive, target = map(pathlib.Path, sys.argv[1:])
with zipfile.ZipFile(archive) as z:
    items = z.infolist()
    if len(items) > 4000 or sum(i.file_size for i in items) > 250 * 1024 * 1024:
        raise ValueError("素材包解压后过大或条目过多")
    seen = set()
    for item in items:
        name = item.filename
        parts = pathlib.PurePosixPath(name)
        if (not name or "\\" in name or parts.is_absolute()
                or any(p in ("..", ".") for p in name.rstrip("/").split("/"))
                or stat.S_ISLNK(item.external_attr >> 16)
                or name.casefold().rstrip("/") in seen):
            raise ValueError("素材包包含不安全或重复路径")
        seen.add(name.casefold().rstrip("/"))
    if "index.html" not in z.namelist():
        raise ValueError("注入后的素材包缺少根目录 index.html")
    target.mkdir(parents=True, exist_ok=True)
    z.extractall(target)

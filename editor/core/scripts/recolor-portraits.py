#!/usr/bin/env python3
"""Optional HUD-portrait recoloring (out-of-place port of the example's
tools/recolor-hud-portraits.py).

Selects the bright lavender/purple backdrop and rim pixels and re-tints them
warm gold, keeping dark scales, blue eyes/tears, skin, and clothing untouched.
The mask thresholds were tuned for the Dragon Baby artwork; treat the result
as a starting point for other portraits and preview before shipping.

    python3 recolor-portraits.py --left <in.png> --right <in.png> \
        --out-left <out.png> --out-right <out.png>
"""
import argparse
from pathlib import Path

from PIL import Image


def recolor(source: Path, target: Path) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if a and r > 72 and g > 58 and b > r * 1.055 and b > g * 1.045:
                luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
                warmth = min(1.0, max(0.0, (b - max(r, g)) / 75.0))
                nr = min(255, int(luminance * (1.12 + 0.10 * warmth)))
                ng = min(255, int(luminance * (1.00 + 0.03 * warmth)))
                nb = min(255, int(luminance * (0.76 - 0.08 * warmth)))
                pixels[x, y] = (nr, ng, nb, a)
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, optimize=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--left", type=Path, required=True)
    parser.add_argument("--right", type=Path, required=True)
    parser.add_argument("--out-left", type=Path, required=True)
    parser.add_argument("--out-right", type=Path, required=True)
    args = parser.parse_args()
    recolor(args.left, args.out_left)
    recolor(args.right, args.out_right)
    print(f"wrote {args.out_left}")
    print(f"wrote {args.out_right}")


if __name__ == "__main__":
    main()

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
HUD = ROOT / "editable" / "hud"


def recolor(source: Path) -> None:
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            # Select the bright lavender/purple backdrop and rim only. Dark scales,
            # blue eyes/tears, skin, and clothing stay outside this mask.
            if a and r > 72 and g > 58 and b > r * 1.055 and b > g * 1.045:
                luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
                warmth = min(1.0, max(0.0, (b - max(r, g)) / 75.0))
                nr = min(255, int(luminance * (1.12 + 0.10 * warmth)))
                ng = min(255, int(luminance * (1.00 + 0.03 * warmth)))
                nb = min(255, int(luminance * (0.76 - 0.08 * warmth)))
                pixels[x, y] = (nr, ng, nb, a)
    image.save(source, optimize=True)


for filename in ("dragon-left.png", "dragon-right.png"):
    recolor(HUD / filename)

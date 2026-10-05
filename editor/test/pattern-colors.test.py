"""Regression checks for dominant-color reduction; run with python3."""
from collections import Counter
from pathlib import Path
import json
import runpy
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / 'editor/plugins/colorever-gemsort/scripts/image-to-pattern.py'
TEMPLATE = ROOT / 'editor/templates/colorever-gemsort/template.json'
argv = sys.argv[:]
sys.argv = [str(SCRIPT), '--source', '/unused', '--template-json', str(TEMPLATE),
            '--out', '/unused', '--preview', '/unused']
MODULE = runpy.run_path(str(SCRIPT))
sys.argv = argv
reduce_colors = MODULE['reduce_colors']
palette = MODULE['PALETTE']


class PatternColorsTest(unittest.TestCase):
    def test_top_eight_and_inventory(self):
        cells = [tile for tile in range(1, 13) for _ in range(30 - tile)]
        tiles = [cells + [None, None]]
        samples = [[palette[tile][0] if tile else None for tile in tiles[0]]]
        reduced, counts = reduce_colors(tiles, samples)
        self.assertEqual(set(counts), set(range(1, 9)))
        self.assertEqual(sum(counts.values()), len(cells))
        self.assertEqual(counts, Counter(tile for tile in reduced[0] if tile is not None))
        self.assertEqual(reduced[0][-2:], [None, None])
        for i, tile in enumerate(cells):
            expected = tile if tile <= 8 else MODULE['nearest_tile'](samples[0][i], list(range(1, 9)))
            self.assertEqual(reduced[0][i], expected)

    def test_fewer_colors_and_rare_colors(self):
        tiles = [[1] * 40 + [2] * 20 + [3]]
        samples = [[palette[tile][0] for tile in tiles[0]]]
        reduced, counts = reduce_colors(tiles, samples)
        self.assertEqual(set(counts), {1, 2})
        self.assertEqual(sum(counts.values()), 61)
        self.assertEqual(reduce_colors([[None]], [[None]]), ([[None]], Counter()))
        self.assertEqual(reduce_colors([[1]], [[palette[1][0]]]), ([[1]], Counter({1: 1})))

    def test_smoothing_cells_without_samples(self):
        tiles = [[1] * 20 + [2] * 20 + [3]]
        reduced, counts = reduce_colors(tiles, [[None] * len(tiles[0])])
        self.assertEqual(sum(counts.values()), 41)
        self.assertIn(reduced[0][-1], (1, 2))

    def test_actual_script_and_preview(self):
        from PIL import Image
        with tempfile.TemporaryDirectory(prefix='pattern-colors-') as tmp:
            tmp = Path(tmp)
            colors = [tile for tile in palette if max(palette[tile][0]) >= 128][:12]
            image = Image.new('RGB', (600, 160))
            for index, tile in enumerate(colors):
                image.paste(palette[tile][0], (index * 50, 0, (index + 1) * 50, 160))
            source = tmp / 'source.png'
            image.save(source)
            subprocess.run([sys.executable, str(SCRIPT), '--source', str(source),
                            '--template-json', str(TEMPLATE), '--out', str(tmp / 'pattern.json'),
                            '--preview', str(tmp / 'preview.png'), '--width', '60', '--height', '16',
                            '--brightness-threshold', '0', '--smoothing-passes', '0'],
                           check=True, capture_output=True)
            result = json.loads((tmp / 'pattern.json').read_text())
            counts = Counter(str(result['symbolToTile'][symbol]) for row in result['rows'] for symbol in row if symbol != ' ')
            self.assertEqual(len(counts), 8)
            self.assertEqual(counts, result['colorCounts'])
            self.assertEqual(sum(counts.values()), 960)
            preview = Image.open(tmp / 'preview.png')
            for y, row in enumerate(result['rows']):
                for x, symbol in enumerate(row):
                    self.assertEqual(preview.getpixel((x * 24 + 12, y * 24 + 12)), palette[result['symbolToTile'][symbol]][0])

    def test_manual_grid_preserves_shape_and_top_colors(self):
        from PIL import Image
        with tempfile.TemporaryDirectory(prefix='manual-colors-') as tmp:
            tmp = Path(tmp)
            image = Image.new('RGB', (600, 160))
            for index, tile in enumerate(range(1, 13)):
                image.paste(palette[tile][0], (index * 50, 0, (index + 1) * 50, 160))
            image.save(tmp / 'source.png')
            script = ROOT / 'editor/plugins/colorever-gemsort/scripts/image-to-pattern-full.py'
            results = []
            for limit in (34, 8):
                subprocess.run([sys.executable, str(script), '--source', str(tmp / 'source.png'),
                                '--template-json', str(TEMPLATE), '--out', str(tmp / 'pattern.json'),
                                '--preview', str(tmp / 'preview.png'), '--long-side', '60',
                                '--gamma', '1', '--saturation', '1', '--smoothing-passes', '0',
                                '--prune-floor', '0', '--max-colors', str(limit)], check=True, capture_output=True)
                results.append(json.loads((tmp / 'pattern.json').read_text()))
            original, reduced = results
            original_counts = Counter(tile for row in original['tiles'] for tile in row)
            top = set(sorted(original_counts, key=lambda tile: (-original_counts[tile], tile))[:8])
            counts = Counter(tile for row in reduced['tiles'] for tile in row)
            self.assertGreater(len(original_counts), 8)
            self.assertEqual(set(counts), top)
            self.assertEqual((reduced['width'], reduced['height']), (60, 16))
            self.assertEqual(sum(counts.values()), 960)
            self.assertNotIn(0, counts)
            self.assertEqual({str(tile): n for tile, n in counts.items()}, reduced['colorCounts'])
            preview = Image.open(tmp / 'preview.png')
            for y, row in enumerate(reduced['tiles']):
                for x, tile in enumerate(row):
                    self.assertEqual(preview.getpixel((x * 24 + 12, y * 24 + 12)), palette[tile][0])


if __name__ == '__main__':
    unittest.main()

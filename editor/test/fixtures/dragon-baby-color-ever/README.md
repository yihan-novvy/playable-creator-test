# Downloaded playable source

This folder contains a local, offline copy of the supplied Cocos Creator 3.8.7 playable ad.

## Files

- `index.html` — original standalone HTML reconstructed from the remote AppLovin loader.
- `original/entry.html` — the small signed-link entry page.
- `original/applovin-loader.js` — the remote loader captured locally.
- `editable/assets/` — all direct and ZIP-embedded runtime files split into normal files, including PNG/JPG/WebP images, MP3 audio, JSON, JavaScript, and binary animation data.
- `editable/asset-manifest.json` — records how each file was embedded.
- `editable/zip-manifest.json` — records which source files belong in the embedded program archive.
- `editable/ASSET_GUIDE.md` — image names, dimensions, and replacement paths.
- `editable/index.html` — rebuilt standalone HTML generated from the editable asset tree.
- `docs/pattern-replacement/README.md` — manual for replacing the first-level target shape while preserving the Board/Gems data contract.
- `docs/locality-preserving-constrained-scramble/README.md` — step-by-step manual for turning a completed color pattern into a playable scrambled level with the LPCS API.

## Edit and rebuild

1. Replace or edit files under `editable/assets/`. Keep image dimensions/aspect ratio where possible.
2. Rebuild the standalone playable:

   ```bash
   node tools/repack-assets.mjs
   ```

3. Preview over HTTP (not by double-clicking the HTML):

   ```bash
   python3 -m http.server 8080 --directory editable
   ```

   Open `http://localhost:8080/`.

The JavaScript is production/minified Cocos output rather than the original Cocos Editor project, so it is editable but not equivalent to having the original `.creator` project and TypeScript source maps.

## Current background replacement

The `game_pic_bg` texture has been replaced with `editable/source-images/new-game-background.png`, fitted to the original 1560×2598 texture size. The previous background is preserved at `editable/backups/game_pic_bg-original.png`.

## Custom top HUD

The former localized title is disabled in `GameConfig`. The replacement HUD source is under `editable/hud/` and is embedded into the standalone HTML during repacking. Its progress starts at 10% and advances 15 percentage points whenever the game finishes a valid placement and plays the aggregate `Gem_othregion_place` sound. The per-gem `Gem_othregion_place_single` sound is intentionally ignored to avoid counting one move multiple times.

The HUD is mobile-first and scales from the portrait viewport short edge, with safe-area handling for notched phones. It is verified at 390×844 and 360×640 CSS-pixel viewports.

## Generated story intro

The standalone playable opens with a newly generated 8-second 9:16 story video: 0–4 seconds establish that Nox only likes white milk, 4–6 seconds have Eva ask the viewer to make his favorite milk, and 6–8 seconds push into the bottle for a match cut to the playable board. The normalized H.264/AAC master is `ad-assets/final/intro-video.mp4`; editable overlay sources are under `editable/intro/` and are embedded by `tools/repack-assets.mjs`.

Browsers that block unmuted autoplay fall back to muted playback with a `TAP FOR SOUND` control. The intro always releases the game after playback, an error, or the 12-second safety timeout.

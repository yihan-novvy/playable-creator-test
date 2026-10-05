import { defineConfig } from 'vite';

// `vite build --mode game` produces the standalone ad base package: stable,
// hash-free names with game.js as the single entry chunk. Dev (`npm run dev`)
// and the dev-page build (`npm run build`) use the default config untouched.
export default defineConfig(({ mode }) => {
  if (mode !== 'game') return {};
  return {
    // Relative asset URLs so the package also works under subpath mounts
    // like the editor's /dist/<id>/.
    base: './',
    build: {
      outDir: 'build/game',
      emptyOutDir: true,
      assetsDir: '',
      rollupOptions: {
        input: 'ad.html',
        output: {
          // format stays 'es' on purpose: iife makes Vite swallow the CSS into
          // game.js, which breaks the shell's url(./stone.svg) background-
          // swap contract. build-template.mjs strips type="module"/crossorigin
          // from the emitted tag instead — file://-safe without iife.
          entryFileNames: 'game.js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
      },
    },
  };
});

import {authoringPlugin} from './scripts/authoring.mjs';
import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';

export default defineConfig({
  base:'./',
  plugins:[authoringPlugin(),{
    name:'game-audio-assets',
    async generateBundle(){
      for(const name of ['bgm','pickup','place','place-single','store','store-move','success']){
        this.emitFile({type:'asset',fileName:`audio/${name}.mp3`,source:await fs.readFile(new URL(`./public/audio/${name}.mp3`,import.meta.url))});
      }
    },
  }],
  build:{copyPublicDir:false,rollupOptions:{input:{
    main:fileURLToPath(new URL('./index.html',import.meta.url)),
    calibration:fileURLToPath(new URL('./calibration.html',import.meta.url)),
  }}},
});

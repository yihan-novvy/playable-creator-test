export const WIDTH = 29, HEIGHT = 29;
export const PALETTE = {1:'#373c44',2:'#fffdf5',3:'#ff94b7',4:'#0098ee',5:'#ffe332',6:'#05090e',7:'#ff9ebc'};
// Share the model's silhouette so the playable beads follow its rounded contours.
import {sampleKittyPattern} from './kitty-sculpture.js';
export const kittyPattern=()=>sampleKittyPattern(WIDTH);

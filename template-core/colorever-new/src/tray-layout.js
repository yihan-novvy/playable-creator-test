import {BEAD_WIDTH} from './bead-reference.js';

// Preserve the authored slot positions and fitted tray dimensions. Match the
// current pyramid's visible width to the footprint the layout reserves for it.
export function trayLayout(capacity,cols){
 const rows=Math.ceil(capacity/cols),footprintScale=Math.min(1.6,24.96/(cols*.94),8.5/(rows*.94));
 const beadWidth=.736*footprintScale,scale=beadWidth/BEAD_WIDTH,pocketWidth=beadWidth+.16,pitch=pocketWidth+.25;
 return {cols,rows,scale,beadWidth,pocketWidth,pitch,width:cols*pitch+1,height:rows*pitch+1};
}

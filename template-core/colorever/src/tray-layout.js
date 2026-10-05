// Square pockets follow the rendered bead size, rather than stretching to a fixed box.
export function trayLayout(capacity,cols){
 const rows=Math.ceil(capacity/cols),scale=Math.min(1.6,24.96/(cols*.94),8.5/(rows*.94));
 const beadWidth=.736*scale,pocketWidth=beadWidth+.16,pitch=pocketWidth+.25;
 return {rows,scale,beadWidth,pocketWidth,pitch,width:cols*pitch+1,height:rows*pitch+1};
}

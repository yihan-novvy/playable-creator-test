export const PREVIEW_SPEEDS=[.5,1,1.5,2,3];

export function validatePreviewSpeed(value=1) {
  const speed=Number(value);
  if(!PREVIEW_SPEEDS.includes(speed))throw new Error('测试搬运速度应为 0.5、1、1.5、2 或 3 倍');
  return speed;
}

// Production supplies no preview options and always uses the original timing.
// Scale both flight duration and departure spacing by the same test multiplier.
export function moveTiming(fromRegion,toRegion,previewOptions) {
  const speed=PREVIEW_SPEEDS.includes(previewOptions?.speed)?previewOptions.speed:1;
  return {
    stagger:(toRegion==='tray'?55:fromRegion==='tray'?65:50)/speed,
    duration:(fromRegion==='tray'||toRegion==='tray'?360:260)/speed,
    shiftDuration:210/speed,
  };
}

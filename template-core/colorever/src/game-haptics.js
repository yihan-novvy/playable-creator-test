// Match the gemsort SDK feedback styles without depending on Cocos audio hooks.
const styles={pickup:'light',store:'selection','store-move':'selection','place-single':'selection',place:'medium',success:'success'};
const vibration={light:10,selection:8,medium:20,success:[25,50,35]};
export class GameHaptics {
  constructor({host=globalThis,now=()=>Date.now()}={}){this.host=host;this.now=now;this.lastBuzzAt=-Infinity;}
  play(clip){const style=styles[clip];if(style)this.trigger(style);}
  trigger(style){
    if(this.host.document?.hidden)return;
    const now=this.now();if(style!=='success'&&now-this.lastBuzzAt<45)return;
    try{
      const bridge=this.host.novvy;
      if(typeof bridge?.haptic==='function'){bridge.haptic(style);this.lastBuzzAt=now;}
      else if(typeof this.host.navigator?.vibrate==='function'){this.host.navigator.vibrate(vibration[style]??20);this.lastBuzzAt=now;}
    }catch{/* Feedback must never interrupt a gameplay action. */}
  }
}

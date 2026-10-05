(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function e(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(r){if(r.ep)return;r.ep=!0;const s=e(r);fetch(r.href,s)}})();const io="180",Vl=0,No=1,wl=2,_a=1,Dl=2,sn=3,je=0,Ae=1,ze=2,Mn=0,ii=1,qo=2,Vo=3,wo=4,Ll=5,qn=100,Ol=101,zl=102,Il=103,Fl=104,_l=200,Wl=201,Bl=202,kl=203,cs=204,us=205,Hl=206,Xl=207,Gl=208,Ql=209,Kl=210,jl=211,Zl=212,Jl=213,Yl=214,fs=0,hs=1,ds=2,si=3,ps=4,ms=5,vs=6,gs=7,Wa=0,$l=1,tc=2,Tn=0,ec=1,nc=2,ic=3,Ba=4,rc=5,sc=6,oc=7,ka=300,oi=301,ai=302,xs=303,Ms=304,xr=306,Ts=1e3,wn=1001,Es=1002,ke=1003,ac=1004,Wi=1005,Ge=1006,Ur=1007,Dn=1008,Ze=1009,Ha=1010,Xa=1011,Ri=1012,ro=1013,On=1014,an=1015,wi=1016,so=1017,oo=1018,Ui=1020,Ga=35902,Qa=35899,Ka=1021,ja=1022,Be=1023,Pi=1026,Ci=1027,Za=1028,ao=1029,Ja=1030,lo=1031,co=1033,ur=33776,fr=33777,hr=33778,dr=33779,Ss=35840,ys=35841,As=35842,bs=35843,Rs=36196,Us=37492,Ps=37496,Cs=37808,Ns=37809,qs=37810,Vs=37811,ws=37812,Ds=37813,Ls=37814,Os=37815,zs=37816,Is=37817,Fs=37818,_s=37819,Ws=37820,Bs=37821,ks=36492,Hs=36494,Xs=36495,Gs=36283,Qs=36284,Ks=36285,js=36286,lc=3200,cc=3201,Ya=0,uc=1,gn="",De="srgb",li="srgb-linear",mr="linear",Yt="srgb",Fn=7680,Do=519,fc=512,hc=513,dc=514,$a=515,pc=516,mc=517,vc=518,gc=519,Lo=35044,Oo="300 es",Qe=2e3,vr=2001;class fi{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){const n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){const n=this._listeners;if(n===void 0)return;const r=n[t];if(r!==void 0){const s=r.indexOf(e);s!==-1&&r.splice(s,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const n=e[t.type];if(n!==void 0){t.target=this;const r=n.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,t);t.target=null}}}const xe=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let zo=1234567;const Ei=Math.PI/180,Ni=180/Math.PI;function hi(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(xe[i&255]+xe[i>>8&255]+xe[i>>16&255]+xe[i>>24&255]+"-"+xe[t&255]+xe[t>>8&255]+"-"+xe[t>>16&15|64]+xe[t>>24&255]+"-"+xe[e&63|128]+xe[e>>8&255]+"-"+xe[e>>16&255]+xe[e>>24&255]+xe[n&255]+xe[n>>8&255]+xe[n>>16&255]+xe[n>>24&255]).toLowerCase()}function Wt(i,t,e){return Math.max(t,Math.min(e,i))}function uo(i,t){return(i%t+t)%t}function xc(i,t,e,n,r){return n+(i-t)*(r-n)/(e-t)}function Mc(i,t,e){return i!==t?(e-i)/(t-i):0}function Si(i,t,e){return(1-e)*i+e*t}function Tc(i,t,e,n){return Si(i,t,1-Math.exp(-e*n))}function Ec(i,t=1){return t-Math.abs(uo(i,t*2)-t)}function Sc(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function yc(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function Ac(i,t){return i+Math.floor(Math.random()*(t-i+1))}function bc(i,t){return i+Math.random()*(t-i)}function Rc(i){return i*(.5-Math.random())}function Uc(i){i!==void 0&&(zo=i);let t=zo+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Pc(i){return i*Ei}function Cc(i){return i*Ni}function Nc(i){return(i&i-1)===0&&i!==0}function qc(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Vc(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function wc(i,t,e,n,r){const s=Math.cos,o=Math.sin,a=s(e/2),c=o(e/2),l=s((t+n)/2),u=o((t+n)/2),h=s((t-n)/2),d=o((t-n)/2),p=s((n-t)/2),g=o((n-t)/2);switch(r){case"XYX":i.set(a*u,c*h,c*d,a*l);break;case"YZY":i.set(c*d,a*u,c*h,a*l);break;case"ZXZ":i.set(c*h,c*d,a*u,a*l);break;case"XZX":i.set(a*u,c*g,c*p,a*l);break;case"YXY":i.set(c*p,a*u,c*g,a*l);break;case"ZYZ":i.set(c*g,c*p,a*u,a*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function ti(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Ee(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const Pr={DEG2RAD:Ei,RAD2DEG:Ni,generateUUID:hi,clamp:Wt,euclideanModulo:uo,mapLinear:xc,inverseLerp:Mc,lerp:Si,damp:Tc,pingpong:Ec,smoothstep:Sc,smootherstep:yc,randInt:Ac,randFloat:bc,randFloatSpread:Rc,seededRandom:Uc,degToRad:Pc,radToDeg:Cc,isPowerOfTwo:Nc,ceilPowerOfTwo:qc,floorPowerOfTwo:Vc,setQuaternionFromProperEuler:wc,normalize:Ee,denormalize:ti};class dt{constructor(t=0,e=0){dt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6],this.y=r[1]*e+r[4]*n+r[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Wt(this.x,t.x,e.x),this.y=Wt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Wt(this.x,t,e),this.y=Wt(this.y,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Wt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Wt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),r=Math.sin(e),s=this.x-t.x,o=this.y-t.y;return this.x=s*n-o*r+t.x,this.y=s*r+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class di{constructor(t=0,e=0,n=0,r=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=r}static slerpFlat(t,e,n,r,s,o,a){let c=n[r+0],l=n[r+1],u=n[r+2],h=n[r+3];const d=s[o+0],p=s[o+1],g=s[o+2],x=s[o+3];if(a===0){t[e+0]=c,t[e+1]=l,t[e+2]=u,t[e+3]=h;return}if(a===1){t[e+0]=d,t[e+1]=p,t[e+2]=g,t[e+3]=x;return}if(h!==x||c!==d||l!==p||u!==g){let m=1-a;const f=c*d+l*p+u*g+h*x,b=f>=0?1:-1,A=1-f*f;if(A>Number.EPSILON){const P=Math.sqrt(A),U=Math.atan2(P,f*b);m=Math.sin(m*U)/P,a=Math.sin(a*U)/P}const T=a*b;if(c=c*m+d*T,l=l*m+p*T,u=u*m+g*T,h=h*m+x*T,m===1-a){const P=1/Math.sqrt(c*c+l*l+u*u+h*h);c*=P,l*=P,u*=P,h*=P}}t[e]=c,t[e+1]=l,t[e+2]=u,t[e+3]=h}static multiplyQuaternionsFlat(t,e,n,r,s,o){const a=n[r],c=n[r+1],l=n[r+2],u=n[r+3],h=s[o],d=s[o+1],p=s[o+2],g=s[o+3];return t[e]=a*g+u*h+c*p-l*d,t[e+1]=c*g+u*d+l*h-a*p,t[e+2]=l*g+u*p+a*d-c*h,t[e+3]=u*g-a*h-c*d-l*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,r){return this._x=t,this._y=e,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,r=t._y,s=t._z,o=t._order,a=Math.cos,c=Math.sin,l=a(n/2),u=a(r/2),h=a(s/2),d=c(n/2),p=c(r/2),g=c(s/2);switch(o){case"XYZ":this._x=d*u*h+l*p*g,this._y=l*p*h-d*u*g,this._z=l*u*g+d*p*h,this._w=l*u*h-d*p*g;break;case"YXZ":this._x=d*u*h+l*p*g,this._y=l*p*h-d*u*g,this._z=l*u*g-d*p*h,this._w=l*u*h+d*p*g;break;case"ZXY":this._x=d*u*h-l*p*g,this._y=l*p*h+d*u*g,this._z=l*u*g+d*p*h,this._w=l*u*h-d*p*g;break;case"ZYX":this._x=d*u*h-l*p*g,this._y=l*p*h+d*u*g,this._z=l*u*g-d*p*h,this._w=l*u*h+d*p*g;break;case"YZX":this._x=d*u*h+l*p*g,this._y=l*p*h+d*u*g,this._z=l*u*g-d*p*h,this._w=l*u*h-d*p*g;break;case"XZY":this._x=d*u*h-l*p*g,this._y=l*p*h-d*u*g,this._z=l*u*g+d*p*h,this._w=l*u*h+d*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,r=Math.sin(n);return this._x=t.x*r,this._y=t.y*r,this._z=t.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],r=e[4],s=e[8],o=e[1],a=e[5],c=e[9],l=e[2],u=e[6],h=e[10],d=n+a+h;if(d>0){const p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(u-c)*p,this._y=(s-l)*p,this._z=(o-r)*p}else if(n>a&&n>h){const p=2*Math.sqrt(1+n-a-h);this._w=(u-c)/p,this._x=.25*p,this._y=(r+o)/p,this._z=(s+l)/p}else if(a>h){const p=2*Math.sqrt(1+a-n-h);this._w=(s-l)/p,this._x=(r+o)/p,this._y=.25*p,this._z=(c+u)/p}else{const p=2*Math.sqrt(1+h-n-a);this._w=(o-r)/p,this._x=(s+l)/p,this._y=(c+u)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Wt(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const r=Math.min(1,e/n);return this.slerp(t,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,r=t._y,s=t._z,o=t._w,a=e._x,c=e._y,l=e._z,u=e._w;return this._x=n*u+o*a+r*l-s*c,this._y=r*u+o*c+s*a-n*l,this._z=s*u+o*l+n*c-r*a,this._w=o*u-n*a-r*c-s*l,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,r=this._y,s=this._z,o=this._w;let a=o*t._w+n*t._x+r*t._y+s*t._z;if(a<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,a=-a):this.copy(t),a>=1)return this._w=o,this._x=n,this._y=r,this._z=s,this;const c=1-a*a;if(c<=Number.EPSILON){const p=1-e;return this._w=p*o+e*this._w,this._x=p*n+e*this._x,this._y=p*r+e*this._y,this._z=p*s+e*this._z,this.normalize(),this}const l=Math.sqrt(c),u=Math.atan2(l,a),h=Math.sin((1-e)*u)/l,d=Math.sin(e*u)/l;return this._w=o*h+this._w*d,this._x=n*h+this._x*d,this._y=r*h+this._y*d,this._z=s*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(r*Math.sin(t),r*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class V{constructor(t=0,e=0,n=0){V.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Io.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Io.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*r,this.y=s[1]*e+s[4]*n+s[7]*r,this.z=s[2]*e+s[5]*n+s[8]*r,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,r=this.z,s=t.elements,o=1/(s[3]*e+s[7]*n+s[11]*r+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*r+s[12])*o,this.y=(s[1]*e+s[5]*n+s[9]*r+s[13])*o,this.z=(s[2]*e+s[6]*n+s[10]*r+s[14])*o,this}applyQuaternion(t){const e=this.x,n=this.y,r=this.z,s=t.x,o=t.y,a=t.z,c=t.w,l=2*(o*r-a*n),u=2*(a*e-s*r),h=2*(s*n-o*e);return this.x=e+c*l+o*h-a*u,this.y=n+c*u+a*l-s*h,this.z=r+c*h+s*u-o*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,r=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*r,this.y=s[1]*e+s[5]*n+s[9]*r,this.z=s[2]*e+s[6]*n+s[10]*r,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Wt(this.x,t.x,e.x),this.y=Wt(this.y,t.y,e.y),this.z=Wt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Wt(this.x,t,e),this.y=Wt(this.y,t,e),this.z=Wt(this.z,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Wt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,r=t.y,s=t.z,o=e.x,a=e.y,c=e.z;return this.x=r*c-s*a,this.y=s*o-n*c,this.z=n*a-r*o,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Cr.copy(this).projectOnVector(t),this.sub(Cr)}reflect(t){return this.sub(Cr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Wt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,r=this.z-t.z;return e*e+n*n+r*r}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const r=Math.sin(e)*t;return this.x=r*Math.sin(n),this.y=Math.cos(e)*t,this.z=r*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),r=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=r,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Cr=new V,Io=new di;class Ft{constructor(t,e,n,r,s,o,a,c,l){Ft.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,r,s,o,a,c,l)}set(t,e,n,r,s,o,a,c,l){const u=this.elements;return u[0]=t,u[1]=r,u[2]=a,u[3]=e,u[4]=s,u[5]=c,u[6]=n,u[7]=o,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,r=e.elements,s=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],u=n[4],h=n[7],d=n[2],p=n[5],g=n[8],x=r[0],m=r[3],f=r[6],b=r[1],A=r[4],T=r[7],P=r[2],U=r[5],C=r[8];return s[0]=o*x+a*b+c*P,s[3]=o*m+a*A+c*U,s[6]=o*f+a*T+c*C,s[1]=l*x+u*b+h*P,s[4]=l*m+u*A+h*U,s[7]=l*f+u*T+h*C,s[2]=d*x+p*b+g*P,s[5]=d*m+p*A+g*U,s[8]=d*f+p*T+g*C,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],o=t[4],a=t[5],c=t[6],l=t[7],u=t[8];return e*o*u-e*a*l-n*s*u+n*a*c+r*s*l-r*o*c}invert(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],o=t[4],a=t[5],c=t[6],l=t[7],u=t[8],h=u*o-a*l,d=a*c-u*s,p=l*s-o*c,g=e*h+n*d+r*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/g;return t[0]=h*x,t[1]=(r*l-u*n)*x,t[2]=(a*n-r*o)*x,t[3]=d*x,t[4]=(u*e-r*c)*x,t[5]=(r*s-a*e)*x,t[6]=p*x,t[7]=(n*c-l*e)*x,t[8]=(o*e-n*s)*x,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,r,s,o,a){const c=Math.cos(s),l=Math.sin(s);return this.set(n*c,n*l,-n*(c*o+l*a)+o+t,-r*l,r*c,-r*(-l*o+c*a)+a+e,0,0,1),this}scale(t,e){return this.premultiply(Nr.makeScale(t,e)),this}rotate(t){return this.premultiply(Nr.makeRotation(-t)),this}translate(t,e){return this.premultiply(Nr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let r=0;r<9;r++)if(e[r]!==n[r])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Nr=new Ft;function tl(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function gr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Dc(){const i=gr("canvas");return i.style.display="block",i}const Fo={};function qi(i){i in Fo||(Fo[i]=!0,console.warn(i))}function Lc(i,t,e){return new Promise(function(n,r){function s(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:n()}}setTimeout(s,e)})}const _o=new Ft().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Wo=new Ft().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Oc(){const i={enabled:!0,workingColorSpace:li,spaces:{},convert:function(r,s,o){return this.enabled===!1||s===o||!s||!o||(this.spaces[s].transfer===Yt&&(r.r=ln(r.r),r.g=ln(r.g),r.b=ln(r.b)),this.spaces[s].primaries!==this.spaces[o].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===Yt&&(r.r=ri(r.r),r.g=ri(r.g),r.b=ri(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===gn?mr:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,o){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return qi("THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return qi("THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(r,s)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[li]:{primaries:t,whitePoint:n,transfer:mr,toXYZ:_o,fromXYZ:Wo,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:De},outputColorSpaceConfig:{drawingBufferColorSpace:De}},[De]:{primaries:t,whitePoint:n,transfer:Yt,toXYZ:_o,fromXYZ:Wo,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:De}}}),i}const Gt=Oc();function ln(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function ri(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let _n;class zc{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{_n===void 0&&(_n=gr("canvas")),_n.width=t.width,_n.height=t.height;const r=_n.getContext("2d");t instanceof ImageData?r.putImageData(t,0,0):r.drawImage(t,0,0,t.width,t.height),n=_n}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=gr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const r=n.getImageData(0,0,t.width,t.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=ln(s[o]/255)*255;return n.putImageData(r,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(ln(e[n]/255)*255):e[n]=ln(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Ic=0;class fo{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Ic++}),this.uuid=hi(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):e instanceof VideoFrame?t.set(e.displayHeight,e.displayWidth,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,a=r.length;o<a;o++)r[o].isDataTexture?s.push(qr(r[o].image)):s.push(qr(r[o]))}else s=qr(r);n.url=s}return e||(t.images[this.uuid]=n),n}}function qr(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?zc.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Fc=0;const Vr=new V;class be extends fi{constructor(t=be.DEFAULT_IMAGE,e=be.DEFAULT_MAPPING,n=wn,r=wn,s=Ge,o=Dn,a=Be,c=Ze,l=be.DEFAULT_ANISOTROPY,u=gn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Fc++}),this.uuid=hi(),this.name="",this.source=new fo(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=s,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new dt(0,0),this.repeat=new dt(1,1),this.center=new dt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ft,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(Vr).x}get height(){return this.source.getSize(Vr).y}get depth(){return this.source.getSize(Vr).z}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){console.warn(`THREE.Texture.setValues(): property '${e}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==ka)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ts:t.x=t.x-Math.floor(t.x);break;case wn:t.x=t.x<0?0:1;break;case Es:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ts:t.y=t.y-Math.floor(t.y);break;case wn:t.y=t.y<0?0:1;break;case Es:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}be.DEFAULT_IMAGE=null;be.DEFAULT_MAPPING=ka;be.DEFAULT_ANISOTROPY=1;class ce{constructor(t=0,e=0,n=0,r=1){ce.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=r}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,r){return this.x=t,this.y=e,this.z=n,this.w=r,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,r=this.z,s=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*r+o[12]*s,this.y=o[1]*e+o[5]*n+o[9]*r+o[13]*s,this.z=o[2]*e+o[6]*n+o[10]*r+o[14]*s,this.w=o[3]*e+o[7]*n+o[11]*r+o[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,r,s;const c=t.elements,l=c[0],u=c[4],h=c[8],d=c[1],p=c[5],g=c[9],x=c[2],m=c[6],f=c[10];if(Math.abs(u-d)<.01&&Math.abs(h-x)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+x)<.1&&Math.abs(g+m)<.1&&Math.abs(l+p+f-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const A=(l+1)/2,T=(p+1)/2,P=(f+1)/2,U=(u+d)/4,C=(h+x)/4,w=(g+m)/4;return A>T&&A>P?A<.01?(n=0,r=.707106781,s=.707106781):(n=Math.sqrt(A),r=U/n,s=C/n):T>P?T<.01?(n=.707106781,r=0,s=.707106781):(r=Math.sqrt(T),n=U/r,s=w/r):P<.01?(n=.707106781,r=.707106781,s=0):(s=Math.sqrt(P),n=C/s,r=w/s),this.set(n,r,s,e),this}let b=Math.sqrt((m-g)*(m-g)+(h-x)*(h-x)+(d-u)*(d-u));return Math.abs(b)<.001&&(b=1),this.x=(m-g)/b,this.y=(h-x)/b,this.z=(d-u)/b,this.w=Math.acos((l+p+f-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Wt(this.x,t.x,e.x),this.y=Wt(this.y,t.y,e.y),this.z=Wt(this.z,t.z,e.z),this.w=Wt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Wt(this.x,t,e),this.y=Wt(this.y,t,e),this.z=Wt(this.z,t,e),this.w=Wt(this.w,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Wt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class _c extends fi{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ge,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new ce(0,0,t,e),this.scissorTest=!1,this.viewport=new ce(0,0,t,e);const r={width:t,height:e,depth:n.depth},s=new be(r);this.textures=[];const o=n.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}_setTextureOptions(t={}){const e={minFilter:Ge,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),t!==null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=t,this.textures[r].image.height=e,this.textures[r].image.depth=n,this.textures[r].isArrayTexture=this.textures[r].image.depth>1;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const r=Object.assign({},t.textures[e].image);this.textures[e].source=new fo(r)}return this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class zn extends _c{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class el extends be{constructor(t=null,e=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:r},this.magFilter=ke,this.minFilter=ke,this.wrapR=wn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Wc extends be{constructor(t=null,e=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:r},this.magFilter=ke,this.minFilter=ke,this.wrapR=wn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Di{constructor(t=new V(1/0,1/0,1/0),e=new V(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(Ie.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(Ie.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=Ie.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,Ie):Ie.fromBufferAttribute(s,o),Ie.applyMatrix4(t.matrixWorld),this.expandByPoint(Ie);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Bi.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Bi.copy(n.boundingBox)),Bi.applyMatrix4(t.matrixWorld),this.union(Bi)}const r=t.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Ie),Ie.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(vi),ki.subVectors(this.max,vi),Wn.subVectors(t.a,vi),Bn.subVectors(t.b,vi),kn.subVectors(t.c,vi),fn.subVectors(Bn,Wn),hn.subVectors(kn,Bn),yn.subVectors(Wn,kn);let e=[0,-fn.z,fn.y,0,-hn.z,hn.y,0,-yn.z,yn.y,fn.z,0,-fn.x,hn.z,0,-hn.x,yn.z,0,-yn.x,-fn.y,fn.x,0,-hn.y,hn.x,0,-yn.y,yn.x,0];return!wr(e,Wn,Bn,kn,ki)||(e=[1,0,0,0,1,0,0,0,1],!wr(e,Wn,Bn,kn,ki))?!1:(Hi.crossVectors(fn,hn),e=[Hi.x,Hi.y,Hi.z],wr(e,Wn,Bn,kn,ki))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Ie).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Ie).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:($e[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),$e[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),$e[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),$e[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),$e[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),$e[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),$e[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),$e[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints($e),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const $e=[new V,new V,new V,new V,new V,new V,new V,new V],Ie=new V,Bi=new Di,Wn=new V,Bn=new V,kn=new V,fn=new V,hn=new V,yn=new V,vi=new V,ki=new V,Hi=new V,An=new V;function wr(i,t,e,n,r){for(let s=0,o=i.length-3;s<=o;s+=3){An.fromArray(i,s);const a=r.x*Math.abs(An.x)+r.y*Math.abs(An.y)+r.z*Math.abs(An.z),c=t.dot(An),l=e.dot(An),u=n.dot(An);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}const Bc=new Di,gi=new V,Dr=new V;class ho{constructor(t=new V,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Bc.setFromPoints(t).getCenter(n);let r=0;for(let s=0,o=t.length;s<o;s++)r=Math.max(r,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(r),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;gi.subVectors(t,this.center);const e=gi.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),r=(n-this.radius)*.5;this.center.addScaledVector(gi,r/n),this.radius+=r}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Dr.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(gi.copy(t.center).add(Dr)),this.expandByPoint(gi.copy(t.center).sub(Dr))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}const tn=new V,Lr=new V,Xi=new V,dn=new V,Or=new V,Gi=new V,zr=new V;class nl{constructor(t=new V,e=new V(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,tn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=tn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(tn.copy(this.origin).addScaledVector(this.direction,e),tn.distanceToSquared(t))}distanceSqToSegment(t,e,n,r){Lr.copy(t).add(e).multiplyScalar(.5),Xi.copy(e).sub(t).normalize(),dn.copy(this.origin).sub(Lr);const s=t.distanceTo(e)*.5,o=-this.direction.dot(Xi),a=dn.dot(this.direction),c=-dn.dot(Xi),l=dn.lengthSq(),u=Math.abs(1-o*o);let h,d,p,g;if(u>0)if(h=o*c-a,d=o*a-c,g=s*u,h>=0)if(d>=-g)if(d<=g){const x=1/u;h*=x,d*=x,p=h*(h+o*d+2*a)+d*(o*h+d+2*c)+l}else d=s,h=Math.max(0,-(o*d+a)),p=-h*h+d*(d+2*c)+l;else d=-s,h=Math.max(0,-(o*d+a)),p=-h*h+d*(d+2*c)+l;else d<=-g?(h=Math.max(0,-(-o*s+a)),d=h>0?-s:Math.min(Math.max(-s,-c),s),p=-h*h+d*(d+2*c)+l):d<=g?(h=0,d=Math.min(Math.max(-s,-c),s),p=d*(d+2*c)+l):(h=Math.max(0,-(o*s+a)),d=h>0?s:Math.min(Math.max(-s,-c),s),p=-h*h+d*(d+2*c)+l);else d=o>0?-s:s,h=Math.max(0,-(o*d+a)),p=-h*h+d*(d+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,h),r&&r.copy(Lr).addScaledVector(Xi,d),p}intersectSphere(t,e){tn.subVectors(t.center,this.origin);const n=tn.dot(this.direction),r=tn.dot(tn)-n*n,s=t.radius*t.radius;if(r>s)return null;const o=Math.sqrt(s-r),a=n-o,c=n+o;return c<0?null:a<0?this.at(c,e):this.at(a,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,r,s,o,a,c;const l=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return l>=0?(n=(t.min.x-d.x)*l,r=(t.max.x-d.x)*l):(n=(t.max.x-d.x)*l,r=(t.min.x-d.x)*l),u>=0?(s=(t.min.y-d.y)*u,o=(t.max.y-d.y)*u):(s=(t.max.y-d.y)*u,o=(t.min.y-d.y)*u),n>o||s>r||((s>n||isNaN(n))&&(n=s),(o<r||isNaN(r))&&(r=o),h>=0?(a=(t.min.z-d.z)*h,c=(t.max.z-d.z)*h):(a=(t.max.z-d.z)*h,c=(t.min.z-d.z)*h),n>c||a>r)||((a>n||n!==n)&&(n=a),(c<r||r!==r)&&(r=c),r<0)?null:this.at(n>=0?n:r,e)}intersectsBox(t){return this.intersectBox(t,tn)!==null}intersectTriangle(t,e,n,r,s){Or.subVectors(e,t),Gi.subVectors(n,t),zr.crossVectors(Or,Gi);let o=this.direction.dot(zr),a;if(o>0){if(r)return null;a=1}else if(o<0)a=-1,o=-o;else return null;dn.subVectors(this.origin,t);const c=a*this.direction.dot(Gi.crossVectors(dn,Gi));if(c<0)return null;const l=a*this.direction.dot(Or.cross(dn));if(l<0||c+l>o)return null;const u=-a*dn.dot(zr);return u<0?null:this.at(u/o,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class se{constructor(t,e,n,r,s,o,a,c,l,u,h,d,p,g,x,m){se.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,r,s,o,a,c,l,u,h,d,p,g,x,m)}set(t,e,n,r,s,o,a,c,l,u,h,d,p,g,x,m){const f=this.elements;return f[0]=t,f[4]=e,f[8]=n,f[12]=r,f[1]=s,f[5]=o,f[9]=a,f[13]=c,f[2]=l,f[6]=u,f[10]=h,f[14]=d,f[3]=p,f[7]=g,f[11]=x,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new se().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,r=1/Hn.setFromMatrixColumn(t,0).length(),s=1/Hn.setFromMatrixColumn(t,1).length(),o=1/Hn.setFromMatrixColumn(t,2).length();return e[0]=n[0]*r,e[1]=n[1]*r,e[2]=n[2]*r,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,r=t.y,s=t.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(r),l=Math.sin(r),u=Math.cos(s),h=Math.sin(s);if(t.order==="XYZ"){const d=o*u,p=o*h,g=a*u,x=a*h;e[0]=c*u,e[4]=-c*h,e[8]=l,e[1]=p+g*l,e[5]=d-x*l,e[9]=-a*c,e[2]=x-d*l,e[6]=g+p*l,e[10]=o*c}else if(t.order==="YXZ"){const d=c*u,p=c*h,g=l*u,x=l*h;e[0]=d+x*a,e[4]=g*a-p,e[8]=o*l,e[1]=o*h,e[5]=o*u,e[9]=-a,e[2]=p*a-g,e[6]=x+d*a,e[10]=o*c}else if(t.order==="ZXY"){const d=c*u,p=c*h,g=l*u,x=l*h;e[0]=d-x*a,e[4]=-o*h,e[8]=g+p*a,e[1]=p+g*a,e[5]=o*u,e[9]=x-d*a,e[2]=-o*l,e[6]=a,e[10]=o*c}else if(t.order==="ZYX"){const d=o*u,p=o*h,g=a*u,x=a*h;e[0]=c*u,e[4]=g*l-p,e[8]=d*l+x,e[1]=c*h,e[5]=x*l+d,e[9]=p*l-g,e[2]=-l,e[6]=a*c,e[10]=o*c}else if(t.order==="YZX"){const d=o*c,p=o*l,g=a*c,x=a*l;e[0]=c*u,e[4]=x-d*h,e[8]=g*h+p,e[1]=h,e[5]=o*u,e[9]=-a*u,e[2]=-l*u,e[6]=p*h+g,e[10]=d-x*h}else if(t.order==="XZY"){const d=o*c,p=o*l,g=a*c,x=a*l;e[0]=c*u,e[4]=-h,e[8]=l*u,e[1]=d*h+x,e[5]=o*u,e[9]=p*h-g,e[2]=g*h-p,e[6]=a*u,e[10]=x*h+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(kc,t,Hc)}lookAt(t,e,n){const r=this.elements;return Pe.subVectors(t,e),Pe.lengthSq()===0&&(Pe.z=1),Pe.normalize(),pn.crossVectors(n,Pe),pn.lengthSq()===0&&(Math.abs(n.z)===1?Pe.x+=1e-4:Pe.z+=1e-4,Pe.normalize(),pn.crossVectors(n,Pe)),pn.normalize(),Qi.crossVectors(Pe,pn),r[0]=pn.x,r[4]=Qi.x,r[8]=Pe.x,r[1]=pn.y,r[5]=Qi.y,r[9]=Pe.y,r[2]=pn.z,r[6]=Qi.z,r[10]=Pe.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,r=e.elements,s=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],u=n[1],h=n[5],d=n[9],p=n[13],g=n[2],x=n[6],m=n[10],f=n[14],b=n[3],A=n[7],T=n[11],P=n[15],U=r[0],C=r[4],w=r[8],E=r[12],S=r[1],N=r[5],z=r[9],_=r[13],j=r[2],k=r[6],Q=r[10],Y=r[14],W=r[3],st=r[7],ht=r[11],G=r[15];return s[0]=o*U+a*S+c*j+l*W,s[4]=o*C+a*N+c*k+l*st,s[8]=o*w+a*z+c*Q+l*ht,s[12]=o*E+a*_+c*Y+l*G,s[1]=u*U+h*S+d*j+p*W,s[5]=u*C+h*N+d*k+p*st,s[9]=u*w+h*z+d*Q+p*ht,s[13]=u*E+h*_+d*Y+p*G,s[2]=g*U+x*S+m*j+f*W,s[6]=g*C+x*N+m*k+f*st,s[10]=g*w+x*z+m*Q+f*ht,s[14]=g*E+x*_+m*Y+f*G,s[3]=b*U+A*S+T*j+P*W,s[7]=b*C+A*N+T*k+P*st,s[11]=b*w+A*z+T*Q+P*ht,s[15]=b*E+A*_+T*Y+P*G,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],r=t[8],s=t[12],o=t[1],a=t[5],c=t[9],l=t[13],u=t[2],h=t[6],d=t[10],p=t[14],g=t[3],x=t[7],m=t[11],f=t[15];return g*(+s*c*h-r*l*h-s*a*d+n*l*d+r*a*p-n*c*p)+x*(+e*c*p-e*l*d+s*o*d-r*o*p+r*l*u-s*c*u)+m*(+e*l*h-e*a*p-s*o*h+n*o*p+s*a*u-n*l*u)+f*(-r*a*u-e*c*h+e*a*d+r*o*h-n*o*d+n*c*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const r=this.elements;return t.isVector3?(r[12]=t.x,r[13]=t.y,r[14]=t.z):(r[12]=t,r[13]=e,r[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],r=t[2],s=t[3],o=t[4],a=t[5],c=t[6],l=t[7],u=t[8],h=t[9],d=t[10],p=t[11],g=t[12],x=t[13],m=t[14],f=t[15],b=h*m*l-x*d*l+x*c*p-a*m*p-h*c*f+a*d*f,A=g*d*l-u*m*l-g*c*p+o*m*p+u*c*f-o*d*f,T=u*x*l-g*h*l+g*a*p-o*x*p-u*a*f+o*h*f,P=g*h*c-u*x*c-g*a*d+o*x*d+u*a*m-o*h*m,U=e*b+n*A+r*T+s*P;if(U===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const C=1/U;return t[0]=b*C,t[1]=(x*d*s-h*m*s-x*r*p+n*m*p+h*r*f-n*d*f)*C,t[2]=(a*m*s-x*c*s+x*r*l-n*m*l-a*r*f+n*c*f)*C,t[3]=(h*c*s-a*d*s-h*r*l+n*d*l+a*r*p-n*c*p)*C,t[4]=A*C,t[5]=(u*m*s-g*d*s+g*r*p-e*m*p-u*r*f+e*d*f)*C,t[6]=(g*c*s-o*m*s-g*r*l+e*m*l+o*r*f-e*c*f)*C,t[7]=(o*d*s-u*c*s+u*r*l-e*d*l-o*r*p+e*c*p)*C,t[8]=T*C,t[9]=(g*h*s-u*x*s-g*n*p+e*x*p+u*n*f-e*h*f)*C,t[10]=(o*x*s-g*a*s+g*n*l-e*x*l-o*n*f+e*a*f)*C,t[11]=(u*a*s-o*h*s-u*n*l+e*h*l+o*n*p-e*a*p)*C,t[12]=P*C,t[13]=(u*x*r-g*h*r+g*n*d-e*x*d-u*n*m+e*h*m)*C,t[14]=(g*a*r-o*x*r-g*n*c+e*x*c+o*n*m-e*a*m)*C,t[15]=(o*h*r-u*a*r+u*n*c-e*h*c-o*n*d+e*a*d)*C,this}scale(t){const e=this.elements,n=t.x,r=t.y,s=t.z;return e[0]*=n,e[4]*=r,e[8]*=s,e[1]*=n,e[5]*=r,e[9]*=s,e[2]*=n,e[6]*=r,e[10]*=s,e[3]*=n,e[7]*=r,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],r=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,r))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),r=Math.sin(e),s=1-n,o=t.x,a=t.y,c=t.z,l=s*o,u=s*a;return this.set(l*o+n,l*a-r*c,l*c+r*a,0,l*a+r*c,u*a+n,u*c-r*o,0,l*c-r*a,u*c+r*o,s*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,r,s,o){return this.set(1,n,s,0,t,1,o,0,e,r,1,0,0,0,0,1),this}compose(t,e,n){const r=this.elements,s=e._x,o=e._y,a=e._z,c=e._w,l=s+s,u=o+o,h=a+a,d=s*l,p=s*u,g=s*h,x=o*u,m=o*h,f=a*h,b=c*l,A=c*u,T=c*h,P=n.x,U=n.y,C=n.z;return r[0]=(1-(x+f))*P,r[1]=(p+T)*P,r[2]=(g-A)*P,r[3]=0,r[4]=(p-T)*U,r[5]=(1-(d+f))*U,r[6]=(m+b)*U,r[7]=0,r[8]=(g+A)*C,r[9]=(m-b)*C,r[10]=(1-(d+x))*C,r[11]=0,r[12]=t.x,r[13]=t.y,r[14]=t.z,r[15]=1,this}decompose(t,e,n){const r=this.elements;let s=Hn.set(r[0],r[1],r[2]).length();const o=Hn.set(r[4],r[5],r[6]).length(),a=Hn.set(r[8],r[9],r[10]).length();this.determinant()<0&&(s=-s),t.x=r[12],t.y=r[13],t.z=r[14],Fe.copy(this);const l=1/s,u=1/o,h=1/a;return Fe.elements[0]*=l,Fe.elements[1]*=l,Fe.elements[2]*=l,Fe.elements[4]*=u,Fe.elements[5]*=u,Fe.elements[6]*=u,Fe.elements[8]*=h,Fe.elements[9]*=h,Fe.elements[10]*=h,e.setFromRotationMatrix(Fe),n.x=s,n.y=o,n.z=a,this}makePerspective(t,e,n,r,s,o,a=Qe,c=!1){const l=this.elements,u=2*s/(e-t),h=2*s/(n-r),d=(e+t)/(e-t),p=(n+r)/(n-r);let g,x;if(c)g=s/(o-s),x=o*s/(o-s);else if(a===Qe)g=-(o+s)/(o-s),x=-2*o*s/(o-s);else if(a===vr)g=-o/(o-s),x=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=u,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=p,l[13]=0,l[2]=0,l[6]=0,l[10]=g,l[14]=x,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,r,s,o,a=Qe,c=!1){const l=this.elements,u=2/(e-t),h=2/(n-r),d=-(e+t)/(e-t),p=-(n+r)/(n-r);let g,x;if(c)g=1/(o-s),x=o/(o-s);else if(a===Qe)g=-2/(o-s),x=-(o+s)/(o-s);else if(a===vr)g=-1/(o-s),x=-s/(o-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=u,l[4]=0,l[8]=0,l[12]=d,l[1]=0,l[5]=h,l[9]=0,l[13]=p,l[2]=0,l[6]=0,l[10]=g,l[14]=x,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let r=0;r<16;r++)if(e[r]!==n[r])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Hn=new V,Fe=new se,kc=new V(0,0,0),Hc=new V(1,1,1),pn=new V,Qi=new V,Pe=new V,Bo=new se,ko=new di;class Je{constructor(t=0,e=0,n=0,r=Je.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=r}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,r=this._order){return this._x=t,this._y=e,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const r=t.elements,s=r[0],o=r[4],a=r[8],c=r[1],l=r[5],u=r[9],h=r[2],d=r[6],p=r[10];switch(e){case"XYZ":this._y=Math.asin(Wt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,p),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Wt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,p),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-h,s),this._z=0);break;case"ZXY":this._x=Math.asin(Wt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,p),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-Wt(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(Wt(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-h,s)):(this._x=0,this._y=Math.atan2(a,p));break;case"XZY":this._z=Math.asin(-Wt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-u,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Bo.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Bo,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return ko.setFromEuler(this),this.setFromQuaternion(ko,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Je.DEFAULT_ORDER="XYZ";class po{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Xc=0;const Ho=new V,Xn=new di,en=new se,Ki=new V,xi=new V,Gc=new V,Qc=new di,Xo=new V(1,0,0),Go=new V(0,1,0),Qo=new V(0,0,1),Ko={type:"added"},Kc={type:"removed"},Gn={type:"childadded",child:null},Ir={type:"childremoved",child:null};class ge extends fi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Xc++}),this.uuid=hi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=ge.DEFAULT_UP.clone();const t=new V,e=new Je,n=new di,r=new V(1,1,1);function s(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new se},normalMatrix:{value:new Ft}}),this.matrix=new se,this.matrixWorld=new se,this.matrixAutoUpdate=ge.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=ge.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new po,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Xn.setFromAxisAngle(t,e),this.quaternion.multiply(Xn),this}rotateOnWorldAxis(t,e){return Xn.setFromAxisAngle(t,e),this.quaternion.premultiply(Xn),this}rotateX(t){return this.rotateOnAxis(Xo,t)}rotateY(t){return this.rotateOnAxis(Go,t)}rotateZ(t){return this.rotateOnAxis(Qo,t)}translateOnAxis(t,e){return Ho.copy(t).applyQuaternion(this.quaternion),this.position.add(Ho.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Xo,t)}translateY(t){return this.translateOnAxis(Go,t)}translateZ(t){return this.translateOnAxis(Qo,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(en.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Ki.copy(t):Ki.set(t,e,n);const r=this.parent;this.updateWorldMatrix(!0,!1),xi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?en.lookAt(xi,Ki,this.up):en.lookAt(Ki,xi,this.up),this.quaternion.setFromRotationMatrix(en),r&&(en.extractRotation(r.matrixWorld),Xn.setFromRotationMatrix(en),this.quaternion.premultiply(Xn.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Ko),Gn.child=t,this.dispatchEvent(Gn),Gn.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Kc),Ir.child=t,this.dispatchEvent(Ir),Ir.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),en.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),en.multiply(t.parent.matrixWorld)),t.applyMatrix4(en),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Ko),Gn.child=t,this.dispatchEvent(Gn),Gn.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,r=this.children.length;n<r;n++){const o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(xi,t,Gc),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(xi,Qc,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,r=e.length;n<r;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(a=>({...a})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(t),r.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(t.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const c=a.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){const h=c[l];s(t.shapes,h)}else s(t.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(s(t.materials,this.material[c]));r.material=a}else r.material=s(t.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){const c=this.animations[a];r.animations.push(s(t.animations,c))}}if(e){const a=o(t.geometries),c=o(t.materials),l=o(t.textures),u=o(t.images),h=o(t.shapes),d=o(t.skeletons),p=o(t.animations),g=o(t.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),p.length>0&&(n.animations=p),g.length>0&&(n.nodes=g)}return n.object=r,n;function o(a){const c=[];for(const l in a){const u=a[l];delete u.metadata,c.push(u)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const r=t.children[n];this.add(r.clone())}return this}}ge.DEFAULT_UP=new V(0,1,0);ge.DEFAULT_MATRIX_AUTO_UPDATE=!0;ge.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const _e=new V,nn=new V,Fr=new V,rn=new V,Qn=new V,Kn=new V,jo=new V,_r=new V,Wr=new V,Br=new V,kr=new ce,Hr=new ce,Xr=new ce;class We{constructor(t=new V,e=new V,n=new V){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,r){r.subVectors(n,e),_e.subVectors(t,e),r.cross(_e);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(t,e,n,r,s){_e.subVectors(r,e),nn.subVectors(n,e),Fr.subVectors(t,e);const o=_e.dot(_e),a=_e.dot(nn),c=_e.dot(Fr),l=nn.dot(nn),u=nn.dot(Fr),h=o*l-a*a;if(h===0)return s.set(0,0,0),null;const d=1/h,p=(l*c-a*u)*d,g=(o*u-a*c)*d;return s.set(1-p-g,g,p)}static containsPoint(t,e,n,r){return this.getBarycoord(t,e,n,r,rn)===null?!1:rn.x>=0&&rn.y>=0&&rn.x+rn.y<=1}static getInterpolation(t,e,n,r,s,o,a,c){return this.getBarycoord(t,e,n,r,rn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,rn.x),c.addScaledVector(o,rn.y),c.addScaledVector(a,rn.z),c)}static getInterpolatedAttribute(t,e,n,r,s,o){return kr.setScalar(0),Hr.setScalar(0),Xr.setScalar(0),kr.fromBufferAttribute(t,e),Hr.fromBufferAttribute(t,n),Xr.fromBufferAttribute(t,r),o.setScalar(0),o.addScaledVector(kr,s.x),o.addScaledVector(Hr,s.y),o.addScaledVector(Xr,s.z),o}static isFrontFacing(t,e,n,r){return _e.subVectors(n,e),nn.subVectors(t,e),_e.cross(nn).dot(r)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,r){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[r]),this}setFromAttributeAndIndices(t,e,n,r){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,r),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return _e.subVectors(this.c,this.b),nn.subVectors(this.a,this.b),_e.cross(nn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return We.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return We.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,r,s){return We.getInterpolation(t,this.a,this.b,this.c,e,n,r,s)}containsPoint(t){return We.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return We.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,r=this.b,s=this.c;let o,a;Qn.subVectors(r,n),Kn.subVectors(s,n),_r.subVectors(t,n);const c=Qn.dot(_r),l=Kn.dot(_r);if(c<=0&&l<=0)return e.copy(n);Wr.subVectors(t,r);const u=Qn.dot(Wr),h=Kn.dot(Wr);if(u>=0&&h<=u)return e.copy(r);const d=c*h-u*l;if(d<=0&&c>=0&&u<=0)return o=c/(c-u),e.copy(n).addScaledVector(Qn,o);Br.subVectors(t,s);const p=Qn.dot(Br),g=Kn.dot(Br);if(g>=0&&p<=g)return e.copy(s);const x=p*l-c*g;if(x<=0&&l>=0&&g<=0)return a=l/(l-g),e.copy(n).addScaledVector(Kn,a);const m=u*g-p*h;if(m<=0&&h-u>=0&&p-g>=0)return jo.subVectors(s,r),a=(h-u)/(h-u+(p-g)),e.copy(r).addScaledVector(jo,a);const f=1/(m+x+d);return o=x*f,a=d*f,e.copy(n).addScaledVector(Qn,o).addScaledVector(Kn,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const il={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},mn={h:0,s:0,l:0},ji={h:0,s:0,l:0};function Gr(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class kt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const r=t;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=De){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Gt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,r=Gt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Gt.colorSpaceToWorking(this,r),this}setHSL(t,e,n,r=Gt.workingColorSpace){if(t=uo(t,1),e=Wt(e,0,1),n=Wt(n,0,1),e===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+e):n+e-n*e,o=2*n-s;this.r=Gr(o,s,t+1/3),this.g=Gr(o,s,t),this.b=Gr(o,s,t-1/3)}return Gt.colorSpaceToWorking(this,r),this}setStyle(t,e=De){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const o=r[1],a=r[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(s,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=De){const n=il[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=ln(t.r),this.g=ln(t.g),this.b=ln(t.b),this}copyLinearToSRGB(t){return this.r=ri(t.r),this.g=ri(t.g),this.b=ri(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=De){return Gt.workingToColorSpace(Me.copy(this),t),Math.round(Wt(Me.r*255,0,255))*65536+Math.round(Wt(Me.g*255,0,255))*256+Math.round(Wt(Me.b*255,0,255))}getHexString(t=De){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Gt.workingColorSpace){Gt.workingToColorSpace(Me.copy(this),e);const n=Me.r,r=Me.g,s=Me.b,o=Math.max(n,r,s),a=Math.min(n,r,s);let c,l;const u=(a+o)/2;if(a===o)c=0,l=0;else{const h=o-a;switch(l=u<=.5?h/(o+a):h/(2-o-a),o){case n:c=(r-s)/h+(r<s?6:0);break;case r:c=(s-n)/h+2;break;case s:c=(n-r)/h+4;break}c/=6}return t.h=c,t.s=l,t.l=u,t}getRGB(t,e=Gt.workingColorSpace){return Gt.workingToColorSpace(Me.copy(this),e),t.r=Me.r,t.g=Me.g,t.b=Me.b,t}getStyle(t=De){Gt.workingToColorSpace(Me.copy(this),t);const e=Me.r,n=Me.g,r=Me.b;return t!==De?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(t,e,n){return this.getHSL(mn),this.setHSL(mn.h+t,mn.s+e,mn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(mn),t.getHSL(ji);const n=Si(mn.h,ji.h,e),r=Si(mn.s,ji.s,e),s=Si(mn.l,ji.l,e);return this.setHSL(n,r,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,r=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*r,this.g=s[1]*e+s[4]*n+s[7]*r,this.b=s[2]*e+s[5]*n+s[8]*r,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Me=new kt;kt.NAMES=il;let jc=0;class Li extends fi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:jc++}),this.uuid=hi(),this.name="",this.type="Material",this.blending=ii,this.side=je,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=cs,this.blendDst=us,this.blendEquation=qn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new kt(0,0,0),this.blendAlpha=0,this.depthFunc=si,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Do,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Fn,this.stencilZFail=Fn,this.stencilZPass=Fn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==ii&&(n.blending=this.blending),this.side!==je&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==cs&&(n.blendSrc=this.blendSrc),this.blendDst!==us&&(n.blendDst=this.blendDst),this.blendEquation!==qn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==si&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Do&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Fn&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Fn&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Fn&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(s){const o=[];for(const a in s){const c=s[a];delete c.metadata,o.push(c)}return o}if(e){const s=r(t.textures),o=r(t.images);s.length>0&&(n.textures=s),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const r=e.length;n=new Array(r);for(let s=0;s!==r;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}class Vi extends Li{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new kt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Je,this.combine=Wa,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const ue=new V,Zi=new dt;let Zc=0;class Ke{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Zc++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Lo,this.updateRanges=[],this.gpuType=an,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[t+r]=e.array[n+r];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Zi.fromBufferAttribute(this,e),Zi.applyMatrix3(t),this.setXY(e,Zi.x,Zi.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)ue.fromBufferAttribute(this,e),ue.applyMatrix3(t),this.setXYZ(e,ue.x,ue.y,ue.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)ue.fromBufferAttribute(this,e),ue.applyMatrix4(t),this.setXYZ(e,ue.x,ue.y,ue.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)ue.fromBufferAttribute(this,e),ue.applyNormalMatrix(t),this.setXYZ(e,ue.x,ue.y,ue.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)ue.fromBufferAttribute(this,e),ue.transformDirection(t),this.setXYZ(e,ue.x,ue.y,ue.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=ti(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Ee(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=ti(e,this.array)),e}setX(t,e){return this.normalized&&(e=Ee(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=ti(e,this.array)),e}setY(t,e){return this.normalized&&(e=Ee(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=ti(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Ee(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=ti(e,this.array)),e}setW(t,e){return this.normalized&&(e=Ee(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Ee(e,this.array),n=Ee(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,r){return t*=this.itemSize,this.normalized&&(e=Ee(e,this.array),n=Ee(n,this.array),r=Ee(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=r,this}setXYZW(t,e,n,r,s){return t*=this.itemSize,this.normalized&&(e=Ee(e,this.array),n=Ee(n,this.array),r=Ee(r,this.array),s=Ee(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=r,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Lo&&(t.usage=this.usage),t}}class rl extends Ke{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class sl extends Ke{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class fe extends Ke{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Jc=0;const we=new se,Qr=new ge,jn=new V,Ce=new Di,Mi=new Di,me=new V;class Ne extends fi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Jc++}),this.uuid=hi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(tl(t)?sl:rl)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Ft().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(t),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return we.makeRotationFromQuaternion(t),this.applyMatrix4(we),this}rotateX(t){return we.makeRotationX(t),this.applyMatrix4(we),this}rotateY(t){return we.makeRotationY(t),this.applyMatrix4(we),this}rotateZ(t){return we.makeRotationZ(t),this.applyMatrix4(we),this}translate(t,e,n){return we.makeTranslation(t,e,n),this.applyMatrix4(we),this}scale(t,e,n){return we.makeScale(t,e,n),this.applyMatrix4(we),this}lookAt(t){return Qr.lookAt(t),Qr.updateMatrix(),this.applyMatrix4(Qr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(jn).negate(),this.translate(jn.x,jn.y,jn.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let r=0,s=t.length;r<s;r++){const o=t[r];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new fe(n,3))}else{const n=Math.min(t.length,e.count);for(let r=0;r<n;r++){const s=t[r];e.setXYZ(r,s.x,s.y,s.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Di);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new V(-1/0,-1/0,-1/0),new V(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,r=e.length;n<r;n++){const s=e[n];Ce.setFromBufferAttribute(s),this.morphTargetsRelative?(me.addVectors(this.boundingBox.min,Ce.min),this.boundingBox.expandByPoint(me),me.addVectors(this.boundingBox.max,Ce.max),this.boundingBox.expandByPoint(me)):(this.boundingBox.expandByPoint(Ce.min),this.boundingBox.expandByPoint(Ce.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ho);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new V,1/0);return}if(t){const n=this.boundingSphere.center;if(Ce.setFromBufferAttribute(t),e)for(let s=0,o=e.length;s<o;s++){const a=e[s];Mi.setFromBufferAttribute(a),this.morphTargetsRelative?(me.addVectors(Ce.min,Mi.min),Ce.expandByPoint(me),me.addVectors(Ce.max,Mi.max),Ce.expandByPoint(me)):(Ce.expandByPoint(Mi.min),Ce.expandByPoint(Mi.max))}Ce.getCenter(n);let r=0;for(let s=0,o=t.count;s<o;s++)me.fromBufferAttribute(t,s),r=Math.max(r,n.distanceToSquared(me));if(e)for(let s=0,o=e.length;s<o;s++){const a=e[s],c=this.morphTargetsRelative;for(let l=0,u=a.count;l<u;l++)me.fromBufferAttribute(a,l),c&&(jn.fromBufferAttribute(t,l),me.add(jn)),r=Math.max(r,n.distanceToSquared(me))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,r=e.normal,s=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Ke(new Float32Array(4*n.count),4));const o=this.getAttribute("tangent"),a=[],c=[];for(let w=0;w<n.count;w++)a[w]=new V,c[w]=new V;const l=new V,u=new V,h=new V,d=new dt,p=new dt,g=new dt,x=new V,m=new V;function f(w,E,S){l.fromBufferAttribute(n,w),u.fromBufferAttribute(n,E),h.fromBufferAttribute(n,S),d.fromBufferAttribute(s,w),p.fromBufferAttribute(s,E),g.fromBufferAttribute(s,S),u.sub(l),h.sub(l),p.sub(d),g.sub(d);const N=1/(p.x*g.y-g.x*p.y);isFinite(N)&&(x.copy(u).multiplyScalar(g.y).addScaledVector(h,-p.y).multiplyScalar(N),m.copy(h).multiplyScalar(p.x).addScaledVector(u,-g.x).multiplyScalar(N),a[w].add(x),a[E].add(x),a[S].add(x),c[w].add(m),c[E].add(m),c[S].add(m))}let b=this.groups;b.length===0&&(b=[{start:0,count:t.count}]);for(let w=0,E=b.length;w<E;++w){const S=b[w],N=S.start,z=S.count;for(let _=N,j=N+z;_<j;_+=3)f(t.getX(_+0),t.getX(_+1),t.getX(_+2))}const A=new V,T=new V,P=new V,U=new V;function C(w){P.fromBufferAttribute(r,w),U.copy(P);const E=a[w];A.copy(E),A.sub(P.multiplyScalar(P.dot(E))).normalize(),T.crossVectors(U,E);const N=T.dot(c[w])<0?-1:1;o.setXYZW(w,A.x,A.y,A.z,N)}for(let w=0,E=b.length;w<E;++w){const S=b[w],N=S.start,z=S.count;for(let _=N,j=N+z;_<j;_+=3)C(t.getX(_+0)),C(t.getX(_+1)),C(t.getX(_+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Ke(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let d=0,p=n.count;d<p;d++)n.setXYZ(d,0,0,0);const r=new V,s=new V,o=new V,a=new V,c=new V,l=new V,u=new V,h=new V;if(t)for(let d=0,p=t.count;d<p;d+=3){const g=t.getX(d+0),x=t.getX(d+1),m=t.getX(d+2);r.fromBufferAttribute(e,g),s.fromBufferAttribute(e,x),o.fromBufferAttribute(e,m),u.subVectors(o,s),h.subVectors(r,s),u.cross(h),a.fromBufferAttribute(n,g),c.fromBufferAttribute(n,x),l.fromBufferAttribute(n,m),a.add(u),c.add(u),l.add(u),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(x,c.x,c.y,c.z),n.setXYZ(m,l.x,l.y,l.z)}else for(let d=0,p=e.count;d<p;d+=3)r.fromBufferAttribute(e,d+0),s.fromBufferAttribute(e,d+1),o.fromBufferAttribute(e,d+2),u.subVectors(o,s),h.subVectors(r,s),u.cross(h),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)me.fromBufferAttribute(t,e),me.normalize(),t.setXYZ(e,me.x,me.y,me.z)}toNonIndexed(){function t(a,c){const l=a.array,u=a.itemSize,h=a.normalized,d=new l.constructor(c.length*u);let p=0,g=0;for(let x=0,m=c.length;x<m;x++){a.isInterleavedBufferAttribute?p=c[x]*a.data.stride+a.offset:p=c[x]*u;for(let f=0;f<u;f++)d[g++]=l[p++]}return new Ke(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new Ne,n=this.index.array,r=this.attributes;for(const a in r){const c=r[a],l=t(c,n);e.setAttribute(a,l)}const s=this.morphAttributes;for(const a in s){const c=[],l=s[a];for(let u=0,h=l.length;u<h;u++){const d=l[u],p=t(d,n);c.push(p)}e.morphAttributes[a]=c}e.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,c=o.length;a<c;a++){const l=o[a];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const c in n){const l=n[c];t.data.attributes[c]=l.toJSON(t.data)}const r={};let s=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],u=[];for(let h=0,d=l.length;h<d;h++){const p=l[h];u.push(p.toJSON(t.data))}u.length>0&&(r[c]=u,s=!0)}s&&(t.data.morphAttributes=r,t.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(t.data.boundingSphere=a.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone());const r=t.attributes;for(const l in r){const u=r[l];this.setAttribute(l,u.clone(e))}const s=t.morphAttributes;for(const l in s){const u=[],h=s[l];for(let d=0,p=h.length;d<p;d++)u.push(h[d].clone(e));this.morphAttributes[l]=u}this.morphTargetsRelative=t.morphTargetsRelative;const o=t.groups;for(let l=0,u=o.length;l<u;l++){const h=o[l];this.addGroup(h.start,h.count,h.materialIndex)}const a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Zo=new se,bn=new nl,Ji=new ho,Jo=new V,Yi=new V,$i=new V,tr=new V,Kr=new V,er=new V,Yo=new V,nr=new V;class ve extends ge{constructor(t=new Ne,e=new Vi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const r=e[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(t,e){const n=this.geometry,r=n.attributes.position,s=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(r,t);const a=this.morphTargetInfluences;if(s&&a){er.set(0,0,0);for(let c=0,l=s.length;c<l;c++){const u=a[c],h=s[c];u!==0&&(Kr.fromBufferAttribute(h,t),o?er.addScaledVector(Kr,u):er.addScaledVector(Kr.sub(e),u))}e.add(er)}return e}raycast(t,e){const n=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ji.copy(n.boundingSphere),Ji.applyMatrix4(s),bn.copy(t.ray).recast(t.near),!(Ji.containsPoint(bn.origin)===!1&&(bn.intersectSphere(Ji,Jo)===null||bn.origin.distanceToSquared(Jo)>(t.far-t.near)**2))&&(Zo.copy(s).invert(),bn.copy(t.ray).applyMatrix4(Zo),!(n.boundingBox!==null&&bn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,bn)))}_computeIntersections(t,e,n){let r;const s=this.geometry,o=this.material,a=s.index,c=s.attributes.position,l=s.attributes.uv,u=s.attributes.uv1,h=s.attributes.normal,d=s.groups,p=s.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,x=d.length;g<x;g++){const m=d[g],f=o[m.materialIndex],b=Math.max(m.start,p.start),A=Math.min(a.count,Math.min(m.start+m.count,p.start+p.count));for(let T=b,P=A;T<P;T+=3){const U=a.getX(T),C=a.getX(T+1),w=a.getX(T+2);r=ir(this,f,t,n,l,u,h,U,C,w),r&&(r.faceIndex=Math.floor(T/3),r.face.materialIndex=m.materialIndex,e.push(r))}}else{const g=Math.max(0,p.start),x=Math.min(a.count,p.start+p.count);for(let m=g,f=x;m<f;m+=3){const b=a.getX(m),A=a.getX(m+1),T=a.getX(m+2);r=ir(this,o,t,n,l,u,h,b,A,T),r&&(r.faceIndex=Math.floor(m/3),e.push(r))}}else if(c!==void 0)if(Array.isArray(o))for(let g=0,x=d.length;g<x;g++){const m=d[g],f=o[m.materialIndex],b=Math.max(m.start,p.start),A=Math.min(c.count,Math.min(m.start+m.count,p.start+p.count));for(let T=b,P=A;T<P;T+=3){const U=T,C=T+1,w=T+2;r=ir(this,f,t,n,l,u,h,U,C,w),r&&(r.faceIndex=Math.floor(T/3),r.face.materialIndex=m.materialIndex,e.push(r))}}else{const g=Math.max(0,p.start),x=Math.min(c.count,p.start+p.count);for(let m=g,f=x;m<f;m+=3){const b=m,A=m+1,T=m+2;r=ir(this,o,t,n,l,u,h,b,A,T),r&&(r.faceIndex=Math.floor(m/3),e.push(r))}}}}function Yc(i,t,e,n,r,s,o,a){let c;if(t.side===Ae?c=n.intersectTriangle(o,s,r,!0,a):c=n.intersectTriangle(r,s,o,t.side===je,a),c===null)return null;nr.copy(a),nr.applyMatrix4(i.matrixWorld);const l=e.ray.origin.distanceTo(nr);return l<e.near||l>e.far?null:{distance:l,point:nr.clone(),object:i}}function ir(i,t,e,n,r,s,o,a,c,l){i.getVertexPosition(a,Yi),i.getVertexPosition(c,$i),i.getVertexPosition(l,tr);const u=Yc(i,t,e,n,Yi,$i,tr,Yo);if(u){const h=new V;We.getBarycoord(Yo,Yi,$i,tr,h),r&&(u.uv=We.getInterpolatedAttribute(r,a,c,l,h,new dt)),s&&(u.uv1=We.getInterpolatedAttribute(s,a,c,l,h,new dt)),o&&(u.normal=We.getInterpolatedAttribute(o,a,c,l,h,new V),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const d={a,b:c,c:l,normal:new V,materialIndex:0};We.getNormal(Yi,$i,tr,d.normal),u.face=d,u.barycoord=h}return u}class Oi extends Ne{constructor(t=1,e=1,n=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:r,heightSegments:s,depthSegments:o};const a=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);const c=[],l=[],u=[],h=[];let d=0,p=0;g("z","y","x",-1,-1,n,e,t,o,s,0),g("z","y","x",1,-1,n,e,-t,o,s,1),g("x","z","y",1,1,t,n,e,r,o,2),g("x","z","y",1,-1,t,n,-e,r,o,3),g("x","y","z",1,-1,t,e,n,r,s,4),g("x","y","z",-1,-1,t,e,-n,r,s,5),this.setIndex(c),this.setAttribute("position",new fe(l,3)),this.setAttribute("normal",new fe(u,3)),this.setAttribute("uv",new fe(h,2));function g(x,m,f,b,A,T,P,U,C,w,E){const S=T/C,N=P/w,z=T/2,_=P/2,j=U/2,k=C+1,Q=w+1;let Y=0,W=0;const st=new V;for(let ht=0;ht<Q;ht++){const G=ht*N-_;for(let rt=0;rt<k;rt++){const pt=rt*S-z;st[x]=pt*b,st[m]=G*A,st[f]=j,l.push(st.x,st.y,st.z),st[x]=0,st[m]=0,st[f]=U>0?1:-1,u.push(st.x,st.y,st.z),h.push(rt/C),h.push(1-ht/w),Y+=1}}for(let ht=0;ht<w;ht++)for(let G=0;G<C;G++){const rt=d+G+k*ht,pt=d+G+k*(ht+1),Vt=d+(G+1)+k*(ht+1),Rt=d+(G+1)+k*ht;c.push(rt,pt,Rt),c.push(pt,Vt,Rt),W+=6}a.addGroup(p,W,E),p+=W,d+=Y}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Oi(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function ci(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const r=i[e][n];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=r.clone():Array.isArray(r)?t[e][n]=r.slice():t[e][n]=r}}return t}function Se(i){const t={};for(let e=0;e<i.length;e++){const n=ci(i[e]);for(const r in n)t[r]=n[r]}return t}function $c(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function ol(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Gt.workingColorSpace}const tu={clone:ci,merge:Se};var eu=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,nu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class cn extends Li{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=eu,this.fragmentShader=nu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ci(t.uniforms),this.uniformsGroups=$c(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const r in this.uniforms){const o=this.uniforms[r].value;o&&o.isTexture?e.uniforms[r]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[r]={type:"m4",value:o.toArray()}:e.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class al extends ge{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new se,this.projectionMatrix=new se,this.projectionMatrixInverse=new se,this.coordinateSystem=Qe,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const vn=new V,$o=new dt,ta=new dt;class Le extends al{constructor(t=50,e=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Ni*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Ei*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Ni*2*Math.atan(Math.tan(Ei*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){vn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(vn.x,vn.y).multiplyScalar(-t/vn.z),vn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(vn.x,vn.y).multiplyScalar(-t/vn.z)}getViewSize(t,e){return this.getViewBounds(t,$o,ta),e.subVectors(ta,$o)}setViewOffset(t,e,n,r,s,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Ei*.5*this.fov)/this.zoom,n=2*e,r=this.aspect*n,s=-.5*r;const o=this.view;if(this.view!==null&&this.view.enabled){const c=o.fullWidth,l=o.fullHeight;s+=o.offsetX*r/c,e-=o.offsetY*n/l,r*=o.width/c,n*=o.height/l}const a=this.filmOffset;a!==0&&(s+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const Zn=-90,Jn=1;class iu extends ge{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Le(Zn,Jn,t,e);r.layers=this.layers,this.add(r);const s=new Le(Zn,Jn,t,e);s.layers=this.layers,this.add(s);const o=new Le(Zn,Jn,t,e);o.layers=this.layers,this.add(o);const a=new Le(Zn,Jn,t,e);a.layers=this.layers,this.add(a);const c=new Le(Zn,Jn,t,e);c.layers=this.layers,this.add(c);const l=new Le(Zn,Jn,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,r,s,o,a,c]=e;for(const l of e)this.remove(l);if(t===Qe)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===vr)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,o,a,c,l,u]=this.children,h=t.getRenderTarget(),d=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,r),t.render(e,s),t.setRenderTarget(n,1,r),t.render(e,o),t.setRenderTarget(n,2,r),t.render(e,a),t.setRenderTarget(n,3,r),t.render(e,c),t.setRenderTarget(n,4,r),t.render(e,l),n.texture.generateMipmaps=x,t.setRenderTarget(n,5,r),t.render(e,u),t.setRenderTarget(h,d,p),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class ll extends be{constructor(t=[],e=oi,n,r,s,o,a,c,l,u){super(t,e,n,r,s,o,a,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class ru extends zn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},r=[n,n,n,n,n,n];this.texture=new ll(r),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Oi(5,5,5),s=new cn({name:"CubemapFromEquirect",uniforms:ci(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ae,blending:Mn});s.uniforms.tEquirect.value=e;const o=new ve(r,s),a=e.minFilter;return e.minFilter===Dn&&(e.minFilter=Ge),new iu(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e=!0,n=!0,r=!0){const s=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,r);t.setRenderTarget(s)}}class Ln extends ge{constructor(){super(),this.isGroup=!0,this.type="Group"}}const su={type:"move"};class jr{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ln,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ln,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new V,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new V),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ln,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new V,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new V),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let r=null,s=null,o=null;const a=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){o=!0;for(const x of t.hand.values()){const m=e.getJointPose(x,n),f=this._getHandJoint(l,x);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}const u=l.joints["index-finger-tip"],h=l.joints["thumb-tip"],d=u.position.distanceTo(h.position),p=.02,g=.005;l.inputState.pinching&&d>p+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&d<=p-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,n),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(r=e.getPose(t.targetRaySpace,n),r===null&&s!==null&&(r=s),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(su)))}return a!==null&&(a.visible=r!==null),c!==null&&(c.visible=s!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new Ln;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}class cl extends ge{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Je,this.environmentIntensity=1,this.environmentRotation=new Je,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}const Zr=new V,ou=new V,au=new Ft;class Cn{constructor(t=new V(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,r){return this.normal.set(t,e,n),this.constant=r,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const r=Zr.subVectors(n,e).cross(ou.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(r,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(Zr),r=this.normal.dot(n);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const s=-(t.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:e.copy(t.start).addScaledVector(n,s)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||au.getNormalMatrix(t),r=this.coplanarPoint(Zr).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Rn=new ho,lu=new dt(.5,.5),rr=new V;class mo{constructor(t=new Cn,e=new Cn,n=new Cn,r=new Cn,s=new Cn,o=new Cn){this.planes=[t,e,n,r,s,o]}set(t,e,n,r,s,o){const a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(r),a[4].copy(s),a[5].copy(o),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Qe,n=!1){const r=this.planes,s=t.elements,o=s[0],a=s[1],c=s[2],l=s[3],u=s[4],h=s[5],d=s[6],p=s[7],g=s[8],x=s[9],m=s[10],f=s[11],b=s[12],A=s[13],T=s[14],P=s[15];if(r[0].setComponents(l-o,p-u,f-g,P-b).normalize(),r[1].setComponents(l+o,p+u,f+g,P+b).normalize(),r[2].setComponents(l+a,p+h,f+x,P+A).normalize(),r[3].setComponents(l-a,p-h,f-x,P-A).normalize(),n)r[4].setComponents(c,d,m,T).normalize(),r[5].setComponents(l-c,p-d,f-m,P-T).normalize();else if(r[4].setComponents(l-c,p-d,f-m,P-T).normalize(),e===Qe)r[5].setComponents(l+c,p+d,f+m,P+T).normalize();else if(e===vr)r[5].setComponents(c,d,m,T).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Rn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Rn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Rn)}intersectsSprite(t){Rn.center.set(0,0,0);const e=lu.distanceTo(t.center);return Rn.radius=.7071067811865476+e,Rn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Rn)}intersectsSphere(t){const e=this.planes,n=t.center,r=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(n)<r)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const r=e[n];if(rr.x=r.normal.x>0?t.max.x:t.min.x,rr.y=r.normal.y>0?t.max.y:t.min.y,rr.z=r.normal.z>0?t.max.z:t.min.z,r.distanceToPoint(rr)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class ul extends be{constructor(t,e,n=On,r,s,o,a=ke,c=ke,l,u=Pi,h=1){if(u!==Pi&&u!==Ci)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:t,height:e,depth:h};super(d,r,s,o,a,c,u,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new fo(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}class fl extends be{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class vo extends Ne{constructor(t=1,e=1,n=1,r=32,s=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:r,heightSegments:s,openEnded:o,thetaStart:a,thetaLength:c};const l=this;r=Math.floor(r),s=Math.floor(s);const u=[],h=[],d=[],p=[];let g=0;const x=[],m=n/2;let f=0;b(),o===!1&&(t>0&&A(!0),e>0&&A(!1)),this.setIndex(u),this.setAttribute("position",new fe(h,3)),this.setAttribute("normal",new fe(d,3)),this.setAttribute("uv",new fe(p,2));function b(){const T=new V,P=new V;let U=0;const C=(e-t)/n;for(let w=0;w<=s;w++){const E=[],S=w/s,N=S*(e-t)+t;for(let z=0;z<=r;z++){const _=z/r,j=_*c+a,k=Math.sin(j),Q=Math.cos(j);P.x=N*k,P.y=-S*n+m,P.z=N*Q,h.push(P.x,P.y,P.z),T.set(k,C,Q).normalize(),d.push(T.x,T.y,T.z),p.push(_,1-S),E.push(g++)}x.push(E)}for(let w=0;w<r;w++)for(let E=0;E<s;E++){const S=x[E][w],N=x[E+1][w],z=x[E+1][w+1],_=x[E][w+1];(t>0||E!==0)&&(u.push(S,N,_),U+=3),(e>0||E!==s-1)&&(u.push(N,z,_),U+=3)}l.addGroup(f,U,0),f+=U}function A(T){const P=g,U=new dt,C=new V;let w=0;const E=T===!0?t:e,S=T===!0?1:-1;for(let z=1;z<=r;z++)h.push(0,m*S,0),d.push(0,S,0),p.push(.5,.5),g++;const N=g;for(let z=0;z<=r;z++){const j=z/r*c+a,k=Math.cos(j),Q=Math.sin(j);C.x=E*Q,C.y=m*S,C.z=E*k,h.push(C.x,C.y,C.z),d.push(0,S,0),U.x=k*.5+.5,U.y=Q*.5*S+.5,p.push(U.x,U.y),g++}for(let z=0;z<r;z++){const _=P+z,j=N+z;T===!0?u.push(j,j+1,_):u.push(j+1,j,_),w+=3}l.addGroup(f,w,T===!0?1:2),f+=w}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new vo(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class un{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){console.warn("THREE.Curve: .getPoint() not implemented.")}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,r=this.getPoint(0),s=0;e.push(0);for(let o=1;o<=t;o++)n=this.getPoint(o/t),s+=n.distanceTo(r),e.push(s),r=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e=null){const n=this.getLengths();let r=0;const s=n.length;let o;e?o=e:o=t*n[s-1];let a=0,c=s-1,l;for(;a<=c;)if(r=Math.floor(a+(c-a)/2),l=n[r]-o,l<0)a=r+1;else if(l>0)c=r-1;else{c=r;break}if(r=c,n[r]===o)return r/(s-1);const u=n[r],d=n[r+1]-u,p=(o-u)/d;return(r+p)/(s-1)}getTangent(t,e){let r=t-1e-4,s=t+1e-4;r<0&&(r=0),s>1&&(s=1);const o=this.getPoint(r),a=this.getPoint(s),c=e||(o.isVector2?new dt:new V);return c.copy(a).sub(o).normalize(),c}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e=!1){const n=new V,r=[],s=[],o=[],a=new V,c=new se;for(let p=0;p<=t;p++){const g=p/t;r[p]=this.getTangentAt(g,new V)}s[0]=new V,o[0]=new V;let l=Number.MAX_VALUE;const u=Math.abs(r[0].x),h=Math.abs(r[0].y),d=Math.abs(r[0].z);u<=l&&(l=u,n.set(1,0,0)),h<=l&&(l=h,n.set(0,1,0)),d<=l&&n.set(0,0,1),a.crossVectors(r[0],n).normalize(),s[0].crossVectors(r[0],a),o[0].crossVectors(r[0],s[0]);for(let p=1;p<=t;p++){if(s[p]=s[p-1].clone(),o[p]=o[p-1].clone(),a.crossVectors(r[p-1],r[p]),a.length()>Number.EPSILON){a.normalize();const g=Math.acos(Wt(r[p-1].dot(r[p]),-1,1));s[p].applyMatrix4(c.makeRotationAxis(a,g))}o[p].crossVectors(r[p],s[p])}if(e===!0){let p=Math.acos(Wt(s[0].dot(s[t]),-1,1));p/=t,r[0].dot(a.crossVectors(s[0],s[t]))>0&&(p=-p);for(let g=1;g<=t;g++)s[g].applyMatrix4(c.makeRotationAxis(r[g],p*g)),o[g].crossVectors(r[g],s[g])}return{tangents:r,normals:s,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class hl extends un{constructor(t=0,e=0,n=1,r=1,s=0,o=Math.PI*2,a=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=r,this.aStartAngle=s,this.aEndAngle=o,this.aClockwise=a,this.aRotation=c}getPoint(t,e=new dt){const n=e,r=Math.PI*2;let s=this.aEndAngle-this.aStartAngle;const o=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=r;for(;s>r;)s-=r;s<Number.EPSILON&&(o?s=0:s=r),this.aClockwise===!0&&!o&&(s===r?s=-r:s=s-r);const a=this.aStartAngle+t*s;let c=this.aX+this.xRadius*Math.cos(a),l=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){const u=Math.cos(this.aRotation),h=Math.sin(this.aRotation),d=c-this.aX,p=l-this.aY;c=d*u-p*h+this.aX,l=d*h+p*u+this.aY}return n.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class cu extends hl{constructor(t,e,n,r,s,o){super(t,e,n,n,r,s,o),this.isArcCurve=!0,this.type="ArcCurve"}}function go(){let i=0,t=0,e=0,n=0;function r(s,o,a,c){i=s,t=a,e=-3*s+3*o-2*a-c,n=2*s-2*o+a+c}return{initCatmullRom:function(s,o,a,c,l){r(o,a,l*(a-s),l*(c-o))},initNonuniformCatmullRom:function(s,o,a,c,l,u,h){let d=(o-s)/l-(a-s)/(l+u)+(a-o)/u,p=(a-o)/u-(c-o)/(u+h)+(c-a)/h;d*=u,p*=u,r(o,a,d,p)},calc:function(s){const o=s*s,a=o*s;return i+t*s+e*o+n*a}}}const sr=new V,Jr=new go,Yr=new go,$r=new go;class uu extends un{constructor(t=[],e=!1,n="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=r}getPoint(t,e=new V){const n=e,r=this.points,s=r.length,o=(s-(this.closed?0:1))*t;let a=Math.floor(o),c=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/s)+1)*s:c===0&&a===s-1&&(a=s-2,c=1);let l,u;this.closed||a>0?l=r[(a-1)%s]:(sr.subVectors(r[0],r[1]).add(r[0]),l=sr);const h=r[a%s],d=r[(a+1)%s];if(this.closed||a+2<s?u=r[(a+2)%s]:(sr.subVectors(r[s-1],r[s-2]).add(r[s-1]),u=sr),this.curveType==="centripetal"||this.curveType==="chordal"){const p=this.curveType==="chordal"?.5:.25;let g=Math.pow(l.distanceToSquared(h),p),x=Math.pow(h.distanceToSquared(d),p),m=Math.pow(d.distanceToSquared(u),p);x<1e-4&&(x=1),g<1e-4&&(g=x),m<1e-4&&(m=x),Jr.initNonuniformCatmullRom(l.x,h.x,d.x,u.x,g,x,m),Yr.initNonuniformCatmullRom(l.y,h.y,d.y,u.y,g,x,m),$r.initNonuniformCatmullRom(l.z,h.z,d.z,u.z,g,x,m)}else this.curveType==="catmullrom"&&(Jr.initCatmullRom(l.x,h.x,d.x,u.x,this.tension),Yr.initCatmullRom(l.y,h.y,d.y,u.y,this.tension),$r.initCatmullRom(l.z,h.z,d.z,u.z,this.tension));return n.set(Jr.calc(c),Yr.calc(c),$r.calc(c)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const r=t.points[e];this.points.push(r.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const r=this.points[e];t.points.push(r.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const r=t.points[e];this.points.push(new V().fromArray(r))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function ea(i,t,e,n,r){const s=(n-t)*.5,o=(r-e)*.5,a=i*i,c=i*a;return(2*e-2*n+s+o)*c+(-3*e+3*n-2*s-o)*a+s*i+e}function fu(i,t){const e=1-i;return e*e*t}function hu(i,t){return 2*(1-i)*i*t}function du(i,t){return i*i*t}function yi(i,t,e,n){return fu(i,t)+hu(i,e)+du(i,n)}function pu(i,t){const e=1-i;return e*e*e*t}function mu(i,t){const e=1-i;return 3*e*e*i*t}function vu(i,t){return 3*(1-i)*i*i*t}function gu(i,t){return i*i*i*t}function Ai(i,t,e,n,r){return pu(i,t)+mu(i,e)+vu(i,n)+gu(i,r)}class dl extends un{constructor(t=new dt,e=new dt,n=new dt,r=new dt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=r}getPoint(t,e=new dt){const n=e,r=this.v0,s=this.v1,o=this.v2,a=this.v3;return n.set(Ai(t,r.x,s.x,o.x,a.x),Ai(t,r.y,s.y,o.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class pl extends un{constructor(t=new V,e=new V,n=new V,r=new V){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=r}getPoint(t,e=new V){const n=e,r=this.v0,s=this.v1,o=this.v2,a=this.v3;return n.set(Ai(t,r.x,s.x,o.x,a.x),Ai(t,r.y,s.y,o.y,a.y),Ai(t,r.z,s.z,o.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class xu extends un{constructor(t=new dt,e=new dt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new dt){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new dt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Mu extends un{constructor(t=new V,e=new V){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new V){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new V){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Tu extends un{constructor(t=new dt,e=new dt,n=new dt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new dt){const n=e,r=this.v0,s=this.v1,o=this.v2;return n.set(yi(t,r.x,s.x,o.x),yi(t,r.y,s.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class ml extends un{constructor(t=new V,e=new V,n=new V){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new V){const n=e,r=this.v0,s=this.v1,o=this.v2;return n.set(yi(t,r.x,s.x,o.x),yi(t,r.y,s.y,o.y),yi(t,r.z,s.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Eu extends un{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new dt){const n=e,r=this.points,s=(r.length-1)*t,o=Math.floor(s),a=s-o,c=r[o===0?o:o-1],l=r[o],u=r[o>r.length-2?r.length-1:o+1],h=r[o>r.length-3?r.length-1:o+2];return n.set(ea(a,c.x,l.x,u.x,h.x),ea(a,c.y,l.y,u.y,h.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const r=t.points[e];this.points.push(r.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const r=this.points[e];t.points.push(r.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const r=t.points[e];this.points.push(new dt().fromArray(r))}return this}}var Su=Object.freeze({__proto__:null,ArcCurve:cu,CatmullRomCurve3:uu,CubicBezierCurve:dl,CubicBezierCurve3:pl,EllipseCurve:hl,LineCurve:xu,LineCurve3:Mu,QuadraticBezierCurve:Tu,QuadraticBezierCurve3:ml,SplineCurve:Eu});class zi extends Ne{constructor(t=[new dt(0,-.5),new dt(.5,0),new dt(0,.5)],e=12,n=0,r=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:r},e=Math.floor(e),r=Wt(r,0,Math.PI*2);const s=[],o=[],a=[],c=[],l=[],u=1/e,h=new V,d=new dt,p=new V,g=new V,x=new V;let m=0,f=0;for(let b=0;b<=t.length-1;b++)switch(b){case 0:m=t[b+1].x-t[b].x,f=t[b+1].y-t[b].y,p.x=f*1,p.y=-m,p.z=f*0,x.copy(p),p.normalize(),c.push(p.x,p.y,p.z);break;case t.length-1:c.push(x.x,x.y,x.z);break;default:m=t[b+1].x-t[b].x,f=t[b+1].y-t[b].y,p.x=f*1,p.y=-m,p.z=f*0,g.copy(p),p.x+=x.x,p.y+=x.y,p.z+=x.z,p.normalize(),c.push(p.x,p.y,p.z),x.copy(g)}for(let b=0;b<=e;b++){const A=n+b*u*r,T=Math.sin(A),P=Math.cos(A);for(let U=0;U<=t.length-1;U++){h.x=t[U].x*T,h.y=t[U].y,h.z=t[U].x*P,o.push(h.x,h.y,h.z),d.x=b/e,d.y=U/(t.length-1),a.push(d.x,d.y);const C=c[3*U+0]*T,w=c[3*U+1],E=c[3*U+0]*P;l.push(C,w,E)}}for(let b=0;b<e;b++)for(let A=0;A<t.length-1;A++){const T=A+b*t.length,P=T,U=T+t.length,C=T+t.length+1,w=T+1;s.push(P,U,w),s.push(C,w,U)}this.setIndex(s),this.setAttribute("position",new fe(o,3)),this.setAttribute("uv",new fe(a,2)),this.setAttribute("normal",new fe(l,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new zi(t.points,t.segments,t.phiStart,t.phiLength)}}class Ii extends Ne{constructor(t=1,e=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:r};const s=t/2,o=e/2,a=Math.floor(n),c=Math.floor(r),l=a+1,u=c+1,h=t/a,d=e/c,p=[],g=[],x=[],m=[];for(let f=0;f<u;f++){const b=f*d-o;for(let A=0;A<l;A++){const T=A*h-s;g.push(T,-b,0),x.push(0,0,1),m.push(A/a),m.push(1-f/c)}}for(let f=0;f<c;f++)for(let b=0;b<a;b++){const A=b+l*f,T=b+l*(f+1),P=b+1+l*(f+1),U=b+1+l*f;p.push(A,T,U),p.push(T,P,U)}this.setIndex(p),this.setAttribute("position",new fe(g,3)),this.setAttribute("normal",new fe(x,3)),this.setAttribute("uv",new fe(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ii(t.width,t.height,t.widthSegments,t.heightSegments)}}class xo extends Ne{constructor(t=1,e=.4,n=12,r=48,s=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:r,arc:s},n=Math.floor(n),r=Math.floor(r);const o=[],a=[],c=[],l=[],u=new V,h=new V,d=new V;for(let p=0;p<=n;p++)for(let g=0;g<=r;g++){const x=g/r*s,m=p/n*Math.PI*2;h.x=(t+e*Math.cos(m))*Math.cos(x),h.y=(t+e*Math.cos(m))*Math.sin(x),h.z=e*Math.sin(m),a.push(h.x,h.y,h.z),u.x=t*Math.cos(x),u.y=t*Math.sin(x),d.subVectors(h,u).normalize(),c.push(d.x,d.y,d.z),l.push(g/r),l.push(p/n)}for(let p=1;p<=n;p++)for(let g=1;g<=r;g++){const x=(r+1)*p+g-1,m=(r+1)*(p-1)+g-1,f=(r+1)*(p-1)+g,b=(r+1)*p+g;o.push(x,m,b),o.push(m,f,b)}this.setIndex(o),this.setAttribute("position",new fe(a,3)),this.setAttribute("normal",new fe(c,3)),this.setAttribute("uv",new fe(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new xo(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class Mo extends Ne{constructor(t=new ml(new V(-1,-1,0),new V(-1,1,0),new V(1,1,0)),e=64,n=1,r=8,s=!1){super(),this.type="TubeGeometry",this.parameters={path:t,tubularSegments:e,radius:n,radialSegments:r,closed:s};const o=t.computeFrenetFrames(e,s);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;const a=new V,c=new V,l=new dt;let u=new V;const h=[],d=[],p=[],g=[];x(),this.setIndex(g),this.setAttribute("position",new fe(h,3)),this.setAttribute("normal",new fe(d,3)),this.setAttribute("uv",new fe(p,2));function x(){for(let A=0;A<e;A++)m(A);m(s===!1?e:0),b(),f()}function m(A){u=t.getPointAt(A/e,u);const T=o.normals[A],P=o.binormals[A];for(let U=0;U<=r;U++){const C=U/r*Math.PI*2,w=Math.sin(C),E=-Math.cos(C);c.x=E*T.x+w*P.x,c.y=E*T.y+w*P.y,c.z=E*T.z+w*P.z,c.normalize(),d.push(c.x,c.y,c.z),a.x=u.x+n*c.x,a.y=u.y+n*c.y,a.z=u.z+n*c.z,h.push(a.x,a.y,a.z)}}function f(){for(let A=1;A<=e;A++)for(let T=1;T<=r;T++){const P=(r+1)*(A-1)+(T-1),U=(r+1)*A+(T-1),C=(r+1)*A+T,w=(r+1)*(A-1)+T;g.push(P,U,w),g.push(U,C,w)}}function b(){for(let A=0;A<=e;A++)for(let T=0;T<=r;T++)l.x=A/e,l.y=T/r,p.push(l.x,l.y)}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON();return t.path=this.parameters.path.toJSON(),t}static fromJSON(t){return new Mo(new Su[t.path.type]().fromJSON(t.path),t.tubularSegments,t.radius,t.radialSegments,t.closed)}}class yu extends Li{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new kt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new kt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Ya,this.normalScale=new dt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Je,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Mr extends yu{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new dt(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Wt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new kt(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new kt(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new kt(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}}class Au extends Li{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=lc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class bu extends Li{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}class vl extends ge{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new kt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class Ru extends vl{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(ge.DEFAULT_UP),this.updateMatrix(),this.groundColor=new kt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const ts=new se,na=new V,ia=new V;class Uu{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new dt(512,512),this.mapType=Ze,this.map=null,this.mapPass=null,this.matrix=new se,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new mo,this._frameExtents=new dt(1,1),this._viewportCount=1,this._viewports=[new ce(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;na.setFromMatrixPosition(t.matrixWorld),e.position.copy(na),ia.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(ia),e.updateMatrixWorld(),ts.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ts,e.coordinateSystem,e.reversedDepth),e.reversedDepth?n.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(ts)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class gl extends al{constructor(t=-1,e=1,n=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,r,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=n-t,o=n+t,a=r+e,c=r-e;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=l*this.view.offsetX,o=s+l*this.view.width,a-=u*this.view.offsetY,c=a-u*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class Pu extends Uu{constructor(){super(new gl(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Cu extends vl{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ge.DEFAULT_UP),this.updateMatrix(),this.target=new ge,this.shadow=new Pu}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}class Nu extends Le{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}const ra=new se;class qu{constructor(t,e,n=0,r=1/0){this.ray=new nl(t,e),this.near=n,this.far=r,this.camera=null,this.layers=new po,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return ra.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(ra),this}intersectObject(t,e=!0,n=[]){return Zs(t,this,n,e),n.sort(sa),n}intersectObjects(t,e=!0,n=[]){for(let r=0,s=t.length;r<s;r++)Zs(t[r],this,n,e);return n.sort(sa),n}}function sa(i,t){return i.distance-t.distance}function Zs(i,t,e,n){let r=!0;if(i.layers.test(t.layers)&&i.raycast(t,e)===!1&&(r=!1),r===!0&&n===!0){const s=i.children;for(let o=0,a=s.length;o<a;o++)Zs(s[o],t,e,!0)}}function oa(i,t,e,n){const r=Vu(n);switch(e){case Ka:return i*t;case Za:return i*t/r.components*r.byteLength;case ao:return i*t/r.components*r.byteLength;case Ja:return i*t*2/r.components*r.byteLength;case lo:return i*t*2/r.components*r.byteLength;case ja:return i*t*3/r.components*r.byteLength;case Be:return i*t*4/r.components*r.byteLength;case co:return i*t*4/r.components*r.byteLength;case ur:case fr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case hr:case dr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ys:case bs:return Math.max(i,16)*Math.max(t,8)/4;case Ss:case As:return Math.max(i,8)*Math.max(t,8)/2;case Rs:case Us:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Ps:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Cs:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ns:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case qs:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case Vs:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case ws:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Ds:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Ls:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case Os:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case zs:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Is:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case Fs:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case _s:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Ws:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Bs:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case ks:case Hs:case Xs:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Gs:case Qs:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Ks:case js:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Vu(i){switch(i){case Ze:case Ha:return{byteLength:1,components:1};case Ri:case Xa:case wi:return{byteLength:2,components:1};case so:case oo:return{byteLength:2,components:4};case On:case ro:case an:return{byteLength:4,components:1};case Ga:case Qa:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:io}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=io);function xl(){let i=null,t=!1,e=null,n=null;function r(s,o){e(s,o),n=i.requestAnimationFrame(r)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(r),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){i=s}}}function wu(i){const t=new WeakMap;function e(a,c){const l=a.array,u=a.usage,h=l.byteLength,d=i.createBuffer();i.bindBuffer(c,d),i.bufferData(c,l,u),a.onUploadCallback();let p;if(l instanceof Float32Array)p=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)p=i.HALF_FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?p=i.HALF_FLOAT:p=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)p=i.SHORT;else if(l instanceof Uint32Array)p=i.UNSIGNED_INT;else if(l instanceof Int32Array)p=i.INT;else if(l instanceof Int8Array)p=i.BYTE;else if(l instanceof Uint8Array)p=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)p=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:p,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:h}}function n(a,c,l){const u=c.array,h=c.updateRanges;if(i.bindBuffer(l,a),h.length===0)i.bufferSubData(l,0,u);else{h.sort((p,g)=>p.start-g.start);let d=0;for(let p=1;p<h.length;p++){const g=h[d],x=h[p];x.start<=g.start+g.count+1?g.count=Math.max(g.count,x.start+x.count-g.start):(++d,h[d]=x)}h.length=d+1;for(let p=0,g=h.length;p<g;p++){const x=h[p];i.bufferSubData(l,x.start*u.BYTES_PER_ELEMENT,u,x.start,x.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);const c=t.get(a);c&&(i.deleteBuffer(c.buffer),t.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const u=t.get(a);(!u||u.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const l=t.get(a);if(l===void 0)t.set(a,e(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,a,c),l.version=a.version}}return{get:r,remove:s,update:o}}var Du=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Lu=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Ou=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,zu=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Iu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Fu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,_u=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Wu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Bu=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,ku=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Hu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Xu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Gu=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Qu=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Ku=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,ju=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Zu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Ju=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Yu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,$u=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,tf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,ef=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,nf=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,rf=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,sf=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,of=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,af=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,lf=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,cf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,uf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,ff="gl_FragColor = linearToOutputTexel( gl_FragColor );",hf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,df=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,pf=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,mf=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,vf=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,gf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,xf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Mf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Tf=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Ef=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Sf=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,yf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Af=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,bf=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Rf=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Uf=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Pf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Cf=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Nf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,qf=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Vf=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,wf=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Df=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Lf=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Of=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,zf=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,If=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Ff=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,_f=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Wf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Bf=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,kf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Hf=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Xf=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Gf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Qf=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Kf=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,jf=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Zf=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Jf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Yf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,$f=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,th=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,eh=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,nh=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,ih=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,rh=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,sh=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,oh=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,ah=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,lh=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,ch=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,uh=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,fh=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,hh=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dh=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,ph=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,mh=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,vh=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		float depth = unpackRGBAToDepth( texture2D( depths, uv ) );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			return step( depth, compare );
		#else
			return step( compare, depth );
		#endif
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow( sampler2D shadow, vec2 uv, float compare ) {
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		#ifdef USE_REVERSED_DEPTH_BUFFER
			float hard_shadow = step( distribution.x, compare );
		#else
			float hard_shadow = step( compare, distribution.x );
		#endif
		if ( hard_shadow != 1.0 ) {
			float distance = compare - distribution.x;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,gh=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,xh=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Mh=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Th=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Eh=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Sh=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,yh=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Ah=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,bh=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Rh=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Uh=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Ph=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Ch=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Nh=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,qh=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Vh=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,wh=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Dh=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Lh=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Oh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,zh=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ih=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Fh=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,_h=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Wh=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Bh=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,kh=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Hh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Xh=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Gh=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Qh=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Kh=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,jh=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Zh=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Jh=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Yh=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,$h=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,td=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,ed=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,nd=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,id=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,rd=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,sd=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,od=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ad=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ld=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,cd=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,ud=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,fd=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,hd=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,dd=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,_t={alphahash_fragment:Du,alphahash_pars_fragment:Lu,alphamap_fragment:Ou,alphamap_pars_fragment:zu,alphatest_fragment:Iu,alphatest_pars_fragment:Fu,aomap_fragment:_u,aomap_pars_fragment:Wu,batching_pars_vertex:Bu,batching_vertex:ku,begin_vertex:Hu,beginnormal_vertex:Xu,bsdfs:Gu,iridescence_fragment:Qu,bumpmap_pars_fragment:Ku,clipping_planes_fragment:ju,clipping_planes_pars_fragment:Zu,clipping_planes_pars_vertex:Ju,clipping_planes_vertex:Yu,color_fragment:$u,color_pars_fragment:tf,color_pars_vertex:ef,color_vertex:nf,common:rf,cube_uv_reflection_fragment:sf,defaultnormal_vertex:of,displacementmap_pars_vertex:af,displacementmap_vertex:lf,emissivemap_fragment:cf,emissivemap_pars_fragment:uf,colorspace_fragment:ff,colorspace_pars_fragment:hf,envmap_fragment:df,envmap_common_pars_fragment:pf,envmap_pars_fragment:mf,envmap_pars_vertex:vf,envmap_physical_pars_fragment:Uf,envmap_vertex:gf,fog_vertex:xf,fog_pars_vertex:Mf,fog_fragment:Tf,fog_pars_fragment:Ef,gradientmap_pars_fragment:Sf,lightmap_pars_fragment:yf,lights_lambert_fragment:Af,lights_lambert_pars_fragment:bf,lights_pars_begin:Rf,lights_toon_fragment:Pf,lights_toon_pars_fragment:Cf,lights_phong_fragment:Nf,lights_phong_pars_fragment:qf,lights_physical_fragment:Vf,lights_physical_pars_fragment:wf,lights_fragment_begin:Df,lights_fragment_maps:Lf,lights_fragment_end:Of,logdepthbuf_fragment:zf,logdepthbuf_pars_fragment:If,logdepthbuf_pars_vertex:Ff,logdepthbuf_vertex:_f,map_fragment:Wf,map_pars_fragment:Bf,map_particle_fragment:kf,map_particle_pars_fragment:Hf,metalnessmap_fragment:Xf,metalnessmap_pars_fragment:Gf,morphinstance_vertex:Qf,morphcolor_vertex:Kf,morphnormal_vertex:jf,morphtarget_pars_vertex:Zf,morphtarget_vertex:Jf,normal_fragment_begin:Yf,normal_fragment_maps:$f,normal_pars_fragment:th,normal_pars_vertex:eh,normal_vertex:nh,normalmap_pars_fragment:ih,clearcoat_normal_fragment_begin:rh,clearcoat_normal_fragment_maps:sh,clearcoat_pars_fragment:oh,iridescence_pars_fragment:ah,opaque_fragment:lh,packing:ch,premultiplied_alpha_fragment:uh,project_vertex:fh,dithering_fragment:hh,dithering_pars_fragment:dh,roughnessmap_fragment:ph,roughnessmap_pars_fragment:mh,shadowmap_pars_fragment:vh,shadowmap_pars_vertex:gh,shadowmap_vertex:xh,shadowmask_pars_fragment:Mh,skinbase_vertex:Th,skinning_pars_vertex:Eh,skinning_vertex:Sh,skinnormal_vertex:yh,specularmap_fragment:Ah,specularmap_pars_fragment:bh,tonemapping_fragment:Rh,tonemapping_pars_fragment:Uh,transmission_fragment:Ph,transmission_pars_fragment:Ch,uv_pars_fragment:Nh,uv_pars_vertex:qh,uv_vertex:Vh,worldpos_vertex:wh,background_vert:Dh,background_frag:Lh,backgroundCube_vert:Oh,backgroundCube_frag:zh,cube_vert:Ih,cube_frag:Fh,depth_vert:_h,depth_frag:Wh,distanceRGBA_vert:Bh,distanceRGBA_frag:kh,equirect_vert:Hh,equirect_frag:Xh,linedashed_vert:Gh,linedashed_frag:Qh,meshbasic_vert:Kh,meshbasic_frag:jh,meshlambert_vert:Zh,meshlambert_frag:Jh,meshmatcap_vert:Yh,meshmatcap_frag:$h,meshnormal_vert:td,meshnormal_frag:ed,meshphong_vert:nd,meshphong_frag:id,meshphysical_vert:rd,meshphysical_frag:sd,meshtoon_vert:od,meshtoon_frag:ad,points_vert:ld,points_frag:cd,shadow_vert:ud,shadow_frag:fd,sprite_vert:hd,sprite_frag:dd},ct={common:{diffuse:{value:new kt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ft},alphaMap:{value:null},alphaMapTransform:{value:new Ft},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ft}},envmap:{envMap:{value:null},envMapRotation:{value:new Ft},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ft}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ft}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ft},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ft},normalScale:{value:new dt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ft},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ft}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ft}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ft}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new kt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new kt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ft},alphaTest:{value:0},uvTransform:{value:new Ft}},sprite:{diffuse:{value:new kt(16777215)},opacity:{value:1},center:{value:new dt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ft},alphaMap:{value:null},alphaMapTransform:{value:new Ft},alphaTest:{value:0}}},Xe={basic:{uniforms:Se([ct.common,ct.specularmap,ct.envmap,ct.aomap,ct.lightmap,ct.fog]),vertexShader:_t.meshbasic_vert,fragmentShader:_t.meshbasic_frag},lambert:{uniforms:Se([ct.common,ct.specularmap,ct.envmap,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.fog,ct.lights,{emissive:{value:new kt(0)}}]),vertexShader:_t.meshlambert_vert,fragmentShader:_t.meshlambert_frag},phong:{uniforms:Se([ct.common,ct.specularmap,ct.envmap,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.fog,ct.lights,{emissive:{value:new kt(0)},specular:{value:new kt(1118481)},shininess:{value:30}}]),vertexShader:_t.meshphong_vert,fragmentShader:_t.meshphong_frag},standard:{uniforms:Se([ct.common,ct.envmap,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.roughnessmap,ct.metalnessmap,ct.fog,ct.lights,{emissive:{value:new kt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:_t.meshphysical_vert,fragmentShader:_t.meshphysical_frag},toon:{uniforms:Se([ct.common,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.gradientmap,ct.fog,ct.lights,{emissive:{value:new kt(0)}}]),vertexShader:_t.meshtoon_vert,fragmentShader:_t.meshtoon_frag},matcap:{uniforms:Se([ct.common,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.fog,{matcap:{value:null}}]),vertexShader:_t.meshmatcap_vert,fragmentShader:_t.meshmatcap_frag},points:{uniforms:Se([ct.points,ct.fog]),vertexShader:_t.points_vert,fragmentShader:_t.points_frag},dashed:{uniforms:Se([ct.common,ct.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:_t.linedashed_vert,fragmentShader:_t.linedashed_frag},depth:{uniforms:Se([ct.common,ct.displacementmap]),vertexShader:_t.depth_vert,fragmentShader:_t.depth_frag},normal:{uniforms:Se([ct.common,ct.bumpmap,ct.normalmap,ct.displacementmap,{opacity:{value:1}}]),vertexShader:_t.meshnormal_vert,fragmentShader:_t.meshnormal_frag},sprite:{uniforms:Se([ct.sprite,ct.fog]),vertexShader:_t.sprite_vert,fragmentShader:_t.sprite_frag},background:{uniforms:{uvTransform:{value:new Ft},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:_t.background_vert,fragmentShader:_t.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ft}},vertexShader:_t.backgroundCube_vert,fragmentShader:_t.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:_t.cube_vert,fragmentShader:_t.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:_t.equirect_vert,fragmentShader:_t.equirect_frag},distanceRGBA:{uniforms:Se([ct.common,ct.displacementmap,{referencePosition:{value:new V},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:_t.distanceRGBA_vert,fragmentShader:_t.distanceRGBA_frag},shadow:{uniforms:Se([ct.lights,ct.fog,{color:{value:new kt(0)},opacity:{value:1}}]),vertexShader:_t.shadow_vert,fragmentShader:_t.shadow_frag}};Xe.physical={uniforms:Se([Xe.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ft},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ft},clearcoatNormalScale:{value:new dt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ft},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ft},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ft},sheen:{value:0},sheenColor:{value:new kt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ft},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ft},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ft},transmissionSamplerSize:{value:new dt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ft},attenuationDistance:{value:0},attenuationColor:{value:new kt(0)},specularColor:{value:new kt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ft},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ft},anisotropyVector:{value:new dt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ft}}]),vertexShader:_t.meshphysical_vert,fragmentShader:_t.meshphysical_frag};const or={r:0,b:0,g:0},Un=new Je,pd=new se;function md(i,t,e,n,r,s,o){const a=new kt(0);let c=s===!0?0:1,l,u,h=null,d=0,p=null;function g(A){let T=A.isScene===!0?A.background:null;return T&&T.isTexture&&(T=(A.backgroundBlurriness>0?e:t).get(T)),T}function x(A){let T=!1;const P=g(A);P===null?f(a,c):P&&P.isColor&&(f(P,1),T=!0);const U=i.xr.getEnvironmentBlendMode();U==="additive"?n.buffers.color.setClear(0,0,0,1,o):U==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||T)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function m(A,T){const P=g(T);P&&(P.isCubeTexture||P.mapping===xr)?(u===void 0&&(u=new ve(new Oi(1,1,1),new cn({name:"BackgroundCubeMaterial",uniforms:ci(Xe.backgroundCube.uniforms),vertexShader:Xe.backgroundCube.vertexShader,fragmentShader:Xe.backgroundCube.fragmentShader,side:Ae,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(U,C,w){this.matrixWorld.copyPosition(w.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(u)),Un.copy(T.backgroundRotation),Un.x*=-1,Un.y*=-1,Un.z*=-1,P.isCubeTexture&&P.isRenderTargetTexture===!1&&(Un.y*=-1,Un.z*=-1),u.material.uniforms.envMap.value=P,u.material.uniforms.flipEnvMap.value=P.isCubeTexture&&P.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=T.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(pd.makeRotationFromEuler(Un)),u.material.toneMapped=Gt.getTransfer(P.colorSpace)!==Yt,(h!==P||d!==P.version||p!==i.toneMapping)&&(u.material.needsUpdate=!0,h=P,d=P.version,p=i.toneMapping),u.layers.enableAll(),A.unshift(u,u.geometry,u.material,0,0,null)):P&&P.isTexture&&(l===void 0&&(l=new ve(new Ii(2,2),new cn({name:"BackgroundMaterial",uniforms:ci(Xe.background.uniforms),vertexShader:Xe.background.vertexShader,fragmentShader:Xe.background.fragmentShader,side:je,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(l)),l.material.uniforms.t2D.value=P,l.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,l.material.toneMapped=Gt.getTransfer(P.colorSpace)!==Yt,P.matrixAutoUpdate===!0&&P.updateMatrix(),l.material.uniforms.uvTransform.value.copy(P.matrix),(h!==P||d!==P.version||p!==i.toneMapping)&&(l.material.needsUpdate=!0,h=P,d=P.version,p=i.toneMapping),l.layers.enableAll(),A.unshift(l,l.geometry,l.material,0,0,null))}function f(A,T){A.getRGB(or,ol(i)),n.buffers.color.setClear(or.r,or.g,or.b,T,o)}function b(){u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(A,T=1){a.set(A),c=T,f(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(A){c=A,f(a,c)},render:x,addToRenderList:m,dispose:b}}function vd(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=d(null);let s=r,o=!1;function a(S,N,z,_,j){let k=!1;const Q=h(_,z,N);s!==Q&&(s=Q,l(s.object)),k=p(S,_,z,j),k&&g(S,_,z,j),j!==null&&t.update(j,i.ELEMENT_ARRAY_BUFFER),(k||o)&&(o=!1,T(S,N,z,_),j!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(j).buffer))}function c(){return i.createVertexArray()}function l(S){return i.bindVertexArray(S)}function u(S){return i.deleteVertexArray(S)}function h(S,N,z){const _=z.wireframe===!0;let j=n[S.id];j===void 0&&(j={},n[S.id]=j);let k=j[N.id];k===void 0&&(k={},j[N.id]=k);let Q=k[_];return Q===void 0&&(Q=d(c()),k[_]=Q),Q}function d(S){const N=[],z=[],_=[];for(let j=0;j<e;j++)N[j]=0,z[j]=0,_[j]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:z,attributeDivisors:_,object:S,attributes:{},index:null}}function p(S,N,z,_){const j=s.attributes,k=N.attributes;let Q=0;const Y=z.getAttributes();for(const W in Y)if(Y[W].location>=0){const ht=j[W];let G=k[W];if(G===void 0&&(W==="instanceMatrix"&&S.instanceMatrix&&(G=S.instanceMatrix),W==="instanceColor"&&S.instanceColor&&(G=S.instanceColor)),ht===void 0||ht.attribute!==G||G&&ht.data!==G.data)return!0;Q++}return s.attributesNum!==Q||s.index!==_}function g(S,N,z,_){const j={},k=N.attributes;let Q=0;const Y=z.getAttributes();for(const W in Y)if(Y[W].location>=0){let ht=k[W];ht===void 0&&(W==="instanceMatrix"&&S.instanceMatrix&&(ht=S.instanceMatrix),W==="instanceColor"&&S.instanceColor&&(ht=S.instanceColor));const G={};G.attribute=ht,ht&&ht.data&&(G.data=ht.data),j[W]=G,Q++}s.attributes=j,s.attributesNum=Q,s.index=_}function x(){const S=s.newAttributes;for(let N=0,z=S.length;N<z;N++)S[N]=0}function m(S){f(S,0)}function f(S,N){const z=s.newAttributes,_=s.enabledAttributes,j=s.attributeDivisors;z[S]=1,_[S]===0&&(i.enableVertexAttribArray(S),_[S]=1),j[S]!==N&&(i.vertexAttribDivisor(S,N),j[S]=N)}function b(){const S=s.newAttributes,N=s.enabledAttributes;for(let z=0,_=N.length;z<_;z++)N[z]!==S[z]&&(i.disableVertexAttribArray(z),N[z]=0)}function A(S,N,z,_,j,k,Q){Q===!0?i.vertexAttribIPointer(S,N,z,j,k):i.vertexAttribPointer(S,N,z,_,j,k)}function T(S,N,z,_){x();const j=_.attributes,k=z.getAttributes(),Q=N.defaultAttributeValues;for(const Y in k){const W=k[Y];if(W.location>=0){let st=j[Y];if(st===void 0&&(Y==="instanceMatrix"&&S.instanceMatrix&&(st=S.instanceMatrix),Y==="instanceColor"&&S.instanceColor&&(st=S.instanceColor)),st!==void 0){const ht=st.normalized,G=st.itemSize,rt=t.get(st);if(rt===void 0)continue;const pt=rt.buffer,Vt=rt.type,Rt=rt.bytesPerElement,H=Vt===i.INT||Vt===i.UNSIGNED_INT||st.gpuType===ro;if(st.isInterleavedBufferAttribute){const Z=st.data,ft=Z.stride,Ct=st.offset;if(Z.isInstancedInterleavedBuffer){for(let Et=0;Et<W.locationSize;Et++)f(W.location+Et,Z.meshPerAttribute);S.isInstancedMesh!==!0&&_._maxInstanceCount===void 0&&(_._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let Et=0;Et<W.locationSize;Et++)m(W.location+Et);i.bindBuffer(i.ARRAY_BUFFER,pt);for(let Et=0;Et<W.locationSize;Et++)A(W.location+Et,G/W.locationSize,Vt,ht,ft*Rt,(Ct+G/W.locationSize*Et)*Rt,H)}else{if(st.isInstancedBufferAttribute){for(let Z=0;Z<W.locationSize;Z++)f(W.location+Z,st.meshPerAttribute);S.isInstancedMesh!==!0&&_._maxInstanceCount===void 0&&(_._maxInstanceCount=st.meshPerAttribute*st.count)}else for(let Z=0;Z<W.locationSize;Z++)m(W.location+Z);i.bindBuffer(i.ARRAY_BUFFER,pt);for(let Z=0;Z<W.locationSize;Z++)A(W.location+Z,G/W.locationSize,Vt,ht,G*Rt,G/W.locationSize*Z*Rt,H)}}else if(Q!==void 0){const ht=Q[Y];if(ht!==void 0)switch(ht.length){case 2:i.vertexAttrib2fv(W.location,ht);break;case 3:i.vertexAttrib3fv(W.location,ht);break;case 4:i.vertexAttrib4fv(W.location,ht);break;default:i.vertexAttrib1fv(W.location,ht)}}}}b()}function P(){w();for(const S in n){const N=n[S];for(const z in N){const _=N[z];for(const j in _)u(_[j].object),delete _[j];delete N[z]}delete n[S]}}function U(S){if(n[S.id]===void 0)return;const N=n[S.id];for(const z in N){const _=N[z];for(const j in _)u(_[j].object),delete _[j];delete N[z]}delete n[S.id]}function C(S){for(const N in n){const z=n[N];if(z[S.id]===void 0)continue;const _=z[S.id];for(const j in _)u(_[j].object),delete _[j];delete z[S.id]}}function w(){E(),o=!0,s!==r&&(s=r,l(s.object))}function E(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:w,resetDefaultState:E,dispose:P,releaseStatesOfGeometry:U,releaseStatesOfProgram:C,initAttributes:x,enableAttribute:m,disableUnusedAttributes:b}}function gd(i,t,e){let n;function r(l){n=l}function s(l,u){i.drawArrays(n,l,u),e.update(u,n,1)}function o(l,u,h){h!==0&&(i.drawArraysInstanced(n,l,u,h),e.update(u,n,h))}function a(l,u,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,u,0,h);let p=0;for(let g=0;g<h;g++)p+=u[g];e.update(p,n,1)}function c(l,u,h,d){if(h===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<l.length;g++)o(l[g],u[g],d[g]);else{p.multiDrawArraysInstancedWEBGL(n,l,0,u,0,d,0,h);let g=0;for(let x=0;x<h;x++)g+=u[x]*d[x];e.update(g,n,1)}}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=c}function xd(i,t,e,n){let r;function s(){if(r!==void 0)return r;if(t.has("EXT_texture_filter_anisotropic")===!0){const C=t.get("EXT_texture_filter_anisotropic");r=i.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(C){return!(C!==Be&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(C){const w=C===wi&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(C!==Ze&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&C!==an&&!w)}function c(C){if(C==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=e.precision!==void 0?e.precision:"highp";const u=c(l);u!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",u,"instead."),l=u);const h=e.logarithmicDepthBuffer===!0,d=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),p=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),f=i.getParameter(i.MAX_VERTEX_ATTRIBS),b=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),A=i.getParameter(i.MAX_VARYING_VECTORS),T=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),P=g>0,U=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:h,reversedDepthBuffer:d,maxTextures:p,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:m,maxAttributes:f,maxVertexUniforms:b,maxVaryings:A,maxFragmentUniforms:T,vertexTextures:P,maxSamples:U}}function Md(i){const t=this;let e=null,n=0,r=!1,s=!1;const o=new Cn,a=new Ft,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const p=h.length!==0||d||n!==0||r;return r=d,n=h.length,p},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(h,d){e=u(h,d,0)},this.setState=function(h,d,p){const g=h.clippingPlanes,x=h.clipIntersection,m=h.clipShadows,f=i.get(h);if(!r||g===null||g.length===0||s&&!m)s?u(null):l();else{const b=s?0:n,A=b*4;let T=f.clippingState||null;c.value=T,T=u(g,d,A,p);for(let P=0;P!==A;++P)T[P]=e[P];f.clippingState=T,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=b}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(h,d,p,g){const x=h!==null?h.length:0;let m=null;if(x!==0){if(m=c.value,g!==!0||m===null){const f=p+x*4,b=d.matrixWorldInverse;a.getNormalMatrix(b),(m===null||m.length<f)&&(m=new Float32Array(f));for(let A=0,T=p;A!==x;++A,T+=4)o.copy(h[A]).applyMatrix4(b,a),o.normal.toArray(m,T),m[T+3]=o.constant}c.value=m,c.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,m}}function Td(i){let t=new WeakMap;function e(o,a){return a===xs?o.mapping=oi:a===Ms&&(o.mapping=ai),o}function n(o){if(o&&o.isTexture){const a=o.mapping;if(a===xs||a===Ms)if(t.has(o)){const c=t.get(o).texture;return e(c,o.mapping)}else{const c=o.image;if(c&&c.height>0){const l=new ru(c.height);return l.fromEquirectangularTexture(i,o),t.set(o,l),o.addEventListener("dispose",r),e(l.texture,o.mapping)}else return null}}return o}function r(o){const a=o.target;a.removeEventListener("dispose",r);const c=t.get(a);c!==void 0&&(t.delete(a),c.dispose())}function s(){t=new WeakMap}return{get:n,dispose:s}}const ei=4,aa=[.125,.215,.35,.446,.526,.582],Vn=20,es=new gl,la=new kt;let ns=null,is=0,rs=0,ss=!1;const Nn=(1+Math.sqrt(5))/2,Yn=1/Nn,ca=[new V(-Nn,Yn,0),new V(Nn,Yn,0),new V(-Yn,0,Nn),new V(Yn,0,Nn),new V(0,Nn,-Yn),new V(0,Nn,Yn),new V(-1,1,-1),new V(1,1,-1),new V(-1,1,1),new V(1,1,1)],Ed=new V;class Js{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,r=100,s={}){const{size:o=256,position:a=Ed}=s;ns=this._renderer.getRenderTarget(),is=this._renderer.getActiveCubeFace(),rs=this._renderer.getActiveMipmapLevel(),ss=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(t,n,r,c,a),e>0&&this._blur(c,0,0,e),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ha(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=fa(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(ns,is,rs),this._renderer.xr.enabled=ss,t.scissorTest=!1,ar(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===oi||t.mapping===ai?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),ns=this._renderer.getRenderTarget(),is=this._renderer.getActiveCubeFace(),rs=this._renderer.getActiveMipmapLevel(),ss=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Ge,minFilter:Ge,generateMipmaps:!1,type:wi,format:Be,colorSpace:li,depthBuffer:!1},r=ua(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ua(t,e,n);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Sd(s)),this._blurMaterial=yd(s,t,e)}return r}_compileMaterial(t){const e=new ve(this._lodPlanes[0],t);this._renderer.compile(e,es)}_sceneToCubeUV(t,e,n,r,s){const c=new Le(90,1,e,n),l=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,p=h.toneMapping;h.getClearColor(la),h.toneMapping=Tn,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(r),h.clearDepth(),h.setRenderTarget(null));const x=new Vi({name:"PMREM.Background",side:Ae,depthWrite:!1,depthTest:!1}),m=new ve(new Oi,x);let f=!1;const b=t.background;b?b.isColor&&(x.color.copy(b),t.background=null,f=!0):(x.color.copy(la),f=!0);for(let A=0;A<6;A++){const T=A%3;T===0?(c.up.set(0,l[A],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x+u[A],s.y,s.z)):T===1?(c.up.set(0,0,l[A]),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y+u[A],s.z)):(c.up.set(0,l[A],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y,s.z+u[A]));const P=this._cubeSize;ar(r,T*P,A>2?P:0,P,P),h.setRenderTarget(r),f&&h.render(m,c),h.render(t,c)}m.geometry.dispose(),m.material.dispose(),h.toneMapping=p,h.autoClear=d,t.background=b}_textureToCubeUV(t,e){const n=this._renderer,r=t.mapping===oi||t.mapping===ai;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=ha()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=fa());const s=r?this._cubemapMaterial:this._equirectMaterial,o=new ve(this._lodPlanes[0],s),a=s.uniforms;a.envMap.value=t;const c=this._cubeSize;ar(e,0,0,3*c,2*c),n.setRenderTarget(e),n.render(o,es)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const r=this._lodPlanes.length;for(let s=1;s<r;s++){const o=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=ca[(r-s-1)%ca.length];this._blur(t,s-1,s,o,a)}e.autoClear=n}_blur(t,e,n,r,s){const o=this._pingPongRenderTarget;this._halfBlur(t,o,e,n,r,"latitudinal",s),this._halfBlur(o,t,n,n,r,"longitudinal",s)}_halfBlur(t,e,n,r,s,o,a){const c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new ve(this._lodPlanes[r],l),d=l.uniforms,p=this._sizeLods[n]-1,g=isFinite(s)?Math.PI/(2*p):2*Math.PI/(2*Vn-1),x=s/g,m=isFinite(s)?1+Math.floor(u*x):Vn;m>Vn&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Vn}`);const f=[];let b=0;for(let C=0;C<Vn;++C){const w=C/x,E=Math.exp(-w*w/2);f.push(E),C===0?b+=E:C<m&&(b+=2*E)}for(let C=0;C<f.length;C++)f[C]=f[C]/b;d.envMap.value=t.texture,d.samples.value=m,d.weights.value=f,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:A}=this;d.dTheta.value=g,d.mipInt.value=A-n;const T=this._sizeLods[r],P=3*T*(r>A-ei?r-A+ei:0),U=4*(this._cubeSize-T);ar(e,P,U,3*T,2*T),c.setRenderTarget(e),c.render(h,es)}}function Sd(i){const t=[],e=[],n=[];let r=i;const s=i-ei+1+aa.length;for(let o=0;o<s;o++){const a=Math.pow(2,r);e.push(a);let c=1/a;o>i-ei?c=aa[o-i+ei-1]:o===0&&(c=0),n.push(c);const l=1/(a-2),u=-l,h=1+l,d=[u,u,h,u,h,h,u,u,h,h,u,h],p=6,g=6,x=3,m=2,f=1,b=new Float32Array(x*g*p),A=new Float32Array(m*g*p),T=new Float32Array(f*g*p);for(let U=0;U<p;U++){const C=U%3*2/3-1,w=U>2?0:-1,E=[C,w,0,C+2/3,w,0,C+2/3,w+1,0,C,w,0,C+2/3,w+1,0,C,w+1,0];b.set(E,x*g*U),A.set(d,m*g*U);const S=[U,U,U,U,U,U];T.set(S,f*g*U)}const P=new Ne;P.setAttribute("position",new Ke(b,x)),P.setAttribute("uv",new Ke(A,m)),P.setAttribute("faceIndex",new Ke(T,f)),t.push(P),r>ei&&r--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function ua(i,t,e){const n=new zn(i,t,e);return n.texture.mapping=xr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ar(i,t,e,n,r){i.viewport.set(t,e,n,r),i.scissor.set(t,e,n,r)}function yd(i,t,e){const n=new Float32Array(Vn),r=new V(0,1,0);return new cn({name:"SphericalGaussianBlur",defines:{n:Vn,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:To(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Mn,depthTest:!1,depthWrite:!1})}function fa(){return new cn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:To(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Mn,depthTest:!1,depthWrite:!1})}function ha(){return new cn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:To(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Mn,depthTest:!1,depthWrite:!1})}function To(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Ad(i){let t=new WeakMap,e=null;function n(a){if(a&&a.isTexture){const c=a.mapping,l=c===xs||c===Ms,u=c===oi||c===ai;if(l||u){let h=t.get(a);const d=h!==void 0?h.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return e===null&&(e=new Js(i)),h=l?e.fromEquirectangular(a,h):e.fromCubemap(a,h),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),h.texture;if(h!==void 0)return h.texture;{const p=a.image;return l&&p&&p.height>0||u&&p&&r(p)?(e===null&&(e=new Js(i)),h=l?e.fromEquirectangular(a):e.fromCubemap(a),h.texture.pmremVersion=a.pmremVersion,t.set(a,h),a.addEventListener("dispose",s),h.texture):null}}}return a}function r(a){let c=0;const l=6;for(let u=0;u<l;u++)a[u]!==void 0&&c++;return c===l}function s(a){const c=a.target;c.removeEventListener("dispose",s);const l=t.get(c);l!==void 0&&(t.delete(c),l.dispose())}function o(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:o}}function bd(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let r;switch(n){case"WEBGL_depth_texture":r=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":r=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":r=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":r=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:r=i.getExtension(n)}return t[n]=r,r}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const r=e(n);return r===null&&qi("THREE.WebGLRenderer: "+n+" extension not supported."),r}}}function Rd(i,t,e,n){const r={},s=new WeakMap;function o(h){const d=h.target;d.index!==null&&t.remove(d.index);for(const g in d.attributes)t.remove(d.attributes[g]);d.removeEventListener("dispose",o),delete r[d.id];const p=s.get(d);p&&(t.remove(p),s.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function a(h,d){return r[d.id]===!0||(d.addEventListener("dispose",o),r[d.id]=!0,e.memory.geometries++),d}function c(h){const d=h.attributes;for(const p in d)t.update(d[p],i.ARRAY_BUFFER)}function l(h){const d=[],p=h.index,g=h.attributes.position;let x=0;if(p!==null){const b=p.array;x=p.version;for(let A=0,T=b.length;A<T;A+=3){const P=b[A+0],U=b[A+1],C=b[A+2];d.push(P,U,U,C,C,P)}}else if(g!==void 0){const b=g.array;x=g.version;for(let A=0,T=b.length/3-1;A<T;A+=3){const P=A+0,U=A+1,C=A+2;d.push(P,U,U,C,C,P)}}else return;const m=new(tl(d)?sl:rl)(d,1);m.version=x;const f=s.get(h);f&&t.remove(f),s.set(h,m)}function u(h){const d=s.get(h);if(d){const p=h.index;p!==null&&d.version<p.version&&l(h)}else l(h);return s.get(h)}return{get:a,update:c,getWireframeAttribute:u}}function Ud(i,t,e){let n;function r(d){n=d}let s,o;function a(d){s=d.type,o=d.bytesPerElement}function c(d,p){i.drawElements(n,p,s,d*o),e.update(p,n,1)}function l(d,p,g){g!==0&&(i.drawElementsInstanced(n,p,s,d*o,g),e.update(p,n,g))}function u(d,p,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,p,0,s,d,0,g);let m=0;for(let f=0;f<g;f++)m+=p[f];e.update(m,n,1)}function h(d,p,g,x){if(g===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let f=0;f<d.length;f++)l(d[f]/o,p[f],x[f]);else{m.multiDrawElementsInstancedWEBGL(n,p,0,s,d,0,x,0,g);let f=0;for(let b=0;b<g;b++)f+=p[b]*x[b];e.update(f,n,1)}}this.setMode=r,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=u,this.renderMultiDrawInstances=h}function Pd(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(s/3);break;case i.LINES:e.lines+=a*(s/2);break;case i.LINE_STRIP:e.lines+=a*(s-1);break;case i.LINE_LOOP:e.lines+=a*s;break;case i.POINTS:e.points+=a*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function r(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:r,update:n}}function Cd(i,t,e){const n=new WeakMap,r=new ce;function s(o,a,c){const l=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0;let d=n.get(a);if(d===void 0||d.count!==h){let S=function(){w.dispose(),n.delete(a),a.removeEventListener("dispose",S)};var p=S;d!==void 0&&d.texture.dispose();const g=a.morphAttributes.position!==void 0,x=a.morphAttributes.normal!==void 0,m=a.morphAttributes.color!==void 0,f=a.morphAttributes.position||[],b=a.morphAttributes.normal||[],A=a.morphAttributes.color||[];let T=0;g===!0&&(T=1),x===!0&&(T=2),m===!0&&(T=3);let P=a.attributes.position.count*T,U=1;P>t.maxTextureSize&&(U=Math.ceil(P/t.maxTextureSize),P=t.maxTextureSize);const C=new Float32Array(P*U*4*h),w=new el(C,P,U,h);w.type=an,w.needsUpdate=!0;const E=T*4;for(let N=0;N<h;N++){const z=f[N],_=b[N],j=A[N],k=P*U*4*N;for(let Q=0;Q<z.count;Q++){const Y=Q*E;g===!0&&(r.fromBufferAttribute(z,Q),C[k+Y+0]=r.x,C[k+Y+1]=r.y,C[k+Y+2]=r.z,C[k+Y+3]=0),x===!0&&(r.fromBufferAttribute(_,Q),C[k+Y+4]=r.x,C[k+Y+5]=r.y,C[k+Y+6]=r.z,C[k+Y+7]=0),m===!0&&(r.fromBufferAttribute(j,Q),C[k+Y+8]=r.x,C[k+Y+9]=r.y,C[k+Y+10]=r.z,C[k+Y+11]=j.itemSize===4?r.w:1)}}d={count:h,texture:w,size:new dt(P,U)},n.set(a,d),a.addEventListener("dispose",S)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let g=0;for(let m=0;m<l.length;m++)g+=l[m];const x=a.morphTargetsRelative?1:1-g;c.getUniforms().setValue(i,"morphTargetBaseInfluence",x),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",d.texture,e),c.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:s}}function Nd(i,t,e,n){let r=new WeakMap;function s(c){const l=n.render.frame,u=c.geometry,h=t.get(c,u);if(r.get(h)!==l&&(t.update(h),r.set(h,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),r.get(c)!==l&&(e.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,l))),c.isSkinnedMesh){const d=c.skeleton;r.get(d)!==l&&(d.update(),r.set(d,l))}return h}function o(){r=new WeakMap}function a(c){const l=c.target;l.removeEventListener("dispose",a),e.remove(l.instanceMatrix),l.instanceColor!==null&&e.remove(l.instanceColor)}return{update:s,dispose:o}}const Ml=new be,da=new ul(1,1),Tl=new el,El=new Wc,Sl=new ll,pa=[],ma=[],va=new Float32Array(16),ga=new Float32Array(9),xa=new Float32Array(4);function pi(i,t,e){const n=i[0];if(n<=0||n>0)return i;const r=t*e;let s=pa[r];if(s===void 0&&(s=new Float32Array(r),pa[r]=s),t!==0){n.toArray(s,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(s,a)}return s}function de(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function pe(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Tr(i,t){let e=ma[t];e===void 0&&(e=new Int32Array(t),ma[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function qd(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Vd(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(de(e,t))return;i.uniform2fv(this.addr,t),pe(e,t)}}function wd(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(de(e,t))return;i.uniform3fv(this.addr,t),pe(e,t)}}function Dd(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(de(e,t))return;i.uniform4fv(this.addr,t),pe(e,t)}}function Ld(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(de(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),pe(e,t)}else{if(de(e,n))return;xa.set(n),i.uniformMatrix2fv(this.addr,!1,xa),pe(e,n)}}function Od(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(de(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),pe(e,t)}else{if(de(e,n))return;ga.set(n),i.uniformMatrix3fv(this.addr,!1,ga),pe(e,n)}}function zd(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(de(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),pe(e,t)}else{if(de(e,n))return;va.set(n),i.uniformMatrix4fv(this.addr,!1,va),pe(e,n)}}function Id(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Fd(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(de(e,t))return;i.uniform2iv(this.addr,t),pe(e,t)}}function _d(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(de(e,t))return;i.uniform3iv(this.addr,t),pe(e,t)}}function Wd(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(de(e,t))return;i.uniform4iv(this.addr,t),pe(e,t)}}function Bd(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function kd(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(de(e,t))return;i.uniform2uiv(this.addr,t),pe(e,t)}}function Hd(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(de(e,t))return;i.uniform3uiv(this.addr,t),pe(e,t)}}function Xd(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(de(e,t))return;i.uniform4uiv(this.addr,t),pe(e,t)}}function Gd(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let s;this.type===i.SAMPLER_2D_SHADOW?(da.compareFunction=$a,s=da):s=Ml,e.setTexture2D(t||s,r)}function Qd(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTexture3D(t||El,r)}function Kd(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTextureCube(t||Sl,r)}function jd(i,t,e){const n=this.cache,r=e.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),e.setTexture2DArray(t||Tl,r)}function Zd(i){switch(i){case 5126:return qd;case 35664:return Vd;case 35665:return wd;case 35666:return Dd;case 35674:return Ld;case 35675:return Od;case 35676:return zd;case 5124:case 35670:return Id;case 35667:case 35671:return Fd;case 35668:case 35672:return _d;case 35669:case 35673:return Wd;case 5125:return Bd;case 36294:return kd;case 36295:return Hd;case 36296:return Xd;case 35678:case 36198:case 36298:case 36306:case 35682:return Gd;case 35679:case 36299:case 36307:return Qd;case 35680:case 36300:case 36308:case 36293:return Kd;case 36289:case 36303:case 36311:case 36292:return jd}}function Jd(i,t){i.uniform1fv(this.addr,t)}function Yd(i,t){const e=pi(t,this.size,2);i.uniform2fv(this.addr,e)}function $d(i,t){const e=pi(t,this.size,3);i.uniform3fv(this.addr,e)}function tp(i,t){const e=pi(t,this.size,4);i.uniform4fv(this.addr,e)}function ep(i,t){const e=pi(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function np(i,t){const e=pi(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function ip(i,t){const e=pi(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function rp(i,t){i.uniform1iv(this.addr,t)}function sp(i,t){i.uniform2iv(this.addr,t)}function op(i,t){i.uniform3iv(this.addr,t)}function ap(i,t){i.uniform4iv(this.addr,t)}function lp(i,t){i.uniform1uiv(this.addr,t)}function cp(i,t){i.uniform2uiv(this.addr,t)}function up(i,t){i.uniform3uiv(this.addr,t)}function fp(i,t){i.uniform4uiv(this.addr,t)}function hp(i,t,e){const n=this.cache,r=t.length,s=Tr(e,r);de(n,s)||(i.uniform1iv(this.addr,s),pe(n,s));for(let o=0;o!==r;++o)e.setTexture2D(t[o]||Ml,s[o])}function dp(i,t,e){const n=this.cache,r=t.length,s=Tr(e,r);de(n,s)||(i.uniform1iv(this.addr,s),pe(n,s));for(let o=0;o!==r;++o)e.setTexture3D(t[o]||El,s[o])}function pp(i,t,e){const n=this.cache,r=t.length,s=Tr(e,r);de(n,s)||(i.uniform1iv(this.addr,s),pe(n,s));for(let o=0;o!==r;++o)e.setTextureCube(t[o]||Sl,s[o])}function mp(i,t,e){const n=this.cache,r=t.length,s=Tr(e,r);de(n,s)||(i.uniform1iv(this.addr,s),pe(n,s));for(let o=0;o!==r;++o)e.setTexture2DArray(t[o]||Tl,s[o])}function vp(i){switch(i){case 5126:return Jd;case 35664:return Yd;case 35665:return $d;case 35666:return tp;case 35674:return ep;case 35675:return np;case 35676:return ip;case 5124:case 35670:return rp;case 35667:case 35671:return sp;case 35668:case 35672:return op;case 35669:case 35673:return ap;case 5125:return lp;case 36294:return cp;case 36295:return up;case 36296:return fp;case 35678:case 36198:case 36298:case 36306:case 35682:return hp;case 35679:case 36299:case 36307:return dp;case 35680:case 36300:case 36308:case 36293:return pp;case 36289:case 36303:case 36311:case 36292:return mp}}class gp{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Zd(e.type)}}class xp{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=vp(e.type)}}class Mp{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const r=this.seq;for(let s=0,o=r.length;s!==o;++s){const a=r[s];a.setValue(t,e[a.id],n)}}}const os=/(\w+)(\])?(\[|\.)?/g;function Ma(i,t){i.seq.push(t),i.map[t.id]=t}function Tp(i,t,e){const n=i.name,r=n.length;for(os.lastIndex=0;;){const s=os.exec(n),o=os.lastIndex;let a=s[1];const c=s[2]==="]",l=s[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===r){Ma(e,l===void 0?new gp(a,i,t):new xp(a,i,t));break}else{let h=e.map[a];h===void 0&&(h=new Mp(a),Ma(e,h)),e=h}}}class pr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){const s=t.getActiveUniform(e,r),o=t.getUniformLocation(e,s.name);Tp(s,o,this)}}setValue(t,e,n,r){const s=this.map[e];s!==void 0&&s.setValue(t,n,r)}setOptional(t,e,n){const r=e[n];r!==void 0&&this.setValue(t,n,r)}static upload(t,e,n,r){for(let s=0,o=e.length;s!==o;++s){const a=e[s],c=n[a.id];c.needsUpdate!==!1&&a.setValue(t,c.value,r)}}static seqWithValue(t,e){const n=[];for(let r=0,s=t.length;r!==s;++r){const o=t[r];o.id in e&&n.push(o)}return n}}function Ta(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const Ep=37297;let Sp=0;function yp(i,t){const e=i.split(`
`),n=[],r=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let o=r;o<s;o++){const a=o+1;n.push(`${a===t?">":" "} ${a}: ${e[o]}`)}return n.join(`
`)}const Ea=new Ft;function Ap(i){Gt._getMatrix(Ea,Gt.workingColorSpace,i);const t=`mat3( ${Ea.elements.map(e=>e.toFixed(4))} )`;switch(Gt.getTransfer(i)){case mr:return[t,"LinearTransferOETF"];case Yt:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Sa(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=(i.getShaderInfoLog(t)||"").trim();if(n&&s==="")return"";const o=/ERROR: 0:(\d+)/.exec(s);if(o){const a=parseInt(o[1]);return e.toUpperCase()+`

`+s+`

`+yp(i.getShaderSource(t),a)}else return s}function bp(i,t){const e=Ap(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function Rp(i,t){let e;switch(t){case ec:e="Linear";break;case nc:e="Reinhard";break;case ic:e="Cineon";break;case Ba:e="ACESFilmic";break;case sc:e="AgX";break;case oc:e="Neutral";break;case rc:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const lr=new V;function Up(){Gt.getLuminanceCoefficients(lr);const i=lr.x.toFixed(4),t=lr.y.toFixed(4),e=lr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Pp(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ti).join(`
`)}function Cp(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Np(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){const s=i.getActiveAttrib(t,r),o=s.name;let a=1;s.type===i.FLOAT_MAT2&&(a=2),s.type===i.FLOAT_MAT3&&(a=3),s.type===i.FLOAT_MAT4&&(a=4),e[o]={type:s.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function Ti(i){return i!==""}function ya(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Aa(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const qp=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ys(i){return i.replace(qp,wp)}const Vp=new Map;function wp(i,t){let e=_t[t];if(e===void 0){const n=Vp.get(t);if(n!==void 0)e=_t[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Ys(e)}const Dp=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ba(i){return i.replace(Dp,Lp)}function Lp(i,t,e,n){let r="";for(let s=parseInt(t);s<parseInt(e);s++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Ra(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function Op(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===_a?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===Dl?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===sn&&(t="SHADOWMAP_TYPE_VSM"),t}function zp(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case oi:case ai:t="ENVMAP_TYPE_CUBE";break;case xr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Ip(i){let t="ENVMAP_MODE_REFLECTION";return i.envMap&&i.envMapMode===ai&&(t="ENVMAP_MODE_REFRACTION"),t}function Fp(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Wa:t="ENVMAP_BLENDING_MULTIPLY";break;case $l:t="ENVMAP_BLENDING_MIX";break;case tc:t="ENVMAP_BLENDING_ADD";break}return t}function _p(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function Wp(i,t,e,n){const r=i.getContext(),s=e.defines;let o=e.vertexShader,a=e.fragmentShader;const c=Op(e),l=zp(e),u=Ip(e),h=Fp(e),d=_p(e),p=Pp(e),g=Cp(s),x=r.createProgram();let m,f,b=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Ti).join(`
`),m.length>0&&(m+=`
`),f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Ti).join(`
`),f.length>0&&(f+=`
`)):(m=[Ra(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ti).join(`
`),f=[Ra(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+u:"",e.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Tn?"#define TONE_MAPPING":"",e.toneMapping!==Tn?_t.tonemapping_pars_fragment:"",e.toneMapping!==Tn?Rp("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",_t.colorspace_pars_fragment,bp("linearToOutputTexel",e.outputColorSpace),Up(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Ti).join(`
`)),o=Ys(o),o=ya(o,e),o=Aa(o,e),a=Ys(a),a=ya(a,e),a=Aa(a,e),o=ba(o),a=ba(a),e.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,f=["#define varying in",e.glslVersion===Oo?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Oo?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);const A=b+m+o,T=b+f+a,P=Ta(r,r.VERTEX_SHADER,A),U=Ta(r,r.FRAGMENT_SHADER,T);r.attachShader(x,P),r.attachShader(x,U),e.index0AttributeName!==void 0?r.bindAttribLocation(x,0,e.index0AttributeName):e.morphTargets===!0&&r.bindAttribLocation(x,0,"position"),r.linkProgram(x);function C(N){if(i.debug.checkShaderErrors){const z=r.getProgramInfoLog(x)||"",_=r.getShaderInfoLog(P)||"",j=r.getShaderInfoLog(U)||"",k=z.trim(),Q=_.trim(),Y=j.trim();let W=!0,st=!0;if(r.getProgramParameter(x,r.LINK_STATUS)===!1)if(W=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,x,P,U);else{const ht=Sa(r,P,"vertex"),G=Sa(r,U,"fragment");console.error("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(x,r.VALIDATE_STATUS)+`

Material Name: `+N.name+`
Material Type: `+N.type+`

Program Info Log: `+k+`
`+ht+`
`+G)}else k!==""?console.warn("THREE.WebGLProgram: Program Info Log:",k):(Q===""||Y==="")&&(st=!1);st&&(N.diagnostics={runnable:W,programLog:k,vertexShader:{log:Q,prefix:m},fragmentShader:{log:Y,prefix:f}})}r.deleteShader(P),r.deleteShader(U),w=new pr(r,x),E=Np(r,x)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let E;this.getAttributes=function(){return E===void 0&&C(this),E};let S=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return S===!1&&(S=r.getProgramParameter(x,Ep)),S},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(x),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=Sp++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=P,this.fragmentShader=U,this}let Bp=0;class kp{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,r=this._getShaderStage(e),s=this._getShaderStage(n),o=this._getShaderCacheForMaterial(t);return o.has(r)===!1&&(o.add(r),r.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new Hp(t),e.set(t,n)),n}}class Hp{constructor(t){this.id=Bp++,this.code=t,this.usedTimes=0}}function Xp(i,t,e,n,r,s,o){const a=new po,c=new kp,l=new Set,u=[],h=r.logarithmicDepthBuffer,d=r.vertexTextures;let p=r.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(E){return l.add(E),E===0?"uv":`uv${E}`}function m(E,S,N,z,_){const j=z.fog,k=_.geometry,Q=E.isMeshStandardMaterial?z.environment:null,Y=(E.isMeshStandardMaterial?e:t).get(E.envMap||Q),W=Y&&Y.mapping===xr?Y.image.height:null,st=g[E.type];E.precision!==null&&(p=r.getMaxPrecision(E.precision),p!==E.precision&&console.warn("THREE.WebGLProgram.getParameters:",E.precision,"not supported, using",p,"instead."));const ht=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,G=ht!==void 0?ht.length:0;let rt=0;k.morphAttributes.position!==void 0&&(rt=1),k.morphAttributes.normal!==void 0&&(rt=2),k.morphAttributes.color!==void 0&&(rt=3);let pt,Vt,Rt,H;if(st){const Kt=Xe[st];pt=Kt.vertexShader,Vt=Kt.fragmentShader}else pt=E.vertexShader,Vt=E.fragmentShader,c.update(E),Rt=c.getVertexShaderID(E),H=c.getFragmentShaderID(E);const Z=i.getRenderTarget(),ft=i.state.buffers.depth.getReversed(),Ct=_.isInstancedMesh===!0,Et=_.isBatchedMesh===!0,Bt=!!E.map,oe=!!E.matcap,R=!!Y,jt=!!E.aoMap,wt=!!E.lightMap,Ut=!!E.bumpMap,mt=!!E.normalMap,Zt=!!E.displacementMap,St=!!E.emissiveMap,Ot=!!E.metalnessMap,ae=!!E.roughnessMap,Qt=E.anisotropy>0,y=E.clearcoat>0,v=E.dispersion>0,O=E.iridescence>0,X=E.sheen>0,K=E.transmission>0,B=Qt&&!!E.anisotropyMap,Tt=y&&!!E.clearcoatMap,$=y&&!!E.clearcoatNormalMap,gt=y&&!!E.clearcoatRoughnessMap,xt=O&&!!E.iridescenceMap,tt=O&&!!E.iridescenceThicknessMap,at=X&&!!E.sheenColorMap,qt=X&&!!E.sheenRoughnessMap,At=!!E.specularMap,lt=!!E.specularColorMap,It=!!E.specularIntensityMap,q=K&&!!E.transmissionMap,it=K&&!!E.thicknessMap,ot=!!E.gradientMap,Mt=!!E.alphaMap,et=E.alphaTest>0,J=!!E.alphaHash,bt=!!E.extensions;let zt=Tn;E.toneMapped&&(Z===null||Z.isXRRenderTarget===!0)&&(zt=i.toneMapping);const te={shaderID:st,shaderType:E.type,shaderName:E.name,vertexShader:pt,fragmentShader:Vt,defines:E.defines,customVertexShaderID:Rt,customFragmentShaderID:H,isRawShaderMaterial:E.isRawShaderMaterial===!0,glslVersion:E.glslVersion,precision:p,batching:Et,batchingColor:Et&&_._colorsTexture!==null,instancing:Ct,instancingColor:Ct&&_.instanceColor!==null,instancingMorph:Ct&&_.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:Z===null?i.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:li,alphaToCoverage:!!E.alphaToCoverage,map:Bt,matcap:oe,envMap:R,envMapMode:R&&Y.mapping,envMapCubeUVHeight:W,aoMap:jt,lightMap:wt,bumpMap:Ut,normalMap:mt,displacementMap:d&&Zt,emissiveMap:St,normalMapObjectSpace:mt&&E.normalMapType===uc,normalMapTangentSpace:mt&&E.normalMapType===Ya,metalnessMap:Ot,roughnessMap:ae,anisotropy:Qt,anisotropyMap:B,clearcoat:y,clearcoatMap:Tt,clearcoatNormalMap:$,clearcoatRoughnessMap:gt,dispersion:v,iridescence:O,iridescenceMap:xt,iridescenceThicknessMap:tt,sheen:X,sheenColorMap:at,sheenRoughnessMap:qt,specularMap:At,specularColorMap:lt,specularIntensityMap:It,transmission:K,transmissionMap:q,thicknessMap:it,gradientMap:ot,opaque:E.transparent===!1&&E.blending===ii&&E.alphaToCoverage===!1,alphaMap:Mt,alphaTest:et,alphaHash:J,combine:E.combine,mapUv:Bt&&x(E.map.channel),aoMapUv:jt&&x(E.aoMap.channel),lightMapUv:wt&&x(E.lightMap.channel),bumpMapUv:Ut&&x(E.bumpMap.channel),normalMapUv:mt&&x(E.normalMap.channel),displacementMapUv:Zt&&x(E.displacementMap.channel),emissiveMapUv:St&&x(E.emissiveMap.channel),metalnessMapUv:Ot&&x(E.metalnessMap.channel),roughnessMapUv:ae&&x(E.roughnessMap.channel),anisotropyMapUv:B&&x(E.anisotropyMap.channel),clearcoatMapUv:Tt&&x(E.clearcoatMap.channel),clearcoatNormalMapUv:$&&x(E.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:gt&&x(E.clearcoatRoughnessMap.channel),iridescenceMapUv:xt&&x(E.iridescenceMap.channel),iridescenceThicknessMapUv:tt&&x(E.iridescenceThicknessMap.channel),sheenColorMapUv:at&&x(E.sheenColorMap.channel),sheenRoughnessMapUv:qt&&x(E.sheenRoughnessMap.channel),specularMapUv:At&&x(E.specularMap.channel),specularColorMapUv:lt&&x(E.specularColorMap.channel),specularIntensityMapUv:It&&x(E.specularIntensityMap.channel),transmissionMapUv:q&&x(E.transmissionMap.channel),thicknessMapUv:it&&x(E.thicknessMap.channel),alphaMapUv:Mt&&x(E.alphaMap.channel),vertexTangents:!!k.attributes.tangent&&(mt||Qt),vertexColors:E.vertexColors,vertexAlphas:E.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,pointsUvs:_.isPoints===!0&&!!k.attributes.uv&&(Bt||Mt),fog:!!j,useFog:E.fog===!0,fogExp2:!!j&&j.isFogExp2,flatShading:E.flatShading===!0&&E.wireframe===!1,sizeAttenuation:E.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:ft,skinning:_.isSkinnedMesh===!0,morphTargets:k.morphAttributes.position!==void 0,morphNormals:k.morphAttributes.normal!==void 0,morphColors:k.morphAttributes.color!==void 0,morphTargetsCount:G,morphTextureStride:rt,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numLightProbes:S.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:E.dithering,shadowMapEnabled:i.shadowMap.enabled&&N.length>0,shadowMapType:i.shadowMap.type,toneMapping:zt,decodeVideoTexture:Bt&&E.map.isVideoTexture===!0&&Gt.getTransfer(E.map.colorSpace)===Yt,decodeVideoTextureEmissive:St&&E.emissiveMap.isVideoTexture===!0&&Gt.getTransfer(E.emissiveMap.colorSpace)===Yt,premultipliedAlpha:E.premultipliedAlpha,doubleSided:E.side===ze,flipSided:E.side===Ae,useDepthPacking:E.depthPacking>=0,depthPacking:E.depthPacking||0,index0AttributeName:E.index0AttributeName,extensionClipCullDistance:bt&&E.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(bt&&E.extensions.multiDraw===!0||Et)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:E.customProgramCacheKey()};return te.vertexUv1s=l.has(1),te.vertexUv2s=l.has(2),te.vertexUv3s=l.has(3),l.clear(),te}function f(E){const S=[];if(E.shaderID?S.push(E.shaderID):(S.push(E.customVertexShaderID),S.push(E.customFragmentShaderID)),E.defines!==void 0)for(const N in E.defines)S.push(N),S.push(E.defines[N]);return E.isRawShaderMaterial===!1&&(b(S,E),A(S,E),S.push(i.outputColorSpace)),S.push(E.customProgramCacheKey),S.join()}function b(E,S){E.push(S.precision),E.push(S.outputColorSpace),E.push(S.envMapMode),E.push(S.envMapCubeUVHeight),E.push(S.mapUv),E.push(S.alphaMapUv),E.push(S.lightMapUv),E.push(S.aoMapUv),E.push(S.bumpMapUv),E.push(S.normalMapUv),E.push(S.displacementMapUv),E.push(S.emissiveMapUv),E.push(S.metalnessMapUv),E.push(S.roughnessMapUv),E.push(S.anisotropyMapUv),E.push(S.clearcoatMapUv),E.push(S.clearcoatNormalMapUv),E.push(S.clearcoatRoughnessMapUv),E.push(S.iridescenceMapUv),E.push(S.iridescenceThicknessMapUv),E.push(S.sheenColorMapUv),E.push(S.sheenRoughnessMapUv),E.push(S.specularMapUv),E.push(S.specularColorMapUv),E.push(S.specularIntensityMapUv),E.push(S.transmissionMapUv),E.push(S.thicknessMapUv),E.push(S.combine),E.push(S.fogExp2),E.push(S.sizeAttenuation),E.push(S.morphTargetsCount),E.push(S.morphAttributeCount),E.push(S.numDirLights),E.push(S.numPointLights),E.push(S.numSpotLights),E.push(S.numSpotLightMaps),E.push(S.numHemiLights),E.push(S.numRectAreaLights),E.push(S.numDirLightShadows),E.push(S.numPointLightShadows),E.push(S.numSpotLightShadows),E.push(S.numSpotLightShadowsWithMaps),E.push(S.numLightProbes),E.push(S.shadowMapType),E.push(S.toneMapping),E.push(S.numClippingPlanes),E.push(S.numClipIntersection),E.push(S.depthPacking)}function A(E,S){a.disableAll(),S.supportsVertexTextures&&a.enable(0),S.instancing&&a.enable(1),S.instancingColor&&a.enable(2),S.instancingMorph&&a.enable(3),S.matcap&&a.enable(4),S.envMap&&a.enable(5),S.normalMapObjectSpace&&a.enable(6),S.normalMapTangentSpace&&a.enable(7),S.clearcoat&&a.enable(8),S.iridescence&&a.enable(9),S.alphaTest&&a.enable(10),S.vertexColors&&a.enable(11),S.vertexAlphas&&a.enable(12),S.vertexUv1s&&a.enable(13),S.vertexUv2s&&a.enable(14),S.vertexUv3s&&a.enable(15),S.vertexTangents&&a.enable(16),S.anisotropy&&a.enable(17),S.alphaHash&&a.enable(18),S.batching&&a.enable(19),S.dispersion&&a.enable(20),S.batchingColor&&a.enable(21),S.gradientMap&&a.enable(22),E.push(a.mask),a.disableAll(),S.fog&&a.enable(0),S.useFog&&a.enable(1),S.flatShading&&a.enable(2),S.logarithmicDepthBuffer&&a.enable(3),S.reversedDepthBuffer&&a.enable(4),S.skinning&&a.enable(5),S.morphTargets&&a.enable(6),S.morphNormals&&a.enable(7),S.morphColors&&a.enable(8),S.premultipliedAlpha&&a.enable(9),S.shadowMapEnabled&&a.enable(10),S.doubleSided&&a.enable(11),S.flipSided&&a.enable(12),S.useDepthPacking&&a.enable(13),S.dithering&&a.enable(14),S.transmission&&a.enable(15),S.sheen&&a.enable(16),S.opaque&&a.enable(17),S.pointsUvs&&a.enable(18),S.decodeVideoTexture&&a.enable(19),S.decodeVideoTextureEmissive&&a.enable(20),S.alphaToCoverage&&a.enable(21),E.push(a.mask)}function T(E){const S=g[E.type];let N;if(S){const z=Xe[S];N=tu.clone(z.uniforms)}else N=E.uniforms;return N}function P(E,S){let N;for(let z=0,_=u.length;z<_;z++){const j=u[z];if(j.cacheKey===S){N=j,++N.usedTimes;break}}return N===void 0&&(N=new Wp(i,S,E,s),u.push(N)),N}function U(E){if(--E.usedTimes===0){const S=u.indexOf(E);u[S]=u[u.length-1],u.pop(),E.destroy()}}function C(E){c.remove(E)}function w(){c.dispose()}return{getParameters:m,getProgramCacheKey:f,getUniforms:T,acquireProgram:P,releaseProgram:U,releaseShaderCache:C,programs:u,dispose:w}}function Gp(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function r(o,a,c){i.get(o)[a]=c}function s(){i=new WeakMap}return{has:t,get:e,remove:n,update:r,dispose:s}}function Qp(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function Ua(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Pa(){const i=[];let t=0;const e=[],n=[],r=[];function s(){t=0,e.length=0,n.length=0,r.length=0}function o(h,d,p,g,x,m){let f=i[t];return f===void 0?(f={id:h.id,object:h,geometry:d,material:p,groupOrder:g,renderOrder:h.renderOrder,z:x,group:m},i[t]=f):(f.id=h.id,f.object=h,f.geometry=d,f.material=p,f.groupOrder=g,f.renderOrder=h.renderOrder,f.z=x,f.group=m),t++,f}function a(h,d,p,g,x,m){const f=o(h,d,p,g,x,m);p.transmission>0?n.push(f):p.transparent===!0?r.push(f):e.push(f)}function c(h,d,p,g,x,m){const f=o(h,d,p,g,x,m);p.transmission>0?n.unshift(f):p.transparent===!0?r.unshift(f):e.unshift(f)}function l(h,d){e.length>1&&e.sort(h||Qp),n.length>1&&n.sort(d||Ua),r.length>1&&r.sort(d||Ua)}function u(){for(let h=t,d=i.length;h<d;h++){const p=i[h];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:n,transparent:r,init:s,push:a,unshift:c,finish:u,sort:l}}function Kp(){let i=new WeakMap;function t(n,r){const s=i.get(n);let o;return s===void 0?(o=new Pa,i.set(n,[o])):r>=s.length?(o=new Pa,s.push(o)):o=s[r],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function jp(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new V,color:new kt};break;case"SpotLight":e={position:new V,direction:new V,color:new kt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new V,color:new kt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new V,skyColor:new kt,groundColor:new kt};break;case"RectAreaLight":e={color:new kt,position:new V,halfWidth:new V,halfHeight:new V};break}return i[t.id]=e,e}}}function Zp(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new dt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new dt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new dt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let Jp=0;function Yp(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function $p(i){const t=new jp,e=Zp(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new V);const r=new V,s=new se,o=new se;function a(l){let u=0,h=0,d=0;for(let E=0;E<9;E++)n.probe[E].set(0,0,0);let p=0,g=0,x=0,m=0,f=0,b=0,A=0,T=0,P=0,U=0,C=0;l.sort(Yp);for(let E=0,S=l.length;E<S;E++){const N=l[E],z=N.color,_=N.intensity,j=N.distance,k=N.shadow&&N.shadow.map?N.shadow.map.texture:null;if(N.isAmbientLight)u+=z.r*_,h+=z.g*_,d+=z.b*_;else if(N.isLightProbe){for(let Q=0;Q<9;Q++)n.probe[Q].addScaledVector(N.sh.coefficients[Q],_);C++}else if(N.isDirectionalLight){const Q=t.get(N);if(Q.color.copy(N.color).multiplyScalar(N.intensity),N.castShadow){const Y=N.shadow,W=e.get(N);W.shadowIntensity=Y.intensity,W.shadowBias=Y.bias,W.shadowNormalBias=Y.normalBias,W.shadowRadius=Y.radius,W.shadowMapSize=Y.mapSize,n.directionalShadow[p]=W,n.directionalShadowMap[p]=k,n.directionalShadowMatrix[p]=N.shadow.matrix,b++}n.directional[p]=Q,p++}else if(N.isSpotLight){const Q=t.get(N);Q.position.setFromMatrixPosition(N.matrixWorld),Q.color.copy(z).multiplyScalar(_),Q.distance=j,Q.coneCos=Math.cos(N.angle),Q.penumbraCos=Math.cos(N.angle*(1-N.penumbra)),Q.decay=N.decay,n.spot[x]=Q;const Y=N.shadow;if(N.map&&(n.spotLightMap[P]=N.map,P++,Y.updateMatrices(N),N.castShadow&&U++),n.spotLightMatrix[x]=Y.matrix,N.castShadow){const W=e.get(N);W.shadowIntensity=Y.intensity,W.shadowBias=Y.bias,W.shadowNormalBias=Y.normalBias,W.shadowRadius=Y.radius,W.shadowMapSize=Y.mapSize,n.spotShadow[x]=W,n.spotShadowMap[x]=k,T++}x++}else if(N.isRectAreaLight){const Q=t.get(N);Q.color.copy(z).multiplyScalar(_),Q.halfWidth.set(N.width*.5,0,0),Q.halfHeight.set(0,N.height*.5,0),n.rectArea[m]=Q,m++}else if(N.isPointLight){const Q=t.get(N);if(Q.color.copy(N.color).multiplyScalar(N.intensity),Q.distance=N.distance,Q.decay=N.decay,N.castShadow){const Y=N.shadow,W=e.get(N);W.shadowIntensity=Y.intensity,W.shadowBias=Y.bias,W.shadowNormalBias=Y.normalBias,W.shadowRadius=Y.radius,W.shadowMapSize=Y.mapSize,W.shadowCameraNear=Y.camera.near,W.shadowCameraFar=Y.camera.far,n.pointShadow[g]=W,n.pointShadowMap[g]=k,n.pointShadowMatrix[g]=N.shadow.matrix,A++}n.point[g]=Q,g++}else if(N.isHemisphereLight){const Q=t.get(N);Q.skyColor.copy(N.color).multiplyScalar(_),Q.groundColor.copy(N.groundColor).multiplyScalar(_),n.hemi[f]=Q,f++}}m>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ct.LTC_FLOAT_1,n.rectAreaLTC2=ct.LTC_FLOAT_2):(n.rectAreaLTC1=ct.LTC_HALF_1,n.rectAreaLTC2=ct.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=h,n.ambient[2]=d;const w=n.hash;(w.directionalLength!==p||w.pointLength!==g||w.spotLength!==x||w.rectAreaLength!==m||w.hemiLength!==f||w.numDirectionalShadows!==b||w.numPointShadows!==A||w.numSpotShadows!==T||w.numSpotMaps!==P||w.numLightProbes!==C)&&(n.directional.length=p,n.spot.length=x,n.rectArea.length=m,n.point.length=g,n.hemi.length=f,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.pointShadow.length=A,n.pointShadowMap.length=A,n.spotShadow.length=T,n.spotShadowMap.length=T,n.directionalShadowMatrix.length=b,n.pointShadowMatrix.length=A,n.spotLightMatrix.length=T+P-U,n.spotLightMap.length=P,n.numSpotLightShadowsWithMaps=U,n.numLightProbes=C,w.directionalLength=p,w.pointLength=g,w.spotLength=x,w.rectAreaLength=m,w.hemiLength=f,w.numDirectionalShadows=b,w.numPointShadows=A,w.numSpotShadows=T,w.numSpotMaps=P,w.numLightProbes=C,n.version=Jp++)}function c(l,u){let h=0,d=0,p=0,g=0,x=0;const m=u.matrixWorldInverse;for(let f=0,b=l.length;f<b;f++){const A=l[f];if(A.isDirectionalLight){const T=n.directional[h];T.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),T.direction.sub(r),T.direction.transformDirection(m),h++}else if(A.isSpotLight){const T=n.spot[p];T.position.setFromMatrixPosition(A.matrixWorld),T.position.applyMatrix4(m),T.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),T.direction.sub(r),T.direction.transformDirection(m),p++}else if(A.isRectAreaLight){const T=n.rectArea[g];T.position.setFromMatrixPosition(A.matrixWorld),T.position.applyMatrix4(m),o.identity(),s.copy(A.matrixWorld),s.premultiply(m),o.extractRotation(s),T.halfWidth.set(A.width*.5,0,0),T.halfHeight.set(0,A.height*.5,0),T.halfWidth.applyMatrix4(o),T.halfHeight.applyMatrix4(o),g++}else if(A.isPointLight){const T=n.point[d];T.position.setFromMatrixPosition(A.matrixWorld),T.position.applyMatrix4(m),d++}else if(A.isHemisphereLight){const T=n.hemi[x];T.direction.setFromMatrixPosition(A.matrixWorld),T.direction.transformDirection(m),x++}}}return{setup:a,setupView:c,state:n}}function Ca(i){const t=new $p(i),e=[],n=[];function r(u){l.camera=u,e.length=0,n.length=0}function s(u){e.push(u)}function o(u){n.push(u)}function a(){t.setup(e)}function c(u){t.setupView(e,u)}const l={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:r,state:l,setupLights:a,setupLightsView:c,pushLight:s,pushShadow:o}}function tm(i){let t=new WeakMap;function e(r,s=0){const o=t.get(r);let a;return o===void 0?(a=new Ca(i),t.set(r,[a])):s>=o.length?(a=new Ca(i),o.push(a)):a=o[s],a}function n(){t=new WeakMap}return{get:e,dispose:n}}const em=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,nm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function im(i,t,e){let n=new mo;const r=new dt,s=new dt,o=new ce,a=new Au({depthPacking:cc}),c=new bu,l={},u=e.maxTextureSize,h={[je]:Ae,[Ae]:je,[ze]:ze},d=new cn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new dt},radius:{value:4}},vertexShader:em,fragmentShader:nm}),p=d.clone();p.defines.HORIZONTAL_PASS=1;const g=new Ne;g.setAttribute("position",new Ke(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new ve(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=_a;let f=this.type;this.render=function(U,C,w){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||U.length===0)return;const E=i.getRenderTarget(),S=i.getActiveCubeFace(),N=i.getActiveMipmapLevel(),z=i.state;z.setBlending(Mn),z.buffers.depth.getReversed()===!0?z.buffers.color.setClear(0,0,0,0):z.buffers.color.setClear(1,1,1,1),z.buffers.depth.setTest(!0),z.setScissorTest(!1);const _=f!==sn&&this.type===sn,j=f===sn&&this.type!==sn;for(let k=0,Q=U.length;k<Q;k++){const Y=U[k],W=Y.shadow;if(W===void 0){console.warn("THREE.WebGLShadowMap:",Y,"has no shadow.");continue}if(W.autoUpdate===!1&&W.needsUpdate===!1)continue;r.copy(W.mapSize);const st=W.getFrameExtents();if(r.multiply(st),s.copy(W.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/st.x),r.x=s.x*st.x,W.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/st.y),r.y=s.y*st.y,W.mapSize.y=s.y)),W.map===null||_===!0||j===!0){const G=this.type!==sn?{minFilter:ke,magFilter:ke}:{};W.map!==null&&W.map.dispose(),W.map=new zn(r.x,r.y,G),W.map.texture.name=Y.name+".shadowMap",W.camera.updateProjectionMatrix()}i.setRenderTarget(W.map),i.clear();const ht=W.getViewportCount();for(let G=0;G<ht;G++){const rt=W.getViewport(G);o.set(s.x*rt.x,s.y*rt.y,s.x*rt.z,s.y*rt.w),z.viewport(o),W.updateMatrices(Y,G),n=W.getFrustum(),T(C,w,W.camera,Y,this.type)}W.isPointLightShadow!==!0&&this.type===sn&&b(W,w),W.needsUpdate=!1}f=this.type,m.needsUpdate=!1,i.setRenderTarget(E,S,N)};function b(U,C){const w=t.update(x);d.defines.VSM_SAMPLES!==U.blurSamples&&(d.defines.VSM_SAMPLES=U.blurSamples,p.defines.VSM_SAMPLES=U.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),U.mapPass===null&&(U.mapPass=new zn(r.x,r.y)),d.uniforms.shadow_pass.value=U.map.texture,d.uniforms.resolution.value=U.mapSize,d.uniforms.radius.value=U.radius,i.setRenderTarget(U.mapPass),i.clear(),i.renderBufferDirect(C,null,w,d,x,null),p.uniforms.shadow_pass.value=U.mapPass.texture,p.uniforms.resolution.value=U.mapSize,p.uniforms.radius.value=U.radius,i.setRenderTarget(U.map),i.clear(),i.renderBufferDirect(C,null,w,p,x,null)}function A(U,C,w,E){let S=null;const N=w.isPointLight===!0?U.customDistanceMaterial:U.customDepthMaterial;if(N!==void 0)S=N;else if(S=w.isPointLight===!0?c:a,i.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){const z=S.uuid,_=C.uuid;let j=l[z];j===void 0&&(j={},l[z]=j);let k=j[_];k===void 0&&(k=S.clone(),j[_]=k,C.addEventListener("dispose",P)),S=k}if(S.visible=C.visible,S.wireframe=C.wireframe,E===sn?S.side=C.shadowSide!==null?C.shadowSide:C.side:S.side=C.shadowSide!==null?C.shadowSide:h[C.side],S.alphaMap=C.alphaMap,S.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,S.map=C.map,S.clipShadows=C.clipShadows,S.clippingPlanes=C.clippingPlanes,S.clipIntersection=C.clipIntersection,S.displacementMap=C.displacementMap,S.displacementScale=C.displacementScale,S.displacementBias=C.displacementBias,S.wireframeLinewidth=C.wireframeLinewidth,S.linewidth=C.linewidth,w.isPointLight===!0&&S.isMeshDistanceMaterial===!0){const z=i.properties.get(S);z.light=w}return S}function T(U,C,w,E,S){if(U.visible===!1)return;if(U.layers.test(C.layers)&&(U.isMesh||U.isLine||U.isPoints)&&(U.castShadow||U.receiveShadow&&S===sn)&&(!U.frustumCulled||n.intersectsObject(U))){U.modelViewMatrix.multiplyMatrices(w.matrixWorldInverse,U.matrixWorld);const _=t.update(U),j=U.material;if(Array.isArray(j)){const k=_.groups;for(let Q=0,Y=k.length;Q<Y;Q++){const W=k[Q],st=j[W.materialIndex];if(st&&st.visible){const ht=A(U,st,E,S);U.onBeforeShadow(i,U,C,w,_,ht,W),i.renderBufferDirect(w,null,_,ht,U,W),U.onAfterShadow(i,U,C,w,_,ht,W)}}}else if(j.visible){const k=A(U,j,E,S);U.onBeforeShadow(i,U,C,w,_,k,null),i.renderBufferDirect(w,null,_,k,U,null),U.onAfterShadow(i,U,C,w,_,k,null)}}const z=U.children;for(let _=0,j=z.length;_<j;_++)T(z[_],C,w,E,S)}function P(U){U.target.removeEventListener("dispose",P);for(const w in l){const E=l[w],S=U.target.uuid;S in E&&(E[S].dispose(),delete E[S])}}}const rm={[fs]:hs,[ds]:vs,[ps]:gs,[si]:ms,[hs]:fs,[vs]:ds,[gs]:ps,[ms]:si};function sm(i,t){function e(){let q=!1;const it=new ce;let ot=null;const Mt=new ce(0,0,0,0);return{setMask:function(et){ot!==et&&!q&&(i.colorMask(et,et,et,et),ot=et)},setLocked:function(et){q=et},setClear:function(et,J,bt,zt,te){te===!0&&(et*=zt,J*=zt,bt*=zt),it.set(et,J,bt,zt),Mt.equals(it)===!1&&(i.clearColor(et,J,bt,zt),Mt.copy(it))},reset:function(){q=!1,ot=null,Mt.set(-1,0,0,0)}}}function n(){let q=!1,it=!1,ot=null,Mt=null,et=null;return{setReversed:function(J){if(it!==J){const bt=t.get("EXT_clip_control");J?bt.clipControlEXT(bt.LOWER_LEFT_EXT,bt.ZERO_TO_ONE_EXT):bt.clipControlEXT(bt.LOWER_LEFT_EXT,bt.NEGATIVE_ONE_TO_ONE_EXT),it=J;const zt=et;et=null,this.setClear(zt)}},getReversed:function(){return it},setTest:function(J){J?Z(i.DEPTH_TEST):ft(i.DEPTH_TEST)},setMask:function(J){ot!==J&&!q&&(i.depthMask(J),ot=J)},setFunc:function(J){if(it&&(J=rm[J]),Mt!==J){switch(J){case fs:i.depthFunc(i.NEVER);break;case hs:i.depthFunc(i.ALWAYS);break;case ds:i.depthFunc(i.LESS);break;case si:i.depthFunc(i.LEQUAL);break;case ps:i.depthFunc(i.EQUAL);break;case ms:i.depthFunc(i.GEQUAL);break;case vs:i.depthFunc(i.GREATER);break;case gs:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}Mt=J}},setLocked:function(J){q=J},setClear:function(J){et!==J&&(it&&(J=1-J),i.clearDepth(J),et=J)},reset:function(){q=!1,ot=null,Mt=null,et=null,it=!1}}}function r(){let q=!1,it=null,ot=null,Mt=null,et=null,J=null,bt=null,zt=null,te=null;return{setTest:function(Kt){q||(Kt?Z(i.STENCIL_TEST):ft(i.STENCIL_TEST))},setMask:function(Kt){it!==Kt&&!q&&(i.stencilMask(Kt),it=Kt)},setFunc:function(Kt,Ye,He){(ot!==Kt||Mt!==Ye||et!==He)&&(i.stencilFunc(Kt,Ye,He),ot=Kt,Mt=Ye,et=He)},setOp:function(Kt,Ye,He){(J!==Kt||bt!==Ye||zt!==He)&&(i.stencilOp(Kt,Ye,He),J=Kt,bt=Ye,zt=He)},setLocked:function(Kt){q=Kt},setClear:function(Kt){te!==Kt&&(i.clearStencil(Kt),te=Kt)},reset:function(){q=!1,it=null,ot=null,Mt=null,et=null,J=null,bt=null,zt=null,te=null}}}const s=new e,o=new n,a=new r,c=new WeakMap,l=new WeakMap;let u={},h={},d=new WeakMap,p=[],g=null,x=!1,m=null,f=null,b=null,A=null,T=null,P=null,U=null,C=new kt(0,0,0),w=0,E=!1,S=null,N=null,z=null,_=null,j=null;const k=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let Q=!1,Y=0;const W=i.getParameter(i.VERSION);W.indexOf("WebGL")!==-1?(Y=parseFloat(/^WebGL (\d)/.exec(W)[1]),Q=Y>=1):W.indexOf("OpenGL ES")!==-1&&(Y=parseFloat(/^OpenGL ES (\d)/.exec(W)[1]),Q=Y>=2);let st=null,ht={};const G=i.getParameter(i.SCISSOR_BOX),rt=i.getParameter(i.VIEWPORT),pt=new ce().fromArray(G),Vt=new ce().fromArray(rt);function Rt(q,it,ot,Mt){const et=new Uint8Array(4),J=i.createTexture();i.bindTexture(q,J),i.texParameteri(q,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(q,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let bt=0;bt<ot;bt++)q===i.TEXTURE_3D||q===i.TEXTURE_2D_ARRAY?i.texImage3D(it,0,i.RGBA,1,1,Mt,0,i.RGBA,i.UNSIGNED_BYTE,et):i.texImage2D(it+bt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,et);return J}const H={};H[i.TEXTURE_2D]=Rt(i.TEXTURE_2D,i.TEXTURE_2D,1),H[i.TEXTURE_CUBE_MAP]=Rt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),H[i.TEXTURE_2D_ARRAY]=Rt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),H[i.TEXTURE_3D]=Rt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),Z(i.DEPTH_TEST),o.setFunc(si),Ut(!1),mt(No),Z(i.CULL_FACE),jt(Mn);function Z(q){u[q]!==!0&&(i.enable(q),u[q]=!0)}function ft(q){u[q]!==!1&&(i.disable(q),u[q]=!1)}function Ct(q,it){return h[q]!==it?(i.bindFramebuffer(q,it),h[q]=it,q===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=it),q===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=it),!0):!1}function Et(q,it){let ot=p,Mt=!1;if(q){ot=d.get(it),ot===void 0&&(ot=[],d.set(it,ot));const et=q.textures;if(ot.length!==et.length||ot[0]!==i.COLOR_ATTACHMENT0){for(let J=0,bt=et.length;J<bt;J++)ot[J]=i.COLOR_ATTACHMENT0+J;ot.length=et.length,Mt=!0}}else ot[0]!==i.BACK&&(ot[0]=i.BACK,Mt=!0);Mt&&i.drawBuffers(ot)}function Bt(q){return g!==q?(i.useProgram(q),g=q,!0):!1}const oe={[qn]:i.FUNC_ADD,[Ol]:i.FUNC_SUBTRACT,[zl]:i.FUNC_REVERSE_SUBTRACT};oe[Il]=i.MIN,oe[Fl]=i.MAX;const R={[_l]:i.ZERO,[Wl]:i.ONE,[Bl]:i.SRC_COLOR,[cs]:i.SRC_ALPHA,[Kl]:i.SRC_ALPHA_SATURATE,[Gl]:i.DST_COLOR,[Hl]:i.DST_ALPHA,[kl]:i.ONE_MINUS_SRC_COLOR,[us]:i.ONE_MINUS_SRC_ALPHA,[Ql]:i.ONE_MINUS_DST_COLOR,[Xl]:i.ONE_MINUS_DST_ALPHA,[jl]:i.CONSTANT_COLOR,[Zl]:i.ONE_MINUS_CONSTANT_COLOR,[Jl]:i.CONSTANT_ALPHA,[Yl]:i.ONE_MINUS_CONSTANT_ALPHA};function jt(q,it,ot,Mt,et,J,bt,zt,te,Kt){if(q===Mn){x===!0&&(ft(i.BLEND),x=!1);return}if(x===!1&&(Z(i.BLEND),x=!0),q!==Ll){if(q!==m||Kt!==E){if((f!==qn||T!==qn)&&(i.blendEquation(i.FUNC_ADD),f=qn,T=qn),Kt)switch(q){case ii:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case qo:i.blendFunc(i.ONE,i.ONE);break;case Vo:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case wo:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:console.error("THREE.WebGLState: Invalid blending: ",q);break}else switch(q){case ii:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case qo:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Vo:console.error("THREE.WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case wo:console.error("THREE.WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:console.error("THREE.WebGLState: Invalid blending: ",q);break}b=null,A=null,P=null,U=null,C.set(0,0,0),w=0,m=q,E=Kt}return}et=et||it,J=J||ot,bt=bt||Mt,(it!==f||et!==T)&&(i.blendEquationSeparate(oe[it],oe[et]),f=it,T=et),(ot!==b||Mt!==A||J!==P||bt!==U)&&(i.blendFuncSeparate(R[ot],R[Mt],R[J],R[bt]),b=ot,A=Mt,P=J,U=bt),(zt.equals(C)===!1||te!==w)&&(i.blendColor(zt.r,zt.g,zt.b,te),C.copy(zt),w=te),m=q,E=!1}function wt(q,it){q.side===ze?ft(i.CULL_FACE):Z(i.CULL_FACE);let ot=q.side===Ae;it&&(ot=!ot),Ut(ot),q.blending===ii&&q.transparent===!1?jt(Mn):jt(q.blending,q.blendEquation,q.blendSrc,q.blendDst,q.blendEquationAlpha,q.blendSrcAlpha,q.blendDstAlpha,q.blendColor,q.blendAlpha,q.premultipliedAlpha),o.setFunc(q.depthFunc),o.setTest(q.depthTest),o.setMask(q.depthWrite),s.setMask(q.colorWrite);const Mt=q.stencilWrite;a.setTest(Mt),Mt&&(a.setMask(q.stencilWriteMask),a.setFunc(q.stencilFunc,q.stencilRef,q.stencilFuncMask),a.setOp(q.stencilFail,q.stencilZFail,q.stencilZPass)),St(q.polygonOffset,q.polygonOffsetFactor,q.polygonOffsetUnits),q.alphaToCoverage===!0?Z(i.SAMPLE_ALPHA_TO_COVERAGE):ft(i.SAMPLE_ALPHA_TO_COVERAGE)}function Ut(q){S!==q&&(q?i.frontFace(i.CW):i.frontFace(i.CCW),S=q)}function mt(q){q!==Vl?(Z(i.CULL_FACE),q!==N&&(q===No?i.cullFace(i.BACK):q===wl?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ft(i.CULL_FACE),N=q}function Zt(q){q!==z&&(Q&&i.lineWidth(q),z=q)}function St(q,it,ot){q?(Z(i.POLYGON_OFFSET_FILL),(_!==it||j!==ot)&&(i.polygonOffset(it,ot),_=it,j=ot)):ft(i.POLYGON_OFFSET_FILL)}function Ot(q){q?Z(i.SCISSOR_TEST):ft(i.SCISSOR_TEST)}function ae(q){q===void 0&&(q=i.TEXTURE0+k-1),st!==q&&(i.activeTexture(q),st=q)}function Qt(q,it,ot){ot===void 0&&(st===null?ot=i.TEXTURE0+k-1:ot=st);let Mt=ht[ot];Mt===void 0&&(Mt={type:void 0,texture:void 0},ht[ot]=Mt),(Mt.type!==q||Mt.texture!==it)&&(st!==ot&&(i.activeTexture(ot),st=ot),i.bindTexture(q,it||H[q]),Mt.type=q,Mt.texture=it)}function y(){const q=ht[st];q!==void 0&&q.type!==void 0&&(i.bindTexture(q.type,null),q.type=void 0,q.texture=void 0)}function v(){try{i.compressedTexImage2D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function O(){try{i.compressedTexImage3D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function X(){try{i.texSubImage2D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function K(){try{i.texSubImage3D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function B(){try{i.compressedTexSubImage2D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function Tt(){try{i.compressedTexSubImage3D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function $(){try{i.texStorage2D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function gt(){try{i.texStorage3D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function xt(){try{i.texImage2D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function tt(){try{i.texImage3D(...arguments)}catch(q){console.error("THREE.WebGLState:",q)}}function at(q){pt.equals(q)===!1&&(i.scissor(q.x,q.y,q.z,q.w),pt.copy(q))}function qt(q){Vt.equals(q)===!1&&(i.viewport(q.x,q.y,q.z,q.w),Vt.copy(q))}function At(q,it){let ot=l.get(it);ot===void 0&&(ot=new WeakMap,l.set(it,ot));let Mt=ot.get(q);Mt===void 0&&(Mt=i.getUniformBlockIndex(it,q.name),ot.set(q,Mt))}function lt(q,it){const Mt=l.get(it).get(q);c.get(it)!==Mt&&(i.uniformBlockBinding(it,Mt,q.__bindingPointIndex),c.set(it,Mt))}function It(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},st=null,ht={},h={},d=new WeakMap,p=[],g=null,x=!1,m=null,f=null,b=null,A=null,T=null,P=null,U=null,C=new kt(0,0,0),w=0,E=!1,S=null,N=null,z=null,_=null,j=null,pt.set(0,0,i.canvas.width,i.canvas.height),Vt.set(0,0,i.canvas.width,i.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:Z,disable:ft,bindFramebuffer:Ct,drawBuffers:Et,useProgram:Bt,setBlending:jt,setMaterial:wt,setFlipSided:Ut,setCullFace:mt,setLineWidth:Zt,setPolygonOffset:St,setScissorTest:Ot,activeTexture:ae,bindTexture:Qt,unbindTexture:y,compressedTexImage2D:v,compressedTexImage3D:O,texImage2D:xt,texImage3D:tt,updateUBOMapping:At,uniformBlockBinding:lt,texStorage2D:$,texStorage3D:gt,texSubImage2D:X,texSubImage3D:K,compressedTexSubImage2D:B,compressedTexSubImage3D:Tt,scissor:at,viewport:qt,reset:It}}function om(i,t,e,n,r,s,o){const a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new dt,u=new WeakMap;let h;const d=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(y,v){return p?new OffscreenCanvas(y,v):gr("canvas")}function x(y,v,O){let X=1;const K=Qt(y);if((K.width>O||K.height>O)&&(X=O/Math.max(K.width,K.height)),X<1)if(typeof HTMLImageElement<"u"&&y instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&y instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&y instanceof ImageBitmap||typeof VideoFrame<"u"&&y instanceof VideoFrame){const B=Math.floor(X*K.width),Tt=Math.floor(X*K.height);h===void 0&&(h=g(B,Tt));const $=v?g(B,Tt):h;return $.width=B,$.height=Tt,$.getContext("2d").drawImage(y,0,0,B,Tt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+K.width+"x"+K.height+") to ("+B+"x"+Tt+")."),$}else return"data"in y&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+K.width+"x"+K.height+")."),y;return y}function m(y){return y.generateMipmaps}function f(y){i.generateMipmap(y)}function b(y){return y.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:y.isWebGL3DRenderTarget?i.TEXTURE_3D:y.isWebGLArrayRenderTarget||y.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function A(y,v,O,X,K=!1){if(y!==null){if(i[y]!==void 0)return i[y];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+y+"'")}let B=v;if(v===i.RED&&(O===i.FLOAT&&(B=i.R32F),O===i.HALF_FLOAT&&(B=i.R16F),O===i.UNSIGNED_BYTE&&(B=i.R8)),v===i.RED_INTEGER&&(O===i.UNSIGNED_BYTE&&(B=i.R8UI),O===i.UNSIGNED_SHORT&&(B=i.R16UI),O===i.UNSIGNED_INT&&(B=i.R32UI),O===i.BYTE&&(B=i.R8I),O===i.SHORT&&(B=i.R16I),O===i.INT&&(B=i.R32I)),v===i.RG&&(O===i.FLOAT&&(B=i.RG32F),O===i.HALF_FLOAT&&(B=i.RG16F),O===i.UNSIGNED_BYTE&&(B=i.RG8)),v===i.RG_INTEGER&&(O===i.UNSIGNED_BYTE&&(B=i.RG8UI),O===i.UNSIGNED_SHORT&&(B=i.RG16UI),O===i.UNSIGNED_INT&&(B=i.RG32UI),O===i.BYTE&&(B=i.RG8I),O===i.SHORT&&(B=i.RG16I),O===i.INT&&(B=i.RG32I)),v===i.RGB_INTEGER&&(O===i.UNSIGNED_BYTE&&(B=i.RGB8UI),O===i.UNSIGNED_SHORT&&(B=i.RGB16UI),O===i.UNSIGNED_INT&&(B=i.RGB32UI),O===i.BYTE&&(B=i.RGB8I),O===i.SHORT&&(B=i.RGB16I),O===i.INT&&(B=i.RGB32I)),v===i.RGBA_INTEGER&&(O===i.UNSIGNED_BYTE&&(B=i.RGBA8UI),O===i.UNSIGNED_SHORT&&(B=i.RGBA16UI),O===i.UNSIGNED_INT&&(B=i.RGBA32UI),O===i.BYTE&&(B=i.RGBA8I),O===i.SHORT&&(B=i.RGBA16I),O===i.INT&&(B=i.RGBA32I)),v===i.RGB&&(O===i.UNSIGNED_INT_5_9_9_9_REV&&(B=i.RGB9_E5),O===i.UNSIGNED_INT_10F_11F_11F_REV&&(B=i.R11F_G11F_B10F)),v===i.RGBA){const Tt=K?mr:Gt.getTransfer(X);O===i.FLOAT&&(B=i.RGBA32F),O===i.HALF_FLOAT&&(B=i.RGBA16F),O===i.UNSIGNED_BYTE&&(B=Tt===Yt?i.SRGB8_ALPHA8:i.RGBA8),O===i.UNSIGNED_SHORT_4_4_4_4&&(B=i.RGBA4),O===i.UNSIGNED_SHORT_5_5_5_1&&(B=i.RGB5_A1)}return(B===i.R16F||B===i.R32F||B===i.RG16F||B===i.RG32F||B===i.RGBA16F||B===i.RGBA32F)&&t.get("EXT_color_buffer_float"),B}function T(y,v){let O;return y?v===null||v===On||v===Ui?O=i.DEPTH24_STENCIL8:v===an?O=i.DEPTH32F_STENCIL8:v===Ri&&(O=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===On||v===Ui?O=i.DEPTH_COMPONENT24:v===an?O=i.DEPTH_COMPONENT32F:v===Ri&&(O=i.DEPTH_COMPONENT16),O}function P(y,v){return m(y)===!0||y.isFramebufferTexture&&y.minFilter!==ke&&y.minFilter!==Ge?Math.log2(Math.max(v.width,v.height))+1:y.mipmaps!==void 0&&y.mipmaps.length>0?y.mipmaps.length:y.isCompressedTexture&&Array.isArray(y.image)?v.mipmaps.length:1}function U(y){const v=y.target;v.removeEventListener("dispose",U),w(v),v.isVideoTexture&&u.delete(v)}function C(y){const v=y.target;v.removeEventListener("dispose",C),S(v)}function w(y){const v=n.get(y);if(v.__webglInit===void 0)return;const O=y.source,X=d.get(O);if(X){const K=X[v.__cacheKey];K.usedTimes--,K.usedTimes===0&&E(y),Object.keys(X).length===0&&d.delete(O)}n.remove(y)}function E(y){const v=n.get(y);i.deleteTexture(v.__webglTexture);const O=y.source,X=d.get(O);delete X[v.__cacheKey],o.memory.textures--}function S(y){const v=n.get(y);if(y.depthTexture&&(y.depthTexture.dispose(),n.remove(y.depthTexture)),y.isWebGLCubeRenderTarget)for(let X=0;X<6;X++){if(Array.isArray(v.__webglFramebuffer[X]))for(let K=0;K<v.__webglFramebuffer[X].length;K++)i.deleteFramebuffer(v.__webglFramebuffer[X][K]);else i.deleteFramebuffer(v.__webglFramebuffer[X]);v.__webglDepthbuffer&&i.deleteRenderbuffer(v.__webglDepthbuffer[X])}else{if(Array.isArray(v.__webglFramebuffer))for(let X=0;X<v.__webglFramebuffer.length;X++)i.deleteFramebuffer(v.__webglFramebuffer[X]);else i.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&i.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&i.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let X=0;X<v.__webglColorRenderbuffer.length;X++)v.__webglColorRenderbuffer[X]&&i.deleteRenderbuffer(v.__webglColorRenderbuffer[X]);v.__webglDepthRenderbuffer&&i.deleteRenderbuffer(v.__webglDepthRenderbuffer)}const O=y.textures;for(let X=0,K=O.length;X<K;X++){const B=n.get(O[X]);B.__webglTexture&&(i.deleteTexture(B.__webglTexture),o.memory.textures--),n.remove(O[X])}n.remove(y)}let N=0;function z(){N=0}function _(){const y=N;return y>=r.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+y+" texture units while this GPU supports only "+r.maxTextures),N+=1,y}function j(y){const v=[];return v.push(y.wrapS),v.push(y.wrapT),v.push(y.wrapR||0),v.push(y.magFilter),v.push(y.minFilter),v.push(y.anisotropy),v.push(y.internalFormat),v.push(y.format),v.push(y.type),v.push(y.generateMipmaps),v.push(y.premultiplyAlpha),v.push(y.flipY),v.push(y.unpackAlignment),v.push(y.colorSpace),v.join()}function k(y,v){const O=n.get(y);if(y.isVideoTexture&&Ot(y),y.isRenderTargetTexture===!1&&y.isExternalTexture!==!0&&y.version>0&&O.__version!==y.version){const X=y.image;if(X===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(X.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{H(O,y,v);return}}else y.isExternalTexture&&(O.__webglTexture=y.sourceTexture?y.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,O.__webglTexture,i.TEXTURE0+v)}function Q(y,v){const O=n.get(y);if(y.isRenderTargetTexture===!1&&y.version>0&&O.__version!==y.version){H(O,y,v);return}e.bindTexture(i.TEXTURE_2D_ARRAY,O.__webglTexture,i.TEXTURE0+v)}function Y(y,v){const O=n.get(y);if(y.isRenderTargetTexture===!1&&y.version>0&&O.__version!==y.version){H(O,y,v);return}e.bindTexture(i.TEXTURE_3D,O.__webglTexture,i.TEXTURE0+v)}function W(y,v){const O=n.get(y);if(y.version>0&&O.__version!==y.version){Z(O,y,v);return}e.bindTexture(i.TEXTURE_CUBE_MAP,O.__webglTexture,i.TEXTURE0+v)}const st={[Ts]:i.REPEAT,[wn]:i.CLAMP_TO_EDGE,[Es]:i.MIRRORED_REPEAT},ht={[ke]:i.NEAREST,[ac]:i.NEAREST_MIPMAP_NEAREST,[Wi]:i.NEAREST_MIPMAP_LINEAR,[Ge]:i.LINEAR,[Ur]:i.LINEAR_MIPMAP_NEAREST,[Dn]:i.LINEAR_MIPMAP_LINEAR},G={[fc]:i.NEVER,[gc]:i.ALWAYS,[hc]:i.LESS,[$a]:i.LEQUAL,[dc]:i.EQUAL,[vc]:i.GEQUAL,[pc]:i.GREATER,[mc]:i.NOTEQUAL};function rt(y,v){if(v.type===an&&t.has("OES_texture_float_linear")===!1&&(v.magFilter===Ge||v.magFilter===Ur||v.magFilter===Wi||v.magFilter===Dn||v.minFilter===Ge||v.minFilter===Ur||v.minFilter===Wi||v.minFilter===Dn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(y,i.TEXTURE_WRAP_S,st[v.wrapS]),i.texParameteri(y,i.TEXTURE_WRAP_T,st[v.wrapT]),(y===i.TEXTURE_3D||y===i.TEXTURE_2D_ARRAY)&&i.texParameteri(y,i.TEXTURE_WRAP_R,st[v.wrapR]),i.texParameteri(y,i.TEXTURE_MAG_FILTER,ht[v.magFilter]),i.texParameteri(y,i.TEXTURE_MIN_FILTER,ht[v.minFilter]),v.compareFunction&&(i.texParameteri(y,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(y,i.TEXTURE_COMPARE_FUNC,G[v.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===ke||v.minFilter!==Wi&&v.minFilter!==Dn||v.type===an&&t.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||n.get(v).__currentAnisotropy){const O=t.get("EXT_texture_filter_anisotropic");i.texParameterf(y,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,r.getMaxAnisotropy())),n.get(v).__currentAnisotropy=v.anisotropy}}}function pt(y,v){let O=!1;y.__webglInit===void 0&&(y.__webglInit=!0,v.addEventListener("dispose",U));const X=v.source;let K=d.get(X);K===void 0&&(K={},d.set(X,K));const B=j(v);if(B!==y.__cacheKey){K[B]===void 0&&(K[B]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,O=!0),K[B].usedTimes++;const Tt=K[y.__cacheKey];Tt!==void 0&&(K[y.__cacheKey].usedTimes--,Tt.usedTimes===0&&E(v)),y.__cacheKey=B,y.__webglTexture=K[B].texture}return O}function Vt(y,v,O){return Math.floor(Math.floor(y/O)/v)}function Rt(y,v,O,X){const B=y.updateRanges;if(B.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,v.width,v.height,O,X,v.data);else{B.sort((tt,at)=>tt.start-at.start);let Tt=0;for(let tt=1;tt<B.length;tt++){const at=B[Tt],qt=B[tt],At=at.start+at.count,lt=Vt(qt.start,v.width,4),It=Vt(at.start,v.width,4);qt.start<=At+1&&lt===It&&Vt(qt.start+qt.count-1,v.width,4)===lt?at.count=Math.max(at.count,qt.start+qt.count-at.start):(++Tt,B[Tt]=qt)}B.length=Tt+1;const $=i.getParameter(i.UNPACK_ROW_LENGTH),gt=i.getParameter(i.UNPACK_SKIP_PIXELS),xt=i.getParameter(i.UNPACK_SKIP_ROWS);i.pixelStorei(i.UNPACK_ROW_LENGTH,v.width);for(let tt=0,at=B.length;tt<at;tt++){const qt=B[tt],At=Math.floor(qt.start/4),lt=Math.ceil(qt.count/4),It=At%v.width,q=Math.floor(At/v.width),it=lt,ot=1;i.pixelStorei(i.UNPACK_SKIP_PIXELS,It),i.pixelStorei(i.UNPACK_SKIP_ROWS,q),e.texSubImage2D(i.TEXTURE_2D,0,It,q,it,ot,O,X,v.data)}y.clearUpdateRanges(),i.pixelStorei(i.UNPACK_ROW_LENGTH,$),i.pixelStorei(i.UNPACK_SKIP_PIXELS,gt),i.pixelStorei(i.UNPACK_SKIP_ROWS,xt)}}function H(y,v,O){let X=i.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(X=i.TEXTURE_2D_ARRAY),v.isData3DTexture&&(X=i.TEXTURE_3D);const K=pt(y,v),B=v.source;e.bindTexture(X,y.__webglTexture,i.TEXTURE0+O);const Tt=n.get(B);if(B.version!==Tt.__version||K===!0){e.activeTexture(i.TEXTURE0+O);const $=Gt.getPrimaries(Gt.workingColorSpace),gt=v.colorSpace===gn?null:Gt.getPrimaries(v.colorSpace),xt=v.colorSpace===gn||$===gt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,xt);let tt=x(v.image,!1,r.maxTextureSize);tt=ae(v,tt);const at=s.convert(v.format,v.colorSpace),qt=s.convert(v.type);let At=A(v.internalFormat,at,qt,v.colorSpace,v.isVideoTexture);rt(X,v);let lt;const It=v.mipmaps,q=v.isVideoTexture!==!0,it=Tt.__version===void 0||K===!0,ot=B.dataReady,Mt=P(v,tt);if(v.isDepthTexture)At=T(v.format===Ci,v.type),it&&(q?e.texStorage2D(i.TEXTURE_2D,1,At,tt.width,tt.height):e.texImage2D(i.TEXTURE_2D,0,At,tt.width,tt.height,0,at,qt,null));else if(v.isDataTexture)if(It.length>0){q&&it&&e.texStorage2D(i.TEXTURE_2D,Mt,At,It[0].width,It[0].height);for(let et=0,J=It.length;et<J;et++)lt=It[et],q?ot&&e.texSubImage2D(i.TEXTURE_2D,et,0,0,lt.width,lt.height,at,qt,lt.data):e.texImage2D(i.TEXTURE_2D,et,At,lt.width,lt.height,0,at,qt,lt.data);v.generateMipmaps=!1}else q?(it&&e.texStorage2D(i.TEXTURE_2D,Mt,At,tt.width,tt.height),ot&&Rt(v,tt,at,qt)):e.texImage2D(i.TEXTURE_2D,0,At,tt.width,tt.height,0,at,qt,tt.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){q&&it&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Mt,At,It[0].width,It[0].height,tt.depth);for(let et=0,J=It.length;et<J;et++)if(lt=It[et],v.format!==Be)if(at!==null)if(q){if(ot)if(v.layerUpdates.size>0){const bt=oa(lt.width,lt.height,v.format,v.type);for(const zt of v.layerUpdates){const te=lt.data.subarray(zt*bt/lt.data.BYTES_PER_ELEMENT,(zt+1)*bt/lt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,et,0,0,zt,lt.width,lt.height,1,at,te)}v.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,et,0,0,0,lt.width,lt.height,tt.depth,at,lt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,et,At,lt.width,lt.height,tt.depth,0,lt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else q?ot&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,et,0,0,0,lt.width,lt.height,tt.depth,at,qt,lt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,et,At,lt.width,lt.height,tt.depth,0,at,qt,lt.data)}else{q&&it&&e.texStorage2D(i.TEXTURE_2D,Mt,At,It[0].width,It[0].height);for(let et=0,J=It.length;et<J;et++)lt=It[et],v.format!==Be?at!==null?q?ot&&e.compressedTexSubImage2D(i.TEXTURE_2D,et,0,0,lt.width,lt.height,at,lt.data):e.compressedTexImage2D(i.TEXTURE_2D,et,At,lt.width,lt.height,0,lt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):q?ot&&e.texSubImage2D(i.TEXTURE_2D,et,0,0,lt.width,lt.height,at,qt,lt.data):e.texImage2D(i.TEXTURE_2D,et,At,lt.width,lt.height,0,at,qt,lt.data)}else if(v.isDataArrayTexture)if(q){if(it&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Mt,At,tt.width,tt.height,tt.depth),ot)if(v.layerUpdates.size>0){const et=oa(tt.width,tt.height,v.format,v.type);for(const J of v.layerUpdates){const bt=tt.data.subarray(J*et/tt.data.BYTES_PER_ELEMENT,(J+1)*et/tt.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,J,tt.width,tt.height,1,at,qt,bt)}v.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,tt.width,tt.height,tt.depth,at,qt,tt.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,At,tt.width,tt.height,tt.depth,0,at,qt,tt.data);else if(v.isData3DTexture)q?(it&&e.texStorage3D(i.TEXTURE_3D,Mt,At,tt.width,tt.height,tt.depth),ot&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,tt.width,tt.height,tt.depth,at,qt,tt.data)):e.texImage3D(i.TEXTURE_3D,0,At,tt.width,tt.height,tt.depth,0,at,qt,tt.data);else if(v.isFramebufferTexture){if(it)if(q)e.texStorage2D(i.TEXTURE_2D,Mt,At,tt.width,tt.height);else{let et=tt.width,J=tt.height;for(let bt=0;bt<Mt;bt++)e.texImage2D(i.TEXTURE_2D,bt,At,et,J,0,at,qt,null),et>>=1,J>>=1}}else if(It.length>0){if(q&&it){const et=Qt(It[0]);e.texStorage2D(i.TEXTURE_2D,Mt,At,et.width,et.height)}for(let et=0,J=It.length;et<J;et++)lt=It[et],q?ot&&e.texSubImage2D(i.TEXTURE_2D,et,0,0,at,qt,lt):e.texImage2D(i.TEXTURE_2D,et,At,at,qt,lt);v.generateMipmaps=!1}else if(q){if(it){const et=Qt(tt);e.texStorage2D(i.TEXTURE_2D,Mt,At,et.width,et.height)}ot&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,at,qt,tt)}else e.texImage2D(i.TEXTURE_2D,0,At,at,qt,tt);m(v)&&f(X),Tt.__version=B.version,v.onUpdate&&v.onUpdate(v)}y.__version=v.version}function Z(y,v,O){if(v.image.length!==6)return;const X=pt(y,v),K=v.source;e.bindTexture(i.TEXTURE_CUBE_MAP,y.__webglTexture,i.TEXTURE0+O);const B=n.get(K);if(K.version!==B.__version||X===!0){e.activeTexture(i.TEXTURE0+O);const Tt=Gt.getPrimaries(Gt.workingColorSpace),$=v.colorSpace===gn?null:Gt.getPrimaries(v.colorSpace),gt=v.colorSpace===gn||Tt===$?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,gt);const xt=v.isCompressedTexture||v.image[0].isCompressedTexture,tt=v.image[0]&&v.image[0].isDataTexture,at=[];for(let J=0;J<6;J++)!xt&&!tt?at[J]=x(v.image[J],!0,r.maxCubemapSize):at[J]=tt?v.image[J].image:v.image[J],at[J]=ae(v,at[J]);const qt=at[0],At=s.convert(v.format,v.colorSpace),lt=s.convert(v.type),It=A(v.internalFormat,At,lt,v.colorSpace),q=v.isVideoTexture!==!0,it=B.__version===void 0||X===!0,ot=K.dataReady;let Mt=P(v,qt);rt(i.TEXTURE_CUBE_MAP,v);let et;if(xt){q&&it&&e.texStorage2D(i.TEXTURE_CUBE_MAP,Mt,It,qt.width,qt.height);for(let J=0;J<6;J++){et=at[J].mipmaps;for(let bt=0;bt<et.length;bt++){const zt=et[bt];v.format!==Be?At!==null?q?ot&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,bt,0,0,zt.width,zt.height,At,zt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,bt,It,zt.width,zt.height,0,zt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):q?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,bt,0,0,zt.width,zt.height,At,lt,zt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,bt,It,zt.width,zt.height,0,At,lt,zt.data)}}}else{if(et=v.mipmaps,q&&it){et.length>0&&Mt++;const J=Qt(at[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,Mt,It,J.width,J.height)}for(let J=0;J<6;J++)if(tt){q?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,at[J].width,at[J].height,At,lt,at[J].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,It,at[J].width,at[J].height,0,At,lt,at[J].data);for(let bt=0;bt<et.length;bt++){const te=et[bt].image[J].image;q?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,bt+1,0,0,te.width,te.height,At,lt,te.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,bt+1,It,te.width,te.height,0,At,lt,te.data)}}else{q?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,0,0,At,lt,at[J]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,0,It,At,lt,at[J]);for(let bt=0;bt<et.length;bt++){const zt=et[bt];q?ot&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,bt+1,0,0,At,lt,zt.image[J]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+J,bt+1,It,At,lt,zt.image[J])}}}m(v)&&f(i.TEXTURE_CUBE_MAP),B.__version=K.version,v.onUpdate&&v.onUpdate(v)}y.__version=v.version}function ft(y,v,O,X,K,B){const Tt=s.convert(O.format,O.colorSpace),$=s.convert(O.type),gt=A(O.internalFormat,Tt,$,O.colorSpace),xt=n.get(v),tt=n.get(O);if(tt.__renderTarget=v,!xt.__hasExternalTextures){const at=Math.max(1,v.width>>B),qt=Math.max(1,v.height>>B);K===i.TEXTURE_3D||K===i.TEXTURE_2D_ARRAY?e.texImage3D(K,B,gt,at,qt,v.depth,0,Tt,$,null):e.texImage2D(K,B,gt,at,qt,0,Tt,$,null)}e.bindFramebuffer(i.FRAMEBUFFER,y),St(v)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,X,K,tt.__webglTexture,0,Zt(v)):(K===i.TEXTURE_2D||K>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&K<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,X,K,tt.__webglTexture,B),e.bindFramebuffer(i.FRAMEBUFFER,null)}function Ct(y,v,O){if(i.bindRenderbuffer(i.RENDERBUFFER,y),v.depthBuffer){const X=v.depthTexture,K=X&&X.isDepthTexture?X.type:null,B=T(v.stencilBuffer,K),Tt=v.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,$=Zt(v);St(v)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,$,B,v.width,v.height):O?i.renderbufferStorageMultisample(i.RENDERBUFFER,$,B,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,B,v.width,v.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Tt,i.RENDERBUFFER,y)}else{const X=v.textures;for(let K=0;K<X.length;K++){const B=X[K],Tt=s.convert(B.format,B.colorSpace),$=s.convert(B.type),gt=A(B.internalFormat,Tt,$,B.colorSpace),xt=Zt(v);O&&St(v)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,xt,gt,v.width,v.height):St(v)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,xt,gt,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,gt,v.width,v.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Et(y,v){if(v&&v.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,y),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const X=n.get(v.depthTexture);X.__renderTarget=v,(!X.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),k(v.depthTexture,0);const K=X.__webglTexture,B=Zt(v);if(v.depthTexture.format===Pi)St(v)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,K,0,B):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,K,0);else if(v.depthTexture.format===Ci)St(v)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,K,0,B):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,K,0);else throw new Error("Unknown depthTexture format")}function Bt(y){const v=n.get(y),O=y.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==y.depthTexture){const X=y.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),X){const K=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,X.removeEventListener("dispose",K)};X.addEventListener("dispose",K),v.__depthDisposeCallback=K}v.__boundDepthTexture=X}if(y.depthTexture&&!v.__autoAllocateDepthBuffer){if(O)throw new Error("target.depthTexture not supported in Cube render targets");const X=y.texture.mipmaps;X&&X.length>0?Et(v.__webglFramebuffer[0],y):Et(v.__webglFramebuffer,y)}else if(O){v.__webglDepthbuffer=[];for(let X=0;X<6;X++)if(e.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer[X]),v.__webglDepthbuffer[X]===void 0)v.__webglDepthbuffer[X]=i.createRenderbuffer(),Ct(v.__webglDepthbuffer[X],y,!1);else{const K=y.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,B=v.__webglDepthbuffer[X];i.bindRenderbuffer(i.RENDERBUFFER,B),i.framebufferRenderbuffer(i.FRAMEBUFFER,K,i.RENDERBUFFER,B)}}else{const X=y.texture.mipmaps;if(X&&X.length>0?e.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=i.createRenderbuffer(),Ct(v.__webglDepthbuffer,y,!1);else{const K=y.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,B=v.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,B),i.framebufferRenderbuffer(i.FRAMEBUFFER,K,i.RENDERBUFFER,B)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function oe(y,v,O){const X=n.get(y);v!==void 0&&ft(X.__webglFramebuffer,y,y.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),O!==void 0&&Bt(y)}function R(y){const v=y.texture,O=n.get(y),X=n.get(v);y.addEventListener("dispose",C);const K=y.textures,B=y.isWebGLCubeRenderTarget===!0,Tt=K.length>1;if(Tt||(X.__webglTexture===void 0&&(X.__webglTexture=i.createTexture()),X.__version=v.version,o.memory.textures++),B){O.__webglFramebuffer=[];for(let $=0;$<6;$++)if(v.mipmaps&&v.mipmaps.length>0){O.__webglFramebuffer[$]=[];for(let gt=0;gt<v.mipmaps.length;gt++)O.__webglFramebuffer[$][gt]=i.createFramebuffer()}else O.__webglFramebuffer[$]=i.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){O.__webglFramebuffer=[];for(let $=0;$<v.mipmaps.length;$++)O.__webglFramebuffer[$]=i.createFramebuffer()}else O.__webglFramebuffer=i.createFramebuffer();if(Tt)for(let $=0,gt=K.length;$<gt;$++){const xt=n.get(K[$]);xt.__webglTexture===void 0&&(xt.__webglTexture=i.createTexture(),o.memory.textures++)}if(y.samples>0&&St(y)===!1){O.__webglMultisampledFramebuffer=i.createFramebuffer(),O.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let $=0;$<K.length;$++){const gt=K[$];O.__webglColorRenderbuffer[$]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,O.__webglColorRenderbuffer[$]);const xt=s.convert(gt.format,gt.colorSpace),tt=s.convert(gt.type),at=A(gt.internalFormat,xt,tt,gt.colorSpace,y.isXRRenderTarget===!0),qt=Zt(y);i.renderbufferStorageMultisample(i.RENDERBUFFER,qt,at,y.width,y.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+$,i.RENDERBUFFER,O.__webglColorRenderbuffer[$])}i.bindRenderbuffer(i.RENDERBUFFER,null),y.depthBuffer&&(O.__webglDepthRenderbuffer=i.createRenderbuffer(),Ct(O.__webglDepthRenderbuffer,y,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(B){e.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture),rt(i.TEXTURE_CUBE_MAP,v);for(let $=0;$<6;$++)if(v.mipmaps&&v.mipmaps.length>0)for(let gt=0;gt<v.mipmaps.length;gt++)ft(O.__webglFramebuffer[$][gt],y,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+$,gt);else ft(O.__webglFramebuffer[$],y,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0);m(v)&&f(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Tt){for(let $=0,gt=K.length;$<gt;$++){const xt=K[$],tt=n.get(xt);let at=i.TEXTURE_2D;(y.isWebGL3DRenderTarget||y.isWebGLArrayRenderTarget)&&(at=y.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(at,tt.__webglTexture),rt(at,xt),ft(O.__webglFramebuffer,y,xt,i.COLOR_ATTACHMENT0+$,at,0),m(xt)&&f(at)}e.unbindTexture()}else{let $=i.TEXTURE_2D;if((y.isWebGL3DRenderTarget||y.isWebGLArrayRenderTarget)&&($=y.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture($,X.__webglTexture),rt($,v),v.mipmaps&&v.mipmaps.length>0)for(let gt=0;gt<v.mipmaps.length;gt++)ft(O.__webglFramebuffer[gt],y,v,i.COLOR_ATTACHMENT0,$,gt);else ft(O.__webglFramebuffer,y,v,i.COLOR_ATTACHMENT0,$,0);m(v)&&f($),e.unbindTexture()}y.depthBuffer&&Bt(y)}function jt(y){const v=y.textures;for(let O=0,X=v.length;O<X;O++){const K=v[O];if(m(K)){const B=b(y),Tt=n.get(K).__webglTexture;e.bindTexture(B,Tt),f(B),e.unbindTexture()}}}const wt=[],Ut=[];function mt(y){if(y.samples>0){if(St(y)===!1){const v=y.textures,O=y.width,X=y.height;let K=i.COLOR_BUFFER_BIT;const B=y.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Tt=n.get(y),$=v.length>1;if($)for(let xt=0;xt<v.length;xt++)e.bindFramebuffer(i.FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,Tt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,Tt.__webglMultisampledFramebuffer);const gt=y.texture.mipmaps;gt&&gt.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Tt.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Tt.__webglFramebuffer);for(let xt=0;xt<v.length;xt++){if(y.resolveDepthBuffer&&(y.depthBuffer&&(K|=i.DEPTH_BUFFER_BIT),y.stencilBuffer&&y.resolveStencilBuffer&&(K|=i.STENCIL_BUFFER_BIT)),$){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Tt.__webglColorRenderbuffer[xt]);const tt=n.get(v[xt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,tt,0)}i.blitFramebuffer(0,0,O,X,0,0,O,X,K,i.NEAREST),c===!0&&(wt.length=0,Ut.length=0,wt.push(i.COLOR_ATTACHMENT0+xt),y.depthBuffer&&y.resolveDepthBuffer===!1&&(wt.push(B),Ut.push(B),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,Ut)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,wt))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),$)for(let xt=0;xt<v.length;xt++){e.bindFramebuffer(i.FRAMEBUFFER,Tt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.RENDERBUFFER,Tt.__webglColorRenderbuffer[xt]);const tt=n.get(v[xt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,Tt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+xt,i.TEXTURE_2D,tt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Tt.__webglMultisampledFramebuffer)}else if(y.depthBuffer&&y.resolveDepthBuffer===!1&&c){const v=y.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[v])}}}function Zt(y){return Math.min(r.maxSamples,y.samples)}function St(y){const v=n.get(y);return y.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function Ot(y){const v=o.render.frame;u.get(y)!==v&&(u.set(y,v),y.update())}function ae(y,v){const O=y.colorSpace,X=y.format,K=y.type;return y.isCompressedTexture===!0||y.isVideoTexture===!0||O!==li&&O!==gn&&(Gt.getTransfer(O)===Yt?(X!==Be||K!==Ze)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",O)),v}function Qt(y){return typeof HTMLImageElement<"u"&&y instanceof HTMLImageElement?(l.width=y.naturalWidth||y.width,l.height=y.naturalHeight||y.height):typeof VideoFrame<"u"&&y instanceof VideoFrame?(l.width=y.displayWidth,l.height=y.displayHeight):(l.width=y.width,l.height=y.height),l}this.allocateTextureUnit=_,this.resetTextureUnits=z,this.setTexture2D=k,this.setTexture2DArray=Q,this.setTexture3D=Y,this.setTextureCube=W,this.rebindTextures=oe,this.setupRenderTarget=R,this.updateRenderTargetMipmap=jt,this.updateMultisampleRenderTarget=mt,this.setupDepthRenderbuffer=Bt,this.setupFrameBufferTexture=ft,this.useMultisampledRTT=St}function am(i,t){function e(n,r=gn){let s;const o=Gt.getTransfer(r);if(n===Ze)return i.UNSIGNED_BYTE;if(n===so)return i.UNSIGNED_SHORT_4_4_4_4;if(n===oo)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Ga)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Qa)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Ha)return i.BYTE;if(n===Xa)return i.SHORT;if(n===Ri)return i.UNSIGNED_SHORT;if(n===ro)return i.INT;if(n===On)return i.UNSIGNED_INT;if(n===an)return i.FLOAT;if(n===wi)return i.HALF_FLOAT;if(n===Ka)return i.ALPHA;if(n===ja)return i.RGB;if(n===Be)return i.RGBA;if(n===Pi)return i.DEPTH_COMPONENT;if(n===Ci)return i.DEPTH_STENCIL;if(n===Za)return i.RED;if(n===ao)return i.RED_INTEGER;if(n===Ja)return i.RG;if(n===lo)return i.RG_INTEGER;if(n===co)return i.RGBA_INTEGER;if(n===ur||n===fr||n===hr||n===dr)if(o===Yt)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===ur)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===fr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===hr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===dr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===ur)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===fr)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===hr)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===dr)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Ss||n===ys||n===As||n===bs)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===Ss)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ys)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===As)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===bs)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Rs||n===Us||n===Ps)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(n===Rs||n===Us)return o===Yt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===Ps)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Cs||n===Ns||n===qs||n===Vs||n===ws||n===Ds||n===Ls||n===Os||n===zs||n===Is||n===Fs||n===_s||n===Ws||n===Bs)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(n===Cs)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Ns)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===qs)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Vs)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===ws)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Ds)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Ls)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Os)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===zs)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Is)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Fs)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===_s)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Ws)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Bs)return o===Yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===ks||n===Hs||n===Xs)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(n===ks)return o===Yt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Hs)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Xs)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Gs||n===Qs||n===Ks||n===js)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(n===Gs)return s.COMPRESSED_RED_RGTC1_EXT;if(n===Qs)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ks)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===js)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ui?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}const lm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,cm=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class um{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const n=new fl(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new cn({vertexShader:lm,fragmentShader:cm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new ve(new Ii(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class fm extends fi{constructor(t,e){super();const n=this;let r=null,s=1,o=null,a="local-floor",c=1,l=null,u=null,h=null,d=null,p=null,g=null;const x=typeof XRWebGLBinding<"u",m=new um,f={},b=e.getContextAttributes();let A=null,T=null;const P=[],U=[],C=new dt;let w=null;const E=new Le;E.viewport=new ce;const S=new Le;S.viewport=new ce;const N=[E,S],z=new Nu;let _=null,j=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(H){let Z=P[H];return Z===void 0&&(Z=new jr,P[H]=Z),Z.getTargetRaySpace()},this.getControllerGrip=function(H){let Z=P[H];return Z===void 0&&(Z=new jr,P[H]=Z),Z.getGripSpace()},this.getHand=function(H){let Z=P[H];return Z===void 0&&(Z=new jr,P[H]=Z),Z.getHandSpace()};function k(H){const Z=U.indexOf(H.inputSource);if(Z===-1)return;const ft=P[Z];ft!==void 0&&(ft.update(H.inputSource,H.frame,l||o),ft.dispatchEvent({type:H.type,data:H.inputSource}))}function Q(){r.removeEventListener("select",k),r.removeEventListener("selectstart",k),r.removeEventListener("selectend",k),r.removeEventListener("squeeze",k),r.removeEventListener("squeezestart",k),r.removeEventListener("squeezeend",k),r.removeEventListener("end",Q),r.removeEventListener("inputsourceschange",Y);for(let H=0;H<P.length;H++){const Z=U[H];Z!==null&&(U[H]=null,P[H].disconnect(Z))}_=null,j=null,m.reset();for(const H in f)delete f[H];t.setRenderTarget(A),p=null,d=null,h=null,r=null,T=null,Rt.stop(),n.isPresenting=!1,t.setPixelRatio(w),t.setSize(C.width,C.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(H){s=H,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(H){a=H,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(H){l=H},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return h===null&&x&&(h=new XRWebGLBinding(r,e)),h},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(H){if(r=H,r!==null){if(A=t.getRenderTarget(),r.addEventListener("select",k),r.addEventListener("selectstart",k),r.addEventListener("selectend",k),r.addEventListener("squeeze",k),r.addEventListener("squeezestart",k),r.addEventListener("squeezeend",k),r.addEventListener("end",Q),r.addEventListener("inputsourceschange",Y),b.xrCompatible!==!0&&await e.makeXRCompatible(),w=t.getPixelRatio(),t.getSize(C),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let ft=null,Ct=null,Et=null;b.depth&&(Et=b.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,ft=b.stencil?Ci:Pi,Ct=b.stencil?Ui:On);const Bt={colorFormat:e.RGBA8,depthFormat:Et,scaleFactor:s};h=this.getBinding(),d=h.createProjectionLayer(Bt),r.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),T=new zn(d.textureWidth,d.textureHeight,{format:Be,type:Ze,depthTexture:new ul(d.textureWidth,d.textureHeight,Ct,void 0,void 0,void 0,void 0,void 0,void 0,ft),stencilBuffer:b.stencil,colorSpace:t.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{const ft={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(r,e,ft),r.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),T=new zn(p.framebufferWidth,p.framebufferHeight,{format:Be,type:Ze,colorSpace:t.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1})}T.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await r.requestReferenceSpace(a),Rt.setContext(r),Rt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function Y(H){for(let Z=0;Z<H.removed.length;Z++){const ft=H.removed[Z],Ct=U.indexOf(ft);Ct>=0&&(U[Ct]=null,P[Ct].disconnect(ft))}for(let Z=0;Z<H.added.length;Z++){const ft=H.added[Z];let Ct=U.indexOf(ft);if(Ct===-1){for(let Bt=0;Bt<P.length;Bt++)if(Bt>=U.length){U.push(ft),Ct=Bt;break}else if(U[Bt]===null){U[Bt]=ft,Ct=Bt;break}if(Ct===-1)break}const Et=P[Ct];Et&&Et.connect(ft)}}const W=new V,st=new V;function ht(H,Z,ft){W.setFromMatrixPosition(Z.matrixWorld),st.setFromMatrixPosition(ft.matrixWorld);const Ct=W.distanceTo(st),Et=Z.projectionMatrix.elements,Bt=ft.projectionMatrix.elements,oe=Et[14]/(Et[10]-1),R=Et[14]/(Et[10]+1),jt=(Et[9]+1)/Et[5],wt=(Et[9]-1)/Et[5],Ut=(Et[8]-1)/Et[0],mt=(Bt[8]+1)/Bt[0],Zt=oe*Ut,St=oe*mt,Ot=Ct/(-Ut+mt),ae=Ot*-Ut;if(Z.matrixWorld.decompose(H.position,H.quaternion,H.scale),H.translateX(ae),H.translateZ(Ot),H.matrixWorld.compose(H.position,H.quaternion,H.scale),H.matrixWorldInverse.copy(H.matrixWorld).invert(),Et[10]===-1)H.projectionMatrix.copy(Z.projectionMatrix),H.projectionMatrixInverse.copy(Z.projectionMatrixInverse);else{const Qt=oe+Ot,y=R+Ot,v=Zt-ae,O=St+(Ct-ae),X=jt*R/y*Qt,K=wt*R/y*Qt;H.projectionMatrix.makePerspective(v,O,X,K,Qt,y),H.projectionMatrixInverse.copy(H.projectionMatrix).invert()}}function G(H,Z){Z===null?H.matrixWorld.copy(H.matrix):H.matrixWorld.multiplyMatrices(Z.matrixWorld,H.matrix),H.matrixWorldInverse.copy(H.matrixWorld).invert()}this.updateCamera=function(H){if(r===null)return;let Z=H.near,ft=H.far;m.texture!==null&&(m.depthNear>0&&(Z=m.depthNear),m.depthFar>0&&(ft=m.depthFar)),z.near=S.near=E.near=Z,z.far=S.far=E.far=ft,(_!==z.near||j!==z.far)&&(r.updateRenderState({depthNear:z.near,depthFar:z.far}),_=z.near,j=z.far),z.layers.mask=H.layers.mask|6,E.layers.mask=z.layers.mask&3,S.layers.mask=z.layers.mask&5;const Ct=H.parent,Et=z.cameras;G(z,Ct);for(let Bt=0;Bt<Et.length;Bt++)G(Et[Bt],Ct);Et.length===2?ht(z,E,S):z.projectionMatrix.copy(E.projectionMatrix),rt(H,z,Ct)};function rt(H,Z,ft){ft===null?H.matrix.copy(Z.matrixWorld):(H.matrix.copy(ft.matrixWorld),H.matrix.invert(),H.matrix.multiply(Z.matrixWorld)),H.matrix.decompose(H.position,H.quaternion,H.scale),H.updateMatrixWorld(!0),H.projectionMatrix.copy(Z.projectionMatrix),H.projectionMatrixInverse.copy(Z.projectionMatrixInverse),H.isPerspectiveCamera&&(H.fov=Ni*2*Math.atan(1/H.projectionMatrix.elements[5]),H.zoom=1)}this.getCamera=function(){return z},this.getFoveation=function(){if(!(d===null&&p===null))return c},this.setFoveation=function(H){c=H,d!==null&&(d.fixedFoveation=H),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=H)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(z)},this.getCameraTexture=function(H){return f[H]};let pt=null;function Vt(H,Z){if(u=Z.getViewerPose(l||o),g=Z,u!==null){const ft=u.views;p!==null&&(t.setRenderTargetFramebuffer(T,p.framebuffer),t.setRenderTarget(T));let Ct=!1;ft.length!==z.cameras.length&&(z.cameras.length=0,Ct=!0);for(let R=0;R<ft.length;R++){const jt=ft[R];let wt=null;if(p!==null)wt=p.getViewport(jt);else{const mt=h.getViewSubImage(d,jt);wt=mt.viewport,R===0&&(t.setRenderTargetTextures(T,mt.colorTexture,mt.depthStencilTexture),t.setRenderTarget(T))}let Ut=N[R];Ut===void 0&&(Ut=new Le,Ut.layers.enable(R),Ut.viewport=new ce,N[R]=Ut),Ut.matrix.fromArray(jt.transform.matrix),Ut.matrix.decompose(Ut.position,Ut.quaternion,Ut.scale),Ut.projectionMatrix.fromArray(jt.projectionMatrix),Ut.projectionMatrixInverse.copy(Ut.projectionMatrix).invert(),Ut.viewport.set(wt.x,wt.y,wt.width,wt.height),R===0&&(z.matrix.copy(Ut.matrix),z.matrix.decompose(z.position,z.quaternion,z.scale)),Ct===!0&&z.cameras.push(Ut)}const Et=r.enabledFeatures;if(Et&&Et.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&x){h=n.getBinding();const R=h.getDepthInformation(ft[0]);R&&R.isValid&&R.texture&&m.init(R,r.renderState)}if(Et&&Et.includes("camera-access")&&x){t.state.unbindTexture(),h=n.getBinding();for(let R=0;R<ft.length;R++){const jt=ft[R].camera;if(jt){let wt=f[jt];wt||(wt=new fl,f[jt]=wt);const Ut=h.getCameraImage(jt);wt.sourceTexture=Ut}}}}for(let ft=0;ft<P.length;ft++){const Ct=U[ft],Et=P[ft];Ct!==null&&Et!==void 0&&Et.update(Ct,Z,l||o)}pt&&pt(H,Z),Z.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:Z}),g=null}const Rt=new xl;Rt.setAnimationLoop(Vt),this.setAnimationLoop=function(H){pt=H},this.dispose=function(){}}}const Pn=new Je,hm=new se;function dm(i,t){function e(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function n(m,f){f.color.getRGB(m.fogColor.value,ol(i)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function r(m,f,b,A,T){f.isMeshBasicMaterial||f.isMeshLambertMaterial?s(m,f):f.isMeshToonMaterial?(s(m,f),h(m,f)):f.isMeshPhongMaterial?(s(m,f),u(m,f)):f.isMeshStandardMaterial?(s(m,f),d(m,f),f.isMeshPhysicalMaterial&&p(m,f,T)):f.isMeshMatcapMaterial?(s(m,f),g(m,f)):f.isMeshDepthMaterial?s(m,f):f.isMeshDistanceMaterial?(s(m,f),x(m,f)):f.isMeshNormalMaterial?s(m,f):f.isLineBasicMaterial?(o(m,f),f.isLineDashedMaterial&&a(m,f)):f.isPointsMaterial?c(m,f,b,A):f.isSpriteMaterial?l(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function s(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,e(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===Ae&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,e(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===Ae&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,e(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,e(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,e(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);const b=t.get(f),A=b.envMap,T=b.envMapRotation;A&&(m.envMap.value=A,Pn.copy(T),Pn.x*=-1,Pn.y*=-1,Pn.z*=-1,A.isCubeTexture&&A.isRenderTargetTexture===!1&&(Pn.y*=-1,Pn.z*=-1),m.envMapRotation.value.setFromMatrix4(hm.makeRotationFromEuler(Pn)),m.flipEnvMap.value=A.isCubeTexture&&A.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap&&(m.lightMap.value=f.lightMap,m.lightMapIntensity.value=f.lightMapIntensity,e(f.lightMap,m.lightMapTransform)),f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,e(f.aoMap,m.aoMapTransform))}function o(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform))}function a(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function c(m,f,b,A){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*b,m.scale.value=A*.5,f.map&&(m.map.value=f.map,e(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function l(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function u(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function h(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function d(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,e(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,e(f.roughnessMap,m.roughnessMapTransform)),f.envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function p(m,f,b){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,e(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,e(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,e(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,e(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,e(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===Ae&&m.clearcoatNormalScale.value.negate())),f.dispersion>0&&(m.dispersion.value=f.dispersion),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,e(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,e(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=b.texture,m.transmissionSamplerSize.value.set(b.width,b.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,e(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,e(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,e(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,e(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,e(f.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,f){f.matcap&&(m.matcap.value=f.matcap)}function x(m,f){const b=t.get(f).light;m.referencePosition.value.setFromMatrixPosition(b.matrixWorld),m.nearDistance.value=b.shadow.camera.near,m.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:r}}function pm(i,t,e,n){let r={},s={},o=[];const a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(b,A){const T=A.program;n.uniformBlockBinding(b,T)}function l(b,A){let T=r[b.id];T===void 0&&(g(b),T=u(b),r[b.id]=T,b.addEventListener("dispose",m));const P=A.program;n.updateUBOMapping(b,P);const U=t.render.frame;s[b.id]!==U&&(d(b),s[b.id]=U)}function u(b){const A=h();b.__bindingPointIndex=A;const T=i.createBuffer(),P=b.__size,U=b.usage;return i.bindBuffer(i.UNIFORM_BUFFER,T),i.bufferData(i.UNIFORM_BUFFER,P,U),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,A,T),T}function h(){for(let b=0;b<a;b++)if(o.indexOf(b)===-1)return o.push(b),b;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(b){const A=r[b.id],T=b.uniforms,P=b.__cache;i.bindBuffer(i.UNIFORM_BUFFER,A);for(let U=0,C=T.length;U<C;U++){const w=Array.isArray(T[U])?T[U]:[T[U]];for(let E=0,S=w.length;E<S;E++){const N=w[E];if(p(N,U,E,P)===!0){const z=N.__offset,_=Array.isArray(N.value)?N.value:[N.value];let j=0;for(let k=0;k<_.length;k++){const Q=_[k],Y=x(Q);typeof Q=="number"||typeof Q=="boolean"?(N.__data[0]=Q,i.bufferSubData(i.UNIFORM_BUFFER,z+j,N.__data)):Q.isMatrix3?(N.__data[0]=Q.elements[0],N.__data[1]=Q.elements[1],N.__data[2]=Q.elements[2],N.__data[3]=0,N.__data[4]=Q.elements[3],N.__data[5]=Q.elements[4],N.__data[6]=Q.elements[5],N.__data[7]=0,N.__data[8]=Q.elements[6],N.__data[9]=Q.elements[7],N.__data[10]=Q.elements[8],N.__data[11]=0):(Q.toArray(N.__data,j),j+=Y.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,z,N.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function p(b,A,T,P){const U=b.value,C=A+"_"+T;if(P[C]===void 0)return typeof U=="number"||typeof U=="boolean"?P[C]=U:P[C]=U.clone(),!0;{const w=P[C];if(typeof U=="number"||typeof U=="boolean"){if(w!==U)return P[C]=U,!0}else if(w.equals(U)===!1)return w.copy(U),!0}return!1}function g(b){const A=b.uniforms;let T=0;const P=16;for(let C=0,w=A.length;C<w;C++){const E=Array.isArray(A[C])?A[C]:[A[C]];for(let S=0,N=E.length;S<N;S++){const z=E[S],_=Array.isArray(z.value)?z.value:[z.value];for(let j=0,k=_.length;j<k;j++){const Q=_[j],Y=x(Q),W=T%P,st=W%Y.boundary,ht=W+st;T+=st,ht!==0&&P-ht<Y.storage&&(T+=P-ht),z.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),z.__offset=T,T+=Y.storage}}}const U=T%P;return U>0&&(T+=P-U),b.__size=T,b.__cache={},this}function x(b){const A={boundary:0,storage:0};return typeof b=="number"||typeof b=="boolean"?(A.boundary=4,A.storage=4):b.isVector2?(A.boundary=8,A.storage=8):b.isVector3||b.isColor?(A.boundary=16,A.storage=12):b.isVector4?(A.boundary=16,A.storage=16):b.isMatrix3?(A.boundary=48,A.storage=48):b.isMatrix4?(A.boundary=64,A.storage=64):b.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",b),A}function m(b){const A=b.target;A.removeEventListener("dispose",m);const T=o.indexOf(A.__bindingPointIndex);o.splice(T,1),i.deleteBuffer(r[A.id]),delete r[A.id],delete s[A.id]}function f(){for(const b in r)i.deleteBuffer(r[b]);o=[],r={},s={}}return{bind:c,update:l,dispose:f}}class mm{constructor(t={}){const{canvas:e=Dc(),context:n=null,depth:r=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:d=!1}=t;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=o;const g=new Uint32Array(4),x=new Int32Array(4);let m=null,f=null;const b=[],A=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Tn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const T=this;let P=!1;this._outputColorSpace=De;let U=0,C=0,w=null,E=-1,S=null;const N=new ce,z=new ce;let _=null;const j=new kt(0);let k=0,Q=e.width,Y=e.height,W=1,st=null,ht=null;const G=new ce(0,0,Q,Y),rt=new ce(0,0,Q,Y);let pt=!1;const Vt=new mo;let Rt=!1,H=!1;const Z=new se,ft=new V,Ct=new ce,Et={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Bt=!1;function oe(){return w===null?W:1}let R=n;function jt(M,D){return e.getContext(M,D)}try{const M={alpha:!0,depth:r,stencil:s,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${io}`),e.addEventListener("webglcontextlost",ot,!1),e.addEventListener("webglcontextrestored",Mt,!1),e.addEventListener("webglcontextcreationerror",et,!1),R===null){const D="webgl2";if(R=jt(D,M),R===null)throw jt(D)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(M){throw console.error("THREE.WebGLRenderer: "+M.message),M}let wt,Ut,mt,Zt,St,Ot,ae,Qt,y,v,O,X,K,B,Tt,$,gt,xt,tt,at,qt,At,lt,It;function q(){wt=new bd(R),wt.init(),At=new am(R,wt),Ut=new xd(R,wt,t,At),mt=new sm(R,wt),Ut.reversedDepthBuffer&&d&&mt.buffers.depth.setReversed(!0),Zt=new Pd(R),St=new Gp,Ot=new om(R,wt,mt,St,Ut,At,Zt),ae=new Td(T),Qt=new Ad(T),y=new wu(R),lt=new vd(R,y),v=new Rd(R,y,Zt,lt),O=new Nd(R,v,y,Zt),tt=new Cd(R,Ut,Ot),$=new Md(St),X=new Xp(T,ae,Qt,wt,Ut,lt,$),K=new dm(T,St),B=new Kp,Tt=new tm(wt),xt=new md(T,ae,Qt,mt,O,p,c),gt=new im(T,O,Ut),It=new pm(R,Zt,Ut,mt),at=new gd(R,wt,Zt),qt=new Ud(R,wt,Zt),Zt.programs=X.programs,T.capabilities=Ut,T.extensions=wt,T.properties=St,T.renderLists=B,T.shadowMap=gt,T.state=mt,T.info=Zt}q();const it=new fm(T,R);this.xr=it,this.getContext=function(){return R},this.getContextAttributes=function(){return R.getContextAttributes()},this.forceContextLoss=function(){const M=wt.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=wt.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return W},this.setPixelRatio=function(M){M!==void 0&&(W=M,this.setSize(Q,Y,!1))},this.getSize=function(M){return M.set(Q,Y)},this.setSize=function(M,D,I=!0){if(it.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}Q=M,Y=D,e.width=Math.floor(M*W),e.height=Math.floor(D*W),I===!0&&(e.style.width=M+"px",e.style.height=D+"px"),this.setViewport(0,0,M,D)},this.getDrawingBufferSize=function(M){return M.set(Q*W,Y*W).floor()},this.setDrawingBufferSize=function(M,D,I){Q=M,Y=D,W=I,e.width=Math.floor(M*I),e.height=Math.floor(D*I),this.setViewport(0,0,M,D)},this.getCurrentViewport=function(M){return M.copy(N)},this.getViewport=function(M){return M.copy(G)},this.setViewport=function(M,D,I,F){M.isVector4?G.set(M.x,M.y,M.z,M.w):G.set(M,D,I,F),mt.viewport(N.copy(G).multiplyScalar(W).round())},this.getScissor=function(M){return M.copy(rt)},this.setScissor=function(M,D,I,F){M.isVector4?rt.set(M.x,M.y,M.z,M.w):rt.set(M,D,I,F),mt.scissor(z.copy(rt).multiplyScalar(W).round())},this.getScissorTest=function(){return pt},this.setScissorTest=function(M){mt.setScissorTest(pt=M)},this.setOpaqueSort=function(M){st=M},this.setTransparentSort=function(M){ht=M},this.getClearColor=function(M){return M.copy(xt.getClearColor())},this.setClearColor=function(){xt.setClearColor(...arguments)},this.getClearAlpha=function(){return xt.getClearAlpha()},this.setClearAlpha=function(){xt.setClearAlpha(...arguments)},this.clear=function(M=!0,D=!0,I=!0){let F=0;if(M){let L=!1;if(w!==null){const nt=w.texture.format;L=nt===co||nt===lo||nt===ao}if(L){const nt=w.texture.type,ut=nt===Ze||nt===On||nt===Ri||nt===Ui||nt===so||nt===oo,yt=xt.getClearColor(),vt=xt.getClearAlpha(),Dt=yt.r,Lt=yt.g,Pt=yt.b;ut?(g[0]=Dt,g[1]=Lt,g[2]=Pt,g[3]=vt,R.clearBufferuiv(R.COLOR,0,g)):(x[0]=Dt,x[1]=Lt,x[2]=Pt,x[3]=vt,R.clearBufferiv(R.COLOR,0,x))}else F|=R.COLOR_BUFFER_BIT}D&&(F|=R.DEPTH_BUFFER_BIT),I&&(F|=R.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),R.clear(F)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",ot,!1),e.removeEventListener("webglcontextrestored",Mt,!1),e.removeEventListener("webglcontextcreationerror",et,!1),xt.dispose(),B.dispose(),Tt.dispose(),St.dispose(),ae.dispose(),Qt.dispose(),O.dispose(),lt.dispose(),It.dispose(),X.dispose(),it.dispose(),it.removeEventListener("sessionstart",He),it.removeEventListener("sessionend",Ao),En.stop()};function ot(M){M.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),P=!0}function Mt(){console.log("THREE.WebGLRenderer: Context Restored."),P=!1;const M=Zt.autoReset,D=gt.enabled,I=gt.autoUpdate,F=gt.needsUpdate,L=gt.type;q(),Zt.autoReset=M,gt.enabled=D,gt.autoUpdate=I,gt.needsUpdate=F,gt.type=L}function et(M){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function J(M){const D=M.target;D.removeEventListener("dispose",J),bt(D)}function bt(M){zt(M),St.remove(M)}function zt(M){const D=St.get(M).programs;D!==void 0&&(D.forEach(function(I){X.releaseProgram(I)}),M.isShaderMaterial&&X.releaseShaderCache(M))}this.renderBufferDirect=function(M,D,I,F,L,nt){D===null&&(D=Et);const ut=L.isMesh&&L.matrixWorld.determinant()<0,yt=Rl(M,D,I,F,L);mt.setMaterial(F,ut);let vt=I.index,Dt=1;if(F.wireframe===!0){if(vt=v.getWireframeAttribute(I),vt===void 0)return;Dt=2}const Lt=I.drawRange,Pt=I.attributes.position;let Ht=Lt.start*Dt,Jt=(Lt.start+Lt.count)*Dt;nt!==null&&(Ht=Math.max(Ht,nt.start*Dt),Jt=Math.min(Jt,(nt.start+nt.count)*Dt)),vt!==null?(Ht=Math.max(Ht,0),Jt=Math.min(Jt,vt.count)):Pt!=null&&(Ht=Math.max(Ht,0),Jt=Math.min(Jt,Pt.count));const le=Jt-Ht;if(le<0||le===1/0)return;lt.setup(L,F,yt,I,vt);let ee,$t=at;if(vt!==null&&(ee=y.get(vt),$t=qt,$t.setIndex(ee)),L.isMesh)F.wireframe===!0?(mt.setLineWidth(F.wireframeLinewidth*oe()),$t.setMode(R.LINES)):$t.setMode(R.TRIANGLES);else if(L.isLine){let Nt=F.linewidth;Nt===void 0&&(Nt=1),mt.setLineWidth(Nt*oe()),L.isLineSegments?$t.setMode(R.LINES):L.isLineLoop?$t.setMode(R.LINE_LOOP):$t.setMode(R.LINE_STRIP)}else L.isPoints?$t.setMode(R.POINTS):L.isSprite&&$t.setMode(R.TRIANGLES);if(L.isBatchedMesh)if(L._multiDrawInstances!==null)qi("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),$t.renderMultiDrawInstances(L._multiDrawStarts,L._multiDrawCounts,L._multiDrawCount,L._multiDrawInstances);else if(wt.get("WEBGL_multi_draw"))$t.renderMultiDraw(L._multiDrawStarts,L._multiDrawCounts,L._multiDrawCount);else{const Nt=L._multiDrawStarts,ie=L._multiDrawCounts,Xt=L._multiDrawCount,Re=vt?y.get(vt).bytesPerElement:1,In=St.get(F).currentProgram.getUniforms();for(let Ue=0;Ue<Xt;Ue++)In.setValue(R,"_gl_DrawID",Ue),$t.render(Nt[Ue]/Re,ie[Ue])}else if(L.isInstancedMesh)$t.renderInstances(Ht,le,L.count);else if(I.isInstancedBufferGeometry){const Nt=I._maxInstanceCount!==void 0?I._maxInstanceCount:1/0,ie=Math.min(I.instanceCount,Nt);$t.renderInstances(Ht,le,ie)}else $t.render(Ht,le)};function te(M,D,I){M.transparent===!0&&M.side===ze&&M.forceSinglePass===!1?(M.side=Ae,M.needsUpdate=!0,_i(M,D,I),M.side=je,M.needsUpdate=!0,_i(M,D,I),M.side=ze):_i(M,D,I)}this.compile=function(M,D,I=null){I===null&&(I=M),f=Tt.get(I),f.init(D),A.push(f),I.traverseVisible(function(L){L.isLight&&L.layers.test(D.layers)&&(f.pushLight(L),L.castShadow&&f.pushShadow(L))}),M!==I&&M.traverseVisible(function(L){L.isLight&&L.layers.test(D.layers)&&(f.pushLight(L),L.castShadow&&f.pushShadow(L))}),f.setupLights();const F=new Set;return M.traverse(function(L){if(!(L.isMesh||L.isPoints||L.isLine||L.isSprite))return;const nt=L.material;if(nt)if(Array.isArray(nt))for(let ut=0;ut<nt.length;ut++){const yt=nt[ut];te(yt,I,L),F.add(yt)}else te(nt,I,L),F.add(nt)}),f=A.pop(),F},this.compileAsync=function(M,D,I=null){const F=this.compile(M,D,I);return new Promise(L=>{function nt(){if(F.forEach(function(ut){St.get(ut).currentProgram.isReady()&&F.delete(ut)}),F.size===0){L(M);return}setTimeout(nt,10)}wt.get("KHR_parallel_shader_compile")!==null?nt():setTimeout(nt,10)})};let Kt=null;function Ye(M){Kt&&Kt(M)}function He(){En.stop()}function Ao(){En.start()}const En=new xl;En.setAnimationLoop(Ye),typeof self<"u"&&En.setContext(self),this.setAnimationLoop=function(M){Kt=M,it.setAnimationLoop(M),M===null?En.stop():En.start()},it.addEventListener("sessionstart",He),it.addEventListener("sessionend",Ao),this.render=function(M,D){if(D!==void 0&&D.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(P===!0)return;if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),D.parent===null&&D.matrixWorldAutoUpdate===!0&&D.updateMatrixWorld(),it.enabled===!0&&it.isPresenting===!0&&(it.cameraAutoUpdate===!0&&it.updateCamera(D),D=it.getCamera()),M.isScene===!0&&M.onBeforeRender(T,M,D,w),f=Tt.get(M,A.length),f.init(D),A.push(f),Z.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),Vt.setFromProjectionMatrix(Z,Qe,D.reversedDepth),H=this.localClippingEnabled,Rt=$.init(this.clippingPlanes,H),m=B.get(M,b.length),m.init(),b.push(m),it.enabled===!0&&it.isPresenting===!0){const nt=T.xr.getDepthSensingMesh();nt!==null&&br(nt,D,-1/0,T.sortObjects)}br(M,D,0,T.sortObjects),m.finish(),T.sortObjects===!0&&m.sort(st,ht),Bt=it.enabled===!1||it.isPresenting===!1||it.hasDepthSensing()===!1,Bt&&xt.addToRenderList(m,M),this.info.render.frame++,Rt===!0&&$.beginShadows();const I=f.state.shadowsArray;gt.render(I,M,D),Rt===!0&&$.endShadows(),this.info.autoReset===!0&&this.info.reset();const F=m.opaque,L=m.transmissive;if(f.setupLights(),D.isArrayCamera){const nt=D.cameras;if(L.length>0)for(let ut=0,yt=nt.length;ut<yt;ut++){const vt=nt[ut];Ro(F,L,M,vt)}Bt&&xt.render(M);for(let ut=0,yt=nt.length;ut<yt;ut++){const vt=nt[ut];bo(m,M,vt,vt.viewport)}}else L.length>0&&Ro(F,L,M,D),Bt&&xt.render(M),bo(m,M,D);w!==null&&C===0&&(Ot.updateMultisampleRenderTarget(w),Ot.updateRenderTargetMipmap(w)),M.isScene===!0&&M.onAfterRender(T,M,D),lt.resetDefaultState(),E=-1,S=null,A.pop(),A.length>0?(f=A[A.length-1],Rt===!0&&$.setGlobalState(T.clippingPlanes,f.state.camera)):f=null,b.pop(),b.length>0?m=b[b.length-1]:m=null};function br(M,D,I,F){if(M.visible===!1)return;if(M.layers.test(D.layers)){if(M.isGroup)I=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(D);else if(M.isLight)f.pushLight(M),M.castShadow&&f.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||Vt.intersectsSprite(M)){F&&Ct.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Z);const ut=O.update(M),yt=M.material;yt.visible&&m.push(M,ut,yt,I,Ct.z,null)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||Vt.intersectsObject(M))){const ut=O.update(M),yt=M.material;if(F&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Ct.copy(M.boundingSphere.center)):(ut.boundingSphere===null&&ut.computeBoundingSphere(),Ct.copy(ut.boundingSphere.center)),Ct.applyMatrix4(M.matrixWorld).applyMatrix4(Z)),Array.isArray(yt)){const vt=ut.groups;for(let Dt=0,Lt=vt.length;Dt<Lt;Dt++){const Pt=vt[Dt],Ht=yt[Pt.materialIndex];Ht&&Ht.visible&&m.push(M,ut,Ht,I,Ct.z,Pt)}}else yt.visible&&m.push(M,ut,yt,I,Ct.z,null)}}const nt=M.children;for(let ut=0,yt=nt.length;ut<yt;ut++)br(nt[ut],D,I,F)}function bo(M,D,I,F){const L=M.opaque,nt=M.transmissive,ut=M.transparent;f.setupLightsView(I),Rt===!0&&$.setGlobalState(T.clippingPlanes,I),F&&mt.viewport(N.copy(F)),L.length>0&&Fi(L,D,I),nt.length>0&&Fi(nt,D,I),ut.length>0&&Fi(ut,D,I),mt.buffers.depth.setTest(!0),mt.buffers.depth.setMask(!0),mt.buffers.color.setMask(!0),mt.setPolygonOffset(!1)}function Ro(M,D,I,F){if((I.isScene===!0?I.overrideMaterial:null)!==null)return;f.state.transmissionRenderTarget[F.id]===void 0&&(f.state.transmissionRenderTarget[F.id]=new zn(1,1,{generateMipmaps:!0,type:wt.has("EXT_color_buffer_half_float")||wt.has("EXT_color_buffer_float")?wi:Ze,minFilter:Dn,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Gt.workingColorSpace}));const nt=f.state.transmissionRenderTarget[F.id],ut=F.viewport||N;nt.setSize(ut.z*T.transmissionResolutionScale,ut.w*T.transmissionResolutionScale);const yt=T.getRenderTarget(),vt=T.getActiveCubeFace(),Dt=T.getActiveMipmapLevel();T.setRenderTarget(nt),T.getClearColor(j),k=T.getClearAlpha(),k<1&&T.setClearColor(16777215,.5),T.clear(),Bt&&xt.render(I);const Lt=T.toneMapping;T.toneMapping=Tn;const Pt=F.viewport;if(F.viewport!==void 0&&(F.viewport=void 0),f.setupLightsView(F),Rt===!0&&$.setGlobalState(T.clippingPlanes,F),Fi(M,I,F),Ot.updateMultisampleRenderTarget(nt),Ot.updateRenderTargetMipmap(nt),wt.has("WEBGL_multisampled_render_to_texture")===!1){let Ht=!1;for(let Jt=0,le=D.length;Jt<le;Jt++){const ee=D[Jt],$t=ee.object,Nt=ee.geometry,ie=ee.material,Xt=ee.group;if(ie.side===ze&&$t.layers.test(F.layers)){const Re=ie.side;ie.side=Ae,ie.needsUpdate=!0,Uo($t,I,F,Nt,ie,Xt),ie.side=Re,ie.needsUpdate=!0,Ht=!0}}Ht===!0&&(Ot.updateMultisampleRenderTarget(nt),Ot.updateRenderTargetMipmap(nt))}T.setRenderTarget(yt,vt,Dt),T.setClearColor(j,k),Pt!==void 0&&(F.viewport=Pt),T.toneMapping=Lt}function Fi(M,D,I){const F=D.isScene===!0?D.overrideMaterial:null;for(let L=0,nt=M.length;L<nt;L++){const ut=M[L],yt=ut.object,vt=ut.geometry,Dt=ut.group;let Lt=ut.material;Lt.allowOverride===!0&&F!==null&&(Lt=F),yt.layers.test(I.layers)&&Uo(yt,D,I,vt,Lt,Dt)}}function Uo(M,D,I,F,L,nt){M.onBeforeRender(T,D,I,F,L,nt),M.modelViewMatrix.multiplyMatrices(I.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),L.onBeforeRender(T,D,I,F,M,nt),L.transparent===!0&&L.side===ze&&L.forceSinglePass===!1?(L.side=Ae,L.needsUpdate=!0,T.renderBufferDirect(I,D,F,L,M,nt),L.side=je,L.needsUpdate=!0,T.renderBufferDirect(I,D,F,L,M,nt),L.side=ze):T.renderBufferDirect(I,D,F,L,M,nt),M.onAfterRender(T,D,I,F,L,nt)}function _i(M,D,I){D.isScene!==!0&&(D=Et);const F=St.get(M),L=f.state.lights,nt=f.state.shadowsArray,ut=L.state.version,yt=X.getParameters(M,L.state,nt,D,I),vt=X.getProgramCacheKey(yt);let Dt=F.programs;F.environment=M.isMeshStandardMaterial?D.environment:null,F.fog=D.fog,F.envMap=(M.isMeshStandardMaterial?Qt:ae).get(M.envMap||F.environment),F.envMapRotation=F.environment!==null&&M.envMap===null?D.environmentRotation:M.envMapRotation,Dt===void 0&&(M.addEventListener("dispose",J),Dt=new Map,F.programs=Dt);let Lt=Dt.get(vt);if(Lt!==void 0){if(F.currentProgram===Lt&&F.lightsStateVersion===ut)return Co(M,yt),Lt}else yt.uniforms=X.getUniforms(M),M.onBeforeCompile(yt,T),Lt=X.acquireProgram(yt,vt),Dt.set(vt,Lt),F.uniforms=yt.uniforms;const Pt=F.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Pt.clippingPlanes=$.uniform),Co(M,yt),F.needsLights=Pl(M),F.lightsStateVersion=ut,F.needsLights&&(Pt.ambientLightColor.value=L.state.ambient,Pt.lightProbe.value=L.state.probe,Pt.directionalLights.value=L.state.directional,Pt.directionalLightShadows.value=L.state.directionalShadow,Pt.spotLights.value=L.state.spot,Pt.spotLightShadows.value=L.state.spotShadow,Pt.rectAreaLights.value=L.state.rectArea,Pt.ltc_1.value=L.state.rectAreaLTC1,Pt.ltc_2.value=L.state.rectAreaLTC2,Pt.pointLights.value=L.state.point,Pt.pointLightShadows.value=L.state.pointShadow,Pt.hemisphereLights.value=L.state.hemi,Pt.directionalShadowMap.value=L.state.directionalShadowMap,Pt.directionalShadowMatrix.value=L.state.directionalShadowMatrix,Pt.spotShadowMap.value=L.state.spotShadowMap,Pt.spotLightMatrix.value=L.state.spotLightMatrix,Pt.spotLightMap.value=L.state.spotLightMap,Pt.pointShadowMap.value=L.state.pointShadowMap,Pt.pointShadowMatrix.value=L.state.pointShadowMatrix),F.currentProgram=Lt,F.uniformsList=null,Lt}function Po(M){if(M.uniformsList===null){const D=M.currentProgram.getUniforms();M.uniformsList=pr.seqWithValue(D.seq,M.uniforms)}return M.uniformsList}function Co(M,D){const I=St.get(M);I.outputColorSpace=D.outputColorSpace,I.batching=D.batching,I.batchingColor=D.batchingColor,I.instancing=D.instancing,I.instancingColor=D.instancingColor,I.instancingMorph=D.instancingMorph,I.skinning=D.skinning,I.morphTargets=D.morphTargets,I.morphNormals=D.morphNormals,I.morphColors=D.morphColors,I.morphTargetsCount=D.morphTargetsCount,I.numClippingPlanes=D.numClippingPlanes,I.numIntersection=D.numClipIntersection,I.vertexAlphas=D.vertexAlphas,I.vertexTangents=D.vertexTangents,I.toneMapping=D.toneMapping}function Rl(M,D,I,F,L){D.isScene!==!0&&(D=Et),Ot.resetTextureUnits();const nt=D.fog,ut=F.isMeshStandardMaterial?D.environment:null,yt=w===null?T.outputColorSpace:w.isXRRenderTarget===!0?w.texture.colorSpace:li,vt=(F.isMeshStandardMaterial?Qt:ae).get(F.envMap||ut),Dt=F.vertexColors===!0&&!!I.attributes.color&&I.attributes.color.itemSize===4,Lt=!!I.attributes.tangent&&(!!F.normalMap||F.anisotropy>0),Pt=!!I.morphAttributes.position,Ht=!!I.morphAttributes.normal,Jt=!!I.morphAttributes.color;let le=Tn;F.toneMapped&&(w===null||w.isXRRenderTarget===!0)&&(le=T.toneMapping);const ee=I.morphAttributes.position||I.morphAttributes.normal||I.morphAttributes.color,$t=ee!==void 0?ee.length:0,Nt=St.get(F),ie=f.state.lights;if(Rt===!0&&(H===!0||M!==S)){const Te=M===S&&F.id===E;$.setState(F,M,Te)}let Xt=!1;F.version===Nt.__version?(Nt.needsLights&&Nt.lightsStateVersion!==ie.state.version||Nt.outputColorSpace!==yt||L.isBatchedMesh&&Nt.batching===!1||!L.isBatchedMesh&&Nt.batching===!0||L.isBatchedMesh&&Nt.batchingColor===!0&&L.colorTexture===null||L.isBatchedMesh&&Nt.batchingColor===!1&&L.colorTexture!==null||L.isInstancedMesh&&Nt.instancing===!1||!L.isInstancedMesh&&Nt.instancing===!0||L.isSkinnedMesh&&Nt.skinning===!1||!L.isSkinnedMesh&&Nt.skinning===!0||L.isInstancedMesh&&Nt.instancingColor===!0&&L.instanceColor===null||L.isInstancedMesh&&Nt.instancingColor===!1&&L.instanceColor!==null||L.isInstancedMesh&&Nt.instancingMorph===!0&&L.morphTexture===null||L.isInstancedMesh&&Nt.instancingMorph===!1&&L.morphTexture!==null||Nt.envMap!==vt||F.fog===!0&&Nt.fog!==nt||Nt.numClippingPlanes!==void 0&&(Nt.numClippingPlanes!==$.numPlanes||Nt.numIntersection!==$.numIntersection)||Nt.vertexAlphas!==Dt||Nt.vertexTangents!==Lt||Nt.morphTargets!==Pt||Nt.morphNormals!==Ht||Nt.morphColors!==Jt||Nt.toneMapping!==le||Nt.morphTargetsCount!==$t)&&(Xt=!0):(Xt=!0,Nt.__version=F.version);let Re=Nt.currentProgram;Xt===!0&&(Re=_i(F,D,L));let In=!1,Ue=!1,mi=!1;const re=Re.getUniforms(),qe=Nt.uniforms;if(mt.useProgram(Re.program)&&(In=!0,Ue=!0,mi=!0),F.id!==E&&(E=F.id,Ue=!0),In||S!==M){mt.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),re.setValue(R,"projectionMatrix",M.projectionMatrix),re.setValue(R,"viewMatrix",M.matrixWorldInverse);const ye=re.map.cameraPosition;ye!==void 0&&ye.setValue(R,ft.setFromMatrixPosition(M.matrixWorld)),Ut.logarithmicDepthBuffer&&re.setValue(R,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(F.isMeshPhongMaterial||F.isMeshToonMaterial||F.isMeshLambertMaterial||F.isMeshBasicMaterial||F.isMeshStandardMaterial||F.isShaderMaterial)&&re.setValue(R,"isOrthographic",M.isOrthographicCamera===!0),S!==M&&(S=M,Ue=!0,mi=!0)}if(L.isSkinnedMesh){re.setOptional(R,L,"bindMatrix"),re.setOptional(R,L,"bindMatrixInverse");const Te=L.skeleton;Te&&(Te.boneTexture===null&&Te.computeBoneTexture(),re.setValue(R,"boneTexture",Te.boneTexture,Ot))}L.isBatchedMesh&&(re.setOptional(R,L,"batchingTexture"),re.setValue(R,"batchingTexture",L._matricesTexture,Ot),re.setOptional(R,L,"batchingIdTexture"),re.setValue(R,"batchingIdTexture",L._indirectTexture,Ot),re.setOptional(R,L,"batchingColorTexture"),L._colorsTexture!==null&&re.setValue(R,"batchingColorTexture",L._colorsTexture,Ot));const Ve=I.morphAttributes;if((Ve.position!==void 0||Ve.normal!==void 0||Ve.color!==void 0)&&tt.update(L,I,Re),(Ue||Nt.receiveShadow!==L.receiveShadow)&&(Nt.receiveShadow=L.receiveShadow,re.setValue(R,"receiveShadow",L.receiveShadow)),F.isMeshGouraudMaterial&&F.envMap!==null&&(qe.envMap.value=vt,qe.flipEnvMap.value=vt.isCubeTexture&&vt.isRenderTargetTexture===!1?-1:1),F.isMeshStandardMaterial&&F.envMap===null&&D.environment!==null&&(qe.envMapIntensity.value=D.environmentIntensity),Ue&&(re.setValue(R,"toneMappingExposure",T.toneMappingExposure),Nt.needsLights&&Ul(qe,mi),nt&&F.fog===!0&&K.refreshFogUniforms(qe,nt),K.refreshMaterialUniforms(qe,F,W,Y,f.state.transmissionRenderTarget[M.id]),pr.upload(R,Po(Nt),qe,Ot)),F.isShaderMaterial&&F.uniformsNeedUpdate===!0&&(pr.upload(R,Po(Nt),qe,Ot),F.uniformsNeedUpdate=!1),F.isSpriteMaterial&&re.setValue(R,"center",L.center),re.setValue(R,"modelViewMatrix",L.modelViewMatrix),re.setValue(R,"normalMatrix",L.normalMatrix),re.setValue(R,"modelMatrix",L.matrixWorld),F.isShaderMaterial||F.isRawShaderMaterial){const Te=F.uniformsGroups;for(let ye=0,Rr=Te.length;ye<Rr;ye++){const Sn=Te[ye];It.update(Sn,Re),It.bind(Sn,Re)}}return Re}function Ul(M,D){M.ambientLightColor.needsUpdate=D,M.lightProbe.needsUpdate=D,M.directionalLights.needsUpdate=D,M.directionalLightShadows.needsUpdate=D,M.pointLights.needsUpdate=D,M.pointLightShadows.needsUpdate=D,M.spotLights.needsUpdate=D,M.spotLightShadows.needsUpdate=D,M.rectAreaLights.needsUpdate=D,M.hemisphereLights.needsUpdate=D}function Pl(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return U},this.getActiveMipmapLevel=function(){return C},this.getRenderTarget=function(){return w},this.setRenderTargetTextures=function(M,D,I){const F=St.get(M);F.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,F.__autoAllocateDepthBuffer===!1&&(F.__useRenderToTexture=!1),St.get(M.texture).__webglTexture=D,St.get(M.depthTexture).__webglTexture=F.__autoAllocateDepthBuffer?void 0:I,F.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,D){const I=St.get(M);I.__webglFramebuffer=D,I.__useDefaultFramebuffer=D===void 0};const Cl=R.createFramebuffer();this.setRenderTarget=function(M,D=0,I=0){w=M,U=D,C=I;let F=!0,L=null,nt=!1,ut=!1;if(M){const vt=St.get(M);if(vt.__useDefaultFramebuffer!==void 0)mt.bindFramebuffer(R.FRAMEBUFFER,null),F=!1;else if(vt.__webglFramebuffer===void 0)Ot.setupRenderTarget(M);else if(vt.__hasExternalTextures)Ot.rebindTextures(M,St.get(M.texture).__webglTexture,St.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){const Pt=M.depthTexture;if(vt.__boundDepthTexture!==Pt){if(Pt!==null&&St.has(Pt)&&(M.width!==Pt.image.width||M.height!==Pt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");Ot.setupDepthRenderbuffer(M)}}const Dt=M.texture;(Dt.isData3DTexture||Dt.isDataArrayTexture||Dt.isCompressedArrayTexture)&&(ut=!0);const Lt=St.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Lt[D])?L=Lt[D][I]:L=Lt[D],nt=!0):M.samples>0&&Ot.useMultisampledRTT(M)===!1?L=St.get(M).__webglMultisampledFramebuffer:Array.isArray(Lt)?L=Lt[I]:L=Lt,N.copy(M.viewport),z.copy(M.scissor),_=M.scissorTest}else N.copy(G).multiplyScalar(W).floor(),z.copy(rt).multiplyScalar(W).floor(),_=pt;if(I!==0&&(L=Cl),mt.bindFramebuffer(R.FRAMEBUFFER,L)&&F&&mt.drawBuffers(M,L),mt.viewport(N),mt.scissor(z),mt.setScissorTest(_),nt){const vt=St.get(M.texture);R.framebufferTexture2D(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_CUBE_MAP_POSITIVE_X+D,vt.__webglTexture,I)}else if(ut){const vt=D;for(let Dt=0;Dt<M.textures.length;Dt++){const Lt=St.get(M.textures[Dt]);R.framebufferTextureLayer(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0+Dt,Lt.__webglTexture,I,vt)}}else if(M!==null&&I!==0){const vt=St.get(M.texture);R.framebufferTexture2D(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,vt.__webglTexture,I)}E=-1},this.readRenderTargetPixels=function(M,D,I,F,L,nt,ut,yt=0){if(!(M&&M.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let vt=St.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ut!==void 0&&(vt=vt[ut]),vt){mt.bindFramebuffer(R.FRAMEBUFFER,vt);try{const Dt=M.textures[yt],Lt=Dt.format,Pt=Dt.type;if(!Ut.textureFormatReadable(Lt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Ut.textureTypeReadable(Pt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}D>=0&&D<=M.width-F&&I>=0&&I<=M.height-L&&(M.textures.length>1&&R.readBuffer(R.COLOR_ATTACHMENT0+yt),R.readPixels(D,I,F,L,At.convert(Lt),At.convert(Pt),nt))}finally{const Dt=w!==null?St.get(w).__webglFramebuffer:null;mt.bindFramebuffer(R.FRAMEBUFFER,Dt)}}},this.readRenderTargetPixelsAsync=async function(M,D,I,F,L,nt,ut,yt=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let vt=St.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&ut!==void 0&&(vt=vt[ut]),vt)if(D>=0&&D<=M.width-F&&I>=0&&I<=M.height-L){mt.bindFramebuffer(R.FRAMEBUFFER,vt);const Dt=M.textures[yt],Lt=Dt.format,Pt=Dt.type;if(!Ut.textureFormatReadable(Lt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Ut.textureTypeReadable(Pt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ht=R.createBuffer();R.bindBuffer(R.PIXEL_PACK_BUFFER,Ht),R.bufferData(R.PIXEL_PACK_BUFFER,nt.byteLength,R.STREAM_READ),M.textures.length>1&&R.readBuffer(R.COLOR_ATTACHMENT0+yt),R.readPixels(D,I,F,L,At.convert(Lt),At.convert(Pt),0);const Jt=w!==null?St.get(w).__webglFramebuffer:null;mt.bindFramebuffer(R.FRAMEBUFFER,Jt);const le=R.fenceSync(R.SYNC_GPU_COMMANDS_COMPLETE,0);return R.flush(),await Lc(R,le,4),R.bindBuffer(R.PIXEL_PACK_BUFFER,Ht),R.getBufferSubData(R.PIXEL_PACK_BUFFER,0,nt),R.deleteBuffer(Ht),R.deleteSync(le),nt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,D=null,I=0){const F=Math.pow(2,-I),L=Math.floor(M.image.width*F),nt=Math.floor(M.image.height*F),ut=D!==null?D.x:0,yt=D!==null?D.y:0;Ot.setTexture2D(M,0),R.copyTexSubImage2D(R.TEXTURE_2D,I,0,0,ut,yt,L,nt),mt.unbindTexture()};const Nl=R.createFramebuffer(),ql=R.createFramebuffer();this.copyTextureToTexture=function(M,D,I=null,F=null,L=0,nt=null){nt===null&&(L!==0?(qi("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),nt=L,L=0):nt=0);let ut,yt,vt,Dt,Lt,Pt,Ht,Jt,le;const ee=M.isCompressedTexture?M.mipmaps[nt]:M.image;if(I!==null)ut=I.max.x-I.min.x,yt=I.max.y-I.min.y,vt=I.isBox3?I.max.z-I.min.z:1,Dt=I.min.x,Lt=I.min.y,Pt=I.isBox3?I.min.z:0;else{const Ve=Math.pow(2,-L);ut=Math.floor(ee.width*Ve),yt=Math.floor(ee.height*Ve),M.isDataArrayTexture?vt=ee.depth:M.isData3DTexture?vt=Math.floor(ee.depth*Ve):vt=1,Dt=0,Lt=0,Pt=0}F!==null?(Ht=F.x,Jt=F.y,le=F.z):(Ht=0,Jt=0,le=0);const $t=At.convert(D.format),Nt=At.convert(D.type);let ie;D.isData3DTexture?(Ot.setTexture3D(D,0),ie=R.TEXTURE_3D):D.isDataArrayTexture||D.isCompressedArrayTexture?(Ot.setTexture2DArray(D,0),ie=R.TEXTURE_2D_ARRAY):(Ot.setTexture2D(D,0),ie=R.TEXTURE_2D),R.pixelStorei(R.UNPACK_FLIP_Y_WEBGL,D.flipY),R.pixelStorei(R.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),R.pixelStorei(R.UNPACK_ALIGNMENT,D.unpackAlignment);const Xt=R.getParameter(R.UNPACK_ROW_LENGTH),Re=R.getParameter(R.UNPACK_IMAGE_HEIGHT),In=R.getParameter(R.UNPACK_SKIP_PIXELS),Ue=R.getParameter(R.UNPACK_SKIP_ROWS),mi=R.getParameter(R.UNPACK_SKIP_IMAGES);R.pixelStorei(R.UNPACK_ROW_LENGTH,ee.width),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,ee.height),R.pixelStorei(R.UNPACK_SKIP_PIXELS,Dt),R.pixelStorei(R.UNPACK_SKIP_ROWS,Lt),R.pixelStorei(R.UNPACK_SKIP_IMAGES,Pt);const re=M.isDataArrayTexture||M.isData3DTexture,qe=D.isDataArrayTexture||D.isData3DTexture;if(M.isDepthTexture){const Ve=St.get(M),Te=St.get(D),ye=St.get(Ve.__renderTarget),Rr=St.get(Te.__renderTarget);mt.bindFramebuffer(R.READ_FRAMEBUFFER,ye.__webglFramebuffer),mt.bindFramebuffer(R.DRAW_FRAMEBUFFER,Rr.__webglFramebuffer);for(let Sn=0;Sn<vt;Sn++)re&&(R.framebufferTextureLayer(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,St.get(M).__webglTexture,L,Pt+Sn),R.framebufferTextureLayer(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,St.get(D).__webglTexture,nt,le+Sn)),R.blitFramebuffer(Dt,Lt,ut,yt,Ht,Jt,ut,yt,R.DEPTH_BUFFER_BIT,R.NEAREST);mt.bindFramebuffer(R.READ_FRAMEBUFFER,null),mt.bindFramebuffer(R.DRAW_FRAMEBUFFER,null)}else if(L!==0||M.isRenderTargetTexture||St.has(M)){const Ve=St.get(M),Te=St.get(D);mt.bindFramebuffer(R.READ_FRAMEBUFFER,Nl),mt.bindFramebuffer(R.DRAW_FRAMEBUFFER,ql);for(let ye=0;ye<vt;ye++)re?R.framebufferTextureLayer(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,Ve.__webglTexture,L,Pt+ye):R.framebufferTexture2D(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,Ve.__webglTexture,L),qe?R.framebufferTextureLayer(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,Te.__webglTexture,nt,le+ye):R.framebufferTexture2D(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,Te.__webglTexture,nt),L!==0?R.blitFramebuffer(Dt,Lt,ut,yt,Ht,Jt,ut,yt,R.COLOR_BUFFER_BIT,R.NEAREST):qe?R.copyTexSubImage3D(ie,nt,Ht,Jt,le+ye,Dt,Lt,ut,yt):R.copyTexSubImage2D(ie,nt,Ht,Jt,Dt,Lt,ut,yt);mt.bindFramebuffer(R.READ_FRAMEBUFFER,null),mt.bindFramebuffer(R.DRAW_FRAMEBUFFER,null)}else qe?M.isDataTexture||M.isData3DTexture?R.texSubImage3D(ie,nt,Ht,Jt,le,ut,yt,vt,$t,Nt,ee.data):D.isCompressedArrayTexture?R.compressedTexSubImage3D(ie,nt,Ht,Jt,le,ut,yt,vt,$t,ee.data):R.texSubImage3D(ie,nt,Ht,Jt,le,ut,yt,vt,$t,Nt,ee):M.isDataTexture?R.texSubImage2D(R.TEXTURE_2D,nt,Ht,Jt,ut,yt,$t,Nt,ee.data):M.isCompressedTexture?R.compressedTexSubImage2D(R.TEXTURE_2D,nt,Ht,Jt,ee.width,ee.height,$t,ee.data):R.texSubImage2D(R.TEXTURE_2D,nt,Ht,Jt,ut,yt,$t,Nt,ee);R.pixelStorei(R.UNPACK_ROW_LENGTH,Xt),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,Re),R.pixelStorei(R.UNPACK_SKIP_PIXELS,In),R.pixelStorei(R.UNPACK_SKIP_ROWS,Ue),R.pixelStorei(R.UNPACK_SKIP_IMAGES,mi),nt===0&&D.generateMipmaps&&R.generateMipmap(ie),mt.unbindTexture()},this.initRenderTarget=function(M){St.get(M).__webglFramebuffer===void 0&&Ot.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?Ot.setTextureCube(M,0):M.isData3DTexture?Ot.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?Ot.setTexture2DArray(M,0):Ot.setTexture2D(M,0),mt.unbindTexture()},this.resetState=function(){U=0,C=0,w=null,mt.reset(),lt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Qe}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=Gt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Gt._getUnpackColorSpace()}}function vm(i){if(!i||!Number.isInteger(i.capacity)||i.capacity<2||i.capacity>6)throw new Error("capacity 必须是 2–6 的整数");if(!Array.isArray(i.bottles)||i.bottles.length<2||i.bottles.length>12)throw new Error("bottles 需要 2–12 个瓶子");if(!i.colors||!Object.keys(i.colors).length||Object.values(i.colors).some(e=>!/^#[0-9a-f]{6}$/i.test(e)))throw new Error("colors 需要使用 #RRGGBB 颜色值");const t={};for(const e of i.bottles){if(!Array.isArray(e)||e.length>i.capacity)throw new Error("瓶子层数不能超过 capacity");for(const n of e){if(!Object.hasOwn(i.colors,n))throw new Error(`未知颜色：${n}`);t[n]=(t[n]||0)+1}}if(!Object.keys(t).length||Object.values(t).some(e=>e%i.capacity))throw new Error("每种颜色的格数必须是容量的整数倍");return i}function yl(i,t,e,n){const r=i[t],s=i[e];if(!r||!s||t===e||!r.length||s.length===n)return null;const o=r.at(-1);if(s.length&&s.at(-1)!==o)return null;let a=0;for(let c=r.length-1;c>=0&&r[c]===o;c--)a++;return{color:o,count:Math.min(a,n-s.length)}}function gm(i,t,e,n){const r=yl(i,t,e,n);if(!r)return null;const s=structuredClone(i);return s[t].splice(-r.count),s[e].push(...Array(r.count).fill(r.color)),s}const as=(i,t)=>i.every(e=>!e.length||e.length===t&&e.every(n=>n===e[0])),he=Object.freeze({outerRadius:.415,innerRadius:.378,liquidRadius:.365,outerBottomHeight:.285,innerBottom:.045,innerBottomHeight:.25,rimStart:2.525,mouthHeight:2.6});function xm(i,t){const e=new cl;e.background=new kt("#101317");for(const[s,o,a,c]of[[[-3,3,4],[1.1,6],3.2,"#fff3df"],[[3,2,3],[.35,5],2.4,"#deedff"],[[0,6,0],[4,1],2,"#ffffff"],[[-1,1,-4],[2,3],.4,"#b8c8de"]]){const l=new ve(new Ii(...o),new Vi({color:new kt(c).multiplyScalar(a)}));l.position.set(...s),l.lookAt(0,1.2,0),e.add(l)}const n=new Js(i),r=n.fromScene(e,.015);t.environment=r.texture,n.dispose(),e.traverse(s=>{s.geometry?.dispose(),s.material?.dispose()}),t.add(new Ru(15332351,1251101,.38));for(const[s,o,a]of[[16774887,2.1,[-4,6,5]],[13100031,.8,[4,3,-1]],[12241120,.45,[-1,-3,5]]]){const c=new Cu(s,o);c.position.set(...a),t.add(c)}return r}const Er=[new dt(0,0)];for(let i=1;i<=32;i++){const t=i/32*Math.PI/2;Er.push(new dt(he.outerRadius*Math.sin(t),he.outerBottomHeight*(1-Math.cos(t))))}Er.push(new dt(he.outerRadius,he.rimStart));const Al=[new dt(he.innerRadius,he.rimStart),new dt(he.innerRadius,he.innerBottom+he.innerBottomHeight)];for(let i=31;i>=0;i--){const t=i/32*Math.PI/2;Al.push(new dt(he.innerRadius*Math.sin(t),he.innerBottom+he.innerBottomHeight*(1-Math.cos(t))))}const Mm=new zi([...Er,...Al],96),Tm=new zi(Er,96),$s=[new dt(he.outerRadius,he.rimStart)];function Sr(i,t,e){const n=new dl($s.at(-1),new dt(...i),new dt(...t),new dt(...e));$s.push(...n.getPoints(12).slice(1))}Sr([.415,2.549],[.448,2.545],[.453,2.576]);Sr([.461,2.607],[.439,2.619],[.418,2.619]);Sr([.394,2.619],[.378,2.613],[.378,2.6]);Sr([.378,2.578],[.378,2.548],[.378,he.rimStart]);const Na=new zi($s,96),Em=new Mr({color:"#edf6ff",transmission:1,thickness:.06,ior:1.46,roughness:.025,metalness:0,transparent:!0,opacity:.055,depthWrite:!1,envMapIntensity:.8,side:je}),Sm=new Mr({color:"#f3f7fa",transmission:.94,thickness:.045,ior:1.46,roughness:.035,metalness:0,transparent:!0,opacity:.24,depthWrite:!1,envMapIntensity:1.6,clearcoat:1}),qa=new cn({transparent:!0,depthWrite:!1,side:je,vertexShader:`varying vec3 normalView; varying vec3 viewDirection; varying vec3 localPosition;
    void main(){vec4 p=modelViewMatrix*vec4(position,1.); normalView=normalize(normalMatrix*normal); viewDirection=normalize(-p.xyz);localPosition=position;gl_Position=projectionMatrix*p;}`,fragmentShader:`varying vec3 normalView; varying vec3 viewDirection; varying vec3 localPosition;
    void main(){
      vec3 n=normalize(normalView);vec3 v=normalize(viewDirection);
      float fresnel=pow(1.-abs(dot(n,v)),3.);
      vec3 r=reflect(-v,n);
      float left=exp(-pow((r.x+.73)/.075,2.))*smoothstep(-.3,.5,r.z);
      float leftSoft=exp(-pow((r.x+.63)/.19,2.))*.20*smoothstep(-.3,.5,r.z);
      float right=exp(-pow((r.x-.86)/.038,2.))*smoothstep(-.4,.35,r.z)*.65;
      float taper=smoothstep(.035,.31,localPosition.y)*(1.-smoothstep(2.36,2.58,localPosition.y));
      float alpha=.007+fresnel*.29+(left+leftSoft+right)*taper*.5;
      vec3 tint=mix(vec3(.78,.86,.94),vec3(1.,.98,.92),left);
      gl_FragColor=vec4(tint,clamp(alpha,0.,.78));
    }`});function ym(){const i=new Ln,t=new ve(Mm,Em);t.renderOrder=3;const e=new ve(Tm,qa);e.renderOrder=4,i.add(t,e);const n=new ve(Na,Sm);n.renderOrder=5;const r=new ve(Na,qa);return r.renderOrder=6,i.add(n,r),i}function Am(i){return new Mr({color:i,roughness:.19,metalness:0,ior:1.33,specularIntensity:.75,clearcoat:.65,clearcoatRoughness:.085,envMapIntensity:.48,side:ze})}function bm(i){return new Mr({color:i,roughness:.13,metalness:0,ior:1.33,specularIntensity:1,clearcoat:1,clearcoatRoughness:.04,envMapIntensity:.65,side:ze})}const Va=Object.freeze({radius:.365,bottom:.12,top:2.6,rounding:.24,scaleY:1.35,scaleXZ:.86,radialSegments:48,roundedSegments:10}),xn=1e-7,$n=new Map;function yr(i={}){const t={...Va,...i},e=Object.keys(Va).map(x=>t[x]).join(":");if($n.has(e))return $n.get(e);const{radius:n,bottom:r,top:s,rounding:o,radialSegments:a,roundedSegments:c}=t;if(!(n>0&&s>r&&o>0&&o<s-r))throw new RangeError("The liquid vessel needs a positive radius, height, and rounded foot.");const l=[],u=[];for(let x=0;x<=c;x++){const m=x/c*Math.PI/2,f=r+o*(1-Math.cos(m)),b=n*Math.sin(m);u.push(Array.from({length:a},(A,T)=>{const P=T/a*Math.PI*2;return[b*Math.cos(P),f,b*Math.sin(P)]}))}u.push(u.at(-1).map(([x,,m])=>[x,s,m]));for(let x=0;x<u.length-1;x++)for(let m=0;m<a;m++){const f=(m+1)%a,b=u[x][m],A=u[x+1][m],T=u[x+1][f],P=u[x][f];l.push([b,A,T]),x>0&&l.push([b,T,P])}for(let x=0;x<a;x++)l.push([[0,s,0],u.at(-1)[(x+1)%a],u.at(-1)[x]]);const h=[],d=64;for(let x=0;x<=d;x++){const m=r+x/d*o,f=1-x/d,b=n*Math.sqrt(1-f*f),A=x===0||x===d?1:x%2?4:2;h.push({y:m,radius:b,area:Math.PI*b*b,weight:o/d/3*A})}const p=Math.PI*n*n*(s-r-o/3),g={...t,triangles:l,slices:h,totalVolume:p,levels:new Map};return $n.size>12&&$n.delete($n.keys().next().value),$n.set(e,g),g}function Ar(i,t){return[Math.sin(i)*t.scaleXZ,Math.cos(i)*t.scaleY,0]}const ni=(i,t)=>i[0]*t[0]+i[1]*t[1]+i[2]*t[2];function wa(i){return i<=-1?0:i>=1?Math.PI:Math.acos(-i)+i*Math.sqrt(1-i*i)}function Da(i){if(i<=-1)return 0;if(i>=1)return Math.PI*i;const t=Math.sqrt(1-i*i);return i*Math.acos(-i)+t-t*t*t/3}function Eo(i,t,e){const n=Math.abs(t[0]);if(n<1e-8){const h=i/t[1];return t[1]<0?1-La(h,e):La(h,e)}const{radius:r,bottom:s,top:o,rounding:a}=e,c=s+a,l=n*r;let u;if(Math.abs(t[1])<1e-7)u=r*r*(o-c)*wa(i/l);else{const h=(i-t[1]*c)/l,d=(i-t[1]*o)/l;u=r*r*l/t[1]*(Da(h)-Da(d))}for(const h of e.slices){if(!h.radius)continue;const d=(i-t[1]*h.y)/n;u+=h.radius*h.radius*wa(d/h.radius)*h.weight}return Math.max(0,Math.min(1,u/e.totalVolume))}function La(i,t){const{bottom:e,top:n,rounding:r}=t,s=Math.max(0,Math.min(n-e,i-e));return(s<r?s*s/r-s*s*s/(3*r*r):s-r/3)/(n-e-r/3)}function Rm(i,t=0,e={}){const n=yr(e);return Eo(i,Ar(t,n),n)}function to(i,t=0,e={}){const n=yr(e);i=Math.max(0,Math.min(1,i));const r=`${t}:${i}`;if(n.levels.has(r))return n.levels.get(r);const s=Ar(t,n);let o=Math.min(s[1]*n.bottom,s[1]*n.top)-Math.abs(s[0])*n.radius,a=Math.max(s[1]*n.bottom,s[1]*n.top)+Math.abs(s[0])*n.radius,c;if(i===0)c=o-xn;else if(i===1)c=a+xn;else{for(let l=0;l<27;l++){const u=(o+a)/2;Eo(u,s,n)<i?o=u:a=u}c=(o+a)/2}return n.levels.size>160&&n.levels.clear(),n.levels.set(r,c),c}function ls(i,t={}){const e=yr(t);if(i=Math.max(0,Math.min(1,i)),i>=1)return 0;if(i<=0)return Math.PI/2;let n=0,r=Math.PI/2;for(let s=0;s<24;s++){const o=(n+r)/2,a=Ar(o,e),c=a[1]*e.top-Math.abs(a[0])*e.radius;Eo(c,a,e)>i?n=o:r=o}return(n+r)/2}function Oa(i,t,e,n,r){if(!i.length)return i;const s=[];for(let o=0;o<i.length;o++){const a=i[o],c=i[(o+1)%i.length],l=ni(t,a)-e,u=ni(t,c)-e,h=n?l<=xn:l>=-xn,d=n?u<=xn:u>=-xn;if(h&&s.push(a),h!==d){const p=l/(l-u),g=a.map((x,m)=>x+(c[m]-x)*p);s.push(g),r.push(g)}}return s}function eo(i,t,e,n){i.push(...t,...e,...n)}function za(i,t,e,n){const r=new Map;for(const l of t)r.set(l.map(u=>Math.round(u*1e6)).join(":"),l);const s=[...r.values()];if(s.length<3)return[];const o=[0,0,0];for(const l of s)for(let u=0;u<3;u++)o[u]+=l[u]/s.length;const a=Math.hypot(e[0],e[1]),c=[e[1]/a,-e[0]/a,0];s.sort((l,u)=>{const h=Math.atan2(-(l[2]-o[2]),ni(c,l)-ni(c,o)),d=Math.atan2(-(u[2]-o[2]),ni(c,u)-ni(c,o));return h-d});for(let l=0;l<s.length;l++){const u=s[l],h=s[(l+1)%s.length];n?eo(i,o,u,h):eo(i,o,h,u)}return s}function Um(i={}){const t=yr(i),{tilt:e=0}=i,n=Math.max(0,Math.min(1,i.lowerVolume??0)),r=Math.max(0,Math.min(1,i.upperVolume??1)),s=to(n,e,i),o=to(r,e,i),a=new Ne;if(a.userData={lowerLevel:s,upperLevel:o,lowerVolume:n,upperVolume:r},r-n<1e-7)return a;const c=Ar(e,t),l=[],u=[],h=[];for(const b of t.triangles){let A=Oa(b,c,s,!1,u);A=Oa(A,c,o,!0,h);for(let T=1;T<A.length-1;T++)eo(l,A[0],A[T],A[T+1])}const d=l.length/3;za(l,u,c,!1),a.userData.upperContour=za(l,h,c,!0),a.setAttribute("position",new fe(l,3)),a.computeVertexNormals();const p=a.getAttribute("normal"),{bottom:g,rounding:x,radius:m}=t,f=g+x;for(let b=0;b<d;b++){const A=l[b*3],T=l[b*3+1],P=l[b*3+2];if(T>=t.top-xn)continue;const U=A/(m*m),C=T<f?(T-f)/(x*x):0,w=P/(m*m),E=Math.hypot(U,C,w);E>xn&&p.setXYZ(b,U/E,C/E,w/E)}return a.addGroup(0,d,0),a.addGroup(d,l.length/3-d,1),a.computeBoundingSphere(),a}const Pm="data:audio/mpeg;base64,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Y8FwgLDQhpWoxmHS501CockEvcqeJZQqWksd5UfA6WHS4ex2FY8j642NR2OPkgnKIsNnH5G08mSy0v/zQMT5FTBarl4QxiRpdFuSe00bEGLrVWs2RJByeZpJJBajknDx+SGWdUE1+bvrhznmqNbD5MHWT47czWJMNhQ9xn16p3/xFotqJmvXmmJPYi58a1KJw17bbug7/////1zCdMVXij7q//NAxPsVshauX0YQAO1bhrmOmH1NGwQMRm5RVUxBTUxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/83DE/yyTkr5fmFkFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zEMTyAAAD/AHAAABVVVVVVVVVVVVVVVVV";let ne=null,bi=null,no=null,Oe=null,cr=null,ui=0;function So(){if(ne){ne.state==="suspended"&&ne.resume();return}ne=new(window.AudioContext||window.webkitAudioContext),bi=ne.createGain(),bi.gain.value=.6,bi.connect(ne.destination),no=ne.createBuffer(1,ne.sampleRate,ne.sampleRate);const i=no.getChannelData(0);for(let t=0;t<i.length;t++)i[t]=Math.random()*2-1}function bl(i,t,e=.34){const n=330*Math.pow(2,ui*1.15)*(.85+Math.random()*.3),r=ne.createOscillator();r.type="sine",r.frequency.setValueAtTime(n,i),r.frequency.exponentialRampToValueAtTime(n*2.7,i+.085);const s=ne.createGain();s.gain.setValueAtTime(1e-4,i),s.gain.exponentialRampToValueAtTime(e,i+.012),s.gain.exponentialRampToValueAtTime(1e-4,i+.13),r.connect(s),s.connect(t),r.start(i),r.stop(i+.16);const o=ne.createBufferSource();o.buffer=no,o.playbackRate.value=.8+Math.random()*.4;const a=ne.createBiquadFilter();a.type="bandpass",a.frequency.value=900+Math.random()*900,a.Q.value=1.2;const c=ne.createGain();c.gain.setValueAtTime(1e-4,i),c.gain.exponentialRampToValueAtTime(e*.18,i+.01),c.gain.exponentialRampToValueAtTime(1e-4,i+.05),o.connect(a),a.connect(c),c.connect(t),o.start(i,Math.random()*.9),o.stop(i+.07)}function Cm(){if(So(),Oe)return;ui=0;const i=ne.createGain();i.gain.setValueAtTime(0,ne.currentTime);const t=()=>{const e=ne.currentTime+.28;for(;Oe.next<e;)bl(Oe.next,i),Oe.next+=.095-ui*.035+(Math.random()-.5)*.02};Oe={bus:i,next:ne.currentTime+.04,timer:0},i.gain.linearRampToValueAtTime(1,ne.currentTime+.06),i.connect(bi),t(),Oe.timer=setInterval(t,90)}function Nm(i,t){Oe&&(ui=t,Oe.bus.gain.setTargetAtTime(i,ne.currentTime,.04))}function qm(){if(!Oe)return;const{bus:i}=Oe;clearInterval(Oe.timer),Oe=null,ui=Math.min(1,ui+.12),bl(ne.currentTime+.05,bi,.2),setTimeout(()=>i.disconnect(),1e3)}function Ia(){So(),!cr&&(cr="loading",fetch(Pm).then(i=>{if(!i.ok)throw new Error(i.status);return i.arrayBuffer()}).then(i=>ne.decodeAudioData(i)).then(i=>{const t=ne.createBufferSource();t.buffer=i,t.loop=!0;const e=ne.createGain();e.gain.value=.5,t.connect(e),e.connect(ne.destination),t.start(),cr={source:t,gain:e}}).catch(()=>{cr=null}))}function Vm({host:i,level:t,ui:e={},insets:n={}}){const r=G=>e.onStatus?.(G),s=new mm({antialias:!0,alpha:!0});s.setPixelRatio(Math.min(devicePixelRatio,2)),s.setClearColor(0,0),s.toneMapping=Ba,s.toneMappingExposure=.87,i.prepend(s.domElement);const o=new cl,a=new Le(32,1,.1,100);xm(s,o);const c=new V(.86,1.35,.86),l={radius:he.liquidRadius,bottom:he.innerBottom,top:he.mouthHeight,rounding:he.innerBottomHeight,scaleY:c.y,scaleXZ:c.x},u=Rm(2.4*c.y,0,l),h=new vo(.49,.49,2.8,12),d=new Vi({visible:!1}),p=new qu,g=new dt,x=new Map;let m,f,b=-1,A=[],T=[],P=!1,U=null,C=!1;const w={top:Math.min(.35,Math.max(0,n.top||0)),bottom:Math.min(.35,Math.max(0,n.bottom||0))},E=G=>G*G*(3-2*G);function S(G){return x.has(G)||x.set(G,[Am(G),bm(G)]),x.get(G)}function N(G){G.liquids.children.forEach(rt=>rt.geometry.dispose()),G.liquids.clear()}function z(){const G=f.length<=5?f.length:Math.ceil(f.length/2),rt=Math.ceil(f.length/G),pt=rt>1?5.8:3.5,Vt=rt>1?0:.36,Rt=3.55,H=rt>1?Rt/2:2.3;T.forEach((wt,Ut)=>{const mt=Math.floor(Ut/G),Zt=Math.min(G,f.length-mt*G);wt.home.set((Ut%G-(Zt-1)/2)*1.22,((rt-1)/2-mt)*pt,0),wt.group.position.copy(wt.home),wt.group.position.y+=b===Ut?.24:0});const Z=i.clientWidth,ft=i.clientHeight;a.aspect=Z/ft;const Ct=G*1.22+.65,Et=Math.tan(Pr.degToRad(16)),Bt=Math.max(.4,1-w.top-w.bottom),oe=rt>1?((rt-1)*pt+Rt)*1.06:0,R=Math.max(10.2,Ct/(2*Et*a.aspect),oe/(2*Et*Bt)),jt=H+(w.top-w.bottom)*R*Et;a.position.set(0,jt+R*Vt,R),a.lookAt(0,jt,0),a.updateProjectionMatrix(),s.setSize(Z,ft)}function _(){T.forEach(G=>{N(G),o.remove(G.group)}),T=f.map((G,rt)=>{const pt=new Ln;pt.scale.copy(c),pt.add(ym());const Vt=new Ln;pt.add(Vt);const Rt=new ve(h,d);return Rt.position.y=1.3,Rt.userData.index=rt,pt.add(Rt),o.add(pt),{group:pt,liquids:Vt,hit:Rt,home:new V}}),z(),Q(),Y()}function j(G,rt){const pt=f[G].map(Rt=>({color:Rt,amount:1}));if(rt&&G===rt.from){let Rt=rt.move.count*rt.progress;for(let H=pt.length-1;H>=0&&Rt>0;H--){const Z=Math.min(Rt,pt[H].amount);pt[H].amount-=Z,Rt-=Z}}rt&&G===rt.to&&pt.push({color:rt.move.color,amount:rt.move.count*rt.progress});const Vt=[];for(const Rt of pt)Rt.amount<1e-5||(Vt.at(-1)?.color===Rt.color?Vt.at(-1).amount+=Rt.amount:Vt.push({...Rt}));return Vt}function k(G,rt){const pt=T[G];N(pt);let Vt=0;const Rt=j(G,rt);for(const H of Rt){const Z=Vt/m.capacity*u;Vt+=H.amount;const ft=Um({...l,lowerVolume:Z,upperVolume:Vt/m.capacity*u,tilt:pt.group.rotation.z}),Ct=new ve(ft,S(m.colors[H.color]));pt.liquids.add(Ct)}}function Q(G=null){G?(k(G.from,G),k(G.to,G)):T.forEach((rt,pt)=>k(pt))}function Y(){const G=f.filter(rt=>rt.length===m.capacity&&rt.every(pt=>pt===rt[0])).length;e.onState?.({moves:A.length,canUndo:!P&&A.length>0,busy:P,won:as(f,m.capacity),sorted:G,colors:Object.keys(m.colors).length})}function W(G){vm(G),m=structuredClone(G),f=structuredClone(m.bottles),A=[],b=-1,T.forEach(N),x.forEach(rt=>rt.forEach(pt=>pt.dispose())),x.clear(),e.onLevel?.(m),r("选择一个杯子，开始整理颜色"),_()}function st(G){b=G,T.forEach((rt,pt)=>rt.group.position.y=rt.home.y+(pt===G?.24:0)),r(G<0?"选择一个杯子，开始整理颜色":`已选择第 ${G+1} 杯 · 点击空杯或顶部同色的杯子`)}function ht(G){if(P||as(f,m.capacity))return;if(b<0){f[G].length&&st(G);return}if(b===G){st(-1);return}const rt=b,pt=yl(f,rt,G,m.capacity);if(!pt){st(f[G].length?G:-1),r("需要空杯或顶部同色，并留有足够空间");return}P=!0,st(-1),Y(),r("正在倒入相同颜色…");const Vt=T[rt],Rt=T[G],H=Vt.home.clone(),Z=Rt.home.x===0?Vt.home.x<=0?1:-1:Math.sign(Rt.home.x),ft=f[rt].length/m.capacity*u,Ct=ls(ft,l),Et=(f[rt].length-pt.count)/m.capacity*u,Bt=ls(Math.max(5e-4,Et),l),oe=new V(Z*l.radius,l.top,0),R=Rt.home.clone().add(new V(-Z*.63,4.52,.08)),jt=2*(a.position.z-Rt.home.z)*Math.tan(Pr.degToRad(a.fov/2))*a.aspect,wt=2*(Math.max(Math.abs(R.x),Math.abs(R.x-Z*l.top*c.y))+.65),Ut=Math.min(1,jt/wt),mt=H.clone().add(oe.clone().multiply(c)),Zt=new di,St=new V(0,0,1);function Ot(K,B){Vt.group.rotation.z=-Z*K,Zt.setFromAxisAngle(St,-Z*K),Vt.group.position.copy(B).sub(oe.clone().multiply(c).applyQuaternion(Zt))}const ae=S(m.colors[pt.color])[0].clone();ae.roughness=.085;const Qt=new ve(new Ne,ae);Qt.visible=!1,o.add(Qt);const y=new Vi({color:m.colors[pt.color],transparent:!0,opacity:.35,depthWrite:!1,side:ze}),v=new ve(new xo(1,.024,8,40),y);v.rotation.x=-Math.PI/2,v.visible=!1,o.add(v);let O=!1,X=!1;U={start:performance.now(),tick(K){const B=K<.3?E(K/.3):K>.76?1-E((K-.76)/.24):1;a.zoom=Pr.lerp(1,Ut,B),a.updateProjectionMatrix();let Tt=0;if(K<.3){const $=E(K/.3),gt=mt.clone().lerp(R,$);gt.y+=Math.sin(Math.PI*$)*.45,Ot(Ct*$,gt),k(rt)}else if(K<.76){Tt=E((K-.3)/.46);const $=Math.max(5e-4,ft-Tt*pt.count/m.capacity*u);Ot(ls($,l),R),Q({from:rt,to:G,move:pt,progress:Tt});const gt=to((f[G].length+pt.count*Tt)/m.capacity*u,0,l),xt=Rt.home.clone().add(new V(0,gt+.012,.03));Vt.group.updateMatrixWorld(!0);const tt=Vt.group.localToWorld(oe.clone()),at=Math.min(1,(K-.3)/.025,(.76-K)/.025),qt=new pl(tt,tt.clone().add(new V(Z*.5,-.025,0)),new V(xt.x,xt.y+.75,xt.z),xt);Qt.geometry.dispose(),Qt.geometry=new Mo(qt,32,.053*Math.sqrt(Math.max(.02,at)),10,!1),Qt.visible=!0,v.visible=!0;const At=(K-.3)*17%1,lt=.055+At*.2;v.scale.setScalar(lt),v.position.copy(xt),y.opacity=(1-At)*.35*at,X||(X=!0,Cm()),Nm(at,Tt)}else{X&&(X=!1,qm()),Qt.visible=!1,v.visible=!1,O||(A.push(structuredClone(f)),f=gm(f,rt,G,m.capacity),O=!0,k(G));const $=E((K-.76)/.24);Ot(Bt*(1-$),R.clone().lerp(mt,$)),k(rt)}K===1&&(o.remove(Qt,v),Qt.geometry.dispose(),ae.dispose(),v.geometry.dispose(),y.dispose(),Vt.group.position.copy(H),Vt.group.rotation.z=0,k(rt),a.zoom=1,a.updateProjectionMatrix(),P=!1,U=null,C&&(C=!1,z()),Y(),r(as(f,m.capacity)?"整理完成，做得漂亮！":"很好！继续把相同的颜色放在一起"))}}}return document.addEventListener("pointerdown",()=>{So(),document.getElementById("novvy-video-intro")||Ia()}),window.addEventListener("novvy:intro-finished",()=>Ia()),s.domElement.addEventListener("pointerdown",G=>{const rt=s.domElement.getBoundingClientRect();g.set((G.clientX-rt.left)/rt.width*2-1,-(G.clientY-rt.top)/rt.height*2+1),p.setFromCamera(g,a);const pt=p.intersectObjects(T.map(Vt=>Vt.hit));pt.length&&ht(pt[0].object.userData.index)}),new ResizeObserver(()=>{f&&(P?C=!0:z())}).observe(i),s.setAnimationLoop(G=>{U&&U.tick(Math.min(1,(G-U.start)/2400)),s.render(o,a)}),t&&W(t),{load:W,reset:()=>{P||W(m)},undo:()=>{P||!A.length||(f=A.pop(),st(-1),Q(),Y())}}}const wm="level-001",Dm="The Alchemist’s Table",Lm=4,Om={blue:"#0077CB",gold:"#F5B900",white:"#F2F0EA"},zm=[["blue","gold","gold"],["blue","gold","white","white"],["blue","white","blue","gold"],["white"],[]],Im={id:wm,name:Dm,capacity:Lm,colors:Om,bottles:zm},on=i=>document.getElementById(i);let yo=null,Fa=!1;try{yo=Vm({host:on("scene"),level:window.__WATER_SORT_LEVEL__??Im,insets:{top:.18,bottom:.16},ui:{onStatus:i=>{on("status").textContent=i},onState:({canUndo:i,busy:t,won:e,sorted:n,colors:r})=>{on("undo").disabled=!i,on("reset").disabled=t,on("win").hidden=!e,r>0&&document.dispatchEvent(new CustomEvent("novvy:hud-progress",{bubbles:!0,detail:{percent:Math.round(n/r*100)}})),e&&!Fa&&document.dispatchEvent(new CustomEvent("novvy:victory",{bubbles:!0})),Fa=e}}})}catch(i){on("status").textContent=i.message}on("undo").onclick=()=>yo?.undo();on("reset").onclick=on("again").onclick=()=>yo?.reset();

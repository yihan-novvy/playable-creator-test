import * as THREE from 'three';
import { validateLevel, getMove, pour, isWon } from './game.js';
import { lightStudio, createGlass, createLiquidMaterial, createSurfaceMaterial } from './appearance.js';
import { createLiquidGeometry, liquidSurfaceLevel, liquidVolumeBelowLevel as liquidVolumeFractionAtLevel, angleForPour } from './liquid-volume.js';
import { VESSEL } from './vessel-shape.js';
import { unlockAudio, startPour, updatePour, stopPour, startBGM } from './audio.js';

// Mountable game core shared by the dev workshop (main.js) and the ad shell
// (ad-main.js). All DOM access goes through the optional `ui` callbacks, so
// each host wires up only the pieces it has:
//   ui.onStatus(text)                      - status line copy
//   ui.onState({moves, canUndo, busy, won}) - emitted after every state change
//   ui.onLevel(level)                       - emitted after a level is applied
// The host owns every button; the game exposes load/reset/undo for it to call.
export function createGame({ host, level: initialLevel, ui = {}, insets = {} }) {
  const status = text => ui.onStatus?.(text);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .87;
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  lightStudio(renderer, scene);
  const SCALE = new THREE.Vector3(.86, 1.35, .86);
  const INTERIOR = { radius:VESSEL.liquidRadius, bottom:VESSEL.innerBottom, top:VESSEL.mouthHeight, rounding:VESSEL.innerBottomHeight, scaleY:SCALE.y, scaleXZ:SCALE.x };
  const REST_VOLUME = liquidVolumeFractionAtLevel(2.4 * SCALE.y, 0, INTERIOR);
  const hitGeometry = new THREE.CylinderGeometry(.49, .49, 2.8, 12);
  const hitMaterial = new THREE.MeshBasicMaterial({ visible:false });
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const materialCache = new Map();
  let level, state, selected = -1, history = [], cups = [], busy = false, animation = null;
  let resizePending = false;
  // 安全区:广告环境里标题/进度条(顶)与下载卡(底)悬浮在画布上方,
  // 布局必须把瓶子排进两者之间的窗口。取视口高度的分数,壳层按自己
  // 的覆盖层高度传入;workshop 不传即为 0,维持全幅构图。
  const INSETS = {
    top: Math.min(.35, Math.max(0, insets.top || 0)),
    bottom: Math.min(.35, Math.max(0, insets.bottom || 0)),
  };
  const smooth = t => t * t * (3 - 2 * t);
  function materials(color) {
    if (!materialCache.has(color)) materialCache.set(color, [createLiquidMaterial(color), createSurfaceMaterial(color)]);
    return materialCache.get(color);
  }
  function clearLiquid(cup) {
    cup.liquids.children.forEach(mesh => mesh.geometry.dispose());
    cup.liquids.clear();
  }
  function layout() {
    const columns = state.length <= 5 ? state.length : Math.ceil(state.length / 2);
    const rows = Math.ceil(state.length / columns);
    // 多排时所有杯子同处一个面向相机的平面,行距改用世界 y 分层,相机水平直视:
    // 两排到镜头等距、一样大,只有上下之分,没有前后近大远小。
    const rowGap = rows > 1 ? 5.8 : 3.5;
    const pitch = rows > 1 ? 0 : .36;
    const bottleTop = 3.55; // 瓶口最高点(SCALE.y 之后)
    const midY = rows > 1 ? bottleTop / 2 : 2.3;
    cups.forEach((cup, i) => {
      const row = Math.floor(i / columns), count = Math.min(columns, state.length - row * columns);
      cup.home.set((i % columns - (count - 1) / 2) * 1.22, ((rows - 1) / 2 - row) * rowGap, 0);
      cup.group.position.copy(cup.home);cup.group.position.y += selected === i ? .24 : 0;
    });
    const width = host.clientWidth, height = host.clientHeight;
    camera.aspect = width / height;
    const span = columns * 1.22 + .65;
    const halfFov = Math.tan(THREE.MathUtils.degToRad(16));
    // 纵向视野要装进安全区窗口:排布总高 ×1.06 留微隙,按可用高度
    // (1 - 上下 insets)反推距离;视点再向盖住较多的一侧偏移,让排布
    // 居中于上下覆盖层之间的窗口,而不是整块画布。
    const usable = Math.max(.4, 1 - INSETS.top - INSETS.bottom);
    const extent = rows > 1 ? ((rows - 1) * rowGap + bottleTop) * 1.06 : 0;
    const distance = Math.max(10.2, span / (2 * halfFov * camera.aspect), extent / (2 * halfFov * usable));
    const lookY = midY + (INSETS.top - INSETS.bottom) * distance * halfFov;
    camera.position.set(0, lookY + distance * pitch, distance);
    camera.lookAt(0, lookY, 0); camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  function rebuild() {
    cups.forEach(cup => { clearLiquid(cup); scene.remove(cup.group); });
    cups = state.map((_, index) => {
      const group = new THREE.Group(); group.scale.copy(SCALE); group.add(createGlass());
      const liquids = new THREE.Group(); group.add(liquids);
      const hit = new THREE.Mesh(hitGeometry, hitMaterial);
      hit.position.y = 1.3; hit.userData.index = index; group.add(hit);
      scene.add(group);
      return { group, liquids, hit, home:new THREE.Vector3() };
    });
    layout(); drawLiquids(); updateUI();
  }
  function layersFor(index, transfer) {
    const layers = state[index].map(color => ({ color, amount:1 }));
    if (transfer && index === transfer.from) {
      let remaining = transfer.move.count * transfer.progress;
      for (let i = layers.length - 1; i >= 0 && remaining > 0; i--) {
        const take = Math.min(remaining, layers[i].amount); layers[i].amount -= take; remaining -= take;
      }
    }
    if (transfer && index === transfer.to) layers.push({color:transfer.move.color, amount:transfer.move.count * transfer.progress});
    // Adjacent equal colours form one volume, with no false seam between slots.
    const merged = [];
    for (const layer of layers) {
      if (layer.amount < .00001) continue;
      if (merged.at(-1)?.color === layer.color) merged.at(-1).amount += layer.amount;
      else merged.push({...layer});
    }
    return merged;
  }
  function drawCup(index, transfer) {
    const cup = cups[index]; clearLiquid(cup);
    let cumulative = 0;
    const layers = layersFor(index, transfer);
    for (const layer of layers) {
      const lowerVolume = cumulative / level.capacity * REST_VOLUME;
      cumulative += layer.amount;
      const geometry = createLiquidGeometry({...INTERIOR, lowerVolume, upperVolume:cumulative / level.capacity * REST_VOLUME, tilt:cup.group.rotation.z});
      const mesh = new THREE.Mesh(geometry, materials(level.colors[layer.color]));
      cup.liquids.add(mesh);

    }
  }
  function drawLiquids(transfer = null) {
    if (transfer) { drawCup(transfer.from, transfer); drawCup(transfer.to, transfer); }
    else cups.forEach((_, index) => drawCup(index));
  }
  function updateUI() {
    // sorted/colors: 已完整归位的颜色数与总色数,给广告壳的 HUD 进度条用
    // (空瓶不计入归位)。与 game.js 的 isWon 同判据,只是把"空瓶也算完成"
    // 收窄为"满瓶单色才算"。
    const sorted = state.filter(bottle => bottle.length === level.capacity && bottle.every(c => c === bottle[0])).length;
    ui.onState?.({ moves: history.length, canUndo: !busy && history.length > 0, busy, won: isWon(state, level.capacity), sorted, colors: Object.keys(level.colors).length });
  }
  function load(data) {
    validateLevel(data);
    level = structuredClone(data); state = structuredClone(level.bottles); history = []; selected = -1;
    cups.forEach(clearLiquid);
    materialCache.forEach(list => list.forEach(material => material.dispose())); materialCache.clear();
    ui.onLevel?.(level);
    status('选择一个杯子，开始整理颜色'); rebuild();
  }
  function select(index) {
    selected = index;
    cups.forEach((cup, i) => cup.group.position.y = cup.home.y + (i === index ? .24 : 0));
    status(index < 0 ? '选择一个杯子，开始整理颜色' : `已选择第 ${index + 1} 杯 · 点击空杯或顶部同色的杯子`);
  }
  function clickCup(index) {
    if (busy || isWon(state, level.capacity)) return;
    if (selected < 0) { if (state[index].length) select(index); return; }
    if (selected === index) { select(-1); return; }
    const from = selected, move = getMove(state, from, index, level.capacity);
    if (!move) { select(state[index].length ? index : -1); status('需要空杯或顶部同色，并留有足够空间'); return; }
    busy = true; select(-1); updateUI();
    status('正在倒入相同颜色…');
    const source = cups[from], target = cups[index], start = source.home.clone();
    const direction = target.home.x === 0 ? (source.home.x <= 0 ? 1 : -1) : Math.sign(target.home.x);
    const initialVolume = state[from].length / level.capacity * REST_VOLUME;
    const initialAngle = angleForPour(initialVolume, INTERIOR);
    const finalVolume = (state[from].length - move.count) / level.capacity * REST_VOLUME;
    const finalAngle = angleForPour(Math.max(.0005, finalVolume), INTERIOR);
    const rimLocal = new THREE.Vector3(direction * INTERIOR.radius, INTERIOR.top, 0);
    // Anchor the lower rim, so changing tilt never detaches the stream from the lip.
    const pouringLip = target.home.clone().add(new THREE.Vector3(-direction * .63, 4.52, .08));
    const visibleWidth = 2 * (camera.position.z - target.home.z) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
    const requiredWidth = 2 * (Math.max(Math.abs(pouringLip.x), Math.abs(pouringLip.x - direction * INTERIOR.top * SCALE.y)) + .65);
    const pourZoom = Math.min(1, visibleWidth / requiredWidth);
    const startingLip = start.clone().add(rimLocal.clone().multiply(SCALE));
    const rotation = new THREE.Quaternion();
    const zAxis = new THREE.Vector3(0,0,1);
    function pose(angle, lip) {
      source.group.rotation.z = -direction * angle;
      rotation.setFromAxisAngle(zAxis, -direction * angle);
      source.group.position.copy(lip).sub(rimLocal.clone().multiply(SCALE).applyQuaternion(rotation));
    }
    const streamMaterial = materials(level.colors[move.color])[0].clone();streamMaterial.roughness = .085;
    const stream = new THREE.Mesh(new THREE.BufferGeometry(), streamMaterial);stream.visible = false;scene.add(stream);
    const rippleMaterial = new THREE.MeshBasicMaterial({color:level.colors[move.color],transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide});
    const ripple = new THREE.Mesh(new THREE.TorusGeometry(1,.024,8,40),rippleMaterial);ripple.rotation.x = -Math.PI/2;ripple.visible = false;scene.add(ripple);
    let committed = false, soundOn = false;
    animation = { start:performance.now(), tick(t) {
      const framing = t < .30 ? smooth(t/.30) : t > .76 ? 1-smooth((t-.76)/.24) : 1;
      camera.zoom = THREE.MathUtils.lerp(1,pourZoom,framing); camera.updateProjectionMatrix();
      let progress = 0;
      if (t < .30) {
        const u = smooth(t / .30);
        const lip = startingLip.clone().lerp(pouringLip,u);lip.y += Math.sin(Math.PI*u)*.45;
        pose(initialAngle * u, lip);
        drawCup(from);
      } else if (t < .76) {
        progress = smooth((t - .30) / .46);
        const volume = Math.max(.0005, initialVolume - progress * move.count / level.capacity * REST_VOLUME);
        pose(angleForPour(volume, INTERIOR), pouringLip);
        drawLiquids({from, to:index, move, progress});
        const height = liquidSurfaceLevel((state[index].length + move.count * progress) / level.capacity * REST_VOLUME, 0, INTERIOR);
        const dest = target.home.clone().add(new THREE.Vector3(0,height+.012,.03));
        source.group.updateMatrixWorld(true);
        const lip = source.group.localToWorld(rimLocal.clone());
        const flow = Math.min(1,(t-.30)/.025,(.76-t)/.025);
        const curve = new THREE.CubicBezierCurve3(lip,lip.clone().add(new THREE.Vector3(direction*.5,-.025,0)),new THREE.Vector3(dest.x,dest.y+.75,dest.z),dest);
        stream.geometry.dispose();stream.geometry = new THREE.TubeGeometry(curve,32,.053*Math.sqrt(Math.max(.02,flow)),10,false);stream.visible = true;
        ripple.visible = true;const phase=((t-.30)*17)%1;const radius=.055+phase*.2;ripple.scale.setScalar(radius);ripple.position.copy(dest);rippleMaterial.opacity=(1-phase)*.35*flow;
        if (!soundOn) { soundOn = true; startPour(); }
        updatePour(flow, progress);
      } else {
        if (soundOn) { soundOn = false; stopPour(); }
        stream.visible = false;ripple.visible = false;
        if (!committed) { history.push(structuredClone(state));state = pour(state,from,index,level.capacity);committed = true;drawCup(index); }
        const u = smooth((t-.76)/.24);
        pose(finalAngle*(1-u),pouringLip.clone().lerp(startingLip,u));drawCup(from);
      }
      if (t === 1) {
        scene.remove(stream,ripple);stream.geometry.dispose();streamMaterial.dispose();ripple.geometry.dispose();rippleMaterial.dispose();
        source.group.position.copy(start);source.group.rotation.z = 0;drawCup(from);
        camera.zoom = 1;camera.updateProjectionMatrix();
        busy = false;animation = null;
        if (resizePending) {resizePending=false;layout();}
        updateUI();status(isWon(state,level.capacity) ? '整理完成，做得漂亮！' : '很好！继续把相同的颜色放在一起');
      }
    }};
  }
  // 广告壳的片头视频覆盖层(#novvy-video-intro)活动时,首次点按只解锁音频
  // 不起 BGM(视频有自己的声音);片头结束事件后再起,两处调用都幂等。
  document.addEventListener('pointerdown', () => { unlockAudio(); if (!document.getElementById('novvy-video-intro')) startBGM(); });
  // intro.js 在 window 上派发 novvy:intro-finished,window 派发不会进入
  // document 监听,这里必须同样挂在 window。
  window.addEventListener('novvy:intro-finished', () => startBGM());
  renderer.domElement.addEventListener('pointerdown', event => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    const hits = raycaster.intersectObjects(cups.map(cup=>cup.hit));if(hits.length)clickCup(hits[0].object.userData.index);
  });
  new ResizeObserver(()=>{if(!state)return;if(busy)resizePending=true;else layout();}).observe(host);
  renderer.setAnimationLoop(time=>{if(animation)animation.tick(Math.min(1,(time-animation.start)/2400));renderer.render(scene,camera);});
  if (initialLevel) load(initialLevel);
  return {
    load,
    reset: () => { if (!busy) load(level); },
    undo: () => { if (busy || !history.length) return; state = history.pop(); select(-1); drawLiquids(); updateUI(); },
  };
}

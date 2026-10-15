const K = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 3, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 2, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 2, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 2, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 6, 2, 2, 2, 2, 2, 2, 2, 6, 2, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 6, 2, 2, 2, 2, 2, 2, 2, 6, 2, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0, 1, 1, 1, 2, 2, 2, 5, 5, 5, 2, 2, 2, 2, 7, 2, 2, 2, 2, 5, 5, 5, 2, 2, 2, 1, 1, 1, 0, 0, 1, 1, 1, 2, 2, 2, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, 5, 5, 2, 2, 2, 1, 1, 1, 0, 0, 1, 1, 1, 1, 2, 2, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, 5, 5, 2, 2, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 4, 4, 4, 2, 2, 2, 4, 4, 4, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 4, 4, 4, 2, 2, 2, 4, 4, 4, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], Q = () => [...K];
class H {
  constructor({ width: t = 29, height: e = 29, target: o = Q(), capacity: a = 48, trayCols: c = 12, openingSeeds: r = null, openingBoard: n = null } = {}) {
    this.width = t, this.height = e, this.target = [...o], this.capacity = a, this.trayCols = c, this.openingSeeds = r, this.openingBoard = n, this.reset();
  }
  neighbors(t) {
    const e = t % this.width, o = Math.floor(t / this.width), a = [];
    for (let c = -1; c <= 1; c++) for (let r = -1; r <= 1; r++) {
      if (!r && !c) continue;
      const n = e + r, s = o + c;
      n >= 0 && n < this.width && s >= 0 && s < this.height && a.push(s * this.width + n);
    }
    return a;
  }
  connected(t, e) {
    if (!e(t)) return [];
    const o = /* @__PURE__ */ new Set([t]), a = [t];
    for (let c = 0; c < a.length; c++) for (const r of this.neighbors(a[c])) !o.has(r) && e(r) && (o.add(r), a.push(r));
    return a;
  }
  reset() {
    if (this.board = [...this.target], this.tray = Array(this.capacity).fill(0), this.selection = null, this.history = [], this.moves = 0, this.openingBoard) {
      this.board = [...this.openingBoard], this.openingPatches = [];
      return;
    }
    const t = /* @__PURE__ */ new Set(), e = (s, h, l) => {
      const d = this.target.map((u, w) => u === s && !t.has(w) ? w : -1).filter((u) => u >= 0).sort((u, w) => Math.hypot(u % this.width - h[0], Math.floor(u / this.width) - h[1]) - Math.hypot(w % this.width - h[0], Math.floor(w / this.width) - h[1]));
      for (const u of d) {
        const w = this.connected(u, (M) => this.target[M] === s && !t.has(M)).slice(0, l);
        if (w.length === l)
          return w.forEach((M) => t.add(M)), w;
      }
      throw new Error("Not enough uniform cells for an opening cycle");
    }, o = this.openingSeeds ?? [[9, 23], [7, 9], [2, 13], [14, 23], [24, 14]], a = [e(2, o[0], 6), e(3, o[1], 6), e(1, o[2], 6)], c = a.map((s) => this.target[s[0]]);
    a.forEach((s, h) => s.forEach((l) => this.board[l] = c[(h + 1) % a.length])), this.openingPatches = a;
    const r = e(2, o[3], 12), n = e(1, o[4], 12);
    r.forEach((s) => this.board[s] = 1), n.forEach((s) => this.board[s] = 2), this.openingPatches.push(r, n);
  }
  get correct() {
    return this.target.reduce((t, e, o) => t + (e !== 0 && this.board[o] === e ? 1 : 0), 0);
  }
  get total() {
    return this.target.filter(Boolean).length;
  }
  get complete() {
    return this.correct === this.total;
  }
  snapshot() {
    return { board: [...this.board], tray: [...this.tray], moves: this.moves };
  }
  undo() {
    const t = this.history.pop();
    return t ? (Object.assign(this, t), this.selection = null, !0) : !1;
  }
  pick(t, e) {
    if (!["board", "tray"].includes(t) || !Number.isInteger(e) || e < 0) return !1;
    const o = t === "board" ? this.board : this.tray;
    if (e >= o.length) return !1;
    const a = o[e];
    if (!a || t === "board" && a === this.target[e]) return !1;
    let c;
    if (t === "board") c = this.connected(e, (r) => this.board[r] === a && this.board[r] !== this.target[r]);
    else {
      let r = e, n = e;
      for (; r > 0 && o[r - 1] === a; ) r--;
      for (; n + 1 < o.length && o[n + 1] === a; ) n++;
      c = Array.from({ length: n - r + 1 }, (s, h) => r + h);
    }
    return this.selection = { region: t, indices: c, color: a }, !0;
  }
  destinations(t, e) {
    const o = this.selection;
    return !o || !["board", "tray"].includes(t) || !Number.isInteger(e) || e < 0 || e >= (t === "board" ? this.board.length : this.tray.length) ? [] : t === "board" ? this.connected(e, (a) => this.target[a] === o.color && this.board[a] === 0).slice(0, o.indices.length) : o.region !== "board" || this.tray[e] !== 0 ? [] : Array.from({ length: this.capacity }, (a, c) => (e + c) % this.capacity).filter((a) => this.tray[a] === 0).slice(0, o.indices.length);
  }
  isColorComplete(t) {
    return this.target.some((e) => e === t) && this.target.every((e, o) => e !== t || this.board[o] === e);
  }
  place(t, e) {
    const o = this.selection, a = this.destinations(t, e);
    if (!a.length) return null;
    this.history.push(this.snapshot());
    const c = [], r = a.length;
    if (t === "tray") {
      const n = this.tray.map((d, u) => ({ color: d, from: u })).filter((d) => d.color), s = n.findLastIndex((d) => d.color === o.color), h = s < 0 ? n.length : s + 1, l = o.indices.slice(0, r).map((d) => ({ color: o.color, from: d, incoming: !0 }));
      n.splice(h, 0, ...l), this.tray.fill(0), n.forEach((d, u) => {
        this.tray[u] = d.color, d.incoming ? (this.board[d.from] = 0, c.push({ fromRegion: "board", from: d.from, toRegion: "tray", to: u, color: d.color })) : d.from !== u && c.push({ fromRegion: "tray", from: d.from, toRegion: "tray", to: u, color: d.color, shift: !0 });
      });
    } else {
      const n = o.region === "board" ? this.board : this.tray;
      if (a.forEach((s, h) => {
        const l = o.indices[h];
        n[l] = 0, this.board[s] = o.color, c.push({ fromRegion: o.region, from: l, toRegion: "board", to: s, color: o.color });
      }), o.region === "tray") {
        const s = this.tray.map((h, l) => ({ color: h, from: l })).filter((h) => h.color);
        if (this.tray.fill(0), s.forEach((h, l) => {
          this.tray[l] = h.color, h.from !== l && c.push({ fromRegion: "tray", from: h.from, toRegion: "tray", to: l, color: h.color, shift: !0 });
        }), r < o.indices.length) {
          const h = new Set(o.indices.slice(r));
          this.selection = { ...o, indices: s.map((l, d) => h.has(l.from) ? d : -1).filter((l) => l >= 0) };
        }
      }
    }
    return this.moves++, o.region === "tray" && t === "board" && r < o.indices.length || (this.selection = r < o.indices.length ? { ...o, indices: o.indices.slice(r) } : null), c;
  }
  hint() {
    if (this.selection) {
      for (let e = 0; e < this.board.length; e++) if (this.destinations("board", e).length) return { region: "board", index: e, action: "place" };
      if (this.selection.region === "board") {
        const e = this.tray.indexOf(0);
        if (e >= 0) return { region: "tray", index: e, action: "store" };
      }
      return null;
    }
    for (const e of ["board", "tray"]) {
      const o = e === "board" ? this.board : this.tray;
      for (let a = 0; a < o.length; a++)
        if (!(!o[a] || e === "board" && o[a] === this.target[a]) && this.target.some((c, r) => c === o[a] && this.board[r] === 0))
          return { region: e, index: a, action: "pick" };
    }
    const t = this.board.findIndex((e, o) => e && e !== this.target[o]);
    return t < 0 ? null : { region: "board", index: t, action: "pick" };
  }
}
function W(i) {
  const t = (f) => {
    throw new Error(f);
  };
  (!i || typeof i != "object" || Array.isArray(i)) && t("关卡必须是对象");
  const { width: e, height: o, capacity: a = 48, trayCols: c = 12 } = i;
  for (const [f, g, p, m] of [["width", e, 4, 40], ["height", o, 4, 40], ["capacity", a, 4, 96], ["trayCols", c, 4, 16]]) (!Number.isInteger(g) || g < p || g > m) && t(`${f} 必须是 ${p}–${m} 的整数`);
  (a < c || Math.ceil(a / c) > 6) && t("篮子应为 1–6 行，容量不能小于列数");
  const r = {};
  for (const [f, g] of Object.entries(i.colors || {}))
    (!/^[1-9]\d*$/.test(f) || Number(f) > 255 || !/^#[0-9a-f]{6}$/i.test(g)) && t("颜色 ID 必须为 1–255，色值必须为 #RRGGBB"), r[f] = g.toLowerCase();
  (Object.keys(r).length < 2 || Object.keys(r).length > 16) && t("色板需要 2–16 种颜色");
  const n = (f) => Number.isInteger(f) && (f === 0 || Object.hasOwn(r, f));
  (!Array.isArray(i.target) || i.target.length !== e * o || !i.target.every(n)) && t("target 必须与棋盘尺寸一致，0 为无格子，其余值对应颜色 ID");
  const s = [...i.target], h = s.filter(Boolean);
  new Set(h).size < 2 && t("图案至少需要两个实际使用的颜色");
  const l = i.openingMode ?? "scattered";
  ["easy", "medium", "scattered"].includes(l) || t("开局模式必须为简易、适中或零散模式");
  const d = i.difficulty ?? 21, u = i.seed ?? 1;
  (!Number.isInteger(d) || d < 1 || d > 100) && t("打散对数应为 1–100"), (!Number.isInteger(u) || u < 0 || u > 2147483647) && t("随机种子应为 0–2147483647");
  let w = i.opening;
  if (w != null) {
    (!Array.isArray(w) || w.length !== s.length || !w.every(n) || w.some((m, b) => s[b] === 0 != (m === 0))) && t("开局必须保留图案的有效格子，不允许增加或缺失珠子");
    const f = (m) => {
      const b = {};
      for (const y of m) y && (b[y] = (b[y] || 0) + 1);
      return b;
    }, g = f(s), p = f(w);
    Object.keys(g).some((m) => g[m] !== p[m]) && t("开局每种颜色的珠子数量必须与目标一致"), w = [...w];
  }
  const M = {};
  for (const f of Object.keys(r)) M[f] = String(i.colorNames?.[f] || `颜色 ${f}`).slice(0, 40);
  const k = i.decoration ?? "none";
  ["cat", "chick", "phoenix", "none"].includes(k) || t("未知装饰类型");
  const E = {};
  if (i.decorations !== void 0) {
    (!i.decorations || typeof i.decorations != "object" || Array.isArray(i.decorations) || Object.keys(i.decorations).length > 16) && t("装饰微调必须为最多 16 项的对象");
    for (const [f, g] of Object.entries(i.decorations)) {
      (!/^[a-z][a-z0-9-]{0,39}$/.test(f) || !g || typeof g != "object") && t("装饰 ID 或参数无效");
      const { offsetX: p = 0, offsetY: m = 0, scale: b = 1 } = g;
      (![p, m, b].every(Number.isFinite) || Math.abs(p) > 40 || Math.abs(m) > 40 || b < 0.1 || b > 4) && t("装饰偏移范围 ±40 格，缩放范围 0.1–4"), E[f] = { offsetX: p, offsetY: m, scale: b };
    }
  }
  return { version: 1, name: String(i.name || "珠子拼画").slice(0, 100), width: e, height: o, colors: r, colorNames: M, target: s, opening: w ?? null, capacity: a, trayCols: c, difficulty: d, seed: u, openingMode: l, decoration: k, ...Object.keys(E).length ? { decorations: E } : {} };
}
function q(i) {
  const t = new H({ width: i.width, height: i.height, target: i.target, capacity: i.capacity, trayCols: i.trayCols, openingBoard: i.opening }), e = /* @__PURE__ */ new Set(), o = [];
  for (let a = 0; a < i.target.length * 12 + 100; a++) {
    if (t.complete) return { moves: t.moves, solution: o };
    const c = JSON.stringify([t.board, t.tray, t.selection]);
    if (e.has(c)) throw new Error("当前开局无法通过自动求解验证，请增加篮子容量或重新生成开局");
    e.add(c);
    const r = t.hint();
    if (!r) throw new Error("当前开局无法通过自动求解验证，请增加篮子容量或重新生成开局");
    if (!(r.action === "pick" ? t.pick(r.region, r.index) : t.place(r.region, r.index))) throw new Error("自动求解发现无效移动");
    o.push(r);
  }
  throw new Error("开局超过自动求解步数上限，请降低打散数量");
}
function U(i) {
  const t = W(i);
  if (t.opening) {
    const c = q(t);
    if (t.openingMode === "easy" && c.moves > 6) throw new Error("此开局超过简易模式的 6 次搬运限制，请重新生成开局");
    return { level: t, proof: c };
  }
  const e = t.target.map((c, r) => c ? r : -1).filter((c) => c >= 0);
  let o = t.seed || 1;
  const a = () => (o = Math.imul(o, 1664525) + 1013904223 >>> 0, o / 4294967296);
  if (t.openingMode === "easy" || t.openingMode === "medium") return V(t, a);
  for (let c = 0; c < 40; c++) {
    const r = [...t.target], n = [...e];
    let s = 0;
    for (; n.length >= 2 && s < t.difficulty; ) {
      const h = Math.floor(a() * n.length), l = n.splice(h, 1)[0], d = n.filter((w) => r[w] !== r[l]);
      if (!d.length) continue;
      const u = d[Math.floor(a() * d.length)];
      n.splice(n.indexOf(u), 1), [r[l], r[u]] = [r[u], r[l]], s++;
    }
    if (!s) throw new Error("图案没有可交换的不同颜色");
    try {
      const h = { ...t, opening: r };
      return { level: h, proof: q(h) };
    } catch {
    }
  }
  throw new Error("无法生成通过求解验证的开局，请降低打散数量或增加篮子容量");
}
function V(i, t) {
  const { target: e, width: o, height: a, capacity: c } = i, r = (M) => {
    const k = M % o, E = Math.floor(M / o), f = [];
    return k && f.push(M - 1), k + 1 < o && f.push(M + 1), E && f.push(M - o), E + 1 < a && f.push(M + o), f;
  }, n = (M) => {
    const k = M % o, E = Math.floor(M / o), f = [];
    for (let g = -1; g <= 1; g++) for (let p = -1; p <= 1; p++) k + p >= 0 && k + p < o && E + g >= 0 && E + g < a && f.push((E + g) * o + k + p);
    return f;
  }, s = [...new Set(e.filter(Boolean))], h = e.filter(Boolean).length, l = i.openingMode === "medium", d = l ? 5 : 2, u = l ? Math.min(c, 5) : Math.min(c, 18, Math.max(6, Math.round(Math.sqrt(h) / 2)));
  function w(M, k, E) {
    const f = new Set(e.flatMap((z, v) => z === M && !E.has(v) ? [v] : [])), g = [];
    for (; f.size; ) {
      const z = f.values().next().value, v = [z];
      f.delete(z);
      for (let x = 0; x < v.length; x++) for (const B of r(v[x])) f.delete(B) && v.push(B);
      v.length >= k && g.push(v);
    }
    if (!g.length) return null;
    const p = g[Math.floor(t() * g.length)], m = new Set(p), b = p[Math.floor(t() * p.length)], y = /* @__PURE__ */ new Set([b]), S = [b], N = [], j = b % o, P = Math.floor(b / o), O = (z) => (z % o - j) ** 2 + (Math.floor(z / o) - P) ** 2;
    for (; S.length && N.length < k; ) {
      S.sort((v, x) => O(v) - O(x) || v - x);
      const z = S.shift();
      N.push(z);
      for (const v of r(z)) m.has(v) && !y.has(v) && (y.add(v), S.push(v));
    }
    return N.length === k ? N : null;
  }
  for (let M = u; M >= (l ? 3 : Math.min(4, u)); M--)
    for (let k = 0; k < 60; k++) {
      const E = /* @__PURE__ */ new Set(), f = [...e];
      let g = 0;
      for (let p = 0; p < d; p++) {
        const m = [];
        for (let y = 0; y < s.length; y++) for (let S = y + 1; S < s.length; S++) m.push([s[y], s[S]]);
        for (let y = m.length - 1; y > 0; y--) {
          const S = Math.floor(t() * (y + 1));
          [m[y], m[S]] = [m[S], m[y]];
        }
        let b = !1;
        for (const [y, S] of m) {
          const N = w(y, M, E);
          if (!N) continue;
          const j = new Set(E);
          N.forEach((O) => n(O).forEach((z) => j.add(z)));
          const P = w(S, M, j);
          if (P) {
            N.forEach((O) => {
              f[O] = S, n(O).forEach((z) => E.add(z));
            }), P.forEach((O) => {
              f[O] = y, n(O).forEach((z) => E.add(z));
            }), g++, b = !0;
            break;
          }
        }
        if (!b) break;
      }
      if (g === d)
        try {
          const p = { ...i, opening: f }, m = q(p);
          if (m.moves >= (l ? 12 : 4) && m.moves <= (l ? 14 : 6)) return { level: p, proof: m };
        } catch {
        }
    }
  throw new Error(`此图案或篮子没有足够的连续区域生成${l ? " 12–14 次搬运完成的适中开局" : " 6 次内完成的简易开局"}，请增加篮子容量、调整图案或选择零散模式`);
}
class _ extends H {
  constructor(t = {}) {
    super(t), this.batchSize = Math.min(this.capacity, t.batchSize ?? 30);
  }
  pick(t, e) {
    return super.pick(t, e) ? (this.selection.indices = this.selection.indices.slice(0, this.batchSize), !0) : !1;
  }
  place(t, e) {
    const o = super.place(t, e);
    if (o && this.selection?.region === "board") {
      const a = new Set(this.selection.indices);
      this.selection = { ...this.selection, indices: this.connected(this.selection.indices[0], (c) => a.has(c)) };
    }
    return o;
  }
  hint() {
    const t = /* @__PURE__ */ new Map(), e = /* @__PURE__ */ new Set();
    for (let n = 0; n < this.target.length; n++) if (this.target[n] && this.board[n] === 0 && !e.has(n)) {
      const s = this.target[n], h = this.connected(n, (l) => this.board[l] === 0 && this.target[l] === s);
      h.forEach((l) => e.add(l)), (!t.has(s) || t.get(s).count < h.length) && t.set(s, { index: n, count: h.length });
    }
    if (this.selection) {
      const n = t.get(this.selection.color);
      if (n) return { region: "board", index: n.index, action: "place" };
      const s = this.tray.indexOf(0);
      if (this.selection.region === "board" && s >= 0) return { region: "tray", index: s, action: "store" };
    }
    const o = [], a = /* @__PURE__ */ new Set();
    for (let n = 0; n < this.target.length; n++)
      if (this.board[n] && this.board[n] !== this.target[n] && !a.has(n)) {
        const s = this.board[n], h = this.connected(n, (l) => this.board[l] === s && this.board[l] !== this.target[l]);
        h.forEach((l) => a.add(l)), o.push({ region: "board", index: n, color: s, count: h.length });
      }
    for (let n = 0; n < this.tray.length; ) {
      const s = this.tray[n];
      if (!s) {
        n++;
        continue;
      }
      let h = n + 1;
      for (; this.tray[h] === s; ) h++;
      o.push({ region: "tray", index: n, color: s, count: h - n }), n = h;
    }
    const c = (n) => Math.min(this.batchSize, t.get(n.color)?.count || 0, n.count);
    o.sort((n, s) => c(s) - c(n) || +(s.region === "tray") - +(n.region === "tray") || s.count - n.count || n.index - s.index);
    const r = o.find((n) => t.has(n.color)) || o.find((n) => n.region === "board");
    return r ? { region: r.region, index: r.index, action: "pick" } : null;
  }
}
function G({ coverage: i = 95, batchSize: t = 30 } = {}) {
  if (!Number.isInteger(i) || i < 80 || i > 100) throw new Error("全局错位目标应为 80–100");
  if (!Number.isInteger(t) || t < 12 || t > 48) throw new Error("单批珠子应为 12–48");
  return { coverage: i, batchSize: t };
}
function F(i, t) {
  const e = new _({ width: i.width, height: i.height, target: i.target, capacity: i.capacity, trayCols: i.trayCols, openingBoard: i.opening, batchSize: t.batchSize }), o = /* @__PURE__ */ new Map();
  i.target.forEach((s) => {
    s && o.set(s, (o.get(s) || 0) + 1);
  });
  const a = Math.round(Math.min(e.total, 2 * (e.total - Math.max(...o.values()))) / e.total * 1e3) / 10, c = [], r = [];
  let n = 0;
  for (let s = 0; s < i.target.length * 8 + 100; s++) {
    if (e.complete) {
      const l = i.target.reduce((d, u, w) => d + +(u !== i.opening[w]), 0);
      return { moves: e.moves, solution: c, metrics: {
        total: e.total,
        wrongBeads: l,
        wrongPercent: Math.round(l / e.total * 1e3) / 10,
        averageBatch: Math.round(r.reduce((d, u) => d + u, 0) / Math.max(1, r.length) * 10) / 10,
        largeBatchPercent: Math.round(r.filter((d) => d >= 12).length / Math.max(1, r.length) * 100),
        smallBatchPercent: Math.round(r.filter((d) => d <= 2).length / Math.max(1, r.length) * 100),
        peakCache: n,
        moves: e.moves,
        batchSize: e.batchSize,
        maximumWrongPercent: a
      } };
    }
    const h = e.hint();
    if (!h) throw new Error("全局开局没有可继续的搬运");
    if (h.action === "pick") {
      if (!e.pick(h.region, h.index)) throw new Error("全局开局拾取无效");
    } else {
      const l = e.place(h.region, h.index);
      if (!l) throw new Error("全局开局归位无效");
      r.push(l.filter((d) => !d.shift).length), n = Math.max(n, e.tray.filter(Boolean).length);
    }
    c.push(h);
  }
  throw new Error("全局开局超过求解上限");
}
function Z(i, t = {}) {
  const e = G(t), o = W({ ...i, opening: null, openingMode: "medium" }), { target: a, width: c, height: r, capacity: n } = o, s = a.filter(Boolean).length, h = /* @__PURE__ */ new Map();
  a.forEach((f) => {
    f && h.set(f, (h.get(f) || 0) + 1);
  });
  const l = Math.min(s, 2 * (s - Math.max(...h.values()))), d = Math.min(l, Math.ceil(s * e.coverage / 100)), u = a.map((f, g) => {
    if (!f) return [];
    const p = g % c, m = Math.floor(g / c), b = [];
    return p && b.push(g - 1), p + 1 < c && b.push(g + 1), m && b.push(g - c), m + 1 < r && b.push(g + c), b;
  });
  let w = o.seed || 1;
  const M = () => (w = Math.imul(w, 1664525) + 1013904223 >>> 0, w / 4294967296), k = Math.min(e.batchSize, Math.max(1, Math.floor(n * 0.65)), Math.max(12, Math.round(Math.sqrt(s))));
  let E = null;
  for (let f = 0; f < 6; f++) {
    const g = [...a], p = /* @__PURE__ */ new Set();
    for (; p.size < d; ) {
      const b = new Set(a.flatMap((x, B) => x && !p.has(B) ? [B] : [])), y = /* @__PURE__ */ new Map();
      for (; b.size; ) {
        const x = b.values().next().value, B = a[x], I = [x];
        b.delete(x);
        for (let $ = 0; $ < I.length; $++) for (const A of u[I[$]]) a[A] === B && b.delete(A) && I.push(A);
        y.has(B) || y.set(B, { count: 0, groups: [] });
        const C = y.get(B);
        C.count += I.length, C.groups.push(I);
      }
      if (y.size < 2) break;
      const [S, N] = [...y.keys()].sort((x, B) => y.get(B).count - y.get(x).count || x - B), j = (x) => {
        const B = y.get(x).groups.sort((I, C) => C.length - I.length);
        return B[Math.floor(M() * Math.min(2, B.length))];
      }, P = j(S), O = j(N), z = Math.min(k, P.length, O.length, Math.ceil((d - p.size) / 2)), v = (x) => {
        const B = new Set(x), I = x[Math.floor(M() * x.length)], C = [I], $ = /* @__PURE__ */ new Set([I]), A = [], X = I % c, Y = Math.floor(I / c), D = (L) => (L % c - X) ** 2 + (Math.floor(L / c) - Y) ** 2;
        for (; C.length && A.length < z; ) {
          C.sort((R, T) => D(R) - D(T) || R - T);
          const L = C.shift();
          A.push(L);
          for (const R of u[L]) B.has(R) && !$.has(R) && ($.add(R), C.push(R));
        }
        return A;
      };
      for (const x of v(P))
        g[x] = N, p.add(x);
      for (const x of v(O))
        g[x] = S, p.add(x);
    }
    const m = { ...o, opening: g };
    try {
      const b = F(m, e), y = b.metrics, S = y.averageBatch - y.smallBatchPercent * 0.1 - y.peakCache / n;
      (!E || S > E.score) && (E = { level: m, proof: b, score: S });
    } catch {
    }
  }
  if (!E) throw new Error("无法生成可完成的全局开局，请增大篮子或更换种子");
  return E.proof.metrics.maximumWrongPercent = Math.round(l / s * 1e3) / 10, { level: E.level, proof: E.proof, options: e };
}
function J(i) {
  const t = i?.openingMode ?? "easy", e = t === "scattered" ? "medium" : t;
  if (!["easy", "medium"].includes(e)) throw new Error("开局模式必须为简易或全局模式");
  const o = W({ ...i, openingMode: e });
  return e === "medium" ? { ...o, ...G(i) } : o;
}
function et(i) {
  const t = i.openingMode === "medium" ? _ : H;
  return new t({ width: i.width, height: i.height, target: i.target, capacity: i.capacity, trayCols: i.trayCols, openingBoard: i.opening, batchSize: i.batchSize });
}
function tt(i) {
  const t = J(i);
  return t.openingMode === "medium" ? F(t, G(t)) : q(t);
}
function ot(i) {
  const t = J(i);
  if (t.openingMode === "easy") return U(t);
  if (t.opening) return { level: t, proof: tt(t) };
  const e = Z(t, G(t));
  return { ...e, level: { ...e.level, ...e.options } };
}
export {
  et as createPuzzle,
  ot as prepareLevel,
  tt as solveLevel,
  J as validateLevel
};

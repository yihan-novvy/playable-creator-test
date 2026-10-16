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
      const g = this.target.map((b, M) => b === s && !t.has(M) ? M : -1).filter((b) => b >= 0).sort((b, M) => Math.hypot(b % this.width - h[0], Math.floor(b / this.width) - h[1]) - Math.hypot(M % this.width - h[0], Math.floor(M / this.width) - h[1]));
      for (const b of g) {
        const M = this.connected(b, (O) => this.target[O] === s && !t.has(O)).slice(0, l);
        if (M.length === l)
          return M.forEach((O) => t.add(O)), M;
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
      const n = this.tray.map((g, b) => ({ color: g, from: b })).filter((g) => g.color), s = n.findLastIndex((g) => g.color === o.color), h = s < 0 ? n.length : s + 1, l = o.indices.slice(0, r).map((g) => ({ color: o.color, from: g, incoming: !0 }));
      n.splice(h, 0, ...l), this.tray.fill(0), n.forEach((g, b) => {
        this.tray[b] = g.color, g.incoming ? (this.board[g.from] = 0, c.push({ fromRegion: "board", from: g.from, toRegion: "tray", to: b, color: g.color })) : g.from !== b && c.push({ fromRegion: "tray", from: g.from, toRegion: "tray", to: b, color: g.color, shift: !0 });
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
          this.selection = { ...o, indices: s.map((l, g) => h.has(l.from) ? g : -1).filter((l) => l >= 0) };
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
  for (const [f, d, m, p] of [["width", e, 4, 40], ["height", o, 4, 40], ["capacity", a, 4, 96], ["trayCols", c, 4, 16]]) (!Number.isInteger(d) || d < m || d > p) && t(`${f} 必须是 ${m}–${p} 的整数`);
  (a < c || Math.ceil(a / c) > 6) && t("篮子应为 1–6 行，容量不能小于列数");
  const r = {};
  for (const [f, d] of Object.entries(i.colors || {}))
    (!/^[1-9]\d*$/.test(f) || Number(f) > 255 || !/^#[0-9a-f]{6}$/i.test(d)) && t("颜色 ID 必须为 1–255，色值必须为 #RRGGBB"), r[f] = d.toLowerCase();
  (Object.keys(r).length < 2 || Object.keys(r).length > 16) && t("色板需要 2–16 种颜色");
  const n = (f) => Number.isInteger(f) && (f === 0 || Object.hasOwn(r, f));
  (!Array.isArray(i.target) || i.target.length !== e * o || !i.target.every(n)) && t("target 必须与棋盘尺寸一致，0 为无格子，其余值对应颜色 ID");
  const s = [...i.target], h = s.filter(Boolean);
  new Set(h).size < 2 && t("图案至少需要两个实际使用的颜色");
  const l = i.openingMode ?? "scattered";
  ["easy", "medium", "scattered"].includes(l) || t("开局模式必须为简易、适中或零散模式");
  const g = i.difficulty ?? 21, b = i.seed ?? 1;
  (!Number.isInteger(g) || g < 1 || g > 100) && t("打散对数应为 1–100"), (!Number.isInteger(b) || b < 0 || b > 2147483647) && t("随机种子应为 0–2147483647");
  let M = i.opening;
  if (M != null) {
    (!Array.isArray(M) || M.length !== s.length || !M.every(n) || M.some((p, u) => s[u] === 0 != (p === 0))) && t("开局必须保留图案的有效格子，不允许增加或缺失珠子");
    const f = (p) => {
      const u = {};
      for (const E of p) E && (u[E] = (u[E] || 0) + 1);
      return u;
    }, d = f(s), m = f(M);
    Object.keys(d).some((p) => d[p] !== m[p]) && t("开局每种颜色的珠子数量必须与目标一致"), M = [...M];
  }
  const O = {};
  for (const f of Object.keys(r)) O[f] = String(i.colorNames?.[f] || `颜色 ${f}`).slice(0, 40);
  const x = i.decoration ?? "none";
  ["cat", "chick", "phoenix", "none"].includes(x) || t("未知装饰类型");
  const y = {};
  if (i.decorations !== void 0) {
    (!i.decorations || typeof i.decorations != "object" || Array.isArray(i.decorations) || Object.keys(i.decorations).length > 16) && t("装饰微调必须为最多 16 项的对象");
    for (const [f, d] of Object.entries(i.decorations)) {
      (!/^[a-z][a-z0-9-]{0,39}$/.test(f) || !d || typeof d != "object") && t("装饰 ID 或参数无效");
      const { offsetX: m = 0, offsetY: p = 0, scale: u = 1 } = d;
      (![m, p, u].every(Number.isFinite) || Math.abs(m) > 40 || Math.abs(p) > 40 || u < 0.1 || u > 4) && t("装饰偏移范围 ±40 格，缩放范围 0.1–4"), y[f] = { offsetX: m, offsetY: p, scale: u };
    }
  }
  return { version: 1, name: String(i.name || "珠子拼画").slice(0, 100), width: e, height: o, colors: r, colorNames: O, target: s, opening: M ?? null, capacity: a, trayCols: c, difficulty: g, seed: b, openingMode: l, decoration: x, ...Object.keys(y).length ? { decorations: y } : {} };
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
      const h = Math.floor(a() * n.length), l = n.splice(h, 1)[0], g = n.filter((M) => r[M] !== r[l]);
      if (!g.length) continue;
      const b = g[Math.floor(a() * g.length)];
      n.splice(n.indexOf(b), 1), [r[l], r[b]] = [r[b], r[l]], s++;
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
  const { target: e, width: o, height: a, capacity: c } = i, r = (x) => {
    const y = x % o, f = Math.floor(x / o), d = [];
    return y && d.push(x - 1), y + 1 < o && d.push(x + 1), f && d.push(x - o), f + 1 < a && d.push(x + o), d;
  }, n = (x) => {
    const y = x % o, f = Math.floor(x / o), d = [];
    for (let m = -1; m <= 1; m++) for (let p = -1; p <= 1; p++) y + p >= 0 && y + p < o && f + m >= 0 && f + m < a && d.push((f + m) * o + y + p);
    return d;
  }, s = [...new Set(e.filter(Boolean))], h = i.openingMode === "medium", l = h ? 5 : 2, g = h ? Math.min(c, 5) : Math.min(c, Math.floor(c * 0.875)), b = /* @__PURE__ */ new Map();
  for (let x = 0; x < e.length; x++) {
    const y = e[x];
    y && (b.has(y) || b.set(y, []), b.get(y).push(x));
  }
  function M(x, y, f) {
    const d = /* @__PURE__ */ new Set();
    for (const k of b.get(x) || []) f.has(k) || d.add(k);
    const m = [];
    for (; d.size; ) {
      const k = d.values().next().value, w = [k];
      d.delete(k);
      for (let S = 0; S < w.length; S++) for (const B of r(w[S])) d.delete(B) && w.push(B);
      w.length >= y && m.push(w);
    }
    if (!m.length) return null;
    const p = m[Math.floor(t() * m.length)], u = new Set(p), E = p[Math.floor(t() * p.length)], v = /* @__PURE__ */ new Set([E]), z = [E], I = [], j = E % o, P = Math.floor(E / o), C = (k) => (k % o - j) ** 2 + (Math.floor(k / o) - P) ** 2;
    for (; z.length && I.length < y; ) {
      z.sort((w, S) => C(w) - C(S) || w - S);
      const k = z.shift();
      I.push(k);
      for (const w of r(k)) u.has(w) && !v.has(w) && (v.add(w), z.push(w));
    }
    return I.length === y ? I : null;
  }
  const O = s.map((x) => {
    const y = new Set(e.flatMap((d, m) => d === x ? [m] : []));
    let f = 0;
    for (; y.size; ) {
      const d = y.values().next().value, m = [d];
      y.delete(d);
      for (let p = 0; p < m.length; p++) for (const u of r(m[p])) y.delete(u) && m.push(u);
      f = Math.max(f, m.length);
    }
    return f;
  }).sort((x, y) => y - x);
  for (let x = Math.min(g, O[1] || g); x >= (h ? 3 : Math.min(4, g)); x--)
    for (let y = 0; y < 60; y++) {
      const f = /* @__PURE__ */ new Set(), d = [...e];
      let m = 0;
      for (let p = 0; p < l; p++) {
        const u = [];
        for (let v = 0; v < s.length; v++) for (let z = v + 1; z < s.length; z++) u.push([s[v], s[z]]);
        for (let v = u.length - 1; v > 0; v--) {
          const z = Math.floor(t() * (v + 1));
          [u[v], u[z]] = [u[z], u[v]];
        }
        let E = !1;
        for (const [v, z] of u) {
          const I = M(v, x, f);
          if (!I) continue;
          const j = new Set(f);
          I.forEach((C) => n(C).forEach((k) => j.add(k)));
          const P = M(z, x, j);
          if (P) {
            I.forEach((C) => {
              d[C] = z, n(C).forEach((k) => f.add(k));
            }), P.forEach((C) => {
              d[C] = v, n(C).forEach((k) => f.add(k));
            }), m++, E = !0;
            break;
          }
        }
        if (!E) break;
      }
      if (m === l)
        try {
          const p = { ...i, opening: d }, u = q(p);
          if (u.moves >= (h ? 12 : 4) && u.moves <= (h ? 14 : 6)) return { level: p, proof: u };
        } catch {
        }
    }
  throw new Error(`此图案或篮子没有足够的连续区域生成${h ? " 12–14 次搬运完成的适中开局" : " 6 次内完成的简易开局"}，请增加篮子容量、调整图案或选择零散模式`);
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
      const l = i.target.reduce((g, b, M) => g + +(b !== i.opening[M]), 0);
      return { moves: e.moves, solution: c, metrics: {
        total: e.total,
        wrongBeads: l,
        wrongPercent: Math.round(l / e.total * 1e3) / 10,
        averageBatch: Math.round(r.reduce((g, b) => g + b, 0) / Math.max(1, r.length) * 10) / 10,
        largeBatchPercent: Math.round(r.filter((g) => g >= 12).length / Math.max(1, r.length) * 100),
        smallBatchPercent: Math.round(r.filter((g) => g <= 2).length / Math.max(1, r.length) * 100),
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
      r.push(l.filter((g) => !g.shift).length), n = Math.max(n, e.tray.filter(Boolean).length);
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
  const l = Math.min(s, 2 * (s - Math.max(...h.values()))), g = Math.min(l, Math.ceil(s * e.coverage / 100)), b = a.map((f, d) => {
    if (!f) return [];
    const m = d % c, p = Math.floor(d / c), u = [];
    return m && u.push(d - 1), m + 1 < c && u.push(d + 1), p && u.push(d - c), p + 1 < r && u.push(d + c), u;
  });
  let M = o.seed || 1;
  const O = () => (M = Math.imul(M, 1664525) + 1013904223 >>> 0, M / 4294967296), x = Math.min(e.batchSize, Math.max(1, Math.floor(n * 0.65)), Math.max(12, Math.round(Math.sqrt(s))));
  let y = null;
  for (let f = 0; f < 6; f++) {
    const d = [...a], m = /* @__PURE__ */ new Set();
    for (; m.size < g; ) {
      const u = new Set(a.flatMap((w, S) => w && !m.has(S) ? [S] : [])), E = /* @__PURE__ */ new Map();
      for (; u.size; ) {
        const w = u.values().next().value, S = a[w], B = [w];
        u.delete(w);
        for (let $ = 0; $ < B.length; $++) for (const A of b[B[$]]) a[A] === S && u.delete(A) && B.push(A);
        E.has(S) || E.set(S, { count: 0, groups: [] });
        const N = E.get(S);
        N.count += B.length, N.groups.push(B);
      }
      if (E.size < 2) break;
      const [v, z] = [...E.keys()].sort((w, S) => E.get(S).count - E.get(w).count || w - S), I = (w) => {
        const S = E.get(w).groups.sort((B, N) => N.length - B.length);
        return S[Math.floor(O() * Math.min(2, S.length))];
      }, j = I(v), P = I(z), C = Math.min(x, j.length, P.length, Math.ceil((g - m.size) / 2)), k = (w) => {
        const S = new Set(w), B = w[Math.floor(O() * w.length)], N = [B], $ = /* @__PURE__ */ new Set([B]), A = [], X = B % c, Y = Math.floor(B / c), D = (L) => (L % c - X) ** 2 + (Math.floor(L / c) - Y) ** 2;
        for (; N.length && A.length < C; ) {
          N.sort((R, T) => D(R) - D(T) || R - T);
          const L = N.shift();
          A.push(L);
          for (const R of b[L]) S.has(R) && !$.has(R) && ($.add(R), N.push(R));
        }
        return A;
      };
      for (const w of k(j))
        d[w] = z, m.add(w);
      for (const w of k(P))
        d[w] = v, m.add(w);
    }
    const p = { ...o, opening: d };
    try {
      const u = F(p, e), E = u.metrics, v = E.averageBatch - E.smallBatchPercent * 0.1 - E.peakCache / n;
      (!y || v > y.score) && (y = { level: p, proof: u, score: v });
    } catch {
    }
  }
  if (!y) throw new Error("无法生成可完成的全局开局，请增大篮子或更换种子");
  return y.proof.metrics.maximumWrongPercent = Math.round(l / s * 1e3) / 10, { level: y.level, proof: y.proof, options: e };
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

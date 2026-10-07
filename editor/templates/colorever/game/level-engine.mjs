const R = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 3, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 2, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 2, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 2, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 6, 2, 2, 2, 2, 2, 2, 2, 6, 2, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 6, 2, 2, 2, 2, 2, 2, 2, 6, 2, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0, 1, 1, 1, 2, 2, 2, 5, 5, 5, 2, 2, 2, 2, 7, 2, 2, 2, 2, 5, 5, 5, 2, 2, 2, 1, 1, 1, 0, 0, 1, 1, 1, 2, 2, 2, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, 5, 5, 2, 2, 2, 1, 1, 1, 0, 0, 1, 1, 1, 1, 2, 2, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, 5, 5, 2, 2, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 4, 4, 4, 2, 2, 2, 4, 4, 4, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 4, 4, 4, 2, 2, 2, 4, 4, 4, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], B = () => [...R];
class C {
  constructor({ width: t = 29, height: o = 29, target: e = B(), capacity: s = 48, trayCols: n = 12, openingSeeds: r = null, openingBoard: f = null } = {}) {
    this.width = t, this.height = o, this.target = [...e], this.capacity = s, this.trayCols = n, this.openingSeeds = r, this.openingBoard = f, this.reset();
  }
  neighbors(t) {
    const o = t % this.width, e = Math.floor(t / this.width), s = [];
    for (let n = -1; n <= 1; n++) for (let r = -1; r <= 1; r++) {
      if (!r && !n) continue;
      const f = o + r, a = e + n;
      f >= 0 && f < this.width && a >= 0 && a < this.height && s.push(a * this.width + f);
    }
    return s;
  }
  connected(t, o) {
    if (!o(t)) return [];
    const e = /* @__PURE__ */ new Set([t]), s = [t];
    for (let n = 0; n < s.length; n++) for (const r of this.neighbors(s[n])) !e.has(r) && o(r) && (e.add(r), s.push(r));
    return s;
  }
  reset() {
    if (this.board = [...this.target], this.tray = Array(this.capacity).fill(0), this.selection = null, this.history = [], this.moves = 0, this.openingBoard) {
      this.board = [...this.openingBoard], this.openingPatches = [];
      return;
    }
    const t = /* @__PURE__ */ new Set(), o = (a, d, y) => {
      const g = this.target.map((i, l) => i === a && !t.has(l) ? l : -1).filter((i) => i >= 0).sort((i, l) => Math.hypot(i % this.width - d[0], Math.floor(i / this.width) - d[1]) - Math.hypot(l % this.width - d[0], Math.floor(l / this.width) - d[1]));
      for (const i of g) {
        const l = this.connected(i, (m) => this.target[m] === a && !t.has(m)).slice(0, y);
        if (l.length === y)
          return l.forEach((m) => t.add(m)), l;
      }
      throw new Error("Not enough uniform cells for an opening cycle");
    }, e = this.openingSeeds ?? [[9, 23], [7, 9], [2, 13], [14, 23], [24, 14]], s = [o(2, e[0], 6), o(3, e[1], 6), o(1, e[2], 6)], n = s.map((a) => this.target[a[0]]);
    s.forEach((a, d) => a.forEach((y) => this.board[y] = n[(d + 1) % s.length])), this.openingPatches = s;
    const r = o(2, e[3], 12), f = o(1, e[4], 12);
    r.forEach((a) => this.board[a] = 1), f.forEach((a) => this.board[a] = 2), this.openingPatches.push(r, f);
  }
  get correct() {
    return this.target.reduce((t, o, e) => t + (o !== 0 && this.board[e] === o ? 1 : 0), 0);
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
  pick(t, o) {
    if (!["board", "tray"].includes(t) || !Number.isInteger(o) || o < 0) return !1;
    const e = t === "board" ? this.board : this.tray;
    if (o >= e.length) return !1;
    const s = e[o];
    if (!s || t === "board" && s === this.target[o]) return !1;
    let n;
    if (t === "board") n = this.connected(o, (r) => this.board[r] === s && this.board[r] !== this.target[r]);
    else {
      let r = o, f = o;
      for (; r > 0 && e[r - 1] === s; ) r--;
      for (; f + 1 < e.length && e[f + 1] === s; ) f++;
      n = Array.from({ length: f - r + 1 }, (a, d) => r + d);
    }
    return this.selection = { region: t, indices: n, color: s }, !0;
  }
  destinations(t, o) {
    const e = this.selection;
    return !e || !["board", "tray"].includes(t) || !Number.isInteger(o) || o < 0 || o >= (t === "board" ? this.board.length : this.tray.length) ? [] : t === "board" ? this.connected(o, (s) => this.target[s] === e.color && this.board[s] === 0).slice(0, e.indices.length) : e.region !== "board" || this.tray[o] !== 0 ? [] : Array.from({ length: this.capacity }, (s, n) => (o + n) % this.capacity).filter((s) => this.tray[s] === 0).slice(0, e.indices.length);
  }
  isColorComplete(t) {
    return this.target.some((o) => o === t) && this.target.every((o, e) => o !== t || this.board[e] === o);
  }
  place(t, o) {
    const e = this.selection, s = this.destinations(t, o);
    if (!s.length) return null;
    this.history.push(this.snapshot());
    const n = [], r = s.length;
    if (t === "tray") {
      const f = this.tray.map((g, i) => ({ color: g, from: i })).filter((g) => g.color), a = f.findLastIndex((g) => g.color === e.color), d = a < 0 ? f.length : a + 1, y = e.indices.slice(0, r).map((g) => ({ color: e.color, from: g, incoming: !0 }));
      f.splice(d, 0, ...y), this.tray.fill(0), f.forEach((g, i) => {
        this.tray[i] = g.color, g.incoming ? (this.board[g.from] = 0, n.push({ fromRegion: "board", from: g.from, toRegion: "tray", to: i, color: g.color })) : g.from !== i && n.push({ fromRegion: "tray", from: g.from, toRegion: "tray", to: i, color: g.color, shift: !0 });
      });
    } else {
      const f = e.region === "board" ? this.board : this.tray;
      if (s.forEach((a, d) => {
        const y = e.indices[d];
        f[y] = 0, this.board[a] = e.color, n.push({ fromRegion: e.region, from: y, toRegion: "board", to: a, color: e.color });
      }), e.region === "tray") {
        const a = this.tray.map((d, y) => ({ color: d, from: y })).filter((d) => d.color);
        if (this.tray.fill(0), a.forEach((d, y) => {
          this.tray[y] = d.color, d.from !== y && n.push({ fromRegion: "tray", from: d.from, toRegion: "tray", to: y, color: d.color, shift: !0 });
        }), r < e.indices.length) {
          const d = new Set(e.indices.slice(r));
          this.selection = { ...e, indices: a.map((y, g) => d.has(y.from) ? g : -1).filter((y) => y >= 0) };
        }
      }
    }
    return this.moves++, e.region === "tray" && t === "board" && r < e.indices.length || (this.selection = r < e.indices.length ? { ...e, indices: e.indices.slice(r) } : null), n;
  }
  hint() {
    if (this.selection) {
      for (let o = 0; o < this.board.length; o++) if (this.destinations("board", o).length) return { region: "board", index: o, action: "place" };
      if (this.selection.region === "board") {
        const o = this.tray.indexOf(0);
        if (o >= 0) return { region: "tray", index: o, action: "store" };
      }
      return null;
    }
    for (const o of ["board", "tray"]) {
      const e = o === "board" ? this.board : this.tray;
      for (let s = 0; s < e.length; s++)
        if (!(!e[s] || o === "board" && e[s] === this.target[s]) && this.target.some((n, r) => n === e[s] && this.board[r] === 0))
          return { region: o, index: s, action: "pick" };
    }
    const t = this.board.findIndex((o, e) => o && o !== this.target[e]);
    return t < 0 ? null : { region: "board", index: t, action: "pick" };
  }
}
function $(c) {
  const t = (h) => {
    throw new Error(h);
  };
  (!c || typeof c != "object" || Array.isArray(c)) && t("关卡必须是对象");
  const { width: o, height: e, capacity: s = 48, trayCols: n = 12 } = c;
  for (const [h, p, E, u] of [["width", o, 4, 40], ["height", e, 4, 40], ["capacity", s, 4, 96], ["trayCols", n, 4, 16]]) (!Number.isInteger(p) || p < E || p > u) && t(`${h} 必须是 ${E}–${u} 的整数`);
  (s < n || Math.ceil(s / n) > 6) && t("篮子应为 1–6 行，容量不能小于列数");
  const r = {};
  for (const [h, p] of Object.entries(c.colors || {}))
    (!/^[1-9]\d*$/.test(h) || Number(h) > 255 || !/^#[0-9a-f]{6}$/i.test(p)) && t("颜色 ID 必须为 1–255，色值必须为 #RRGGBB"), r[h] = p.toLowerCase();
  (Object.keys(r).length < 2 || Object.keys(r).length > 16) && t("色板需要 2–16 种颜色");
  const f = (h) => Number.isInteger(h) && (h === 0 || Object.hasOwn(r, h));
  (!Array.isArray(c.target) || c.target.length !== o * e || !c.target.every(f)) && t("target 必须与棋盘尺寸一致，0 为无格子，其余值对应颜色 ID");
  const a = [...c.target], d = a.filter(Boolean);
  new Set(d).size < 2 && t("图案至少需要两个实际使用的颜色");
  const y = c.openingMode ?? "scattered";
  ["easy", "scattered"].includes(y) || t("开局模式必须为简易模式或零散模式");
  const g = c.difficulty ?? 21, i = c.seed ?? 1;
  (!Number.isInteger(g) || g < 1 || g > 100) && t("打散对数应为 1–100"), (!Number.isInteger(i) || i < 0 || i > 2147483647) && t("随机种子应为 0–2147483647");
  let l = c.opening;
  if (l != null) {
    (!Array.isArray(l) || l.length !== a.length || !l.every(f) || l.some((u, b) => a[b] === 0 != (u === 0))) && t("开局必须保留图案的有效格子，不允许增加或缺失珠子");
    const h = (u) => {
      const b = {};
      for (const S of u) S && (b[S] = (b[S] || 0) + 1);
      return b;
    }, p = h(a), E = h(l);
    Object.keys(p).some((u) => p[u] !== E[u]) && t("开局每种颜色的珠子数量必须与目标一致"), l = [...l];
  }
  const m = {};
  for (const h of Object.keys(r)) m[h] = String(c.colorNames?.[h] || `颜色 ${h}`).slice(0, 40);
  const w = c.decoration ?? "none";
  ["cat", "chick", "phoenix", "none"].includes(w) || t("未知装饰类型");
  const M = {};
  if (c.decorations !== void 0) {
    (!c.decorations || typeof c.decorations != "object" || Array.isArray(c.decorations) || Object.keys(c.decorations).length > 16) && t("装饰微调必须为最多 16 项的对象");
    for (const [h, p] of Object.entries(c.decorations)) {
      (!/^[a-z][a-z0-9-]{0,39}$/.test(h) || !p || typeof p != "object") && t("装饰 ID 或参数无效");
      const { offsetX: E = 0, offsetY: u = 0, scale: b = 1 } = p;
      (![E, u, b].every(Number.isFinite) || Math.abs(E) > 40 || Math.abs(u) > 40 || b < 0.1 || b > 4) && t("装饰偏移范围 ±40 格，缩放范围 0.1–4"), M[h] = { offsetX: E, offsetY: u, scale: b };
    }
  }
  return { version: 1, name: String(c.name || "珠子拼画").slice(0, 100), width: o, height: e, colors: r, colorNames: m, target: a, opening: l ?? null, capacity: s, trayCols: n, difficulty: g, seed: i, openingMode: y, decoration: w, ...Object.keys(M).length ? { decorations: M } : {} };
}
function N(c) {
  const t = new C({ width: c.width, height: c.height, target: c.target, capacity: c.capacity, trayCols: c.trayCols, openingBoard: c.opening }), o = /* @__PURE__ */ new Set(), e = [];
  for (let s = 0; s < c.target.length * 12 + 100; s++) {
    if (t.complete) return { moves: t.moves, solution: e };
    const n = JSON.stringify([t.board, t.tray, t.selection]);
    if (o.has(n)) throw new Error("当前开局无法通过自动求解验证，请增加篮子容量或重新生成开局");
    o.add(n);
    const r = t.hint();
    if (!r) throw new Error("当前开局无法通过自动求解验证，请增加篮子容量或重新生成开局");
    if (!(r.action === "pick" ? t.pick(r.region, r.index) : t.place(r.region, r.index))) throw new Error("自动求解发现无效移动");
    e.push(r);
  }
  throw new Error("开局超过自动求解步数上限，请降低打散数量");
}
function H(c) {
  const t = $(c);
  if (t.opening) {
    const n = N(t);
    if (t.openingMode === "easy" && n.moves > 6) throw new Error("此开局超过简易模式的 6 次搬运限制，请重新生成开局");
    return { level: t, proof: n };
  }
  const o = t.target.map((n, r) => n ? r : -1).filter((n) => n >= 0);
  let e = t.seed || 1;
  const s = () => (e = Math.imul(e, 1664525) + 1013904223 >>> 0, e / 4294967296);
  if (t.openingMode === "easy") return z(t, s);
  for (let n = 0; n < 40; n++) {
    const r = [...t.target], f = [...o];
    let a = 0;
    for (; f.length >= 2 && a < t.difficulty; ) {
      const d = Math.floor(s() * f.length), y = f.splice(d, 1)[0], g = f.filter((l) => r[l] !== r[y]);
      if (!g.length) continue;
      const i = g[Math.floor(s() * g.length)];
      f.splice(f.indexOf(i), 1), [r[y], r[i]] = [r[i], r[y]], a++;
    }
    if (!a) throw new Error("图案没有可交换的不同颜色");
    try {
      const d = { ...t, opening: r };
      return { level: d, proof: N(d) };
    } catch {
    }
  }
  throw new Error("无法生成通过求解验证的开局，请降低打散数量或增加篮子容量");
}
function z(c, t) {
  const { target: o, width: e, height: s, capacity: n } = c, r = (i) => {
    const l = i % e, m = Math.floor(i / e), w = [];
    return l && w.push(i - 1), l + 1 < e && w.push(i + 1), m && w.push(i - e), m + 1 < s && w.push(i + e), w;
  }, f = (i) => {
    const l = i % e, m = Math.floor(i / e), w = [];
    for (let M = -1; M <= 1; M++) for (let h = -1; h <= 1; h++) l + h >= 0 && l + h < e && m + M >= 0 && m + M < s && w.push((m + M) * e + l + h);
    return w;
  }, a = [...new Set(o.filter(Boolean))], d = o.filter(Boolean).length, y = Math.min(n, 18, Math.max(6, Math.round(Math.sqrt(d) / 2)));
  function g(i, l, m) {
    const w = new Set(o.flatMap((v, k) => v === i && !m.has(k) ? [k] : [])), M = [];
    for (; w.size; ) {
      const v = w.values().next().value, k = [v];
      w.delete(v);
      for (let O = 0; O < k.length; O++) for (const A of r(k[O])) w.delete(A) && k.push(A);
      k.length >= l && M.push(k);
    }
    if (!M.length) return null;
    const h = M[Math.floor(t() * M.length)], p = new Set(h), E = h[Math.floor(t() * h.length)], u = /* @__PURE__ */ new Set([E]), b = [E], S = [], j = E % e, x = Math.floor(E / e), I = (v) => (v % e - j) ** 2 + (Math.floor(v / e) - x) ** 2;
    for (; b.length && S.length < l; ) {
      b.sort((k, O) => I(k) - I(O) || k - O);
      const v = b.shift();
      S.push(v);
      for (const k of r(v)) p.has(k) && !u.has(k) && (u.add(k), b.push(k));
    }
    return S.length === l ? S : null;
  }
  for (let i = y; i >= Math.min(4, y); i--)
    for (let l = 0; l < 60; l++) {
      const m = /* @__PURE__ */ new Set(), w = [...o];
      let M = 0;
      for (let h = 0; h < 2; h++) {
        const p = [];
        for (let u = 0; u < a.length; u++) for (let b = u + 1; b < a.length; b++) p.push([a[u], a[b]]);
        for (let u = p.length - 1; u > 0; u--) {
          const b = Math.floor(t() * (u + 1));
          [p[u], p[b]] = [p[b], p[u]];
        }
        let E = !1;
        for (const [u, b] of p) {
          const S = g(u, i, m);
          if (!S) continue;
          const j = new Set(m);
          S.forEach((I) => f(I).forEach((v) => j.add(v)));
          const x = g(b, i, j);
          if (x) {
            S.forEach((I) => {
              w[I] = b, f(I).forEach((v) => m.add(v));
            }), x.forEach((I) => {
              w[I] = u, f(I).forEach((v) => m.add(v));
            }), M++, E = !0;
            break;
          }
        }
        if (!E) break;
      }
      if (M === 2)
        try {
          const h = { ...c, opening: w }, p = N(h);
          if (p.moves >= 4 && p.moves <= 6) return { level: h, proof: p };
        } catch {
        }
    }
  throw new Error("此图案或篮子没有足够的连续区域生成 6 次内完成的简易开局，请增加篮子容量、调整图案或选择零散模式");
}
export {
  H as prepareLevel,
  N as solveLevel,
  $ as validateLevel
};

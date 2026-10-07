const C = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 3, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 3, 2, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 2, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 2, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 6, 2, 2, 2, 2, 2, 2, 2, 6, 2, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 6, 2, 2, 2, 2, 2, 2, 2, 6, 2, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0, 1, 1, 1, 2, 2, 2, 5, 5, 5, 2, 2, 2, 2, 7, 2, 2, 2, 2, 5, 5, 5, 2, 2, 2, 1, 1, 1, 0, 0, 1, 1, 1, 2, 2, 2, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, 5, 5, 2, 2, 2, 1, 1, 1, 0, 0, 1, 1, 1, 1, 2, 2, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5, 5, 5, 2, 2, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 4, 4, 4, 2, 2, 2, 4, 4, 4, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 4, 4, 4, 2, 2, 2, 4, 4, 4, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], $ = () => [...C];
class z {
  constructor({ width: t = 29, height: o = 29, target: e = $(), capacity: i = 48, trayCols: n = 12, openingSeeds: r = null, openingBoard: h = null } = {}) {
    this.width = t, this.height = o, this.target = [...e], this.capacity = i, this.trayCols = n, this.openingSeeds = r, this.openingBoard = h, this.reset();
  }
  neighbors(t) {
    const o = t % this.width, e = Math.floor(t / this.width), i = [];
    for (let n = -1; n <= 1; n++) for (let r = -1; r <= 1; r++) {
      if (!r && !n) continue;
      const h = o + r, s = e + n;
      h >= 0 && h < this.width && s >= 0 && s < this.height && i.push(s * this.width + h);
    }
    return i;
  }
  connected(t, o) {
    if (!o(t)) return [];
    const e = /* @__PURE__ */ new Set([t]), i = [t];
    for (let n = 0; n < i.length; n++) for (const r of this.neighbors(i[n])) !e.has(r) && o(r) && (e.add(r), i.push(r));
    return i;
  }
  reset() {
    if (this.board = [...this.target], this.tray = Array(this.capacity).fill(0), this.selection = null, this.history = [], this.moves = 0, this.openingBoard) {
      this.board = [...this.openingBoard], this.openingPatches = [];
      return;
    }
    const t = /* @__PURE__ */ new Set(), o = (s, f, l) => {
      const d = this.target.map((g, p) => g === s && !t.has(p) ? p : -1).filter((g) => g >= 0).sort((g, p) => Math.hypot(g % this.width - f[0], Math.floor(g / this.width) - f[1]) - Math.hypot(p % this.width - f[0], Math.floor(p / this.width) - f[1]));
      for (const g of d) {
        const p = this.connected(g, (m) => this.target[m] === s && !t.has(m)).slice(0, l);
        if (p.length === l)
          return p.forEach((m) => t.add(m)), p;
      }
      throw new Error("Not enough uniform cells for an opening cycle");
    }, e = this.openingSeeds ?? [[9, 23], [7, 9], [2, 13], [14, 23], [24, 14]], i = [o(2, e[0], 6), o(3, e[1], 6), o(1, e[2], 6)], n = i.map((s) => this.target[s[0]]);
    i.forEach((s, f) => s.forEach((l) => this.board[l] = n[(f + 1) % i.length])), this.openingPatches = i;
    const r = o(2, e[3], 12), h = o(1, e[4], 12);
    r.forEach((s) => this.board[s] = 1), h.forEach((s) => this.board[s] = 2), this.openingPatches.push(r, h);
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
    const i = e[o];
    if (!i || t === "board" && i === this.target[o]) return !1;
    let n;
    if (t === "board") n = this.connected(o, (r) => this.board[r] === i && this.board[r] !== this.target[r]);
    else {
      let r = o, h = o;
      for (; r > 0 && e[r - 1] === i; ) r--;
      for (; h + 1 < e.length && e[h + 1] === i; ) h++;
      n = Array.from({ length: h - r + 1 }, (s, f) => r + f);
    }
    return this.selection = { region: t, indices: n, color: i }, !0;
  }
  destinations(t, o) {
    const e = this.selection;
    return !e || !["board", "tray"].includes(t) || !Number.isInteger(o) || o < 0 || o >= (t === "board" ? this.board.length : this.tray.length) ? [] : t === "board" ? this.connected(o, (i) => this.target[i] === e.color && this.board[i] === 0).slice(0, e.indices.length) : e.region !== "board" || this.tray[o] !== 0 ? [] : Array.from({ length: this.capacity }, (i, n) => (o + n) % this.capacity).filter((i) => this.tray[i] === 0).slice(0, e.indices.length);
  }
  isColorComplete(t) {
    return this.target.some((o) => o === t) && this.target.every((o, e) => o !== t || this.board[e] === o);
  }
  place(t, o) {
    const e = this.selection, i = this.destinations(t, o);
    if (!i.length) return null;
    this.history.push(this.snapshot());
    const n = [], r = i.length;
    if (t === "tray") {
      const h = this.tray.map((d, g) => ({ color: d, from: g })).filter((d) => d.color), s = h.findLastIndex((d) => d.color === e.color), f = s < 0 ? h.length : s + 1, l = e.indices.slice(0, r).map((d) => ({ color: e.color, from: d, incoming: !0 }));
      h.splice(f, 0, ...l), this.tray.fill(0), h.forEach((d, g) => {
        this.tray[g] = d.color, d.incoming ? (this.board[d.from] = 0, n.push({ fromRegion: "board", from: d.from, toRegion: "tray", to: g, color: d.color })) : d.from !== g && n.push({ fromRegion: "tray", from: d.from, toRegion: "tray", to: g, color: d.color, shift: !0 });
      });
    } else {
      const h = e.region === "board" ? this.board : this.tray;
      if (i.forEach((s, f) => {
        const l = e.indices[f];
        h[l] = 0, this.board[s] = e.color, n.push({ fromRegion: e.region, from: l, toRegion: "board", to: s, color: e.color });
      }), e.region === "tray") {
        const s = this.tray.map((f, l) => ({ color: f, from: l })).filter((f) => f.color);
        if (this.tray.fill(0), s.forEach((f, l) => {
          this.tray[l] = f.color, f.from !== l && n.push({ fromRegion: "tray", from: f.from, toRegion: "tray", to: l, color: f.color, shift: !0 });
        }), r < e.indices.length) {
          const f = new Set(e.indices.slice(r));
          this.selection = { ...e, indices: s.map((l, d) => f.has(l.from) ? d : -1).filter((l) => l >= 0) };
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
      for (let i = 0; i < e.length; i++)
        if (!(!e[i] || o === "board" && e[i] === this.target[i]) && this.target.some((n, r) => n === e[i] && this.board[r] === 0))
          return { region: o, index: i, action: "pick" };
    }
    const t = this.board.findIndex((o, e) => o && o !== this.target[e]);
    return t < 0 ? null : { region: "board", index: t, action: "pick" };
  }
}
function H(c) {
  const t = (a) => {
    throw new Error(a);
  };
  (!c || typeof c != "object" || Array.isArray(c)) && t("关卡必须是对象");
  const { width: o, height: e, capacity: i = 48, trayCols: n = 12 } = c;
  for (const [a, u, b, y] of [["width", o, 4, 40], ["height", e, 4, 40], ["capacity", i, 4, 96], ["trayCols", n, 4, 16]]) (!Number.isInteger(u) || u < b || u > y) && t(`${a} 必须是 ${b}–${y} 的整数`);
  (i < n || Math.ceil(i / n) > 6) && t("篮子应为 1–6 行，容量不能小于列数");
  const r = {};
  for (const [a, u] of Object.entries(c.colors || {}))
    (!/^[1-9]\d*$/.test(a) || Number(a) > 255 || !/^#[0-9a-f]{6}$/i.test(u)) && t("颜色 ID 必须为 1–255，色值必须为 #RRGGBB"), r[a] = u.toLowerCase();
  (Object.keys(r).length < 2 || Object.keys(r).length > 16) && t("色板需要 2–16 种颜色");
  const h = (a) => Number.isInteger(a) && (a === 0 || Object.hasOwn(r, a));
  (!Array.isArray(c.target) || c.target.length !== o * e || !c.target.every(h)) && t("target 必须与棋盘尺寸一致，0 为无格子，其余值对应颜色 ID");
  const s = [...c.target], f = s.filter(Boolean);
  new Set(f).size < 2 && t("图案至少需要两个实际使用的颜色");
  const l = c.openingMode ?? "scattered";
  ["easy", "medium", "scattered"].includes(l) || t("开局模式必须为简易、适中或零散模式");
  const d = c.difficulty ?? 21, g = c.seed ?? 1;
  (!Number.isInteger(d) || d < 1 || d > 100) && t("打散对数应为 1–100"), (!Number.isInteger(g) || g < 0 || g > 2147483647) && t("随机种子应为 0–2147483647");
  let p = c.opening;
  if (p != null) {
    (!Array.isArray(p) || p.length !== s.length || !p.every(h) || p.some((y, M) => s[M] === 0 != (y === 0))) && t("开局必须保留图案的有效格子，不允许增加或缺失珠子");
    const a = (y) => {
      const M = {};
      for (const w of y) w && (M[w] = (M[w] || 0) + 1);
      return M;
    }, u = a(s), b = a(p);
    Object.keys(u).some((y) => u[y] !== b[y]) && t("开局每种颜色的珠子数量必须与目标一致"), p = [...p];
  }
  const m = {};
  for (const a of Object.keys(r)) m[a] = String(c.colorNames?.[a] || `颜色 ${a}`).slice(0, 40);
  const v = c.decoration ?? "none";
  ["cat", "chick", "phoenix", "none"].includes(v) || t("未知装饰类型");
  const E = {};
  if (c.decorations !== void 0) {
    (!c.decorations || typeof c.decorations != "object" || Array.isArray(c.decorations) || Object.keys(c.decorations).length > 16) && t("装饰微调必须为最多 16 项的对象");
    for (const [a, u] of Object.entries(c.decorations)) {
      (!/^[a-z][a-z0-9-]{0,39}$/.test(a) || !u || typeof u != "object") && t("装饰 ID 或参数无效");
      const { offsetX: b = 0, offsetY: y = 0, scale: M = 1 } = u;
      (![b, y, M].every(Number.isFinite) || Math.abs(b) > 40 || Math.abs(y) > 40 || M < 0.1 || M > 4) && t("装饰偏移范围 ±40 格，缩放范围 0.1–4"), E[a] = { offsetX: b, offsetY: y, scale: M };
    }
  }
  return { version: 1, name: String(c.name || "珠子拼画").slice(0, 100), width: o, height: e, colors: r, colorNames: m, target: s, opening: p ?? null, capacity: i, trayCols: n, difficulty: d, seed: g, openingMode: l, decoration: v, ...Object.keys(E).length ? { decorations: E } : {} };
}
function R(c) {
  const t = new z({ width: c.width, height: c.height, target: c.target, capacity: c.capacity, trayCols: c.trayCols, openingBoard: c.opening }), o = /* @__PURE__ */ new Set(), e = [];
  for (let i = 0; i < c.target.length * 12 + 100; i++) {
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
function L(c) {
  const t = H(c);
  if (t.opening) {
    const n = R(t);
    if (t.openingMode === "easy" && n.moves > 6) throw new Error("此开局超过简易模式的 6 次搬运限制，请重新生成开局");
    return { level: t, proof: n };
  }
  const o = t.target.map((n, r) => n ? r : -1).filter((n) => n >= 0);
  let e = t.seed || 1;
  const i = () => (e = Math.imul(e, 1664525) + 1013904223 >>> 0, e / 4294967296);
  if (t.openingMode === "easy" || t.openingMode === "medium") return D(t, i);
  for (let n = 0; n < 40; n++) {
    const r = [...t.target], h = [...o];
    let s = 0;
    for (; h.length >= 2 && s < t.difficulty; ) {
      const f = Math.floor(i() * h.length), l = h.splice(f, 1)[0], d = h.filter((p) => r[p] !== r[l]);
      if (!d.length) continue;
      const g = d[Math.floor(i() * d.length)];
      h.splice(h.indexOf(g), 1), [r[l], r[g]] = [r[g], r[l]], s++;
    }
    if (!s) throw new Error("图案没有可交换的不同颜色");
    try {
      const f = { ...t, opening: r };
      return { level: f, proof: R(f) };
    } catch {
    }
  }
  throw new Error("无法生成通过求解验证的开局，请降低打散数量或增加篮子容量");
}
function D(c, t) {
  const { target: o, width: e, height: i, capacity: n } = c, r = (m) => {
    const v = m % e, E = Math.floor(m / e), a = [];
    return v && a.push(m - 1), v + 1 < e && a.push(m + 1), E && a.push(m - e), E + 1 < i && a.push(m + e), a;
  }, h = (m) => {
    const v = m % e, E = Math.floor(m / e), a = [];
    for (let u = -1; u <= 1; u++) for (let b = -1; b <= 1; b++) v + b >= 0 && v + b < e && E + u >= 0 && E + u < i && a.push((E + u) * e + v + b);
    return a;
  }, s = [...new Set(o.filter(Boolean))], f = o.filter(Boolean).length, l = c.openingMode === "medium", d = l ? 5 : 2, g = l ? Math.min(n, 5) : Math.min(n, 18, Math.max(6, Math.round(Math.sqrt(f) / 2)));
  function p(m, v, E) {
    const a = new Set(o.flatMap((k, S) => k === m && !E.has(S) ? [S] : [])), u = [];
    for (; a.size; ) {
      const k = a.values().next().value, S = [k];
      a.delete(k);
      for (let x = 0; x < S.length; x++) for (const B of r(S[x])) a.delete(B) && S.push(B);
      S.length >= v && u.push(S);
    }
    if (!u.length) return null;
    const b = u[Math.floor(t() * u.length)], y = new Set(b), M = b[Math.floor(t() * b.length)], w = /* @__PURE__ */ new Set([M]), I = [M], j = [], N = M % e, A = Math.floor(M / e), O = (k) => (k % e - N) ** 2 + (Math.floor(k / e) - A) ** 2;
    for (; I.length && j.length < v; ) {
      I.sort((S, x) => O(S) - O(x) || S - x);
      const k = I.shift();
      j.push(k);
      for (const S of r(k)) y.has(S) && !w.has(S) && (w.add(S), I.push(S));
    }
    return j.length === v ? j : null;
  }
  for (let m = g; m >= (l ? 3 : Math.min(4, g)); m--)
    for (let v = 0; v < 60; v++) {
      const E = /* @__PURE__ */ new Set(), a = [...o];
      let u = 0;
      for (let b = 0; b < d; b++) {
        const y = [];
        for (let w = 0; w < s.length; w++) for (let I = w + 1; I < s.length; I++) y.push([s[w], s[I]]);
        for (let w = y.length - 1; w > 0; w--) {
          const I = Math.floor(t() * (w + 1));
          [y[w], y[I]] = [y[I], y[w]];
        }
        let M = !1;
        for (const [w, I] of y) {
          const j = p(w, m, E);
          if (!j) continue;
          const N = new Set(E);
          j.forEach((O) => h(O).forEach((k) => N.add(k)));
          const A = p(I, m, N);
          if (A) {
            j.forEach((O) => {
              a[O] = I, h(O).forEach((k) => E.add(k));
            }), A.forEach((O) => {
              a[O] = w, h(O).forEach((k) => E.add(k));
            }), u++, M = !0;
            break;
          }
        }
        if (!M) break;
      }
      if (u === d)
        try {
          const b = { ...c, opening: a }, y = R(b);
          if (y.moves >= (l ? 12 : 4) && y.moves <= (l ? 14 : 6)) return { level: b, proof: y };
        } catch {
        }
    }
  throw new Error(`此图案或篮子没有足够的连续区域生成${l ? " 12–14 次搬运完成的适中开局" : " 6 次内完成的简易开局"}，请增加篮子容量、调整图案或选择零散模式`);
}
export {
  L as prepareLevel,
  R as solveLevel,
  H as validateLevel
};

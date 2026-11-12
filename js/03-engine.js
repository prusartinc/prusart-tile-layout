"use strict";
/* ================= tile engine ================= */
function patOf(T) {
  if (T.shape === "hex") return "hex";
  if (T.shape === "chevron") return "chevron";
  if (T.shape === "penny") return T.pattern === "offset" ? "offset" : "grid";
  return T.pattern || "grid";
}
function angOf(T) {
  return (((+T.ang || 0) + (T.shape === "hex" && T.rot ? 90 : 0)) * Math.PI) / 180;
}
function rdims(T) {
  if (T.shape === "penny") return { tw: +T.w, th: +T.w };
  return { tw: T.rot ? +T.h : +T.w, th: T.rot ? +T.w : +T.h };
}
function tileDesc(T) {
  const s = T.shape;
  let d;
  if (s === "hex") d = "Hex " + fmt(+T.w);
  else if (s === "penny") d = "Penny " + fmt(+T.w);
  else if (s === "chevron") d = "Chevron " + fmtIn(+T.w) + "×" + fmtIn(+T.h);
  else if (patOf(T) === "pinwheel")
    d = fmtIn(+T.w) + "×" + fmtIn(+T.w) + " + " + fmtIn(+T.w2) + "×" + fmtIn(+T.w2);
  else d = fmtIn(Math.min(+T.w, +T.h)) + "×" + fmtIn(Math.max(+T.w, +T.h));
  if (T.sheet && T.sheet.on)
    d += " (" + (lang === "ru" ? "лист " : "sheet ") + fmtIn(+T.sheet.w) + "×" + fmtIn(+T.sheet.h) + ")";
  return d;
}

function offShift(T, j, f) {
  if (!f) return 0;
  const d = T.offDir || "r";
  return d === "a" ? mod(j, 2) * f : d === "l" ? mod(-j * f, 1) : mod(j * f, 1);
}
function genTiles(T, bb) {
  const g = +T.g || 0,
    O = [+T.ox || 0, +T.oy || 0],
    out = [],
    W = bb.x1 - bb.x0,
    H = bb.y1 - bb.y0,
    pat = patOf(T);
  const LIM = 16000;
  const R = (x, y, w, h, k, q) => out.push({ x0: x, y0: y, lw: w, lh: h, k: k || "r", q: q || 0 });
  if (pat === "hex") {
    const F = +T.w;
    if (!(F > 0.2)) return null;
    const s = F / Math.sqrt(3),
      px = F + g,
      py = 1.5 * s + (g * Math.sqrt(3)) / 2;
    if ((W / px + 3) * (H / py + 3) > LIM) return null;
    const j0 = Math.floor((bb.y0 - O[1]) / py) - 1,
      j1 = Math.ceil((bb.y1 - O[1]) / py) + 1;
    for (let j = j0; j <= j1; j++) {
      const cy = O[1] + j * py,
        sh = (mod(j, 2) * px) / 2,
        i0 = Math.floor((bb.x0 - O[0] - sh) / px) - 1,
        i1 = Math.ceil((bb.x1 - O[0] - sh) / px) + 1;
      for (let i = i0; i <= i1; i++) {
        const cx = O[0] + sh + i * px,
          poly = [];
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 6 + (k * Math.PI) / 3;
          poly.push([cx + s * Math.cos(a), cy + s * Math.sin(a)]);
        }
        out.push({ x0: cx - F / 2, y0: cy - s, lw: F, lh: 2 * s, poly, k: "p", q: mod(i + j, 2) });
      }
    }
    return out;
  }
  if (pat === "chevron") {
    const cw = +T.w,
      eh = +T.h,
      sl = Math.tan((Math.min(75, Math.max(10, +T.cang || 45)) * Math.PI) / 180),
      rise = cw * sl,
      px = cw + g,
      py = eh + g;
    if (!(cw > 0.2 && eh > 0.2)) return null;
    if ((W / px + 3) * ((H + rise) / py + 3) > LIM) return null;
    const i0 = Math.floor((bb.x0 - O[0]) / px) - 1,
      i1 = Math.ceil((bb.x1 - O[0]) / px) + 1;
    for (let i = i0; i <= i1; i++) {
      const x0 = O[0] + i * px,
        odd = mod(i, 2) === 1,
        yl = odd ? rise : 0,
        yr = odd ? 0 : rise;
      const j0 = Math.floor((bb.y0 - O[1] - rise) / py) - 1,
        j1 = Math.ceil((bb.y1 - O[1]) / py) + 1;
      for (let j = j0; j <= j1; j++) {
        const y = O[1] + j * py;
        out.push({
          x0,
          y0: y,
          lw: cw,
          lh: eh + rise,
          poly: [
            [x0, y + yl],
            [x0 + cw, y + yr],
            [x0 + cw, y + yr + eh],
            [x0, y + yl + eh],
          ],
          k: "p",
          q: mod(j, 2),
        });
      }
    }
    return out;
  }
  const { tw, th } = rdims(T);
  if (!(tw > 0.2 && th > 0.2)) return null;
  const kind = T.shape === "penny" ? "c" : "r";
  if (pat === "herring") {
    const L = Math.max(tw, th),
      Wd = Math.min(tw, th),
      A = Wd + g,
      B = L + g;
    if (((W * H) / (L * Wd)) * 2 + 80 > LIM) return null;
    const cs = [
      [bb.x0, bb.y0],
      [bb.x1, bb.y0],
      [bb.x0, bb.y1],
      [bb.x1, bb.y1],
    ].map((p) => [p[0] - O[0], p[1] - O[1]]);
    const ks = cs.map((p) => (p[0] + p[1]) / (2 * A)),
      ms = cs.map((p) => (p[0] - p[1]) / (2 * B));
    for (let m = Math.floor(Math.min(...ms)) - 2; m <= Math.ceil(Math.max(...ms)) + 2; m++)
      for (let k = Math.floor(Math.min(...ks)) - 3; k <= Math.ceil(Math.max(...ks)) + 3; k++) {
        const x = O[0] + k * A + m * B,
          y = O[1] + k * A - m * B;
        R(x, y, L, Wd, kind, 0);
        R(x + B, y - (L - Wd), Wd, L, kind, 1);
      }
    return out;
  }
  if (pat === "basket") {
    const L = Math.max(tw, th),
      Wd = Math.min(tw, th),
      n = Math.max(1, Math.round((L + g) / (Wd + g))),
      Bs = Math.max(L, n * Wd + (n - 1) * g) + g;
    if ((W / Bs + 3) * (H / Bs + 3) * n > LIM) return null;
    const i0 = Math.floor((bb.x0 - O[0]) / Bs) - 1,
      i1 = Math.ceil((bb.x1 - O[0]) / Bs) + 1,
      j0 = Math.floor((bb.y0 - O[1]) / Bs) - 1,
      j1 = Math.ceil((bb.y1 - O[1]) / Bs) + 1;
    for (let i = i0; i <= i1; i++)
      for (let j = j0; j <= j1; j++) {
        const bx = O[0] + i * Bs,
          by = O[1] + j * Bs,
          q = mod(i + j, 2);
        for (let k = 0; k < n; k++) {
          if (!q) R(bx, by + k * (Wd + g), L, Wd, kind, 0);
          else R(bx + k * (Wd + g), by, Wd, L, kind, 1);
        }
      }
    return out;
  }
  if (pat === "pinwheel") {
    const a = +T.w,
      b = Math.min(+T.w2 || a / 2, a * 0.95),
      A = a + g,
      Bb = b + g,
      det = A * A + Bb * Bb;
    if (!(a > 0.2 && b > 0.1)) return null;
    if (((W * H) / (a * a)) * 2 + 80 > LIM) return null;
    const cs = [
      [bb.x0, bb.y0],
      [bb.x1, bb.y0],
      [bb.x0, bb.y1],
      [bb.x1, bb.y1],
    ].map((p) => [p[0] - O[0], p[1] - O[1]]);
    const c1 = cs.map((p) => (A * p[0] + Bb * p[1]) / det),
      c2 = cs.map((p) => (-Bb * p[0] + A * p[1]) / det);
    for (let u = Math.floor(Math.min(...c1)) - 2; u <= Math.ceil(Math.max(...c1)) + 2; u++)
      for (let v = Math.floor(Math.min(...c2)) - 2; v <= Math.ceil(Math.max(...c2)) + 2; v++) {
        const x = O[0] + u * A - v * Bb,
          y = O[1] + u * Bb + v * A;
        R(x, y, a, a, kind, 0);
        R(x + A - Bb, y + A, b, b, kind, 1);
      }
    return out;
  }
  // grid / offset rows / offset columns
  let px = tw + g,
    py = th + g;
  const f = pat === "grid" ? 0 : +(T.off == null ? 0.5 : T.off);
  if (T.shape === "penny" && pat === "offset" && Math.abs(f - 0.5) < 1e-6) py = ((tw + g) * Math.sqrt(3)) / 2;
  if ((W / px + 3) * (H / py + 3) > LIM) return null;
  if (pat === "voffset") {
    const i0 = Math.floor((bb.x0 - O[0]) / px) - 1,
      i1 = Math.ceil((bb.x1 - O[0]) / px) + 1;
    for (let i = i0; i <= i1; i++) {
      const x = O[0] + i * px,
        sh = offShift(T, i, f) * py,
        j0 = Math.floor((bb.y0 - O[1] - sh) / py) - 1,
        j1 = Math.ceil((bb.y1 - O[1] - sh) / py) + 1;
      for (let j = j0; j <= j1; j++) R(x, O[1] + sh + j * py, tw, th, kind, mod(i + j, 2));
    }
    return out;
  }
  const j0 = Math.floor((bb.y0 - O[1]) / py) - 1,
    j1 = Math.ceil((bb.y1 - O[1]) / py) + 1;
  for (let j = j0; j <= j1; j++) {
    const y = O[1] + j * py,
      sh = offShift(T, j, f) * px,
      i0 = Math.floor((bb.x0 - O[0] - sh) / px) - 1,
      i1 = Math.ceil((bb.x1 - O[0] - sh) / px) + 1;
    for (let i = i0; i <= i1; i++) R(O[0] + sh + i * px, y, tw, th, kind, mod(i + j, 2));
  }
  return out;
}

function cellBox(C, holes, x0, y0, x1, y1) {
  const xs = new Set([x0, x1]),
    ys = new Set([y0, y1]);
  C.forEach((q) => {
    xs.add(q[0]);
    ys.add(q[1]);
  });
  holes.forEach((h) =>
    h.L.forEach((v) => {
      if (v[0] > x0 && v[0] < x1) xs.add(v[0]);
      if (v[1] > y0 && v[1] < y1) ys.add(v[1]);
    }),
  );
  const X = [...xs].sort((a, b) => a - b),
    Yv = [...ys].sort((a, b) => a - b);
  let bb = null,
    big = 0,
    lp = null;
  for (let i = 0; i < X.length - 1; i++) {
    if (X[i + 1] - X[i] < 1e-4) continue;
    for (let j = 0; j < Yv.length - 1; j++) {
      if (Yv[j + 1] - Yv[j] < 1e-4) continue;
      const cx = (X[i] + X[i + 1]) / 2,
        cy = (Yv[j] + Yv[j + 1]) / 2;
      if (!pip(C, cx, cy)) continue;
      if (holes.some((h) => cx > h.bb.x0 && cx < h.bb.x1 && cy > h.bb.y0 && cy < h.bb.y1 && pip(h.L, cx, cy)))
        continue;
      const ca = (X[i + 1] - X[i]) * (Yv[j + 1] - Yv[j]);
      if (ca > big) {
        big = ca;
        lp = [cx, cy, X[i + 1] - X[i], Yv[j + 1] - Yv[j]];
      }
      if (!bb) bb = { x0: X[i], y0: Yv[j], x1: X[i + 1], y1: Yv[j + 1] };
      else {
        bb.x0 = Math.min(bb.x0, X[i]);
        bb.y0 = Math.min(bb.y0, Yv[j]);
        bb.x1 = Math.max(bb.x1, X[i + 1]);
        bb.y1 = Math.max(bb.y1, Yv[j + 1]);
      }
    }
  }
  if (bb) bb.lp = lp;
  return bb;
}

function spanAt(C, axis, v) {
  const o = axis ? 0 : 1;
  let mn = 1e9,
    mx = -1e9;
  for (let i = 0; i < C.length; i++) {
    const a = C[i],
      b2 = C[(i + 1) % C.length],
      av = a[axis],
      bv = b2[axis];
    if (av !== bv && (av - v) * (bv - v) <= 0) {
      const u = (v - av) / (bv - av),
        w = a[o] + u * (b2[o] - a[o]);
      if (w < mn) mn = w;
      if (w > mx) mx = w;
    }
  }
  return mx > mn ? [mn, mx] : null;
}
function taperAxis(C, b, axis, area) {
  const lo = axis ? b.y0 : b.x0,
    hi = axis ? b.y1 : b.x1,
    d = Math.min(0.03, (hi - lo) / 10);
  const inner = [
    ...new Set(
      C.map((q) => q[axis])
        .filter((v) => v > lo + 0.05 && v < hi - 0.05)
        .map((v) => Math.round(v * 1000) / 1000),
    ),
  ].sort((a, b) => a - b);
  const xs = [lo + d, ...inner, hi - d],
    H = xs.map((x) => {
      const sp = spanAt(C, axis, x);
      return sp ? sp[1] - sp[0] : 0;
    });
  if (Math.min(...H) < 0.1 || Math.max(...H) - Math.min(...H) < 1 / 32) return null;
  const X = [lo, ...inner, hi];
  let A = 0;
  for (let i = 0; i < X.length - 1; i++) A += ((X[i + 1] - X[i]) * (H[i] + H[i + 1])) / 2;
  if (Math.abs(A - area) > Math.max(0.02 * area, 0.05)) return null;
  if (H.length <= 2) return [H[0], H[H.length - 1]];
  let k = 1,
    dev = -1;
  for (let i = 1; i < H.length - 1; i++) {
    const lin = H[0] + (H[H.length - 1] - H[0]) * ((xs[i] - xs[0]) / (xs[xs.length - 1] - xs[0]));
    const dv = Math.abs(H[i] - lin);
    if (dv > dev) {
      dev = dv;
      k = i;
    }
  }
  return dev > 1 / 32 ? [H[0], H[k], H[H.length - 1]] : [H[0], H[H.length - 1]];
}
function pieces(region, holes, T, niche, bot) {
  const bb = bboxOf(region),
    gap = +P.edgeGap || 0,
    out = [];
  const tiles = genTiles(T, bb);
  if (!tiles) return null;
  for (const t of tiles) {
    const x1 = t.x0 + t.lw,
      y1 = t.y0 + t.lh;
    if (x1 <= bb.x0 + EPS || t.x0 >= bb.x1 - EPS || y1 <= bb.y0 + EPS || t.y0 >= bb.y1 - EPS) continue;
    const tp = t.poly || rectPoly(t.x0, t.y0, t.lw, t.lh);
    const C = clipConvex(region, tp);
    if (C.length < 3) continue;
    let a = polyArea(C);
    if (a < 0.02) continue;
    let hit = false,
      hl = null;
    for (const h of holes) {
      const hb = h.bb;
      if (
        hb.x0 < x1 - EPS &&
        hb.x1 > t.x0 + EPS &&
        hb.y0 < y1 - EPS &&
        hb.y1 > t.y0 + EPS &&
        h.P.length >= 3
      ) {
        const hp = clipConvex(h.P, tp);
        const ha = polyArea(hp);
        if (ha > 1e-3) {
          a -= ha;
          hit = true;
          (hl = hl || []).push(h.type);
        }
      }
    }
    if (a < 0.02) continue;
    const b = hit ? cellBox(C, holes, t.x0, t.y0, x1, y1) : bboxOf(C);
    if (!b) continue;
    const ta = t.poly ? polyArea(t.poly) : t.lw * t.lh,
      bw = b.x1 - b.x0,
      bh = b.y1 - b.y0,
      isR = t.k !== "p";
    let cL = b.x0 > t.x0 + EPS,
      cR = b.x1 < x1 - EPS,
      cB = b.y0 > t.y0 + EPS,
      cT = b.y1 < y1 - EPS,
      notch,
      full;
    if (isR) {
      notch = a < bw * bh * 0.985;
      full = !cL && !cR && !cB && !cT && !notch;
    } else {
      full = a >= ta * 0.995;
      if (full) cL = cR = cB = cT = false;
      notch = !full;
    }
    const cw = isR ? Math.max(0, bw - gap * ((cL ? 1 : 0) + (cR ? 1 : 0))) : bw,
      ch = isR ? Math.max(0, bh - gap * ((cB ? 1 : 0) + (cT ? 1 : 0))) : bh;
    let taper = null,
      taperW = null,
      chv = ch,
      cwv = cw;
    if (isR && !hit && (cL || cR || cB || cT) && a < bw * bh - 0.01) {
      const A0 = polyArea(C);
      let tv = cB || cT ? taperAxis(C, b, 0, A0) : null,
        tw2 = cL || cR ? taperAxis(C, b, 1, A0) : null;
      if (tv && tw2) {
        const rv = (Math.max(...tv) - Math.min(...tv)) / Math.max(...tv),
          rw = (Math.max(...tw2) - Math.min(...tw2)) / Math.max(...tw2);
        if (rv <= rw) tw2 = null;
        else tv = null;
      }
      if (tv) {
        taper = tv.map((h) => h - gap * ((cB ? 1 : 0) + (cT ? 1 : 0)));
        chv = Math.min(...taper);
      }
      if (tw2) {
        taperW = tw2.map((w) => w - gap * ((cL ? 1 : 0) + (cR ? 1 : 0)));
        cwv = Math.min(...taperW);
      }
      if (taper || taperW) notch = false;
    }
    out.push({
      t,
      k: t.k,
      q: t.q,
      x0: t.x0,
      y0: t.y0,
      lw: t.lw,
      lh: t.lh,
      b,
      a,
      ta,
      lp: b.lp,
      cutX: cL || cR,
      cutY: cB || cT,
      notch,
      cw: cwv,
      ch: chv,
      taper,
      taperW,
      full,
      niche: !!niche,
      hl,
      C,
      ax: C.every((q, i) => {
        const r2 = C[(i + 1) % C.length];
        return Math.abs(q[0] - r2[0]) < 1e-6 || Math.abs(q[1] - r2[1]) < 1e-6;
      }),
    });
  }
  return out;
}

const RANK = { full: 0, cut: 1, warn: 2, bad: 3 };
function cls(p) {
  if (p.full) return "full";
  if (p.k === "p") {
    const r = p.a / p.ta;
    return r < 0.15 ? "bad" : r < 0.33 ? "warn" : "cut";
  }
  let m = 1e9,
    rel = 1e9;
  if (p.cutX) {
    m = Math.min(m, p.cw);
    rel = Math.min(rel, p.cw / p.lw);
  }
  if (p.cutY) {
    m = Math.min(m, p.ch);
    rel = Math.min(rel, p.ch / p.lh);
  }
  if (m < (+P.minCut || 0)) return "bad";
  if (rel < 1 / 3) return "warn";
  return "cut";
}
function ffd(items, cap, k) {
  items.sort((a, b) => b - a);
  const bins = [];
  for (const it of items) {
    const need = it + k;
    const i = bins.findIndex((r) => r >= need - 1e-6);
    if (i < 0) bins.push(cap - need);
    else bins[i] -= need;
  }
  return bins.length;
}
function sizeKey(p, T) {
  if (p.k === "p" || p.k === "c") return tileDesc(T);
  const a = Math.max(p.lw, p.lh),
    b = Math.min(p.lw, p.lh);
  return fmtIn(b) + "×" + fmtIn(a);
}
function needBy(all, T) {
  const k = +P.kerf || 0,
    m = {},
    xs = {},
    ys = {};
  const add = (key, n) => (m[key] = (m[key] || 0) + n);
  for (const p of all) {
    const key = sizeKey(p, T);
    if (p.full) {
      add(key, 1);
      continue;
    }
    if (p.k === "r" && !p.notch && p.cutX && !p.cutY) {
      const kk = key + "|" + p.lw;
      (xs[kk] = xs[kk] || []).push(p.taperW ? Math.max(...p.taperW) : p.cw);
      continue;
    }
    if (p.k === "r" && !p.notch && p.cutY && !p.cutX) {
      const kk = key + "|" + p.lh;
      (ys[kk] = ys[kk] || []).push(p.taper ? Math.max(...p.taper) : p.ch);
      continue;
    }
    add(key, 1);
  }
  for (const kk in xs) {
    const i = kk.lastIndexOf("|");
    add(kk.slice(0, i), ffd(xs[kk], +kk.slice(i + 1), k));
  }
  for (const kk in ys) {
    const i = kk.lastIndexOf("|");
    add(kk.slice(0, i), ffd(ys[kk], +kk.slice(i + 1), k));
  }
  return m;
}
function mkStrip(label, len, wid, faces, T) {
  const g = +T.g || 0,
    k = +P.kerf || 0,
    rect = T.shape === "rect" && !(T.sheet && T.sheet.on);
  const Lg = Math.max(+T.w, +T.h),
    Sh = Math.min(+T.w, +T.h);
  if (!(len > 0 && wid > 0))
    return { label, len, wid, faces, count: 0, tiles: 0, area: 0, per: 0, last: 0, Lg };
  if (!rect) {
    const ta = T.shape === "hex" ? +T.w * +T.w * 0.866 : +T.w * (+T.h || +T.w);
    return {
      label,
      len,
      wid,
      faces,
      count: 0,
      tiles: Math.ceil(((len * wid * faces) / ta) * 1.3),
      area: len * wid * faces,
      per: 0,
      last: 0,
      Lg,
      approx: true,
      key: tileDesc(T),
    };
  }
  const per = Math.ceil((len + g) / (Lg + g)),
    last = len - (per - 1) * (Lg + g);
  const rows = wid > Sh ? Math.ceil((wid + g) / (Sh + g)) : 1;
  const perTile = rows > 1 ? 1 : Math.max(1, Math.floor((Sh + k) / (wid + k)));
  const count = per * faces * rows;
  return {
    label,
    len,
    wid,
    faces,
    per,
    last,
    count,
    tiles: Math.ceil(count / perTile),
    area: len * wid * faces,
    Lg,
    key: fmtIn(Sh) + "×" + fmtIn(Lg),
  };
}
function countSheets(region, T) {
  const sw = +T.sheet.w || 12,
    sh = +T.sheet.h || 12,
    g = +T.g || 0,
    O = [+T.ox || 0, +T.oy || 0],
    bb = bboxOf(region),
    px = sw + g,
    py = sh + g;
  if ((((bb.x1 - bb.x0) / px) * (bb.y1 - bb.y0)) / py > 20000) return 0;
  let n = 0;
  const i0 = Math.floor((bb.x0 - O[0]) / px) - 1,
    i1 = Math.ceil((bb.x1 - O[0]) / px) + 1,
    j0 = Math.floor((bb.y0 - O[1]) / py) - 1,
    j1 = Math.ceil((bb.y1 - O[1]) / py) + 1;
  for (let i = i0; i <= i1; i++)
    for (let j = j0; j <= j1; j++) {
      const r = rectPoly(O[0] + i * px, O[1] + j * py, sw, sh);
      if (polyArea(clipConvex(region, r)) > 0.5) n++;
    }
  return n;
}

/* ================= surface geometry ================= */
function geom(s) {
  const sw = edgeProf(s).vis,
    outer = outerPoly(s);
  let region = outer;
  if (isShaped(s)) {
    const tr = s.trim;
    const l = tr.l ? sw : 0,
      r = tr.r ? sw : 0,
      tp = tr.t ? sw : 0,
      b = tr.b && !isUneven(s) && !isTub(s) ? sw : 0;
    region = wallPoly(s, l, r, tp, b);
  } else if (s.shape === "rect") {
    const tr = s.trim;
    const l = tr.l ? sw : 0,
      r = tr.r ? sw : 0,
      b = tr.b ? sw : 0,
      tp = tr.t ? sw : 0;
    region = rectPoly(l, b, s.w - l - r, s.h - b - tp);
  }
  const holes = [],
    niches = [];
  for (const o of s.openings) {
    if ((OPT[o.type] || {}).nohole) continue;
    let poly;
    if (o.shape === "circle") poly = circlePoly(o.x, o.y, Math.max(0.05, (+o.dia || 1) / 2));
    else {
      const e = o.trim && TRIMMABLE[o.type] ? sw : 0;
      poly = rectPoly(o.x - e, o.y - e, o.w + 2 * e, o.h + 2 * e);
    }
    holes.push({ poly, type: o.type, o });
    if (o.type === "niche") niches.push(o);
  }
  if (s.type === "pan" && s.drain.type === "linear") {
    const d = s.drain;
    holes.push({ poly: rectPoly(d.x, d.y, d.len, d.wid), type: "drain" });
  }
  return { outer, region, holes, niches, bb: bboxOf(outer), rb: bboxOf(region) };
}

/* ================= linking ================= */
const isLinked = (s) => s.type === "wall" && s.link !== false && P.link && P.link.mode !== "none";
const linkedWalls = () => P.surfaces.filter(isLinked);
const wallW = (s) => {
  const b = bboxOf(outerPoly(s));
  return b.x1 - b.x0;
};
function ux(s) {
  let x = 0;
  for (const w of P.surfaces) {
    if (w === s) return x;
    if (isLinked(w)) x += wallW(w);
  }
  return x;
}
function effT(s) {
  const r = Object.assign({}, s.tile);
  if (isZLinked(s)) {
    const ps = s.pos || { x: 0, y: 0 };
    r.ox = P.flink.ox - (+ps.x || 0);
    r.oy = P.flink.oy - (+ps.y || 0);
    return r;
  }
  if (isLinked(s)) {
    r.oy = P.link.oy - (+s.base || 0);
    if (P.link.mode === "wrap") r.ox = P.link.ox - ux(s);
  }
  return r;
}
function setO(s, ox, oy) {
  if (isZLinked(s)) {
    const ps = s.pos || { x: 0, y: 0 };
    P.flink.ox = ox + (+ps.x || 0);
    P.flink.oy = oy + (+ps.y || 0);
    return;
  }
  if (isLinked(s)) {
    P.link.oy = oy + (+s.base || 0);
    if (P.link.mode === "wrap") P.link.ox = ox + ux(s);
    else s.tile.ox = ox;
  } else {
    s.tile.ox = ox;
    s.tile.oy = oy;
  }
}

function prep(s) {
  const T = effT(s),
    a = angOf(T),
    O = [+T.ox || 0, +T.oy || 0],
    G = geom(s);
  const toL = a ? (p) => rotP(p, O, -a) : (p) => p,
    toW = a ? (p) => rotP(p, O, a) : (p) => p;
  const regionL = G.region.map(toL);
  const holes = G.holes.map((h) => {
    const L = h.poly.map(toL);
    return { L, P: clipConvex(regionL, L), bb: bboxOf(L), type: h.type, o: h.o };
  });
  let bot = null;
  if (isUneven(s) && !a && T.shape === "rect") {
    bot = (x) => botY(s, x);
    bot.mid = s.uneven.mOn ? s.w / 2 : null;
  }
  return { T, a, O, G, toL, toW, regionL, holes, bot };
}

function compute(s) {
  const X = prep(s),
    { T, G } = X;
  const main = pieces(X.regionL, X.holes, T, false, X.bot);
  const empty = {
    ...X,
    err: true,
    main: [],
    nich: [],
    all: [],
    strips: [],
    area: 0,
    full: 0,
    cuts: 0,
    need: 0,
    order: 0,
    boxes: 0,
    list: [],
    minc: 1e9,
    lf: 0,
    bad: 0,
    warn: 0,
    nb: {},
    drill: [],
    sheets: 0,
  };
  if (!main) {
    // too many small tiles (big mosaic area): lay it out by sheets instead
    if (T.sheet && T.sheet.on && !s._sheetLvl) {
      const s2 = Object.assign({}, s, {
        _sheetLvl: true,
        tile: Object.assign({}, s.tile, {
          w: +T.sheet.w || 12,
          h: +T.sheet.h || 12,
          shape: "rect",
          pattern: "grid",
          rot: false,
          sheet: { on: false, w: 12, h: 12 },
        }),
      });
      const R2 = compute(s2);
      if (!R2.err) {
        R2.sheetLevel = true;
        R2.sheets = R2.need;
        R2.nb = { [tileDesc(T)]: R2.need };
        return R2;
      }
    }
    empty.heat = heatPlan(s, empty);
    return empty;
  }
  let nich = [],
    nichOwn = [];
  const nicheCalcs = G.niches.map((n) => nicheCalc(s, n, T, X));
  nicheCalcs.forEach((nc) => {
    if (nc.N.own) nichOwn.push({ T: nc.N.Tb, pieces: nc.backP });
    else nich = nich.concat(nc.backP);
  });
  const all = main.concat(nich, ...nichOwn.map((q) => q.pieces));
  const shOn = T.sheet && T.sheet.on;
  all.forEach((p) => {
    p.c = cls(p);
    if (shOn && p.c === "bad" && Math.min(p.cutX ? p.cw / p.lw : 1, p.cutY ? p.ch / p.lh : 1) >= 0.25)
      p.c = "warn";
  });
  const strips = [];
  nicheCalcs.forEach((nc) => {
    if (+nc.o.d > 0) strips.push(...nc.strips);
  });
  if (s.type === "pan" && s.curb.on) {
    const c = s.curb;
    strips.push(mkStrip(t("curbTop"), c.len, c.w, 1, T));
    strips.push(mkStrip(t("curbFace"), c.len, c.h, 2, T));
  }
  const area =
    polyArea(G.region) -
    G.holes.reduce((a, h) => a + polyArea(clipConvex(G.region, h.poly)), 0) +
    G.niches.reduce((a, n) => a + n.w * n.h, 0) +
    strips.reduce((a, x) => a + x.area, 0);
  const full = all.filter((p) => p.full).length,
    cuts = all.length - full;
  const sheet = T.sheet && T.sheet.on;
  let nb,
    sheets = 0;
  if (sheet) {
    const sa = (+T.sheet.w || 12) * (+T.sheet.h || 12);
    sheets = countSheets(X.regionL, T);
    nicheCalcs.forEach((nc) => {
      if (!nc.N.own)
        nc.N.comps.forEach(([x, y, w, h]) => (sheets += countSheets(rectPoly(x, y, w, h).map(X.toL), T)));
    });
    sheets += Math.ceil((strips.reduce((a, x) => a + x.area, 0) / sa) * 1.2);
    nb = { [tileDesc(T)]: sheets };
  } else {
    nb = needBy(all, T);
    const key =
      T.shape === "rect" ? fmtIn(Math.min(+T.w, +T.h)) + "×" + fmtIn(Math.max(+T.w, +T.h)) : tileDesc(T);
    strips.forEach((x) => {
      if (x.tiles) nb[x.key || key] = (nb[x.key || key] || 0) + x.tiles;
    });
  }
  const need = Object.values(nb).reduce((a, b) => a + b, 0);
  const order = Math.ceil(need * (1 + (+P.waste || 0) / 100));
  const unitSq = sheet ? (+T.sheet.w * +T.sheet.h) / 144 : (+T.w * (+T.h || +T.w)) / 144;
  const perBox =
      T.sqftBox > 0 && unitSq > 0 && patOf(T) !== "pinwheel"
        ? Math.max(1, Math.round(T.sqftBox / unitSq))
        : 0,
    boxes = perBox ? Math.ceil(order / perBox) : 0;
  const gl = {};
  if (T.shape === "rect" && !sheet)
    all
      .filter((p) => !p.full)
      .forEach((p) => {
        let k =
          p.taper || p.taperW
            ? pieceSize(p) + " ⟋"
            : (p.notch
                ? p.arc
                  ? "◠ "
                  : p.cutX || p.cutY || (p.ax && !p.hl)
                    ? "L "
                    : p.hl
                      ? "⊙ "
                      : "◿ "
                : "") +
              fmtIn(p.cw) +
              " × " +
              fmtIn(p.ch);
        if (p.hl) k += " + " + [...new Set(p.hl)].map((x) => t(x)).join(", ");
        const e = gl[k] || (gl[k] = { k, n: 0, c: p.c, cw: p.cw, ch: p.ch });
        e.n++;
        if (RANK[p.c] > RANK[e.c]) e.c = p.c;
      });
  const list = Object.values(gl).sort((a, b) => RANK[b.c] - RANK[a.c] || a.cw * a.ch - b.cw * b.ch);
  let minc = 1e9;
  all.forEach((p) => {
    if (p.full) return;
    if (p.k === "r") {
      if (p.cutX) minc = Math.min(minc, p.cw);
      if (p.cutY) minc = Math.min(minc, p.ch);
    }
  });
  let lf = 0;
  if (s.shape === "rect") {
    const q = s.trim;
    lf += (q.l ? s.h : 0) + (q.r ? s.h : 0) + (q.t ? s.w : 0) + (q.b ? s.w : 0);
  }
  s.openings.forEach((o) => {
    if (o.trim && TRIMMABLE[o.type] && o.type !== "niche") lf += 2 * (o.w + o.h);
  });
  if (s.type === "pan" && s.curb.on && s.curb.trim) lf += 2 * s.curb.len;
  lf += +s.extraLF || 0;
  const R = {
    ...X,
    err: false,
    main,
    nich,
    nichOwn,
    nicheCalc: nicheCalcs,
    nicheItems: [].concat(...nicheCalcs.map((nc) => nc.items)),
    all,
    strips,
    area,
    full,
    cuts,
    nb,
    need,
    order,
    boxes,
    perBox,
    list,
    minc,
    lf,
    sheets,
    bad: all.filter((p) => p.c === "bad" && p.k === "r").length,
    warn: all.filter((p) => p.c === "warn").length,
  };
  R.drill = drillList(s, R);
  R.ledger = ledgerOf(s, R);
  markArc(s, R);
  numberPieces(R);
  R.heat = heatPlan(s, R);
  const ep = edgeProf(s);
  R.profs = {};
  if (R.lf > 0) R.profs[ep.key] = R.lf;
  nicheCalcs.forEach((nc) => {
    if (nc.profLF) R.profs[nc.profKey] = (R.profs[nc.profKey] || 0) + nc.profLF;
    if (nc.shelfProf) R.profs[nc.shelfProf.key] = (R.profs[nc.shelfProf.key] || 0) + nc.shelfProf.lf;
  });
  (s.trans || []).forEach((tr) => {
    const c = transCalc(s, tr);
    R.profs[c.key] = (R.profs[c.key] || 0) + (+tr.len || 0);
  });
  R.stack = stackOf(s);
  return R;
}
function markArc(s, R) {
  const A = tubArc(s);
  if (!A) return;
  R.all.forEach((p) => {
    if (!p.C) return;
    const hit = p.C.some((q) => {
      const w = R.toW(q),
        dx = w[0] - A.c[0],
        dy = w[1] - A.c[1];
      if (Math.abs(Math.hypot(dx, dy) - A.r) > 0.03) return false;
      const an = (Math.atan2(dy, dx) * 180) / Math.PI;
      return A.side === "l" ? an > 3 && an < 87 : an > 93 && an < 177;
    });
    if (hit) {
      p.arc = A.r;
      if (p.full) {
        p.full = false;
        p.c = "cut";
      }
    }
  });
}
function numberPieces(R) {
  const ys = [...new Set(R.main.map((p) => Math.round(p.y0 * 100)))].sort((a, b) => a - b);
  const rowOf = (p) => ys.indexOf(Math.round(p.y0 * 100)) + 1;
  const ord = (a) =>
    a.filter((p) => !p.full).sort((a, b) => Math.round(a.y0 * 100) - Math.round(b.y0 * 100) || a.x0 - b.x0);
  let n = 0;
  ord(R.main).forEach((p) => {
    p.no = ++n;
    p.row = rowOf(p);
  });
  ord(R.nich).forEach((p) => {
    p.no = ++n;
    p.row = "N";
  });
  (R.nichOwn || []).forEach((q) =>
    ord(q.pieces).forEach((p) => {
      p.no = ++n;
      p.row = "N";
    }),
  );
  R.rowsOK = !R.a && ["grid", "offset"].includes(patOf(R.T)) && R.T.shape === "rect";
  R.rowFull = {};
  R.main.forEach((p) => {
    if (p.full) {
      const r = rowOf(p);
      R.rowFull[r] = (R.rowFull[r] || 0) + 1;
    }
  });
}
function pieceSize(p) {
  const w = p.taperW ? p.taperW.map(fmtIn).join("→") : fmtIn(p.cw),
    h = p.taper ? p.taper.map(fmtIn).join("→") : fmtIn(p.ch);
  return (p.k === "p" ? "≈ " : "") + w + " × " + h;
}
function pieceNote(p) {
  const n = [];
  if (p.arc) n.push(t("noteArc") + " R" + fmtIn(p.arc) + "″");
  if (p.taperW) n.push(t("noteTaperW"));
  if (p.taper) n.push(t("noteTaper"));
  else if (p.taperW);
  else if (p.arc);
  else if (p.notch && (p.cutX || p.cutY || (p.ax && !p.hl))) n.push(t("noteL"));
  else if (p.notch && !p.hl) n.push(t("noteAng"));
  if (p.hl) n.push(...[...new Set(p.hl)].map((x) => t(x)));
  if (p.c === "bad") n.push("⚠ " + t("legBad"));
  return n.join(", ");
}
function cutSheet(R) {
  const groups = [];
  if (R.rowsOK) {
    const by = {};
    R.all
      .filter((p) => !p.full && !p.niche)
      .forEach((p) => {
        (by[p.row] = by[p.row] || []).push(p);
      });
    const rows = Object.keys(by)
      .map(Number)
      .sort((a, b) => a - b);
    rows.forEach((r) =>
      groups.push({
        label: `${t("row")} ${r}${r === 1 ? " " + t("rowBottom") : ""}`,
        full: R.rowFull[r] || 0,
        items: by[r],
      }),
    );
  } else groups.push({ label: t("cutList"), items: R.all.filter((p) => !p.full && !p.niche) });
  const ni = R.all.filter((p) => !p.full && p.niche);
  if (ni.length) groups.push({ label: t("nicheBack"), items: ni });
  groups.forEach((g) => g.items.sort((a, b) => a.no - b.no));
  return groups;
}
function ledgerOf(s, R) {
  if (!(isUneven(s) || isTub(s)) || R.a || R.T.shape !== "rect") return null;
  const T = R.T,
    pat = patOf(T);
  if (!["grid", "offset", "voffset"].includes(pat)) return null;
  const { th } = rdims(T),
    py = th + (+T.g || 0),
    u = s.uneven;
  let hi, lo;
  if (isTub(s)) {
    const D = tubDims(s);
    hi = Math.max(D.hF, D.hB);
    lo = Math.min(D.hF, D.hB);
  } else {
    hi = Math.max(+u.l || 0, +u.r || 0, u.mOn ? +u.m || 0 : 0);
    lo = Math.min(+u.l || 0, +u.r || 0, u.mOn ? +u.m || 0 : 0);
  }
  if (pat === "voffset") return { hi, lo, y: null, tub: isTub(s) };
  const j = Math.ceil((hi + (+P.edgeGap || 0) - T.oy) / py - 1e-9);
  return { hi, lo, y: T.oy + j * py, tub: isTub(s) };
}

function drillList(s, R) {
  const out = [];
  if (R.T.shape !== "rect" || (R.T.sheet && R.T.sheet.on)) return out;
  for (const o of s.openings) {
    if (!(o.shape === "circle" || o.type === "outlet" || o.type === "duct")) continue;
    const c = o.shape === "circle" ? [o.x, o.y] : [o.x + o.w / 2, o.y + o.h / 2],
      cl = R.toL(c);
    const p = R.main.find(
      (p) => p.k === "r" && cl[0] >= p.x0 && cl[0] <= p.x0 + p.lw && cl[1] >= p.y0 && cl[1] <= p.y0 + p.lh,
    );
    if (!p) {
      out.push({ o, joint: true });
      continue;
    }
    const h = R.holes.find((h) => h.o === o);
    const hb = h ? h.bb : { x0: cl[0], x1: cl[0], y0: cl[1], y1: cl[1] };
    const cross =
      hb.x0 < p.x0 - EPS || hb.x1 > p.x0 + p.lw + EPS || hb.y0 < p.y0 - EPS || hb.y1 > p.y0 + p.lh + EPS;
    out.push({ o, p, dx: cl[0] - p.b.x0, dy: cl[1] - p.b.y0, cross });
  }
  return out;
}

/* ================= layout helpers ================= */
function periodOf(T) {
  if (+T.ang) return null;
  const pat = patOf(T),
    { tw, th } = rdims(T),
    g = +T.g || 0,
    px = tw + g,
    py = th + g;
  if (pat === "grid") return { x: px, y: py };
  if (pat === "hex") {
    if (T.rot) return null;
    const s = +T.w / Math.sqrt(3);
    return { x: +T.w + g, y: 2 * (1.5 * s + (g * Math.sqrt(3)) / 2) };
  }
  if (pat === "offset" || pat === "voffset") {
    const f = +T.off;
    let n = 0;
    for (let k = 1; k <= 12; k++) {
      if (Math.abs(k * f - Math.round(k * f)) < 1e-6) {
        n = k;
        break;
      }
    }
    if (T.offDir === "a" && f) n = 2;
    if (T.shape === "penny") return null;
    return pat === "offset" ? { x: px, y: n ? n * py : null } : { x: n ? n * px : null, y: py };
  }
  return null;
}
function normalizeS(s) {
  const T = effT(s),
    per = periodOf(T);
  if (!per) return;
  const G = geom(s);
  let x = T.ox,
    y = T.oy;
  if (per.x) x = Math.round((G.rb.x0 + mod(T.ox - G.rb.x0, per.x)) * 64) / 64;
  if (per.y) y = Math.round((G.rb.y0 + mod(T.oy - G.rb.y0, per.y)) * 64) / 64;
  setO(s, x, y);
}
function spanOf(T) {
  const pat = patOf(T),
    { tw, th } = rdims(T),
    g = +T.g || 0,
    L = Math.max(tw, th),
    W = Math.min(tw, th);
  let r;
  if (pat === "herring") r = { x: L + W + 2 * g, y: L + W + 2 * g };
  else if (pat === "basket") r = { x: 2 * (L + g), y: 2 * (L + g) };
  else if (pat === "pinwheel") r = { x: +T.w + +T.w2 + 2 * g, y: +T.w + +T.w2 + 2 * g };
  else if (pat === "chevron") r = { x: 2 * (+T.w + g), y: +T.h + g + +T.w };
  else if (pat === "hex") {
    const s = +T.w / Math.sqrt(3);
    r = { x: +T.w + g, y: 3 * s + 2 * g };
  } else {
    const per = periodOf(Object.assign({}, T, { ang: 0 })) || { x: tw + g, y: th + g };
    r = { x: per.x || 2 * (tw + g), y: per.y || 4 * (th + g) };
  }
  if (+T.ang) {
    const m = Math.max(r.x, r.y);
    r = { x: m, y: m };
  }
  return r;
}
function symScore(pc, ax, rb) {
  let lo = 1e9,
    hi = 1e9;
  for (const p of pc) {
    if (p.k !== "r") continue;
    if (ax === "x") {
      if (p.b.x0 <= rb.x0 + EPS && p.b.x0 > p.x0 + EPS) lo = Math.min(lo, p.cw);
      if (p.b.x1 >= rb.x1 - EPS && p.b.x1 < p.x0 + p.lw - EPS) hi = Math.min(hi, p.cw);
    } else {
      if (p.b.y0 <= rb.y0 + EPS && p.b.y0 > p.y0 + EPS) lo = Math.min(lo, p.ch);
      if (p.b.y1 >= rb.y1 - EPS && p.b.y1 < p.y0 + p.lh - EPS) hi = Math.min(hi, p.ch);
    }
  }
  return lo < 1e8 && hi < 1e8 ? Math.abs(lo - hi) : 0;
}
function scoreS(w, ax) {
  const X = prep(w);
  const pc = pieces(X.regionL, X.holes, X.T, false, X.bot);
  if (!pc) return { mn: 0, sym: 0, n: 0 };
  let mn = 1e4;
  const rot = !!X.a;
  for (const p of pc) {
    if (p.full) continue;
    if (p.k !== "r") {
      mn = Math.min(mn, Math.sqrt(p.a));
      continue;
    }
    if (p.cutX && (rot || ax === "x")) mn = Math.min(mn, p.cw);
    if (p.cutY && (rot || ax === "y")) mn = Math.min(mn, p.ch);
  }
  return { mn, sym: symScore(pc, ax, bboxOf(X.regionL)), n: pc.length };
}
function autoLayout(s) {
  const zl = isZLinked(s),
    linked = isLinked(s) || zl,
    wrap = (isLinked(s) && P.link.mode === "wrap") || zl,
    T0 = effT(s);
  if (T0.sheet && T0.sheet.on && T0.shape !== "rect") return;
  const sp = spanOf(T0),
    n0 = scoreS(s, "x").n;
  for (let it = 0; it < 2; it++)
    for (const ax of ["x", "y"]) {
      const grp = zl
        ? P.surfaces.filter(isZLinked)
        : (ax === "y" && linked) || (ax === "x" && wrap)
          ? linkedWalls()
          : [s];
      const T = effT(s),
        start = ax === "x" ? T.ox : T.oy,
        per = ax === "x" ? sp.x : sp.y;
      let N = Math.min(240, Math.max(8, Math.round(per / 0.125)));
      if (n0 * grp.length > 500) N = Math.min(N, 40);
      if (n0 * grp.length > 3000) N = Math.min(N, 12);
      let best = null;
      for (let k = 0; k < N; k++) {
        const v = start + (per * k) / N;
        setO(s, ax === "x" ? v : T.ox, ax === "y" ? v : T.oy);
        let mn = 1e4,
          sym = 0;
        for (const w of grp) {
          const r = scoreS(w, ax);
          mn = Math.min(mn, r.mn);
          sym += r.sym;
        }
        const sc = Math.round(mn * 16) * 1000 - sym;
        if (!best || sc > best.s + 1e-9) best = { s: sc, v };
      }
      setO(s, ax === "x" ? best.v : T.ox, ax === "y" ? best.v : T.oy);
    }
  normalizeS(s);
}
function centerOn(s, x, y, joint) {
  const T = effT(s);
  let ox, oy;
  if (T.shape === "hex") {
    ox = x;
    oy = y;
    if (joint) {
      const sd = +T.w / Math.sqrt(3);
      oy = y + sd + +T.g / 2;
    }
  } else {
    const { tw, th } = rdims(T);
    if (joint) {
      ox = x + T.g / 2;
      oy = y + T.g / 2;
    } else {
      ox = x - tw / 2;
      oy = y - th / 2;
    }
  }
  setO(s, ox, oy);
  normalizeS(s);
}

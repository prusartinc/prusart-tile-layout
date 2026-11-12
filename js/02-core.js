"use strict";
/* ================= utils ================= */
const $ = (s) => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = (s) =>
  String(s == null ? "" : s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const mod = (a, n) => ((a % n) + n) % n;
const EPS = 0.01;
function parseLen(s) {
  if (typeof s === "number") return s;
  s = String(s).trim().replace(/[″"]/g, "").replace(/,/g, ".");
  if (!s) return NaN;
  let ft = 0;
  const m1 = s.match(/^(\d+(?:\.\d+)?)\s*['′]\s*-?\s*(.*)$/);
  if (m1) {
    ft = parseFloat(m1[1]) * 12;
    s = m1[2].trim();
    if (!s) return ft;
  }
  const m = s.match(/^(\d+(?:\.\d+)?)?(?:\s+|\s*-\s*)?(?:(\d+)\s*\/\s*(\d+))?$/);
  if (!m || (!m[1] && !m[2])) return NaN;
  let v = m[1] ? parseFloat(m[1]) : 0;
  if (m[2]) {
    const d = +m[3];
    if (!d) return NaN;
    v += +m[2] / d;
  }
  return ft + v;
}
function fmtIn(x) {
  if (!isFinite(x)) return "";
  const neg = x < 0;
  x = Math.abs(x);
  const n = Math.round(x * 16);
  const w = Math.floor(n / 16);
  let f = n % 16,
    d = 16;
  if (!f) return (neg ? "-" : "") + w;
  while (f % 2 === 0) {
    f /= 2;
    d /= 2;
  }
  return (neg ? "-" : "") + (w ? w + " " : "") + f + "/" + d;
}
const fmt = (x) => fmtIn(x) + "″";
const sq = (a) => (a / 144).toFixed(1);

/* ================= geometry ================= */
const rectPoly = (x, y, w, h) => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];
function sArea(p) {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[i],
      r = p[(i + 1) % p.length];
    a += q[0] * r[1] - r[0] * q[1];
  }
  return a / 2;
}
const polyArea = (p) => (p.length < 3 ? 0 : Math.abs(sArea(p)));
function bboxOf(p) {
  let x0 = 1e9,
    y0 = 1e9,
    x1 = -1e9,
    y1 = -1e9;
  for (const q of p) {
    if (q[0] < x0) x0 = q[0];
    if (q[0] > x1) x1 = q[0];
    if (q[1] < y0) y0 = q[1];
    if (q[1] > y1) y1 = q[1];
  }
  return { x0, y0, x1, y1 };
}
function circlePoly(cx, cy, r, n = 32) {
  const o = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return o;
}
function rotP(p, o, a) {
  const c = Math.cos(a),
    s = Math.sin(a),
    dx = p[0] - o[0],
    dy = p[1] - o[1];
  return [o[0] + c * dx - s * dy, o[1] + s * dx + c * dy];
}
function clipConvex(subj, clip) {
  let out = subj;
  for (let i = 0; i < clip.length && out.length; i++) {
    const A = clip[i],
      B = clip[(i + 1) % clip.length],
      ex = B[0] - A[0],
      ey = B[1] - A[1];
    const side = (q) => ex * (q[1] - A[1]) - ey * (q[0] - A[0]);
    const inp = out;
    out = [];
    for (let k = 0; k < inp.length; k++) {
      const a = inp[k],
        b = inp[(k + 1) % inp.length],
        sa = side(a),
        sb = side(b);
      if (sa >= -1e-9) {
        out.push(a);
        if (sb < -1e-9) {
          const u = sa / (sa - sb);
          out.push([a[0] + u * (b[0] - a[0]), a[1] + u * (b[1] - a[1])]);
        }
      } else if (sb >= -1e-9) {
        const u = sa / (sa - sb);
        out.push([a[0] + u * (b[0] - a[0]), a[1] + u * (b[1] - a[1])]);
      }
    }
  }
  return out;
}
function pip(p, x, y) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const a = p[i],
      b = p[j];
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
function parsePts(str) {
  return String(str || "")
    .split(/[;\n]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => {
      const m = x.split(",");
      return [parseLen(m[0]), parseLen(m[1] || "")];
    })
    .filter((q) => isFinite(q[0]) && isFinite(q[1]));
}
const isTub = (s) => s.type === "wall" && s.shape === "rect" && s.tub && s.tub.on;
const isUneven = (s) => s.type === "wall" && s.shape === "rect" && s.uneven && s.uneven.on && !isTub(s);
const isZLinked = (s) => s.type !== "wall" && !!s.zlink;
const isPlumb = (s) => s.type === "wall" && s.shape === "rect" && s.plumb && s.plumb.on;
const isShaped = (s) => isUneven(s) || isPlumb(s) || isTub(s);
function tubDims(s) {
  const tb = s.tub,
    W = s.w,
    d = Math.max(0, Math.min(+tb.d || 0, W)),
    h = +tb.h || 0,
    r = Math.max(0, Math.min(+tb.r || 0, d * 0.9, h * 0.9));
  return { W, d, xs: W - d, h, r, hF: h + (+tb.rF || 0), hB: h + (+tb.rB || 0) };
}
function tubChain(s) {
  const { W, xs, r, hF, hB } = tubDims(s);
  const pts = [[0, 0]];
  if (xs > 0.01) pts.push([xs, 0]);
  if (r > 0.05) {
    const cx = xs + r,
      cy = hF - r;
    for (let k = 0; k <= 10; k++) {
      const th = Math.PI - (k * (Math.PI / 2)) / 10;
      pts.push([cx + r * Math.cos(th), cy + r * Math.sin(th)]);
    }
  } else pts.push([xs, hF]);
  pts.push([W, hB]);
  const out = s.tub.side === "l" ? pts.map((q) => [W - q[0], q[1]]).reverse() : pts;
  return out.filter((q, i) => i === 0 || Math.hypot(q[0] - out[i - 1][0], q[1] - out[i - 1][1]) > 1e-6);
}
function tubArc(s) {
  if (!isTub(s)) return null;
  const { W, xs, r, hF } = tubDims(s);
  if (r <= 0.05) return null;
  const c = [xs + r, hF - r];
  return { c: s.tub.side === "l" ? [W - c[0], c[1]] : c, r, side: s.tub.side };
}
function clipChainX(ch, x0, x1) {
  const out = [];
  for (let i = 0; i < ch.length; i++) {
    const p = ch[i];
    if (p[0] >= x0 - 1e-9 && p[0] <= x1 + 1e-9) out.push(p);
    if (i < ch.length - 1) {
      const q = ch[i + 1];
      const xs2 = [x0, x1].filter((xc) => (p[0] - xc) * (q[0] - xc) < 0);
      if (q[0] < p[0]) xs2.reverse();
      for (const xc of xs2) {
        const u = (xc - p[0]) / (q[0] - p[0]);
        out.push([xc, p[1] + u * (q[1] - p[1])]);
      }
    }
  }
  return out;
}
function wallPoly(s, inL, inR, inT, inB) {
  const W = s.w,
    H = s.h,
    lt = isPlumb(s) ? +s.plumb.l || 0 : 0,
    rt = isPlumb(s) ? +s.plumb.r || 0 : 0;
  const bot = isTub(s)
    ? clipChainX(tubChain(s), inL, W - inR)
    : isUneven(s)
      ? botPts(s, inL, W - inR)
      : [
          [inL, inB],
          [W - inR, inB],
        ];
  return bot.concat([
    [W - rt - inR, H - inT],
    [lt + inL, H - inT],
  ]);
}
function botY(s, x) {
  const u = s.uneven,
    W = s.w,
    l = +u.l || 0,
    r = +u.r || 0;
  if (u.mOn) {
    const m = +u.m || 0;
    return x <= W / 2 ? l + (m - l) * (x / (W / 2)) : m + (r - m) * ((x - W / 2) / (W / 2));
  }
  return l + (r - l) * (x / W);
}
function botPts(s, x0, x1) {
  const pts = [[x0, botY(s, x0)]];
  if (s.uneven.mOn && x0 < s.w / 2 && x1 > s.w / 2) pts.push([s.w / 2, botY(s, s.w / 2)]);
  pts.push([x1, botY(s, x1)]);
  return pts;
}
function walkPoly(s) {
  const segs = s.segs || [];
  let x = 0,
    y = 0,
    h = 0;
  const raw = [[0, 0]];
  segs.forEach((g, i) => {
    const L = +g.l || 0;
    x += L * Math.cos(h);
    y += L * Math.sin(h);
    raw.push([x, y]);
    h += ((+g.a || 0) * Math.PI) / 180;
  });
  const gap = Math.hypot(x, y);
  let pts = raw.slice(0, -1);
  if (gap > 0.05) pts = raw.slice();
  const edges = [];
  for (let i = 0; i < segs.length; i++) edges.push([raw[i], raw[i + 1]]);
  const mnx = Math.min(...pts.map((q) => q[0])),
    mny = Math.min(...pts.map((q) => q[1]));
  const sh = (q) => [q[0] - mnx, q[1] - mny];
  const P2 = pts.map(sh);
  return { pts: P2, edges: edges.map((e) => [sh(e[0]), sh(e[1])]), gap, ccw: sArea(P2) > 0 };
}
function polyToSegs(pts) {
  let p = pts.slice();
  if (sArea(p) < 0) p = p.reverse();
  const n = p.length,
    out = [];
  for (let i = 0; i < n; i++) {
    const a = p[i],
      b = p[(i + 1) % n],
      c = p[(i + 2) % n];
    const h1 = Math.atan2(b[1] - a[1], b[0] - a[0]),
      h2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    let d = ((h2 - h1) * 180) / Math.PI;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    out.push({ l: Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) * 16) / 16, a: Math.round(d * 10) / 10 });
  }
  const i0 = p.reduce(
    (bi, q, i) => (q[1] < p[bi][1] - 1e-6 || (Math.abs(q[1] - p[bi][1]) < 1e-6 && q[0] < p[bi][0]) ? i : bi),
    0,
  );
  return out.slice(i0).concat(out.slice(0, i0));
}
function outerPoly(s) {
  if (isShaped(s)) return wallPoly(s, 0, 0, 0, 0);
  if (s.shape === "L") {
    const W = s.w,
      H = s.h,
      a = Math.max(0.5, Math.min(s.Lw, W - 0.5)),
      b = Math.max(0.5, Math.min(s.Lh, H - 0.5));
    let p = [
      [0, 0],
      [W, 0],
      [W, H - b],
      [W - a, H - b],
      [W - a, H],
      [0, H],
    ];
    const c = s.Lc || "tr";
    if (c === "tl" || c === "bl") p = p.map((q) => [W - q[0], q[1]]);
    if (c === "br" || c === "bl") p = p.map((q) => [q[0], H - q[1]]);
    return p;
  }
  if (s.shape === "walk") {
    const wk = walkPoly(s);
    if (wk.pts.length >= 3 && polyArea(wk.pts) > 1) return wk.pts;
  }
  if (s.shape === "custom") {
    const p = parsePts(s.pts);
    if (p.length >= 3 && polyArea(p) > 1) return p;
  }
  return rectPoly(0, 0, s.w, s.h);
}

/* ================= openings ================= */
const OPT = {
  niche: { shape: "rect", w: 24, h: 12, d: 3.5, trim: true, on: ["wall"] },
  window: { shape: "rect", w: 24, h: 24, trim: true, on: ["wall"] },
  outlet: { shape: "rect", w: 2.25, h: 3.75, on: ["wall", "floor"] },
  valve: { shape: "circle", dia: 3, on: ["wall"] },
  pipe: { shape: "circle", dia: 1.125, on: ["wall", "floor"] },
  toilet: { shape: "circle", dia: 5, on: ["floor"] },
  duct: { shape: "rect", w: 4, h: 10, on: ["floor", "wall"] },
  cutout: { shape: "rect", w: 12, h: 12, trim: false, on: ["wall", "floor", "pan"] },
  round: { shape: "circle", dia: 4, on: ["wall", "floor", "pan"] },
  noheat: { shape: "rect", w: 36, h: 22, on: ["floor"], nohole: true },
  warm: { shape: "rect", w: 36, h: 24, on: ["floor"], nohole: true },
};
const TRIMMABLE = { niche: 1, window: 1, cutout: 1 };

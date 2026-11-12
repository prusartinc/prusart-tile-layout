"use strict";
/* ================= SVG ================= */
const PAL_L = {
    bg: "#fbfaf8",
    grout: "#9a958c",
    ink: "#141414",
    dim: "#4a4740",
    blue: "#1d5fa8",
    lab: "#5a4129",
  },
  PAL_D = {
    bg: "#121212",
    grout: "#4a4741",
    ink: "#ece9e2",
    dim: "#c9c5bb",
    blue: "#8dbcf0",
    lab: "#d9c9a6",
  };
let PAL = PAL_L,
  THEME = "auto";
const LOGO =
  "data:image/png;base64,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";
let LOGOIMG = null;
(() => {
  const im = new Image();
  im.onload = () => {
    LOGOIMG = im;
  };
  im.src = LOGO;
})();
function applyTheme() {
  const dark =
    THEME === "dark" ||
    (THEME === "auto" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  PAL = dark ? PAL_D : PAL_L;
}
try {
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (THEME === "auto") {
      applyTheme();
      draw();
    }
  });
} catch (e) {}
function themePicker() {
  return `<p style="margin:0 0 4px"><b>${t("theme")}</b></p><div class="seg3">${["light", "dark", "auto"].map((k) => `<button data-act="theme:${k}" class="${THEME === k ? "on" : ""}">${t("th_" + k)}</button>`).join("")}</div>`;
}
const COL = { full: "#ece5d7", cut: "#c9def3", warn: "#f7cf96", bad: "#f19c96" };
const COL2 = { full: "#b8ac96", cut: "#97b5d6", warn: "#dfae6b", bad: "#d6766d" };
const FONT = "-apple-system,Segoe UI,Roboto,Arial,sans-serif";
const pd = (p) => "M" + p.map((q) => q[0].toFixed(3) + " " + (-q[1]).toFixed(3)).join("L") + "Z";
// tile photo texture: set by surfBody while drawing the surface's own tiles
let TEXON = false,
  TXID = null,
  TXT = null;
function tileSVG(p, T, px) {
  const alt = (T.checker && p.q) || (patOf(T) === "pinwheel" && p.q);
  let fill = (alt ? COL2 : COL)[p.c || "full"];
  if (TXID && T === TXT) {
    const land = (T.texAR || 1) >= 1;
    fill = `url(#${TXID}${p.lw >= p.lh === land ? "" : "r"})`;
  }
  const sw = px(0.5);
  if (p.k === "p") return `<path d="${pd(p.t.poly)}" fill="${fill}" stroke="#7c766c" stroke-width="${sw}"/>`;
  if (p.k === "c") {
    const r = Math.min(p.lw, p.lh) / 2;
    return `<circle cx="${(p.x0 + p.lw / 2).toFixed(3)}" cy="${(-(p.y0 + p.lh / 2)).toFixed(3)}" r="${r.toFixed(3)}" fill="${fill}" stroke="#7c766c" stroke-width="${sw}"/>`;
  }
  return `<rect x="${p.x0.toFixed(3)}" y="${(-(p.y0 + p.lh)).toFixed(3)}" width="${p.lw.toFixed(3)}" height="${p.lh.toFixed(3)}" fill="${fill}" stroke="#7c766c" stroke-width="${sw}"/>`;
}
function dimKey(s, k) {
  if (s.shape === "custom" || s.shape === "walk") return "";
  return `data-dim="${P.surfaces.indexOf(s)}:${k}" style="cursor:pointer" fill-opacity="1"`;
}
let LAYER = null;
const heatVis = (s) => LAYER === "wire";
const PREPCOL = { heat: "#f3c08a", mem: "#f6d48c", board: "#d6d6d6", ply: "#e2cfa6", none: "#ece8e0" };
const ftin = (x) => {
  const f = Math.floor(x / 12 + 1e-6),
    i = Math.round(x - f * 12);
  return i === 12 ? `${f + 1}′` : `${f}′${i ? i + "″" : ""}`;
};
function prepPoly(s, R) {
  const e = s.prep || {},
    l = +e.l || 0,
    r = +e.r || 0,
    b = +e.b || 0,
    tp = +e.t || 0;
  if (s.shape === "rect" && (l || r || b || tp)) {
    const bb = R.G.bb;
    const w = bb.x1 - bb.x0 - l - r,
      hh = bb.y1 - bb.y0 - b - tp;
    if (w > 1 && hh > 1) return rectPoly(bb.x0 + l, bb.y0 + b, w, hh);
  }
  return R.G.outer;
}
const boardOf = (s) => {
  const st = s.stack || {},
    u = underOf(st.under || "none"),
    u2 = underOf(st.under2 || "none");
  return u.k === "board" || u.k === "ply" ? u : u2.k === "board" || u2.k === "ply" ? u2 : null;
};
const bSizeOf = (s, u) => {
  const v = (s.stack || {}).bsize;
  if (v === "3x5" || v === "4x8") return v;
  const l = ((u.u || [])[0] || [])[1] || "";
  return l.includes("4×8") ? "4x8" : "3x5";
};
const pMod = (o, P) => {
  const m = (((+o || 0) % P) + P) % P;
  return m > 0.01 ? m - P : 0;
};
function prepDir(s, u, W, H) {
  const bd = (s.stack || {}).bdir || "auto";
  if (bd === "h") return true;
  if (bd === "v") return false;
  const j = s.type !== "wall" ? s.joist || "none" : "none";
  if (j !== "none" && (u.k === "board" || u.k === "ply")) return j === "v";
  return null;
}
function prepPlan(s, R, uo) {
  const O = prepPoly(s, R),
    bb = bboxOf(O),
    st = s.stack || {},
    PO = s.prepO || { x: 0, y: 0 };
  let u = uo || underOf(st.under || "none");
  if (!uo && s.type === "wall" && boardOf(s)) u = boardOf(s);
  if (u.k === "none") return null;
  const W = bb.x1 - bb.x0,
    H = bb.y1 - bb.y0,
    dd = prepDir(s, u, W, H),
    horiz = dd == null ? W >= H : dd;
  const inR = (x, y) => pip(O, x, y);
  const sheetOnly =
    u.k === "board" || u.k === "ply" || u.id === "ditraheatduo" || (u.u && u.u.every((q) => q[0] < 10));
  if (!sheetOnly) {
    const RW = 39,
      A0 = horiz ? bb.y0 : bb.x0,
      A1 = horiz ? bb.y1 : bb.x1,
      B0 = horiz ? bb.x0 : bb.y0,
      B1 = horiz ? bb.x1 : bb.y1,
      strips = [];
    for (let a0 = A0 + pMod(horiz ? PO.y : PO.x, RW); a0 < A1 - 0.5; a0 += RW) {
      const a2 = Math.min(A1, a0 + RW),
        a = Math.max(A0, a0);
      if (a2 - a < 0.25) continue;
      let mn = 1e9,
        mx = -1e9;
      for (const fa of [0.02, 0.5, 0.98]) {
        const av = a + (a2 - a) * fa;
        for (let b = B0 + 0.5; b < B1; b += 1) {
          if (horiz ? inR(b, av) : inR(av, b)) {
            mn = Math.min(mn, b - 0.5);
            mx = Math.max(mx, b + 0.5);
          }
        }
      }
      if (mx > mn) strips.push({ a, a2, b0: Math.max(B0, mn), b1: Math.min(B1, mx) });
    }
    const lf = strips.reduce((q, t) => q + (t.b1 - t.b0), 0),
      sfS = strips.reduce((q, t) => q + (t.b1 - t.b0) * RW, 0) / 144,
      roll = (u.u || []).filter((q) => q[0] >= 40).map((q) => q[0]);
    let rolls = null;
    if (roll.length) {
      const big = Math.max(...roll),
        fit = roll.filter((r) => r >= sfS * 1.05).sort((x, y) => x - y)[0];
      rolls = fit ? { n: 1, sf: fit } : { n: Math.ceil((sfS * 1.05) / big), sf: big };
    }
    return { kind: "roll", u, horiz, strips, lf, sfS, rolls, RW, O, bb };
  }
  const isB = u.k === "board" || u.k === "ply",
    bs = isB ? bSizeOf(s, u) : null,
    dims = isB ? (bs === "4x8" ? [96, 48] : [60, 36]) : [38.5, 31.5],
    stag = isB,
    [SL, SW] = dims;
  const lay = (hz) => {
    const sh = [];
    let row = 0;
    const oa = hz ? PO.y : PO.x,
      ob = hz ? PO.x : PO.y;
    for (let a = (hz ? bb.y0 : bb.x0) + pMod(oa, SW); a < (hz ? bb.y1 : bb.x1) - 0.5; a += SW, row++) {
      const span = hz ? bb.x1 - bb.x0 : bb.y1 - bb.y0,
        off = stag && row % 2 && span > SL + 0.5 ? -SL / 2 : 0;
      for (
        let b = (hz ? bb.x0 : bb.y0) + pMod(ob, SL) + off - (off ? SL : 0);
        b < (hz ? bb.x1 : bb.y1) - 0.5;
        b += SL
      ) {
        const ib0 = Math.max(b, hz ? bb.x0 : bb.y0),
          ib1 = Math.min(b + SL, hz ? bb.x1 : bb.y1),
          ia0 = Math.max(a, hz ? bb.y0 : bb.x0),
          ia1 = Math.min(a + SW, hz ? bb.y1 : bb.x1);
        if (ib1 - ib0 < 0.25 || ia1 - ia0 < 0.25) continue;
        let hit = false;
        for (let i = 0; i < 7 && !hit; i++)
          for (let j = 0; j < 7 && !hit; j++) {
            const pb = ib0 + ((ib1 - ib0) * (i + 0.5)) / 7,
              pa = ia0 + ((ia1 - ia0) * (j + 0.5)) / 7;
            if (hz ? inR(pb, pa) : inR(pa, pb)) hit = true;
          }
        if (hit) sh.push({ a, b, a2: a + SW, b2: b + SL });
      }
    }
    return sh;
  };
  const dd2 = prepDir(s, u, W, H);
  let hz = dd2 == null ? horiz : dd2,
    sh = lay(hz);
  if (dd2 == null) {
    const o2 = lay(!hz);
    if (o2.length < sh.length || (o2.length === sh.length && !hz && s.type === "wall")) {
      sh = o2;
      hz = !hz;
    }
  }
  sh.forEach((q) => {
    const x0 = Math.max(q.b, hz ? bb.x0 : bb.y0),
      x1 = Math.min(q.b2, hz ? bb.x1 : bb.y1),
      y0 = Math.max(q.a, hz ? bb.y0 : bb.x0),
      y1 = Math.min(q.a2, hz ? bb.y1 : bb.x1);
    const Be = x1 - x0,
      Ae = y1 - y0;
    q.xs = Math.round((hz ? Be : Ae) * 8) / 8;
    q.ys = Math.round((hz ? Ae : Be) * 8) / 8;
    q.full = Math.abs(x1 - x0 - SL) < 0.1 && Math.abs(y1 - y0 - SW) < 0.1;
  });
  return { kind: "sheet", u, horiz: hz, sheets: sh, dims, bs, O, bb };
}
function prepSVG(s, R, id, px, fs0, noLbl) {
  const G = R.G,
    st = s.stack || {},
    pp = prepPlan(s, R),
    u = pp ? pp.u : underOf(st.under || "none"),
    col = PREPCOL[u.k] || PREPCOL.none,
    hD = G.holes.map((x) => pd(x.poly)).join("");
  const PO = prepPoly(s, R),
    ext = PO !== G.outer,
    base = ext ? PO : G.region;
  let h = `<defs><clipPath id="cP${id}"><path clip-rule="evenodd" d="${pd(base)}${hD}"/></clipPath><pattern id="pp${id}" width="1.6" height="1.6" patternUnits="userSpaceOnUse"><rect width="1.6" height="1.6" fill="${col}"/>${u.k === "heat" || u.k === "mem" ? `<circle cx=".8" cy=".8" r=".42" fill="rgba(0,0,0,.13)"/>` : ""}</pattern></defs><path d="${pd(base)}${hD}" fill-rule="evenodd" fill="url(#pp${id})"/>`;
  if (noLbl) return h;
  const fl = +px(10 * fs0);
  if (pp) {
    h += `<g clip-path="url(#cP${id})">`;
    const rr = (a, a2, b, b2) => (pp.horiz ? [b, a, b2 - b, a2 - a] : [a, b, a2 - a, b2 - b]);
    if (pp.kind === "roll") {
      pp.strips.forEach((t, i) => {
        const [x, y, w, hh] = rr(t.a, t.a2, t.b0, t.b1);
        h += `<rect x="${x}" y="${-(y + hh)}" width="${w}" height="${hh}" fill="none" stroke="#7a5a1e" stroke-width="${px(1.4)}" stroke-dasharray="${px(7)} ${px(4)}"/>`;
        const cx = x + w / 2,
          cy = y + hh / 2,
          tx = `${i + 1} · ${ftin(t.b1 - t.b0)}`;
        h += `<text class="lbC" x="${cx}" y="${-cy}" font-size="${fl}" text-anchor="middle" dominant-baseline="central" fill="#5b4210" font-weight="700" font-family="${FONT}" ${pp.horiz ? "" : `transform="rotate(-90 ${cx} ${-cy})"`} paint-order="stroke" stroke="rgba(255,255,255,.8)" stroke-width="${px(3)}">${tx}</text>`;
      });
    } else {
      pp.sheets.forEach((q, i) => {
        const [x, y, w, hh] = rr(q.a, q.a2, q.b, q.b2);
        h += `<rect x="${x}" y="${-(y + hh)}" width="${w}" height="${hh}" fill="none" stroke="#5f5a50" stroke-width="${px(1.2)}"/>`;
        const X0 = Math.max(x, pp.bb.x0),
          X1 = Math.min(x + w, pp.bb.x1),
          Y0 = Math.max(y, pp.bb.y0),
          Y1 = Math.min(y + hh, pp.bb.y1),
          cx = (X0 + X1) / 2,
          cy = (Y0 + Y1) / 2,
          tx = `${fmtIn(q.xs)}×${fmtIn(q.ys)}`,
          f = Math.min(fl, ((X1 - X0) * 0.9) / (tx.length * 0.56));
        if (f > +px(6))
          h += `<text class="lbC" x="${cx}" y="${-cy}" font-size="${f.toFixed(3)}" text-anchor="middle" dominant-baseline="central" fill="${q.full ? "#8a857b" : "#2f2a22"}" font-weight="700" font-family="${FONT}" paint-order="stroke" stroke="rgba(255,255,255,.85)" stroke-width="${px(3)}">${tx}</text>`;
      });
    }
    h += "</g>";
  }
  const jd = s.type !== "wall" ? s.joist || "none" : "none";
  if (jd !== "none") {
    const sp = Math.max(8, +s.joistSp || 16),
      B = bboxOf(G.outer),
      v = jd === "v";
    let jl = "";
    const o = pMod(+s.joistO || 0, sp);
    for (let c = (v ? B.x0 : B.y0) + o; c <= (v ? B.x1 : B.y1) + 0.01; c += sp) {
      if (c < (v ? B.x0 : B.y0) - 0.01) continue;
      jl += v ? `M${c} ${-B.y0}V${-B.y1}` : `M${B.x0} ${-c}H${B.x1}`;
    }
    h += `<g clip-path="url(#cP${id})"><path d="${jl}" stroke="#8c5a2b" stroke-width="${px(1.6)}" stroke-dasharray="${px(10)} ${px(5)}" opacity=".75" fill="none"/></g>`;
  }
  if (ext)
    h += `<path d="${pd(PO)}" fill="none" stroke="#5f5a50" stroke-width="${px(1.6)}"/><path d="${pd(G.outer)}" fill="none" stroke="#1d5fa8" stroke-width="${px(1.2)}" stroke-dasharray="${px(6)} ${px(4)}"/>`;
  return h;
}
function prepCutRows(pp) {
  if (!pp || pp.kind !== "sheet") return [];
  const g = {};
  pp.sheets.forEach((q) => {
    const w = q.xs,
      hh = q.ys,
      k = q.full ? "full" : fmtIn(w) + "×" + fmtIn(hh);
    g[k] = g[k] || { k, n: 0, full: q.full, w, hh };
    g[k].n++;
  });
  return Object.values(g).sort((a, b) => b.full - a.full || b.w * b.hh - a.w * a.hh);
}
function prepSummary(s, R) {
  const st = s.stack || {},
    u = underOf(st.under || "none"),
    u2 = underOf(st.under2 || "none"),
    pp = prepPlan(s, R);
  const names = [u2, u].filter((x) => x.k !== "none").map((x) => esc(x.n));
  const PO = prepPoly(s, R),
    ext = PO !== R.G.outer,
    pb = bboxOf(PO);
  let h =
    `<span><b>${names.length ? names.join(" + ") : t("noPrep")}</b></span>` +
    (ext ? `<span>${t("prepSize")} <b>${fmtIn(pb.x1 - pb.x0)}×${fmtIn(pb.y1 - pb.y0)}</b></span>` : "") +
    `<span>${t("area")} <b>${(Math.abs(sArea(PO)) / 144).toFixed(1)} sf</b></span>`;
  if (pp && pp.kind === "roll")
    h +=
      `<span>${pp.strips.length} ${t("mStrips")} · <b>${Math.ceil(pp.lf / 12)} lf</b></span>` +
      (pp.rolls ? `<span><b>${pp.rolls.n}× ${pp.rolls.sf} sf</b> ${t("rollsN")}</span>` : "");
  if (pp && pp.kind === "sheet") {
    h += `<span><b>${pp.sheets.length}</b> ${t("sheetsN")}${pp.bs ? " " + pp.bs.replace("x", "×") : ""}</span>`;
    const cr = prepCutRows(pp).filter((c) => !c.full);
    if (cr.length)
      h += `<span>${t("prepCuts")}: <b>${cr.map((c) => (c.n > 1 ? c.n + "× " : "") + c.k).join(", ")}</b></span>`;
  }
  return h;
}
function surfBody(s, R, o) {
  const G = R.G,
    T = R.T,
    id = o.id,
    fs0 = o.fs,
    px = (n) => (n * o.upp).toFixed(4);
  let h = "";
  const hD = G.holes.map((x) => pd(x.poly)).join("");
  h += `<defs><clipPath id="cR${id}"><path clip-rule="evenodd" d="${pd(G.region)}${hD}"/></clipPath><clipPath id="cN${id}">${(R.nicheCalc || []).map((nc) => nc.N.comps.map(([x, y, w, hh]) => `<rect x="${x}" y="${-(y + hh)}" width="${w}" height="${hh}"/>`).join("")).join("")}</clipPath>`;
  h += `<pattern id="ht${id}" width="${px(9)}" height="${px(9)}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${px(9)}" height="${px(9)}" fill="#efebe4"/><line x1="0" y1="0" x2="0" y2="${px(9)}" stroke="#c4bdb1" stroke-width="${px(2)}"/></pattern></defs>`;
  const curbOn = s.type === "pan" && s.curb.on;
  if (curbOn) {
    const c = s.curb;
    h += `<rect x="0" y="0" width="${c.len}" height="${c.w}" fill="#dcd5c8" stroke="#6b665e" stroke-width="${px(1)}"/><text x="${c.len / 2}" y="${c.w / 2}" font-size="${Math.min(+px(11 * fs0), c.w * 0.7)}" text-anchor="middle" dominant-baseline="central" fill="#4d4840" font-family="${FONT}">Curb ${fmt(c.w)} × ${fmt(c.h)}</text>`;
  }
  if (LAYER !== "prep" && LAYER !== "wire")
    h += `<path d="${pd(G.region)}${hD}" fill-rule="evenodd" fill="${PAL.grout}"/>`;
  G.niches.forEach(
    (n) => (h += `<rect x="${n.x}" y="${-(n.y + n.h)}" width="${n.w}" height="${n.h}" fill="#8d877d"/>`),
  );
  const rt = R.a ? ` transform="rotate(${((-R.a * 180) / Math.PI).toFixed(4)} ${R.O[0]} ${-R.O[1]})"` : "";
  if (TEXON && T.tex) {
    TXID = "tx" + id;
    TXT = T;
    const im = (r) =>
      `<image href="${T.tex}" x="0" y="0" width="1" height="1" preserveAspectRatio="none"${r ? ' transform="rotate(90 .5 .5)"' : ""}/>`;
    h += `<defs><pattern id="${TXID}" patternContentUnits="objectBoundingBox" width="1" height="1">${im(0)}</pattern><pattern id="${TXID}r" patternContentUnits="objectBoundingBox" width="1" height="1">${im(1)}</pattern></defs>`;
  }
  if (LAYER === "prep") h += prepSVG(s, R, id, px, fs0);
  else {
    if (LAYER === "wire") h += prepSVG(s, R, id, px, fs0, 1);
    h += `<g opacity="${LAYER === "wire" ? 0.22 : 1}"><g clip-path="url(#cR${id})"><g${rt}>${R.main.map((p) => tileSVG(p, T, px)).join("")}</g></g>`;
    if (R.nich.length)
      h += `<g clip-path="url(#cN${id})"><g${rt}>${R.nich.map((p) => tileSVG(p, T, px)).join("")}</g></g>`;
    if (R.nichOwn && R.nichOwn.length)
      h += `<g clip-path="url(#cN${id})">${R.nichOwn.map((q) => q.pieces.map((p) => tileSVG(p, q.T, px)).join("")).join("")}</g>`;
    h += "</g>";
  }
  TXID = TXT = null;
  (R.nicheCalc || []).forEach((nc) => {
    const N = nc.N;
    N.comps.forEach(
      ([x, y, w, hh]) =>
        (h += `<rect x="${x}" y="${-(y + hh)}" width="${w}" height="${hh}" fill="rgba(70,50,25,.13)"/>`),
    );
    if (N.div)
      h += `<rect x="${N.div.x}" y="${-(N.div.y + N.div.h)}" width="${N.div.w}" height="${N.div.h}" fill="#ece5d7" stroke="#6b665e" stroke-width="${px(1)}"/>`;
    if (N.shelf) {
      const c = N.c,
        col = c.shelf === "metal" ? "#9aa3ad" : c.shelf === "stone" ? "#b9b1a4" : "#f3dcb4",
        th = Math.max(N.shelf.t, +px(3));
      h += `<rect x="${N.shelf.x}" y="${-(N.shelf.y + th)}" width="${N.shelf.w}" height="${th}" fill="${col}" stroke="#5b5348" stroke-width="${px(0.8)}"/>`;
      if (N.shelf.apron)
        h += `<rect x="${N.shelf.x}" y="${-(N.shelf.y + N.shelf.t)}" width="${N.shelf.w}" height="${N.shelf.apron}" fill="#f3dcb4" fill-opacity=".85" stroke="#5b5348" stroke-width="${px(0.8)}"/>`;
    }
    if (N.c.edge === "profile")
      N.comps.forEach(
        ([x, y, w, hh]) =>
          (h += `<rect x="${x}" y="${-(y + hh)}" width="${w}" height="${hh}" fill="none" stroke="#9aa3ad" stroke-width="${px(3)}"/>`),
      );
  });
  const sw = edgeProf(s).vis,
    TR = 'fill="#c3c8d0" stroke="#7f8690" stroke-width="' + px(0.8) + '"';
  if (s.shape === "rect" && sw > 0) {
    const q = s.trim;
    if (q.l) h += `<rect x="0" y="${-s.h}" width="${sw}" height="${s.h}" ${TR}/>`;
    if (q.r) h += `<rect x="${s.w - sw}" y="${-s.h}" width="${sw}" height="${s.h}" ${TR}/>`;
    if (q.t) h += `<rect x="0" y="${-s.h}" width="${s.w}" height="${sw}" ${TR}/>`;
    if (q.b) h += `<rect x="0" y="${-sw}" width="${s.w}" height="${sw}" ${TR}/>`;
  }
  const lbl = (B, txt, maxW, col) => {
    const f = Math.min(+px(10.5 * fs0), maxW / (txt.length * 0.56));
    if (f < +px(6)) return "";
    const g = +px(4 * fs0),
      wt = f * txt.length * 0.56,
      cx = (B.x0 + B.x1) / 2,
      cy = (B.y0 + B.y1) / 2,
      x = cx,
      y = -B.y1 - g;
    const alt = [
      [B.x0 + wt / 2, y],
      [B.x1 - wt / 2, y],
      [cx, -B.y0 + g + f * 0.8],
      [B.x0 + wt / 2, -B.y0 + g + f * 0.8],
      [B.x1 - wt / 2, -B.y0 + g + f * 0.8],
      [B.x1 + g + wt / 2, -cy + f * 0.35],
      [B.x0 - g - wt / 2, -cy + f * 0.35],
      [cx, -cy + f * 0.35],
      [cx, -B.y1 - g - f * 1.1],
      [cx, -B.y0 + g + f * 1.9],
    ]
      .map((q) => q.map((v) => v.toFixed(3)).join(","))
      .join(";");
    return `<text class="lbO" data-alt="${alt}" x="${x}" y="${y}" font-size="${f.toFixed(3)}" text-anchor="middle" fill="${col || PAL.lab}" font-weight="600" font-family="${FONT}" paint-order="stroke" stroke="${PAL.bg}" stroke-width="${px(2.5)}">${esc(txt)}</text>`;
  };
  for (const op of s.openings) {
    if (op.type === "toilet" && s.type !== "wall") {
      const z = toiletZone(s, op),
        ang = { r: 0, u: -90, l: 180, d: 90 }[z.face],
        bw = Math.min(z.half, 7.5),
        b0 = -Math.min(5, z.back),
        tk = Math.min(8, z.back);
      h += `<g transform="translate(${op.x} ${-op.y}) rotate(${ang})" pointer-events="none">`;
      if (tk > 1)
        h += `<rect x="${-z.back}" y="${-z.half}" width="${tk}" height="${2 * z.half}" rx="1.5" fill="${PAL.bg}" fill-opacity=".55" stroke="#5a4129" stroke-width="${px(1)}"/>`;
      h += `<ellipse cx="${(z.front + b0) / 2}" cy="0" rx="${(z.front - b0) / 2}" ry="${bw}" fill="${PAL.bg}" fill-opacity=".55" stroke="#5a4129" stroke-width="${px(1)}"/>`;
      const a0 = z.front + 1,
        a1 = z.front + 9,
        ah = 3;
      h += `<path d="M${a0} 0H${a1}M${a1 - ah} ${-ah * 0.75}L${a1} 0L${a1 - ah} ${ah * 0.75}" fill="none" stroke="#c0392b" stroke-width="${px(2)}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    }
    if (op.shape === "circle") {
      const r = Math.max(0.05, op.dia / 2);
      h += `<circle cx="${op.x}" cy="${-op.y}" r="${r}" fill="#fff" stroke="#5a4129" stroke-width="${px(1.3)}"/><path d="M${op.x - r * 0.6} ${-op.y}H${op.x + r * 0.6}M${op.x} ${-op.y - r * 0.6}V${-op.y + r * 0.6}" stroke="#5a4129" stroke-width="${px(0.8)}"/>`;
      h += lbl(
        { x0: op.x - r, x1: op.x + r, y0: op.y - r, y1: op.y + r },
        `${t(op.type)} ⌀${fmtIn(op.dia)}`,
        Math.max(op.dia * 6, +px(140)),
      );
      continue;
    }
    const e = op.trim && TRIMMABLE[op.type] ? sw : 0;
    if (op.type === "window" || op.type === "cutout")
      h += `<rect x="${op.x}" y="${-(op.y + op.h)}" width="${op.w}" height="${op.h}" fill="url(#ht${id})"/>`;
    if (op.type === "outlet") {
      h += `<rect x="${op.x}" y="${-(op.y + op.h)}" width="${op.w}" height="${op.h}" fill="#fff"/><rect x="${op.x + op.w * 0.3}" y="${-(op.y + op.h * 0.82)}" width="${op.w * 0.4}" height="${op.h * 0.25}" rx="${op.w * 0.08}" fill="none" stroke="#5a4129" stroke-width="${px(0.7)}"/><rect x="${op.x + op.w * 0.3}" y="${-(op.y + op.h * 0.43)}" width="${op.w * 0.4}" height="${op.h * 0.25}" rx="${op.w * 0.08}" fill="none" stroke="#5a4129" stroke-width="${px(0.7)}"/>`;
    }
    if (op.type === "duct") {
      h += `<rect x="${op.x}" y="${-(op.y + op.h)}" width="${op.w}" height="${op.h}" fill="#fff"/>`;
      const vert = op.h > op.w,
        n = Math.max(2, Math.floor((vert ? op.h : op.w) / 0.8));
      for (let i = 1; i < n; i++) {
        const u = i / n;
        h += vert
          ? `<line x1="${op.x + op.w * 0.15}" x2="${op.x + op.w * 0.85}" y1="${-(op.y + op.h * u)}" y2="${-(op.y + op.h * u)}" stroke="#777" stroke-width="${px(0.8)}"/>`
          : `<line y1="${-(op.y + op.h * 0.15)}" y2="${-(op.y + op.h * 0.85)}" x1="${op.x + op.w * u}" x2="${op.x + op.w * u}" stroke="#777" stroke-width="${px(0.8)}"/>`;
      }
    }
    if (e > 0)
      h += `<path fill-rule="evenodd" d="${pd(rectPoly(op.x - e, op.y - e, op.w + 2 * e, op.h + 2 * e))}${pd(rectPoly(op.x, op.y, op.w, op.h))}" ${TR}/>`;
    h += `<rect x="${op.x}" y="${-(op.y + op.h)}" width="${op.w}" height="${op.h}" fill="${op.type === "noheat" ? "rgba(29,95,168,.07)" : op.type === "warm" ? "rgba(224,123,0,.10)" : "none"}" stroke="${op.type === "noheat" ? "#1d5fa8" : op.type === "warm" ? "#e07b00" : "#5a4129"}" stroke-width="${px(1.3)}" ${op.type === "niche" || op.type === "noheat" || op.type === "warm" ? `stroke-dasharray="${px(5)} ${px(3)}"` : ""}/>`;
    h += lbl(
      { x0: op.x - e, x1: op.x + op.w + e, y0: op.y - e, y1: op.y + op.h + e },
      `${t(op.type)} ${fmtIn(op.w)}×${fmtIn(op.h)}`,
      Math.max(op.w * 1.6, +px(120)),
    );
  }
  if (s.type === "pan") {
    const d = s.drain;
    if (d.type === "center")
      h += `<circle cx="${d.x}" cy="${-d.y}" r="2.125" fill="#6a6a6a" stroke="#333" stroke-width="${px(1)}"/><path d="M${d.x - 1.4} ${-d.y}H${d.x + 1.4}M${d.x} ${-d.y - 1.4}V${-d.y + 1.4}" stroke="#ccc" stroke-width="${px(1)}"/>`;
    if (d.type === "linear") {
      h += `<rect x="${d.x}" y="${-(d.y + d.wid)}" width="${d.len}" height="${d.wid}" fill="#555" stroke="#222" stroke-width="${px(1)}"/>`;
      for (let x = d.x + 1; x < d.x + d.len - 0.5; x += 1.5)
        h += `<line x1="${x}" y1="${-(d.y + d.wid * 0.25)}" x2="${x}" y2="${-(d.y + d.wid * 0.75)}" stroke="#999" stroke-width="${px(1)}"/>`;
    }
  }
  h += heatSVG(s, R, px, fs0);
  (s.trans || []).forEach((tr, i) => {
    const O = G.outer,
      a = O[tr.edge % O.length],
      b = O[(tr.edge + 1) % O.length],
      L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1,
      ux = (b[0] - a[0]) / L,
      uy = (b[1] - a[1]) / L,
      f0 = Math.max(0, Math.min(L, +tr.from || 0)),
      f1 = Math.max(0, Math.min(L, f0 + (+tr.len || 0)));
    const p0 = [a[0] + ux * f0, a[1] + uy * f0],
      p1 = [a[0] + ux * f1, a[1] + uy * f1],
      sg = sArea(O) > 0 ? 1 : -1,
      nx = uy * sg,
      ny = -ux * sg,
      off = -px(16 * fs0),
      mx = (p0[0] + p1[0]) / 2 + nx * off,
      my = (p0[1] + p1[1]) / 2 + ny * off;
    h += `<line x1="${p0[0]}" y1="${-p0[1]}" x2="${p1[0]}" y2="${-p1[1]}" stroke="#7a4fb3" stroke-width="${px(5)}" stroke-linecap="round" opacity=".85"/><text class="lbO" data-alt="${[
      [mx - 2 * nx * off, -(my - 2 * ny * off)],
      [mx + nx * off * 0.6 + ux * off * 3, -(my + ny * off * 0.6 + uy * off * 3)],
      [mx + nx * off * 0.6 - ux * off * 3, -(my + ny * off * 0.6 - uy * off * 3)],
    ]
      .map((q) => q.map((v) => v.toFixed(3)).join(","))
      .join(
        ";",
      )}" x="${mx}" y="${-my}" font-size="${px(10.5 * fs0)}" text-anchor="middle" dominant-baseline="central" fill="#7a4fb3" font-weight="700" font-family="${FONT}" paint-order="stroke" stroke="${PAL.bg}" stroke-width="${px(3)}">→ ${esc(t("adj_" + tr.adj))}</text>`;
  });
  if (R.ledger && R.ledger.y != null) {
    const y = -R.ledger.y,
      x0 = G.bb.x0,
      x1 = G.bb.x1;
    h += `<line x1="${x0 - +px(6)}" x2="${x1 + +px(6)}" y1="${y}" y2="${y}" stroke="#d0342c" stroke-width="${px(1.4)}" stroke-dasharray="${px(7)} ${px(4)}"/><text x="${x1 + +px(8)}" y="${y}" font-size="${px(10 * o.fs)}" dominant-baseline="central" fill="#d0342c" font-weight="700" font-family="${FONT}">ledger ${fmt(R.ledger.y)}</text>`;
  }
  h += `<path class="lbE" d="${pd(G.outer)}" fill="none" stroke="${PAL.ink}" stroke-width="${px(1.7)}"/>`;
  // cut labels
  const sheet = T.sheet && T.sheet.on;
  if (
    S.labels &&
    !sheet &&
    T.shape !== "penny" &&
    R.all.length < 900 &&
    LAYER !== "prep" &&
    LAYER !== "wire"
  ) {
    const big = S.site ? 1.55 : 1,
      fMin = +px(8.5 * fs0 * big),
      fMax = +px(12.5 * fs0 * big);
    for (const p of R.all) {
      if (p.full || p.k !== "r") continue;
      const b = p.b;
      let tx0 =
        p.cutX && p.cutY
          ? fmtIn(p.cw) + "×" + fmtIn(p.ch)
          : p.cutX
            ? fmtIn(p.cw)
            : p.cutY
              ? fmtIn(p.ch)
              : fmtIn(p.cw) + "×" + fmtIn(p.ch);
      let tx = tx0;
      if (p.taper || p.taperW) {
        const wp = p.taperW ? p.taperW.map(fmtIn).join("→") : fmtIn(p.cw),
          hp = p.taper ? p.taper.map(fmtIn).join("→") : fmtIn(p.ch);
        tx = (p.cutX ? wp : "") + (p.cutX && p.cutY ? "×" : "") + (p.cutY ? hp : "");
      } else if (p.notch)
        tx = (p.arc ? "◠ " : p.cutX || p.cutY || (p.ax && !p.hl) ? "L " : p.hl ? "⊙ " : "◿ ") + tx;
      const lw = p.lp ? p.lp[2] : b.x1 - b.x0,
        lh = p.lp ? p.lp[3] : b.y1 - b.y0,
        L = tx.length * 0.58;
      let f = Math.min(fMax, (lw / L) * 0.94, lh * 0.62),
        rot = false;
      if (f < fMin) {
        const f2 = Math.min(fMax, (lh / L) * 0.94, lw * 0.62);
        if (f2 >= fMin * 0.9) {
          f = f2;
          rot = true;
        } else if (f < fMin * 0.75) continue;
      }
      const pl = p.lp ? [p.lp[0], p.lp[1]] : [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2],
        w = p.own ? pl : R.toW(pl),
        x = w[0],
        y = -w[1];
      const ang = (rot ? -90 : 0) - (p.own ? 0 : (R.a * 180) / Math.PI);
      const col = p.c === "bad" ? "#7d1410" : "#1d3550";
      let inner = esc(tx);
      if (S.nums && p.no) {
        const two = (rot ? lw : lh) >= f * 2.5;
        if (two)
          inner = `<tspan x="${x.toFixed(3)}" dy="${(-f * 0.62).toFixed(3)}" fill="#b4441b" font-weight="800">#${p.no}</tspan><tspan x="${x.toFixed(3)}" dy="${(f * 1.2).toFixed(3)}">${esc(tx)}</tspan>`;
        else inner = `<tspan fill="#b4441b" font-weight="800">#${p.no}</tspan>`;
      }
      h += `<text class="lbC" x="${x.toFixed(3)}" y="${y.toFixed(3)}" font-size="${f.toFixed(3)}" text-anchor="middle" dominant-baseline="central" fill="${col}" font-weight="600" font-family="${FONT}"${ang ? ` transform="rotate(${ang.toFixed(3)} ${x.toFixed(3)} ${y.toFixed(3)})"` : ""}>${inner}</text>`;
    }
  }
  // dims
  const dimC = s.shape === "rect" || s.shape === "L" ? PAL.blue : PAL.dim,
    f = px(12 * fs0),
    tk = +px(5),
    bb = G.bb,
    m = o.m;
  if (s.shape !== "walk") {
    const yb = Math.min(bb.y0, curbOn ? -s.curb.w : bb.y0) - m * 0.42;
    h += `<path d="M${bb.x0} ${-yb}H${bb.x1}M${bb.x0} ${-yb - tk}v${2 * tk}M${bb.x1} ${-yb - tk}v${2 * tk}" stroke="${dimC}" stroke-width="${px(1)}"/>`;
    h += `<text class="lbD" x="${(bb.x0 + bb.x1) / 2}" y="${-yb + +px(5)}" dominant-baseline="hanging" font-size="${f}" text-anchor="middle" fill="${dimC}" font-weight="600" font-family="${FONT}" paint-order="stroke" stroke="${PAL.bg}" stroke-width="${px(3)}" ${dimKey(s, "w")}>${fmt(bb.x1 - bb.x0)}</text>`;
    if (o.dimV) {
      const xl = bb.x0 - m * 0.42,
        ym = -(bb.y0 + bb.y1) / 2;
      h += `<path d="M${xl} ${-bb.y0}V${-bb.y1}M${xl - tk} ${-bb.y0}h${2 * tk}M${xl - tk} ${-bb.y1}h${2 * tk}" stroke="${dimC}" stroke-width="${px(1)}"/>`;
      h += `<text class="lbD" x="${xl - +px(5)}" y="${ym}" font-size="${f}" text-anchor="middle" fill="${dimC}" font-weight="600" font-family="${FONT}" transform="rotate(-90 ${xl - +px(5)} ${ym})" paint-order="stroke" stroke="${PAL.bg}" stroke-width="${px(3)}" ${dimKey(s, "h")}>${fmt(bb.y1 - bb.y0)}</text>`;
    }
  }
  if (s.shape === "walk") {
    const wk = walkPoly(s);
    wk.edges.forEach((e2, i) => {
      const mx = (e2[0][0] + e2[1][0]) / 2,
        my = (e2[0][1] + e2[1][1]) / 2,
        ex = e2[1][0] - e2[0][0],
        ey = e2[1][1] - e2[0][1],
        L = Math.hypot(ex, ey);
      if (L < 0.5) return;
      const sgn = wk.ccw ? 1 : -1,
        nx = (ey / L) * sgn,
        ny = (-ex / L) * sgn,
        off = +px(13 * fs0);
      h += `<text x="${(mx + nx * off).toFixed(3)}" y="${(-(my + ny * off)).toFixed(3)}" font-size="${px(12.5 * fs0)}" text-anchor="middle" dominant-baseline="central" fill="${PAL.blue}" font-weight="700" font-family="${FONT}" paint-order="stroke" stroke="${PAL.bg}" stroke-width="${px(3)}" data-dim="${P.surfaces.indexOf(s)}:seg:${i}" style="cursor:pointer">${fmt(s.segs[i] ? +s.segs[i].l : L)}</text>`;
    });
  }
  if (o.title)
    h += `<text class="lbD" x="${(bb.x0 + bb.x1) / 2}" y="${-bb.y1 - +px(10 * fs0)}" font-size="${Math.min(+px(13 * fs0), (bb.x1 - bb.x0) / ((s.name.length + 2) * 0.62)).toFixed(3)}" text-anchor="middle" fill="${PAL.ink}" font-weight="700" font-family="${FONT}">${esc(s.name)}${isLinked(s) ? " 🔗" : ""}</text>`;
  return h;
}

function allWallItems() {
  const ws = P.surfaces.filter((s) => s.type === "wall");
  let x = 0;
  const gap = P.link.mode === "wrap" ? 0 : 8;
  return ws.map((s) => {
    const R = compute(s),
      w = R.G.bb.x1 - R.G.bb.x0,
      it = { s, R, dx: x - R.G.bb.x0, dy: +s.base || 0 };
    x += w + gap;
    return it;
  });
}
const isMulti = () => S.tab === "all" || S.tab === "floor";
function floorItems() {
  return P.surfaces
    .filter((s) => s.type !== "wall")
    .map((s) => ({ s, R: compute(s), dx: +(s.pos || {}).x || 0, dy: +(s.pos || {}).y || 0 }));
}
function viewItems() {
  if (S.tab === "all") return allWallItems();
  if (S.tab === "floor") return floorItems();
  const s = cur();
  return s ? [{ s, R: compute(s), dx: 0, dy: 0 }] : [];
}
function buildView(Wpx, Hpx, v, fs, ins) {
  return buildViewItems(
    Wpx,
    Hpx,
    v,
    fs,
    viewItems(),
    S.tab === "all" ? "walls" : S.tab === "floor" ? "floor" : false,
    ins,
  );
}
function buildViewItems(Wpx, Hpx, v, fs, items, all, ins) {
  if (!items.length) return null;
  let bb = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
  for (const it of items) {
    const b = LAYER === "prep" ? bboxOf(prepPoly(it.s, it.R)) : it.R.G.bb;
    let y0 = b.y0;
    if (it.s.type === "pan" && it.s.curb.on) y0 = Math.min(y0, -it.s.curb.w);
    bb.x0 = Math.min(bb.x0, b.x0 + it.dx);
    bb.x1 = Math.max(bb.x1, b.x1 + it.dx);
    bb.y0 = Math.min(bb.y0, y0 + it.dy);
    bb.y1 = Math.max(bb.y1, b.y1 + it.dy);
  }
  const walls = all === "walls" || all === true;
  if (walls) bb.y0 = Math.min(bb.y0, 0);
  const span = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0, 12),
    m = span * 0.09 + 4;
  let vw = (bb.x1 - bb.x0 + 2 * m) / v.zoom,
    vh = (bb.y1 - bb.y0 + 2 * m + (all ? m * 0.5 : 0)) / v.zoom;
  if (!Hpx) Hpx = (Wpx * vh) / vw;
  const I = ins && Hpx - ins.t - ins.b > 80 && Wpx - ins.l - ins.r > 80 ? ins : { t: 0, b: 0, l: 0, r: 0 },
    aw = Wpx - I.l - I.r,
    ah = Hpx - I.t - I.b;
  {
    const k = Math.max(vw / aw, vh / ah);
    vw = k * Wpx;
    vh = k * Hpx;
  }
  let upp = vw / Wpx;
  const cx = (bb.x0 + bb.x1) / 2 + v.panX - ((I.l - I.r) / 2) * upp,
    cy = (bb.y0 + bb.y1) / 2 + (all ? m * 0.25 : 0) + v.panY + ((I.t - I.b) / 2) * upp;
  let vb = [cx - vw / 2, -(cy + vh / 2), vw, vh];
  // while a floor zone is being dragged the view stays put, so the zone follows the finger
  if (S.vbLock && fs === 1) {
    vb = S.vbLock.vb.slice();
    upp = S.vbLock.upp;
  }
  let body = `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="${PAL.bg}"/>`;
  items.forEach((it, i) => {
    body += `<g transform="translate(${it.dx} ${-it.dy})">${surfBody(it.s, it.R, { upp, fs, id: "s" + i, m: all ? m * 0.6 : m, dimV: !all, title: !!all })}</g>`;
    it.x0 = it.R.G.bb.x0 + it.dx;
    it.x1 = it.R.G.bb.x1 + it.dx;
  });
  if (walls) {
    body += `<line x1="${bb.x0 - m * 0.3}" x2="${bb.x1 + m * 0.3}" y1="0" y2="0" stroke="${PAL.ink}" stroke-width="${(1.2 * upp).toFixed(4)}" stroke-dasharray="${(6 * upp).toFixed(3)} ${(3 * upp).toFixed(3)}"/>`;
  }
  return { vb, body, Hpx, items, upp };
}

const svg = $("#svg");
let R = null;
function declutter(root) {
  const ol = [...root.querySelectorAll("text.lbO")];
  if (!ol.length) return;
  const placed = [];
  const box = (e) => {
    const r = e.getBoundingClientRect();
    return { l: r.left, r: r.right, t: r.top, b: r.bottom };
  };
  const hit = (a) =>
    placed.some((b) => a.l < b.r - 0.5 && a.r > b.l + 0.5 && a.t < b.b - 0.5 && a.b > b.t + 0.5);
  root.querySelectorAll("text.lbC,text.lbD,text[data-dim]").forEach((e) => {
    const r = box(e);
    if (r.r > r.l) placed.push(r);
  });
  const vb = root.getBoundingClientRect();
  const edges = [...root.querySelectorAll("path.lbE")]
    .map((p) => {
      let M = null;
      try {
        M = p.getScreenCTM().inverse();
      } catch (e) {}
      return { p, M };
    })
    .filter((q) => q.M);
  const cross = (r) => {
    const my = (r.t + r.b) / 2,
      pts = [
        [r.l, my],
        [r.r, my],
        [(r.l + r.r) / 2, my],
        [r.l, r.t],
        [r.r, r.t],
        [r.l, r.b],
        [r.r, r.b],
      ];
    for (const { p, M } of edges) {
      let a = 0,
        n = 0;
      for (const [x, y] of pts) {
        const pt = root.createSVGPoint();
        pt.x = x;
        pt.y = y;
        const q = pt.matrixTransform(M);
        let i = false;
        try {
          i = p.isPointInFill(q);
        } catch (e) {
          return false;
        }
        if (i) a++;
        n++;
      }
      if (a && a < n) return true;
    }
    return false;
  };
  for (const e of ol) {
    const c = [[e.getAttribute("x"), e.getAttribute("y")]].concat(
      (e.dataset.alt || "")
        .split(";")
        .filter(Boolean)
        .map((q) => q.split(",")),
    );
    let ok = false;
    for (const strict of [true, false]) {
      for (const [x, y] of c) {
        e.setAttribute("x", x);
        e.setAttribute("y", y);
        const r = box(e);
        if (r.l < vb.left || r.r > vb.right || r.t < vb.top || r.b > vb.bottom) continue;
        if (hit(r) || (strict && cross(r))) continue;
        placed.push(r);
        ok = true;
        break;
      }
      if (ok) break;
    }
    if (!ok) e.remove();
  }
}
function declutterBody(body, vb, W, H) {
  const ns = "http://www.w3.org/2000/svg",
    el = document.createElementNS(ns, "svg");
  el.setAttribute("viewBox", vb.join(" "));
  el.setAttribute("width", W);
  el.setAttribute("height", H);
  el.style.cssText = `position:fixed;left:-${W + 500}px;top:0;width:${W}px;height:${H}px;pointer-events:none`;
  try {
    document.body.appendChild(el);
    el.innerHTML = body;
    declutter(el);
    body = el.innerHTML;
  } catch (e) {}
  el.remove();
  return body;
}
function overlayInsets(r) {
  const vis = (e) => e && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().height > 0;
  let t = 0,
    b = 0;
  const tl = $("#tools");
  if (tl)
    for (const c of tl.children) {
      if (!vis(c)) continue;
      const q = c.getBoundingClientRect();
      t = Math.max(t, q.bottom - r.top);
    }
  let rr = 0;
  const sb = $("#sbar");
  if (vis(sb)) {
    // place it under the toolbar, measured against its own positioned parent (the stage may have a safe-area padding)
    const op = sb.offsetParent,
      base = op ? op.getBoundingClientRect().top : r.top;
    sb.style.top = Math.round(r.top - base + (t ? t + 6 : 8)) + "px";
    const q = sb.getBoundingClientRect();
    rr = r.right - q.left;
  }
  for (const id of ["#layers", "#pad"]) {
    const e = $(id);
    if (!vis(e)) continue;
    const q = e.getBoundingClientRect();
    b = Math.max(b, r.bottom - q.top);
  }
  return { t: t ? t + 22 : 0, b: b ? b + 24 : 0, l: 0, r: rr ? rr + 8 : 0 };
}
function draw() {
  const r = svg.getBoundingClientRect();
  if (r.width < 10) return;
  if (S.tab === "tot") {
    svg.innerHTML = "";
    return;
  }
  let V = null;
  LAYER = S.layer;
  TEXON = !!(S.client || S.texOn);
  try {
    V = buildView(r.width, r.height, S.view, 1, overlayInsets(r));
  } catch (e) {
    console.error(e);
  }
  LAYER = null;
  if (!V) {
    svg.setAttribute("viewBox", "0 0 100 40");
    svg.innerHTML = `<text x="50" y="20" text-anchor="middle" font-size="4" fill="#888" font-family="${FONT}">${esc(t(isMulti() ? "noWalls" : "tooMany"))}</text>`;
    R = null;
    S.items = [];
    renderStat();
    return;
  }
  svg.setAttribute("viewBox", V.vb.join(" "));
  svg.innerHTML = V.body;
  declutter(svg);
  S.vb = V.vb;
  S.upp = V.upp;
  S.items = V.items;
  R = isMulti() ? null : V.items[0].R;
  renderStat();
}
let rafP = 0;
const drawSoon = () => {
  if (rafP) return;
  rafP = requestAnimationFrame(() => {
    rafP = 0;
    draw();
    syncOff();
  });
};

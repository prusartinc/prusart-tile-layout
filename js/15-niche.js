"use strict";
/* ================= niche ================= */
/* A niche is an opening of type "niche" with extra settings in o.nk:
   kind      custom | prefab (Schluter KERDI-BOARD-SN, 12" wide, depth 3-1/2")
   form      single | shelf | dblV (two compartments stacked) | dblH (side by side)
   shelf     metal (prefab 1/8") | tile2 (two tiles + Schluter on the front) | miter (tile + mitered apron) | stone
   edge      profile (Schluter) | miter | wall (wall tile overlaps the returns) | ret (returns cover the wall tile edge)
   corner    45 | 90 | piece (prefab corner pieces) — how the edge profile meets at the corners
   back/ret  tile for the back wall and for the returns: same as wall, or own tile
   o.w × o.h is the tiled opening; o.d is the depth from the wall board face to the niche back board face. */

const NICHE_PRE = { "12x6": [12, 6], "12x12": [12, 12], "12x20": [12, 20], "12x28": [12, 28] };
const NICHE_BOND = 0.125; // thinset under niche tiles

function nicheCfg(o, s) {
  const T = (s && s.tile) || defTile();
  const tl = () => ({
    mode: "wall",
    w: +T.w || 12,
    h: +T.h || 24,
    thick: +T.thick || 0.375,
    g: +T.g || 0.125,
    pattern: "grid",
    rot: false,
    ax: "center",
    ay: "bottom",
  });
  const c = (o.nk = o.nk || {});
  const def = {
    kind: "custom",
    pre: "12x12",
    preRot: false,
    form: "single",
    shelfY: Math.round((+o.h || 12) / 2),
    shelf: "metal",
    shelfT: 0.75,
    apron: 1.5,
    div: 3,
    divPos: null,
    edge: o.trim === false ? "wall" : "profile",
    prof: "inherit",
    size: "auto",
    corner: "45",
    retW: null,
  };
  for (const k in def) if (c[k] === undefined) c[k] = def[k];
  c.back = Object.assign(tl(), c.back || {});
  c.ret = Object.assign(tl(), c.ret || {});
  c.back.rot = String(c.back.rot === true || c.back.rot === "true");
  c.ret.rot = String(c.ret.rot === true || c.ret.rot === "true");
  o.trim = c.edge === "profile";
  return c;
}
// apply prefab size
function nichePrefab(o) {
  const c = o.nk;
  if (!c || c.kind !== "prefab") return;
  const q = NICHE_PRE[c.pre] || [12, 12];
  o.w = c.preRot ? q[1] : q[0];
  o.h = c.preRot ? q[0] : q[1];
  o.d = 3.5;
}
// tile objects used for back / returns
function nicheTile(s, o, which) {
  const c = nicheCfg(o, s),
    q = which === "ret" ? (c.ret.mode === "back" ? c.back : c.ret) : c.back;
  if (q.mode === "wall" || (which === "ret" && c.ret.mode === "back" && c.back.mode === "wall")) return null;
  return defTile({
    w: +q.w || 12,
    h: +q.h || 12,
    thick: +q.thick || 0.375,
    g: +q.g || 0.0625,
    pattern: q.pattern === "offset" ? "offset" : "grid",
    off: 0.5,
    rot: q.rot === "true",
    shape: "rect",
    sheet: { on: false, w: 12, h: 12 },
  });
}
const nThick = (T) => (+T.thick || 0.375) + NICHE_BOND;

/* compartments: tiled back areas in wall coordinates, plus the divider (double niche) */
function nicheParts(s, o) {
  const c = nicheCfg(o, s),
    T = s.tile,
    Tb = nicheTile(s, o, "back") || T,
    Tr = nicheTile(s, o, "ret") || T,
    rTh = nThick(Tr),
    bTh = nThick(Tb),
    wTh = nThick(T);
  const x0 = +o.x,
    y0 = +o.y,
    w = +o.w,
    h = +o.h,
    d = +o.d || 3.5;
  // return width (how deep the return tile is)
  let auto = d - bTh + (c.edge === "wall" ? 0 : wTh);
  const retW = c.retW != null && c.retW !== "" ? +c.retW : Math.max(0.5, auto);
  const comps = [];
  let div = null,
    shelf = null;
  if (c.form === "dblV" || c.form === "dblH") {
    const V = c.form === "dblV",
      L = V ? h : w,
      dv = Math.max(0.5, Math.min(L - 2, +c.div || 3)),
      p = c.divPos != null && c.divPos !== "" ? +c.divPos : (L - dv) / 2;
    const a = Math.max(1, Math.min(L - dv - 1, p));
    if (V) {
      comps.push([x0, y0, w, a], [x0, y0 + a + dv, w, h - a - dv]);
      div = { x: x0, y: y0 + a, w, h: dv, V };
    } else {
      comps.push([x0, y0, a, h], [x0 + a + dv, y0, w - a - dv, h]);
      div = { x: x0 + a, y: y0, w: dv, h, V };
    }
  } else if (c.form === "shelf") {
    const sT =
      c.shelf === "metal"
        ? 0.125
        : c.shelf === "tile2"
          ? 2 * (+Tr.thick || 0.375) + NICHE_BOND
          : c.shelf === "miter"
            ? +Tr.thick || 0.375
            : +c.shelfT || 0.75;
    const sy = Math.max(1, Math.min(h - sT - 1, +c.shelfY || h / 2));
    comps.push([x0, y0, w, sy], [x0, y0 + sy + sT, w, h - sy - sT]);
    shelf = { y: y0 + sy, t: sT, x: x0, w, apron: c.shelf === "miter" ? +c.apron || 1.5 : 0 };
  } else comps.push([x0, y0, w, h]);
  return { c, T, Tb, Tr, own: Tb !== T, rTh, bTh, wTh, retW, autoRet: auto, comps, div, shelf, d };
}

/* everything the niche adds to the surface result */
function nicheCalc(s, o, T, X) {
  const N = nicheParts(s, o),
    c = N.c,
    lab = (k) => t(k);
  let backP = [];
  N.comps.forEach(([x, y, w, h]) => {
    if (w < 0.5 || h < 0.5) return;
    if (!N.own) {
      const r = pieces(rectPoly(x, y, w, h).map(X.toL), [], T, true);
      if (r) backP = backP.concat(r);
    } else {
      const Tb = Object.assign({}, N.Tb),
        { tw, th } = rdims(Tb),
        g = +Tb.g || 0,
        q = c.back;
      Tb.ox = q.ax === "left" ? x : q.ax === "joint" ? x + w / 2 + g / 2 : x + w / 2 - tw / 2;
      Tb.oy = q.ay === "top" ? y + h - th : q.ay === "center" ? y + h / 2 - th / 2 : y;
      const r = pieces(rectPoly(x, y, w, h), [], Tb, true);
      if (r) (r.forEach((p) => (p.own = 1)), (backP = backP.concat(r)));
    }
  });
  // returns: sides run full height of each compartment, top/bottom fit between the sides
  const strips = [],
    rw = N.retW;
  N.comps.forEach(([x, y, w, h], i) => {
    const sfx = N.comps.length > 1 ? ` ${i + 1}` : "";
    strips.push(mkStrip(lab("nicheSide") + sfx, h, rw, 2, N.Tr));
    // with a shelf the shelf itself is the top of the lower part and the bottom of the upper part
    if (!N.shelf) strips.push(mkStrip(lab("nicheTB") + sfx, Math.max(0.5, w - 2 * N.rTh), rw, 2, N.Tr));
  });
  if (N.shelf) strips.push(mkStrip(lab("nicheTB"), Math.max(0.5, +o.w - 2 * N.rTh), rw, 2, N.Tr));
  if (N.div)
    strips.push(mkStrip(lab("nDivFace"), N.div.V ? N.div.w : N.div.h, N.div.V ? N.div.h : N.div.w, 1, T));
  // shelf
  const items = [];
  const sw = Math.max(0.5, +o.w - 2 * N.rTh),
    sd = rw;
  if (N.shelf) {
    if (c.shelf === "metal") items.push({ k: "nShelfMetal", n: 1, note: `${fmtIn(sw)} × ${fmtIn(sd)}` });
    else if (c.shelf === "stone")
      items.push({
        k: "nShelfStone",
        n: 1,
        note: `${fmtIn(sw)} × ${fmtIn(sd)} × ${fmtIn(+c.shelfT || 0.75)}`,
      });
    else if (c.shelf === "tile2") strips.push(mkStrip(lab("nShelfTile2"), sw, sd, 2, N.Tr));
    else if (c.shelf === "miter") {
      strips.push(mkStrip(lab("nShelfTop"), sw, sd, 1, N.Tr));
      strips.push(mkStrip(lab("nShelfApron"), sw, +c.apron || 1.5, 1, N.Tr));
    }
  }
  if (c.kind === "prefab")
    items.push({ k: "nPrefab", n: 1, note: `KERDI-BOARD-SN ${c.pre.replace("x", "″ × ")}″` });
  // edge profile
  const ncomp = N.comps.length;
  let profLF = 0,
    corners = 0,
    miters = 0,
    profKey = "";
  const ep = edgeProf(s),
    type = c.prof && c.prof !== "inherit" ? c.prof : ep.type,
    size = c.size && c.size !== "auto" ? +c.size : autoSize(+T.thick || 0.375);
  if (c.edge === "profile") {
    profLF = 2 * (+o.w + +o.h) + (N.div ? 2 * (N.div.V ? N.div.w : N.div.h) : 0);
    corners = 4 + (N.div ? 4 : 0);
    if (c.corner === "45") miters = corners * 2;
    profKey = `${type} ${fmtIn(size)}″${sizeCode(size) ? " (" + sizeCode(size) + ")" : ""}`;
  } else if (c.edge === "miter") miters = (N.comps.length ? 4 : 0) * 2;
  let shelfProf = null;
  if (N.shelf && c.shelf === "tile2") {
    const ss = autoSize(N.shelf.t);
    shelfProf = { key: `JOLLY ${fmtIn(ss)}″${sizeCode(ss) ? " (" + sizeCode(ss) + ")" : ""}`, lf: sw };
  }
  return { o, N, backP, strips, items, profLF, profKey, corners, miters, shelfProf, ncomp, sw, sd };
}

/* side view (vertical section through the niche center) */
function nicheSectionSVG(s, o) {
  const N = nicheParts(s, o),
    c = N.c,
    d = N.d,
    h = +o.h,
    wT = +s.tile.thick || 0.375,
    rT = +N.Tr.thick || 0.375,
    bT = +N.Tb.thick || 0.375,
    B = 0.5, // wall board
    ext = 4; // wall shown above/below
  const W = d + B + wT + NICHE_BOND + 6,
    Hh = h + 2 * ext;
  const sc = Math.min(300 / W, 320 / Hh),
    X = (x) => ((x + d + B + 1) * sc).toFixed(1), // x: 0 = wall board face, negative = into the wall
    Y = (y) => ((Hh - (y + ext)) * sc).toFixed(1); // y: 0 = niche bottom
  const R = (x0, y0, x1, y1, f, st = "#5b5348") =>
    `<rect x="${X(Math.min(x0, x1))}" y="${Y(Math.max(y0, y1))}" width="${(Math.abs(x1 - x0) * sc).toFixed(1)}" height="${(Math.abs(y1 - y0) * sc).toFixed(1)}" fill="${f}" stroke="${st}" stroke-width=".7"/>`;
  let g = "";
  const board = "#d9d2c3",
    tileW = "#ece5d7",
    tileB = "#cfe0f5",
    tileR = "#f3dcb4",
    bond = "#bdb7ad";
  // wall board above and below the niche, niche box
  g += R(-B, -ext, 0, 0, board) + R(-B, h, 0, h + ext, board);
  g += R(-d - B, -0.0, -d, h, board); // niche back board
  g += R(-d - B, -B, 0, 0, board) + R(-d - B, h, 0, h + B, board); // niche bottom / top board
  // wall tile above / below
  const wf = NICHE_BOND + wT;
  const wallIn = c.edge === "wall" ? rT + NICHE_BOND : 0; // wall tile laps over the return edges
  g += R(NICHE_BOND, -ext, wf, wallIn, tileW) + R(NICHE_BOND, h - wallIn, wf, h + ext, tileW);
  // back tile
  g += R(-d + NICHE_BOND, NICHE_BOND + rT, -d + NICHE_BOND + bT, h - NICHE_BOND - rT, N.own ? tileB : tileW);
  // returns (bottom / top), length = retW from the back tile face
  const r0 = -d + NICHE_BOND + bT,
    r1 = r0 + N.retW;
  g += R(r0, NICHE_BOND, r1, NICHE_BOND + rT, tileR) + R(r0, h - NICHE_BOND - rT, r1, h - NICHE_BOND, tileR);
  // shelf
  if (N.shelf) {
    const sy = N.shelf.y - +o.y,
      st = N.shelf.t,
      col = c.shelf === "metal" ? "#9aa3ad" : c.shelf === "stone" ? "#b9b1a4" : tileR;
    g += R(r0, sy, r1, sy + st, col);
    if (c.shelf === "miter") g += R(r1 - rT, sy - (+c.apron || 1.5) + st, r1, sy, tileR);
    if (c.shelf === "tile2") g += R(r1, sy - 0.1, r1 + 0.1, sy + st + 0.1, "#7f8690", "#7f8690");
  }
  // edges
  if (c.edge === "profile") {
    const ps = Math.max(0.25, autoSize(wT)),
      prof = (y, up) =>
        `<path d="M${X(0)} ${Y(y)}H${X(wf)}M${X(wf)} ${Y(y)}V${Y(up ? y + ps : y - ps)}" stroke="#7f8690" stroke-width="2.4" fill="none"/>`;
    g += prof(NICHE_BOND, false) + prof(h - NICHE_BOND, true);
  } else if (c.edge === "miter") {
    g += `<path d="M${X(wf)} ${Y(0)}L${X(NICHE_BOND)} ${Y(NICHE_BOND + rT)}M${X(wf)} ${Y(h)}L${X(NICHE_BOND)} ${Y(h - NICHE_BOND - rT)}" stroke="#b3261e" stroke-width="1.2"/>`;
  }
  // dims
  const dim = (x0, y0, x1, y1, txt, dx = 0, dy = 0) =>
    `<line x1="${X(x0)}" y1="${Y(y0)}" x2="${X(x1)}" y2="${Y(y1)}" stroke="#1d5fa8" stroke-width=".8"/><text x="${(+X((x0 + x1) / 2) + dx).toFixed(1)}" y="${(+Y((y0 + y1) / 2) + dy).toFixed(1)}" font-size="10" fill="#1d5fa8" text-anchor="middle" font-family="${FONT}">${txt}</text>`;
  g += dim(-d, h + ext * 0.75, 0, h + ext * 0.75, `${t("depth")} ${fmtIn(d)}″`, 0, -3);
  const ry = NICHE_BOND + rT + Math.min(2.2, h / 5);
  g += dim(r0, ry, r1, ry, `${t("nRetW")} ${fmtIn(N.retW)}″`, 0, -3);
  g += dim(wf + 1.2, 0, wf + 1.2, h, `${fmtIn(h)}″`, 14, 3);
  const Wpx = (W * sc + 10).toFixed(0),
    Hpx = (Hh * sc + 18).toFixed(0);
  g += `<text x="4" y="${(Hh * sc + 13).toFixed(1)}" font-size="9" fill="#6b665e" font-family="${FONT}">${t("nSecWall")}</text><text x="${+Wpx - 4}" y="${(Hh * sc + 13).toFixed(1)}" font-size="9" fill="#6b665e" text-anchor="end" font-family="${FONT}">${t("nSecFace")}</text>`;
  return `<svg viewBox="0 0 ${Wpx} ${Hpx}" width="100%" style="max-width:${Wpx}px;background:#fbfaf7;border:1px solid var(--line);border-radius:10px">${g}</svg>`;
}

/* niche settings dialog */
function nicheModal(si, j) {
  const s = P.surfaces[si],
    o = s && s.openings[j];
  if (!o) return;
  const c = nicheCfg(o, s),
    pre = `surfaces.${si}.openings.${j}`,
    nk = pre + ".nk";
  const S2 = (label, k, opts, fmt2, cls = "") => SEL(label, k, opts, 1, "p", cls, fmt2);
  let h = `<h3>🧱 ${t("nSettings")} — ${esc(s.name)}</h3>`;
  // type & size
  h += `<p class="nh">${t("nTypeT")}</p><div class="grid">${S2(t("nKind"), nk + ".kind", ["custom", "prefab"], (v) => t("nk_" + v), "w2")}`;
  if (c.kind === "prefab")
    h +=
      S2(t("nPre"), nk + ".pre", Object.keys(NICHE_PRE), (v) => v.replace("x", "″ × ") + "″") +
      CHK(t("nPreRot"), nk + ".preRot", 1, "p");
  else
    h +=
      F(t("width"), pre + ".w", "len", "p") +
      F(t("height"), pre + ".h", "len", "p") +
      F(t("depth"), pre + ".d", "len", "p");
  h += F(t("fromLeft"), pre + ".x", "len", "p") + F(t("fromBottom"), pre + ".y", "len", "p") + `</div>`;
  // form & shelf
  h += `<p class="nh">${t("nFormT")}</p><div class="grid">${S2(t("nForm"), nk + ".form", ["single", "shelf", "dblV", "dblH"], (v) => t("nf_" + v), "w2")}`;
  if (c.form === "shelf") {
    h += S2(t("nShelf"), nk + ".shelf", ["metal", "tile2", "miter", "stone"], (v) => t("ns_" + v), "w2");
    h += F(t("nShelfY"), nk + ".shelfY", "len", "p");
    if (c.shelf === "stone") h += F(t("nShelfT"), nk + ".shelfT", "len", "p");
    if (c.shelf === "miter") h += F(t("nApron"), nk + ".apron", "len", "p");
  }
  if (c.form === "dblV" || c.form === "dblH") h += F(t("nDiv"), nk + ".div", "len", "p");
  h += `</div>`;
  // edges
  h += `<p class="nh">${t("nEdgeT")}</p><div class="grid">${S2(t("nEdge"), nk + ".edge", ["profile", "miter", "wall", "ret"], (v) => t("ne_" + v), "w2")}`;
  if (c.edge === "profile") {
    const types = Object.keys(PROF).filter((k) => PROF[k].use === "edge");
    h += S2(t("schProfile"), nk + ".prof", ["inherit"].concat(types), (v) =>
      v === "inherit" ? t("asWall") : v,
    );
    h += S2(t("schSize"), nk + ".size", ["auto"].concat(PSIZES.map(String)), (v) =>
      v === "auto"
        ? `${t("autoV")} (${fmtIn(autoSize(+s.tile.thick || 0.375))}″)`
        : fmtIn(+v) + "″" + (sizeCode(+v) ? ` (${sizeCode(+v)})` : ""),
    );
    h += S2(t("nCorner"), nk + ".corner", ["45", "90", "piece"], (v) => t("nc_" + v), "w2");
  }
  h += `</div>`;
  // tiles
  const tileBlock = (key, title, allowBack) => {
    const q = c[key],
      kk = nk + "." + key;
    let b = `<p class="nh">${title}</p><div class="grid">${S2(t("nTileSrc"), kk + ".mode", allowBack ? ["wall", "back", "own"] : ["wall", "own"], (v) => t("nt_" + v), "w2")}`;
    if (q.mode === "own") {
      b +=
        F(t("tileW"), kk + ".w", "len", "p") +
        F(t("tileL"), kk + ".h", "len", "p") +
        F(t("grout"), kk + ".g", "len", "p") +
        F(t("thick"), kk + ".thick", "len", "p") +
        S2(t("pattern"), kk + ".pattern", ["grid", "offset"], (v) => t("p" + v)) +
        S2(t("nOrient"), kk + ".rot", ["false", "true"], (v) => t(v === "true" ? "nOr_v" : "nOr_h"));
      if (key === "back")
        b +=
          S2(t("nAlignX"), kk + ".ax", ["center", "joint", "left"], (v) => t("nax_" + v)) +
          S2(t("nAlignY"), kk + ".ay", ["bottom", "center", "top"], (v) => t("nay_" + v));
    }
    return b + `</div>`;
  };
  h += tileBlock("back", t("nBackT"), false) + tileBlock("ret", t("nRetT"), true);
  h += `<div class="grid">${optLen(t("nRetWm"), nk + ".retW", nicheParts(s, o).autoRet).replace('data-sc="s"', 'data-sc="p"')}</div>`;
  h += `<div id="nicheLive"></div>`;
  h += `<div class="btns"><button class="btn p" data-act="closeModal">${t("done")}</button><button class="btn d" data-act="delOpenP:${si}:${j}">${t("del")}</button></div>`;
  modal(h);
  S.reModal = () => {
    const sc = [...document.querySelectorAll("#modal, #modal *")]
      .filter((e) => e.scrollTop > 0)
      .map((e) => [e, e.scrollTop]);
    nicheModal(si, j);
    sc.forEach(([e, v]) => {
      const n = e.id ? document.getElementById(e.id) : e.isConnected ? e : null;
      if (n) n.scrollTop = v;
    });
  };
  S.modalLive = () => {
    const el = $("#nicheLive");
    if (el) el.innerHTML = nicheLiveHTML(s, o);
  };
  S.modalLive();
}
function nicheLiveHTML(s, o) {
  const R = compute(s),
    nc = (R.nicheCalc || []).find((q) => q.o === o);
  let h = `<p class="nh">${t("nSection")}</p>${nicheSectionSVG(s, o)}`;
  if (!nc) return h;
  const N = nc.N;
  h += `<p class="nh">${t("nResult")}</p><div class="hint" style="color:var(--ink)">`;
  h += `${t("nRetW")}: <b>${fmtIn(N.retW)}″</b> (${t("depth")} ${fmtIn(N.d)}″ − ${t("nBackTh")} ${fmtIn(N.bTh)}″${N.c.edge === "wall" ? "" : ` + ${t("nWallTh")} ${fmtIn(N.wTh)}″`})<br>`;
  const bp = nc.backP;
  h += `${t("nicheBack")}: <b>${bp.length}</b> ${t("pcs")} (${bp.filter((p) => p.full).length} ${t("full").toLowerCase()})${N.own ? " · " + tileDesc(N.Tb) : ""}<br>`;
  nc.strips.forEach((x) => (h += esc(stripTxt(x)) + "<br>"));
  if (nc.profLF)
    h += `Schluter ${esc(nc.profKey)}: <b>${fmt(nc.profLF)}</b> → ${Math.ceil(nc.profLF / 98.5)} ${t("sticks")} · ${nc.corners} ${t("nCorners")}${nc.miters ? ` · ${nc.miters} ${t("nMiterCuts")}` : N.c.corner === "piece" ? ` · ${nc.corners} ${t("nCornerPcs")}` : ""}<br>`;
  else if (nc.miters) h += `${t("ne_miter")}: ${nc.miters} ${t("nMiterCuts")}<br>`;
  if (nc.shelfProf)
    h += `Schluter ${esc(nc.shelfProf.key)} (${t("nShelf").toLowerCase()}): ${fmt(nc.shelfProf.lf)}<br>`;
  nc.items.forEach((it) => (h += `${t(it.k)}: <b>${it.n}</b> · ${esc(it.note)}<br>`));
  return h + `</div>`;
}

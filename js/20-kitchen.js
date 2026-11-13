"use strict";
/* ================= kitchen backsplash ================= */
/* A backsplash is a wall with s.bs = { on, gap, bottomFull, center, cmode, segs: [...] }.
   Segments run left → right along the countertop:
     cab    under an upper cabinet: tile from the counter up to the cabinet (h), minus the gap
     hood   over the range: up to the hood (h)
     open   no upper cabinet: up to h (ceiling or chosen height)
     window window area: up to h (usually the window head); the window itself is an opening
     skip   no tile (fridge, tall pantry)
   sl / hR: the cabinet is out of level — h is the height at the left end, hR at the right end.
   The segments become an ordinary "walk" polygon, so cuts, tapers, numbers and PDFs all work as on any wall. */
const BS_KINDS = ["cab", "hood", "open", "window", "skip"];
function bsDefault(W) {
  const w = Math.max(24, +W || 96);
  return {
    on: true,
    gap: "0.125",
    bottomFull: true,
    center: "auto",
    cmode: "tile",
    segs: [{ k: "cab", len: w, h: 18, sl: false, hR: 18 }],
  };
}
function bsTop(seg, gap) {
  if (seg.k === "skip") return [0, 0];
  const hl = Math.max(0, +seg.h || 0),
    hr = seg.sl ? Math.max(0, +seg.hR || 0) : hl,
    gp = seg.k === "cab" || seg.k === "hood" ? +gap || 0 : 0;
  return [Math.max(0, hl - gp), Math.max(0, hr - gp)];
}
function bsPoly(s) {
  const B = s.bs,
    segs = (B.segs || []).filter((q) => +q.len > 0);
  let x = 0;
  const top = [];
  segs.forEach((q) => {
    const [a, b] = bsTop(q, B.gap);
    top.push([x, a], [x + +q.len, b]);
    x += +q.len;
  });
  const W = x;
  const pts = [
    [0, 0],
    [W, 0],
  ];
  for (let i = top.length - 1; i >= 0; i--) pts.push(top[i]);
  // drop repeated points and points on a straight line
  const out = [];
  pts.forEach((p) => {
    const l = out[out.length - 1];
    if (!l || Math.hypot(p[0] - l[0], p[1] - l[1]) > 1e-6) out.push(p);
  });
  if (
    out.length > 1 &&
    Math.hypot(out[0][0] - out[out.length - 1][0], out[0][1] - out[out.length - 1][1]) < 1e-6
  )
    out.pop();
  return out;
}
function bsApply(s) {
  if (!s || !s.bs || !s.bs.on) return;
  const poly = bsPoly(s);
  if (poly.length < 3) return;
  const bb = bboxOf(poly);
  s.shape = "walk";
  s.segs = polyToSegs(poly);
  s.w = Math.round(bb.x1 * 1000) / 1000;
  s.h = Math.round(bb.y1 * 1000) / 1000;
  s.trim = { l: false, r: false, t: false, b: false };
}
// align after auto layout: full row / full sheet at the counter, center on the chosen segment
function bsAlign(s) {
  const B = s.bs;
  if (!B || !B.on) return;
  const T = effT(s);
  let ox = +T.ox || 0,
    oy = +T.oy || 0;
  if (B.bottomFull !== false) oy = 0;
  if (B.center !== "auto" && B.center != null && B.center !== "") {
    const i = +B.center,
      segs = B.segs || [];
    if (segs[i]) {
      let x0 = 0;
      for (let k = 0; k < i; k++) x0 += +segs[k].len || 0;
      const cx = x0 + (+segs[i].len || 0) / 2,
        unit = T.sheet && T.sheet.on ? +T.sheet.w || 12 : rdims(T).tw;
      ox = B.cmode === "joint" ? cx + (+T.g || 0) / 2 : cx - unit / 2;
    }
  }
  setO(s, ox, oy);
}
{
  const al = autoLayout;
  autoLayout = function (s) {
    al(s);
    if (s && s.bs && s.bs.on) bsAlign(s);
  };
}
function bsSection(s) {
  const B = s.bs,
    n = B.segs.length;
  let total = 0;
  B.segs.forEach((q) => (total += +q.len || 0));
  let b = `<p class="hint">${t("bsHint")}</p>`;
  B.segs.forEach((q, i) => {
    const p = `bs.segs.${i}`;
    b += `<div class="op"><div class="oph"><b>${i + 1}. ${t("bk_" + q.k)}</b><span class="btns" style="margin:0"><button class="btn sm" data-act="bsAdd:${i}">＋</button>${n > 1 ? `<button class="btn sm d" data-act="bsDel:${i}">✕</button>` : ""}</span></div><div class="grid">${SEL(t("bsKind"), p + ".k", BS_KINDS, 1, "s", "w2", (k) => t("bk_" + k))}${F(t("bsLen"), p + ".len")}`;
    if (q.k !== "skip") {
      b += F(
        q.sl ? t("bsHL") : t(q.k === "cab" ? "bsHcab" : q.k === "hood" ? "bsHhood" : "bsHtop"),
        p + ".h",
      );
      if (q.sl) b += F(t("bsHR"), p + ".hR");
      else b += `<div></div>`;
      b += `</div>${q.k === "cab" || q.k === "hood" ? CHK(t("bsSlope"), p + ".sl") : ""}`;
      if (q.k === "window")
        b += `<div class="btns"><button class="btn sm" data-act="bsWin:${i}">＋ ${t("window")}</button></div>`;
    } else b += `</div>`;
    b += `</div>`;
  });
  b += `<p class="hint">${t("bsTotal")}: <b>${fmt(total)}</b></p>`;
  b += `<div class="grid">${SEL(t("bsGap"), "bs.gap", ["0", "0.0625", "0.125"], 1, "s", "", (v) => (v === "0" ? "0" : fmtIn(+v) + "″"))}${SEL(
    t("bsCenter"),
    "bs.center",
    ["auto"].concat(B.segs.map((q, i) => String(i))),
    1,
    "s",
    "",
    (v) => (v === "auto" ? t("autoV") : `${+v + 1}. ${t("bk_" + B.segs[+v].k)}`),
  )}${B.center !== "auto" ? SEL(t("bsCmode"), "bs.cmode", ["tile", "joint"], 1, "s", "w2", (v) => t(v === "tile" ? "nax_center" : "nax_joint")) : ""}</div>`;
  b += CHK(t("bsBottomFull"), "bs.bottomFull", 1);
  b += `<div class="btns"><button class="btn p" data-act="bsLay">✦ ${t("bsLay")}</button><button class="btn" data-act="bsOff">${t("bsOff")}</button></div>`;
  return SEC("bs", `🍳 ${t("bsT")} · ${fmt(total)}`, b);
}
function bsAct(a, arg) {
  const s = cur();
  if (!s) return;
  if (a === "bsOn") {
    s.bs = bsDefault(s.w);
    bsApply(s);
    autoLayout(s);
    S.open.add("bs");
  } else if (!s.bs) return;
  else if (a === "bsAdd") s.bs.segs.splice(+arg + 1, 0, { k: "cab", len: 30, h: 18, sl: false, hR: 18 });
  else if (a === "bsDel") s.bs.segs.splice(+arg, 1);
  else if (a === "bsOff") {
    s.bs.on = false;
  } else if (a === "bsWin") {
    let x0 = 0;
    for (let k = 0; k < +arg; k++) x0 += +s.bs.segs[k].len || 0;
    const q = s.bs.segs[+arg],
      ww = Math.max(12, Math.min(36, +q.len - 4)),
      top = bsTop(q, s.bs.gap)[0];
    s.openings.push({
      id: uid(),
      type: "window",
      shape: "rect",
      x: x0 + (+q.len - ww) / 2,
      y: 4,
      w: ww,
      h: Math.max(6, top - 4),
      trim: true,
    });
  }
  if (a !== "bsLay") bsApply(s);
  if (a === "bsLay" || a === "bsAdd" || a === "bsDel" || a === "bsOn") autoLayout(s);
  renderPanel();
  changed();
}
// segment names over the drawing
function bsLabels(s, px) {
  const B = s.bs;
  if (!B || !B.on) return "";
  let x = 0,
    h = "";
  const f = +px(9.5),
    f2 = +px(11);
  B.segs.forEach((q) => {
    const L = +q.len || 0,
      [a, b] = bsTop(q, B.gap),
      y = Math.max(a, b),
      cx = (x + L / 2).toFixed(2),
      hh = q.k === "skip" ? "" : ` × ${fmtIn(+q.h)}${q.sl ? "–" + fmtIn(+q.hR) : ""}″`;
    if (L > 4) {
      h += `<text class="lbD" x="${cx}" y="${(-y - +px(6)).toFixed(2)}" font-size="${f2}" font-weight="700" text-anchor="middle" fill="${PAL.blue}" font-family="${FONT}" paint-order="stroke" stroke="${PAL.bg}" stroke-width="${px(3)}">${fmtIn(L)}″${hh}</text>`;
      if (L > 14)
        h += `<text class="lbD" x="${cx}" y="${(-y - +px(6) - f2 * 1.15).toFixed(2)}" font-size="${f}" text-anchor="middle" fill="#6b665e" font-family="${FONT}" paint-order="stroke" stroke="${PAL.bg}" stroke-width="${px(3)}">${esc(t("bk_" + q.k))}</text>`;
    }
    x += L;
  });
  return h;
}

/* ================= floating shelves ================= */
/* Opening type "shelf": the shelf itself doesn't cut tile; its bracket bolts do (holes through the tile). */
function shelfBolts(o) {
  const n = Math.max(1, Math.round(+o.brk || (+o.w > 40 ? 3 : 2))),
    per = Math.max(1, Math.round(+o.bper || 2)),
    dia = +o.bdia || 0.5,
    m = Math.min(6, (+o.w || 24) / 4),
    out = [];
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? +o.x + +o.w / 2 : +o.x + m + ((+o.w - 2 * m) * i) / (n - 1);
    for (let j = 0; j < per; j++) {
      const y = +o.y + +o.h / 2 + (per === 1 ? 0 : (j - (per - 1) / 2) * Math.min(1.5, +o.h / per));
      out.push({ type: "bolt", shape: "circle", x, y, dia, parent: o });
    }
  }
  return out;
}

/* ================= mosaic inserts ================= */
/* T.ins = { on, rule: rows|cols|diag|checker|dots|pct, n, pct, col, name } marks some chips as inserts (brass…). */
function markInserts(R, T) {
  const I = T.ins;
  if (!I || !I.on || !R.main) return;
  const ps = R.main.concat(R.nich || []);
  if (!ps.length) return;
  const med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const pw = med(ps.map((p) => p.lw)) + (+T.g || 0),
    ph = med(ps.map((p) => p.lh)) + (+T.g || 0),
    ox = +T.ox || 0,
    oy = +T.oy || 0,
    n = Math.max(2, Math.round(+I.n || 3)),
    pct = Math.max(1, Math.min(90, +I.pct || 10));
  let cnt = 0,
    cut = 0;
  ps.forEach((p) => {
    const c = Math.floor((p.x0 + p.lw / 2 - ox) / pw),
      r = Math.floor((p.y0 + p.lh / 2 - oy) / ph);
    let on = false;
    if (I.rule === "rows") on = mod(r, n) === 0;
    else if (I.rule === "cols") on = mod(c, n) === 0;
    else if (I.rule === "diag") on = mod(r + c, n) === 0;
    else if (I.rule === "checker") on = mod(r + c, 2) === 0;
    else if (I.rule === "dots") on = mod(r, n) === 0 && mod(c, n) === 0;
    else on = (((r * 73856093) ^ (c * 19349663)) >>> 0) % 100 < pct;
    p.ins = on ? 1 : 0;
    if (on) {
      cnt++;
      if (!p.full) cut++;
    }
  });
  R.insN = cnt;
  R.insCut = cut;
}
function insBlock(T) {
  const I = (T.ins = T.ins || { on: false, rule: "rows", n: 3, pct: 10, col: "#c8a24a", name: "" });
  let b = `<p style="margin:12px 0 4px"><b>✨ ${t("insT")}</b></p>${CHK(t("insOn"), "tile.ins.on", 1)}`;
  if (I.on)
    b += `<div class="grid">${SEL(t("insRule"), "tile.ins.rule", ["rows", "cols", "diag", "checker", "dots", "pct"], 1, "s", "w2", (v) => t("ir_" + v))}${
      I.rule === "pct"
        ? F(t("insPct"), "tile.ins.pct", "num")
        : I.rule === "checker"
          ? ""
          : F(t("insN"), "tile.ins.n", "num")
    }${F(t("insName"), "tile.ins.name", "text")}<label class="f"><span>${t("insCol")}</span><input type="color" data-t="text" data-k="tile.ins.col" value="${esc(I.col || "#c8a24a")}"></label></div>`;
  return b;
}

/* ================= mosaic sheet from a photo ================= */
function msheetModal() {
  const s = cur();
  if (!s) return;
  const T = s.tile;
  S.msd = S.msd || { w: 12, h: 12, g: 0.0625, minChip: 0.5, thick: 0.375 };
  modal(
    `<h3>🧩 ${t("msT")}</h3><p class="hint">${t("msHint")}</p><div class="grid">${F(t("msW"), "w", "len", "m")}${F(t("msH"), "h", "len", "m")}${F(t("msG"), "g", "len", "m")}${F(t("msMin"), "minChip", "len", "m")}${F(t("thick"), "thick", "len", "m")}</div><div class="btns"><button class="btn p" data-act="msGo">📷 ${t("msGo")}</button><button class="btn" data-act="closeModal">${t("cancel")}</button></div>`,
  );
}
async function msheetGo() {
  const s = cur(),
    D = S.msd;
  if (!s || !D) return;
  const T = s.tile;
  Object.assign(T, {
    shape: "rect",
    pattern: "grid",
    rot: false,
    w: +D.w || 12,
    h: +D.h || 12,
    g: +D.g || 0.0625,
    thick: +D.thick || 0.375,
    msheet: true,
    minChip: +D.minChip || 0.5,
    sheet: { on: false, w: 12, h: 12 },
  });
  closeModal();
  autoLayout(s);
  renderPanel();
  changed();
  texAct("texPick");
}
function kitchenAct(a, arg) {
  if (/^bs/.test(a)) return bsAct(a, arg);
  if (a === "msOpen") return msheetModal();
  if (a === "msGo") return msheetGo();
  if (a === "msOff") {
    const s = cur();
    if (s) delete s.tile.msheet;
    renderPanel();
    return changed();
  }
}

{
  const c0 = compute;
  compute = function (s) {
    const R = c0(s);
    if (R && R.T && R.T.ins && R.T.ins.on) markInserts(R, R.T);
    return R;
  };
}

/* outlets on tiled walls: the box must come out to the new face */
function ringHint(s) {
  const d = (+s.tile.thick || 0.375) + 0.1875; // tile + thinset
  const std = [0.25, 0.5, 0.625, 0.75, 1, 1.5].find((x) => x >= d - 0.01) || 1.5;
  return `${t("ringHint")} ≥ ${fmtIn(d)}″ → ${fmtIn(std)}″`;
}

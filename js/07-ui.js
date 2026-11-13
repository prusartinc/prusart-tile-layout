"use strict";
/* ================= UI render ================= */
// input scopes: s surface, p project, d device DB, w surface wizard, n/h new-project drafts, x app state, m mosaic draft
const SCOPES = {
  p: () => P,
  d: () => DB,
  w: () => S.wiz,
  n: () => S.np,
  h: () => S.nh,
  x: () => S,
  m: () => S.msd,
};
const scopeBase = (sc) => (SCOPES[sc] ? SCOPES[sc]() : cur());
const ICON = { floor: "▦", wall: "▥", pan: "◫" };
function renderHeader() {
  $("#hT").textContent = P.name || t("app");
  $("#hS").textContent = t("app") + (P.client ? " · " + P.client : "");
  $("#bLang").textContent = lang === "ru" ? "EN" : "RU";
  $("#bProj").textContent = "⌂";
  $("#bProj").title = t("projects");
  $("#bImg").textContent = "⤓";
  $("#bImg").title = t("image");
  $("#bCli").textContent = S.client ? t("exitClient") : t("client");
}
function renderTabs() {
  const nw = P.surfaces.filter((s) => s.type === "wall").length,
    nf = P.surfaces.filter((s) => s.type !== "wall").length;
  $("#tabs").innerHTML =
    `<button data-act="surfList" class="lst" title="${t("mSurfs")}">☰</button>` +
    (nw >= 2
      ? `<button data-act="all" class="all ${S.tab === "all" ? "on" : ""}">▥▥ ${t("allWalls")}</button>`
      : "") +
    (nf >= 2
      ? `<button data-act="floorTab" class="all ${S.tab === "floor" ? "on" : ""}">▦▦ ${t("allFloor")}</button>`
      : "") +
    P.surfaces
      .map(
        (s, i) =>
          `<button data-act="tab:${i}" class="${S.tab === i ? "on" : ""}">${ICON[s.type] || ""} ${esc(s.name)}</button>`,
      )
      .join("") +
    `<button data-act="tot" class="${S.tab === "tot" ? "on" : ""}">Σ ${t("totals")}</button>` +
    (S.client ? "" : `<button data-act="addMenu" class="add">${t("addSurf")}</button>`);
}
function renderTools() {
  const ml = { tiles: t("moveTiles"), view: t("moveView"), lock: t("moveLock") }[S.mode];
  $("#tools").innerHTML =
    (S.client
      ? ""
      : `<button data-act="mode" class="${S.mode === "tiles" ? "on" : ""}">${ml}</button><button data-act="${S.tab === "all" ? "autoAll" : S.tab === "floor" ? "autoFloor" : "auto"}">${t("auto")}</button>${S.tab === "floor" ? `<button data-act="zoneMove" class="${S.zoneMove ? "on" : ""}" title="${t("zonesB")}">⤧<span class="wl"> ${t("zonesB")}</span></button>` : ""}${S.site ? `<button data-act="site" class="on">👷 ${t("siteOff")}</button>` : `<button data-act="more">⋯ ${t("moreB")}</button>`}`) +
    `<span class="sp"></span>${S.client ? "" : `<button data-act="undo" title="${t("undoW")}">↶</button><button data-act="redo">↷</button>`}<button data-act="fit" title="${t("mFit")}">⤢</button><button data-act="full" class="${S.full ? "on xbig" : ""}" title="${S.full ? t("close") : t("mFull")}">${S.full ? "✕" : "⛶"}</button>`;
  renderLayers();
  renderPad();
}
function layerSurfs() {
  return typeof S.tab === "number"
    ? [P.surfaces[S.tab]].filter(Boolean)
    : S.tab === "floor"
      ? P.surfaces.filter((x) => x.type !== "wall")
      : S.tab === "all"
        ? P.surfaces.filter((x) => x.type === "wall")
        : [];
}
function renderLayers() {
  const el = $("#layers");
  if (!el) return;
  const hw = layerSurfs().some((x) => x.heat && x.heat.on);
  if (S.layer === "wire" && !hw) S.layer = "tile";
  el.innerHTML = ["prep", "tile"]
    .concat(hw ? ["wire"] : [])
    .map(
      (k) => `<button data-act="layer:${k}" class="${S.layer === k ? "on" : ""}">${t("lay_" + k)}</button>`,
    )
    .join("");
}
function renderSbar() {
  const el = $("#sbar");
  if (!el) return;
  const s = cur(),
    show = canEdit() && !!s && !isMulti() && !S.site;
  el.style.display = show ? "flex" : "none";
  if (!show) return;
  const B = (act, ic, lb, cls = "") =>
    `<button class="${cls}" data-act="${act}" title="${lb}">${ic}<small>${lb}</small></button>`;
  el.innerHTML =
    (s.shape === "rect" ? B("quickSize", "📐", t("qSize")) : "") +
    B("quickTile", "▦", t("qTile")) +
    B("clearSurf", "⌫", t("qClear")) +
    B("delSurfQ", "🗑", t("qDel"), "d");
}
function renderPad() {
  renderSbar();
  const el = $("#pad");
  if (!el) return;
  const show =
    canEdit() &&
    S.mode === "tiles" &&
    ((S.layer === "tile" && (cur() || isMulti())) || (S.layer === "prep" && !!cur()));
  el.style.display = show ? "grid" : "none";
  if (show) {
    const b = el.querySelector(".stp");
    if (b) b.textContent = fmtIn(S.step) + "″";
  }
}
function renderLegend() {
  $("#legend").innerHTML =
    [
      ["full", "legFull"],
      ["cut", "legCut"],
      ["warn", "legWarn"],
      ["bad", "legBad"],
    ]
      .map(
        ([c, k]) =>
          `<span><i style="background:${COL[c]}"></i>${t(k)}${c === "bad" ? " (" + fmt(+P.minCut) + ")" : ""}</span>`,
      )
      .join("") +
    `<span><i style="background:#c9bfae"></i>${t("legNiche")}</span><span><i style="background:#c3c8d0"></i>Schluter</span>`;
}
function aggItems() {
  const a = { full: 0, cuts: 0, need: 0, order: 0, minc: 1e9, bad: 0, sheets: 0 };
  for (const it of S.items) {
    const r = it.R;
    a.full += r.full;
    a.cuts += r.cuts;
    a.need += r.need;
    a.order += r.order;
    a.minc = Math.min(a.minc, r.minc);
    a.bad += r.bad;
  }
  return a;
}
function renderStat() {
  const el = $("#stat");
  if (isMulti()) {
    if (!S.items.length) {
      el.innerHTML = "";
      return;
    }
    const a = aggItems();
    el.innerHTML = `<span>${t("full")} <b>${a.full}</b></span><span>${t("cuts")} <b>${a.cuts}</b></span><span class="${a.bad ? "bad" : ""}">${t("minCut")} <b>${a.minc < 1e8 ? fmt(a.minc) : "—"}</b></span><span>${t("need")} <b>${a.need}</b></span><span>${t("order")} <b>${a.order}</b></span>`;
    if (S.client) renderClient();
    return;
  }
  if (!R || !cur()) {
    el.innerHTML = R === null && cur() ? `<span class="bad">${t("tooMany")}</span>` : "";
    return;
  }
  if (S.layer === "prep") {
    el.innerHTML = prepSummary(cur(), R);
    renderPrepRes();
    return;
  }
  const sheet = (R.T.sheet && R.T.sheet.on) || R.sheetLevel;
  el.innerHTML = sheet
    ? `<span>${t("sheets")} <b>${R.sheets}</b></span><span>${t("order")} <b>${R.order}</b></span><span>${t("area")} <b>${sq(R.area)}</b></span>`
    : `<span>${t("full")} <b>${R.full}</b></span><span>${t("cuts")} <b>${R.cuts}</b></span><span class="${R.bad ? "bad" : ""}">${t("minCut")} <b>${R.minc < 1e8 ? fmt(R.minc) : "—"}</b></span><span>${t("need")} <b>${R.need}</b></span><span>${t("order")} <b>${R.order}</b></span>`;
  el.innerHTML += `<span class="more">${S.statX ? "▴" : "▾"}</span>` + (S.statX ? statDetails(R, cur()) : "");
  if (S.client) renderClient();
}
function patName(T) {
  const p = patOf(T);
  let n = p === "hex" ? t("shex") : p === "chevron" ? t("schevron") : t("p" + p);
  if (p === "offset" || p === "voffset") n += " " + Math.round(+T.off * 100) + "%";
  if (+T.ang) n += ", " + +T.ang + "°";
  if (T.checker) n += ", " + t("checker");
  return n;
}
function renderClient() {
  const el = $("#clientCard");
  if (isMulti()) {
    const ws = S.items
      .map(
        (it) =>
          `<b>${esc(it.s.name)}</b> — ${fmt(it.R.G.bb.x1 - it.R.G.bb.x0)} × ${fmt(it.R.G.bb.y1 - it.R.G.bb.y0)}`,
      )
      .join("<br>");
    const T = S.items[0] ? S.items[0].R.T : null;
    el.innerHTML = `<div class="cc">${ws}${T ? `<br>${t("tile")}: ${esc(tileDesc(T))}, ${esc(patName(T))}, ${t("grout")} ${fmt(+T.g)}` : ""}</div>`;
    return;
  }
  const s = cur();
  if (!s || !R) {
    el.innerHTML = "";
    return;
  }
  const T = R.T;
  el.innerHTML = `<div class="cc"><b>${esc(s.name)}</b> — ${fmt(R.G.bb.x1 - R.G.bb.x0)} × ${fmt(R.G.bb.y1 - R.G.bb.y0)}<br>${t("tile")}: ${esc(tileDesc(T))}, ${esc(patName(T))}, ${t("grout")} ${fmt(+T.g)}<br>${R.lf > 0 ? `Schluter ${esc(edgeProf(s).key)}<br>` : ""}${t("area")}: ${sq(R.area)}</div>`;
}

const F = (label, k, ty = "len", sc = "s", cls = "") => {
  const base = scopeBase(sc);
  let v;
  if (k === "_ox" || k === "_oy") v = offs(cur())[k === "_ox" ? "x" : "y"];
  else if (k === "_offp") v = Math.round(+cur().tile.off * 1000) / 10;
  else v = getPath(base, k);
  const val = ty === "len" || ty === "slen" ? fmtIn(v) : ty === "num" ? (v == null ? "" : v) : esc(v);
  return `<label class="f ${cls}"><span>${label}</span><input data-k="${k}" data-sc="${sc}" data-t="${ty}" value="${val}" autocomplete="off" ${ty === "num" ? 'inputmode="decimal"' : ""}></label>`;
};
const SEL = (label, k, opts, rb, sc = "s", cls = "", lab) => {
  const base = scopeBase(sc);
  const v = getPath(base, k);
  return `<label class="f ${cls}"><span>${label}</span><select data-k="${k}" data-sc="${sc}" data-t="sel" ${rb ? 'data-rb="1"' : ""}>${opts.map((o) => `<option value="${o}" ${o === v ? "selected" : ""}>${esc(lab ? lab(o) : t(o === "L" ? "Lshape" : o))}</option>`).join("")}</select></label>`;
};
const CHK = (label, k, rb, sc = "s") => {
  const base = scopeBase(sc);
  return `<label class="c"><input type="checkbox" data-k="${k}" data-sc="${sc}" data-t="chk" ${getPath(base, k) ? "checked" : ""} ${rb ? 'data-rb="1"' : ""}>${label}</label>`;
};
const SEC = (id, title, body) =>
  `<details data-sec="${id}" ${S.open.has(id) ? "open" : ""}><summary>${title}</summary><div class="bd">${body}</div></details>`;
function offs(s) {
  const T = effT(s),
    G = geom(s),
    per = periodOf(T) || {};
  return {
    x: per.x ? mod(T.ox - G.rb.x0, per.x) : T.ox - G.rb.x0,
    y: per.y ? mod(T.oy - G.rb.y0, per.y) : T.oy - G.rb.y0,
  };
}
function syncOff() {
  const s = cur();
  if (!s) return;
  document.querySelectorAll('#panel [data-k="_ox"],#panel [data-k="_oy"]').forEach((el) => {
    if (document.activeElement === el) return;
    const o = offs(s);
    el.value = fmtIn(el.dataset.k === "_ox" ? o.x : o.y);
    el.classList.remove("bad");
  });
}

function tileSection(s) {
  const T = s.tile,
    pat = patOf(T),
    sh = T.shape,
    { tw, th } = rdims(T);
  let b = `<div class="btns"><button class="btn p w" data-act="gallery">${t("gallery")}</button></div><div class="grid">${SEL(t("tileShape"), "tile.shape", ["rect", "hex", "penny", "chevron"], 1, "s", "w2", (o) => t("s" + o))}`;
  if (sh === "rect")
    b += SEL(
      t("pattern"),
      "tile.pattern",
      ["grid", "offset", "voffset", "herring", "basket", "pinwheel"],
      1,
      "s",
      "w2",
      (o) => t("p" + o),
    );
  if (sh === "penny")
    b += SEL(t("pattern"), "tile.pattern", ["grid", "offset"], 1, "s", "w2", (o) => t("p" + o));
  if (sh === "rect" && pat === "pinwheel") b += F(t("bigSq"), "tile.w") + F(t("smallSq"), "tile.w2");
  else if (sh === "rect") b += F(t("tileW"), "tile.w") + F(t("tileL"), "tile.h");
  if (sh === "hex") b += F(t("hexW"), "tile.w", "len", "s", "w2");
  if (sh === "penny") b += F(t("pennyD"), "tile.w", "len", "s", "w2");
  if (sh === "chevron")
    b += F(t("chevW"), "tile.w") + F(t("chevH"), "tile.h") + F(t("chevA"), "tile.cang", "num");
  b += F(t("thick"), "tile.thick");
  b += `<div class="w2">${F(t("grout"), "tile.g")}<div class="chips">${[1 / 16, 1 / 8, 3 / 16, 1 / 4].map((g) => `<button class="btn sm" data-act="grout:${g}">${fmtIn(g)}</button>`).join("")}</div></div>`;
  if (pat === "offset" || pat === "voffset")
    b += `<div class="w2">${F(t("offPct"), "_offp", "num")}<div class="chips">${[
      [1 / 2, "1/2"],
      [1 / 3, "1/3"],
      [1 / 4, "1/4"],
      [0.2, "20%"],
    ]
      .map(
        ([v, l]) =>
          `<button class="btn sm ${Math.abs(T.off - v) < 1e-6 ? "p" : ""}" data-act="off:${v}">${l}</button>`,
      )
      .join("")}</div><div class="chips" style="margin-top:6px">${[
      ["r", "dirR"],
      ["l", "dirL"],
      ["a", "dirA"],
    ]
      .map(
        ([v, k]) =>
          `<button class="btn sm ${(T.offDir || "r") === v ? "p" : ""}" data-act="offDir:${v}">${t(k)}</button>`,
      )
      .join("")}</div></div>`;
  b += `<div class="w2">${F(t("angle"), "tile.ang", "num")}<div class="chips">${[0, 45, 90, 30, 60].map((a) => `<button class="btn sm ${+T.ang === a ? "p" : ""}" data-act="ang:${a}">${a}°</button>`).join("")}</div></div></div>`;
  if (sh === "rect" || sh === "hex")
    b += `<div class="btns"><button class="btn" data-act="rotate">${t("rotate")}</button></div>`;
  if (sh === "rect" && pat !== "pinwheel")
    b += `<p class="hint">${t("orient")}: <b>${fmtIn(tw)} × ${fmtIn(th)}</b> (${tw >= th ? t("horiz") : t("vert")})</p>`;
  if (pat === "basket") {
    const L = Math.max(tw, th),
      W = Math.min(tw, th),
      g = +T.g,
      n = Math.round((L + g) / (W + g));
    if (Math.abs(L - (n * W + (n - 1) * g)) > 0.07) b += `<div class="note">${t("basketWarn")}</div>`;
  }
  if (sh === "rect" && (pat === "grid" || pat === "offset")) b += CHK(t("checker"), "tile.checker");
  b += CHK(t("sheetOn"), "tile.sheet.on", 1);
  if (T.sheet.on)
    b += `<div class="grid">${F(t("sheetW"), "tile.sheet.w")}${F(t("sheetH"), "tile.sheet.h")}</div>`;
  b += `<div class="grid" style="margin-top:6px">${F(t("sqftBox"), "tile.sqftBox", "num")}</div>${CHK(t("stoneOn"), "tile.stone")}<div class="btns">${T.msheet ? `<span class="hint">🧩 ${t("msOnHint")} ${fmtIn(+T.w)}×${fmtIn(+T.h)}</span><button class="btn sm" data-act="msOff">✕</button>` : `<button class="btn sm" data-act="msOpen">🧩 ${t("msT")}</button>`}</div>${insBlock(T)}<div class="grid">${F(t("libPrice"), "tile.price", "num")}</div>${texBlock(T)}<div class="btns"><button class="btn" data-act="lib">📚 ${t("lib")}</button><button class="btn" data-act="libSave">＋ ${t("libSaveCur")}</button><button class="btn" data-act="applyAll">${t("applyAll")}</button></div>`;
  return SEC("tile", `${t("tile")} · ${T.name ? esc(T.name) + " · " : ""}${esc(tileDesc(T))}`, b);
}

function openingCard(o, i) {
  const circ = o.shape === "circle",
    types = Object.keys(OPT);
  let b = `<div class="op"><div class="grid">${SEL(t("type"), `openings.${i}.type`, types, 1, "s", "w2")}`;
  if (circ)
    b += F(t("cx"), `openings.${i}.x`) + F(t("cy"), `openings.${i}.y`) + F(t("dia"), `openings.${i}.dia`);
  else
    b +=
      F(t("fromLeft"), `openings.${i}.x`) +
      F(t("fromBottom"), `openings.${i}.y`) +
      F(t("width"), `openings.${i}.w`) +
      F(t("height"), `openings.${i}.h`);
  if (o.type === "niche") b += F(t("depth"), `openings.${i}.d`);
  if (o.type === "shelf")
    b +=
      F(t("shBrk"), `openings.${i}.brk`, "num") +
      F(t("shPer"), `openings.${i}.bper`, "num") +
      F(t("shDia"), `openings.${i}.bdia`);
  if (o.type === "toilet" && cur().type !== "wall")
    b +=
      SEL(t("tFace"), `openings.${i}.face`, ["auto", "u", "d", "l", "r"], 1, "s", "w2", (k) => t("tf_" + k)) +
      optLen(t("tFront"), `openings.${i}.front`, 18) +
      optLen(t("tWidth"), `openings.${i}.tw`, 20);
  b += "</div>";
  if (TRIMMABLE[o.type] && o.type !== "niche") b += CHK(t("trimmed"), `openings.${i}.trim`);
  if (o.type === "shelf") b += `<p class="hint">${t("shHint")}</p>`;
  if (o.type === "outlet" && cur().type === "wall") b += `<p class="hint">${ringHint(cur())}</p>`;
  if (o.type === "niche") {
    const c = nicheCfg(o, cur());
    b += `<p class="hint">${[t("nk_" + c.kind), t("nf_" + c.form), c.form === "shelf" ? t("ns_" + c.shelf) : "", t("ne_" + c.edge), c.back.mode === "own" ? t("nBackT") + ": " + fmtIn(+c.back.w) + "×" + fmtIn(+c.back.h) : ""].filter(Boolean).join(" · ")}</p>`;
  }
  b += `<div class="btns">${o.type === "niche" ? `<button class="btn sm p" data-act="nicheCfg:${i}">⚙ ${t("nSettings")}</button><button class="btn sm" data-act="snap:${i}">${t("snap")}</button>` : ""}<button class="btn sm d" data-act="delOpen:${i}">${t("del")}</button></div></div>`;
  return b;
}

const TURNS = [90, -90, 45, -45, 135, -135, 60, -60, 30, -30, 120, -120, 150, -150];
function walkEditor(s) {
  const wk = walkPoly(s);
  let h = `<p class="hint" style="margin-top:8px">${t("walkHint")}</p>`;
  h += s.segs
    .map((g, i) => {
      const std = TURNS.includes(+g.a);
      return `<div class="op" style="padding:8px;margin:6px 0"><div class="grid" style="grid-template-columns:1fr 1fr auto;align-items:end">${F(t("wallN") + " " + (i + 1), `segs.${i}.l`)}
 <label class="f"><span>${t("turn")}</span><select data-k="segs.${i}.a" data-sc="s" data-t="selnum" data-rb="1">${TURNS.map((a) => `<option value="${a}" ${+g.a === a ? "selected" : ""}>${a > 0 ? "↰ " + t("left") : "↱ " + t("right")} ${Math.abs(a)}° · ${t("cornerA")} ${180 - Math.abs(a)}°</option>`).join("")}<option value="custom" ${std ? "" : "selected"}>${t("other")}</option></select></label>
 <button class="btn sm d" data-act="delSeg:${i}" style="margin-bottom:4px">✕</button></div>${std ? "" : F(t("turnDeg"), `segs.${i}.a`, "num")}</div>`;
    })
    .join("");
  h += `<div class="btns"><button class="btn" data-act="addSeg">${t("addSeg")}</button></div>`;
  if (wk.gap > 0.1)
    h += `<div class="note">${t("walkGap")} ${fmt(wk.gap)} <button class="btn sm" data-act="closeWalk">${t("closeWalk")}</button></div>`;
  return h;
}
function optLen(label, k, auto) {
  const v = getPath(cur(), k);
  return `<label class="f"><span>${label}</span><input data-k="${k}" data-sc="s" data-t="len" data-opt="1" value="${v != null && v !== "" ? fmtIn(+v) : ""}" placeholder="${t("autoV")} ${fmtIn(auto)}" autocomplete="off"></label>`;
}
function underSel(label, k, cls) {
  const v = getPath(cur(), k) || "none";
  const grp = { heat: t("ug_heat"), mem: t("ug_mem"), board: t("ug_board"), ply: t("ug_ply") };
  let o = `<option value="none" ${v === "none" ? "selected" : ""}>— ${t("noUnder")}</option>`;
  for (const g of ["heat", "mem", "board", "ply"]) {
    const it = underList().filter((u) => u.k === g);
    if (!it.length) continue;
    o +=
      `<optgroup label="${esc(grp[g])}">` +
      it
        .map(
          (u) =>
            `<option value="${u.id}" ${u.id === v ? "selected" : ""}>${esc(u.n)} · ${fmtIn(u.t)}″</option>`,
        )
        .join("") +
      "</optgroup>";
  }
  return `<label class="f ${cls || ""}"><span>${label}</span><select data-k="${k}" data-sc="s" data-t="sel" data-rb="1">${o}</select></label>`;
}
function stackSection(s) {
  const st = stackOf(s);
  return SEC("stack", `${t("stackT")} · ${fmt(st.total)}`, stackBody(s));
}
function stackBody(s) {
  s.stack = s.stack || { under: "none", under2: "none", ub: null, tb: null };
  const st = stackOf(s);
  let b = `<div class="grid">${underSel(t("underTop"), "stack.under", "w2")}${underSel(t("underLow"), "stack.under2", "w2")}${optLen(t("bondUnder"), "stack.ub", st.ub)}${optLen(t("bondTile"), "stack.tb", st.tb)}</div>`;
  b += `<table style="margin-top:8px">${st.L.slice()
    .reverse()
    .map(
      (l) =>
        `<tr><td><span class="sw" style="background:${l.c}"></span>${esc(l.n)}</td><td class="n">${fmtIn(l.t)}″</td></tr>`,
    )
    .join("")}<tr><td><b>${t("buildUp")}</b></td><td class="n"><b>${fmt(st.total)}</b></td></tr></table>`;
  if (s.shape === "rect" && s.type === "wall") {
    s.prep = s.prep || { l: 0, r: 0, b: 0, t: 0 };
    b += `<p style="margin:10px 0 2px"><b>${t("prepExt")}</b></p><div class="grid">${F(t("pe_l"), "prep.l")}${F(t("pe_r"), "prep.r")}${F(t("pe_b"), "prep.b")}${F(t("pe_t"), "prep.t")}</div><p class="hint">${t("prepExtHint")}</p>`;
  }
  const bo = boardOf(s);
  if (bo) {
    s.stack.bsize = s.stack.bsize || bSizeOf(s, bo);
    b += `<div class="grid">${SEL(t("bSize"), "stack.bsize", ["3x5", "4x8"], 1, "s", "w2", (o) => o.replace("x", "×") + " ft")}</div>`;
  }
  if (st.u.k !== "none" || bo) {
    s.prepO = s.prepO || { x: 0, y: 0 };
    b += `<p style="margin:10px 0 2px"><b>${t("prepLay")}</b></p><div class="grid">${SEL(t("bDir"), "stack.bdir", ["auto", "h", "v"], 1, "s", "w2", (o) => t(o === "auto" && s.type !== "wall" && (s.joist || "none") !== "none" ? "bd_joist" : "bd_" + o))}`;
    if (s.type !== "wall") {
      if (s.joistSp == null) s.joistSp = 16;
    }
    if (s.type !== "wall")
      b +=
        SEL(t("joist"), "joist", ["none", "h", "v"], 1, "s", "", (o) => t("jo_" + o)) +
        ((s.joist || "none") !== "none" ? F(t("joistSp"), "joistSp") : "<div></div>");
    b += `${F(t("prepOx"), "prepO.x", "slen")}${F(t("prepOy"), "prepO.y", "slen")}</div><p class="hint">${t("prepMoveHint")}</p><div class="btns"><button class="btn sm" data-act="prepReset">${t("prepReset")}</button></div>`;
  }
  if (st.u.chk) b += `<p class="hint">${t("chkSpec")}</p>`;
  b += `<p class="hint">${t("stackHint")}</p><div class="btns"><button class="btn sm" data-act="addUnder">${t("addUnder")}</button></div>`;
  return b;
}
function prepSection(s) {
  const u = underOf((s.stack || {}).under || "none"),
    u2 = underOf((s.stack || {}).under2 || "none"),
    nm = [u2, u].filter((x) => x.k !== "none").map((x) => esc(x.n));
  return SEC(
    "prep",
    `🧱 ${t("lay_prep")} · ${nm.length ? nm.join(" + ") : t("noPrep")}`,
    stackBody(s) +
      `<p style="margin:12px 0 4px"><b>${t("prepRes")}</b></p><div id="prepres" class="prepres"></div>`,
  );
}
function renderPrepRes() {
  const el = $("#prepres");
  if (!el) return;
  const s = cur();
  if (!s || !R) {
    el.innerHTML = "";
    return;
  }
  let h = prepSummary(s, R);
  const pp = prepPlan(s, R);
  if (pp && pp.kind === "sheet") {
    const cr = prepCutRows(pp);
    if (cr.length)
      h += `<table>${cr.map((c) => `<tr><td>${c.full ? t("fullSheet") : c.k}</td><td class="n"><b>${c.n}</b> ${t("pcs")}</td></tr>`).join("")}</table>`;
  }
  if (pp && pp.kind === "roll")
    h += `<table>${pp.strips.map((q, i) => `<tr><td>${t("stripN")} ${i + 1}</td><td class="n"><b>${ftin(q.b1 - q.b0)}</b></td></tr>`).join("")}</table>`;
  el.innerHTML = h;
}
function profFields(s) {
  s.prof = s.prof || { type: "inherit", size: "auto", vis: null };
  const ep = edgeProf(s);
  const types = Object.keys(PROF).filter((k) => PROF[k].use === "edge");
  const tsel = `<label class="f"><span>${t("profType")}</span><select data-k="prof.type" data-sc="s" data-t="sel" data-rb="1"><option value="inherit" ${s.prof.type === "inherit" ? "selected" : ""}>${t("profDefault")} (${esc(P.sch.type || "JOLLY")})</option>${types.map((k) => `<option ${s.prof.type === k ? "selected" : ""}>${k}</option>`).join("")}</select></label>`;
  const ssel = `<label class="f"><span>${t("profSize")}</span><select data-k="prof.size" data-sc="s" data-t="sel" data-rb="1"><option value="auto" ${s.prof.size === "auto" ? "selected" : ""}>${t("autoV")}: ${fmtIn(autoSize(+s.tile.thick || 0.375))}″</option>${PSIZES.map(([v, c]) => `<option value="${v}" ${String(s.prof.size) === String(v) ? "selected" : ""}>${fmtIn(v)}″ (${c})</option>`).join("")}</select></label>`;
  return `<div class="grid">${tsel}${ssel}${optLen(t("schVis"), "prof.vis", ep.vis)}<div class="hint" style="align-self:end"><b>${esc(ep.key)}</b></div></div><p class="hint">${t("profHint")}</p>`;
}
function transSection(s) {
  s.trans = s.trans || [];
  const O = outerPoly(s);
  const si = P.surfaces.indexOf(s);
  let b = s.trans
    .map((tr, i) => {
      const c = transCalc(s, tr);
      const eo = O.map((q, j) => {
        const r = O[(j + 1) % O.length];
        return `<option value="${j}" ${+tr.edge === j ? "selected" : ""}>${t("sideN")} ${j + 1} · ${fmtIn(Math.hypot(r[0] - q[0], r[1] - q[1]))}″</option>`;
      }).join("");
      return `<div class="op"><div class="grid"><label class="f w2"><span>${t("edgeOf")}</span><select data-k="trans.${i}.edge" data-sc="s" data-t="selnum" data-rb="1">${eo}</select></label>${F(t("fromStart"), `trans.${i}.from`)}${F(t("doorW"), `trans.${i}.len`)}
  ${SEL(t("adjFloor"), `trans.${i}.adj`, Object.keys(ADJ), 1, "s", "", (o) => t("adj_" + o))}${F(t("adjT"), `trans.${i}.at`)}${F(t("adjSub"), `trans.${i}.sub`, "slen")}
  ${SEL(t("transProf"), `trans.${i}.prof`, ["auto", "RENO-T", "RENO-TK", "RENO-U", "RENO-V", "RENO-RAMP"], 1, "s", "", (o) => (o === "auto" ? t("autoV") : o))}</div>
  <div class="note"><b>${c.diff >= 0 ? "+" : "−"}${fmt(Math.abs(c.diff))}</b> · ${esc(c.key)}</div><div class="btns"><button class="btn sm p" data-act="section:${si}:${i}">${t("section")}</button><button class="btn sm d" data-act="delTrans:${i}">${t("del")}</button></div></div>`;
    })
    .join("");
  b += `<p class="hint">${t("transHint")}</p><div class="btns"><button class="btn" data-act="addTrans">${t("addTrans")}</button></div>`;
  return SEC("trans", `${t("transT")}${s.trans.length ? " · " + s.trans.length : ""}`, b);
}
function heatSection(s) {
  s.heat = s.heat || {
    on: false,
    sys: "ditraheat",
    pattern: "3",
    volt: 120,
    clear: 4,
    conn: null,
    show: true,
    sp: 3,
    wsf: 12,
  };
  const H = s.heat;
  let b = CHK(t("heatOn"), "heat.on", 1);
  if (H.on) {
    const sys = HEATSYS[H.sys] || {};
    b += `<div class="grid">${SEL(t("heatSys"), "heat.sys", Object.keys(HEATSYS), 1, "s", "w2", (o) => t("hs_" + o))}`;
    if (sys.sp) b += SEL(t("spacing"), "heat.pattern", ["3", "32"], 1, "s", "", (o) => t("sp_" + o));
    else b += F(t("spacingIn"), "heat.sp") + F(t("wsf"), "heat.wsf", "num");
    b +=
      SEL(t("volt"), "heat.volt", ["120", "240"], 1, "s", "", (o) => o + " V") +
      F(t("clearWalls"), "heat.clear") +
      SEL(t("runDir"), "heat.dir", ["auto", "h", "v"], 1, "s", "", (o) => t("dir_" + o)) +
      SEL(t("nCables"), "heat.n", ["auto", "1", "2", "3", "4"], 1, "s", "", (o) =>
        o === "auto" ? t("autoN") : o,
      ) +
      F(t("maxSf") + (H.maxSf ? "" : ` (${(+H.volt || 120) === 240 ? 250 : 134.5})`), "heat.maxSf", "num") +
      optLen(t("ductClr"), "heat.ductClr", 4);
    const cat = cableCatalog(H.sys, H.volt);
    if (cat.length) {
      if (H.model && !cat.some((c) => c.id === H.model)) H.model = "";
      b += SEL(t("cableModel"), "heat.model", [""].concat(cat.map((c) => c.id)), 1, "s", "w2", (id) => {
        if (!id) return t("cableAuto");
        const c = cat.find((q) => q.id === id);
        return `${c.v}V · ${c.ft} ft · ${c.sf} sf (3) / ${c.sf32} sf (3-2)`;
      });
    } else if (H.sys === "cable") b += F(t("cableFt"), "heat.cableFt", "num");
    b += `</div>`;
    b += `<div class="btns"><button class="btn ${S.pickConn === s.id ? "p" : ""}" data-act="pickConn">📍 ${S.pickConn === s.id ? t("tapPlan") : t("pickConn")}</button>${CHK(t("showHeat"), "heat.show", 0)}</div><p class="hint">${t("connDrag")}</p><p class="hint">${t("sensorDrag")}</p><p class="hint">${t("warmHint")}</p>`;
    b += `<p class="hint">${t("heatHint")}</p>`;
  }
  return SEC("heat", `🔥 ${t("heat")}${H.on ? " · " + t("on") : ""}`, b);
}
function renderPanel() {
  const el = $("#panel");
  document.body.classList.toggle("tot", S.tab === "tot");
  if (S.tab === "tot") {
    el.innerHTML =
      SEC(
        "proj",
        t("proj"),
        `<div class="grid">${F(t("projName"), "name", "text", "p", "w2")}${F(t("clientName"), "client", "text", "p", "w2")}${F(t("waste"), "waste", "num", "p")}${F(t("minCutS"), "minCut", "len", "p")}${F(t("edgeGap"), "edgeGap", "len", "p")}${F(t("kerf"), "kerf", "len", "p")}${SEL(
          t("schProfile"),
          "sch.type",
          Object.keys(PROF).filter((k) => PROF[k].use === "edge"),
          0,
          "p",
          "w2",
          (o) => o,
        )}</div><p class="hint">${t("storeNote")}</p>${themePicker()}`,
      ) +
      SEC("tot", t("totTitle"), '<div id="tot"></div>') +
      SEC("mat", t("materials"), '<div id="mat"></div>' + matSettingsHTML()) +
      SEC(
        "pdfs",
        "PDF",
        `<div class="btns"><button class="btn p" data-act="pdf:client">${t("pdfClient")}</button><button class="btn" data-act="pdf:cut">${t("pdfCut")}</button></div><p class="hint">${t("pdfHint")}</p>`,
      );
    renderTot();
    return;
  }
  if (S.tab === "floor") {
    const fs = P.surfaces.filter((s) => s.type !== "wall");
    let b =
      `<p class="hint">${t("floorHint")}</p>` +
      fs
        .map((s) => {
          const i = P.surfaces.indexOf(s);
          return `<div class="op"><h4>${ICON[s.type]} ${esc(s.name)}</h4><div class="grid">${F(t("posX"), `surfaces.${i}.pos.x`, "slen", "p")}${F(t("posY"), `surfaces.${i}.pos.y`, "slen", "p")}</div>${CHK(t("zlink"), `surfaces.${i}.zlink`, 1, "p")}</div>`;
        })
        .join("");
    b += `<div class="btns"><button class="btn p" data-act="autoFloor">${t("autoFloor")}</button><button class="btn" data-act="tileToFloors">${t("tileToFloors")}</button></div>`;
    el.innerHTML = SEC("zones", t("zones"), b) + SEC("allres", t("results"), '<div id="res"></div>');
    renderRes();
    return;
  }
  if (S.tab === "all") {
    const ws = P.surfaces.filter((s) => s.type === "wall");
    let b = `<p class="hint">${t("tapWall")}</p><div class="grid">${SEL(t("linkMode"), "link.mode", ["none", "height", "wrap"], 1, "p", "w2", (o) => t("l" + o))}</div><p class="hint">${t("linkHint")}</p>`;
    b += ws
      .map((s) => {
        const i = P.surfaces.indexOf(s);
        return `<div class="op"><h4>${esc(s.name)} · ${fmt(wallW(s))}</h4><div class="grid">${F(t("base"), `surfaces.${i}.base`, "len", "p")}<div>${CHK(t("linked"), `surfaces.${i}.link`, 1, "p")}</div></div></div>`;
      })
      .join("");
    b += `<div class="btns"><button class="btn p" data-act="autoAll">${t("autoAll")}</button><button class="btn" data-act="tileToAll">${t("tileToAll")}</button></div>`;
    el.innerHTML = SEC("link", t("link"), b) + SEC("allres", t("results"), '<div id="res"></div>');
    renderRes();
    return;
  }
  const s = cur();
  if (!s) {
    el.innerHTML = "";
    return;
  }
  let h = "";
  let sb = `<div class="grid">${F(t("name"), "name", "text", "s", "w2")}${SEL(t("type"), "type", ["wall", "floor", "pan"], 1)}${SEL(t("shape"), "shape", ["rect", "L", "walk", "custom"], 1)}<div class="w2 btns" style="margin:0"><button class="btn" data-act="drawShape">✏️ ${t("drawBtn")}</button><button class="btn" data-act="help">? ${t("helpBtn")}</button></div>`;
  if (s.shape !== "custom" && s.shape !== "walk")
    sb += F(t("width"), "w") + F(s.type === "wall" ? t("height") : t("length"), "h");
  if (s.shape === "L")
    sb +=
      F(t("notchW"), "Lw") +
      F(t("notchH"), "Lh") +
      SEL(t("corner"), "Lc", ["tr", "tl", "br", "bl"], 0, "s", "w2");
  sb += "</div>";
  if (s.shape === "walk") sb += walkEditor(s);
  if (s.type !== "wall")
    sb += `<div class="op"><div class="grid">${F(t("posX"), "pos.x", "slen")}${F(t("posY"), "pos.y", "slen")}</div>${CHK(t("zlink"), "zlink", 1)}<p class="hint">${t("zoneHint")}</p></div>`;
  if (s.shape === "custom")
    sb += `<label class="f" style="margin-top:8px"><span>${t("ptsHint")}</span><textarea rows="3" data-k="pts" data-sc="s" data-t="text">${esc(s.pts)}</textarea></label>`;
  if (s.type === "wall")
    sb += `<div class="grid" style="margin-top:8px">${F(t("base"), "base")}<div>${P.link.mode !== "none" ? CHK(t("linked"), "link", 1) : ""}</div></div>`;
  if (s.type === "wall" && s.shape === "rect") {
    s.tub = s.tub || { on: false, side: "r", d: 30, h: 15, r: 1.5, rF: 0, rB: 0 };
    sb += `<div class="op" style="margin-top:8px">${CHK(t("tubOn"), "tub.on", 1)}`;
    if (s.tub.on) {
      const D = tubDims(s);
      sb += `<p class="hint">${t("tubHint")}</p><div class="grid">${SEL(t("tubSide"), "tub.side", ["r", "l"], 1, "s", "w2", (o) => t("tubSide_" + o))}${F(t("tubD"), "tub.d")}${F(t("tubH"), "tub.h")}${F(t("tubR"), "tub.r")}<div class="hint" style="align-self:end">${t("tubStrip")}: <b>${fmt(Math.max(0, s.w - D.d))}</b></div>${F(t("tubRF"), "tub.rF")}${F(t("tubRB"), "tub.rB")}</div><p class="hint">${t("tubRHint")}</p>`;
    }
    sb += "</div>";
    s.uneven = s.uneven || { on: false, l: 0, r: 0, m: 0, mOn: false };
    if (!s.tub.on) {
      sb += `<div class="op" style="margin-top:8px">${CHK(t("unevenOn"), "uneven.on", 1)}`;
      if (s.uneven.on)
        sb += `<p class="hint">${t("unevenHint")}</p><div class="grid">${F(t("uL"), "uneven.l")}${F(t("uR"), "uneven.r")}</div>${CHK(t("uMidOn"), "uneven.mOn", 1)}${s.uneven.mOn ? `<div class="grid">${F(t("uM"), "uneven.m")}</div>` : ""}`;
      sb += "</div>";
    }
    s.plumb = s.plumb || { on: false, l: 0, r: 0 };
    sb += `<div class="op">${CHK(t("plumbOn"), "plumb.on", 1)}`;
    if (s.plumb.on)
      sb += `<p class="hint">${t("plumbHint")}</p><div class="grid">${F(t("pL"), "plumb.l", "slen")}${F(t("pR"), "plumb.r", "slen")}</div>`;
    sb += "</div>";
  }
  sb += CHK(t("wet"), "wet");
  sb += `<div class="btns"><button class="btn d" data-act="delSurfQ">${t("delSurf")}</button></div>`;
  if (s.type === "wall" && !(s.bs && s.bs.on))
    sb += `<div class="btns"><button class="btn" data-act="bsOn">🍳 ${t("bsMake")}</button></div>`;
  h += SEC("surf", t("surface"), sb);
  if (s.type === "wall" && s.bs && s.bs.on) h += bsSection(s);
  if (S.layer === "prep") {
    h = prepSection(s) + h;
    h += SEC(
      "open",
      `${t("openings")}${s.openings.length ? " · " + s.openings.length : ""}`,
      s.openings.map(openingCard).join("") +
        `<div class="btns"><button class="btn p" data-act="addOpenMenu">${t("addOpen")}</button></div>`,
    );
    if (s.type !== "wall") h += transSection(s);
    if (s.type === "floor") h += heatSection(s);
    el.innerHTML = h;
    renderPrepRes();
    return;
  }
  if (S.layer === "wire" && s.type === "floor") h += heatSection(s);
  h += tileSection(s);
  const dr = s.type === "pan" && s.drain.type === "center";
  h += SEC(
    "layout",
    t("layout"),
    `<p class="hint">${t("dragHint")}</p><div class="btns"><button class="btn p" data-act="auto">${t("auto")}</button><button class="btn" data-act="cTile">${t("cTile")}</button><button class="btn" data-act="cJoint">${t("cJoint")}</button><button class="btn" data-act="corner0">${t("corner0")}</button>${dr ? `<button class="btn" data-act="dTile">${t("dTile")}</button><button class="btn" data-act="dJoint">${t("dJoint")}</button>` : ""}</div>
 <p class="hint">${t("autoHint")}</p>
 <div class="row"><div class="pad"><span></span><button class="btn" data-act="nudge:u">↑</button><span></span><button class="btn" data-act="nudge:l">←</button><button class="btn" data-act="nudge:d">↓</button><button class="btn" data-act="nudge:r">→</button></div>
 <div><span class="hint">${t("step")}</span><div class="chips">${[1 / 16, 1 / 8, 1 / 4, 1 / 2, 1].map((v) => `<button class="btn sm ${S.step === v ? "p" : ""}" data-act="step:${v}">${fmtIn(v)}</button>`).join("")}</div></div></div>
 <div class="grid" style="margin-top:8px">${F(t("offX"), "_ox")}${F(t("offY"), "_oy")}</div>`,
  );
  h += SEC(
    "open",
    `${t("openings")}${s.openings.length ? " · " + s.openings.length : ""}`,
    s.openings.map(openingCard).join("") +
      `<div class="btns"><button class="btn p" data-act="addOpenMenu">${t("addOpen")}</button></div>`,
  );
  h += stackSection(s);
  h += SEC(
    "edges",
    t("edges"),
    profFields(s) +
      (s.shape === "rect"
        ? `<p class="hint">${t("edgeHint")}</p><div class="grid">${CHK(t("edgeL"), "trim.l")}${CHK(t("edgeR"), "trim.r")}${CHK(t("edgeT"), "trim.t")}${CHK(t("edgeB"), "trim.b")}</div>`
        : `<p class="hint">${t("edgeNonRect")}</p>`) +
      `<div class="grid">${F(t("extraLF"), "extraLF")}</div>`,
  );
  if (s.type !== "wall") h += transSection(s);
  if (s.type === "floor" && S.layer !== "wire") h += heatSection(s);
  if (s.type === "pan") {
    const d = s.drain;
    h += SEC(
      "pan",
      t("panSec"),
      `${CHK(t("curbOn"), "curb.on", 1)}${s.curb.on ? `<div class="grid">${F(t("curbLen"), "curb.len")}${F(t("curbW"), "curb.w")}${F(t("curbH"), "curb.h")}</div>${CHK(t("curbTrim"), "curb.trim")}` : ""}
  <div class="grid">${SEL(t("drain"), "drain.type", ["none", "center", "linear"], 1, "s", "w2")}${d.type !== "none" ? F(t("drainX"), "drain.x") + F(t("drainY"), "drain.y") : ""}${d.type === "linear" ? F(t("drainLen"), "drain.len") + F(t("drainWid"), "drain.wid") : ""}</div>`,
    );
  }
  h += SEC("res", t("results"), '<div id="res"></div>');
  el.innerHTML = h;
  renderRes();
}

function stripTxt(x) {
  if (x.approx)
    return `${x.label}: ${fmt(x.wid)} × ${fmt(x.len)} ×${x.faces} ≈ ${x.tiles} ${t("tilesShort")}`;
  return `${x.label}: ${fmt(x.wid)} × ${x.per > 1 ? `${x.per - 1}×${fmt(x.Lg)} + ${fmt(x.last)}` : fmt(x.last)}, ×${x.faces} → ${x.count} ${t("pcs")}`;
}
function drillTxt(d) {
  const nm =
    t(d.o.type) + (d.o.shape === "circle" ? " ⌀" + fmtIn(d.o.dia) : " " + fmtIn(d.o.w) + "×" + fmtIn(d.o.h));
  if (d.joint) return `${nm}: ${t("onJoint")}`;
  return `${nm}: ${t("drillPiece")} ${fmtIn(d.p.cw)}×${fmtIn(d.p.ch)} — ${t("drillFrom")} <b>${fmt(d.dx)}</b> ${t("fromL")}, <b>${fmt(d.dy)}</b> ${t("fromB")}${d.cross ? ` <span style="color:#b3261e">(${t("crosses")})</span>` : ""}`;
}
function kpis(r, T) {
  const sheet = T && T.sheet && T.sheet.on;
  const nbKeys = Object.keys(r.nb || {});
  let h =
    `<div class="kp"><div><small>${t("area")}</small><b>${sq(r.area)}</b></div>` +
    (sheet
      ? `<div><small>${t("sheets")}</small><b>${r.sheets}</b></div><div><small>${t("cuts")}</small><b>${r.cuts}</b></div>`
      : `<div><small>${t("full")}</small><b>${r.full}</b></div><div><small>${t("cuts")}</small><b>${r.cuts}</b></div>`) +
    `<div><small>${sheet ? t("sheets") : t("need")}</small><b>${r.need}</b></div><div class="hl"><small>${t("order")} (+${P.waste}%)</small><b>${r.order}</b></div><div><small>${t("boxes")}</small><b>${r.boxes || "—"}</b></div></div>`;
  if (nbKeys.length > 1)
    h += `<table>${nbKeys.map((k) => `<tr><td>${esc(k)}</td><td class="n">${r.nb[k]} → <b>${Math.ceil(r.nb[k] * (1 + (+P.waste || 0) / 100))}</b></td></tr>`).join("")}</table>`;
  return h;
}
function renderRes() {
  const el = $("#res");
  if (!el) return;
  if (isMulti()) {
    const items = S.items;
    if (!items.length) {
      el.innerHTML = "";
      return;
    }
    const comb = {};
    let lf = 0;
    items.forEach((it) => {
      lf += it.R.lf;
      it.R.list.forEach((r) => {
        const e = comb[r.k] || (comb[r.k] = { k: r.k, n: 0, c: r.c, cw: r.cw, ch: r.ch });
        e.n += r.n;
        if (RANK[r.c] > RANK[e.c]) e.c = r.c;
      });
    });
    let h = `<table><tr><th>${t("surface")}</th><th class="n">${t("full")}</th><th class="n">${t("cuts")}</th><th class="n">${t("minCut")}</th><th class="n">${t("need")}</th></tr>${items.map((it) => `<tr><td>${esc(it.s.name)}${isLinked(it.s) ? " 🔗" : ""}</td><td class="n">${it.R.full}</td><td class="n">${it.R.cuts}</td><td class="n" style="${it.R.bad ? "color:#b3261e;font-weight:600" : ""}">${it.R.minc < 1e8 ? fmtIn(it.R.minc) : "—"}</td><td class="n">${it.R.need}</td></tr>`).join("")}</table>`;
    const a = aggItems();
    h += `<p><b>${t("total")}</b>: ${t("need")} ${a.need} → ${t("order")} <b>${a.order}</b>${lf > 0 ? ` · Schluter ${(lf / 12).toFixed(1)} ft (${Math.ceil(lf / 98.5)} ${t("sticks")})` : ""}</p>`;
    const list = Object.values(comb).sort((a, b) => RANK[b.c] - RANK[a.c] || a.cw * a.ch - b.cw * b.ch);
    if (list.length)
      h += `<p style="margin:10px 0 4px"><b>${t("combined")}</b></p><table><tr><th>${t("size")}</th><th class="n">${t("qty")}</th></tr>${list.map((r) => `<tr><td><span class="sw" style="background:${COL[r.c]}"></span>${esc(r.k)}</td><td class="n">${r.n}</td></tr>`).join("")}</table>`;
    h += `<div class="btns"><button class="btn" data-act="copyCuts">${t("copyCuts")}</button></div>`;
    el.innerHTML = h;
    return;
  }
  if (!R) {
    el.innerHTML = `<div class="warnbox">${t("tooMany")}</div>`;
    return;
  }
  const T = R.T;
  let h = kpis(R, T);
  if (R.bad) h += `<div class="warnbox">${R.bad} ${t("sliverWarn")}</div>`;
  if (R.ledger) {
    const L = R.ledger,
      s0 = cur();
    h += `<div class="note">${L.hi - L.lo > 0.01 ? `<b>${t("outLevel")}</b>: ${fmt(L.hi - L.lo)} ${t("onLen")} ${fmt(s0.w)}.` : ""}${L.y != null ? ` ${t("ledgerTxt")} <b>${fmt(L.y)}</b> ${t(L.tub ? "ledgerFromFloor" : "ledgerFrom")}` : ""} ${t("taperNote")}</div>`;
  }
  if (R.list.length)
    h += `<table><tr><th>${t("size")}</th><th class="n">${t("qty")}</th></tr>${R.list.map((r) => `<tr><td><span class="sw" style="background:${COL[r.c]}"></span>${esc(r.k)}</td><td class="n">${r.n}</td></tr>`).join("")}</table>`;
  if (R.drill.length)
    h +=
      `<p style="margin:12px 0 4px"><b>${t("drill")}</b></p>` +
      R.drill.map((d) => `<div class="dl">${drillTxt(d)}</div>`).join("");
  if (R.strips.length)
    h +=
      `<p style="margin:12px 0 4px"><b>${t("mStrips")}</b></p>` +
      R.strips
        .filter((x) => x.count || x.tiles)
        .map((x) => `<div class="hint" style="color:var(--ink)">${esc(stripTxt(x))}</div>`)
        .join("");
  Object.keys(R.profs).forEach((k) => {
    const lf2 = R.profs[k];
    h += `<p style="margin:10px 0 4px"><b>Schluter ${esc(k)}</b>: ${fmt(lf2)} = ${(lf2 / 12).toFixed(1)} ft → ${Math.ceil(lf2 / 98.5)} ${t("sticks")}</p>`;
  });
  h += `<p class="hint" style="color:var(--ink)">${t("buildUp")}: <b>${fmt(R.stack.total)}</b> ${t("aboveSub")}</p>`;
  h += heatResHTML(cur(), R);
  h += `<p class="hint">${t("gapNote")} (${fmt(+P.edgeGap)}). ${t("reuseNote")}</p><div class="btns"><button class="btn p" data-act="cutSheet">${t("cutSheet")}</button><button class="btn" data-act="copyCuts">${t("copyCuts")}</button><button class="btn" data-act="pdf:cut">${t("pdfCut")}</button></div>`;
  el.innerHTML = h;
}
function renderTot() {
  const el = $("#tot");
  if (!el) return;
  const rows = P.surfaces.map((s) => ({ s, R: compute(s) }));
  const g = {};
  const pf = {};
  rows.forEach(({ R }) => {
    for (const k in R.profs) pf[k] = (pf[k] || 0) + R.profs[k];
    for (const k in R.nb) {
      g[k] = g[k] || { k, need: 0, perBox: 0 };
      g[k].need += R.nb[k];
      if (R.perBox && Object.keys(R.nb).length === 1) g[k].perBox = R.perBox;
      const T = R.T;
      if (+T.price > 0 && k === tileDesc(T)) {
        g[k].price = +T.price;
        g[k].unit = (+T.w * (+T.h || +T.w)) / 144;
        g[k].name = T.name || "";
      }
    }
  });
  let tileCost = 0;
  let h = `<p><b>${t("surfaces")}</b></p><table><tr><th>${t("name")}</th><th>${t("tile")}</th><th class="n">sf</th><th class="n">${t("need")}</th></tr>${rows.map(({ s, R }) => `<tr><td>${esc(s.name)}${R.bad ? " ⚠︎" : ""}</td><td>${esc(tileDesc(R.T))}<br><small style="color:var(--mut)">${esc(patName(R.T))}</small></td><td class="n">${sq(R.area)}</td><td class="n">${R.need}</td></tr>`).join("")}</table>`;
  h += `<p style="margin-top:14px"><b>${t("byTile")}</b></p><table><tr><th>${t("tile")}</th><th class="n">${t("need")}</th><th class="n">${t("order")}</th><th class="n">${t("boxes")}</th></tr>${Object.values(
    g,
  )
    .map((e) => {
      const o = Math.ceil(e.need * (1 + (+P.waste || 0) / 100));
      const cost = e.price ? o * e.unit * e.price : 0;
      if (cost) tileCost += cost;
      return `<tr><td>${e.name ? esc(e.name) + "<br><small>" + esc(e.k) + "</small>" : esc(e.k)}</td><td class="n">${e.need}</td><td class="n"><b>${o}</b>${cost ? `<br><small>≈$${Math.round(cost)}</small>` : ""}</td><td class="n">${e.perBox ? Math.ceil(o / e.perBox) : "—"}</td></tr>`;
    })
    .join("")}</table>`;
  if (tileCost)
    h += `<p style="margin-top:8px"><b>${t("tileCost")}: ≈$${Math.round(tileCost)}</b> <small style="color:var(--mut)">${t("tileCostNote")}</small></p>`;
  Object.keys(pf).forEach((k) => {
    h += `<p style="margin-top:10px"><b>Schluter ${esc(k)}</b>: ${(pf[k] / 12).toFixed(1)} ft → ${Math.ceil(pf[k] / 98.5)} ${t("sticks")}</p>`;
  });
  el.innerHTML = h;
  renderMat();
}
function syncNames() {
  if (P.nk) P.name = t(P.nk);
  P.surfaces.forEach((s) => {
    if (s.nk) s.name = t(s.nk) + (s.nn ? " " + s.nn : "");
  });
}
function renderAll() {
  syncNames();
  if (S.tab === "all" && P.surfaces.filter((s) => s.type === "wall").length < 2) S.tab = 0;
  if (S.tab === "floor" && P.surfaces.filter((s) => s.type !== "wall").length < 2) S.tab = 0;
  if (typeof S.tab === "number" && !P.surfaces[S.tab]) S.tab = 0;
  renderHeader();
  renderTabs();
  renderTools();
  renderLegend();
  document.body.classList.toggle("client", S.client);
  document.body.classList.toggle("tot", S.tab === "tot");
  draw();
  renderPanel();
  requestAnimationFrame(() => {
    draw();
    renderRes();
  });
}
function changed() {
  draw();
  if (S.tab === "tot") renderTot();
  else renderRes();
  renderTabs();
  renderHeader();
  syncOff();
  saveSoon();
}

/* ================= inputs ================= */
const panel = $("#panel");
function onInp(e) {
  const el = e.target,
    k = el.dataset.k;
  if (!k) return;
  const sc = el.dataset.sc || "s",
    ty = el.dataset.t,
    base = scopeBase(sc);
  let v;
  if (ty === "len" && el.dataset.opt && String(el.value).trim() === "") {
    v = null;
    el.classList.remove("bad");
  } else if (ty === "len" || ty === "slen") {
    const raw = String(el.value).trim(),
      neg = ty === "slen" && /^[-−]/.test(raw);
    v = parseLen(neg ? raw.replace(/^[-−]\s*/, "") : raw);
    if (!isFinite(v) || v < 0) {
      el.classList.add("bad");
      return;
    }
    if (neg) v = -v;
    el.classList.remove("bad");
  } else if (ty === "num") {
    v = parseFloat(String(el.value).replace(",", "."));
    if (!isFinite(v)) {
      el.classList.add("bad");
      return;
    }
    el.classList.remove("bad");
  } else if (ty === "chk") {
    if (e.type !== "change") return;
    v = el.checked;
  } else if (ty === "sel") {
    if (e.type !== "change") return;
    v = el.value;
  } else if (ty === "selnum") {
    if (e.type !== "change") return;
    if (el.value === "custom") {
      v = getPath(base, k);
      v = (+v || 0) + 0.0001;
    } else v = +el.value;
  } else v = el.value;
  const s = cur();
  if (s && k === "shape") S.prevShape = s.shape;
  if (s && k === "tub.side" && s.tub.on) {
    const was = s.tub.side;
    if (was !== v) {
      const a1 = was === "r" ? "l" : "r",
        a2 = v === "r" ? "l" : "r";
      if (s.trim[a1]) {
        s.trim[a1] = false;
        s.trim[a2] = true;
      }
    }
  }
  if (k === "_ox" || k === "_oy") {
    const T = effT(s),
      G = geom(s);
    setO(s, k === "_ox" ? G.rb.x0 + v : T.ox, k === "_oy" ? G.rb.y0 + v : T.oy);
  } else if (k === "_offp") {
    s.tile.off = Math.max(0, Math.min(100, v)) / 100;
  } else setPath(base, k, v);
  if (k === "name") {
    if (sc === "p") delete P.nk;
    else if (s) delete s.nk;
  }
  if (s && k === "type" && v === "pan" && !s.curb.on && s.drain.type === "none") {
    s.curb.on = true;
    s.drain.type = "center";
    s.drain.x = s.w / 2;
    s.drain.y = s.h / 2;
    s.curb.len = s.w;
  }
  if (s && k === "drain.type") {
    if (v === "linear") {
      s.drain.len = Math.max(12, s.w - 12);
      s.drain.x = (s.w - s.drain.len) / 2;
      s.drain.y = s.h - s.drain.wid;
    }
    if (v === "center") {
      s.drain.x = s.w / 2;
      s.drain.y = s.h / 2;
    }
  }
  const m = k.match(/^openings\.(\d+)\.type$/);
  if (m) {
    const o = s.openings[+m[1]],
      d = OPT[v];
    if (d.shape !== o.shape) {
      if (d.shape === "circle") {
        o.x = o.x + (o.w || 0) / 2;
        o.y = o.y + (o.h || 0) / 2;
        o.dia = d.dia;
      } else {
        o.w = d.w;
        o.h = d.h;
        o.x = o.x - o.w / 2;
        o.y = o.y - o.h / 2;
      }
      o.shape = d.shape;
    } else if (d.shape === "circle") o.dia = d.dia;
    else {
      o.w = d.w;
      o.h = d.h;
    }
    o.trim = !!d.trim;
    if (v === "niche" && !o.d) o.d = 3.5;
  }
  if (s && k === "tub.on" && v) {
    s.base = 0;
    s.uneven.on = false;
    s.trim[s.tub.side === "r" ? "l" : "r"] = true;
    if (!(s.w > +s.tub.d)) s.w = (+s.tub.d || 30) + 5;
    autoLayout(s);
  }
  {
    const mt = k.match(/^trans\.(\d+)\.adj$/);
    if (s && mt) s.trans[+mt[1]].at = ADJ[v];
  }
  if (s && (k === "heat.sys" || (k === "heat.on" && v))) {
    const sy = HEATSYS[s.heat.sys];
    s.stack = s.stack || { under: "none", under2: "none" };
    if (sy && sy.under) s.stack.under = sy.under;
  }
  if (s && k === "tile.shape") {
    const T = s.tile;
    if (v !== "rect" && T.mem == null) T.mem = { w: 12, h: 24 };
    if (v === "rect" && T.mem && !T.sheet.on) {
      T.w = T.mem.w;
      T.h = T.mem.h;
    }
    if (v === "hex" && (+T.w > 24 || +T.w < 1)) T.w = 8;
    if (v === "penny") {
      T.w = 0.75;
      T.sheet = { on: true, w: 12, h: 12 };
      T.pattern = "offset";
      T.off = 0.5;
    }
    if (v === "chevron") {
      T.w = 8.5;
      T.h = 4.25;
    }
    if (v === "rect" && T.sheet.on && +T.w < 1) {
      T.w = 2;
      T.h = 2;
    }
    autoLayout(s);
  }
  if (s && k === "tile.pattern") {
    if (v === "pinwheel" && !(+s.tile.w2 > 0 && +s.tile.w2 < +s.tile.w)) s.tile.w2 = +s.tile.w / 2;
    autoLayout(s);
  }
  if (k === "link.mode" && v !== "none") {
    const fw = linkedWalls()[0];
    if (fw) {
      const T = fw.tile;
      P.link.oy = T.oy + (+fw.base || 0);
      P.link.ox = T.ox;
      autoLayout(fw);
    }
  }
  if (s && k === "shape" && v === "walk" && (!s.segs || !s.segs.length))
    s.segs = polyToSegs(outerPoly(Object.assign({}, s, { shape: "rect" })));
  if (s && k === "shape" && v === "walk") {
    s.segs = polyToSegs(outerPoly(Object.assign({}, s, { shape: S.prevShape || "rect" })));
  }
  if (k.endsWith("zlink") && v) {
    const tg = sc === "p" ? getPath(P, k.replace(/\.zlink$/, "")) : s;
    const others = P.surfaces.filter((x) => x !== tg && isZLinked(x));
    if (!others.length) {
      const T = tg.tile;
      P.flink.ox = T.ox + (+tg.pos.x || 0);
      P.flink.oy = T.oy + (+tg.pos.y || 0);
    } else autoLayout(tg);
  }
  if (k.includes(".nk.") || /openings\.\d+\.nk\./.test(k)) {
    const m = k.match(/^(?:surfaces\.(\d+)\.)?openings\.(\d+)\./),
      s2 = m ? (m[1] != null ? P.surfaces[+m[1]] : cur()) : null,
      o2 = s2 && s2.openings[+m[2]];
    if (o2) {
      nicheCfg(o2, s2);
      nichePrefab(o2);
    }
  }
  if (/^bs\./.test(k) && cur() && cur().bs) {
    bsApply(cur());
    if (/^bs\.(center|cmode|bottomFull)/.test(k)) bsAlign(cur());
  }
  const inModal = el.closest && el.closest("#mbody");
  if (inModal) S.panelStale = true;
  if (el.dataset.rb && !inModal) {
    renderPanel();
    renderTools();
  }
  changed();
  if (el.closest && el.closest("#home")) {
    if (el.dataset.rb) renderHome();
    return;
  }
  if (inModal) {
    if (el.dataset.rb && S.reModal) S.reModal();
    else if (S.modalLive) S.modalLive();
  }
}
panel.addEventListener("input", onInp);
panel.addEventListener("change", onInp);
panel.addEventListener(
  "toggle",
  (e) => {
    const d = e.target;
    if (d.dataset && d.dataset.sec) {
      if (d.open) S.open.add(d.dataset.sec);
      else S.open.delete(d.dataset.sec);
    }
  },
  true,
);

/* ================= gallery ================= */
const PRESETS = [
  {
    id: "stack",
    set: { shape: "rect", pattern: "grid", ang: 0, checker: false },
    orient: "h",
    demo: { w: 4, h: 2 },
  },
  {
    id: "brick",
    set: { shape: "rect", pattern: "offset", off: 0.5, ang: 0, checker: false },
    orient: "h",
    demo: { w: 4, h: 2 },
  },
  {
    id: "third",
    set: { shape: "rect", pattern: "offset", off: 1 / 3, ang: 0, checker: false },
    orient: "h",
    demo: { w: 6, h: 2 },
  },
  {
    id: "quarter",
    set: { shape: "rect", pattern: "offset", off: 0.25, ang: 0, checker: false },
    orient: "h",
    demo: { w: 6, h: 1.5 },
  },
  {
    id: "vstack",
    set: { shape: "rect", pattern: "grid", ang: 0, checker: false },
    orient: "v",
    demo: { w: 2, h: 4 },
  },
  {
    id: "voff",
    set: { shape: "rect", pattern: "voffset", off: 0.5, ang: 0, checker: false },
    orient: "v",
    demo: { w: 2, h: 4 },
  },
  { id: "diag", set: { shape: "rect", pattern: "grid", ang: 45, checker: false }, demo: { w: 3, h: 3 } },
  {
    id: "diagbrick",
    set: { shape: "rect", pattern: "offset", off: 0.5, ang: 45, checker: false },
    orient: "h",
    demo: { w: 4, h: 2 },
  },
  { id: "checker", set: { shape: "rect", pattern: "grid", ang: 0, checker: true }, demo: { w: 3, h: 3 } },
  {
    id: "herr45",
    set: { shape: "rect", pattern: "herring", ang: 45, checker: false },
    needRect: true,
    demo: { w: 1.4, h: 4.2 },
  },
  {
    id: "herr90",
    set: { shape: "rect", pattern: "herring", ang: 0, checker: false },
    needRect: true,
    demo: { w: 1.4, h: 4.2 },
  },
  {
    id: "basket",
    set: { shape: "rect", pattern: "basket", ang: 0, checker: false },
    needRect: true,
    demo: { w: 2, h: 4.25 },
  },
  {
    id: "pinwheel",
    set: { shape: "rect", pattern: "pinwheel", ang: 0, checker: false },
    demo: { w: 4, w2: 2 },
  },
  {
    id: "chevron",
    set: { shape: "chevron", pattern: "chevron", ang: 0, checker: false },
    size: { w: 8.5, h: 4.25, cang: 45 },
    demo: { w: 2.6, h: 1.6 },
  },
  { id: "hex", set: { shape: "hex", ang: 0, checker: false, rot: false }, size: { w: 8 }, demo: { w: 3 } },
  {
    id: "penny",
    set: { shape: "penny", pattern: "offset", off: 0.5, ang: 0, checker: false },
    size: { w: 0.75 },
    sheet: true,
    demo: { w: 1.3 },
  },
  {
    id: "mosaic",
    set: { shape: "rect", pattern: "grid", ang: 0, checker: false, rot: false },
    size: { w: 2, h: 2 },
    sheet: true,
    demo: { w: 1.5, h: 1.5 },
  },
];
function presetMatch(T, p) {
  const s = p.set;
  if (T.shape !== s.shape) return false;
  if (s.shape === "rect") {
    if (patOf(T) !== s.pattern || (+T.ang || 0) !== s.ang || !!T.checker !== !!s.checker) return false;
    if (s.off != null && Math.abs(T.off - s.off) > 1e-6) return false;
    if (!!p.sheet !== !!(T.sheet && T.sheet.on)) return false;
    const { tw, th } = rdims(T);
    if (p.orient === "h" && tw < th) return false;
    if (p.orient === "v" && tw > th) return false;
  }
  return true;
}
function thumb(p) {
  const T = defTile(
    Object.assign(
      {},
      p.set,
      { g: 0.28, ox: 0.4, oy: 0.4, rot: false, w2: 2, cang: 45, sheet: { on: false, w: 12, h: 12 } },
      p.demo,
    ),
  );
  const sq = rectPoly(0, 0, 16, 16),
    a = angOf(T),
    O = [T.ox, T.oy],
    toL = a ? (q) => rotP(q, O, -a) : (q) => q;
  const tiles = genTiles(T, bboxOf(sq.map(toL))) || [];
  const rt = a ? ` transform="rotate(${((-a * 180) / Math.PI).toFixed(3)} ${O[0]} ${-O[1]})"` : "";
  const body = tiles
    .map((tl) => {
      const alt = (T.checker && tl.q) || (p.set.pattern === "pinwheel" && tl.q);
      const fill = alt ? "#a99f8c" : "#ece5d7";
      if (tl.k === "p") return `<path d="${pd(tl.poly)}" fill="${fill}"/>`;
      if (tl.k === "c")
        return `<circle cx="${tl.x0 + tl.lw / 2}" cy="${-(tl.y0 + tl.lh / 2)}" r="${tl.lw / 2}" fill="${fill}"/>`;
      return `<rect x="${tl.x0}" y="${-(tl.y0 + tl.lh)}" width="${tl.lw}" height="${tl.lh}" fill="${fill}"/>`;
    })
    .join("");
  return `<svg viewBox="0 -16 16 16"><rect x="0" y="-16" width="16" height="16" fill="#8f897f"/><g${rt}>${body}</g></svg>`;
}
function galleryModal() {
  const s = cur();
  if (!s) return;
  const T = s.tile;
  modal(
    `<h3>${t("gallery").replace("▦ ", "")}</h3><p class="hint">${t("galHint")}</p><div class="gal">${PRESETS.map((p) => `<button data-act="preset:${p.id}" class="${presetMatch(T, p) ? "on" : ""}">${thumb(p)}<span>${t("pr_" + p.id)}</span></button>`).join("")}</div><div class="btns"><button class="btn" data-act="closeModal">${t("close")}</button></div>`,
  );
}
function applyPreset(s, id) {
  const p = PRESETS.find((x) => x.id === id);
  if (!p) return;
  const T = s.tile,
    prev = T.shape;
  const wasPlain = prev === "rect" && !(T.sheet && T.sheet.on);
  if (wasPlain) T.mem = { w: +T.w, h: +T.h };
  Object.assign(T, p.set);
  if (p.size && (prev !== T.shape || p.sheet !== !!T.sheet.on)) Object.assign(T, p.size);
  if (T.shape === "rect" && !p.sheet && !wasPlain && T.mem) {
    T.w = T.mem.w;
    T.h = T.mem.h;
  }
  T.sheet = T.sheet || { on: false, w: 12, h: 12 };
  T.sheet.on = !!p.sheet;
  if (T.shape === "rect") {
    if (p.needRect && Math.abs(+T.w - +T.h) < 1e-6) T.w = +T.h / 2;
    if (p.orient === "h") T.rot = +T.w < +T.h;
    if (p.orient === "v") T.rot = +T.w > +T.h;
    if (p.set.pattern === "pinwheel" && !(+T.w2 > 0 && +T.w2 < +T.w)) T.w2 = +T.w / 2;
    if (p.id === "mosaic" && (+T.w > 6 || +T.h > 6)) {
      T.w = 2;
      T.h = 2;
    }
    if (!p.sheet && +T.w < 1.5 && +T.h < 1.5) {
      T.w = 12;
      T.h = 24;
    }
  }
  autoLayout(s);
}

/* ================= modal & misc ================= */
function modal(h) {
  $("#mbody").innerHTML = h;
  $("#modal").hidden = false;
  S.modalAt = Date.now();
}
function closeModal() {
  $("#modal").hidden = true;
  S.reModal = S.modalLive = null;
  if (S.panelStale) {
    S.panelStale = false;
    renderPanel();
  }
}
$("#modal").addEventListener("click", (e) => {
  if (e.target.id === "modal" && Date.now() - (S.modalAt || 0) > 500) closeModal();
});
function projectsModal() {
  const list = [...DB.projects].sort((a, b) => (b.updated || 0) - (a.updated || 0));
  const sy = DB.sync && DB.sync.on;
  modal(`${themePicker()}<h3>${t("projects")}</h3><div class="btns"><button class="btn p" data-act="newProj">${t("newProj")}</button><button class="btn" data-act="syModal">🔄 ${sy ? t("syOnShort") : t("syT")}</button><button class="btn" data-act="bkModal">💾 ${t("bkT")}</button><button class="btn" data-act="closeModal">${t("close")}</button></div>
 ${list.map((p) => `<div class="pl"><div class="nm"><b>${esc(p.name)}</b><small>${esc(p.client || "")} ${p.updated ? new Date(p.updated).toLocaleDateString() : ""}${p.id === P.id ? " · ✓" : ""}</small></div><button class="btn sm" data-act="openProj:${p.id}">${t("open")}</button><button class="btn sm" data-act="dupProj:${p.id}">${t("dup")}</button>${DB.projects.length > 1 ? `<button class="btn sm d" data-act="delProj:${p.id}">✕</button>` : ""}</div>`).join("")}
 <p style="margin-top:14px"><b>${t("exportT")}</b></p><textarea id="expTxt" rows="4" readonly>${esc(JSON.stringify(P))}</textarea><div class="btns"><button class="btn" data-act="copyExp">${t("copy")}</button></div>
 <p><b>${t("importT")}</b></p><textarea id="impTxt" rows="3" placeholder="{...}"></textarea><div class="btns"><input type="file" id="impFile" accept=".json,application/json,text/plain"><button class="btn" data-act="importProj">${t("importBtn")}</button></div><p class="hint">${t("storeNote")}</p>`);
  $("#impFile").addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      $("#impTxt").value = r.result;
    };
    r.readAsText(f);
  });
}
function copyText(txt, btn) {
  const done = () => {
    if (btn) {
      const o = btn.textContent;
      btn.textContent = t("copied");
      setTimeout(() => (btn.textContent = o), 1500);
    }
  };
  try {
    navigator.clipboard.writeText(txt).then(done, () => fallbackCopy(txt, done));
  } catch (e) {
    fallbackCopy(txt, done);
  }
}
function fallbackCopy(txt, done) {
  const ta = document.createElement("textarea");
  ta.value = txt;
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    done();
  } catch (e) {}
  ta.remove();
}
function exportImage() {
  if (S.tab === "tot") return;
  const W = 1400;
  let B;
  const pp = PAL;
  PAL = PAL_L;
  LAYER = S.layer;
  TEXON = !!(S.client || S.texOn);
  try {
    B = buildView(W, 0, { zoom: 1, panX: 0, panY: 0 }, 2);
  } catch (e) {
    PAL = pp;
    LAYER = null;
    return;
  }
  PAL = pp;
  LAYER = null;
  if (!B) return;
  const H = Math.round(B.Hpx),
    HD = 150;
  B.body = declutterBody(B.body, B.vb, W, H);
  const str = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${B.vb.join(" ")}">${B.body}</svg>`;
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(str);
  const img = new Image();
  const s = isMulti() ? null : cur(),
    T = s ? B.items[0].R.T : B.items[0].R.T,
    r0 = s ? B.items[0].R : null;
  img.onload = () => {
    try {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H + HD;
      const x = c.getContext("2d");
      x.fillStyle = "#fff";
      x.fillRect(0, 0, W, H + HD);
      x.fillStyle = "#000";
      x.fillRect(0, 0, W, HD);
      if (LOGOIMG) x.drawImage(LOGOIMG, 12, 5, 140, 140);
      x.fillStyle = "#fff";
      x.font = "bold 34px " + FONT;
      x.fillText(`${P.name} — ${s ? s.name : t(S.tab === "floor" ? "allFloor" : "allWalls")}`, 170, 50);
      x.font = "26px " + FONT;
      x.fillStyle = "#a8a390";
      x.fillText(`${t("tile")} ${tileDesc(T)} · ${patName(T)} · ${t("grout")} ${fmt(+T.g)}`, 170, 92);
      const a = s ? r0 : aggItems();
      x.fillText(
        `${t("full")} ${a.full} · ${t("cuts")} ${a.cuts} · ${t("minCut")} ${a.minc < 1e8 ? fmt(a.minc) : "—"}${P.client ? " · " + P.client : ""}`,
        170,
        130,
      );
      x.drawImage(img, 0, HD);
      showImg(c.toDataURL("image/png"));
    } catch (e) {
      showImg(url);
    }
  };
  img.onerror = () => showImg(url);
  img.src = url;
}
function showImg(src) {
  modal(
    `<h3>${t("image")}</h3><img src="${src}" alt=""><p class="hint">${t("saveImg")}</p><div class="btns"><button class="btn" data-act="closeModal">${t("close")}</button></div>`,
  );
}
function cutsText() {
  if (isMulti()) {
    let o = `${P.name} — ${t(S.tab === "floor" ? "allFloor" : "allWalls")}\n`;
    S.items.forEach((it) => {
      o += `\n${it.s.name}: ${t("need")} ${it.R.need}\n`;
      it.R.list.forEach((r) => (o += `  ${r.k} — ${r.n} ${t("pcs")}\n`));
    });
    return o;
  }
  const s = cur(),
    T = R.T;
  let o = `${P.name} — ${s.name}\n${t("tile")} ${tileDesc(T)}, ${patName(T)}, ${t("grout")} ${fmt(+T.g)}\n${t("full")}: ${R.full}, ${t("cuts")}: ${R.cuts}, ${t("order")}: ${R.order}\n\n${t("cutList")} (${t("size")}):\n`;
  R.list.forEach((r) => (o += `${r.k}  — ${r.n} ${t("pcs")}${r.c === "bad" ? " ⚠" : ""}\n`));
  if (R.drill.length) {
    o += `\n${t("drill")}:\n`;
    R.drill.forEach((d) => (o += drillTxt(d).replace(/<[^>]+>/g, "") + "\n"));
  }
  R.strips.filter((x) => x.count || x.tiles).forEach((x) => (o += stripTxt(x) + "\n"));
  if (R.lf > 0) o += `Schluter: ${(R.lf / 12).toFixed(1)} ft (${Math.ceil(R.lf / 98.5)} ${t("sticks")})\n`;
  return o;
}

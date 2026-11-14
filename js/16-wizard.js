"use strict";
/* ================= tile library ================= */
/* Saved tiles live in DB.tiles (shared by all projects on this device). */
const LIB_SEED = [
  {
    name: "Porcelain 12×24",
    w: 12,
    h: 24,
    thick: 0.375,
    g: 0.125,
    sqftBox: 15.5,
  },
  {
    name: "Porcelain 24×24",
    w: 24,
    h: 24,
    thick: 0.375,
    g: 0.125,
    sqftBox: 15.5,
  },
  {
    name: "Porcelain 24×48",
    w: 24,
    h: 48,
    thick: 0.375,
    g: 0.125,
    sqftBox: 15.5,
  },
  { name: "Subway 3×12", w: 3, h: 12, thick: 0.3125, g: 0.0625, sqftBox: 10 },
  { name: "Subway 3×6", w: 3, h: 6, thick: 0.3125, g: 0.0625, sqftBox: 12.5 },
  {
    name: "Mosaic 2×2 (sheet 12×12)",
    w: 2,
    h: 2,
    thick: 0.25,
    g: 0.125,
    sheet: true,
  },
];
function libTiles() {
  if (!DB.tiles) {
    DB.tiles = LIB_SEED.map((x) =>
      Object.assign({ id: uid(), shape: "rect", price: 0 }, x),
    );
  }
  return DB.tiles;
}
const libLabel = (q) =>
  `${q.name || "—"} · ${fmtIn(+q.w)}×${fmtIn(+q.h)}${+q.price ? ` · $${(+q.price).toFixed(2)}/sf` : ""}`;
// copy a library tile into a surface tile (keeps pattern / layout)
function libToTile(q, T) {
  T.shape = q.shape || "rect";
  T.w = +q.w;
  T.h = +q.h;
  T.thick = +q.thick || 0.375;
  T.g = +q.g || 0.125;
  T.sqftBox = +q.sqftBox || 0;
  T.name = q.name || "";
  T.price = +q.price || 0;
  T.libId = q.id;
  if (q.tex) {
    T.tex = q.tex;
    T.texAR = q.texAR;
  } else {
    delete T.tex;
    delete T.texAR;
  }
  T.sheet = q.sheet
    ? { on: true, w: 12, h: 12 }
    : Object.assign({}, T.sheet || {}, { on: false });
  return T;
}
function libModal(applyTo) {
  const L = libTiles();
  let h = `<h3>📚 ${t("lib")}</h3><p class="hint">${t("libHint")}</p>`;
  h += L.length
    ? `<div class="liblist">${L.map(
        (q, i) =>
          `<div class="librow">${q.tex ? `<img class="libtx" src="${q.tex}" alt="">` : ""}<div><b>${esc(q.name || "—")}</b><br><small>${fmtIn(+q.w)}×${fmtIn(+q.h)} · ${t("thick").toLowerCase()} ${fmtIn(+q.thick || 0.375)} · ${t("grout").toLowerCase()} ${fmtIn(+q.g || 0.125)}${+q.sqftBox ? ` · ${q.sqftBox} sf/box` : ""}${+q.price ? ` · $${(+q.price).toFixed(2)}/sf` : ""}</small></div><div class="btns">${applyTo !== "none" && cur() ? `<button class="btn sm p" data-act="libApply:${q.id}">${t("libUse")}</button>` : ""}<button class="btn sm" data-act="libEdit:${i}">✎</button></div></div>`,
      ).join("")}</div>`
    : `<p class="hint">${t("libEmpty")}</p>`;
  h += `<div class="btns">${cur() ? `<button class="btn" data-act="libSave">＋ ${t("libSaveCur")}</button>` : ""}<button class="btn" data-act="libNew">＋ ${t("libNew")}</button><button class="btn" data-act="closeModal">${t("close")}</button></div>`;
  modal(h);
  S.reModal = null;
}
function libEdit(i) {
  const L = libTiles(),
    q = L[i];
  if (!q) return libModal();
  const p = `tiles.${i}`;
  modal(
    `<h3>✎ ${esc(q.name || t("lib"))}</h3><div class="grid">${F(t("libName"), p + ".name", "text", "d", "w2")}${F(t("tileW"), p + ".w", "len", "d")}${F(t("tileL"), p + ".h", "len", "d")}${F(t("thick"), p + ".thick", "len", "d")}${F(t("grout"), p + ".g", "len", "d")}${F(t("sqftBox"), p + ".sqftBox", "num", "d")}${F(t("libPrice"), p + ".price", "num", "d")}</div>${CHK(t("sheetOn") + " 12×12", p + ".sheet", 0, "d")}<div class="btns"><button class="btn p" data-act="libBack">${t("done")}</button><button class="btn d" data-act="libDel:${i}">${t("del")}</button></div>`,
  );
}
function libAct(cmd, arg) {
  const L = libTiles(),
    s = cur();
  if (cmd === "lib") return libModal();
  if (cmd === "libBack") {
    saveSoon();
    return S.wizBack ? wizOpen() : libModal();
  }
  if (cmd === "libApply") {
    const q = L.find((x) => x.id === arg);
    if (!q || !s) return;
    commitUndo();
    libToTile(q, s.tile);
    autoLayout(s);
    closeModal();
    renderAll();
    changed();
    return;
  }
  if (cmd === "libSave") {
    if (!s) return;
    const T = s.tile;
    L.push({
      id: uid(),
      name: T.name || tileDesc(T),
      shape: T.shape || "rect",
      w: +T.w,
      h: +T.h || +T.w,
      thick: +T.thick || 0.375,
      g: +T.g || 0.125,
      sqftBox: +T.sqftBox || 0,
      price: +T.price || 0,
      sheet: !!(T.sheet && T.sheet.on),
      tex: T.tex,
      texAR: T.texAR,
    });
    saveSoon();
    return libEdit(L.length - 1);
  }
  if (cmd === "libNew") {
    L.push({
      id: uid(),
      name: "",
      shape: "rect",
      w: 12,
      h: 24,
      thick: 0.375,
      g: 0.125,
      sqftBox: 0,
      price: 0,
    });
    saveSoon();
    return libEdit(L.length - 1);
  }
  if (cmd === "libEdit") return libEdit(+arg);
  if (cmd === "libDel") {
    if (L[+arg]) markDeleted("t:" + L[+arg].id);
    L.splice(+arg, 1);
    saveSoon();
    return libModal();
  }
}

/* ================= surface wizard (reset / new surface) ================= */
/* Draft lives in S.wiz: { mode: "reset"|"new", si, s: draft surface, src } — edited through scope "w". */
function stdTile(type) {
  if (type === "floor")
    return defTile({ w: 24, h: 24, w2: 12, pattern: "grid", rot: false });
  if (type === "pan")
    return defTile({
      w: 2,
      h: 2,
      w2: 1,
      pattern: "grid",
      rot: false,
      sheet: { on: true, w: 12, h: 12 },
    });
  return defTile();
}
function wizStart(mode, type) {
  const s0 = mode === "reset" ? cur() : null;
  if (mode === "reset" && !s0) return;
  const f = newSurface(mode === "reset" ? s0.type : type || "wall");
  if (s0)
    Object.assign(f, {
      id: s0.id,
      name: s0.name,
      nk: s0.nk,
      nn: s0.nn,
      pos: s0.pos,
    });
  f.tile = stdTile(f.type);
  const firstWall = P.surfaces.find((x) => x.type === f.type && x !== s0);
  S.wiz = {
    mode,
    si: S.tab,
    s: f,
    src: firstWall ? "s:" + firstWall.id : "def",
    name0: f.name,
  };
  wizOpen();
}
function wizOpen() {
  const W = S.wiz;
  if (!W) return;
  S.wizBack = false;
  const f = W.s,
    reset = W.mode === "reset";
  const opts = ["def"]
    .concat(
      P.surfaces.filter((x) => !reset || x.id !== f.id).map((x) => "s:" + x.id),
    )
    .concat(libTiles().map((q) => "l:" + q.id))
    .concat(["manual"]);
  const lab = (v) => {
    if (v === "def") return t("wzDef");
    if (v === "manual") return "✎ " + t("wzManual");
    if (v.startsWith("s:")) {
      const x = P.surfaces.find((q) => "s:" + q.id === v);
      return x ? `${t("wzAsSurf")} «${x.name}» · ${tileDesc(x.tile)}` : v;
    }
    const q = libTiles().find((q2) => "l:" + q2.id === v);
    return q ? "📚 " + libLabel(q) : v;
  };
  let h = `<h3>${reset ? "⌫ " + t("qClearT") : "＋ " + t("wzNewT") + " · " + t(f.type)}</h3>`;
  if (reset)
    h += `<p class="hint">${t("qClearMsg").replace("{n}", esc(f.name))}</p>`;
  h += `<p class="nh">${t("wzSizeT")}</p><div class="grid">`;
  if (!reset) h += F(t("name"), "s.name", "text", "w", "w2");
  h +=
    F(t("width"), "s.w", "len", "w") +
    F(f.type === "wall" ? t("height") : t("length"), "s.h", "len", "w") +
    `</div>`;
  h += `<p class="nh">${t("tile")}</p><div class="grid">${SEL(t("wzTileSrc"), "src", opts, 1, "w", "w2", lab)}`;
  if (W.src === "manual")
    h +=
      F(t("tileW"), "s.tile.w", "len", "w") +
      F(t("tileL"), "s.tile.h", "len", "w") +
      F(t("grout"), "s.tile.g", "len", "w") +
      F(t("thick"), "s.tile.thick", "len", "w") +
      SEL(
        t("pattern"),
        "s.tile.pattern",
        ["grid", "offset"],
        0,
        "w",
        "w2",
        (o) => t("p" + o),
      );
  h += `</div><div class="btns"><button class="btn sm" data-act="wizLib">📚 ${t("lib")}</button></div>`;
  h += `<p class="nh">${t("wzBaseT")}</p><div class="grid">${SEL(
    t("underTop"),
    "s.stack.under",
    UNDER.map((u) => u.id),
    0,
    "w",
    "w2",
    (id) => underOf(id).n,
  )}`;
  h += SEL(
    t("schProfile"),
    "s.prof.type",
    ["inherit"].concat(Object.keys(PROF).filter((k) => PROF[k].use === "edge")),
    0,
    "w",
    "w2",
    (v) => (v === "inherit" ? `${t("asProj")} (${P.sch.type || "JOLLY"})` : v),
  );
  h += `</div>`;
  if (f.type === "floor") h += CHK(t("heatOn"), "s.heat.on", 0, "w");
  h += `<div class="btns"><button class="btn p" data-act="wizApply">${reset ? t("wzApplyR") : t("wzApplyN")}</button>${reset ? `<button class="btn" data-act="wizDefault">${t("wzJustReset")}</button>` : ""}<button class="btn" data-act="wizCancel">${t("cancel")}</button></div>`;
  modal(h);
  S.reModal = wizOpen;
  S.modalLive = null;
}
function wizAct(cmd) {
  const W = S.wiz;
  if (cmd === "wizCancel") {
    S.wiz = null;
    return closeModal();
  }
  if (cmd === "wizLib") {
    S.wizBack = true;
    return libModalPick();
  }
  if (!W) return;
  const f = W.s;
  if (cmd === "wizApply") {
    if (W.src.startsWith("s:")) {
      const x = P.surfaces.find((q) => "s:" + q.id === W.src);
      if (x) f.tile = JSON.parse(JSON.stringify(x.tile));
    } else if (W.src.startsWith("l:")) {
      const q = libTiles().find((q2) => "l:" + q2.id === W.src);
      if (q) libToTile(q, f.tile);
    }
  }
  if (cmd === "wizDefault") {
    const g = newSurface(f.type);
    Object.assign(g, {
      id: f.id,
      name: f.name,
      nk: f.nk,
      nn: f.nn,
      pos: f.pos,
    });
    g.tile = stdTile(g.type);
    W.s = g;
  }
  const s = W.s;
  s.segs = polyToSegs(rectPoly(0, 0, +s.w, +s.h));
  commitUndo();
  if (W.mode === "reset") P.surfaces[W.si] = s;
  else {
    if (s.name !== W.name0) {
      // typed a custom name: stop auto-naming (language switch would overwrite it)
      s.nk = null;
      s.nn = 0;
    }
    P.surfaces.push(s);
    S.tab = P.surfaces.length - 1;
    S.view = { zoom: 1, panX: 0, panY: 0 };
  }
  if (!isLinked(s)) autoLayout(s);
  S.wiz = null;
  closeModal();
  renderAll();
  changed();
  toast(W.mode === "reset" ? t("toastReset") : t("toastAdded"));
}
// library picker used from the wizard: tapping a tile sets the wizard source
function libModalPick() {
  const L = libTiles();
  modal(
    `<h3>📚 ${t("lib")}</h3><div class="liblist">${L.map(
      (q, i) =>
        `<div class="librow"><div><b>${esc(q.name || "—")}</b><br><small>${fmtIn(+q.w)}×${fmtIn(+q.h)}${+q.price ? ` · $${(+q.price).toFixed(2)}/sf` : ""}</small></div><div class="btns"><button class="btn sm p" data-act="wizPick:${q.id}">${t("libUse")}</button><button class="btn sm" data-act="libEdit:${i}">✎</button></div></div>`,
    ).join(
      "",
    )}</div><div class="btns"><button class="btn" data-act="libNew">＋ ${t("libNew")}</button><button class="btn" data-act="wizBack">${t("back")}</button></div>`,
  );
  S.reModal = null;
}

/* ================= toast with undo ================= */
let toastT = 0;
function toast(msg, undo = true) {
  let el = $("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }
  el.innerHTML = `<span>${esc(msg)}</span>${undo ? `<button data-act="toastUndo">↶ ${t("undoW")}</button>` : ""}`;
  el.classList.add("on");
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove("on"), 5000);
}

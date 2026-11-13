"use strict";
/* ================= ergonomics ================= */

/* "⋯" menu with the less-used drawing tools */
function moreMenu() {
  const B = (act, ic, label, on) =>
    `<button class="mm ${on ? "on" : ""}" data-act="${act}"><span>${ic}</span>${label}</button>`;
  const single = !isMulti() && cur();
  modal(
    `<h3>${t("moreT")}</h3><div class="mmgrid">${
      (single ? B("rotate", "⟲", t("mRotate")) : "") +
      B("nums", "#", t("mNums"), S.nums) +
      B("labels", "Aa", t("mLabels"), S.labels) +
      B("fit", "⤢", t("mFit")) +
      B("full", "⛶", t("mFull"), S.full) +
      B("site", "👷", t("mSite"), S.site) +
      B("texToggle", "📷", t("mTex"), S.texOn) +
      B("pin", "📌", t("mPin"), S.pin !== false) +
      B("lib", "📚", t("lib")) +
      B("surfList", "▦", t("mSurfs"))
    }</div><div class="btns"><button class="btn" data-act="closeModal">${t("close")}</button></div>`,
  );
}

/* all surfaces as cards with a small outline drawing */
function surfThumb(s) {
  const O = outerPoly(s),
    bb = bboxOf(O),
    W = Math.max(1, bb.x1 - bb.x0),
    H = Math.max(1, bb.y1 - bb.y0),
    k = Math.min(84 / W, 60 / H);
  const pt = (p) => `${((p[0] - bb.x0) * k + 2).toFixed(1)},${((bb.y1 - p[1]) * k + 2).toFixed(1)}`;
  let g = `<polygon points="${O.map(pt).join(" ")}" fill="#ece5d7" stroke="#141414" stroke-width="1.4"/>`;
  s.openings
    .filter((o) => o.shape !== "circle")
    .forEach((o) => {
      g += `<rect x="${((o.x - bb.x0) * k + 2).toFixed(1)}" y="${((bb.y1 - o.y - o.h) * k + 2).toFixed(1)}" width="${(o.w * k).toFixed(1)}" height="${(o.h * k).toFixed(1)}" fill="${o.type === "niche" ? "#8d877d" : "#cfc9be"}"/>`;
    });
  return `<svg viewBox="0 0 ${(W * k + 4).toFixed(0)} ${(H * k + 4).toFixed(0)}" width="${(W * k + 4).toFixed(0)}" height="${(H * k + 4).toFixed(0)}">${g}</svg>`;
}
function surfList() {
  const cards = P.surfaces
    .map((s, i) => {
      const R = compute(s);
      return `<button class="scard ${S.tab === i ? "on" : ""}" data-act="tab:${i}"><div class="th">${surfThumb(s)}</div><b>${ICON[s.type] || ""} ${esc(s.name)}</b><small>${esc(tileDesc(s.tile))} · ${sq(R.area)} sf${R.bad ? " · ⚠︎" : ""}</small></button>`;
    })
    .join("");
  modal(
    `<h3>▦ ${t("mSurfs")}</h3><div class="sgrid">${cards}</div><div class="btns"><button class="btn p" data-act="addMenu">${t("addSurf")}</button><button class="btn" data-act="tot">Σ ${t("totals")}</button><button class="btn" data-act="closeModal">${t("close")}</button></div>`,
  );
}

/* tap on a tile: show its number and cut */
function pieceAt(it, x, y) {
  const w = toWorld(x, y),
    lx = w[0] - it.dx,
    ly = w[1] - it.dy,
    R = it.R;
  if (!R || !R.all) return null;
  const inR = (p, q) => q[0] >= p.x0 && q[0] <= p.x0 + p.lw && q[1] >= p.y0 && q[1] <= p.y0 + p.lh;
  for (const q of R.nichOwn || []) for (const p of q.pieces) if (inR(p, [lx, ly])) return p;
  const L = R.toL([lx, ly]);
  for (const p of (R.nich || []).concat(R.main || [])) if (inR(p, L)) return p;
  return null;
}
function pieceInfo(it, x, y) {
  const p = pieceAt(it, x, y);
  if (!p) return;
  let m = p.no ? `№${p.no}` : "";
  if (p.row) m += ` · ${t("rowW")} ${p.row}`;
  m += " · " + (p.full ? t("fullTile") : `${t("cutW")} ${fmtIn(p.cw)} × ${fmtIn(p.ch)}`);
  if (p.hl && p.hl.length) m += " + " + [...new Set(p.hl)].map((x2) => t(x2)).join(", ");
  toast(m.replace(/^ · /, ""), false);
}

/* stats line: tap to expand */
function statDetails(R, s) {
  const T = R.T;
  const rows = [
    [t("areaSf"), sq(R.area) + " sf"],
    [t("full"), R.full],
    [t("cutsW"), R.cuts],
    [t("needW"), R.need],
    [t("orderW") + ` (+${P.waste || 0}%)`, R.order],
  ];
  if (R.boxes) rows.push([t("boxes"), R.boxes]);
  if (R.minc < 1e8) rows.push([t("minCutW"), fmtIn(R.minc) + "″"]);
  if (R.lf) rows.push(["Schluter", (R.lf / 12).toFixed(1) + " ft"]);
  rows.push([t("tile"), (T.name ? T.name + " · " : "") + tileDesc(T)]);
  return `<div class="statx">${rows.map(([a, b]) => `<div><small>${esc(String(a))}</small><b>${esc(String(b))}</b></div>`).join("")}</div>`;
}

/* section chips on top of the side panel (phones): open one section and jump to it */
function secChips() {
  const ds = [...document.querySelectorAll("#panel details[data-sec]")];
  if (ds.length < 3) return;
  const nav = document.createElement("div");
  nav.className = "secnav";
  nav.innerHTML = ds
    .map((d) => {
      const tt = d.querySelector("summary").textContent.replace(/\s+/g, " ").trim().split(" · ")[0];
      return `<button data-act="secGo:${d.dataset.sec}" class="${d.open ? "on" : ""}">${esc(tt)}</button>`;
    })
    .join("");
  $("#panel").prepend(nav);
}
function secGo(id) {
  document.querySelectorAll("#panel details[data-sec]").forEach((d) => {
    const on = d.dataset.sec === id;
    d.open = on;
    if (on) S.open.add(id);
    else S.open.delete(id);
  });
  document
    .querySelectorAll(".secnav button")
    .forEach((b) => b.classList.toggle("on", b.dataset.act === "secGo:" + id));
  const d = document.querySelector(`#panel details[data-sec="${id}"]`);
  if (d) {
    const y = d.getBoundingClientRect().top + window.scrollY - ($("#vw").getBoundingClientRect().height + 8);
    if (document.body.classList.contains("pin")) window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    else d.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* "on site" mode: big cut sizes and numbers, drawing only */
function siteToggle() {
  S.site = !S.site;
  if (S.site) {
    S.siteWas = { full: S.full, nums: S.nums, labels: S.labels };
    S.full = true;
    S.nums = true;
    S.labels = true;
  } else if (S.siteWas) Object.assign(S, S.siteWas);
  document.body.classList.toggle("full", !!S.full);
  document.body.classList.toggle("site", !!S.site);
  closeModal();
  renderAll();
}

/* new project: room presets */
const ROOMS = {
  tub: [
    ["wall", "backWall", 60, 72],
    ["wall", "leftWall", 30, 72],
    ["wall", "rightWall", 30, 72],
  ],
  shower: [
    ["wall", "backWall", 48, 96],
    ["wall", "leftWall", 36, 96],
    ["wall", "rightWall", 36, 96],
    ["pan", null, 48, 36],
  ],
  floor: [],
  splash: [["wall", null, 120, 18]],
  kitchen: [],
  empty: [["wall", null, 60, 96]],
};
function newProjModal() {
  S.np = S.np || {
    room: "shower",
    floor: true,
    fw: 96,
    fh: 72,
    wallSrc: "def",
    floorSrc: "def",
    name: "",
    client: "",
  };
  const N = S.np;
  const srcOpts = ["def"].concat(libTiles().map((q) => "l:" + q.id));
  const srcLab = (v) =>
    v === "def" ? t("wzDef") : "📚 " + libLabel(libTiles().find((q) => "l:" + q.id === v) || {});
  let h = `<h3>＋ ${t("npT")}</h3><div class="grid">${F(t("projName"), "name", "text", "n", "w2")}${F(t("clientName"), "client", "text", "n", "w2")}`;
  h += SEL(t("npRoom"), "room", Object.keys(ROOMS), 1, "n", "w2", (v) => t("room_" + v));
  if (N.room !== "floor" && N.room !== "empty")
    h += SEL(t("npWallTile"), "wallSrc", srcOpts, 0, "n", "w2", srcLab);
  if (N.room === "kitchen") {
    Object.assign(
      N,
      Object.assign({ kl: "I", ka: 120, kb: 96, kc: 96, kcab: 18, khood: 30, kwin: "none" }, N),
    );
    h +=
      SEL(t("kLayout"), "kl", ["I", "L", "U"], 1, "n", "w2", (v) => t("kl_" + v)) +
      F(t("kA"), "ka", "len", "n") +
      (N.kl !== "I" ? F(t("kB"), "kb", "len", "n") : "") +
      (N.kl === "U" ? F(t("kC"), "kc", "len", "n") : "") +
      F(t("kCab"), "kcab", "len", "n") +
      F(t("kHood"), "khood", "len", "n") +
      SEL(
        t("kWin"),
        "kwin",
        ["none", "A"].concat(N.kl !== "I" ? ["B"] : [], N.kl === "U" ? ["C"] : []),
        0,
        "n",
        "w2",
        (v) => (v === "none" ? t("kw_none") : t("k" + v)),
      );
  }
  h += `</div>`;
  if (N.room !== "kitchen") h += CHK(t("npFloor"), "floor", 1, "n");
  if (N.floor || N.room === "floor")
    h += `<div class="grid">${F(t("width"), "fw", "len", "n")}${F(t("length"), "fh", "len", "n")}${SEL(t("npFloorTile"), "floorSrc", srcOpts, 0, "n", "w2", srcLab)}</div>`;
  h += `<p class="hint">${t("npHint")}</p><div class="btns"><button class="btn p" data-act="npGo">${t("npCreate")}</button><button class="btn" data-act="newProjBlank">${t("npBlank")}</button><button class="btn" data-act="closeModal">${t("cancel")}</button></div>`;
  modal(h);
  S.reModal = newProjModal;
  S.modalLive = null;
}
function newProjGo() {
  const N = S.np;
  const p = newProject(false);
  p.surfaces = [];
  if (N.name) {
    p.name = N.name;
    p.nk = null;
  }
  p.client = N.client || "";
  DB.projects.push(p);
  P = p;
  const pick = (src, T) => {
    const q = src && src.startsWith("l:") && libTiles().find((x) => "l:" + x.id === src);
    if (q) libToTile(q, T);
  };
  const plan = ROOMS[N.room].slice();
  plan.forEach(([type, nk, w, h]) => {
    const s = newSurface(type, nk || undefined);
    s.w = w;
    s.h = h;
    s.segs = polyToSegs(rectPoly(0, 0, w, h));
    if (type === "wall") pick(N.wallSrc, s.tile);
    P.surfaces.push(s);
  });
  if (N.room === "kitchen") {
    const runs = [["A", +N.ka || 120]];
    if (N.kl !== "I") runs.push(["B", +N.kb || 96]);
    if (N.kl === "U") runs.push(["C", +N.kc || 96]);
    const ch = +N.kcab || 18,
      hood = +N.khood || 30;
    runs.forEach(([nm, L]) => {
      const s = newSurface("wall");
      s.name = t("k" + nm).replace(/\s*\(.*\)/, "");
      s.nk = null;
      s.nn = 0;
      s.h = ch;
      pick(N.wallSrc, s.tile);
      const segs = [];
      if (nm === "A" && L >= 54) {
        const a = Math.round(((L - 30) / 2) * 8) / 8;
        segs.push(
          { k: "cab", len: a, h: ch },
          { k: "hood", len: 30, h: hood },
          { k: "cab", len: L - 30 - a, h: ch },
        );
      } else if (N.kwin === nm && L >= 48) {
        const a = Math.round(((L - 36) / 2) * 8) / 8;
        segs.push(
          { k: "cab", len: a, h: ch },
          { k: "window", len: 36, h: ch },
          { k: "cab", len: L - 36 - a, h: ch },
        );
      } else segs.push({ k: "cab", len: L, h: ch });
      s.bs = Object.assign(bsDefault(L), { segs: segs.map((q) => Object.assign({ sl: false, hR: q.h }, q)) });
      bsApply(s);
      if (N.kwin === nm) {
        const a = segs[0].len;
        s.openings.push({
          id: uid(),
          type: "window",
          shape: "rect",
          x: a,
          y: 6,
          w: 36,
          h: ch + 12,
          trim: false,
        });
      }
      P.surfaces.push(s);
    });
  }
  if ((N.floor && N.room !== "kitchen") || N.room === "floor" || !P.surfaces.length) {
    const f = newSurface("floor", "bathFloor");
    f.w = +N.fw || 96;
    f.h = +N.fh || 72;
    f.segs = polyToSegs(rectPoly(0, 0, f.w, f.h));
    pick(N.floorSrc, f.tile);
    P.surfaces.push(f);
  }
  P.surfaces.forEach((s) => autoLayout(s));
  resetUndo();
  S.tab = 0;
  S.np = null;
  closeModal();
  renderAll();
  saveSoon();
  toast(t("npDone"), false);
}

/* hooks */
$("#stat").addEventListener("click", () => {
  if (isMulti() || S.layer === "prep") return;
  S.statX = !S.statX;
  renderStat();
  applyPin();
});
function applyPin() {
  document.body.classList.toggle("pin", S.pin !== false && innerWidth < 900 && !S.client && !S.full);
  document.body.classList.toggle("site", !!S.site);
  const vw = $("#vw");
  if (vw) document.documentElement.style.setProperty("--vwh", vw.offsetHeight + "px");
}
{
  const rp = renderPanel;
  renderPanel = function () {
    rp();
    if (innerWidth < 900 && !S.client) secChips();
  };
  const ra = renderAll;
  renderAll = function () {
    ra();
    applyPin();
  };
  addEventListener("resize", applyPin);
}

function openFull(s, fromTab) {
  const i = P.surfaces.indexOf(s);
  if (i < 0) return;
  S.fullFrom = fromTab !== i ? fromTab : null;
  S.tab = i;
  S.view = { zoom: 1, panX: 0, panY: 0 };
  S.full = true;
  document.body.classList.add("full");
  renderAll();
}

/* floor zones: move them on the whole-floor plan */
const zoneMode = () => S.tab === "floor" && !!S.zoneMove && canEdit();
// snap a zone's corners / edges to the other zones (tolerance in inches), else to 1/8″
function zoneSnap(s, x, y, tol) {
  const O = outerPoly(s),
    others = P.surfaces.filter((q) => q !== s && q.type !== "wall");
  const xs = [],
    ys = [];
  others.forEach((q) => {
    const px = +(q.pos || {}).x || 0,
      py = +(q.pos || {}).y || 0;
    outerPoly(q).forEach(([a, b]) => {
      xs.push(a + px);
      ys.push(b + py);
    });
  });
  let bx = null,
    by = null;
  O.forEach(([a, b]) => {
    xs.forEach((v) => {
      const d = v - (a + x);
      if (Math.abs(d) < tol && (bx == null || Math.abs(d) < Math.abs(bx))) bx = d;
    });
    ys.forEach((v) => {
      const d = v - (b + y);
      if (Math.abs(d) < tol && (by == null || Math.abs(d) < Math.abs(by))) by = d;
    });
  });
  const r8 = (v) => Math.round(v * 8) / 8;
  return [bx != null ? x + bx : r8(x), by != null ? y + by : r8(y)];
}

/* double tap on the empty field around the drawing: full screen (inside full screen the drag code closes it) */
{
  let down = null,
    lastEmpty = null;
  svg.addEventListener(
    "pointerdown",
    (e) => {
      down = { x: e.clientX, y: e.clientY };
    },
    true,
  );
  svg.addEventListener("pointerup", (e) => {
    const d = down;
    down = null;
    if (!d || S.full || S.tab === "tot" || ptrs.size > 1) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10) return (lastEmpty = null);
    if (hitAt(e.clientX, e.clientY) || (e.target.closest && e.target.closest("[data-dim],[data-conn]")))
      return (lastEmpty = null);
    const now = Date.now();
    if (
      lastEmpty &&
      now - lastEmpty.t < 380 &&
      Math.hypot(e.clientX - lastEmpty.x, e.clientY - lastEmpty.y) < 40
    ) {
      lastEmpty = null;
      S.fullFrom = null;
      act("full");
      return;
    }
    lastEmpty = { t: now, x: e.clientX, y: e.clientY };
  });
}

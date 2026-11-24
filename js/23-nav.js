"use strict";
/* ================= navigation =================
   Bottom tab bar (Projects · Plan · Layout · Materials · PDF), grouped surface tabs,
   the settings "drawer" on phones, quick actions on a tapped tile, site mode sizing. */

const NAVT = {
  ru: {
    nHome: "Проекты",
    nPlan: "План",
    nLay: "Раскладка",
    nMat: "Материалы",
    nPdf: "PDF",
    gWall: "Стены",
    gFloor: "Пол",
    gPan: "Душ",
    gBs: "Фартук",
    pcolHide: "Свернуть настройки",
    pcolShow: "Настройки",
    cliShow: "Показать клиенту",
    qaJoint: "Шов сюда",
    qaCenter: "Центр по плитке",
    qaDeco: "Декор / вставка",
    qaDecoOff: "Убрать декор",
    decoN: "Декор",
    plOpenL: "Раскладка",
  },
  en: {
    nHome: "Projects",
    nPlan: "Plan",
    nLay: "Layout",
    nMat: "Materials",
    nPdf: "PDF",
    gWall: "Walls",
    gFloor: "Floor",
    gPan: "Shower",
    gBs: "Backsplash",
    pcolHide: "Hide settings",
    pcolShow: "Settings",
    cliShow: "Show the client",
    qaJoint: "Joint here",
    qaCenter: "Center on tile",
    qaDeco: "Deco / insert",
    qaDecoOff: "Remove deco",
    decoN: "Deco",
    plOpenL: "Layout",
  },
};
const nt = (k) => (NAVT[lang] || NAVT.en)[k] || k;

/* ---------- bottom tab bar ---------- */
function navCur() {
  if (S.plan) return "plan";
  if (S.home) return "home";
  if (S.tab === "tot") return "mat";
  return "lay";
}
function renderBtab() {
  let el = $("#btab");
  if (!el) {
    el = document.createElement("nav");
    el.id = "btab";
    document.body.appendChild(el);
  }
  const keys = ["home", "plan", "lay", "mat"],
    c = navCur(),
    lab = { home: "nHome", plan: "nPlan", lay: "nLay", mat: "nMat" },
    sig = lang + "|" + keys.join();
  // keep the bar between renders so the highlight slides instead of jumping
  if (el.dataset.sig !== sig) {
    el.dataset.sig = sig;
    el.innerHTML =
      `<i class="bind" aria-hidden="true"></i>` +
      keys
        .map(
          (k) =>
            `<button data-act="nav:${k}" data-k="${k}">${nt(lab[k])}</button>`,
        )
        .join("");
  }
  const i = Math.max(0, keys.indexOf(c));
  el.style.setProperty("--bi", i);
  el.querySelectorAll("button").forEach((b) => {
    const on = b.dataset.k === c;
    b.classList.toggle("on", on);
    if (on) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  document.body.classList.toggle("nobtab", !!(S.full || S.client));
}
function navGo(k) {
  closeModal();
  if (k === "pdf") return S.plan ? planPdf() : exportMenu();
  if (S.plan && k !== "plan") {
    try {
      planAutoBuild();
    } catch (e) {
      console.error(e);
    }
    S.plan = null;
    document.body.classList.remove("planon");
  }
  if (k === "home") return showHome(true);
  if (k === "plan") {
    S.home = false;
    document.body.classList.remove("homeon");
    return planOpen();
  }
  if (k === "mat") S.tab = "tot";
  else if (k === "lay" && S.tab === "tot")
    S.tab =
      typeof S.lastTab === "number" && P.surfaces[S.lastTab] ? S.lastTab : 0;
  showHome(false);
}

/* ---------- surface tabs grouped when there are many ---------- */
function surfGroup(s) {
  if (s.bs && s.bs.on) return "bs";
  if (s.type === "pan") return "pan";
  if (s.type === "floor") return "floor";
  return "wall";
}
{
  const rt = renderTabs;
  renderTabs = function () {
    if (typeof S.tab === "number") S.lastTab = S.tab;
    const n = P.surfaces.length;
    if (n <= 6 || S.client) return rt();
    const groups = ["wall", "floor", "pan", "bs"].filter((g) =>
      P.surfaces.some((s) => surfGroup(s) === g),
    );
    const curS = typeof S.tab === "number" ? P.surfaces[S.tab] : null,
      open =
        S.tgrp && groups.includes(S.tgrp)
          ? S.tgrp
          : curS
            ? surfGroup(curS)
            : groups[0];
    const nw = P.surfaces.filter((s) => s.type === "wall").length,
      nf = P.surfaces.filter((s) => s.type !== "wall").length;
    const lbl = {
      wall: nt("gWall"),
      floor: nt("gFloor"),
      pan: nt("gPan"),
      bs: nt("gBs"),
    };
    let h = `<button data-act="surfList" class="lst" title="${t("mSurfs")}">☰</button>`;
    groups.forEach((g) => {
      const items = P.surfaces
          .map((s, i) => [s, i])
          .filter(([s]) => surfGroup(s) === g),
        on = g === open;
      h += `<button data-act="tgrp:${g}" class="grp ${on ? "gon" : ""}">${lbl[g]} <small>${items.length}</small> ${on ? "▾" : "▸"}</button>`;
      if (on) {
        if (g === "wall" && nw >= 2)
          h += `<button data-act="all" class="all ${S.tab === "all" ? "on" : ""}">▥▥ ${t("allWalls")}</button>`;
        if (g === "floor" && nf >= 2)
          h += `<button data-act="floorTab" class="all ${S.tab === "floor" ? "on" : ""}">▦▦ ${t("allFloor")}</button>`;
        h += items
          .map(
            ([s, i]) =>
              `<button data-act="tab:${i}" class="${S.tab === i ? "on" : ""}">${ICON[s.type] || ""} ${esc(s.name)}</button>`,
          )
          .join("");
      }
    });
    h += `<button data-act="tot" class="${S.tab === "tot" ? "on" : ""}">Σ ${t("totals")}</button><button data-act="addMenu" class="add">${t("addSurf")}</button>`;
    $("#tabs").innerHTML = h;
    const on = $("#tabs button.on");
    if (on && on.scrollIntoView)
      on.scrollIntoView({ block: "nearest", inline: "center" });
  };
}

/* ---------- settings drawer (phones): hide the panel so the drawing gets the screen ---------- */
// phone-sized screen; innerWidth alone can read wide for a moment while the page re-renders
function narrowW() {
  return Math.min(innerWidth, (screen && screen.width) || innerWidth) < 900;
}
// folded unless the user opened them (S.pcol === false)
function pcolOn() {
  return S.pcol !== false && narrowW() && !S.client && S.tab !== "tot";
}
function pcolBar() {
  if (!narrowW() || S.client || S.tab === "tot") return ""; // materials live in the panel
  return pcolOn()
    ? `<div class="pcol pcolbar"><button class="btn" data-act="pcol">${nt("pcolShow")}</button><button class="btn p" data-act="client">${nt("cliShow")}</button></div>`
    : `<div class="pcol pcolbar open"><i aria-hidden="true"></i><button data-act="pcol">${nt("pcolHide")}</button></div>`;
}
{
  const rp = renderPanel;
  renderPanel = function () {
    rp();
    const p = $("#panel");
    if (p && narrowW() && !S.client)
      p.insertAdjacentHTML("afterbegin", pcolBar());
    document.body.classList.toggle("pcol", pcolOn());
  };
  const ra = renderAll;
  renderAll = function () {
    ra();
    renderBtab();
  };
}

/* ---------- quick actions on a tapped tile ---------- */
/* a tile's place in the grid (column:row from the layout origin) — stays with the tile when the layout shifts */
function decoKey(p, T) {
  if (!p) return "";
  const { tw, th } = rdims(T),
    g = +T.g || 0,
    ox = +T.ox || 0,
    oy = +T.oy || 0;
  return `${Math.round((p.x0 - ox) / (tw + g))}:${Math.round((p.y0 - oy) / (th + g))}`;
}
function tileQuick(p) {
  const s = cur();
  if (!s || !p || S.client) return;
  S.qp = { key: decoKey(p, effT(s)), c: [p.x0 + p.lw / 2, p.y0 + p.lh / 2] };
  const deco = (s.deco || []).includes(S.qp.key);
  const old = $("#qa");
  if (old) old.remove();
  const el = document.createElement("div");
  el.id = "qa";
  el.innerHTML = `<button data-act="qa:joint">┼ ${nt("qaJoint")}</button><button data-act="qa:center">◎ ${nt("qaCenter")}</button><button data-act="qa:deco">${deco ? "✕ " + nt("qaDecoOff") : "◆ " + nt("qaDeco")}</button>`;
  document.body.appendChild(el);
  clearTimeout(S.qaT);
  S.qaT = setTimeout(() => el.remove(), 5000);
}
function qaAct(k) {
  const s = cur(),
    q = S.qp,
    el = $("#qa");
  if (el) el.remove();
  if (!s || !q) return;
  if (k === "joint" || k === "center") {
    // the piece's own corner is in the layout frame; map its center back to the surface frame
    const R = compute(s),
      c = R.toW ? R.toW(q.c) : q.c;
    if (k === "joint") {
      // put a grout joint on the tapped tile's lower-left corner
      const T = R.T,
        h2 = [q.c[0] - rdims(T).tw / 2, q.c[1] - rdims(T).th / 2],
        w2 = R.toW ? R.toW(h2) : h2;
      centerOn(s, w2[0], w2[1], true);
    } else centerOn(s, c[0], c[1], false);
  } else if (k === "deco") {
    s.deco = s.deco || [];
    const i = s.deco.indexOf(q.key);
    if (i >= 0) s.deco.splice(i, 1);
    else s.deco.push(q.key);
  }
  changed();
  renderPanel();
}

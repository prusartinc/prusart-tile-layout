"use strict";
/* ================= home (dashboard) + new project interview ================= */
/* #home is a full-screen page over the app: project cards, search, tools; and the step-by-step
   "new project" interview whose answers (S.nh, input scope "h") build the surfaces. */
function homeEl() {
  let el = $("#home");
  if (!el) {
    el = document.createElement("div");
    el.id = "home";
    document.body.appendChild(el);
    el.addEventListener("input", onInp);
    el.addEventListener("change", onInp);
  }
  return el;
}
function showHome(on) {
  S.home = !!on;
  document.body.classList.toggle("homeon", S.home);
  if (S.home) renderHome();
  else {
    renderAll();
    requestAnimationFrame(() => draw());
  }
}
function projStats(p) {
  let sf = 0,
    w = 0,
    f = 0;
  (p.surfaces || []).forEach((s) => {
    try {
      sf += Math.abs(polyArea(outerPoly(s))) / 144;
    } catch (e) {}
    if (s.type === "wall") w++;
    else f++;
  });
  return { sf, w, f };
}
function homeThumb(p) {
  const ss = (p.surfaces || []).slice(0, 4);
  if (!ss.length) return `<div class="hth empty">＋</div>`;
  return `<div class="hth">${ss
    .map((s) => {
      try {
        return surfThumb(s);
      } catch (e) {
        return "";
      }
    })
    .join("")}</div>`;
}
function renderHome() {
  const el = homeEl();
  if (S.nh && S.nh.step) return renderInterview();
  const q = (S.hq || "").toLowerCase();
  const list = [...DB.projects]
    .sort((a, b) => (b.updated || 0) - (a.updated || 0))
    .filter((p) => !q || [p.name, p.client, p.addr].join(" ").toLowerCase().includes(q));
  const fmtD = (ts) =>
    ts
      ? new Date(ts).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short" })
      : "";
  const sy = DB.sync && DB.sync.on;
  let h = `<div class="hhead"><div class="hbrand">${($("header .brand svg") || {}).outerHTML || ""}<div><b>PrusArt Inc</b><small>${t("app")}</small></div></div><div class="hhb"><button data-act="lang">${lang === "ru" ? "EN" : "RU"}</button><button data-act="homeTheme">${THEME === "dark" ? "☀︎" : "☾"}</button></div></div>`;
  h += `<div class="hwrap">`;
  if (P && DB.projects.includes(P))
    h += `<button class="hcont" data-act="homeOpen:${P.id}"><span>${t("hContinue")}</span><b>${esc(P.name)}</b><small>${esc(P.client || "")}</small><i>→</i></button>`;
  h += `<button class="hnew" data-act="nhStart"><span>＋</span><div><b>${t("newProj")}</b><small>${t("hNewHint")}</small></div></button>`;
  h += `<div class="hsearch"><input id="hq" type="search" placeholder="🔎 ${t("hSearch")}" value="${esc(S.hq || "")}"></div>`;
  h += `<p class="hsec">${t("projects")} · ${DB.projects.length}</p><div class="hgrid">`;
  h += list
    .map((p) => {
      const st = projStats(p);
      return `<div class="hcard ${P && p.id === P.id ? "on" : ""}"><button class="hopen" data-act="homeOpen:${p.id}">${homeThumb(p)}<div class="hinfo"><b>${esc(p.name)}</b><small>${esc([p.client, p.addr].filter(Boolean).join(" · "))}</small><span>${st.w ? `${st.w} ${t("hWalls")}` : ""}${st.w && st.f ? " · " : ""}${st.f ? `${st.f} ${t("hFloors")}` : ""} · ${Math.round(st.sf)} sf · ${fmtD(p.updated)}</span></div></button><button class="hmore" data-act="homeMenu:${p.id}">⋯</button></div>`;
    })
    .join("");
  if (!list.length) h += `<p class="hint">${t("hNone")}</p>`;
  h += `</div><p class="hsec">${t("hTools")}</p><div class="htools"><button data-act="lib">📚<span>${t("lib")}</span></button><button data-act="bkModal">💾<span>${t("bkT")}</span></button><button data-act="syModal">🔄<span>${sy ? t("syOnShort") : t("syT")}</span></button><button data-act="homeImport">⬆<span>${t("importT")}</span></button></div></div>`;
  el.innerHTML = h;
  const inp = $("#hq");
  if (inp)
    inp.addEventListener("input", () => {
      S.hq = inp.value;
      const pos = inp.selectionStart;
      renderHome();
      const n = $("#hq");
      n.focus();
      try {
        n.setSelectionRange(pos, pos);
      } catch (e) {}
    });
}
function homeMenu(id) {
  const p = DB.projects.find((x) => x.id === id);
  if (!p) return;
  modal(
    `<h3>${esc(p.name)}</h3><div class="grid">${F(t("projName"), `__hp.name`, "text", "x", "w2")}${F(t("hClient"), `__hp.client`, "text", "x", "w2")}${F(t("hAddr"), `__hp.addr`, "text", "x", "w2")}</div><div class="btns"><button class="btn p" data-act="homeSave">${t("done")}</button><button class="btn" data-act="dupProj:${p.id}">${t("dup")}</button>${DB.projects.length > 1 ? `<button class="btn d" data-act="homeDel:${p.id}">${t("del")}</button>` : ""}</div>`,
  );
  S.__hp = p;
}

/* ---------- new project interview ---------- */
const JOBS = ["shower", "tub", "bfloor", "kitchen", "floor", "wall"];
function nhDefaults() {
  return {
    step: 1,
    name: "",
    client: "",
    addr: "",
    jobs: { shower: false, tub: false, bfloor: false, kitchen: false, floor: false, wall: false },
    sh: { walls: "3", back: 60, side: 36, h: 96, pan: true, curb: true, niche: true, drain: "center" },
    tb: { len: 60, dep: 30, h: 72, niche: true },
    bf: { w: 96, l: 72, heat: false, volt: "120", toilet: true },
    kt: { kl: "I", ka: 120, kb: 96, kc: 96, kcab: 18, khood: 30, kwin: "none" },
    fl: { name: "", w: 120, l: 120, heat: false },
    wl: { name: "", w: 96, h: 48 },
    tiles: { wall: "def", floor: "def", pan: "def", ww: 12, wh: 24, fw: 24, fh: 24 },
    prep: { wall: "foam12", floor: "ditra" },
    prof: "JOLLY",
  };
}
function nhSteps(N) {
  return ["info", "jobs", "q", "mat", "go"];
}
function renderInterview() {
  const N = S.nh,
    el = homeEl(),
    steps = nhSteps(N),
    k = steps[N.step - 1];
  const any = JOBS.some((j) => N.jobs[j]);
  let h = `<div class="hhead"><button class="hback" data-act="nhBack">←</button><div class="hsteps">${steps.map((_, i) => `<i class="${i + 1 <= N.step ? "on" : ""}"></i>`).join("")}</div><button class="hback" data-act="nhCancel">✕</button></div><div class="hwrap nh">`;
  if (k === "info") {
    h += `<h2>${t("nhInfoT")}</h2><div class="grid">${F(t("projName"), "name", "text", "h", "w2")}${F(t("hClient"), "client", "text", "h", "w2")}${F(t("hAddr"), "addr", "text", "h", "w2")}</div>`;
  } else if (k === "jobs") {
    h += `<h2>${t("nhJobsT")}</h2><p class="hint">${t("nhJobsHint")}</p><div class="jobs">${JOBS.map(
      (j) =>
        `<button class="job ${N.jobs[j] ? "on" : ""}" data-act="nhJob:${j}"><span>${{ shower: "🚿", tub: "🛁", bfloor: "🚽", kitchen: "🍳", floor: "▦", wall: "🧱" }[j]}</span><b>${t("job_" + j)}</b><small>${t("jobd_" + j)}</small></button>`,
    ).join("")}</div>`;
  } else if (k === "q") {
    h += `<h2>${t("nhQT")}</h2>`;
    const Y = (label, key) => CHK(label, key, 1, "h");
    if (N.jobs.shower)
      h += `<p class="nh">🚿 ${t("job_shower")}</p><div class="grid">${SEL(t("nhShWalls"), "sh.walls", ["3", "2"], 1, "h", "w2", (v) => t("nhw_" + v))}${F(t("nhBack"), "sh.back", "len", "h")}${F(t("nhSide"), "sh.side", "len", "h")}${F(t("nhTileH"), "sh.h", "len", "h")}${SEL(t("nhDrain"), "sh.drain", ["center", "linear"], 0, "h", "", (v) => t("nhd_" + v))}</div>${Y(t("nhPan"), "sh.pan")}${Y(t("nhCurb"), "sh.curb")}${Y(t("nhNiche"), "sh.niche")}`;
    if (N.jobs.tub)
      h += `<p class="nh">🛁 ${t("job_tub")}</p><div class="grid">${F(t("nhTubL"), "tb.len", "len", "h")}${F(t("nhTubD"), "tb.dep", "len", "h")}${F(t("nhTubH"), "tb.h", "len", "h")}</div>${Y(t("nhNiche"), "tb.niche")}`;
    if (N.jobs.bfloor)
      h += `<p class="nh">🚽 ${t("job_bfloor")}</p><div class="grid">${F(t("width"), "bf.w", "len", "h")}${F(t("length"), "bf.l", "len", "h")}</div>${Y(t("nhToilet"), "bf.toilet")}${Y(t("nhHeat"), "bf.heat")}${N.bf.heat ? `<div class="grid">${SEL(t("volt"), "bf.volt", ["120", "240"], 0, "h", "", (v) => v + " V")}</div>` : ""}`;
    if (N.jobs.kitchen) {
      const K = N.kt;
      h += `<p class="nh">🍳 ${t("job_kitchen")}</p><div class="grid">${SEL(t("kLayout"), "kt.kl", ["I", "L", "U"], 1, "h", "w2", (v) => t("kl_" + v))}${F(t("kA"), "kt.ka", "len", "h")}${K.kl !== "I" ? F(t("kB"), "kt.kb", "len", "h") : ""}${K.kl === "U" ? F(t("kC"), "kt.kc", "len", "h") : ""}${F(t("kCab"), "kt.kcab", "len", "h")}${F(t("kHood"), "kt.khood", "len", "h")}${SEL(t("kWin"), "kt.kwin", ["none", "A"].concat(K.kl !== "I" ? ["B"] : [], K.kl === "U" ? ["C"] : []), 0, "h", "w2", (v) => (v === "none" ? t("kw_none") : t("k" + v)))}</div>`;
    }
    if (N.jobs.floor)
      h += `<p class="nh">▦ ${t("job_floor")}</p><div class="grid">${F(t("name"), "fl.name", "text", "h", "w2")}${F(t("width"), "fl.w", "len", "h")}${F(t("length"), "fl.l", "len", "h")}</div>${Y(t("nhHeat"), "fl.heat")}`;
    if (N.jobs.wall)
      h += `<p class="nh">🧱 ${t("job_wall")}</p><div class="grid">${F(t("name"), "wl.name", "text", "h", "w2")}${F(t("width"), "wl.w", "len", "h")}${F(t("height"), "wl.h", "len", "h")}</div>`;
  } else if (k === "mat") {
    const src = ["def"].concat(
      libTiles().map((q) => "l:" + q.id),
      ["man"],
    );
    const lab = (v) =>
      v === "def"
        ? t("wzDef")
        : v === "man"
          ? "✎ " + t("wzManual")
          : "📚 " + libLabel(libTiles().find((q) => "l:" + q.id === v) || {});
    const hasWall = N.jobs.shower || N.jobs.tub || N.jobs.kitchen || N.jobs.wall,
      hasFloor = N.jobs.bfloor || N.jobs.floor;
    h += `<h2>${t("nhMatT")}</h2><p class="hint">${t("nhMatHint")}</p><div class="grid">`;
    if (hasWall) {
      h += SEL(t("npWallTile"), "tiles.wall", src, 1, "h", "w2", lab);
      if (N.tiles.wall === "man")
        h += F(t("tileW"), "tiles.ww", "len", "h") + F(t("tileL"), "tiles.wh", "len", "h");
    }
    if (hasFloor) {
      h += SEL(t("npFloorTile"), "tiles.floor", src, 1, "h", "w2", lab);
      if (N.tiles.floor === "man")
        h += F(t("tileW"), "tiles.fw", "len", "h") + F(t("tileL"), "tiles.fh", "len", "h");
    }
    if (N.jobs.shower && N.sh.pan) h += SEL(t("nhPanTile"), "tiles.pan", src, 0, "h", "w2", lab);
    const boards = UNDER.filter((u) => u.k === "board" || u.k === "mem" || u.id === "none").map((u) => u.id),
      floors = UNDER.filter((u) => u.k === "mem" || u.k === "ply" || u.k === "board" || u.id === "none").map(
        (u) => u.id,
      );
    if (N.jobs.shower || N.jobs.tub)
      h += SEL(t("nhWallPrep"), "prep.wall", boards, 0, "h", "w2", (id) => underOf(id).n);
    if (hasFloor && !((N.jobs.bfloor && N.bf.heat) || (N.jobs.floor && N.fl.heat)))
      h += SEL(t("nhFloorPrep"), "prep.floor", floors, 0, "h", "w2", (id) => underOf(id).n);
    if (hasWall)
      h += SEL(
        t("schProfile"),
        "prof",
        Object.keys(PROF).filter((x) => PROF[x].use === "edge"),
        0,
        "h",
        "w2",
        (v) => v,
      );
    h += `</div>`;
  } else {
    h += `<h2>${t("nhGoT")}</h2><ul class="nhsum">${nhSummary(N)
      .map((x) => `<li>${x}</li>`)
      .join("")}</ul><p class="hint">${t("nhGoHint")}</p>`;
  }
  const last = N.step === steps.length;
  h += `<div class="nhbar"><button class="btn" data-act="nhBack">${N.step === 1 ? t("cancel") : "← " + t("back")}</button><button class="btn p" data-act="${last ? "nhCreate" : "nhNext"}" ${k === "jobs" && !any ? "disabled" : ""}>${last ? "✓ " + t("npCreate") : t("next") + " →"}</button></div></div>`;
  el.innerHTML = h;
  S.reModal = null;
}
function nhSummary(N) {
  const out = [],
    f = (v) => fmtIn(+v) + "″";
  if (N.jobs.shower)
    out.push(
      `🚿 ${t("job_shower")}: ${N.sh.walls === "3" ? 3 : 2} ${t("hWalls")} (${f(N.sh.back)} + ${f(N.sh.side)}, ${f(N.sh.h)})${N.sh.pan ? " + " + t("nhPanShort") : ""}${N.sh.curb ? " + curb" : ""}${N.sh.niche ? " + " + t("niche").toLowerCase() : ""}`,
    );
  if (N.jobs.tub)
    out.push(
      `🛁 ${t("job_tub")}: ${f(N.tb.len)} × ${f(N.tb.dep)}, ${f(N.tb.h)}${N.tb.niche ? " + " + t("niche").toLowerCase() : ""}`,
    );
  if (N.jobs.bfloor)
    out.push(
      `🚽 ${t("job_bfloor")}: ${f(N.bf.w)} × ${f(N.bf.l)}${N.bf.toilet ? " + " + t("toilet").toLowerCase() : ""}${N.bf.heat ? ` + 🔥 DITRA-HEAT ${N.bf.volt} V` : ""}`,
    );
  if (N.jobs.kitchen) out.push(`🍳 ${t("job_kitchen")}: ${t("kl_" + N.kt.kl)}, A ${f(N.kt.ka)}`);
  if (N.jobs.floor)
    out.push(`▦ ${N.fl.name || t("job_floor")}: ${f(N.fl.w)} × ${f(N.fl.l)}${N.fl.heat ? " + 🔥" : ""}`);
  if (N.jobs.wall) out.push(`🧱 ${N.wl.name || t("job_wall")}: ${f(N.wl.w)} × ${f(N.wl.h)}`);
  return out;
}
function nhPickTile(src, T, man) {
  if (src && src.startsWith("l:")) {
    const q = libTiles().find((x) => "l:" + x.id === src);
    if (q) libToTile(q, T);
  } else if (src === "man" && man) {
    T.w = +man[0] || T.w;
    T.h = +man[1] || T.h;
  }
}
function nhCreate() {
  const N = S.nh;
  const p = newProject(false);
  p.surfaces = [];
  if (N.name) {
    p.name = N.name;
    p.nk = null;
  }
  p.client = N.client || "";
  p.addr = N.addr || "";
  p.sch = Object.assign({}, p.sch, { type: N.prof || "JOLLY", profile: N.prof || "JOLLY" });
  DB.projects.push(p);
  P = p;
  const named = (type, name) => {
    const s = newSurface(type);
    s.name = name;
    s.nk = null;
    s.nn = 0;
    return s;
  };
  const wallTile = (s) => nhPickTile(N.tiles.wall, s.tile, [N.tiles.ww, N.tiles.wh]);
  const floorTile = (s) => {
    s.tile = stdTile("floor");
    nhPickTile(N.tiles.floor, s.tile, [N.tiles.fw, N.tiles.fh]);
  };
  const rectS = (s, w, h) => {
    s.w = +w;
    s.h = +h;
    s.segs = polyToSegs(rectPoly(0, 0, s.w, s.h));
  };
  const add = (s) => P.surfaces.push(s);
  if (N.jobs.shower) {
    const H = +N.sh.h || 96,
      sh = t("job_shower");
    const back = named("wall", `${sh}: ${t("backWall").toLowerCase()}`);
    rectS(back, N.sh.back, H);
    wallTile(back);
    back.stack.under = N.prep.wall;
    back.wet = true;
    if (N.sh.niche)
      back.openings.push({
        id: uid(),
        type: "niche",
        shape: "rect",
        x: Math.max(0, (+N.sh.back - 24) / 2),
        y: 42,
        w: 24,
        h: 12,
        d: 3.5,
        trim: true,
      });
    const left = named("wall", `${sh}: ${t("leftWall").toLowerCase()}`);
    rectS(left, N.sh.side, H);
    left.tile = JSON.parse(JSON.stringify(back.tile));
    left.stack.under = N.prep.wall;
    left.wet = true;
    left.openings.push({ id: uid(), type: "valve", shape: "circle", x: +N.sh.side / 2, y: 48, dia: 3 });
    add(back);
    add(left);
    if (N.sh.walls === "3") {
      const right = named("wall", `${sh}: ${t("rightWall").toLowerCase()}`);
      rectS(right, N.sh.side, H);
      right.tile = JSON.parse(JSON.stringify(back.tile));
      right.stack.under = N.prep.wall;
      right.wet = true;
      add(right);
    }
    if (N.sh.pan) {
      const pan = named("pan", `${sh}: ${t("nhPanShort")}`);
      rectS(pan, N.sh.back, N.sh.side);
      pan.tile = stdTile("pan");
      nhPickTile(N.tiles.pan, pan.tile, null);
      pan.curb.on = !!N.sh.curb;
      pan.curb.len = +N.sh.back;
      pan.drain =
        N.sh.drain === "linear"
          ? Object.assign(pan.drain, {
              type: "linear",
              x: 3,
              y: +N.sh.side - 5,
              len: Math.max(24, +N.sh.back - 6),
              wid: 2.75,
            })
          : Object.assign(pan.drain, { type: "center", x: +N.sh.back / 2, y: +N.sh.side / 2 });
      add(pan);
    }
  }
  if (N.jobs.tub) {
    const tb = t("job_tub"),
      H = +N.tb.h || 72;
    const back = named("wall", `${tb}: ${t("backWall").toLowerCase()}`);
    rectS(back, N.tb.len, H);
    wallTile(back);
    back.stack.under = N.prep.wall;
    back.wet = true;
    if (N.tb.niche)
      back.openings.push({
        id: uid(),
        type: "niche",
        shape: "rect",
        x: Math.max(0, (+N.tb.len - 24) / 2),
        y: 30,
        w: 24,
        h: 12,
        d: 3.5,
        trim: true,
      });
    add(back);
    ["leftWall", "rightWall"].forEach((nk2, i) => {
      const s = named("wall", `${tb}: ${t(nk2).toLowerCase()}`);
      rectS(s, N.tb.dep, H);
      s.tile = JSON.parse(JSON.stringify(back.tile));
      s.stack.under = N.prep.wall;
      s.wet = true;
      if (i === 0)
        s.openings.push({ id: uid(), type: "valve", shape: "circle", x: +N.tb.dep / 2, y: 20, dia: 3 });
      add(s);
    });
  }
  const floorPrep = (s, heat, volt) => {
    if (heat) {
      s.stack.under = "ditraheat";
      s.heat.on = true;
      s.heat.sys = "ditraheat";
      s.heat.volt = volt || "120";
    } else s.stack.under = N.prep.floor;
  };
  if (N.jobs.bfloor) {
    const f = newSurface("floor", "bathFloor");
    rectS(f, N.bf.w, N.bf.l);
    floorTile(f);
    floorPrep(f, N.bf.heat, N.bf.volt);
    if (N.bf.toilet)
      f.openings.push({
        id: uid(),
        type: "toilet",
        shape: "circle",
        x: Math.max(15, +N.bf.w - 18),
        y: 12,
        dia: 5,
        face: "auto",
      });
    add(f);
  }
  if (N.jobs.floor) {
    const f = named("floor", N.fl.name || t("job_floor"));
    rectS(f, N.fl.w, N.fl.l);
    floorTile(f);
    floorPrep(f, N.fl.heat, "120");
    add(f);
  }
  if (N.jobs.kitchen) buildKitchen(N.kt, (s) => wallTile(s));
  if (N.jobs.wall) {
    const s = named("wall", N.wl.name || t("job_wall"));
    rectS(s, N.wl.w, N.wl.h);
    wallTile(s);
    add(s);
  }
  if (!P.surfaces.length) add(newSurface("wall"));
  try {
    arrangeFloors(P);
  } catch (e) {}
  P.surfaces.forEach((s) => autoLayout(s));
  resetUndo();
  S.tab = 0;
  S.nh = null;
  saveSoon();
  showHome(false);
  toast(t("npDone") + " — " + t("nhCheck"), false);
}
// kitchen walls by cabinets (shared with the kitchen template)
function buildKitchen(K, tileFn) {
  const runs = [["A", +K.ka || 120]];
  if (K.kl !== "I") runs.push(["B", +K.kb || 96]);
  if (K.kl === "U") runs.push(["C", +K.kc || 96]);
  const ch = +K.kcab || 18,
    hood = +K.khood || 30;
  runs.forEach(([nm, L]) => {
    const s = newSurface("wall");
    s.name = `${t("job_kitchen")}: ${t("k" + nm).replace(/\s*\(.*\)/, "")}`;
    s.nk = null;
    s.nn = 0;
    s.h = ch;
    if (tileFn) tileFn(s);
    const segs = [];
    if (nm === "A" && L >= 54) {
      const a = Math.round(((L - 30) / 2) * 8) / 8;
      segs.push(
        { k: "cab", len: a, h: ch },
        { k: "hood", len: 30, h: hood },
        { k: "cab", len: L - 30 - a, h: ch },
      );
    } else if (K.kwin === nm && L >= 48) {
      const a = Math.round(((L - 36) / 2) * 8) / 8;
      segs.push(
        { k: "cab", len: a, h: ch },
        { k: "window", len: 36, h: ch },
        { k: "cab", len: L - 36 - a, h: ch },
      );
    } else segs.push({ k: "cab", len: L, h: ch });
    s.bs = Object.assign(bsDefault(L), { segs: segs.map((q) => Object.assign({ sl: false, hR: q.h }, q)) });
    bsApply(s);
    if (K.kwin === nm && segs.length === 3 && segs[1].k === "window")
      s.openings.push({
        id: uid(),
        type: "window",
        shape: "rect",
        x: segs[0].len,
        y: 6,
        w: 36,
        h: ch + 12,
        trim: false,
      });
    P.surfaces.push(s);
  });
}
function homeAct(a, arg) {
  if (a === "home") return showHome(true);
  if (a === "homeOpen") {
    const p = DB.projects.find((x) => x.id === arg);
    if (!p) return;
    if (p !== P) {
      P = p;
      resetUndo();
      S.tab = 0;
      S.view = { zoom: 1, panX: 0, panY: 0 };
    }
    DB.cur = p.id;
    saveSoon();
    return showHome(false);
  }
  if (a === "homeMenu") return homeMenu(arg);
  if (a === "homeSave") {
    if (S.__hp) S.__hp.updated = Date.now();
    S.__hp = null;
    closeModal();
    saveSoon();
    return renderHome();
  }
  if (a === "homeDel") {
    modal(
      `<h3>${t("del")}?</h3><p>${esc((DB.projects.find((x) => x.id === arg) || {}).name || "")}</p><div class="btns"><button class="btn d" data-act="homeDelGo:${arg}">${t("del")}</button><button class="btn" data-act="closeModal">${t("cancel")}</button></div>`,
    );
    return;
  }
  if (a === "homeDelGo") {
    DB.projects = DB.projects.filter((x) => x.id !== arg);
    markDeleted(arg);
    if (!DB.projects.length) DB.projects.push(newProject(false));
    if (!DB.projects.includes(P)) {
      P = DB.projects[0];
      resetUndo();
      S.tab = 0;
    }
    closeModal();
    saveSoon();
    renderHome();
    return toast(t("hDeleted"), false);
  }
  if (a === "homeTheme") {
    THEME = THEME === "dark" ? "light" : "dark";
    DB.theme = THEME;
    applyTheme();
    saveSoon();
    return renderHome();
  }
  if (a === "homeImport") return bkOpenFile();
  if (a === "nhStart") {
    S.nh = nhDefaults();
    return renderHome();
  }
  const N = S.nh;
  if (!N) return;
  if (a === "nhCancel") {
    S.nh = null;
    return renderHome();
  }
  if (a === "nhBack") {
    if (N.step <= 1) S.nh = null;
    else N.step--;
    return renderHome();
  }
  if (a === "nhNext") {
    if (nhSteps(N)[N.step - 1] === "jobs" && !JOBS.some((j) => N.jobs[j])) return;
    N.step++;
    homeEl().scrollTop = 0;
    return renderHome();
  }
  if (a === "nhJob") {
    N.jobs[arg] = !N.jobs[arg];
    return renderHome();
  }
  if (a === "nhCreate") return nhCreate();
}

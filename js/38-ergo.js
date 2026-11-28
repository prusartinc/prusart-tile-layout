"use strict";
/* ================= ergonomics =================
   1) Site bar: in "on site" mode a fixed bottom bar — previous / next surface, the cut list with
      its progress, the layout line, exit. Settings stay hidden.
   2) Section tabs: the side panel's many sections are grouped into a few tabs
      (Tile · Cut-outs · Edges · Pan · More); a tab opens its sections and closes the rest.
   3) New project wizard: room → shower / tub → pan system → tile → tile height → build.
   4) Typing: bigger fields, and a "Done ✓" bar above the phone keyboard. */
const ERT = {
  ru: {
    prev: "◀",
    next: "▶",
    cut: "✂ Резка",
    line: "⊹ Линия",
    exit: "Выйти",
    g_tile: "Плитка",
    g_cuts: "Вырезы",
    g_edges: "Края",
    g_pan: "Поддон",
    g_more: "Ещё",
    done: "Готово ✓",
    wz: "Новый проект",
    step: "Шаг",
    of: "из",
    back: "← Назад",
    nextB: "Дальше →",
    build: "Создать проект ✓",
    q1: "Что за комната?",
    r_walkin: "Ванная с душем (поддон)",
    r_tub: "Ванная с ванной",
    r_blank: "Нарисовать свой план",
    q2: "Размер комнаты",
    rw: "Ширина (стена с дверью)",
    rl: "Длина",
    rh: "Высота потолка",
    q3s: "Душ у дальней стены",
    q3t: "Ванна у дальней стены",
    sw: "Ширина",
    sd: "Глубина",
    sys: "Поддон",
    cl: "Без бордюра (curbless)",
    q4: "Плитка",
    tf: "Пол",
    tw: "Стены",
    tp: "Поддон",
    q5: "Высота плитки на стенах душа / над ванной",
    toCeil: "до потолка",
    name: "Название проекта",
    client: "Клиент",
  },
  en: {
    prev: "◀",
    next: "▶",
    cut: "✂ Cuts",
    line: "⊹ Line",
    exit: "Exit",
    g_tile: "Tile",
    g_cuts: "Cut-outs",
    g_edges: "Edges",
    g_pan: "Pan",
    g_more: "More",
    done: "Done ✓",
    wz: "New project",
    step: "Step",
    of: "of",
    back: "← Back",
    nextB: "Next →",
    build: "Create the project ✓",
    q1: "What room is it?",
    r_walkin: "Bathroom with a shower pan",
    r_tub: "Bathroom with a tub",
    r_blank: "Draw your own plan",
    q2: "Room size",
    rw: "Width (door wall)",
    rl: "Length",
    rh: "Ceiling height",
    q3s: "Shower on the far wall",
    q3t: "Tub on the far wall",
    sw: "Width",
    sd: "Depth",
    sys: "Pan",
    cl: "Curbless",
    q4: "Tile",
    tf: "Floor",
    tw: "Walls",
    tp: "Pan",
    q5: "Tile height on the shower / tub walls",
    toCeil: "to the ceiling",
    name: "Project name",
    client: "Client",
  },
};
const ert = (k) => (ERT[lang] || ERT.en)[k] || k;

/* ---------- 1) site bar ---------- */
function siteBar() {
  let el = $("#sitebar");
  if (!S.site || S.home || S.plan || S.client) {
    if (el) el.remove();
    document.body.classList.remove("sitebar");
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "sitebar";
    document.body.appendChild(el);
  }
  document.body.classList.add("sitebar");
  const s = !isMulti() && cur(),
    i = P.surfaces.indexOf(s),
    n = P.surfaces.length;
  let prog = "";
  if (s && R && R.all) {
    const T = R.T,
      cuts = R.all.filter((p) => !p.full),
      done = cuts.filter((p) => s.cutDone && s.cutDone[decoKey(p, T)]).length;
    prog = ` ${done}/${cuts.length}`;
  }
  el.innerHTML = `<button data-act="sitePrev" aria-label="prev" ${i <= 0 ? "disabled" : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><div class="sbn">${esc(s ? s.name : "")}<small>${i + 1}/${n}</small></div><button data-act="siteNext" aria-label="next" ${i >= n - 1 ? "disabled" : ""}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button><button data-act="cutSheet" title="${ert("cut")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 7.5L20 18M8.5 16.5L20 6"/></svg><b>${prog}</b></button><button data-act="glToggle" class="${DB.glOff ? "" : "on"}" title="${ert("line")}" aria-label="${ert("line")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" aria-hidden="true"><path d="M12 2v20M2 12h20"/></svg></button>`;
}
function siteStep(d) {
  const i = Math.max(0, Math.min(P.surfaces.length - 1, (+S.tab || 0) + d));
  S.tab = i;
  renderAll();
}

/* ---------- 2) grouped section tabs ---------- */
const SEC_GROUPS = [
  ["tile", ["tile", "layout"]],
  ["cuts", ["open", "bs"]],
  ["edges", ["edges", "trans"]],
  ["pan", ["pan"]],
];
function secGroupOf(id) {
  const g = SEC_GROUPS.find((x) => x[1].includes(id));
  return g ? g[0] : "more";
}
{
  const sc = secChips;
  secChips = function () {
    sc.apply(this, arguments);
    const nav = document.querySelector("#panel .secnav");
    if (!nav) return;
    const ds = [...document.querySelectorAll("#panel details[data-sec]")],
      have = new Set(ds.map((d) => secGroupOf(d.dataset.sec))),
      openG = new Set(
        ds.filter((d) => d.open).map((d) => secGroupOf(d.dataset.sec)),
      ),
      s = !isMulti() && cur(),
      key = s ? secGroupOf(secKey(s)) : null,
      order = ["tile", "cuts", "edges", "pan", "more"].filter((g) =>
        have.has(g),
      );
    if (key && order.includes(key))
      (order.splice(order.indexOf(key), 1), order.unshift(key));
    nav.classList.add("grp");
    nav.innerHTML = order
      .map(
        (g) =>
          `<button data-act="secGrp:${g}" class="${openG.has(g) ? "on" : ""}">${ert("g_" + g)}</button>`,
      )
      .join("");
  };
}
function secGrp(g) {
  const ds = [...document.querySelectorAll("#panel details[data-sec]")];
  let first = null;
  ds.forEach((d) => {
    const on = secGroupOf(d.dataset.sec) === g;
    d.open = on;
    if (on) {
      S.open.add(d.dataset.sec);
      first = first || d;
    } else S.open.delete(d.dataset.sec);
  });
  document
    .querySelectorAll(".secnav button")
    .forEach((b) => b.classList.toggle("on", b.dataset.act === "secGrp:" + g));
  if (first) {
    const y =
      first.getBoundingClientRect().top +
      window.scrollY -
      ($("#vw").getBoundingClientRect().height + 56);
    if (document.body.classList.contains("pin"))
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    else first.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* ---------- 3) new project wizard ---------- */
function wzOpen() {
  S.wz = S.wz || {
    step: 1,
    room: "walkin",
    W: 60,
    L: 96,
    H: 96,
    sw: 60,
    sd: 36,
    sys: "hbclassic",
    cl: false,
    tf: [24, 12],
    tw: [24, 12],
    tp: [2, 2],
    th: 84,
    name: "",
    client: "",
  };
  wzRender();
}
function wzRender() {
  const z = S.wz,
    N = z.room === "blank" ? 1 : 5,
    inp = (k, label) =>
      `<label class="f"><span>${label}</span><input data-wz="${k}" data-t="len" value="${fmtIn(z[k])}" autocomplete="off" inputmode="decimal"></label>`,
    pair = (k, label) =>
      `<label class="f"><span>${label}</span><div class="wzpair"><input data-wz="${k}.0" value="${fmtIn(z[k][0])}" inputmode="decimal"> × <input data-wz="${k}.1" value="${fmtIn(z[k][1])}" inputmode="decimal"></div><div class="wzpre">${[
        [24, 12],
        [24, 24],
        [12, 24],
        [3, 12],
        [2, 2],
        [12, 12],
      ]
        .map(
          (q) =>
            `<button class="btn sm" data-act="wzTile:${k}:${q[0]}:${q[1]}">${q[0]}×${q[1]}</button>`,
        )
        .join("")}</div></label>`;
  const Q = (k) => `<h2 class="wzq">${ert(k)}</h2>`,
    WI = (d) => `<svg viewBox="0 0 54 44" aria-hidden="true">${d}</svg>`,
    RIC = {
      walkin:
        '<rect x="2" y="2" width="50" height="40" fill="var(--hl)" stroke="currentColor" stroke-width="2"/><rect x="2" y="36" width="50" height="6" fill="#a8a390"/><circle cx="27" cy="20" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/>',
      tub: '<rect x="2" y="10" width="50" height="26" rx="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 36v6M46 36v6" stroke="currentColor" stroke-width="2"/>',
      blank:
        '<path d="M4 40V6h24v14h22v20z" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3"/><path d="M34 30l12-12 4 4-12 12h-4z" fill="none" stroke="currentColor" stroke-width="2"/>',
    };
  let h = `<div class="wz"><div class="wztop"><span>${ert("wz")}</span><b>${ert("step")} ${z.step} ${ert("of")} ${N}</b></div><div class="wzseg">${Array.from({ length: N }, (_, i) => `<i class="${i < z.step ? "on" : ""}"></i>`).join("")}</div>`;
  if (z.step === 1) {
    h += `${Q("q1")}<div class="wzpick">${["walkin", "tub", "blank"]
      .map(
        (r) =>
          `<button class="wzcard ${z.room === r ? "on" : ""}" data-act="wzRoom:${r}">${WI(RIC[r])}<b>${ert("r_" + r)}</b></button>`,
      )
      .join(
        "",
      )}</div><div class="grid"><label class="f"><span>${ert("name")}</span><input data-wz="name" value="${esc(z.name)}"></label><label class="f"><span>${ert("client")}</span><input data-wz="client" value="${esc(z.client)}"></label></div>`;
  }
  if (z.step === 2)
    h += `${Q("q2")}<div class="grid">${inp("W", ert("rw"))}${inp("L", ert("rl"))}${inp("H", ert("rh"))}<label class="f w2"><span>${mt("room")}</span><select data-wz="meas">${MEAS_K.map((o) => `<option value="${o}" ${(z.meas || "frame") === o ? "selected" : ""}>${esc(mt("m_" + o))}</option>`).join("")}</select></label></div>`;
  if (z.step === 3) {
    h += `${Q(z.room === "tub" ? "q3t" : "q3s")}<div class="grid">${inp("sw", ert("sw"))}${inp("sd", ert("sd"))}`;
    if (z.room === "walkin")
      h += `<label class="f w2"><span>${ert("sys")}</span><select data-wz="sys">${Object.keys(
        PAN_SYS,
      )
        .map(
          (k) =>
            `<option value="${k}" ${z.sys === k ? "selected" : ""}>${esc(sht("ps_" + k) || k)}</option>`,
        )
        .join(
          "",
        )}</select></label><label class="chk w2"><input type="checkbox" data-wz="cl" ${z.cl ? "checked" : ""}> ${ert("cl")}</label>`;
    h += `</div>`;
  }
  if (z.step === 4)
    h += `${Q("q4")}${pair("tf", ert("tf"))}${pair("tw", ert("tw"))}${z.room === "walkin" ? pair("tp", ert("tp")) : ""}`;
  if (z.step === 5)
    h += `${Q("q5")}<div class="grid">${inp("th", "″")}<button class="btn" data-act="wzCeil">${ert("toCeil")} (${fmtIn(z.H)}″)</button></div>`;
  h += `<div class="btns wznav">${z.step > 1 ? `<button class="btn" data-act="wzBack">${ert("back")}</button>` : `<button class="btn" data-act="closeModal">${t("cancel")}</button>`}${
    z.step < N
      ? `<button class="btn p" data-act="wzNext">${ert("nextB")}</button>`
      : `<button class="btn p" data-act="wzBuild">${ert("build")}</button>`
  }</div></div>`;
  modal(h);
}
document.addEventListener("change", (e) => {
  const el = e.target;
  if (!el.dataset || el.dataset.wz == null || !S.wz) return;
  const [k, j] = el.dataset.wz.split("."),
    z = S.wz;
  if (k === "name" || k === "client" || k === "sys" || k === "meas")
    z[k] = el.value;
  else if (k === "cl") z.cl = el.checked;
  else {
    const v = parseLen(el.value);
    if (!isFinite(v) || v <= 0) return el.classList.add("bad");
    el.classList.remove("bad");
    if (j != null) z[k][+j] = v;
    else z[k] = v;
  }
});
function wzAct(a, arg) {
  const z = S.wz;
  if (!z) return;
  if (a === "wzRoom") {
    // own shape: straight to the plan editor, nothing else to ask
    if (arg === "blank") {
      closeModal();
      S.wz = null;
      return homeAct("homeNewPlan");
    }
    z.room = arg;
    if (arg === "tub") {
      z.sd = 30;
      z.sw = z.W;
    }
  }
  if (a === "wzNext") z.step++;
  if (a === "wzBack") z.step--;
  if (a === "wzCeil") z.th = z.H;
  if (a === "wzTile") {
    const [k, w, h] = arg.split(":");
    z[k] = [+w, +h];
  }
  if (a === "wzBuild") return wzBuild();
  wzRender();
}
function wzBuild() {
  const z = S.wz;
  S.wz = null;
  closeModal();
  homeAct("homeNewPlan"); // a fresh project that starts from the plan (opens the plan page)
  if (z.name) P.name = z.name;
  if (z.client) P.client = z.client;
  if (z.room === "blank") return;
  const pl = P.plan,
    N = planNew,
    W = Math.max(30, z.W),
    L = Math.max(30, z.L),
    sw = Math.min(W, z.sw),
    sd = Math.min(L - 30, z.sd);
  pl.items = [];
  pl.room = { shape: "walk", segs: [], a0: 0 };
  ptsToWalk(pl.room, rectPoly(0, 0, W, L));
  pl.walls = pl.room.segs.map(() => ({ th: 4.5, tile: false, tileH: null }));
  pl.H = z.H;
  pl.meas = z.meas || "frame";
  // walls: 0 door wall, 1 right, 2 far (wet area), 3 left
  if (z.room === "walkin") {
    const sh = N("shower", 2, W - sw / 2, {
      w: sw,
      dp: sd,
      tzh: z.th,
      cl: z.cl,
    });
    pl.items.push(
      sh,
      N("valve", 3, sd / 2, { z: 44 }),
      N("head", 3, sd / 2, { z: 80 }),
      N("niche", 2, W - sw / 2, { z: 48, w: 12, h: 24 }),
    );
    const g = N("glass", null, 0, {
      x: sw / 2,
      y: L - sd,
      w: sw,
      ang: 180,
      door: "a",
      dw: 24,
    });
    pl.items.push(g);
    planGlassToPan(g, sh);
  } else {
    pl.items.push(
      N("tub", 2, W - sw / 2, { w: sw, dp: sd, tzh: z.th }),
      N("valve", 3, sd / 2, { z: 30 }),
      N("head", 3, sd / 2, { z: 80 }),
      N("niche", 2, W - sw / 2, { z: 48, w: 12, h: 24 }),
    );
  }
  const vw = Math.max(18, Math.min(48, L - sd - 32)),
    vc = L - vw / 2;
  pl.items.push(
    N("toilet", 3, sd + 16, {}),
    N("vanity", 3, vc, { w: vw }),
    N("door", 0, Math.min(W - 18, 42), { w: 30, hinge: "b" }),
    N("fan", null, 0, { x: W / 2, y: L / 2 }),
  );
  planEnsure();
  planBuild();
  // tile sizes and the pan system on the surfaces the plan made
  P.surfaces.forEach((s) => {
    const q = s.type === "floor" ? z.tf : s.type === "pan" ? z.tp : z.tw;
    s.tile.w = q[0];
    s.tile.h = q[1];
    if (s.type === "pan" && z.room === "walkin") {
      s.psys = z.sys;
      panNorm(s);
    }
    try {
      autoLayout(s);
    } catch (e) {}
  });
  P.plan.bh = planHash(P.plan);
  saveSoon();
  renderPlan();
}

/* ---------- 4) "Done" above the keyboard ---------- */
{
  let bar = null;
  const show = (on) => {
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "kbdone";
      bar.innerHTML = `<button type="button">${ert("done")}</button>`;
      bar.querySelector("button").addEventListener("pointerdown", (e) => {
        e.preventDefault();
        const a = document.activeElement;
        if (a && a.blur) a.blur();
        show(false);
      });
      document.body.appendChild(bar);
    }
    bar.querySelector("button").textContent = ert("done");
    bar.want = on;
    place();
  };
  const place = () => {
    if (!bar) return;
    const vv = window.visualViewport,
      off = vv ? window.innerHeight - (vv.height + vv.offsetTop) : 0;
    // only while the phone's keyboard is really up (it shrinks the visual viewport)
    bar.classList.toggle("on", !!bar.want && off > 120);
    bar.style.bottom = Math.max(0, off) + "px";
  };
  document.addEventListener("focusin", (e) => {
    const el = e.target;
    const typing =
      (el.tagName === "INPUT" &&
        !["checkbox", "radio", "file", "button"].includes(el.type)) ||
      el.tagName === "TEXTAREA";
    // the app's own keypad has its own ✓
    if (
      typing &&
      !(DB.kp && el.dataset && el.dataset.t && /len/.test(el.dataset.t))
    )
      show(true);
  });
  document.addEventListener("focusout", () =>
    setTimeout(() => {
      const a = document.activeElement;
      if (!a || !/INPUT|TEXTAREA/.test(a.tagName)) show(false);
    }, 60),
  );
  if (window.visualViewport) {
    visualViewport.addEventListener("resize", place);
    visualViewport.addEventListener("scroll", place);
  }
}

/* hooks */
{
  const ra = renderAll;
  renderAll = function () {
    const r = ra.apply(this, arguments);
    try {
      siteBar();
    } catch (e) {}
    return r;
  };
}

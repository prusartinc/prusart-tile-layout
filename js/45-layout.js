"use strict";
/* ================= layout screen, phones: less on screen =================
   Header: project name, undo / redo, one "Share" button (client view, PDF,
   picture, client link, language). One row of tools over the drawing; the
   surface actions (size, tile, clear, delete) move to the "More" menu.
   Surfaces are small picture tabs. Desktop keeps the full layout. */

const LYT = {
  ru: {
    share: "Поделиться",
    client: "Показать клиенту",
    clientX: "Выйти из показа клиенту",
    pdf: "PDF",
    pdfD: "для клиента, GC, лист резки",
    img: "Картинка",
    imgD: "сохранить чертёж как изображение",
    link: "Ссылка клиенту",
    linkD: "открыть у клиента на телефоне",
    lang: "Язык: English",
    thisS: "Эта поверхность",
    allW: "Все стены",
    allF: "Весь пол",
    add: "Добавить",
  },
  en: {
    share: "Share",
    client: "Show the client",
    clientX: "Leave client view",
    pdf: "PDF",
    pdfD: "for the client, GC, cut sheet",
    img: "Picture",
    imgD: "save the drawing as an image",
    link: "Client link",
    linkD: "opens on the client's phone",
    lang: "Язык: русский",
    thisS: "This surface",
    allW: "All walls",
    allF: "Whole floor",
    add: "Add",
  },
};
const lyt = (k) => (LYT[lang === "ru" ? "ru" : "en"] || LYT.en)[k];
const lyIco = (d) =>
  `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
const LY_I = {
  undo: "M9 14L4 9l5-5 M4 9h10a6 6 0 0 1 0 12h-3",
  redo: "M15 14l5-5-5-5 M20 9H10a6 6 0 0 0 0 12h3",
  share: "M12 3v12 M7 8l5-5 5 5 M5 13v7h14v-7",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  file: "M6 3h9l4 4v14H6z M14 3v5h5 M9 13h6 M9 17h6",
  img: "M3 5h18v14H3z M3 16l5-5 4 4 3-3 6 6 M15.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  globe:
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z",
  plus: "M12 5v14 M5 12h14",
};

/* ---------- header ---------- */
function lyHeader() {
  const h = $("header");
  if (!h) return;
  if (!$("#bUndo")) {
    const img = $("#bImg");
    img.insertAdjacentHTML(
      "beforebegin",
      `<button data-act="undo" id="bUndo" class="hico"></button><button data-act="redo" id="bRedo" class="hico"></button>`,
    );
  }
  $("#bUndo").innerHTML = lyIco(LY_I.undo);
  $("#bUndo").setAttribute("aria-label", t("undoW"));
  $("#bRedo").innerHTML = lyIco(LY_I.redo);
  $("#bRedo").setAttribute("aria-label", "redo");
  // phones: under the project name, the surface you are on (tabs show short names)
  const sc = typeof S.tab === "number" ? P.surfaces[S.tab] : null;
  if (narrowW() && sc && !S.home) $("#hS").textContent = sc.name;
  const b = $("#bImg");
  if (narrowW() && !S.client) {
    b.dataset.act = "shareMenu";
    b.className = "acc shareb";
    b.innerHTML = `${lyIco(LY_I.share)}<span>${lyt("share")}</span>`;
    b.title = lyt("share");
  } else {
    b.dataset.act = "image";
    b.className = "";
  }
}
{
  const rh = renderHeader;
  renderHeader = function () {
    rh.apply(this, arguments);
    try {
      lyHeader();
    } catch (e) {}
  };
}
function shareMenu() {
  const R0 = (act, ic, label, sub, cls) =>
    `<button class="lprow ${cls || ""}" data-act="${act}">${lyIco(ic)}<span><b>${label}</b>${sub ? `<small>${sub}</small>` : ""}</span></button>`;
  modal(
    `<h3>${lyIco(LY_I.share)} ${lyt("share")}</h3><div class="lprows">${
      R0(
        "client",
        LY_I.eye,
        S.client ? lyt("clientX") : lyt("client"),
        "",
        "p",
      ) +
      R0("nav:pdf", LY_I.file, lyt("pdf"), lyt("pdfD")) +
      R0("image", LY_I.img, lyt("img"), lyt("imgD")) +
      R0("shareLink", LY_I.link, lyt("link"), lyt("linkD")) +
      R0("lang", LY_I.globe, lyt("lang"), "")
    }</div>`,
  );
}
{
  const a0 = act;
  act = function (a) {
    if (a === "shareMenu") return shareMenu();
    if (
      a === "client" ||
      a === "image" ||
      a === "shareLink" ||
      a === "lang" ||
      a === "nav"
    )
      if (!$("#modal").hidden) closeModal();
    return a0.apply(this, arguments);
  };
}

/* ---------- More menu: the surface actions on top ---------- */
{
  const mm = moreMenu;
  moreMenu = function () {
    mm.apply(this, arguments);
    const s = cur();
    if (!narrowW() || !s || isMulti() || !canEdit()) return;
    const B = (a, ic, l, cls) =>
      `<button class="mm ${cls || ""}" data-act="${a}"><span>${ic}</span>${l}</button>`;
    const g = $("#mbody .mmgrid");
    if (g)
      g.insertAdjacentHTML(
        "beforebegin",
        `<p class="hsec">${lyt("thisS")} · ${esc(s.name)}</p><div class="mmgrid mm4">${
          (s.shape === "rect" ? B("quickSize", "📐", t("qSize")) : "") +
          B("quickTile", "▦", t("qTile")) +
          B("clearSurf", "⌫", t("qClear")) +
          B("delSurfQ", "🗑", t("qDel"), "d")
        }</div><p class="hsec">${t("moreT")}</p>`,
      );
  };
}

/* ---------- surface tabs with small pictures ---------- */
const LY_TH = new Map();
function lyThumb(s) {
  const k = JSON.stringify([
    s.shape,
    s.w,
    s.h,
    s.segs,
    (s.openings || []).length,
  ]);
  let v = LY_TH.get(s);
  if (!v || v.k !== k) {
    v = { k, h: surfThumb(s) };
    LY_TH.set(s, v);
  }
  return v.h;
}
{
  const rt = renderTabs;
  renderTabs = function () {
    if (!narrowW() || S.client) return rt.apply(this, arguments);
    if (typeof S.tab === "number") S.lastTab = S.tab;
    const nw = P.surfaces.filter((s) => s.type === "wall").length,
      nf = P.surfaces.filter((s) => s.type !== "wall").length,
      T = (act, on, thumb, label, cls) =>
        `<button data-act="${act}" class="tt ${on ? "on" : ""} ${cls || ""}"><span class="tth">${thumb}</span><span class="ttl">${label}</span></button>`;
    let h = "";
    if (nw >= 2)
      h += T(
        "all",
        S.tab === "all",
        `<i class="tti">▥▥</i>`,
        lyt("allW"),
        "grp",
      );
    if (nf >= 2)
      h += T(
        "floorTab",
        S.tab === "floor",
        `<i class="tti">▦▦</i>`,
        lyt("allF"),
        "grp",
      );
    h += P.surfaces
      .map((s, i) =>
        T(
          "tab:" + i,
          S.tab === i,
          lyThumb(s),
          // "Shower pan · Wall 2" → "Wall 2": the picture tells the rest
          esc(String(s.name).split(" · ").pop()),
        ),
      )
      .join("");
    h += T("addMenu", false, lyIco(LY_I.plus), lyt("add"), "add");
    const el = $("#tabs");
    el.innerHTML = h;
    el.classList.add("ttabs");
    // keep the chosen surface in view
    const on = el.querySelector(".tt.on");
    if (on)
      requestAnimationFrame(() => {
        const r = on.getBoundingClientRect(),
          rr = el.getBoundingClientRect();
        if (r.left < rr.left || r.right > rr.right)
          el.scrollLeft += r.left - rr.left - (rr.width - r.width) / 2;
      });
  };
}

/* tools row on phones: "More" as a plain ⋯ so the row fits */
{
  const rt = renderTools;
  renderTools = function () {
    rt.apply(this, arguments);
    if (!narrowW()) return;
    const m = $('#tools [data-act="more"]');
    if (m) {
      m.textContent = "⋯";
      m.setAttribute("aria-label", t("moreB"));
      m.classList.add("ic");
    }
  };
}

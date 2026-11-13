"use strict";
/* ================= init ================= */
(function init() {
  const d = load();
  const nl = (navigator.language || "en").toLowerCase();
  const defL = /^(ru|uk|be)/.test(nl) ? "ru" : "en";
  if (d) {
    DB = d;
    lang = d.lang || defL;
  } else {
    lang = defL;
    DB = { v: 2, lang, projects: [], curId: null };
  }
  // a damaged project must never take the whole app down: set it aside and keep it in storage
  DB.projects = (Array.isArray(DB.projects) ? DB.projects : []).filter((p) => {
    try {
      migrate(p);
      return true;
    } catch (e) {
      (DB.broken = DB.broken || []).push(p);
      console.warn("project set aside", e);
      return false;
    }
  });
  if (!DB.projects.length) {
    const p = newProject(true);
    DB.projects.push(p);
  }
  P = DB.projects.find((p) => p.id === DB.curId) || DB.projects[0];
  THEME = DB.theme || "auto";
  applyTheme();
  document.documentElement.lang = lang;
  resetUndo();
  try {
    renderAll();
  } catch (e) {
    // the last opened project can't be drawn: set it aside and start from the sample
    console.warn(e);
    (DB.broken = DB.broken || []).push(P);
    DB.projects = DB.projects.filter((p) => p !== P);
    P = newProject(true);
    DB.projects.push(P);
    S.tab = 0;
    resetUndo();
    renderAll();
  }
  saveSoon();
  showHome(true); // start on the dashboard
})();

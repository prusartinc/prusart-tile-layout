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
  DB.projects.forEach(migrate);
  if (!DB.projects.length) {
    const p = newProject(true);
    DB.projects.push(p);
  }
  P = DB.projects.find((p) => p.id === DB.curId) || DB.projects[0];
  THEME = DB.theme || "auto";
  applyTheme();
  document.documentElement.lang = lang;
  resetUndo();
  renderAll();
  saveSoon();
})();

# PrusArt Tile Layout

Tile layout planner for walls, floors and shower pans: patterns, cuts, quantities, niches, Schluter, cutouts,
prep (underlayment / backer board) layout, DITRA-HEAT floor heating, transitions, PDF for client and crew.

Live app: https://prusartinc.github.io/prusart-tile-layout/

Install: open the link → iPhone Safari: Share → Add to Home Screen; Android Chrome: Install app;
desktop Chrome/Edge: install icon in the address bar. Projects are stored locally on each device (export/import via ☰).

## Code layout

No build step — plain HTML/CSS/JS served by GitHub Pages. Scripts are classic (not modules) and share globals;
they load in this order:

| File | What's inside |
|---|---|
| `index.html` | Page markup, header, stage, panel |
| `css/app.css` | Styles, light/dark theme variables |
| `js/01-i18n.js` | Russian / English strings, `t()` |
| `js/02-core.js` | Utils, polygon geometry, openings |
| `js/03-engine.js` | Tile patterns, cut pieces, surface geometry, wall/floor joint linking, auto layout |
| `js/04-state.js` | Project data, defaults, migration, save/undo |
| `js/05-draw.js` | SVG drawing of surfaces, prep sheets, labels, dimensions, label de-cluttering |
| `js/06-interact.js` | Drag, pinch, arrows, touch |
| `js/07-ui.js` | Tabs, toolbar, side panel sections, inputs, gallery, modals |
| `js/08-actions.js` | Button actions (`data-act`) |
| `js/09-materials.js` | Materials estimate, cut sheet |
| `js/10-pdf.js` | PDF and image export |
| `js/11-edit.js` | Editing dimensions on the drawing, draw-a-shape, help |
| `js/12-buildup.js` | Schluter profiles, underlayment library, build-up, transitions |
| `js/13-heating.js` | Floor heating plan |
| `js/15-niche.js` | Niche settings: prefab sizes, shelf, double, edges, separate tile, section drawing |
| `js/16-wizard.js` | Tile library, reset / new-surface wizard, undo toast |
| `js/17-ux.js` | Tools menu, surfaces list, tap-a-tile info, expandable stats, section chips, pinned drawing on phones, on-site mode, new-project presets |
| `js/18-texture.js` | Tile photo texture (camera / file / paste / link), cropped to the tile |
| `js/19-sync.js` | Daily local backups + backup file, sync between devices through a private GitHub Gist |
| `js/20-kitchen.js` | Kitchen backsplash by cabinets (segments, slope, gap, centering), floating shelves with bolt holes, mosaic inserts, mosaic from a sheet photo, outlet extender rings |
| `js/21-home.js` | Home dashboard (projects, search, tools) and the new-project interview (jobs → short questions → materials → create) |
| `js/00-store.js` | Storage: IndexedDB with an in-memory cache (sync `STORE.get/set`), moves old localStorage data over, falls back to localStorage |
| `js/22-plan.js` | Room plan: data model (`P.plan`), item kinds, wall geometry, tile zones, shower drain position |
| `js/23-nav.js` | Bottom tab bar, grouped surface tabs, settings drawer on phones, quick actions on a tapped tile (joint here / center / deco) |
| `js/24-keypad.js` | Inch keypad with fractions, voice input ("ninety six and three eighths"), typo check on lengths |
| `js/25-plan-view.js` | Plan page, top view and wall elevations, pointer (drag, pinch zoom, pan), plan inputs |
| `js/26-plan-act.js` | Plan actions, snapping, rotate/mirror the room, glass along the pan |
| `js/27-plan-build.js` | Plan → surfaces, code checks, room templates, client PDF sheets |
| `js/14-init.js` | Startup (loads last), opens the dashboard |
| `sw.js` | Offline cache (bump `CACHE` on each deploy) |
| `tools/bundle.py` | Makes one self-contained HTML file (for sharing as a single file) |

## Tests

`python3 tests/fuzz.py` (needs Playwright + Chromium) runs ~900 combinations — every surface type and shape × every
pattern, niches in every configuration, heating, tiny/degenerate sizes, huge mosaic areas — and reports any exception
or non-finite number. Run it before each release.

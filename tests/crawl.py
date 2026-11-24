# Clicks every visible [data-act] button on many screens; reports page errors,
# console errors and suspicious text (NaN / undefined / [object) in the DOM.
import json, sys
from playwright.sync_api import sync_playwright
URL='file:///home/claude/prusart-tile-layout/index.html'
SKIP={'homeImport','imp','import','share','syncLogin','syncPush','syncPull','bkFile','bkDl','exportJson','exp','photo','voice','kpVoice','pdf','pdfClient','pdfWork','cutSheet','plPdf','img','gallery'}
SETUPS={
 'home':"()=>{showHome(true)}",
 'layout_wall':"()=>{showHome(false);if(typeof navGo==='function')navGo('lay');S.tab=P.surfaces.findIndex(s=>s.type==='wall');if(S.tab<0)S.tab=0;renderAll()}",
 'layout_floor':"()=>{showHome(false);if(typeof navGo==='function')navGo('lay');S.tab=P.surfaces.findIndex(s=>s.type==='floor');renderAll()}",
 'layout_pan':"()=>{showHome(false);if(typeof navGo==='function')navGo('lay');S.tab=P.surfaces.findIndex(s=>s.type==='pan');['pan','tile','surf','open','grout'].forEach(k=>S.open.add(k));renderAll()}",
 'summary':"()=>{showHome(false);if(typeof navGo==='function')navGo('lay');S.tab=-1;renderAll()}",
 'plan_top':"()=>{showHome(false);act('plan');S.plan.sel=null;renderPlan()}",
 'plan_shower':"()=>{showHome(false);act('plan');S.plan.sel=P.plan.items.find(i=>i.k==='shower').id;renderPlan()}",
 'plan_vanity':"()=>{showHome(false);act('plan');S.plan.sel=P.plan.items.find(i=>i.k==='vanity').id;renderPlan()}",
 'plan_toilet':"()=>{showHome(false);act('plan');S.plan.sel=P.plan.items.find(i=>i.k==='toilet').id;renderPlan()}",
 'plan_door':"()=>{showHome(false);act('plan');S.plan.sel=P.plan.items.find(i=>i.k==='door').id;renderPlan()}",
 'plan_glass':"()=>{showHome(false);act('plan');const g=P.plan.items.find(i=>i.k==='glass');S.plan.sel=g&&g.id;renderPlan()}",
 'plan_meas':"()=>{showHome(false);P.plan.meas='frame';P.plan.walls[1].meas='tile';act('plan');S.plan.sel=null;S.plan.wsel=null;renderPlan()}",
 'plan_meas_wall':"()=>{showHome(false);P.plan.meas='dry';act('plan');S.plan.sel=null;S.plan.wsel=2;renderPlan()}",
 'plan_zf':"()=>{showHome(false);act('plan');planAct('plView','3');const g=P.surfaces.find(x=>/^z3/.test(x.fromPlan||''));planAct('plZf',g?g.fromPlan:'')}",
 'plan_elev':"()=>{showHome(false);act('plan');S.plan.view='w0';S.plan.sel=null;renderPlan()}",
 'plan_pony':"()=>{showHome(false);act('plan');planAct('plAdd','pony');const it=P.plan.items.find(i=>i.k==='pony');ponyNorm(it);it.pony.niche.on=true;it.pony.glass.on=true;S.plan.sel=it.id;renderPlan()}",
 'plan_bench':"()=>{showHome(false);act('plan');planAct('plAdd','bench');const it=P.plan.items.find(i=>i.k==='bench');const sh=P.plan.items.find(i=>i.k==='shower');if(sh){it.wall=sh.wall;it.c=+sh.c-+sh.w/2+18;}it.w=36;it.dp=15;S.plan.sel=it.id;renderPlan()}",
 'plan_window':"()=>{showHome(false);act('plan');planAct('plAdd','window');const it=P.plan.items.find(i=>i.k==='window');it.wall=0;P.plan.walls[0].tile=true;winNorm(it).on=true;S.plan.sel=it.id;renderPlan()}",
 'plan_frame':"()=>{showHome(false);act('plan');const n=P.plan.items.find(i=>i.k==='niche')||P.plan.items.find(i=>i.k==='shower');planAct('plView',String(n?n.wall:0));planAct('plFrame')}",
 'layout_pony':"()=>{showHome(false);act('plan');planAct('plAdd','pony');const it=P.plan.items.find(i=>i.k==='pony');ponyNorm(it).niche.on=true;planClose();navGo('lay');S.tab=P.surfaces.findIndex(s=>/^pony/.test(s.fromPlan||''));if(S.tab<0)S.tab=0;['tile','trim','open'].forEach(k=>S.open.add(k));renderAll()}",
 'layout_bench':"()=>{showHome(false);act('plan');planAct('plAdd','bench');const it=P.plan.items.find(i=>i.k==='bench');const sh=P.plan.items.find(i=>i.k==='shower');if(sh){it.wall=sh.wall;it.c=+sh.c-+sh.w/2+18;}planClose();navGo('lay');S.tab=P.surfaces.findIndex(s=>/^bench/.test(s.fromPlan||''));if(S.tab<0)S.tab=0;renderAll()}",
 'layout_window':"()=>{showHome(false);act('plan');planAct('plAdd','window');const it=P.plan.items.find(i=>i.k==='window');it.wall=0;P.plan.walls[0].tile=true;winNorm(it).on=true;planClose();navGo('lay');S.tab=P.surfaces.findIndex(s=>/^win/.test(s.fromPlan||''));if(S.tab<0)S.tab=0;renderAll()}",
 'site':"()=>{showHome(false);if(typeof navGo==='function')navGo('lay');S.site=true;S.tab=P.surfaces.findIndex(s=>s.type==='floor');renderAll()}",
 'wizard':"()=>{showHome(true);act('wzOpen')}",
}
def main(TPL,ONLY):
  out={}
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':393,'height':852},device_scale_factor=1,is_mobile=True,has_touch=True)
    pg=ctx.new_page()
    errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:200]))
    pg.on('console',lambda m:m.type=='error' and errs.append('CONSOLE '+m.text[:200]))
    pg.on('dialog',lambda d:d.accept())
    pg.on('download',lambda d:None)
    pg.goto(URL);pg.wait_for_timeout(1500)
    # build a rich project from the bath template once and keep it as the base
    pg.evaluate("()=>{lang='ru';DB.kp=false;S.pcol=false;showHome(false);delete P.plan;P.surfaces=[];planEnsure();planTemplate('"+TPL+"');planBuild();window.__base=JSON.stringify(P);}")
    pg.evaluate("()=>{window.open=()=>null;HTMLAnchorElement.prototype.click=function(){};HTMLInputElement.prototype.showPicker=function(){};}")
    reset="()=>{const id=P.id;const np=JSON.parse(window.__base);Object.keys(P).forEach(k=>delete P[k]);Object.assign(P,np);try{closeModal()}catch(e){};if(S.plan)try{planClose()}catch(e){};S.plan=null;S.sel=null;S.ptEdit=false;}"
    def fresh():
      pg.goto(URL);pg.wait_for_function('()=>typeof P!=="undefined"&&P&&typeof planTemplate==="function"');pg.wait_for_timeout(150)
      pg.evaluate("()=>{lang='ru';DB.kp=false;S.pcol=false;showHome(false);delete P.plan;P.surfaces=[];planEnsure();planTemplate('"+TPL+"');planBuild();window.open=()=>null;HTMLAnchorElement.prototype.click=function(){};}")
    for name,setup in SETUPS.items():
      if name!=ONLY: continue
      fresh(); errs.clear()
      try: pg.evaluate(setup); pg.wait_for_timeout(250)
      except Exception as e: out[name]={'setup_err':str(e)[:200]}; continue
      acts=pg.evaluate("()=>[...new Set([...document.querySelectorAll('[data-act]')].filter(e=>e.offsetParent!==null||getComputedStyle(e).position==='fixed').map(e=>e.dataset.act))]")
      res={'n':len(acts),'bad':{}}
      if errs: res['bad']['__setup']=list(errs)
      for a in acts:
        if a.split(':')[0] in SKIP: continue
        try:
          fresh(); errs.clear()
          pg.evaluate(setup); pg.wait_for_timeout(60)
          ok=pg.evaluate("a=>{const e=[...document.querySelectorAll('[data-act]')].find(x=>x.dataset.act===a);if(!e)return false;e.click();return true}",a)
          pg.wait_for_timeout(120)
          sus=pg.evaluate("()=>{const t=document.body.innerText;const m=t.match(/.{0,30}(NaN|undefined|\\[object|Infinity).{0,30}/g);const vals=[...document.querySelectorAll('input')].map(i=>i.value).filter(v=>/NaN|undefined|Infinity/.test(v));return (m||[]).slice(0,3).concat(vals.slice(0,3))}")
          svg=pg.evaluate("()=>{const s=[...document.querySelectorAll('svg')].map(x=>x.innerHTML).join('');const m=s.match(/(NaN|undefined|Infinity)/g);return m?m.length:0}")
          bad=list(errs)+(['TEXT '+x for x in sus])+(['SVG NaN x%d'%svg] if svg else [])
          if bad: res['bad'][a]=bad[:4]
        except Exception as e:
          res['bad'][a]=['EXC '+str(e)[:160]]
      out[name]=res
      print(TPL,name,res['n'],len(res['bad']),flush=True)
  json.dump(out,open('/tmp/audit/c_'+TPL+'_'+ONLY+'.json','w'),ensure_ascii=False,indent=1)
main(sys.argv[1],sys.argv[2])

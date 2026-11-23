# Level 2: buttons inside modals opened by a button, plus value fuzz of every input/select.
import json, sys
from playwright.sync_api import sync_playwright
URL='file:///home/claude/prusart-tile-layout/index.html'
TPL,ONLY=sys.argv[1],sys.argv[2]
exec(open('/tmp/audit/crawl.py').read().split('def main')[0].split('SETUPS=')[1].join(['SETUPS=','']) if False else '')
src=open('/tmp/audit/crawl.py').read()
SETUPS=eval(src.split('SETUPS=')[1].split('\ndef main')[0])
SKIP=eval(src.split('SKIP=')[1].split('\n')[0])
VALS=['0','-3','abc','10000','1/0','3 1/2',' ','']
SUS="()=>{const t=document.body.innerText;const m=t.match(/.{0,30}(NaN|undefined|\\[object|Infinity).{0,30}/g);const s=[...document.querySelectorAll('svg')].map(x=>x.innerHTML).join('');const n=(s.match(/(NaN|undefined)/g)||[]).length;return (m||[]).slice(0,3).concat(n?['SVG NaN x'+n]:[])}"
out={'modal':{}, 'inputs':{}}
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
  pg=b.new_page(viewport={'width':393,'height':852},is_mobile=True,has_touch=True)
  errs=[]
  pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)[:220]))
  pg.on('console',lambda m:m.type=='error' and errs.append('CONSOLE '+m.text[:200]))
  pg.on('dialog',lambda d:d.accept())
  def fresh():
    pg.goto(URL);pg.wait_for_function('()=>typeof P!=="undefined"&&P&&typeof planTemplate==="function"');pg.wait_for_timeout(150)
    pg.evaluate("()=>{lang='ru';DB.kp=false;S.pcol=false;showHome(false);delete P.plan;P.surfaces=[];planEnsure();planTemplate('"+TPL+"');planBuild();window.open=()=>null;HTMLAnchorElement.prototype.click=function(){};}")
    pg.evaluate(SETUPS[ONLY]); pg.wait_for_timeout(80)
  def click(a,scope='document'):
    return pg.evaluate("([a,sc])=>{const r=sc==='modal'?document.querySelector('#modal'):document;const e=[...r.querySelectorAll('[data-act]')].find(x=>x.dataset.act===a);if(!e)return false;e.click();return true}",[a,scope])
  modal_open="()=>{const m=document.querySelector('#modal');return !!m&&getComputedStyle(m).display!=='none'&&m.classList.contains('on')||(!!m&&m.offsetParent!==null)}"
  fresh()
  acts=pg.evaluate("()=>[...new Set([...document.querySelectorAll('[data-act]')].filter(e=>e.offsetParent!==null).map(e=>e.dataset.act))]")
  # level-2 modal buttons
  for a in acts:
    if a.split(':')[0] in SKIP: continue
    fresh(); click(a); pg.wait_for_timeout(120)
    if not pg.evaluate(modal_open): continue
    macts=pg.evaluate("()=>[...new Set([...document.querySelectorAll('#modal [data-act]')].map(e=>e.dataset.act))]")
    for m in macts:
      if m.split(':')[0] in SKIP: continue
      try:
        fresh(); errs.clear(); click(a); pg.wait_for_timeout(100); click(m,'modal'); pg.wait_for_timeout(150)
        bad=list(errs)+['TEXT '+x for x in pg.evaluate(SUS)]
        if bad: out['modal'][a+' > '+m]=bad[:4]
      except Exception as e: out['modal'][a+' > '+m]=['EXC '+str(e)[:150]]
  # input fuzz on the screen
  fresh()
  keys=pg.evaluate("()=>[...document.querySelectorAll('input,select')].filter(e=>e.offsetParent!==null&&e.type!=='file').map((e,i)=>{e.dataset.fz=i;return i})")
  for i in keys:
    for v in VALS:
      try:
        fresh(); errs.clear()
        pg.evaluate("()=>[...document.querySelectorAll('input,select')].filter(e=>e.offsetParent!==null&&e.type!=='file').forEach((e,i)=>e.dataset.fz=i)")
        info=pg.evaluate("""([i,v])=>{const e=document.querySelector('[data-fz="'+i+'"]');if(!e)return null;const id=e.dataset.k||e.dataset.pnv||e.dataset.plv||e.dataset.pldr||e.dataset.opw||e.name||e.id||e.tagName;
          if(e.tagName==='SELECT'){const o=e.options;e.value=o[(v.length)%o.length].value}else if(e.type==='checkbox'){e.checked=!e.checked}else e.value=v;
          e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return id}""",[i,v])
        pg.wait_for_timeout(90)
        if info is None: break
        bad=list(errs)+['TEXT '+x for x in pg.evaluate(SUS)]
        if bad: out['inputs'][str(info)+' = '+repr(v)]=bad[:4]
        if info and ('SELECT' in info or 'checkbox' in str(info)): pass
      except Exception as e: out['inputs'][str(i)+'='+v]=['EXC '+str(e)[:150]]
json.dump(out,open('/tmp/audit/d_'+TPL+'_'+ONLY+'.json','w'),ensure_ascii=False,indent=1)
print(TPL,ONLY,'modal bad',len(out['modal']),'input bad',len(out['inputs']),flush=True)

from playwright.sync_api import sync_playwright
import json,sys
JS = r"""
async (seed)=>{
  let r=seed; const R=()=>{r=(r*1103515245+12345)%2147483648; return r/2147483648;};
  const pick=a=>a[Math.floor(R()*a.length)];
  const bad=[]; const t0=performance.now(); let n=0;
  const kinds=Object.keys(PL_KINDS);
  for(let it=0; it<12; it++){
    try{
      delete P.plan; planEnsure(); const pl=P.plan;
      const shape=pick(['rect','L','odd','gap','tri']);
      if(shape==='rect') ptsToWalk(pl.room, rectPoly(0,0,40+R()*140,40+R()*140));
      else if(shape==='L') pl.room.segs=[{l:96,a:90},{l:42,a:90},{l:36,a:-90},{l:30,a:90},{l:60,a:90},{l:72,a:90}];
      else if(shape==='odd') pl.room.segs=[{l:100,a:80},{l:60,a:100},{l:90,a:85},{l:66,a:95}];
      else if(shape==='gap') pl.room.segs=[{l:96,a:90},{l:60,a:90},{l:93,a:90},{l:58,a:90}];
      else pl.room.segs=[{l:80,a:120},{l:80,a:120},{l:80,a:120}];
      pl.walls=[]; planEnsure();
      const nw=pl.room.segs.length;
      for(let j=0;j<12;j++){
        const k=pick(kinds), K=PL_KINDS[k], w=Math.floor(R()*nw);
        const W=planWall(w);
        const o=planNew(k,w,R()*W.L, K.floor?{x:R()*80,y:R()*60}:{});
        if(R()<0.3) o.w=R()*80; if(R()<0.2) o.dp=R()*40; if(R()<0.2) o.z=R()*90;
        if(K.tzh!=null){o.tz=R()<0.7;o.tzl=R()*20;o.tzr=R()*20;o.tzf=R()<0.2;o.tzs=R()<0.7;o.tzsf=R()<0.3;o.tzh=R()*100;}
        if(k==='shower'){o.drn=pick(['center','point','linear']);o.lside=pick(['back','left','right','front']);o.dl=R()*60;o.db=R()*40;o.llen=R()*80;}
        if(k==='door'){o.dtype=pick(['swing','pocket','slide','opening']);o.swing=pick(['in','out']);o.hinge=pick(['a','b']);}
        if(k==='glass'){o.door=pick(['none','a','b']);o.ang=R()*360;}
        if(k==='cab'){o.ctl=R()*3;o.ctr=R()*3;o.ctt=R()*2;}
        pl.items.push(o);
      }
      pl.walls.forEach(ws=>{ws.tile=R()<0.3; ws.tileH=R()<0.5?null:R()*120; ws.th=R()<0.2?0:2+R()*8;});
      S.plan={v:'top',sel:pick(pl.items).id,wsel:null};
      document.body.classList.add('planon'); renderPlan();
      const chk=(where)=>{const h=document.getElementById('plan').innerHTML; if(/NaN|undefined|Infinity/.test(h)) bad.push(where+': '+(h.match(/.{60}(NaN|undefined|Infinity).{30}/)||[''])[0]);};
      chk('top'+it);
      for(let i=0;i<nw;i++){S.plan.v=i; S.plan.noTiles=R()<0.5; renderPlan(); chk('wall'+i+'#'+it);}
      S.plan.sel=null; S.plan.v='top'; renderPlan(); chk('room'+it);
      S.plan.wsel=0; renderPlan(); chk('wsel'+it);
      planChecks();
      const res=planBuild();
      P.surfaces.forEach(s=>{const Rr=compute(s); if(!isFinite(Rr.area)) bad.push('area '+s.name+' #'+it);});
      for(let i=0;i<nw;i++){S.plan.v=i; renderPlan(); chk('wall-built'+i+'#'+it);}
      // delete a wall, rebuild
      if(nw>3 && R()<0.5){ planAct('plWdel', String(Math.floor(R()*nw))); planBuild(); renderPlan(); chk('afterdel'+it);}
      n++;
    }catch(e){ bad.push('EXC #'+it+': '+e.message+' '+(e.stack||'').split('\n')[1]); }
  }
  return {n, ms: Math.round(performance.now()-t0), bad: bad.slice(0,25), nbad: bad.length};
}
"""
with sync_playwright() as p:
    b=p.chromium.launch(args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':393,'height':852})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
    pg.goto(__import__('pathlib').Path(__file__).resolve().parent.parent.joinpath('index.html').as_uri());pg.wait_for_timeout(900)
    pg.evaluate("()=>showHome(false)")
    for seed in (1,7,42):
        res=pg.evaluate(JS, seed)
        print(seed, json.dumps(res, ensure_ascii=False)[:2500])
    print('console', errs[:8])

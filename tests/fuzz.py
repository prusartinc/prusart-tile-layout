from playwright.sync_api import sync_playwright
import json, sys, pathlib
URL = sys.argv[1] if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent.joinpath('index.html').as_uri()
with sync_playwright() as p:
    b=p.chromium.launch(args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':393,'height':852})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
    pg.goto(URL);pg.wait_for_timeout(900)
    out=pg.evaluate("""()=>{
      const bad=[];const chk=(tag,R)=>{if(!R){return;} for(const k of ['area','need','order','full','cuts']) if(!isFinite(R[k])) bad.push(tag+' '+k+'='+R[k]);
        (R.strips||[]).forEach(x=>{if(!isFinite(x.tiles)||!isFinite(x.area)) bad.push(tag+' strip '+x.label)});
        for(const k in R.nb) if(!isFinite(R.nb[k])) bad.push(tag+' nb '+k);
        for(const k in R.profs) if(!isFinite(R.profs[k])) bad.push(tag+' prof '+k);
        if(R.heat){ if(!isFinite(R.heat.sf)||!isFinite(R.heat.watts)) bad.push(tag+' heat'); }};
      const run=(tag,f)=>{try{f();}catch(e){bad.push(tag+' THROW '+e.message+' '+(e.stack||'').split('\\n')[1]);}};
      const pats=[{pattern:'grid'},{pattern:'offset',off:0.5},{pattern:'offset',off:0.333,offDir:'l'},{pattern:'voffset'},{pattern:'herring'},{pattern:'basket'},{pattern:'pinwheel',w:12,h:12,w2:6},{shape:'hex',w:6},{shape:'penny',w:0.75,sheet:{on:true,w:12,h:12}},{shape:'chevron',w:8.5,h:4.25},{pattern:'grid',ang:45},{pattern:'grid',checker:true},{pattern:'grid',w:2,h:2,sheet:{on:true,w:12,h:12}}];
      let n=0;
      for(const type of ['wall','floor','pan']) for(const shape of ['rect','L','walk']) for(const pt of pats){
        const s=newSurface(type);s.shape=shape;if(shape==='walk')s.segs=polyToSegs([[0,0],[80,0],[80,40],[50,40],[50,70],[0,70]]);
        Object.assign(s.tile,{shape:'rect',sheet:{on:false,w:12,h:12}},pt);
        s.openings.push({id:uid(),type:'niche',shape:'rect',x:10,y:20,w:14,h:20,d:3.5,trim:true});
        s.openings.push({id:uid(),type:type==='wall'?'outlet':'toilet',shape:type==='wall'?'rect':'circle',x:30,y:20,w:3,h:4,dia:5});
        s.openings.push({id:uid(),type:'duct',shape:'rect',x:5,y:5,w:10,h:4});
        if(type!=='wall'){s.heat.on=true;}
        P.surfaces.push(s);const tag=type+'/'+shape+'/'+JSON.stringify(pt);
        run(tag,()=>{autoLayout(s);const R=compute(s);chk(tag,R);});
        n++;P.surfaces.pop();
      }
      // niche combos
      const s=newSurface('wall');P.surfaces.push(s);
      const o={id:uid(),type:'niche',shape:'rect',x:18,y:42,w:24,h:12,d:3.5,trim:true};s.openings.push(o);
      for(const kind of ['custom','prefab']) for(const form of ['single','shelf','dblV','dblH']) for(const shelf of ['metal','tile2','miter','stone']) for(const edge of ['profile','miter','wall','ret']) for(const bm of ['wall','own']) for(const rm of ['wall','back','own']){
        nicheCfg(o,s);Object.assign(o.nk,{kind,form,shelf,edge,corner:'45'});o.nk.back.mode=bm;o.nk.ret.mode=rm;nicheCfg(o,s);nichePrefab(o);
        const tag='niche '+[kind,form,shelf,edge,bm,rm].join('/');
        run(tag,()=>{const R=compute(s);chk(tag,R);nicheSectionSVG(s,o);});n++;
      }
      // tiny / degenerate
      run('tiny',()=>{const t2=newSurface('wall');t2.w=2;t2.h=2;P.surfaces.push(t2);chk('tiny',compute(t2));P.surfaces.pop();});
      run('zero tile',()=>{const t2=newSurface('wall');t2.tile.w=0;P.surfaces.push(t2);compute(t2);P.surfaces.pop();});
      run('niche bigger than wall',()=>{const t2=newSurface('wall');t2.openings.push({id:uid(),type:'niche',shape:'rect',x:-5,y:-5,w:100,h:200,d:3.5,trim:true,nk:{form:'shelf',shelfY:500}});P.surfaces.push(t2);chk('nb',compute(t2));P.surfaces.pop();});
      run('niche zero',()=>{const t2=newSurface('wall');t2.openings.push({id:uid(),type:'niche',shape:'rect',x:5,y:5,w:0,h:0,d:0,trim:true});P.surfaces.push(t2);chk('nz',compute(t2));P.surfaces.pop();});
      run('heat tiny floor',()=>{const t2=newSurface('floor');t2.w=10;t2.h=10;t2.heat.on=true;P.surfaces.push(t2);chk('ht',compute(t2));P.surfaces.pop();});
      run('heat big 240',()=>{const t2=newSurface('floor');t2.w=300;t2.h=200;t2.heat.on=true;t2.heat.volt='240';P.surfaces.push(t2);const t0=performance.now();chk('hb',compute(t2));bad.push('INFO big heat ms '+Math.round(performance.now()-t0));P.surfaces.pop();});
      run('mosaic big',()=>{const t2=newSurface('floor');t2.w=200;t2.h=150;Object.assign(t2.tile,{w:1,h:1,sheet:{on:true,w:12,h:12}});P.surfaces.push(t2);const t0=performance.now();const R=compute(t2);bad.push('INFO mosaic ms '+Math.round(performance.now()-t0)+' err '+R.err);P.surfaces.pop();});
      P.surfaces.pop();
      return {n,bad:bad.slice(0,60),nb:bad.length};
    }""")
    print(json.dumps(out,indent=0)[:5000]);print('errs',errs[:10])

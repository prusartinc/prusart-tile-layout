from playwright.sync_api import sync_playwright
import pathlib
APP=pathlib.Path(__file__).resolve().parent.parent.joinpath('index.html').as_uri()
import json
with sync_playwright() as p:
    b=p.chromium.launch(args=['--no-sandbox'])
    ctx=b.new_context(); errs=[]
    pg=ctx.new_page(); pg.goto('file:///tmp/blank.html')
    d={"v":2,"lang":"ru","projects":[{"id":"old1","name":"OLD-LS","surfaces":[]}],"curId":"old1"}
    pg.evaluate("(d)=>localStorage.setItem('prusart-tile-layout-v1',JSON.stringify(d))", d)
    pg.goto(APP); pg.on('pageerror',lambda e:errs.append(str(e))); pg.wait_for_timeout(1500)
    print('migrated', pg.evaluate("()=>[STORE.usesIdb(), DB.projects.map(p=>p.name).join('|')]"))
    pg.evaluate("()=>{P.name='NEW-IDB';saveSoon()}"); pg.wait_for_timeout(800)
    pg.goto(APP); pg.wait_for_timeout(1500)
    print('reload', pg.evaluate("()=>DB.projects.map(p=>p.name).join('|')"), '| ls', pg.evaluate("()=>JSON.parse(localStorage.getItem('prusart-tile-layout-v1')).projects[0].name"))
    print(errs)

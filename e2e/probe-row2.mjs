import { chromium } from '@playwright/test'
const BASE='https://cms.typerefinery.localhost:8101'
const PAGE=`${BASE}/content/typerefinery-showcase/pages/os-triage/pages/incidents.html`
const b=await chromium.launch({headless:true})
const c=await b.newContext({ignoreHTTPSErrors:true,viewport:{width:1600,height:1000}})
const p=await c.newPage()
await p.goto(`${BASE}/`,{waitUntil:'domcontentloaded'})
const u=p.locator('[data-testid="login-form-username"]')
if(await u.isVisible({timeout:20000}).catch(()=>false)){await u.click();await u.pressSequentially('wsadmin',{delay:30});const w=p.locator('[data-testid="login-form-password"]');await w.click();await w.pressSequentially('wsadmin',{delay:30});await p.locator('#login-form button[type="submit"]').click();await p.waitForURL(x=>!/login\.html/.test(x.toString()),{timeout:60000})}
await p.goto(PAGE,{waitUntil:'domcontentloaded'});await p.waitForTimeout(15000)
const info=await p.locator('tbody tr').first().locator('button').evaluateAll(els=>els.map(e=>{
  let m={};try{m=JSON.parse(e.getAttribute('data-model')||'{}')}catch{}
  return {cls:e.className,inner:e.innerHTML.slice(0,120),modelKeys:Object.keys(m),label:m.label||m.text||m.title||m.name||'',action:m.action||m.actionType||'',path:(m.path||'').split('/').slice(-2).join('/')}
}))
console.log(JSON.stringify(info,null,1).slice(0,1800))
await b.close()

import { chromium } from '@playwright/test'
const BASE='https://cms.typerefinery.localhost:8101'
const OVERVIEW=`${BASE}/content/typerefinery-showcase/pages/os-triage/forms/overview-local.html`
const b=await chromium.launch({headless:true})
const c=await b.newContext({ignoreHTTPSErrors:true,viewport:{width:1600,height:1000}})
const p=await c.newPage()
await p.goto(`${BASE}/`,{waitUntil:'domcontentloaded'})
const u=p.locator('[data-testid="login-form-username"]')
if(await u.isVisible({timeout:20000}).catch(()=>false)){await u.click();await u.pressSequentially('wsadmin',{delay:30});const w=p.locator('[data-testid="login-form-password"]');await w.click();await w.pressSequentially('wsadmin',{delay:30});await p.locator('#login-form button[type="submit"]').click();await p.waitForURL(x=>!/login\.html/.test(x.toString()),{timeout:60000})}
await p.goto(OVERVIEW,{waitUntil:'domcontentloaded'});await p.waitForTimeout(15000)
const list=(label)=>{console.log(label); for(const f of p.frames()) console.log('   ', f.url().slice(-70))}
list('FRAMES BEFORE CLICK:')
const gf=p.frameLocator('iframe[src*="widgetdevoverview"]').first()
const node=gf.locator('svg image.node-image, svg image').first()
await node.waitFor({state:'visible',timeout:60000})
await node.click()
await p.waitForTimeout(12000)
list('FRAMES AFTER CLICK:')
for(const f of p.frames()){
  const n=await f.locator('input, select, textarea').count().catch(()=>0)
  if(n>0) console.log('   INPUTS', n, 'in', f.url().slice(-70))
}
await b.close()

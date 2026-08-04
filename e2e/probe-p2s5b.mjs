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
const gf=p.frameLocator('iframe[src*="widgetdevoverview"]').first()
await gf.locator('svg image').first().click()
// poll the form frame for inputs over 40s
for(let i=0;i<8;i++){
  await p.waitForTimeout(5000)
  const ff=p.frames().find(f=>/forms\//.test(f.url()) && !/default(\.html)?$/.test(f.url()) && !/overview-local/.test(f.url()))
  if(!ff){ console.log(`t+${(i+1)*5}s: no form frame yet`); continue }
  const inputs=await ff.locator('input, select, textarea').count().catch(e=>'ERR:'+e.message.slice(0,40))
  const filled=await ff.locator('input').evaluateAll(els=>els.filter(e=>e.value).length).catch(()=>-1)
  const bodyLen=await ff.locator('body').innerText().then(t=>t.length).catch(()=>-1)
  console.log(`t+${(i+1)*5}s: ${ff.url().slice(-46)} inputs=${inputs} filled=${filled} bodyTextLen=${bodyLen}`)
}
await b.close()

/** Does the Composer left-select 404 on an os-threat-typed node, as the Overview does? (0049) */
import { chromium } from '@playwright/test'
const BASE='https://cms.typerefinery.localhost:8101'
const COMPOSER=`${BASE}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`
const b=await chromium.launch({headless:true})
const c=await b.newContext({ignoreHTTPSErrors:true,viewport:{width:1600,height:1000}})
const p=await c.newPage()
await p.goto(`${BASE}/`,{waitUntil:'domcontentloaded'})
const u=p.locator('[data-testid="login-form-username"]')
if(await u.isVisible({timeout:20000}).catch(()=>false)){await u.click();await u.pressSequentially('wsadmin',{delay:30});const w=p.locator('[data-testid="login-form-password"]');await w.click();await w.pressSequentially('wsadmin',{delay:30});await p.locator('#login-form button[type="submit"]').click();await p.waitForURL(x=>!/login\.html/.test(x.toString()),{timeout:60000})}
await p.goto(COMPOSER,{waitUntil:'domcontentloaded'});await p.waitForTimeout(14000)
const wf=p.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()
const seen=new Set()
for(const pane of ['svg.promo_svg','svg.scratch_svg']){
  const icons=wf.locator(pane).locator('image')
  const n=Math.min(await icons.count(), 10)
  for(let i=0;i<n;i++){
    await icons.nth(i).click().catch(()=>{})
    await p.waitForTimeout(2500)
    const ff=p.frames().find(f=>/forms\//.test(f.url()) && !/default(\.html)?$/.test(f.url()) && !/composer-local/.test(f.url()))
    if(!ff) continue
    const url=ff.url()
    if(seen.has(url)) continue
    seen.add(url)
    const inputs=await ff.locator('input, select, textarea').count().catch(()=>-1)
    const fam=/os-threat-forms/.test(url)?'os-threat':(/stix-forms/.test(url)?'stix':'?')
    console.log(`${pane.padEnd(16)} [${fam.padEnd(9)}] inputs=${String(inputs).padEnd(4)} ${url.slice(-58)}`)
  }
}
await b.close()

/** P1-S2 — do rows live-update over TMS, without a reload, and with CURRENT data? */
import { chromium } from '@playwright/test'
const BASE='https://cms.typerefinery.localhost:8101'
const PAGE=`${BASE}/content/typerefinery-showcase/pages/os-triage/pages/incidents.html`
const b=await chromium.launch({headless:true})
const c=await b.newContext({ignoreHTTPSErrors:true,viewport:{width:1600,height:1000}})
const p=await c.newPage()
await p.goto(`${BASE}/`,{waitUntil:'domcontentloaded'})
const u=p.locator('[data-testid="login-form-username"]')
if(await u.isVisible({timeout:20000}).catch(()=>false)){await u.click();await u.pressSequentially('wsadmin',{delay:30});const w=p.locator('[data-testid="login-form-password"]');await w.click();await w.pressSequentially('wsadmin',{delay:30});await p.locator('#login-form button[type="submit"]').click();await p.waitForURL(x=>!/login\.html/.test(x.toString()),{timeout:60000})}
await p.goto(PAGE,{waitUntil:'domcontentloaded'})
await p.waitForLoadState('networkidle',{timeout:60000}).catch(()=>{})
await p.waitForTimeout(15000)
const rows=async()=>await p.locator('tbody tr').count()
console.log('rows on load:', await rows())
// Clear the rendered table so a TMS push is unambiguous, then trigger the flow.
await p.evaluate(()=>{ document.querySelectorAll('tbody tr').forEach(r=>r.remove()) })
console.log('rows after clearing DOM:', await rows())
console.log('triggering flow f210iy001bt51d ...')
await fetch('http://localhost:8111/fapi/streams_restart/f210iy001bt51d/').catch(()=>{})
for(let i=1;i<=8;i++){
  await p.waitForTimeout(5000)
  const n=await rows()
  console.log(`  t+${i*5}s rows=${n}`)
  if(n>0){ const txt=await p.locator('tbody tr').allInnerTexts(); console.log('  LIVE UPDATE — first row:', txt[0].replace(/\s+/g,' ').slice(0,70)); break }
}
await b.close()

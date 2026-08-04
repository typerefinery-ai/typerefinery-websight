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
const r=await p.evaluate(()=>({
  rows: document.querySelectorAll('tbody tr').length,
  searchboxes: document.querySelectorAll('input[type=search], .search input, .fixed-table-toolbar input').length,
  headers: [...document.querySelectorAll('thead th')].map(h=>h.innerText.trim()).filter(Boolean),
  actionBtns: document.querySelectorAll('tbody tr td button').length,
}))
console.log(JSON.stringify(r,null,1))
console.log('P1-S1 row claims: one row per incident / Name,Type,Description,ID,Action / search box / per-row action buttons')
await b.close()

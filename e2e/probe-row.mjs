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
console.log('tables:', await p.locator('table').count())
for(let i=0;i<await p.locator('table').count();i++){const bb=await p.locator('table').nth(i).boundingBox().catch(()=>null);const rows=await p.locator('table').nth(i).locator('tbody tr').count();console.log(` table[${i}] box=${bb?Math.round(bb.width)+'x'+Math.round(bb.height)+' y='+Math.round(bb.y):'null'} rows=${rows}`)}
console.log('table:has(tbody tr) box:', JSON.stringify(await p.locator('table:has(tbody tr)').first().boundingBox().catch(()=>null)))
const cell=p.locator('tbody tr').first().locator('td').last()
console.log('last cell html:', (await cell.innerHTML().catch(()=>'?')).slice(0,300))
console.log('buttons in row:', await p.locator('tbody tr').first().locator('button, a, [role=button]').count())
const names=await p.locator('tbody tr').first().locator('button, a, [role=button]').evaluateAll(els=>els.map(e=>({tag:e.tagName,txt:(e.textContent||'').trim().slice(0,20),cls:(e.className||'').toString().slice(0,40),title:e.getAttribute('title')||''})))
console.log(JSON.stringify(names,null,1).slice(0,700))
await b.close()

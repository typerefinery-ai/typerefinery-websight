import { chromium } from '@playwright/test'
const BASE='https://cms.typerefinery.localhost:8101'
const COMPOSER=`${BASE}/content/typerefinery-showcase/pages/os-triage/forms/composer-local.html`
const b=await chromium.launch({headless:true})
const c=await b.newContext({ignoreHTTPSErrors:true,viewport:{width:1600,height:1000}})
const p=await c.newPage()
await p.goto(`${BASE}/`,{waitUntil:'domcontentloaded'})
const u=p.locator('[data-testid="login-form-username"]')
if(await u.isVisible({timeout:20000}).catch(()=>false)){await u.click();await u.pressSequentially('wsadmin',{delay:30});const w=p.locator('[data-testid="login-form-password"]');await w.click();await w.pressSequentially('wsadmin',{delay:30});await p.locator('#login-form button[type="submit"]').click();await p.waitForURL(x=>!/login\.html/.test(x.toString()),{timeout:60000})}
await p.goto(COMPOSER,{waitUntil:'domcontentloaded'});await p.waitForTimeout(13000)
const wf=p.frameLocator('iframe[src*="widgetdevcomposer"], iframe[src*="4005"]').first()
await wf.locator('svg.promo_svg').locator('image').first().click(); await p.waitForTimeout(700)
const sc=wf.locator('svg.scratch_svg').locator('image').first()
await sc.click(); await p.waitForTimeout(700)
await sc.click({button:'right'}); await p.waitForTimeout(1500)
await wf.locator('text=/create sro/i').first().click(); await p.waitForTimeout(9000)
for(const f of p.frames()){
  if(!/modal-forms/.test(f.url())) continue
  console.log('MODAL FRAME:', f.url().slice(-60))
  const txt=(await f.locator('body').innerText().catch(()=>'')).replace(/\s+/g,' ')
  console.log('  text (300):', txt.slice(0,300))
  const vals=await f.locator('input').evaluateAll(els=>els.map(e=>({name:e.getAttribute('name'),value:e.value})).filter(x=>x.value))
  console.log('  input values:', JSON.stringify(vals).slice(0,300))
  console.log('  .choices__item count:', await f.locator('.choices__item').count().catch(()=>0))
  const items=await f.locator('.choices__item').allInnerTexts().catch(()=>[])
  console.log('  choices items:', items.map(s=>s.trim()).filter(Boolean).slice(0,8).join(' | '))
  const sel=await f.locator('select').evaluateAll(els=>els.map(e=>({name:e.getAttribute('name'),opts:[...e.options].map(o=>o.value).slice(0,6)})))
  console.log('  selects:', JSON.stringify(sel).slice(0,300))
}
await b.close()

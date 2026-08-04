/** Does "related-to" appear in the composer widget frame WITHOUT opening any menu? */
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
const n=await wf.getByText(/related-to/i).count()
const visible=await wf.getByText(/related-to/i).first().isVisible().catch(()=>false)
console.log('WITHOUT opening any menu:')
console.log('  related-to matches in composer widget frame:', n)
console.log('  first one visible:', visible)
console.log('  => P3-S6 assertion would', (n>0&&visible)?'PASS VACUOUSLY ❌':'correctly fail ✅')
await b.close()

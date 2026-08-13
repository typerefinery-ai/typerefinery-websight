import { chromium } from '@playwright/test'
import path from 'path'
const CMS='https://cms.typerefinery.localhost:8101'
const U=CMS+'/content/typerefinery-showcase/pages/os-triage/forms/stixorm-forms/stix-forms/sdo-forms/identity-forms/identity-create.html'
const b=await chromium.launch({channel:'chrome'})
const p=await (await b.newContext({ignoreHTTPSErrors:true,storageState:'e2e/.auth/cms.json',viewport:{width:1600,height:1000}})).newPage()
await p.goto(U,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(12000)
const r=await p.evaluate(()=>{
  const sels=[...document.querySelectorAll('select')]
  return {
    nativeSelects: sels.length,
    perSelect: sels.slice(0,4).map(s=>({name:s.name, options:s.options.length, hidden:!!s.closest('.choices')||getComputedStyle(s).display==='none'})),
    choicesWidgets: document.querySelectorAll('.choices').length,
    choicesItems: [...document.querySelectorAll('.choices')].slice(0,3).map(c=>c.querySelectorAll('.choices__item').length),
  }
})
console.log(JSON.stringify(r,null,1)); await b.close()

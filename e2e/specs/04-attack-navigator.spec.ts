import { expect } from '@playwright/test'
import { step, test } from '../runsheet'
import { SHOWCASE } from '../playwright.config'

/**
 * Act 4 — Attack Navigator. Runsheet Act 4 / docs/issues/0008.
 *
 * Nothing in this act has been built: there is no `*navigator*` content anywhere in
 * `typerefinery-websight`. The steps are declared anyway so the suite records the gap
 * on every run rather than silently omitting an act of the runsheet.
 */

const CANDIDATES = [
  `${SHOWCASE}/pages/attack-navigator.html`,
  `${SHOWCASE}/forms/attack-navigator.html`,
  `${SHOWCASE}/pages/navigator.html`,
]

test.describe('Act 4 — Attack Navigator', () => {
  step('P4-S1', async ({ page }) => {
    let found: string | null = null
    for (const path of CANDIDATES) {
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' }).catch(() => null)
      if (res && res.status() < 400) {
        found = path
        break
      }
    }
    expect(found, `an Attack Navigator page exists (tried ${CANDIDATES.join(', ')})`).not.toBeNull()
    await expect(page.locator('iframe').first()).toBeVisible({ timeout: 30_000 })
  })

  step('P4-S2', async ({ page }) => {
    expect(false, 'no Attack Navigator page to right-click a technique in').toBeTruthy()
  })

  step('P4-S3', async ({ page }) => {
    expect(false, 'blocked by P4-S1/P4-S2 — the send-to-incident API (#86) is unbuilt').toBeTruthy()
  })

  step('P4-S4', async ({ page }) => {
    expect(false, 'blocked by P4-S1/P4-S2').toBeTruthy()
  })

  step('P4-S5', async ({ page }) => {
    expect(false, 'blocked by P4-S1/P4-S2').toBeTruthy()
  })
})
